import crypto from 'crypto'
import { requirePortalUser } from '../../../lib/portalAuth'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import { fetchOpenInvoices, fetchInvoicePdf, fetchArRefs, buildInvoice, postInvoice, nextDocNumber, statementFor } from '../../../lib/qboAr'

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

      if (req.query.action === 'statement') {
        const custId = String(req.query.id || '').replace(/[^0-9]/g, '')
        if (!custId) return res.status(400).json({ error: 'Missing ?id=.' })
        const stmt = await statementFor(env, token, realmId, { companyName: connection.company_name || 'Your company', fromEmail: '' }, custId)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#F6F5F1;padding:24px">${stmt.html}</body></html>`)
      }

      if (req.query.action === 'refs') {
        return res.status(200).json(await fetchArRefs(env, token, realmId))
      }

      const invoices = await fetchOpenInvoices(env, token, realmId)
      return res.status(200).json({ company: connection.company_name, invoices })
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
      const base = process.env.PORTAL_BASE_URL || 'https://jknojokes.com'
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
      const created = out.Invoice || {}
      return res.status(200).json({ ok: true, created: { id: created.Id, doc: created.DocNumber || docNumber, total: Number(created.TotalAmt || built.total) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const auth = e instanceof QboAuthError
    return res.status(auth ? 409 : 500).json({ error: String(e.message || e) })
  }
}
