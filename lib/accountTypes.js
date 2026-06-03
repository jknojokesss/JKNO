// Single source of truth for account classification, used by both the Accounts
// page and the Financials > Accounts tab. Explicit map first (authoritative
// chart of accounts), then a keyword fallback for anything not yet mapped.
//
// Categories: income | asset | liability | equity | expense
//
// NOTE: several named accounts (Bais avrohom, Amie, Hart, Metro, Vyolepol, ...)
// are repayments on loans for PRE-2026 expenses, not 2026 expenses. They belong
// under 'liability', but their opening loan balances haven't been booked yet, so
// they currently net negative. Add them below as their opening balances get
// recorded — see the loan-account TODO.

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
  'Bleier Loan': 'liability',
  'Katz Chase': 'liability',             // credit card
  'Katz Nov': 'liability',               // credit card
  'Jack Hartman': 'liability',           // loan received
  'Clover Tax': 'liability',             // sales tax payable
  'Accrued Expense': 'liability',        // accrued liability (balance-sheet)
  'Clover Gratuity (Tips)': 'liability', // tips collected, owed out

  // Equity
  'Personal': 'equity',                  // owner's draw
  'Opening Balance Equity': 'equity',

  // Expense (income statement)
  'Cost of Goods Sold': 'expense',
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
