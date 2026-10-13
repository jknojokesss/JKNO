/** Homepage + gallery copy — owner question first, not industry category. */

export const SAMPLE_PAIN_BY_HREF = {
  '/demo': 'Stores sold your snacks — who still owes you?',
  '/riverstone-roofing': 'Which jobs are losing money?',
  '/northline-global': 'What’s stuck in transit vs. what you can sell?',
  '/riverside-tires': 'Which tickets actually made money this week?',
  '/riverfall-gowns': 'Who still owes on a gown order?',
  '/riverbend-fence': 'Did this job make money when it closed?',
  '/ar-desk': 'Who owes you — and send statements in one click.',
  '/harborfield-properties': 'Which units are late on rent?',
  '/appliance-repair': 'Profit per job while the tech is still on site.',
  '/sba-lending': 'Who do I call back first on the pipeline?',
  '/operations-portal': 'Three companies, one login — what\'s due on the cards and do we have the cash?',
  '/westview-auto': 'Which deals are holding my commission check?',
  '/buckle-up': 'Which deals are holding my commission check?',
  '/bayline-leasing': 'Which deals are holding my commission check?',
}

/** Four samples to try first on /demos */
export const STARTER_DEMOS = [
  { href: '/operations-portal', pain: SAMPLE_PAIN_BY_HREF['/operations-portal'], why: 'Flagship — multi-business hub' },
  { href: '/demo', pain: SAMPLE_PAIN_BY_HREF['/demo'], why: 'Consignment & store counts' },
  { href: '/westview-auto', pain: SAMPLE_PAIN_BY_HREF['/westview-auto'], why: 'Lease desk & funding' },
  { href: '/riverstone-roofing', pain: SAMPLE_PAIN_BY_HREF['/riverstone-roofing'], why: 'Job margin on big projects' },
  { href: '/riverside-tires', pain: SAMPLE_PAIN_BY_HREF['/riverside-tires'], why: 'Register matched to cost' },
]

export const DEMO_TRADE_FILTERS = [
  { id: 'all', label: 'All trades' },
  { id: 'auto', label: 'Auto & tires' },
  { id: 'trades', label: 'Contractors & trades' },
  { id: 'retail', label: 'Retail & food' },
  { id: 'import', label: 'Import & wholesale' },
  { id: 'property', label: 'Property & services' },
]

/** @param {string} href */
export function tradeTagForDemo(href) {
  if (['/riverside-tires', '/appliance-repair', '/westview-auto', '/buckle-up', '/bayline-leasing'].includes(href)) return 'auto'
  if (['/riverstone-roofing', '/riverbend-fence'].includes(href)) return 'trades'
  if (['/demo', '/riverfall-gowns', '/next-level-taste', '/crave-jerky', '/jerky-joy'].includes(href)) return 'retail'
  if (['/northline-global', '/demos/wholesale'].includes(href)) return 'import'
  if (['/harborfield-properties', '/ar-desk', '/sba-lending', '/operations-portal'].includes(href)) return 'property'
  return 'other'
}

/** @param {string} href @returns {string | undefined} */
export function painLineForDemo(href) {
  const line = SAMPLE_PAIN_BY_HREF[href]
  return line || undefined
}
