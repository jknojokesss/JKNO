import { qboEnv, refreshTokens, fetchProfitAndLossRows, fetchCompanyName } from '../../../lib/qbo'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// Nightly QBO pull (vercel.json cron). For every connected client: refresh
// tokens (Intuit rotates the refresh token — persist it FIRST, before doing
// anything that could fail), pull trailing-24-month P&L by month, replace
// that client's rows in qbo_gl_summary.
export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const env = qboEnv()
  if (!env) return res.status(500).json({ error: 'QBO not configured' })

  const { data: conns, error } = await supabaseAdmin
    .from('qbo_connections').select('*').neq('status', 'disabled')
  if (error) return res.status(500).json({ error: error.message })

  const results = {}
  for (const c of conns || []) {
    try {
      const tokens = await refreshTokens(env, c.refresh_token)
      await supabaseAdmin.from('qbo_connections').update({
        refresh_token: tokens.refresh_token || c.refresh_token,
        access_token: tokens.access_token,
        access_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        status: 'connected',
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)

      const rows = await fetchProfitAndLossRows(env, tokens.access_token, c.realm_id, { months: 24 })
      const companyName = await fetchCompanyName(env, tokens.access_token, c.realm_id).catch(() => c.company_name)

      await supabaseAdmin.from('qbo_gl_summary').delete().eq('client_slug', c.client_slug)
      if (rows.length) {
        const payload = rows.map((r) => ({ client_slug: c.client_slug, ...r }))
        for (let i = 0; i < payload.length; i += 500) {
          const { error: insErr } = await supabaseAdmin.from('qbo_gl_summary').insert(payload.slice(i, i + 500))
          if (insErr) throw new Error(insErr.message)
        }
      }
      await supabaseAdmin.from('qbo_connections').update({
        company_name: companyName, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)
      results[c.client_slug] = { ok: true, rows: rows.length, company: companyName }
    } catch (e) {
      // invalid_grant = the refresh token is dead (revoked access or >100 days
      // idle) — flag it so we know that client needs a fresh connect click.
      const dead = e.code === 'invalid_grant'
      await supabaseAdmin.from('qbo_connections').update({
        status: dead ? 'reauth_needed' : 'error',
        last_error: String(e.message || e).slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)
      results[c.client_slug] = { ok: false, error: String(e.message || e) }
    }
  }
  return res.status(200).json({ synced: Object.keys(results).length, results })
}
