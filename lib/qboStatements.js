// QuickBooks' own statements, as pulled by the nightly sync.
//
// The apps also DERIVE statements from the ledger (lib/jerkyGL.js and the
// financials page). Those derivations are honest but they're a reconstruction;
// these are the report QuickBooks itself produces. Showing the official figure
// and reconciling the derived one against it is what makes a drift visible —
// a paging bug once put a client's ledger $531 off with every row count still
// looking correct, and only this comparison caught it.

const MONTH = { short: 'short', year: 'numeric' }

export function monthLabel(m) {
  return new Date(m + 'T00:00:00Z').toLocaleDateString('en-US', { ...MONTH, timeZone: 'UTC' })
}

// Rows → { months, groups: [{ group, subgroups: [{ subgroup, accounts }] }] }
// keyed by month so a statement can be rendered for any period.
function shape(rows) {
  const months = [...new Set(rows.map((r) => r.month))].sort()
  const byGroup = new Map()
  for (const r of rows) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, new Map())
    const subs = byGroup.get(r.group)
    const sg = r.subgroup || ''
    if (!subs.has(sg)) subs.set(sg, new Map())
    const accts = subs.get(sg)
    if (!accts.has(r.account)) accts.set(r.account, {})
    accts.get(r.account)[r.month] = (accts.get(r.account)[r.month] || 0) + Number(r.amount)
  }
  const groups = [...byGroup.entries()].map(([group, subs]) => ({
    group,
    subgroups: [...subs.entries()].map(([subgroup, accts]) => ({
      subgroup,
      accounts: [...accts.entries()].map(([account, byMonth]) => ({ account, byMonth })),
    })),
  }))
  return { months, groups }
}

export function totalFor(shaped, group, months) {
  const g = shaped.groups.find((x) => x.group === group)
  if (!g) return 0
  let t = 0
  for (const sg of g.subgroups) for (const a of sg.accounts) {
    for (const m of months) t += a.byMonth[m] || 0
  }
  return t
}

// Fetches both statements for a client. `client` (aka client_slug) scopes the
// rows; pass the Supabase client the page already uses.
export async function loadQboStatements(supabase, client) {
  const [pl, bs] = await Promise.all([
    supabase.from('qbo_gl_summary').select('month, account, group, subgroup, amount').eq('client_slug', client),
    supabase.from('qbo_bs_summary').select('month, account, group, subgroup, amount').eq('client_slug', client),
  ])
  if (pl.error || bs.error) return { error: (pl.error || bs.error).message, pl: null, bs: null }
  return {
    error: null,
    pl: shape(pl.data || []),
    bs: shape(bs.data || []),
  }
}

// Balance sheet as of the latest month: QuickBooks reports a cumulative
// balance per month, so "as of" is that month's column, not a sum of months.
export function balanceSheetAsOf(bs, month) {
  if (!bs || !bs.months.length) return null
  const m = month || bs.months[bs.months.length - 1]
  const sections = bs.groups.map((g) => ({
    group: g.group,
    subgroups: g.subgroups.map((sg) => ({
      subgroup: sg.subgroup,
      accounts: sg.accounts
        .map((a) => ({ account: a.account, amount: a.byMonth[m] || 0 }))
        .filter((a) => Math.abs(a.amount) > 0.005),
    })).filter((sg) => sg.accounts.length),
    total: g.subgroups.reduce((t, sg) => t + sg.accounts.reduce((s, a) => s + (a.byMonth[m] || 0), 0), 0),
  }))
  const assets = sections.find((s) => /asset/i.test(s.group))
  const liabEq = sections.find((s) => /liabilit/i.test(s.group))
  return {
    month: m,
    sections,
    totalAssets: assets ? assets.total : 0,
    totalLiabEquity: liabEq ? liabEq.total : 0,
    balanced: assets && liabEq ? Math.abs(assets.total - liabEq.total) < 0.5 : false,
  }
}

// P&L across a month range (inclusive).
export function profitAndLossFor(pl, fromMonth, toMonth) {
  if (!pl || !pl.months.length) return null
  const months = pl.months.filter((m) => (!fromMonth || m >= fromMonth) && (!toMonth || m <= toMonth))
  const sec = (re) => {
    const g = pl.groups.find((x) => re.test(x.group))
    if (!g) return { accounts: [], total: 0 }
    const accounts = []
    for (const sg of g.subgroups) for (const a of sg.accounts) {
      const amount = months.reduce((s, m) => s + (a.byMonth[m] || 0), 0)
      if (Math.abs(amount) > 0.005) accounts.push({ account: a.account, amount })
    }
    accounts.sort((x, y) => Math.abs(y.amount) - Math.abs(x.amount))
    return { accounts, total: accounts.reduce((s, a) => s + a.amount, 0) }
  }
  const income = sec(/^income/i)
  const cogs = sec(/cost of goods/i)
  const expenses = sec(/^expense/i)
  const otherIncome = sec(/other income/i)
  const otherExpense = sec(/other expense/i)
  const grossProfit = income.total - cogs.total
  const netOperating = grossProfit - expenses.total
  return {
    months, income, cogs, expenses, otherIncome, otherExpense,
    grossProfit, netOperating,
    netIncome: netOperating + otherIncome.total - otherExpense.total,
  }
}
