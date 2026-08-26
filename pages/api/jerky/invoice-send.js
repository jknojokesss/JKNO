// POST /api/jerky/invoice-send  Body: { id: <store_invoices uuid>, email? }
// Emails an already-created invoice to the store from orders@jerkymunch.com,
// with the QuickBooks-generated PDF attached (not Intuit's own mailer).
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoice, fetchInvoicePdf, fetchCustomerRefs, fetchInvoiceEmailPrefs } from '../../../lib/qboWrite'
import { sendInvoiceEmail, jerkyMailerConfigured } from '../../../lib/jerkyMailer'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const b = req.body || {}
  const id = b.id ? String(b.id) : null
  if (!id) return res.status(400).json({ error: 'Pass an invoice id.' })
  if (!jerkyMailerConfigured()) return res.status(503).json({ error: "Email isn't set up yet — add the SMTP credentials in the site settings." })

  try {
    const { data: row } = await gate.db.from('store_invoices')
      .select('qb_invoice_id, qb_doc_number, amount, due_date').eq('id', id).maybeSingle()
    if (!row || !row.qb_invoice_id) return res.status(404).json({ error: 'No QuickBooks invoice on this record.' })

    const { env, token, realmId } = await getLiveToken('jerky')
    const inv = await fetchInvoice(env, token, realmId, row.qb_invoice_id)
    if (!inv) return res.status(404).json({ error: 'That invoice no longer exists in QuickBooks.' })

    // recipient: explicit override → invoice BillEmail → the customer's email on file
    let to = b.email || (inv.BillEmail && inv.BillEmail.Address) || null
    const storeName = inv.CustomerRef && inv.CustomerRef.name
    if (!to && inv.CustomerRef) {
      const cust = (await fetchCustomerRefs(env, token, realmId)).find((c) => c.id === inv.CustomerRef.value)
      if (cust) to = cust.email
    }
    if (!to) return res.status(400).json({ error: 'No email address on file for this store.' })

    const pdf = await fetchInvoicePdf(env, token, realmId, row.qb_invoice_id)
    const prefs = await fetchInvoiceEmailPrefs(env, token, realmId).catch(() => null)
    await sendInvoiceEmail({ to, storeName, docNumber: row.qb_doc_number || inv.DocNumber, total: Number(row.amount) || Number(inv.TotalAmt) || 0, dueDate: row.due_date, pdf, subject: prefs && prefs.subject, message: prefs && prefs.message })

    await gate.db.from('store_invoices').update({ sent_at: new Date().toISOString() }).eq('id', id)
    return res.status(200).json({ ok: true, to })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
