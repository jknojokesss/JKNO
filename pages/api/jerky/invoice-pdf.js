// GET /api/jerky/invoice-pdf?id=<store_invoices uuid>
// Streams the QuickBooks-rendered PDF of that invoice.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoicePdf } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const id = req.query.id ? String(req.query.id) : null
  if (!id) return res.status(400).json({ error: 'Pass ?id=.' })

  try {
    const { data: row } = await gate.db.from('store_invoices')
      .select('qb_invoice_id, qb_doc_number').eq('id', id).maybeSingle()
    if (!row || !row.qb_invoice_id) return res.status(404).json({ error: 'No QuickBooks invoice on this record.' })

    const { env, token, realmId } = await getLiveToken('jerky')
    const pdf = await fetchInvoicePdf(env, token, realmId, row.qb_invoice_id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="invoice-${row.qb_doc_number || row.qb_invoice_id}.pdf"`)
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).send(pdf)
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
