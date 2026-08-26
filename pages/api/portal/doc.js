import crypto from 'crypto'
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoicePdf, statementFor } from '../../../lib/qboAr'

// ── Public, signed document links ────────────────────────────────────────
// The portal's Gmail-compose flow can't attach files, so emails carry a
// link here instead. Each link is HMAC-signed over (client, kind, id, exp)
// and expires; nothing is enumerable without the secret. The statement is
// rebuilt live on every view, so the customer always sees current numbers.

const linkSecret = () => process.env.PORTAL_LINK_SECRET || process.env.CRON_SECRET

export default async function handler(req, res) {
  const { c, k, i, e, s } = req.query
  const client = String(c || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const kind = k === 'statement' ? 'statement' : k === 'invoice' ? 'invoice' : null
  const id = String(i || '').replace(/[^0-9]/g, '')
  const exp = Number(e || 0)
  if (!client || !kind || !id || !exp || !s) return res.status(400).send('Bad link.')
  if (!linkSecret()) return res.status(503).send('Links are not configured.')

  const expect = crypto.createHmac('sha256', linkSecret()).update(`${client}.${kind}.${id}.${exp}`).digest('base64url')
  const given = String(s)
  const ok = expect.length === given.length &&
    crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(given))
  if (!ok) return res.status(403).send('This link is not valid.')
  if (Date.now() > exp) return res.status(410).send('This link has expired — please ask for a fresh one.')

  try {
    const { env, token, realmId, connection } = await getLiveToken(client)
    if (kind === 'invoice') {
      const pdf = await fetchInvoicePdf(env, token, realmId, id)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`)
      return res.status(200).send(pdf)
    }
    const stmt = await statementFor(env, token, realmId, { companyName: connection.company_name || 'Statement', fromEmail: '' }, id)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Statement</title></head><body style="background:#F6F5F1;padding:24px 12px">${stmt.html}</body></html>`)
  } catch (err) {
    // A statement whose customer has since paid everything off is good news,
    // not an error page.
    if (/no open invoices/i.test(String(err.message || ''))) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(200).send('<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,Arial,sans-serif;max-width:480px;margin:80px auto;color:#1B2027"><h2>All paid up.</h2><p style="color:#4A5158;line-height:1.6">There is no outstanding balance on this account right now. Thank you!</p></body></html>')
    }
    return res.status(500).send('Could not load this document right now — please try again shortly.')
  }
}
