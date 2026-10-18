// GET /api/jerky/customers — QuickBooks customers (read-only).
// Default: all customers [{ id, name, email }] for store Link / datalist.
// ?active=1: active only [{ id, name, email, balance }] for Invoice Stores list (~5 min cache).
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs, fetchActiveCustomerRefs } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })
  try {
    const { env, token, realmId } = await getLiveToken('jerky')
    const activeOnly = req.query.active === '1' || req.query.active === 'true'
    const customers = (activeOnly
      ? await fetchActiveCustomerRefs(env, token, realmId)
      : await fetchCustomerRefs(env, token, realmId))
      .sort((a, b) => a.name.localeCompare(b.name))
    return res.status(200).json({ customers })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
