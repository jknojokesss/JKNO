// What each sample is meant to prove — must match lib/buildStack.js and demoScope copy.

/** @type {Record<string, { sells: string[] }>} */
export const DEMO_ALIGNMENT = {
  '/demo': {
    sells: ['Consignment + direct channels', 'Month-end close → QuickBooks', 'Operating capture (not CSV GL)', 'Answers from synced data'],
  },
  '/riverside-tires': {
    sells: ['Margin per repair order (register × vendor cost)', 'Tire stock / FIFO layers', 'Financials vs QuickBooks', 'Nightly sync'],
  },
  '/riverstone-roofing': {
    sells: ['Job margin + WIP (field system × QBO)', 'Claim-aware cash', 'Buyer package / EBITDA', 'QBO is book of record'],
  },
  '/northline-global': {
    sells: ['Landed cost on POs', 'Bins + margin per order', 'Inventory relief → QBO at close'],
  },
  '/riverfall-gowns': {
    sells: ['Deposits + balances', 'Alterations queue', 'Owner vs staff views', 'Deposits vs revenue in QBO'],
  },
  '/riverbend-fence': {
    sells: ['Crew field log', 'Job-coded costs in QuickBooks', 'No office re-key'],
  },
  '/harborfield-properties': {
    sells: ['Rent roll + delinquency', 'Owner statements from GL', 'Portal P&L reconciles to QBO'],
  },
  '/appliance-repair': {
    sells: ['Profit per job (parts + labor)', 'Tech board during the week', 'Operating P&L reconciles to QBO'],
  },
  '/ar-desk': {
    sells: ['Open invoices from QuickBooks', 'Bulk statements from your email', 'Read-only to the books'],
  },
  '/sba-lending': {
    sells: ['Pipeline + fees earned', 'Not loan servicing or LOS', 'Fee income ties to QBO P&L'],
  },
}

/** @param {string} href */
export function getDemoAlignment(href) {
  if (DEMO_ALIGNMENT[href]) return DEMO_ALIGNMENT[href]
  if (href.startsWith('/demos/')) {
    return {
      sells: ['Industry operating screens', 'Nightly QuickBooks sync', 'Month-end ties to official statements', 'Scoped login — one company'],
    }
  }
  return { sells: ['Custom portal on your books', 'Nightly QuickBooks sync'] }
}
