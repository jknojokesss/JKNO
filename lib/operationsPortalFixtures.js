/** Fictitious sample data only — mirrors adar-hf desk shapes, no real client data. */

export const WORKBOOK_AS_OF = 'Oct 13, 2026'

export const ENTITIES = [
  { id: 'portfolio', label: 'Portfolio-wide' },
  { id: 'riverside', label: 'Riverside Tires' },
  { id: 'harborfield', label: 'Harborfield Residential' },
  { id: 'riverstone', label: 'Riverstone Roofing' },
]

export const BANKS = [
  { id: 'lakeview', name: 'Lakeview National', account: 'Operating · ···4821', balance: 284200, entered: 'Oct 13 · 8:42 AM' },
  { id: 'harbor', name: 'Harbor Trust', account: 'Concentration · ···9033', balance: 91200, entered: 'Oct 13 · 9:05 AM' },
  { id: 'summit', name: 'Summit Metro CU', account: 'Reserve · ···1107', balance: 43800, entered: 'Oct 12 · 4:30 PM' },
]

export const CARDS = [
  { id: 'visa-ops', label: 'Visa · Operations', short: 'Visa Ops' },
  { id: 'amex-team', label: 'Amex · Team travel', short: 'Amex' },
  { id: 'mc-fac', label: 'Mastercard · Facilities', short: 'MC Fac' },
  { id: 'visa-re', label: 'Visa · Harborfield', short: 'Visa RE' },
]

/** bill + fees = amount; status: ok | due-soon | review */
export const PAYABLES = [
  { id: 'p01', entity: 'riverside', card: 'visa-ops', vendor: 'Northline Supply Co.', bill: 11800, fees: 600, due: '2026-10-18', status: 'due-soon' },
  { id: 'p02', entity: 'riverside', card: 'visa-ops', vendor: 'Fleet fuel — October', bill: 3050, fees: 150, due: '2026-10-22', status: 'ok' },
  { id: 'p03', entity: 'portfolio', card: 'amex-team', vendor: 'SaaS renewals bundle', bill: 820, fees: 70, due: '2026-10-28', status: 'ok' },
  { id: 'p04', entity: 'harborfield', card: 'visa-re', vendor: 'Property insurance installment', bill: 3900, fees: 200, due: '2026-11-03', status: 'ok' },
  { id: 'p05', entity: 'portfolio', card: 'mc-fac', vendor: 'Office supply restock', bill: 580, fees: 60, due: '2026-11-08', status: 'ok' },
  { id: 'p06', entity: 'riverstone', card: 'amex-team', vendor: 'Conference travel deposit', bill: 1980, fees: 200, due: '2026-11-12', status: 'review' },
  { id: 'p07', entity: 'riverside', card: 'visa-ops', vendor: 'Net-30 vendor batch', bill: 18200, fees: 550, due: '2026-11-15', status: 'ok' },
  { id: 'p08', entity: 'harborfield', card: 'visa-re', vendor: 'HVAC service — Maple Ave', bill: 1240, fees: 0, due: '2026-10-25', status: 'due-soon' },
  { id: 'p09', entity: 'riverstone', card: 'mc-fac', vendor: 'Job site safety supplies', bill: 890, fees: 45, due: '2026-10-30', status: 'ok' },
  { id: 'p10', entity: 'riverside', card: 'visa-ops', vendor: 'Tire disposal — Q3', bill: 640, fees: 0, due: '2026-11-01', status: 'ok' },
  { id: 'p11', entity: 'portfolio', card: 'amex-team', vendor: 'Accounting software seats', bill: 420, fees: 0, due: '2026-11-18', status: 'ok' },
  { id: 'p12', entity: 'harborfield', card: 'visa-re', vendor: 'Landscaping — October', bill: 2100, fees: 0, due: '2026-11-20', status: 'ok' },
  { id: 'p13', entity: 'riverstone', card: 'visa-ops', vendor: 'Shingle supplier — draw 2', bill: 8600, fees: 320, due: '2026-11-22', status: 'review' },
  { id: 'p14', entity: 'riverside', card: 'mc-fac', vendor: 'Shop utilities true-up', bill: 1100, fees: 0, due: '2026-12-02', status: 'ok' },
  { id: 'p15', entity: 'portfolio', card: 'mc-fac', vendor: 'Cell plan — fleet lines', bill: 780, fees: 0, due: '2026-12-05', status: 'ok' },
  { id: 'p16', entity: 'harborfield', card: 'visa-re', vendor: 'Elevator inspection fee', bill: 950, fees: 50, due: '2026-10-19', status: 'due-soon' },
  { id: 'p17', entity: 'riverstone', card: 'amex-team', vendor: 'Equipment rental — lift', bill: 2400, fees: 120, due: '2026-10-21', status: 'due-soon' },
  { id: 'p18', entity: 'riverside', card: 'visa-ops', vendor: 'Alignment rack service', bill: 1750, fees: 0, due: '2026-11-28', status: 'ok' },
  { id: 'p19', entity: 'portfolio', card: 'visa-ops', vendor: 'Legal retainer — sample', bill: 2500, fees: 0, due: '2026-12-10', status: 'ok' },
  { id: 'p20', entity: 'harborfield', card: 'mc-fac', vendor: 'Snow contract deposit', bill: 3200, fees: 0, due: '2026-11-06', status: 'ok' },
  { id: 'p21', entity: 'riverstone', card: 'visa-ops', vendor: 'Dump fees — October jobs', bill: 1320, fees: 0, due: '2026-11-09', status: 'ok' },
  { id: 'p22', entity: 'riverside', card: 'amex-team', vendor: 'Training workshop', bill: 680, fees: 0, due: '2026-10-27', status: 'ok' },
].map((r) => ({ ...r, amount: r.bill + r.fees }))

