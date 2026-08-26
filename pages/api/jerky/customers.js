// GET /api/jerky/customers — the QuickBooks customer list, for mapping a store
// that didn't auto-match. Returns [{ id, name, email }].
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })
  try {
    const { env, token, realmId } = await getLiveToken('jerky')
    const customers = (await fetchCustomerRefs(env, token, realmId))
      .sort((a, b) => a.name.localeCompare(b.name))
    return res.status(200).json({ customers })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
