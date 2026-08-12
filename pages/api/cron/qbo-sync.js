import {
  qboEnv, refreshTokens, fetchCompanyName, fetchAccounts,
  fetchProfitAndLossRows, fetchBalanceSheetRows, fetchGeneralLedgerRows,
} from '../../../lib/qbo'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { targetFor, mirrorFor } from '../../../lib/qboTargets'

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

  // PostgREST caps a select at 1000 rows. Anything that reads a whole table
  // slice MUST page, or it silently truncates — which, paired with an
  // unbounded delete, destroys data.
  const selectAll = async (db, table, columns, applyFilters) => {
    const out = []
    const PAGE = 1000
    for (let from = 0; ; from += PAGE) {
      const { data, error: selErr } = await applyFilters(db.from(table).select(columns))
        .range(from, from + PAGE - 1)
      if (selErr) throw new Error(`${table}: ${selErr.message}`)
      out.push(...(data || []))
      if (!data || data.length < PAGE) return out
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
      // window covered by this pull, used by the portal mirror below
      const lastMonth = months[months.length - 1]
      const lastEnd = new Date(Date.UTC(Number(lastMonth.slice(0, 4)), Number(lastMonth.slice(5, 7)), 0))
      r.gl = {
        rows: rows.length, months: months.length,
        from: months[0], to: lastEnd.toISOString().slice(0, 10),
      }
      // A zero-row GL pull is a parsing problem, not an empty book — surface
      // the response's actual column shape so it can be fixed.
      if (rows.length === 0) r.gl.columnsSeen = columns
    } catch (e) { r.errors.push(`GeneralLedger: ${String(e.message || e)}`) }

    // Mirror into an app's own ledger table (its column names), so that app's
    // existing screens serve live QuickBooks data. Chart of accounts comes
    // along too, since it drives their P&L classification.
    const mir = mirrorFor(c.client_slug)
    if (mir && r.gl && r.gl.rows > 0) {
      try {
        const { from, to } = r.gl
        const pulled = await selectAll(db, 'qbo_gl_txns',
          Object.keys(mir.map).join(', '),
          (q) => q.eq('client_slug', c.client_slug).gte('txn_date', from).lte('txn_date', to))
        if (pulled.length !== r.gl.rows) {
          throw new Error(`read back ${pulled.length} of ${r.gl.rows} pulled rows — refusing to replace the ledger with a partial set`)
        }

        // Undated rows too: legacy CSV imports left "Beginning Balance" rows
        // with a null date, which a range filter can never match — and which
        // double-count once the pulled ledger reaches back to inception.
        const { error: delErr } = await db.from(mir.table).delete()
          .or(`${mir.dateColumn}.is.null,and(${mir.dateColumn}.gte.${from},${mir.dateColumn}.lte.${to})`)
        if (delErr) throw new Error(delErr.message)

        await insertChunked(db, mir.table, pulled.map((x) => {
          const row = { ...(mir.constant || {}) }
          for (const [src, dest] of Object.entries(mir.map)) row[dest] = x[src]
          return row
        }))

        const { count: finalCount, error: cErr } = await db.from(mir.table)
          .select('*', { count: 'exact', head: true })
          .gte(mir.dateColumn, from).lte(mir.dateColumn, to)
        if (cErr) throw new Error(cErr.message)
        r.mirrored = { table: mir.table, rows: pulled.length, finalCount, from, to }
        if (finalCount !== pulled.length) {
          throw new Error(`${mir.table} has ${finalCount} rows after mirroring ${pulled.length}`)
        }

        // Chart of accounts — replaces the CoA CSV upload.
        if (mir.accountsTable) {
          const accounts = await fetchAccounts(env, token, c.realm_id)
          if (accounts.length) {
            const { error: adErr } = await db.from(mir.accountsTable).delete().not('account', 'is', null)
            if (adErr) throw new Error(adErr.message)
            await insertChunked(db, mir.accountsTable, accounts.map(({ active, ...a }) => a))
            r.accounts = accounts.length
          }
        }
      } catch (e) { r.errors.push(`mirror: ${String(e.message || e)}`) }
    }

    // Legacy path: main-project portal clients keyed by client_id.
    if (!mir && c.portal_client_id && db === supabaseAdmin && r.gl && r.gl.rows > 0) {
      try {
        const from = r.gl.from, to = r.gl.to
        if (!from || !to) throw new Error('missing mirror window')

        // Read the replacement rows FIRST. If this comes back short or empty,
        // nothing has been deleted yet and the mirror aborts intact.
        const pulled = await selectAll(supabaseAdmin, 'qbo_gl_txns',
          'txn_date, account, txn_type, memo, split_account, amount',
          (q) => q.eq('client_slug', c.client_slug).gte('txn_date', from).lte('txn_date', to))
        if (pulled.length !== r.gl.rows) {
          throw new Error(`read back ${pulled.length} of ${r.gl.rows} pulled rows — refusing to replace the portal with a partial set`)
        }

        // Snapshot what we're about to replace, so a bad run is reversible.
        const existing = await selectAll(supabaseAdmin, 'gl_transactions',
          'client_id, date, account, type, description, split_account, amount, source',
          (q) => q.eq('client_id', c.portal_client_id).gte('date', from).lte('date', to))
        if (existing.length) await insertChunked(supabaseAdmin, 'gl_mirror_backup', existing)

        const { error: delErr } = await supabaseAdmin.from('gl_transactions').delete()
          .eq('client_id', c.portal_client_id).gte('date', from).lte('date', to)
        if (delErr) throw new Error(delErr.message)

        await insertChunked(supabaseAdmin, 'gl_transactions', pulled.map((x) => ({
          client_id: c.portal_client_id,
          date: x.txn_date,
          account: x.account,
          type: x.txn_type,
          description: x.memo,
          split_account: x.split_account,
          amount: x.amount,
          source: 'quickbooks_api',
        })))

        // Verify the portal ended up with what we intended.
        const { count: finalCount, error: cErr } = await supabaseAdmin
          .from('gl_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', c.portal_client_id).gte('date', from).lte('date', to)
        if (cErr) throw new Error(cErr.message)
        r.mirrored = { rows: pulled.length, replaced: existing.length, finalCount, from, to }
        if (finalCount !== pulled.length) {
          throw new Error(`portal has ${finalCount} rows after mirroring ${pulled.length} — restore from gl_mirror_backup`)
        }
      } catch (e) { r.errors.push(`mirror: ${String(e.message || e)}`) }
    }

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
