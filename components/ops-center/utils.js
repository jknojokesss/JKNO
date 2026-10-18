import { OPS_SAMPLE } from '../../data/ops-center-sample.js'

export const NAVY_GRADIENT = 'linear-gradient(135deg, #172f4d 0%, #1e3a5f 42%, #2a4d73 100%)'
export const DESK_NAVY = '#1e3a5f'
export const GOLD_ON_NAVY = '#e8c97a'

const KNOWN_MONTHS = {
  '2026-10': {
    key: '2026-10',
    label: 'October 2026',
    shortLabel: 'Oct 2026',
    stripe: '#ea580c',
    rowBg: '#fff1e6',
    headerBg: '#ea580c',
    chipBg: '#fff1e6',
  },
  '2026-11': {
    key: '2026-11',
    label: 'November 2026',
    shortLabel: 'Nov 2026',
    stripe: '#2563eb',
    rowBg: '#d6e8ff',
    headerBg: '#2563eb',
    chipBg: '#d6e8ff',
  },
  '2026-12': {
    key: '2026-12',
    label: 'December 2026',
    shortLabel: 'Dec 2026',
    stripe: '#047857',
    rowBg: '#ecfdf5',
    headerBg: '#047857',
    chipBg: '#ecfdf5',
  },
}

const FALLBACKS = [
  { stripe: '#7c3aed', rowBg: '#ede9fe', headerBg: '#7c3aed', chipBg: '#ede9fe' },
  { stripe: '#e11d48', rowBg: '#ffe4e6', headerBg: '#e11d48', chipBg: '#ffe4e6' },
]

const NEUTRAL = {
  stripe: '#64748b',
  rowBg: 'rgba(232, 238, 241, 0.5)',
  headerBg: '#475569',
  chipBg: '#e8eef1',
}

export function dueMonthKey(iso) {
  if (!iso) return null
  return iso.slice(0, 7)
}

export function dueTheme(iso) {
  const key = dueMonthKey(iso)
  if (!key) return { ...NEUTRAL, key: null, label: 'Other' }
  if (KNOWN_MONTHS[key]) return KNOWN_MONTHS[key]
  const idx = key.split('-').reduce((s, p) => s + parseInt(p, 10), 0) % FALLBACKS.length
  const fb = FALLBACKS[idx]
  const d = new Date(`${key}-01T12:00:00`)
  const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { key, label, shortLabel: label, ...fb }
}

export const SCHEDULE_MONTH_KEYS = ['2026-10', '2026-11', '2026-12']

export function formatMoney(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (v < 0) return `-$${abs}`
  return `$${abs}`
}

export function formatMoneyCompact(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  if (abs >= 1_000_000) {
    const m = v / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (abs >= 1000) return `$${Math.round(v / 1000)}K`
  return formatMoney(v)
}

export function fmtShortDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export function fmtDueDisplay(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDueGroupTitle(iso) {
  if (!iso) return 'No due date'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function payableMeta(row) {
  const parts = []
  if (row.entered) parts.push(`Entered ${fmtShortDate(row.entered)}`)
  if (row.entity) parts.push(row.entity)
  if (row.method) parts.push(row.method)
  return parts.join(' · ')
}

export function payableTooltip(row) {
  const bits = []
  if (row.entered) bits.push(`Entered ${fmtShortDate(row.entered)}`)
  if (row.method) bits.push(`Method: ${row.method}`)
  if (row.entity) bits.push(row.entity)
  return bits.join(' · ')
}

export function sumPayables(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.total += r.amount
      acc.count += 1
      return acc
    },
    { total: 0, count: 0 },
  )
}

export function monthBuckets(payables) {
  const map = {}
  payables.forEach((r) => {
    const k = dueMonthKey(r.due) || 'none'
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return map
}

const METHOD_ORDER = ['ACH', 'Card', 'Check', 'Wire']

export function methodCounts(payables) {
  const map = new Map()
  payables.forEach((r) => {
    const m = r.method || 'Unknown'
    map.set(m, (map.get(m) || 0) + 1)
  })
  return METHOD_ORDER.filter((m) => map.has(m)).map((m) => [m, map.get(m)])
}

export const STL_ENTITY_ORDER = ['Retail Co.', 'Wholesale Co.', 'Property Co.', 'Distribution Co.']

export function stlTotal() {
  return OPS_SAMPLE.shortTermLoans.reduce((s, r) => s + r.balance, 0)
}

export function stlOriginalTotal() {
  return OPS_SAMPLE.shortTermLoans.reduce((s, r) => s + r.original, 0)
}

export function stlMonthlyTotal() {
  return OPS_SAMPLE.shortTermLoans.reduce((s, r) => s + r.monthly, 0)
}

export function shortTermLoansByEntity() {
  const map = new Map()
  OPS_SAMPLE.shortTermLoans.forEach((loan) => {
    if (!map.has(loan.entity)) map.set(loan.entity, [])
    map.get(loan.entity).push(loan)
  })
  return STL_ENTITY_ORDER.filter((e) => map.has(e)).map((entity) => ({
    entity,
    loans: map.get(entity),
    balance: map.get(entity).reduce((s, r) => s + r.balance, 0),
  }))
}

export function stlPaidPercent(original, balance) {
  if (original <= 0 || balance < 0) return null
  return Math.round(((original - balance) / original) * 100)
}

export function fmtLoanDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtLoanPayoff(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function stlEarliestPayoffLabel() {
  const dates = OPS_SAMPLE.shortTermLoans.map((r) => r.payoff).filter(Boolean)
  if (!dates.length) return '—'
  dates.sort()
  return fmtLoanPayoff(dates[0])
}

export function poTotal() {
  return OPS_SAMPLE.purchaseOrders.reduce((s, r) => s + r.amount, 0)
}

export function payablesScheduleTotal(payables = OPS_SAMPLE.payables) {
  return sumPayables(payables).total
}

export const SORT_DEFAULTS = {
  dueDate: true,
  amount: false,
  vendor: true,
  entered: true,
  entity: true,
}

export function sortPayables(rows, field, asc) {
  const sorted = [...rows]
  sorted.sort((a, b) => {
    let cmp = 0
    if (field === 'vendor') cmp = (a.vendor || '').localeCompare(b.vendor || '')
    else if (field === 'amount') cmp = a.amount - b.amount
    else if (field === 'entered') cmp = (a.entered || '').localeCompare(b.entered || '')
    else if (field === 'entity') cmp = (a.entity || '').localeCompare(b.entity || '')
    else cmp = (a.due || '').localeCompare(b.due || '')
    return asc ? cmp : -cmp
  })
  return sorted
}
