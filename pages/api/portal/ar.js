import crypto from 'crypto'
import { requirePortalUser } from '../../../lib/portalAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { buildStatementPdf } from '../../../lib/statementPdf'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import { fetchOpenInvoices, fetchInvoicePdf, fetchArRefs, buildInvoice, postInvoice, nextDocNumber, statementFor, statementsForAll, statementPage, invalidateAr } from '../../../lib/qboAr'

// ── The client portal's API ──────────────────────────────────────────────
// Same live-QBO reads and the guarded invoice create as /api/qbo/ar, but:
//  - scoped: the signed-in portal user's client_slug is forced on every
//    call — the request never names a client, so it can never cross books.
//  - no server-side email. The portal opens the user's own Gmail with the
//    message prefilled; documents travel as signed links to /api/portal/doc,
//    minted here (action=link) with an HMAC + expiry.

const linkSecret = () => process.env.PORTAL_LINK_SECRET || process.env.CRON_SECRET
const signDoc = (client, kind, id, exp) =>
  crypto.createHmac('sha256', linkSecret()).update(`${client}.${kind}.${id}.${exp}`).digest('base64url')

export default async function handler(req, res) {
  const gate = await requirePortalUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })
  const client = gate.clientSlug

  try {
    if (req.method === 'GET') {
      let live
      try {
        live = await getLiveToken(client)
      } catch (e) {
        if (e instanceof QboAuthError && e.needsReconnect) {
          return res.status(200).json({ needsConnect: true, connectUrl: `/api/qbo/connect?client=${client}` })
        }
        throw e
      }
      const { env, token, realmId, connection } = live

      if (req.query.action === 'pdf') {
        const id = String(req.query.id || '').replace(/[^0-9]/g, '')
        if (!id) return res.status(400).json({ error: 'Missing ?id=.' })
        const pdf = await fetchInvoicePdf(env, token, realmId, id)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`)
        return res.status(200).send(pdf)
      }

      const opts = { companyName: connection.company_name || 'Your company', fromEmail: '' }

      // The statement as a real PDF, so it can be attached like an invoice
      // instead of travelling as a link to our domain.
      if (req.query.action === 'statement-pdf') {
        const custId = String(req.query.id || '').replace(/[^0-9]/g, '')
        if (!custId) return res.status(400).json({ error: 'Missing ?id=.' })
        const stmt = await statementFor(env, token, realmId, opts, custId)
        const pdf = await buildStatementPdf({
          companyName: opts.companyName,
          customerName: stmt.customerName,
          customerEmail: stmt.email,
          invoices: stmt.invoices,
          payments: stmt.payments,
          asOf: stmt.asOf,
        })
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="Statement-${stmt.customerName.replace(/[^A-Za-z0-9]+/g, '-')}.pdf"`)
        return res.status(200).send(pdf)
      }

      if (req.query.action === 'statement') {
        const custId = String(req.query.id || '').replace(/[^0-9]/g, '')
        if (!custId) return res.status(400).json({ error: 'Missing ?id=.' })
        const stmt = await statementFor(env, token, realmId, opts, custId)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(statementPage(`<div class="stmt">${stmt.html}</div>`, {
          title: `Statement — ${stmt.customerName}`,
          bar: `<b>${stmt.customerName}</b><span>as of ${stmt.asOf}</span>`,
        }))
      }

      // Every customer with a balance, one per printed page.
      if (req.query.action === 'statements-all') {
        let all = await statementsForAll(env, token, realmId, opts)
        // ?ids= narrows the run to the customers ticked in the portal.
        const ids = String(req.query.ids || '').split(',').map((x) => x.replace(/[^0-9]/g, '')).filter(Boolean)
        if (ids.length) {
          const keep = new Set(ids)
          all = all.filter((a) => keep.has(String(a.customerId)))
        }
        if (!all.length) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          return res.status(200).send(statementPage(
            '<p style="font-family:-apple-system,Arial,sans-serif;color:#4A5158;max-width:640px;margin:40px auto">No customer has an open balance right now, so there are no statements to print.</p>',
            { title: 'Statements' }))
        }
        // A large book can hold hundreds of customers; a single page of all
        // of them stops being printable. Cap it, and say so rather than
        // quietly dropping the tail.
        const CAP = 300
        const page = all.slice(0, CAP)
        const dropped = all.length - page.length
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(statementPage(
          page.map((a) => `<div class="stmt">${a.html}</div>`).join(''),
          {
            title: `Statements — ${page.length} customers`,
            bar: `<b>${page.length} statement${page.length === 1 ? '' : 's'}</b><span>one per page · biggest balance first` +
                 (dropped ? ` · ${dropped} more not shown (largest ${CAP} balances only)` : '') + `</span>`,
          }))
      }

      if (req.query.action === 'refs') {
        return res.status(200).json(await fetchArRefs(env, token, realmId))
      }

      const invoices = await fetchOpenInvoices(env, token, realmId, { fresh: req.query.fresh === '1' })

      // Who has already been chased, newest first per customer. QuickBooks
      // has no record of this — it is the portal's own log.
      const sends = {}
      const { data: rows } = await supabaseAdmin
        .from('portal_sends').select('customer_id, kind, sent_at')
        .eq('client_slug', client).order('sent_at', { ascending: false }).limit(2000)
      for (const r of rows || []) {
        if (r.customer_id && !sends[r.customer_id]) sends[r.customer_id] = { at: r.sent_at, kind: r.kind }
      }
      // Only the company that owns the Stripe account gets a pay link. A
      // client whose books merely pass through here must never send their
      // customers to our domain.
      const payOwner = process.env.STRIPE_PAY_CLIENT || 'jkno'
      const payConfigured = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PAYMENT_LINK || process.env.STRIPE_LINKS)
      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
      const payBase = (client === payOwner && payConfigured)
        ? `${process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`}/pay`
        : null

      return res.status(200).json({ company: connection.company_name, invoices, sends, payBase })
    }

    if (req.method === 'POST' && req.body && req.body.action === 'log-send') {
      // Logged when the message is handed to Gmail. We cannot see the Send
      // click inside Gmail, so this records "chased", not "delivered" — which
      // is what a follow-up pass actually needs to know.
      const { kind, customerId, customerName, doc, to } = req.body
      const { error } = await supabaseAdmin.from('portal_sends').insert({
        client_slug: client,
        customer_id: customerId ? String(customerId) : null,
        customer_name: customerName || null,
        kind: kind === 'invoice' ? 'invoice' : 'statement',
        doc: doc ? String(doc) : null,
        to_email: to || null,
        sent_by: gate.email,
      })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'POST' && req.body && req.body.action === 'link') {
      // Mint a signed, expiring public link to one document (invoice PDF or
      // live statement) so a Gmail-composed email can carry it.
      const kind = req.body.kind === 'statement' ? 'statement' : 'invoice'
      const id = String(req.body.id || '').replace(/[^0-9]/g, '')
      if (!id) return res.status(400).json({ error: 'Missing id.' })
      if (!linkSecret()) return res.status(503).json({ error: 'Document links are not configured (no signing secret).' })
      const exp = Date.now() + 60 * 86400000 // 60 days
      const sig = signDoc(client, kind, id, exp)
      // Derived from the request, never hardcoded: point any domain at this
      // deployment and the links follow it, with our name nowhere in them.
      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
      const base = process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`
      return res.status(200).json({ url: `${base}/api/portal/doc?c=${encodeURIComponent(client)}&k=${kind}&i=${id}&e=${exp}&s=${sig}` })
    }

    if (req.method === 'POST' && req.body && req.body.action === 'create') {
      const { invoice, requestId, confirm } = req.body
      if (!invoice) return res.status(400).json({ error: 'Missing invoice.' })
      const { env, token, realmId } = await getLiveToken(client)
      const refs = await fetchArRefs(env, token, realmId)
      const docNumber = invoice.docNumber || await nextDocNumber(env, token, realmId)
      const built = buildInvoice({ ...invoice, docNumber }, refs)
      if (built.errors.length) return res.status(400).json({ error: built.errors.join(' · ') })
      if (!confirm) {
        return res.status(200).json({ preview: built.summary, requestId: crypto.randomUUID() })
      }
      if (!requestId) return res.status(400).json({ error: 'Confirm requires the requestId from the preview.' })
      const out = await postInvoice(env, token, realmId, built.payload, String(requestId))
      invalidateAr(realmId) // the list must show what we just created
      const created = out.Invoice || {}
      return res.status(200).json({ ok: true, created: { id: created.Id, doc: created.DocNumber || docNumber, total: Number(created.TotalAmt || built.total) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const auth = e instanceof QboAuthError
    return res.status(auth ? 409 : 500).json({ error: String(e.message || e) })
  }
}