export const LOANS = [
  { id: 'l1', entity: 'portfolio', lender: 'Lakeview revolver', balance: 85000, payment: 4200, due: '2026-10-25' },
  { id: 'l2', entity: 'riverstone', lender: 'Bridge note — equipment', balance: 40000, payment: 2000, due: '2026-11-01' },
  { id: 'l3', entity: 'harborfield', lender: 'Property term — Series A', balance: 120000, payment: 3100, due: '2026-11-08' },
  { id: 'l4', entity: 'riverside', lender: 'Floorplan line', balance: 22000, payment: 1800, due: '2026-10-30' },
]

/** Operating schedule — informational; excluded from near-term coverage math in UI copy */
export const OPERATING_SCHEDULE = [
  { entity: 'riverside', category: 'Payroll', oct: 62000, nov: 62000 },
  { entity: 'harborfield', category: 'Payroll', oct: 38000, nov: 38000 },
  { entity: 'riverstone', category: 'Payroll', oct: 46000, nov: 46000 },
  { entity: 'portfolio', category: 'Rent & facilities', oct: 28000, nov: 28000 },
  { entity: 'portfolio', category: 'Insurance & benefits', oct: 11200, nov: 11200 },
  { entity: 'riverstone', category: 'Subcontractors', oct: 18500, nov: 19200 },
]

export const QUEUE = [
  { id: 'q1', group: 'portfolio', title: 'Upload October card workbook', status: 'Due soon', due: '2026-10-16', action: 'Open payables', target: 'cards' },
  { id: 'q2', group: 'riverside', title: 'Confirm fleet card limit before batch pay', status: 'Review', due: '2026-10-20', action: 'Filter Riverside', target: 'cards', entity: 'riverside' },
  { id: 'q3', group: 'harborfield', title: 'Elevator inspection payment pending approval', status: 'Review', due: '2026-10-19', action: 'View bill', target: 'cards', entity: 'harborfield' },
  { id: 'q4', group: 'riverstone', title: 'Match lift rental to job WIP', status: 'Open', due: '2026-10-22', action: 'Open sample', target: 'external', href: '/riverstone-roofing' },
  { id: 'q5', group: 'portfolio', title: 'Lakeview revolver payment — wire date', status: 'Scheduled', due: '2026-10-25', action: 'Loans', target: 'loans' },
  { id: 'q6', group: 'riverside', title: 'Reconcile concentration account transfer', status: 'Open', due: '2026-10-24', action: 'Banks', target: 'banks' },
  { id: 'q7', group: 'harborfield', title: 'Snow contract deposit — board approval', status: 'Review', due: '2026-11-05', action: 'Payables', target: 'cards', entity: 'harborfield' },
  { id: 'q8', group: 'riverstone', title: 'Shingle draw — verify PO before pay', status: 'Review', due: '2026-11-20', action: 'Filter Riverstone', target: 'cards', entity: 'riverstone' },
]

export function dueMonthKey(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function entityLabel(id) {
  return ENTITIES.find((e) => e.id === id)?.label || id
}

export function cardLabel(id) {
  return CARDS.find((c) => c.id === id)?.label || id
}
