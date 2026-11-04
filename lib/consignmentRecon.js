/** @typedef {{ t: string, at?: string, atIso?: string }} LogEntry */
/** @typedef {{ type: string, dateIso: string, label: string, pieces?: number, onShelf: number }} LedgerRow */

export const COUNT_LOG_NOTE = /^Counted (\d+) on shelf(?: \((.+)\))?/
/** First-visit baseline on shelf — log note only; does not touch sent/paid totals. */
export const STARTING_COUNT_NOTE = /^Starting count (\d+) on (\d{4}-\d{2}-\d{2})$/
export const DROPOFF_NOTE = /^Dropped off (\d+) pieces on (\d{4}-\d{2}-\d{2}) \((.+)\)$/
export const PAID_NOTE = /^Paid (\d{4}-\d{2}-\d{2}): (.+) for (\d+) pieces$/
export const PICKUP_NOTE = /^Picked up (\d+) bags on (\d{4}-\d{2}-\d{2})$/
export const RESTOCK_LOG_NOTES = [
  /^Sent (\d+) more bags$/,
  /^Stocked their shelf with (\d+) bags$/,
  /^Shipped (\d+) more units$/,
  DROPOFF_NOTE,
]
export const CHECK_LOG_NOTE = /^Check received (.+)$/

export const STORE_OWES_DIAGNOSIS = 'Sold but not reported (store owes me)'

const parseMoney = (s) => Number(String(s).replace(/[$,]/g, '')) || 0

/** @returns {{ exact: number, rounded: number, even: boolean } | null} */
export function paymentPiecesFromCheck(dollars, price) {
  const d = Number(dollars)
  const p = Number(price)
  if (!(d > 0) || !(p > 0)) return null
  const exact = d / p
  const rounded = Math.round(exact)
  const even = Math.abs(exact - rounded) < 1e-6
  return { exact, rounded, even }
}

export function safeOnShelf(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(v, 0)
}

/** True when the store has any drop-off totals or logged drop events. */
export function hasDropActivity(c) {
  if ((Number(c.sent) || 0) > 0) return true
  for (const e of c.log || []) {
    if (parseLogEvent(e.t)?.type === 'drop') return true
  }
  return false
}

/** True when any structured consignment activity exists in the log (not admin notes). */
export function hasLoggedConsignmentActivity(c) {
  for (const e of c.log || []) {
    if (parseLogEvent(e.t)) return true
  }
  return false
}

/** Opening on-shelf baseline from the earliest starting-count log line, else 0. */
export function startingPieces(c) {
  /** @type {{ sortKey: string, seq: number, pieces: number }[]} */
  const hits = []
  ;(c.log || []).forEach((e, seq) => {
    const ev = parseLogEvent(e.t)
    if (ev?.type !== 'starting') return
    const dateIso = (e.atIso || ev.dateIso || '').slice(0, 10)
    hits.push({
      sortKey: dateIso || `9999-12-31-${String(seq).padStart(5, '0')}`,
      seq,
      pieces: ev.pieces || 0,
    })
  })
  if (!hits.length) return 0
  hits.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.seq - b.seq)
  return hits[0].pieces
}

/** Books-on-shelf tracking: drop-offs or a logged starting count. */
export function hasShelfBooks(c) {
  return hasDropActivity(c) || startingPieces(c) > 0
}

/** Parse one log line into a structured event, or null. */
export function parseLogEvent(note) {
  if (!note) return null
  let m = note.match(DROPOFF_NOTE)
  if (m) return { type: 'drop', dateIso: m[2], pieces: Number(m[1]), label: m[3] }
  m = note.match(PAID_NOTE)
  if (m) return { type: 'pay', dateIso: m[1], dollars: parseMoney(m[2]), pieces: Number(m[3]) }
  m = note.match(PICKUP_NOTE)
  if (m) return { type: 'pickup', dateIso: m[2], pieces: Number(m[1]) }
  m = note.match(STARTING_COUNT_NOTE)
  if (m) return { type: 'starting', dateIso: m[2], pieces: Number(m[1]), label: '' }
  m = note.match(COUNT_LOG_NOTE)
  if (m) return { type: 'count', dateIso: null, pieces: Number(m[1]), label: m[2] || '' }
  for (const re of RESTOCK_LOG_NOTES.slice(0, 3)) {
    m = note.match(re)
    if (m) return { type: 'drop', dateIso: null, pieces: Number(m[1]), label: 'legacy restock' }
  }
  m = note.match(CHECK_LOG_NOTE)
  if (m) return { type: 'pay', dateIso: null, dollars: parseMoney(m[1]), pieces: null }
  m = note.match(/^Picked up (\d+) bags$/)
  if (m) return { type: 'pickup', dateIso: null, pieces: Number(m[1]) }
  return null
}

