// One hungry line per sample portal — marketing + demo lobby. Fictitious companies only.

/** @type {Record<string, { hook: string, next?: string, nextLabel?: string }>} */
export const DEMO_HOOKS = {
  '/demo': {
    hook: 'Which store owes you for the shelf you never got paid for?',
    next: '/riverstone-roofing',
    nextLabel: 'Riverstone Roofing',
  },
  '/riverstone-roofing': {
    hook: 'Which job bled margin before the crew packed up?',
    next: '/northline-global',
    nextLabel: 'Northline Global',
  },
  '/northline-global': {
    hook: 'What did that container actually cost by the time it landed?',
    next: '/riverfall-gowns',
    nextLabel: 'Riverfall Gowns',
  },
  '/riverfall-gowns': {
    hook: 'Who still owes a balance on a dress that ships Saturday?',
    next: '/riverside-tires',
    nextLabel: 'Riverside Tires',
  },
  '/riverside-tires': {
    hook: 'What did yesterday’s tickets really make after tire cost?',
    next: '/riverbend-fence',
    nextLabel: 'Riverbend Fence',
  },
  '/riverbend-fence': {
    hook: 'Did Monday’s crew hit the right job code before payroll?',
    next: '/harborfield-properties',
    nextLabel: 'Harborfield',
  },
  '/harborfield-properties': {
    hook: 'Who’s late — and which owner statement is still draft?',
    next: '/ar-desk',
    nextLabel: 'AR desk',
  },
  '/ar-desk': {
    hook: 'Send the statement batch without opening QuickBooks.',
    next: '/appliance-repair',
    nextLabel: 'Appliance repair',
  },
  '/appliance-repair': {
    hook: 'Parts on the truck vs. parts on the P&L — same ticket?',
    next: '/sba-lending',
    nextLabel: 'Riverbank Funding',
  },
  '/sba-lending': {
    hook: 'Fees earned this quarter without a loan servicing stack.',
    next: '/demo',
    nextLabel: 'Summit Snacks',
  },
  '/demos/auto-repair': {
    hook: 'Shelf stock or job COGS — tagged before month-end.',
    next: '/demos/hvac',
    nextLabel: 'HVAC sample',
  },
  '/demos/wholesale': {
    hook: 'Route accounts and invoices that still tie to the GL.',
    next: '/demo',
    nextLabel: 'Summit Snacks',
  },
}

export function getDemoHook(href) {
  const meta = DEMO_HOOKS[href]
  if (meta) return meta
  return {
    hook: 'Walk it like you own the place — then imagine your name on the tab.',
    next: '/demos',
    nextLabel: 'All samples',
  }
}

/** Homepage + gallery featured doors */
export const HERO_DOORS = [
  { href: '/demo', name: 'Summit Snacks Co.', n: '01' },
  { href: '/riverstone-roofing', name: 'Riverstone Roofing', n: '02' },
  { href: '/northline-global', name: 'Northline Global', n: '03' },
]
