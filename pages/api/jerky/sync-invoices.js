// POST /api/jerky/sync-invoices
// Reconciles the portal's invoice list with QuickBooks (the source of truth):
//  - pulls each invoice-store customer's invoices from QB and upserts them
//    (so QB-created invoices appear, and paid/amount/number stay in sync)
//  - removes local invoices whose QB invoice was deleted
// Scoped to the trailing 24 months so it stays fast and delete-detection is safe.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs, resolveCustomer, fetchInvoicesForCustomer, invoiceToRow } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  try {
    const { env, token, realmId } = await getLiveToken('jerky')
    const customers = await fetchCustomerRefs(env, token, realmId)

    // invoice-type stores are the ones with a QB A/R relationship
    const { data: partners } = await gate.db.from('consignment_partners')
      .select('id, store, qb_customer_id, type').eq('type', 'invoice')
    const list = partners || []

    // 24-month window (also bounds which local rows delete-detection may touch)
    const since = new Date(); since.setMonth(since.getMonth() - 24)
    const sinceStr = since.toISOString().slice(0, 10)

    let upserted = 0, removed = 0, unmatched = []
    const syncedPartnerIds = []
    const seen = new Set()

    for (const p of list) {
      let customer = p.qb_customer_id ? customers.find((c) => c.id === p.qb_customer_id) : null
      if (!customer) { const r = resolveCustomer(customers, p.store); if (r.customer) customer = r.customer }
      if (!customer) { unmatched.push(p.store); continue }
      syncedPartnerIds.push(p.id)

      const invs = await fetchInvoicesForCustomer(env, token, realmId, customer.id, sinceStr)
      const rows = invs.map((inv) => { seen.add(inv.Id); return invoiceToRow(inv, p.id) })
      if (rows.length) {
        const { error } = await gate.db.from('store_invoices').upsert(rows, { onConflict: 'qb_invoice_id' })
        if (error) return res.status(500).json({ error: `upsert: ${error.message}` })
        upserted += rows.length
      }
    }

    // delete local QB-linked rows (in-window, for synced stores) that QB no longer has
    if (syncedPartnerIds.length) {
      const { data: locals } = await gate.db.from('store_invoices')
        .select('id, qb_invoice_id')
        .not('qb_invoice_id', 'is', null)
        .in('partner_id', syncedPartnerIds)
        .gte('inv_date', sinceStr)
      const gone = (locals || []).filter((r) => !seen.has(r.qb_invoice_id)).map((r) => r.id)
      if (gone.length) {
        const { error } = await gate.db.from('store_invoices').delete().in('id', gone)
        if (error) return res.status(500).json({ error: `delete: ${error.message}` })
        removed = gone.length
      }
    }

    return res.status(200).json({ ok: true, upserted, removed, stores: syncedPartnerIds.length, unmatched })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
