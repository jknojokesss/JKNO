// POST /api/jerky/mark-paid  Body: { id: <store_invoices uuid>, paid: bool }
// Marking paid also records a customer Payment against the invoice in QuickBooks,
// so QB's A/R matches the portal. Un-marking deletes that payment (reopens it).
// Legacy rows with no qb_invoice_id just flip the local status.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoice, buildPayment, postPayment, fetchPayment, deletePayment } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const b = req.body || {}
  const id = b.id ? String(b.id) : null
  const paid = !!b.paid
  if (!id) return res.status(400).json({ error: 'Pass an invoice id.' })
  const today = new Date().toISOString().slice(0, 10)

  try {
    const { data: row } = await gate.db.from('store_invoices')
      .select('qb_invoice_id, qb_payment_id, amount').eq('id', id).maybeSingle()
    if (!row) return res.status(404).json({ error: 'Invoice not found.' })

    // Legacy / non-QB invoice: local flip only.
    if (!row.qb_invoice_id) {
      await gate.db.from('store_invoices').update({ status: paid ? 'paid' : 'unpaid', paid_date: paid ? today : null }).eq('id', id)
      return res.status(200).json({ ok: true, qb: false })
    }

    const { env, token, realmId } = await getLiveToken('jerky')

    if (paid) {
      const inv = await fetchInvoice(env, token, realmId, row.qb_invoice_id)
      if (!inv) return res.status(404).json({ error: 'That invoice no longer exists in QuickBooks.' })
      const balance = Number(inv.Balance || 0)
      let paymentId = row.qb_payment_id || null
      // only create a payment if QB still shows a balance owed
      if (!paymentId && balance > 0.005) {
        const payload = buildPayment({ customerId: inv.CustomerRef.value, invoiceId: row.qb_invoice_id, amount: balance, txnDate: today })
        const posted = await postPayment(env, token, realmId, payload, `jm-pay-${id.slice(0, 8)}-${Date.now()}`)
        paymentId = (posted.Payment && posted.Payment.Id) || null
      }
      await gate.db.from('store_invoices').update({ status: 'paid', paid_date: today, qb_payment_id: paymentId }).eq('id', id)
      return res.status(200).json({ ok: true, qb: true, paymentId, alreadyPaidInQb: balance <= 0.005 })
    }

    // Un-mark: delete the payment we created (if any), which reopens the invoice.
    if (row.qb_payment_id) {
      const pay = await fetchPayment(env, token, realmId, row.qb_payment_id).catch(() => null)
      if (pay) await deletePayment(env, token, realmId, pay.Id, pay.SyncToken)
    }
    await gate.db.from('store_invoices').update({ status: 'unpaid', paid_date: null, qb_payment_id: null }).eq('id', id)
    return res.status(200).json({ ok: true, qb: true, reversed: true })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
