// GET /api/jerky/store-pricing?partner=<uuid>  (or ?store=<name>)
// Returns the QuickBooks customer for a store and the line items + prices from
// their most recent invoice, so a new invoice can prefill everything but qty.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs, resolveCustomer, fetchLastInvoiceForCustomer, fetchItemRefs } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  try {
    let storeName = req.query.store ? String(req.query.store) : null
    let savedCustomerId = null
    if (req.query.partner) {
      const { data: p } = await gate.db.from('consignment_partners')
        .select('store, qb_customer_id').eq('id', String(req.query.partner)).maybeSingle()
      if (p) { storeName = p.store; savedCustomerId = p.qb_customer_id || null }
    }
    if (!storeName && !savedCustomerId) return res.status(400).json({ error: 'Pass ?partner= or ?store=.' })

    const { env, token, realmId } = await getLiveToken('jerky')
    const customers = await fetchCustomerRefs(env, token, realmId)

    let customer = savedCustomerId ? customers.find((c) => c.id === savedCustomerId) : null
    let matchError = null
    if (!customer) {
      const r = resolveCustomer(customers, storeName)
      if (r.customer) customer = r.customer
      else matchError = r.error
    }

    const items = (await fetchItemRefs(env, token, realmId))
      .filter((i) => i.active).map((i) => ({ id: i.id, name: i.name, unitPrice: i.unitPrice }))

    let last = null
    if (customer) {
      const inv = await fetchLastInvoiceForCustomer(env, token, realmId, customer.id)
      if (inv) last = { docNumber: inv.docNumber, txnDate: inv.txnDate, total: inv.total, lines: inv.lines }
    }

    return res.status(200).json({
      store: storeName,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
      matchError,
      last,
      items,
    })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
