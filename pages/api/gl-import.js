import { supabaseAdmin } from '../../lib/supabaseAdmin'

// Reydel's client_id
const CLIENT_ID = 'dc442b88-5ed1-44be-a908-dcbc945827b3'

// P&L account → category map. These are the only accounts that roll into the
// Profit & Loss; everything else in the GL is balance-sheet (banks, loans,
// Personal, Inventory, etc.) and excluded. Verified to reproduce the books to
// the penny against the Jan–May QuickBooks P&L.
const PL_CATEGORY = {
  'Clover Sales': 'income',
  'Sales Income': 'income',
  'Cost of Goods Sold': 'cogs',
  'Payroll': 'expense',
  'Rent': 'expense',
  'Insurance': 'expense',
  'Bank Service Charge': 'expense',
  'Car': 'expense',
  'Utilities': 'expense',
  'Repairs & Maintenance': 'expense',
  'Computer': 'expense',
  'Charity': 'other_expense',
  'Taxes': 'other_expense',
}

// Every account we've seen so far (P&L + balance-sheet). Anything in an upload
// that's NOT here is a brand-new account we should look at before trusting the
// P&L — surfaced in the response so it never silently distorts the numbers.
const KNOWN_ACCOUNTS = new Set([
  ...Object.keys(PL_CATEGORY),
  'Personal', 'Bleier Loan', 'Hart', 'Bais avrohom', 'Metro', 'Vyolepol',
  'Opening Balance Equity', 'Drebin', 'Dentist', 'Amie', 'Bais Rochel',
  'Savings 1651', 'BUS COMPLETE CHK (5998) - 1', 'Clover Tax',
  'Clover Gratuity (Tips)', 'Jack Hartman', 'Accrued Expense', 'Equipment',
  'Short Term Loans', 'Clover Clearing Account', 'Katz Nov',
  'Bank of America 7875', 'Katz Chase', 'TOTAL CHECKING (8059) - 1',
  'Cash on hand', 'Heller Loan', 'Inventory Asset',
])

const round2 = (n) => Math.round(n * 100) / 100
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

function cleanRows(rows) {
  const out = []
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!isDate(r?.date)) continue
    const account = String(r.account || '').trim()
    if (!account) continue
    const amount = Number(r.amount)
    if (!Number.isFinite(amount)) continue
    out.push({
      client_id: CLIENT_ID,
      date: r.date,
      account,
      type: String(r.type || '').slice(0, 120),
      description: String(r.description || '').slice(0, 400),
      split_account: String(r.split_account || '').slice(0, 200),
      amount: round2(amount),
      source: 'quickbooks',
    })
  }
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  // Admins only — verify the caller's Supabase session, then the admins table.
  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: { user } = {} } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) return res.status(401).json({ error: 'Not signed in' })
  const { data: admin } = await supabaseAdmin
    .from('admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return res.status(403).json({ error: 'Admins only' })

  const rows = cleanRows(req.body?.rows)
  if (rows.length < 10) {
    return res.status(400).json({ error: `Only ${rows.length} valid GL rows parsed — refusing to wipe the ledger. Check the file.` })
  }

  // ----- aggregate the P&L while we have the rows in hand -----
  const byAccount = {}
  const months = {}
  let minMonth = '9999-99', maxMonth = '0000-00'
  for (const r of rows) {
    byAccount[r.account] = (byAccount[r.account] || 0) + r.amount
    const mo = r.date.slice(0, 7)
    if (mo < minMonth) minMonth = mo
    if (mo > maxMonth) maxMonth = mo
    const cat = PL_CATEGORY[r.account]
    if (!cat) continue
    const m = (months[mo] = months[mo] || { income: 0, cogs: 0, opex: 0 })
    if (cat === 'income') m.income += r.amount
    else if (cat === 'cogs') m.cogs += r.amount
    else m.opex += r.amount // expense + other_expense
  }
  const period = `${minMonth}_${maxMonth}`

  const plRows = Object.entries(byAccount)
    .filter(([acct]) => PL_CATEGORY[acct])
    .map(([acct, sum]) => ({
      client_id: CLIENT_ID, period, label: acct,
      amount: round2(sum), category: PL_CATEGORY[acct],
    }))

  const monthlyRows = Object.entries(months).map(([month, m]) => ({
    client_id: CLIENT_ID, month,
    revenue: round2(m.income),
    cogs: round2(m.cogs),
    expenses: round2(m.cogs + m.opex),
    gross_profit: round2(m.income - m.cogs),
    profit: round2(m.income - m.cogs - m.opex),
    notes: null,
  }))

  const newAccounts = Object.entries(byAccount)
    .filter(([acct]) => !KNOWN_ACCOUNTS.has(acct))
    .map(([acct, sum]) => ({ account: acct, net: round2(sum) }))

  try {
    // ----- replace the general ledger -----
    const del = await supabaseAdmin.from('gl_transactions').delete().eq('client_id', CLIENT_ID)
    if (del.error) throw new Error(`clearing GL: ${del.error.message}`)

    const CH = 500
    for (let i = 0; i < rows.length; i += CH) {
      const ins = await supabaseAdmin.from('gl_transactions').insert(rows.slice(i, i + CH))
      if (ins.error) throw new Error(`inserting GL: ${ins.error.message}`)
    }

    // ----- rebuild the P&L summary (now derived from the same GL) -----
    await supabaseAdmin.from('pl_totals').delete().eq('client_id', CLIENT_ID)
    if (plRows.length) {
      const ins = await supabaseAdmin.from('pl_totals').insert(plRows)
      if (ins.error) throw new Error(`writing pl_totals: ${ins.error.message}`)
    }

    // ----- rebuild the monthly rollup -----
    await supabaseAdmin.from('monthly_summary').delete().eq('client_id', CLIENT_ID)
    if (monthlyRows.length) {
      const ins = await supabaseAdmin.from('monthly_summary').insert(monthlyRows)
      if (ins.error) throw new Error(`writing monthly_summary: ${ins.error.message}`)
    }

    return res.status(200).json({
      ok: true,
      glRows: rows.length,
      period,
      months: monthlyRows.length,
      plAccounts: plRows.length,
      newAccounts, // accounts not seen before — review if any appear
    })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
