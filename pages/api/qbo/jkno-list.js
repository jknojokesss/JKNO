// TEMP read-only helper: list the customers + products/services in JK's own
// business QuickBooks ("jkno" company) so we can pick the right ones for
// monthly invoices. Reads only — posts nothing. Passcode-gated.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchArRefs } from '../../../lib/qboAr'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.JK_ADMIN_CODE || req.body?.passcode !== process.env.JK_ADMIN_CODE) {
    return res.status(401).json({ error: 'Wrong passcode.' })
  }
  try {
    const { env, token, realmId } = await getLiveToken('jkno')
    const refs = await fetchArRefs(env, token, realmId)
    return res.status(200).json({
      company: 'JK No Jokes Financials',
      customers: refs.customers,
      items: refs.items,
      warnings: refs.warnings,
    })
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}
