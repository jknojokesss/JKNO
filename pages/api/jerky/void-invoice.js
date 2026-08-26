// POST /api/jerky/void-invoice  Body: { id: <store_invoices uuid> }
// Deletes a mistaken invoice from QuickBooks (and its payment, if one was made)
// and removes the local record. Fetches a fresh SyncToken first.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoice, deleteInvoice, fetchPayment, deletePayment } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const id = req.body && req.body.id ? String(req.body.id) : null
  if (!id) return res.status(400).json({ error: 'Pass an invoice id.' })

  try {
    const { data: row } = await gate.db.from('store_invoices')
      .select('qb_invoice_id, qb_payment_id').eq('id', id).maybeSingle()
    if (!row) return res.status(404).json({ error: 'Invoice not found.' })

    if (row.qb_invoice_id) {
      const { env, token, realmId } = await getLiveToken('jerky')
      // delete the payment first, or QuickBooks won't delete a paid invoice
      if (row.qb_payment_id) {
        const pay = await fetchPayment(env, token, realmId, row.qb_payment_id).catch(() => null)
        if (pay) await deletePayment(env, token, realmId, pay.Id, pay.SyncToken)
      }
      const inv = await fetchInvoice(env, token, realmId, row.qb_invoice_id)
      if (inv) await deleteInvoice(env, token, realmId, inv.Id, inv.SyncToken)
    }

    await gate.db.from('store_invoices').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
