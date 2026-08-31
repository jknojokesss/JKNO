import { supabaseAdmin } from './supabaseAdmin'

// Recompute pl_totals, monthly_summary, and bs_totals from the stored
// gl_transactions + account_categories classification. The nightly QBO
// pull writes the ledger but does not call this — all-time P&L stays
// pinned to the last closed month until someone rebuilds after close.

const PL_CATS = new Set(['income', 'cogs', 'expense', 'other_expense'])
const BS_CATS = new Set(['asset', 'liability', 'equity'])
const round2 = (n) => Math.round(n * 100) / 100

export async function rebuildFinancials(clientId) {
  // classification map
  const { data: catRows, error: catErr } = await supabaseAdmin
    .from('account_categories').select('account, category')
  if (catErr) throw new Error(`loading categories: ${catErr.message}`)
  const CAT = Object.fromEntries((catRows || []).map((r) => [r.account, r.category]))

  // full ledger (paged past the 1000-row default)
  let gl = [], from = 0
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('gl_transactions').select('date, account, amount')
      .eq('client_id', clientId).range(from, from + 999)
    if (error) throw new Error(`loading GL: ${error.message}`)
    gl = gl.concat(data || [])
    if (!data || data.length < 1000) break
    from += 1000
  }

  // aggregate per account + per month
  const byAccount = {}
  const months = {}
  let minMonth = '9999-99', maxMonth = '0000-00'
  for (const r of gl) {
    const amt = Number(r.amount)
    byAccount[r.account] = (byAccount[r.account] || 0) + amt
    const mo = String(r.date).slice(0, 7)
    if (mo < minMonth) minMonth = mo
    if (mo > maxMonth) maxMonth = mo
    const cat = CAT[r.account]
    if (!PL_CATS.has(cat)) continue
    const m = (months[mo] = months[mo] || { income: 0, cogs: 0, opex: 0 })
    if (cat === 'income') m.income += amt
    else if (cat === 'cogs') m.cogs += amt
    else m.opex += amt
  }
  const period = gl.length ? `${minMonth}_${maxMonth}` : null

  const plRows = Object.entries(byAccount)
    .filter(([acct]) => PL_CATS.has(CAT[acct]))
    .map(([acct, sum]) => ({ client_id: clientId, period, label: acct, amount: round2(sum), category: CAT[acct] }))

  const monthlyRows = Object.entries(months).map(([month, m]) => ({
    client_id: clientId, month,
    revenue: round2(m.income),
    cogs: round2(m.cogs),
    expenses: round2(m.cogs + m.opex),
    gross_profit: round2(m.income - m.cogs),
    profit: round2(m.income - m.cogs - m.opex),
    notes: null,
  }))

  // balance sheet
  let inc = 0, cogs = 0, opex = 0
  for (const [acct, sum] of Object.entries(byAccount)) {
    const c = CAT[acct]
    if (c === 'income') inc += sum
    else if (c === 'cogs') cogs += sum
    else if (PL_CATS.has(c)) opex += sum
  }
  const netIncome = round2(inc - cogs - opex)
  const bsRows = Object.entries(byAccount)
    .filter(([acct]) => BS_CATS.has(CAT[acct]))
    .map(([acct, sum]) => ({ client_id: clientId, account: acct, amount: round2(sum), category: CAT[acct] }))
  bsRows.push({ client_id: clientId, account: 'Net Income', amount: netIncome, category: 'equity' })
  const sumCat = (c) => round2(bsRows.filter((r) => r.category === c).reduce((s, r) => s + r.amount, 0))
  const bsAssets = sumCat('asset'), bsLiab = sumCat('liability'), bsEquity = sumCat('equity')
  const bsImbalance = round2(bsAssets - bsLiab - bsEquity)

  const newAccounts = Object.entries(byAccount)
    .filter(([acct]) => !CAT[acct])
    .map(([acct, sum]) => ({ account: acct, net: round2(sum) }))

  // write the three summary tables
  await supabaseAdmin.from('pl_totals').delete().eq('client_id', clientId)
  if (plRows.length) {
    const ins = await supabaseAdmin.from('pl_totals').insert(plRows)
    if (ins.error) throw new Error(`writing pl_totals: ${ins.error.message}`)
  }
  await supabaseAdmin.from('monthly_summary').delete().eq('client_id', clientId)
  if (monthlyRows.length) {
    const ins = await supabaseAdmin.from('monthly_summary').insert(monthlyRows)
    if (ins.error) throw new Error(`writing monthly_summary: ${ins.error.message}`)
  }
  await supabaseAdmin.from('bs_totals').delete().eq('client_id', clientId)
  if (bsRows.length) {
    const ins = await supabaseAdmin.from('bs_totals').insert(bsRows)
    if (ins.error) throw new Error(`writing bs_totals: ${ins.error.message}`)
  }

  return {
    period,
    months: monthlyRows.length,
    plAccounts: plRows.length,
    balanceSheet: {
      assets: bsAssets, liabilities: bsLiab, equity: bsEquity,
      netIncome, balanced: Math.abs(bsImbalance) < 0.01, offBy: bsImbalance,
    },
    newAccounts,
  }
}

// Dashboard / Ask / the monthly table read this snapshot. The P&L tab rebuilds
// from live gl_transactions, so if this isn't refreshed after a close JE the
// hero profit and Ask disagree with the July P&L (that was the $40k vs $24k).
// Skips the current calendar month — an open month's GL is not closed books.
export async function rebuildMonthlySummary(clientId) {
  const { data: catRows, error: catErr } = await supabaseAdmin
    .from('account_categories').select('account, category')
  if (catErr) throw new Error(`loading categories: ${catErr.message}`)
  const CAT = Object.fromEntries((catRows || []).map((r) => [r.account, r.category]))

  let gl = [], from = 0
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('gl_transactions').select('date, account, amount')
      .eq('client_id', clientId).range(from, from + 999)
    if (error) throw new Error(`loading GL: ${error.message}`)
    gl = gl.concat(data || [])
    if (!data || data.length < 1000) break
    from += 1000
  }

  const now = new Date()
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const months = {}
  for (const r of gl) {
    if (!r.date) continue
    const mo = String(r.date).slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(mo) || mo >= curKey) continue
    const cat = CAT[r.account]
    if (!PL_CATS.has(cat)) continue
    const m = (months[mo] = months[mo] || { income: 0, cogs: 0, opex: 0 })
    const amt = Number(r.amount)
    if (cat === 'income') m.income += amt
    else if (cat === 'cogs') m.cogs += amt
    else m.opex += amt
  }

  const monthlyRows = Object.entries(months).map(([month, m]) => ({
    client_id: clientId, month,
    revenue: round2(m.income),
    cogs: round2(m.cogs),
    expenses: round2(m.cogs + m.opex),
    gross_profit: round2(m.income - m.cogs),
    profit: round2(m.income - m.cogs - m.opex),
    notes: null,
  }))

  await supabaseAdmin.from('monthly_summary').delete().eq('client_id', clientId)
  if (monthlyRows.length) {
    const ins = await supabaseAdmin.from('monthly_summary').insert(monthlyRows)
    if (ins.error) throw new Error(`writing monthly_summary: ${ins.error.message}`)
  }
  return { months: monthlyRows.length }
}
