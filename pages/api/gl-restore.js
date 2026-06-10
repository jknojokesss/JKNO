import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { rebuildFinancials } from '../../lib/rebuildFinancials'

const CLIENT_ID = 'dc442b88-5ed1-44be-a908-dcbc945827b3'

// Undo the last GL import: restore the snapshot taken before it, then rebuild.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: { user } = {} } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) return res.status(401).json({ error: 'Not signed in' })
  const { data: admin } = await supabaseAdmin
    .from('admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return res.status(403).json({ error: 'Admins only' })

  try {
    const r = await supabaseAdmin.rpc('restore_gl', { p_client: CLIENT_ID })
    if (r.error) throw new Error(r.error.message)
    const restored = r.data || 0
    if (!restored) return res.status(400).json({ error: 'Nothing to restore — no previous ledger snapshot exists.' })

    const summary = await rebuildFinancials(CLIENT_ID)

    await supabaseAdmin.from('import_log').insert({
      kind: 'gl-restore', imported_by: user.email, row_count: restored,
      period: summary.period, balanced: summary.balanceSheet?.balanced ?? null,
      off_by: summary.balanceSheet?.offBy ?? null, note: 'restored previous ledger',
    })

    return res.status(200).json({ ok: true, restored, ...summary })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
