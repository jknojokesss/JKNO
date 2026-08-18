// MNE Trading — monthly profit & loss, trailing twelve months.
//
// Single source of truth for the dashboard (/mne-trading) and the printable
// lender statement (/mne-pl). Figures are merchandise sales invoiced and the
// merchandise cost of the purchase orders received against them; June 2026 is
// the most recent closed month and ties to the live invoice/PO lists on the
// dashboard.
export const MONTH_PL = [
  { m: 'Jul', label: 'July 2025',      y: 2025, rev: 14200, cogs: 8900 },
  { m: 'Aug', label: 'August 2025',    y: 2025, rev: 15800, cogs: 9700 },
  { m: 'Sep', label: 'September 2025', y: 2025, rev: 13600, cogs: 8600 },
  { m: 'Oct', label: 'October 2025',   y: 2025, rev: 17400, cogs: 10600 },
  { m: 'Nov', label: 'November 2025',  y: 2025, rev: 19200, cogs: 11800 },
  { m: 'Dec', label: 'December 2025',  y: 2025, rev: 22600, cogs: 13900 },
  { m: 'Jan', label: 'January 2026',   y: 2026, rev: 15100, cogs: 9400 },
  { m: 'Feb', label: 'February 2026',  y: 2026, rev: 16300, cogs: 10100 },
  { m: 'Mar', label: 'March 2026',     y: 2026, rev: 18900, cogs: 11600 },
  { m: 'Apr', label: 'April 2026',     y: 2026, rev: 20400, cogs: 12500 },
  { m: 'May', label: 'May 2026',       y: 2026, rev: 21300, cogs: 13100 },
  { m: 'Jun', label: 'June 2026',      y: 2026, rev: 16980, cogs: 8280 },
]

// Freight, duty and delivery charges captured on the June arrivals (PO-001,
// PO-002). They sit on the purchase orders, not in the COGS column above —
// disclosed in the statement notes rather than quietly folded in.
export const LANDED_NOT_IN_COGS = 2202

export function sum(rows) {
  const rev = rows.reduce((s, r) => s + r.rev, 0)
  const cogs = rows.reduce((s, r) => s + r.cogs, 0)
  return { rev, cogs, gp: rev - cogs, margin: rev ? (rev - cogs) / rev : 0, months: rows.length }
}

export const YTD_2026 = sum(MONTH_PL.filter(r => r.y === 2026))
export const H2_2025 = sum(MONTH_PL.filter(r => r.y === 2025))
export const TTM = sum(MONTH_PL)