/** Chronological activity with running on-shelf (pieces). Sorted by log `at` (then note date). */
export function buildActivityLedger(c) {
  /** @type {{ type: string, dateIso: string, sortKey: string, seq: number, pieces: number, dollars?: number, label: string }[]} */
  const raw = []
  ;(c.log || []).forEach((e, seq) => {
    const ev = parseLogEvent(e.t)
    if (!ev) return
    const dateIso = (e.atIso || ev.dateIso || '').slice(0, 10)
    raw.push({
      type: ev.type,
      dateIso,
      sortKey: dateIso || `9999-12-31-${String(seq).padStart(5, '0')}`,
      seq,
      pieces: ev.pieces || 0,
      dollars: ev.dollars,
      label: ev.label || '',
    })
  })
  raw.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.seq - b.seq)
  let on = 0
  /** @type {LedgerRow[]} */
  const rows = []
  for (const ev of raw) {
    if (ev.type === 'drop') {
      on += ev.pieces
      rows.push({
        type: 'drop',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        onShelf: on,
        label: `dropped off ${ev.pieces}`,
      })
    } else if (ev.type === 'pay') {
      const pcs = ev.pieces ?? 0
      if (pcs > 0) on -= pcs
      rows.push({
        type: 'pay',
        dateIso: ev.dateIso,
        pieces: pcs,
        onShelf: Math.max(on, 0),
        label: pcs > 0 ? `paid for ${pcs}` : 'payment',
      })
    } else if (ev.type === 'pickup') {
      on -= ev.pieces
      rows.push({
        type: 'pickup',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        onShelf: Math.max(on, 0),
        label: `picked up ${ev.pieces}`,
      })
    } else if (ev.type === 'starting') {
      on = ev.pieces
      rows.push({
        type: 'starting',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        onShelf: on,
        label: `Starting count ${ev.pieces}`,
      })
    } else if (ev.type === 'count') {
      rows.push({
        type: 'count',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        onShelf: on,
        label: `shelf count ${ev.pieces}`,
      })
    }
  }
  return rows
}

export function paidPiecesFromLog(log) {
  let sum = 0
  let any = false
  for (const e of log || []) {
    const ev = parseLogEvent(e.t)
    if (ev?.type === 'pay' && ev.pieces != null && ev.pieces > 0) {
      sum += ev.pieces
      any = true
    }
  }
  return { sum, any }
}

export function latestActivityDateIso(c) {
  let latest = ''
  for (const e of c.log || []) {
    const iso = (e.atIso || parseLogEvent(e.t)?.dateIso || '').slice(0, 10)
    if (iso && iso > latest) latest = iso
  }
  if (c.countedDate && c.countedDate > latest) latest = c.countedDate
  return latest || null
}

export function paidPieces(c) {
  const { sum, any } = paidPiecesFromLog(c.log)
  if (any) return sum
  return c.price > 0 ? Math.round(c.paid / c.price) : 0
}

export function expectedOnShelf(c) {
  const paidPcs = paidPieces(c)
  return startingPieces(c) + (Number(c.sent) || 0) - (Number(c.returned) || 0) - paidPcs
}

/** Totals for short stores (variance > 0), split by diagnosed store debt vs other gaps. */
export const missingSummary = (rows) => {
  const short = rows.filter(c => c.variance > 0)
  const bags = short.reduce((s, c) => s + c.variance, 0)
  const unaccountedVal = short.reduce((s, c) => s + c.varVal, 0)
  const stores = short.length
  const owedShort = short.filter(c => c.diagnosis === STORE_OWES_DIAGNOSIS)
  const owedBags = owedShort.reduce((s, c) => s + c.variance, 0)
  const owedVal = owedShort.reduce((s, c) => s + c.varVal, 0)
  return { bags, unaccountedVal, stores, owedBags, owedVal }
}

export const recon = (c) => {
  const paidUnits = paidPieces(c)
  const expected = expectedOnShelf(c)
  const asOfDate = latestActivityDateIso(c)
  const latestAct = latestActivityDateIso(c)
  const countDate = c.countedDate || ''
  const countActive = c.counted != null && countDate && (!latestAct || countDate >= latestAct)

  if (!countActive) {
    return {
      paidUnits,
      expected,
      asOfDate,
      variance: 0,
      varVal: 0,
      status: expected < 0 ? 'invalid' : 'tracking',
      countActive: false,
    }
  }
  if (expected < 0) {
    return { paidUnits, expected, asOfDate, variance: 0, varVal: 0, status: 'invalid', countActive: true }
  }
  const variance = expected - c.counted
  return {
    paidUnits,
    expected,
    asOfDate,
    variance,
    varVal: variance * c.price,
    status: variance === 0 ? 'reconciled' : variance > 0 ? 'short' : 'over',
    countActive: true,
  }
}

/** @deprecated use buildActivityLedger; kept for legacy check parsing in tests */
export const activitySinceLastCount = (log, price) => {
  if (!log?.length) return { restocked: 0, paidUnits: 0, foundCountInLog: false }
  const countIdx = log.findIndex(e => COUNT_LOG_NOTE.test(e.t))
  if (countIdx < 0) return { restocked: 0, paidUnits: 0, foundCountInLog: false }
  let restocked = 0
  let paidUnits = 0
  for (let i = 0; i < countIdx; i++) {
    const ev = parseLogEvent(log[i].t)
    if (ev?.type === 'drop') restocked += ev.pieces || 0
    if (ev?.type === 'pay' && ev.pieces) paidUnits += ev.pieces
    else if (ev?.type === 'pay' && ev.dollars && price > 0) paidUnits += Math.round(ev.dollars / price)
  }
  return { restocked, paidUnits, foundCountInLog: true }
}
