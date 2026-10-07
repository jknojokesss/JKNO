// Shared copy for bespoke + template demos — how JK No Jokes actually ships portals.

export const DEMO_SCOPES = {
  register: {
    label: 'Sample portal',
    title: 'Operating margin on tickets, books in QuickBooks',
    body: 'Your register and vendor costs sync on a schedule we define. You see gross per ticket while the month is open; closed months tie to the official QuickBooks statement — not a parallel spreadsheet.',
  },
  import: {
    label: 'Sample portal',
    title: 'Landed cost and margin per order, inventory in QBO',
    body: 'Purchase orders, freight, and duty roll into unit cost before goods hit the shelf. Sales margin and inventory relief reconcile to QuickBooks at month-end.',
  },
  property: {
    label: 'Sample portal',
    title: 'Rent roll and owner statements from the same GL',
    body: 'Delinquency and owner packets read the portfolio you already carry in QuickBooks. This screen is how you run the month; your accountant still closes the books there.',
  },
  madeToOrder: {
    label: 'Sample portal',
    title: 'Deposits, production queue, balances — synced to QBO',
    body: 'Floor staff and owners see different views on the same orders. Payments and revenue recognition follow the rules your bookkeeper posts in QuickBooks.',
  },
  fieldJobs: {
    label: 'Sample portal',
    title: 'Crew-friendly input, job-coded books',
    body: 'What the crew enters in plain language lands in QuickBooks on the right accounts and jobs. No duplicate entry in the office after the truck comes back.',
  },
  consignment: {
    label: 'Sample portal',
    title: 'Consignment, direct, and month-end in one login',
    body: 'Units out by store partner, collections, and channel P&L during the month. Month-end income posts reconcile to QuickBooks — the same close your CPA signs off on.',
  },
  ar: {
    label: 'Live product shape',
    title: 'AR from QuickBooks, statements from your inbox',
    body: 'Open invoices are read from QuickBooks. You send PDF statements in bulk from your own email. Nothing here posts back to the books without you approving it.',
  },
  lending: {
    label: 'Sample portal',
    title: 'Pipeline and fees alongside QuickBooks',
    body: 'Leads and disbursed deals on one screen; fees and portfolio totals stay aligned with how you recognize revenue in QuickBooks. This is not loan servicing software.',
  },
  roofing: {
    label: 'Sample portal',
    title: 'Jobs in AccuLynx, books in QuickBooks — one read layer',
    body: 'Job subledger stays in your field system. QuickBooks stays the book of record. This portal reads across both for margin, WIP, and cash — nothing posts from the demo screen.',
  },
  template: {
    label: 'Industry sample',
    title: 'Custom portal on QuickBooks — not a shared SaaS login',
    body: 'Fictitious numbers, real screen patterns. Production builds connect to your QuickBooks company and your register, vendors, or job data on a nightly sync.',
  },
}
