import {
  qboEnv, refreshTokens, fetchCompanyName,
  fetchProfitAndLossRows, fetchBalanceSheetRows, fetchGeneralLedgerRows,
} from '../../../lib/qbo'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { targetFor } from '../../../lib/qboTargets'

// Nightly QBO pull (vercel.json cron). Per connected client:
//   1. refresh tokens — Intuit ROTATES the refresh token, so the new one is
//      persisted before anything that could fail
//   2. P&L + Balance Sheet, 24 months, summarized by month (full replace)
//   3. General Ledger detail for the trailing 3 months (replace just those
//      months, so history accumulates instead of being re-pulled nightly)
//
// ?gl=24 (or any month count) widens the GL window for a backfill.
// Each report is independent: if one fails the others still land, and the
// failure is recorded with Intuit's trace id.
export default async function handler(req, res) {
  // Vercel's scheduler sends the bearer header; ?key= is the manual escape
  // hatch so a sync can be kicked off from a browser without waiting for
  // the nightly run. Both check the same secret.
  const secret = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  const ok = secret && (auth === `Bearer ${secret}` || req.query.key === secret)
  if (!ok) return res.status(401).json({ error: 'Unauthorized' })

  const env = qboEnv()
  if (!env) return res.status(500).json({ error: 'QBO not configured' })

  const glMonths = Math.min(36, Math.max(1, parseInt(req.query.gl, 10) || 3))
  const only = req.query.client ? String(req.query.client).toLowerCase() : null

  let q = supabaseAdmin.from('qbo_connections').select('*').neq('status', 'disabled')
  if (only) q = q.eq('client_slug', only)
  const { data: conns, error } = await q
  if (error) return res.status(500).json({ error: error.message })

  const insertChunked = async (db, table, rows) => {
    for (let i = 0; i < rows.length; i += 500) {
      const { error: insErr } = await db.from(table).insert(rows.slice(i, i + 500))
      if (insErr) throw new Error(`${table}: ${insErr.message}`)
    }
  }

  const results = {}
  for (const c of conns || []) {
    const r = { pl: null, bs: null, gl: null, errors: [] }
    let token

    // Where this client's books get written — their own project when they
    // have one. Tokens stay in the main project either way.
    let db, target
    try {
      const t = targetFor(c.client_slug)
      db = t.db
      target = t.label
    } catch (e) {
      await supabaseAdmin.from('qbo_connections').update({
        status: 'error', last_error: String(e.message || e).slice(0, 500),
        last_error_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)
      results[c.client_slug] = { ok: false, stage: 'target', error: String(e.message || e) }
      continue
    }
    r.target = target
    try {
      const tokens = await refreshTokens(env, c.refresh_token)
      token = tokens.access_token
      await supabaseAdmin.from('qbo_connections').update({
        refresh_token: tokens.refresh_token || c.refresh_token,
        access_token: tokens.access_token,
        access_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        status: 'connected',
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)
    } catch (e) {
      // invalid_grant = the refresh token is dead (revoked access or >100 days
      // idle) — flag it so we know that client needs a fresh connect click.
      const dead = e.code === 'invalid_grant'
      await supabaseAdmin.from('qbo_connections').update({
        status: dead ? 'reauth_needed' : 'error',
        last_error: String(e.message || e).slice(0, 500),
        last_intuit_tid: e.intuitTid || null,
        last_error_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('client_slug', c.client_slug)
      results[c.client_slug] = { ok: false, stage: 'token', error: String(e.message || e) }
      continue
    }

    // Profit & Loss — full replace
    try {
      const rows = await fetchProfitAndLossRows(env, token, c.realm_id, { months: 24 })
      await db.from('qbo_gl_summary').delete().eq('client_slug', c.client_slug)
      await insertChunked(db, 'qbo_gl_summary', rows.map((x) => ({ client_slug: c.client_slug, ...x })))
      r.pl = rows.length
    } catch (e) { r.errors.push(`P&L: ${String(e.message || e)}`) }

    // Balance Sheet — full replace
    try {
      const rows = await fetchBalanceSheetRows(env, token, c.realm_id, { months: 24 })
      await db.from('qbo_bs_summary').delete().eq('client_slug', c.client_slug)
      await insertChunked(db, 'qbo_bs_summary', rows.map((x) => ({ client_slug: c.client_slug, ...x })))
      r.bs = rows.length
    } catch (e) { r.errors.push(`BalanceSheet: ${String(e.message || e)}`) }

    // General Ledger — replace only the months in this window
    try {
      const { rows, months, columns } = await fetchGeneralLedgerRows(env, token, c.realm_id, { months: glMonths })
      await db.from('qbo_gl_txns').delete().eq('client_slug', c.client_slug).in('month', months)
      await insertChunked(db, 'qbo_gl_txns', rows.map((x) => ({ client_slug: c.client_slug, ...x })))
      r.gl = { rows: rows.length, months: months.length }
      // A zero-row GL pull is a parsing problem, not an empty book — surface
      // the response's actual column shape so it can be fixed.
      if (rows.length === 0) r.gl.columnsSeen = columns
    } catch (e) { r.errors.push(`GeneralLedger: ${String(e.message || e)}`) }

    const companyName = await fetchCompanyName(env, token, c.realm_id).catch(() => c.company_name)
    await supabaseAdmin.from('qbo_connections').update({
      company_name: companyName,
      last_synced_at: new Date().toISOString(),
      status: r.errors.length ? 'error' : 'connected',
      last_error: r.errors.length ? r.errors.join(' | ').slice(0, 500) : null,
      last_error_at: r.errors.length ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('client_slug', c.client_slug)

    results[c.client_slug] = { ok: r.errors.length === 0, ...r }
  }
  return res.status(200).json({ synced: Object.keys(results).length, glMonths, results })
}
