import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { rebuildFinancials } from '../../lib/rebuildFinancials'

const CLIENT_ID = 'dc442b88-5ed1-44be-a908-dcbc945827b3'

// Map a QuickBooks account "Type" to our P&L / balance-sheet category.
// QBO types: Income, Other Income, Cost of Goods Sold, Expenses, Other Expense,
// Bank, Accounts receivable, Other Current Assets, Fixed Assets, Other Assets,
// Accounts payable, Credit Card, Other Current Liabilities, Long Term Liabilities, Equity.
function qbTypeToCategory(qbType) {
  const t = (qbType || '').toLowerCase().trim()
  if (!t) return null
  if (t.includes('cost of goods sold')) return 'cogs'
  if (t.includes('other expense')) return 'other_expense'
  if (t.includes('expense')) return 'expense'
  if (t.includes('income') || t.includes('revenue')) return 'income'
  if (t.includes('payable') || t.includes('credit card') || t.includes('liabilit')) return 'liability'
  if (t.includes('equity')) return 'equity'
  if (t.includes('bank') || t.includes('receivable') || t.includes('asset') || t.includes('cash')) return 'asset'
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  // Admins only.
  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: { user } = {} } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) return res.status(401).json({ error: 'Not signed in' })
  const { data: admin } = await supabaseAdmin
    .from('admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return res.status(403).json({ error: 'Admins only' })

  const input = Array.isArray(req.body?.accounts) ? req.body.accounts : []
  if (!input.length) return res.status(400).json({ error: 'No accounts parsed from the file.' })

  // Build classification rows; track types we couldn't map.
  const rows = []
  const unmapped = []
  const seen = new Set()
  for (const a of input) {
    const account = String(a?.account || '').trim()
    const qb_type = String(a?.qb_type || '').trim()
    if (!account || seen.has(account)) continue
    seen.add(account)
    const category = qbTypeToCategory(qb_type)
    if (!category) { unmapped.push({ account, qb_type }); continue }
    rows.push({ account, category, qb_type, updated_at: new Date().toISOString() })
  }

  if (!rows.length) {
    return res.status(400).json({ error: 'Could not classify any accounts — check the Type column.', unmapped })
  }

  // Upsert the classification (account is the primary key).
  const { error } = await supabaseAdmin
    .from('account_categories')
    .upsert(rows, { onConflict: 'account' })
  if (error) return res.status(500).json({ error: `writing categories: ${error.message}` })

  // Cross-check against the accounts actually used in the ledger, so we catch
  // name mismatches and anything still unclassified (vs the full table).
  const { data: glAccts } = await supabaseAdmin
    .from('gl_transactions').select('account').eq('client_id', CLIENT_ID)
  const { data: catNow } = await supabaseAdmin
    .from('account_categories').select('account')
  const glSet = new Set((glAccts || []).map((r) => r.account))
  const catSet = new Set((catNow || []).map((r) => r.account))
  const glAccountsStillUnclassified = [...glSet].filter((a) => !catSet.has(a))

  // category breakdown
  const breakdown = {}
  rows.forEach((r) => { breakdown[r.category] = (breakdown[r.category] || 0) + 1 })

  // Re-apply the new classification to the live P&L + Balance Sheet right away,
  // straight from the stored ledger — no GL re-upload needed.
  let balanceSheet = null
  try {
    const summary = await rebuildFinancials(CLIENT_ID)
    balanceSheet = summary.balanceSheet
  } catch (e) {
    return res.status(500).json({ error: `Classification saved, but rebuilding the financials failed: ${e.message}` })
  }

  return res.status(200).json({
    ok: true,
    accountsClassified: rows.length,
    breakdown,
    unmapped,                       // accounts whose QB type we didn't recognize
    glAccountsStillUnclassified,    // accounts in the ledger not covered by this COA
    balanceSheet,
  })
}

