import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { requireAdmin } from '../../../lib/requireAdmin'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import { fetchOpenInvoices, fetchInvoice, fetchInvoicePdf, fetchArRefs, buildInvoice, postInvoice, nextDocNumber } from '../../../lib/qboAr'

// ── Live AR for one client: list, view, and email real invoices ──────────
//
//   GET  /api/qbo/ar?client=jkno                → open invoices, live from QBO
//   GET  /api/qbo/ar?client=jkno&action=pdf&id= → the invoice PDF, as QBO makes it
//   POST /api/qbo/ar { client, invoiceId, to }  → emails that PDF from SMTP_USER
//
// Read-only against QuickBooks — nothing here posts to the books. The one
// write is the email send, through whatever SMTP mailbox is configured
// (SMTP_HOST/USER/PASS — Zoho, Gmail, anything; falls back to the GMAIL_*
// pair send-receipt uses), so the message comes from our own address and
// replies land in our inbox.
// Admin-gated and fails closed, like every QBO endpoint.

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function handler(req, res) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  try {
    if (req.method === 'GET') {
      const client = clean(req.query.client)
      if (!client) return res.status(400).json({ error: 'Missing ?client= slug.' })
      const { env, token, realmId, connection } = await getLiveToken(client)

      if (req.query.action === 'pdf') {
        const id = String(req.query.id || '').replace(/[^0-9]/g, '')
        if (!id) return res.status(400).json({ error: 'Missing ?id= invoice id.' })
        const pdf = await fetchInvoicePdf(env, token, realmId, id)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`)
        return res.status(200).send(pdf)
      }

      if (req.query.action === 'refs') {
        const refs = await fetchArRefs(env, token, realmId)
        return res.status(200).json(refs)
      }

      const invoices = await fetchOpenInvoices(env, token, realmId)
      return res.status(200).json({
        company: connection.company_name,
        environment: connection.environment,
        invoices,
      })
    }

    // ── The one QBO write: create an invoice. Preview first (no write),
    // then confirm:true with the preview's requestId — Intuit dedupes on
    // requestid, so a retried confirm cannot create the invoice twice.
    if (req.method === 'POST' && req.body && req.body.action === 'create') {
      const { client: rawClient, invoice, requestId, confirm } = req.body
      const client = clean(rawClient)
      if (!client || !invoice) return res.status(400).json({ error: 'Missing client / invoice.' })

      const { env, token, realmId } = await getLiveToken(client)
      const refs = await fetchArRefs(env, token, realmId)
      // QBO with custom transaction numbers on does not auto-number API
      // invoices, so assign the next number ourselves. Recomputed on confirm
      // (not carried from the preview) so a number claimed in between never
      // collides.
      const docNumber = invoice.docNumber || await nextDocNumber(env, token, realmId)
      const built = buildInvoice({ ...invoice, docNumber }, refs)
      if (built.errors.length) return res.status(400).json({ error: built.errors.join(' · ') })

      if (!confirm) {
        return res.status(200).json({ preview: built.summary, payload: built.payload, requestId: crypto.randomUUID() })
      }
      if (!requestId) return res.status(400).json({ error: 'Confirm requires the requestId from the preview.' })

      const out = await postInvoice(env, token, realmId, built.payload, String(requestId))
      const created = out.Invoice || {}
      return res.status(200).json({
        ok: true,
        created: { id: created.Id, doc: created.DocNumber || docNumber, total: Number(created.TotalAmt || built.total) },
      })
    }

    if (req.method === 'POST') {
      const { client: rawClient, invoiceId, to } = req.body || {}
      const client = clean(rawClient)
      const id = String(invoiceId || '').replace(/[^0-9]/g, '')
      if (!client || !id) return res.status(400).json({ error: 'Missing client / invoiceId.' })
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
        return res.status(400).json({ error: 'A valid "to" email address is required.' })
      }

      // Any SMTP mailbox works — Zoho, Google Workspace, Outlook. Generic
      // SMTP_* vars win; the GMAIL_* pair (used by send-receipt) is the
      // fallback so a Gmail-configured site needs nothing new.
      const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER
      const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
      const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
      const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
      if (!SMTP_USER || !SMTP_PASS) {
        return res.status(503).json({ error: 'Email is not set up — set SMTP_USER / SMTP_PASS (and SMTP_HOST, e.g. smtp.zoho.com) in the environment.' })
      }

      const { env, token, realmId } = await getLiveToken(client)
      const inv = await fetchInvoice(env, token, realmId, id)
      const doc = (inv && inv.DocNumber) || id
      const balance = inv && inv.Balance != null ? Number(inv.Balance) : null
      const dueDate = (inv && inv.DueDate) || null
      const customer = (inv && inv.CustomerRef && inv.CustomerRef.name) || 'customer'
      const pdf = await fetchInvoicePdf(env, token, realmId, id)

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })

      const subject = `Invoice ${doc} from JK No Jokes`
      const bodyLines = [
        `Hi,`,
        ``,
        `Invoice ${doc}${balance != null ? ` for ${money(balance)}` : ''} is attached${dueDate ? `, due ${dueDate}` : ''}.`,
        ``,
        `Any questions, just reply to this email.`,
        ``,
        `JK No Jokes`,
      ]
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `JK No Jokes <${SMTP_USER}>`,
        replyTo: SMTP_USER,
        to: String(to),
        subject,
        text: bodyLines.join('\n'),
        html: bodyLines.map((l) => (l ? `<p style="margin:0 0 2px">${l}</p>` : '<br>')).join(''),
        attachments: [{ filename: `Invoice-${doc}.pdf`, content: pdf, contentType: 'application/pdf' }],
      })

      return res.status(200).json({ ok: true, sent: { to, subject, doc, customer, messageId: info.messageId } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const auth = e instanceof QboAuthError
    return res.status(auth ? 409 : 500).json({
      error: String(e.message || e),
      needsReconnect: auth ? !!e.needsReconnect : undefined,
    })
  }
}
