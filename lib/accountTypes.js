// Single source of truth for account classification, used by both the Accounts
// page and the Financials > Accounts tab. Explicit map first (authoritative
// chart of accounts), then a keyword fallback for anything not yet mapped.
//
// Categories: income | asset | liability | equity | expense
//
// Two groups of named accounts that used to look like expenses (per user 2026-06-03):
//  - LOANS (liability): Amie, Hart, Metro, Drebin — repayments on pre-2026 debts.
//    Opening loan balances NOT yet booked, so they net negative until recorded.
//  - PERSONAL (equity, sub-accounts of 'Personal'): Bais avrohom, Vyolepol,
//    Dentist, Bais Rochel — owner's personal spending, see ACCOUNT_PARENT below.

const ACCOUNT_TYPES = {
  // Income
  'Clover Sales': 'income',
  'Sales Income': 'income',

  // Assets
  'TOTAL CHECKING (8059) - 1': 'asset',
  'BUS COMPLETE CHK (5998) - 1': 'asset',
  'Bank of America 7875': 'asset',
  'Savings 1651': 'asset',
  'Clover Clearing Account': 'asset',
  'Cash on hand': 'asset',
  'Inventory Asset': 'asset',
  'Equipment': 'asset',

  // Liabilities
  'Short Term Loans': 'liability',
  'Heller Loan': 'liability',
  'Heller CC': 'liability',              // Capital One 9618 — Mavis/Eastern/Ben Tire only
  'Bleier Loan': 'liability',
  'Katz Chase': 'liability',             // credit card
  'Katz Nov': 'liability',               // credit card
  'Jack Hartman': 'liability',           // loan received
  'Clover Tax': 'liability',             // sales tax payable
  'Accrued Expense': 'liability',        // accrued liability (balance-sheet)
  'Clover Gratuity (Tips)': 'liability', // tips collected, owed out
  // Loans on pre-2026 debts (opening balances pending — net negative until booked)
  'Amie': 'liability',                   // AR Consulting / permits
  'Hart': 'liability',                   // Hart Tire
  'Metro': 'liability',                  // Metro Tire Wholesale
  'Drebin': 'liability',                 // Monmouth Tax

  // Equity
  'Personal': 'equity',                  // owner's draw
  'Opening Balance Equity': 'equity',
  // Personal spending — sub-accounts of 'Personal' (see ACCOUNT_PARENT)
  'Bais avrohom': 'equity',
  'Vyolepol': 'equity',
  'Dentist': 'equity',
  'Bais Rochel': 'equity',

  // Expense (income statement)
  'Cost of Goods Sold': 'expense',
}

// Parent/child rollup. Children inherit display under their parent and roll into
// the parent's total on the Accounts page.
const ACCOUNT_PARENT = {
  'Bais avrohom': 'Personal',
  'Vyolepol': 'Personal',
  'Dentist': 'Personal',
  'Bais Rochel': 'Personal',
}

export function parentOf(name) {
  return ACCOUNT_PARENT[name] || null
}

// Keyword fallback for any account not in the explicit map above.
function fallback(name) {
  const n = name.toLowerCase()
  if (n.includes('sales') || n.includes('income') || n.includes('revenue')) return 'income'
  if (n.includes('checking') || n.includes('savings') || n.includes('bank of america') ||
      n.includes('cash on hand') || n.includes('inventory asset') || n.includes('equipment') ||
      n.includes('clearing')) return 'asset'
  if (n.includes('loan') || n.includes('payable') || n.includes('credit card')) return 'liability'
  if (n.includes('equity') || n.includes('draw')) return 'equity'
  return 'expense'
}

export function categorize(name) {
  if (!name) return 'expense'
  return ACCOUNT_TYPES[name] || fallback(name)
}

export { ACCOUNT_TYPES }
