import { OPS_SAMPLE } from '../../data/ops-center-sample.js'

export const NAVY_GRADIENT = 'linear-gradient(135deg, #172f4d 0%, #1e3a5f 42%, #2a4d73 100%)'
export const DESK_NAVY = '#1e3a5f'
export const GOLD_ON_NAVY = '#e8c97a'
export const NOT_IN_QB = '#c0392b'

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
  return (
    '$' +
    v.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
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
  if (row.inQb) parts.push('In QB')
  if (row.entity) parts.push(row.entity)
  if (row.card && row.card !== 'No card on file') parts.push(row.card)
  if (row.method) parts.push(row.method)
  let line = parts.join(' · ')
  if (!row.inQb) line += (line ? ' · ' : '') + 'NOT IN QB'
  return line
}

export function payableTooltip(row) {
  const bits = []
  if (row.entered) bits.push(`Payable ${fmtShortDate(row.entered)}`)
  if (row.method) bits.push(`Processor: ${row.method}`)
  bits.push(`QB: ${row.inQb ? 'yes' : 'no'}`)
  return bits.join(' · ')
}

export function sumPayables(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.bill += r.bill
      acc.fees += r.fees
      acc.total += r.total
      acc.count += 1
      return acc
    },
    { bill: 0, fees: 0, total: 0, count: 0 },
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

export function cardCounts(payables) {
  const map = new Map()
  payables.forEach((r) => {
    const c = r.card || 'Unknown'
    map.set(c, (map.get(c) || 0) + 1)
  })
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export function stlTotal() {
  return OPS_SAMPLE.shortTermLoans.reduce((s, r) => s + r.amount, 0)
}

export function poTotal() {
  return OPS_SAMPLE.purchaseOrders.reduce((s, r) => s + r.amount, 0)
}

export function ccScheduleTotal(payables = OPS_SAMPLE.payables) {
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
    else if (field === 'amount') cmp = a.total - b.total
    else if (field === 'entered') cmp = (a.entered || '').localeCompare(b.entered || '')
    else if (field === 'entity') cmp = (a.entity || '').localeCompare(b.entity || '')
    else cmp = (a.due || '').localeCompare(b.due || '')
    return asc ? cmp : -cmp
  })
  return sorted
}

export function useRefreshSpin(setSpinning) {
  return () => {
    setSpinning(true)
    window.setTimeout(() => setSpinning(false), 600)
  }
}
