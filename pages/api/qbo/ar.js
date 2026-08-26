import nodemailer from 'nodemailer'
import { requireAdmin } from '../../../lib/requireAdmin'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import { fetchOpenInvoices, fetchInvoice, fetchInvoicePdf } from '../../../lib/qboAr'

// ── Live AR for one client: list, view, and email real invoices ──────────
//
//   GET  /api/qbo/ar?client=jkno                → open invoices, live from QBO
//   GET  /api/qbo/ar?client=jkno&action=pdf&id= → the invoice PDF, as QBO makes it
//   POST /api/qbo/ar { client, invoiceId, to }  → emails that PDF from GMAIL_USER
//
// Read-only against QuickBooks — nothing here posts to the books. The one
// write is the email send, which goes out through our own Gmail (the same
// GMAIL_USER / GMAIL_APP_PASSWORD transport send-receipt uses), so the
// message comes from our address and replies land in our inbox.
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

      const invoices = await fetchOpenInvoices(env, token, realmId)
      return res.status(200).json({
        company: connection.company_name,
        environment: connection.environment,
        invoices,
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

      const GMAIL_USER = process.env.GMAIL_USER
      const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return res.status(503).json({ error: 'Email is not set up — GMAIL_USER / GMAIL_APP_PASSWORD are missing.' })
      }

      const { env, token, realmId } = await getLiveToken(client)
      const inv = await fetchInvoice(env, token, realmId, id)
      const doc = (inv && inv.DocNumber) || id
      const balance = inv && inv.Balance != null ? Number(inv.Balance) : null
      const dueDate = (inv && inv.DueDate) || null
      const customer = (inv && inv.CustomerRef && inv.CustomerRef.name) || 'customer'
      const pdf = await fetchInvoicePdf(env, token, realmId, id)

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
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
        from: `JK No Jokes <${GMAIL_USER}>`,
        replyTo: GMAIL_USER,
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
