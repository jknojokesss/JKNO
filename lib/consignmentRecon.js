import { formatJerkyMoney } from './jerkyMoney.js'

/** @typedef {{ t: string, at?: string, atIso?: string }} LogEntry */
/** @typedef {{ type: string, dateIso: string, label: string, pieces?: number, onShelf: number, soldUnpaid?: number, paidPieces?: number, logId?: string }} LedgerRow */

export const COUNT_LOG_NOTE = /^Counted (\d+) on shelf(?: \((.+)\))?/
export const SOLD_NOTE = /^Sold (\d+) pieces(?: on (\d{4}-\d{2}-\d{2}))?$/
export const CLOSE_CYCLE_NOTE = /^Closed cycle —.+?New cycle opens at (\d+) on the shelf\./
/** First-visit baseline on shelf — log note only; does not touch sent/paid totals. */
export const STARTING_COUNT_NOTE = /^Starting count (\d+) on (\d{4}-\d{2}-\d{2})$/
export const DROPOFF_NOTE = /^Dropped off (\d+) pieces on (\d{4}-\d{2}-\d{2}) \((.+)\)$/
export const SHIP_NOTE = /^Shipped (\d+) pieces on (\d{4}-\d{2}-\d{2}) \((.+)\)$/
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

/** @param {{ deliveryMode?: string }} c */
export function partnerDeliveryMode(c) {
  return c?.deliveryMode === 'ship' ? 'ship' : 'drop_off'
}

/** UI + log copy for drop-off vs ship-to-store partners. */
export function consignVerbs(mode) {
  const ship = mode === 'ship'
  return {
    sentLabel: ship ? 'shipped' : 'dropped off',
    sentStepTitle: ship ? '1. Shipped' : '1. Dropped off',
    sentStepHint: ship
      ? 'Date you shipped pieces to this store.'
      : 'Date you added pieces at this store.',
    sentDateLabel: ship ? 'Ship date' : 'Drop-off date',
    sentPiecesLabel: ship ? 'Pieces shipped' : 'Pieces added',
    saveSentBtn: ship ? 'Save shipment' : 'Save drop-off',
    emptySent: ship ? 'No shipments yet' : 'No drop-offs yet',
    emptyActivityLead: ship ? 'log a shipment or payment' : 'log a drop-off or payment',
    startingHintTail: ship ? 'shipments and payments' : 'drop-offs and payments',
    dropLogTag: ship ? 'shipment' : 'drop-off',
  }
}

/** One-line totals under the store name (explicit starting count when set). */
export function consignTotalsLine(c, paidUnits, paidMoneyLabel = '') {
  const v = consignVerbs(partnerDeliveryMode(c))
  const start = startingPieces(c)
  const sent = Number(c.sent) || 0
  const bits = []
  if (start > 0) bits.push(`starting ${start}`)
  if (sent > 0 || start === 0) bits.push(`${v.sentLabel} ${sent}`)
  const paidBit = paidMoneyLabel
    ? `paid for ${paidUnits} pieces (${paidMoneyLabel})`
    : `paid for ${paidUnits} pieces`
  bits.push(paidBit)
  bits.push(`picked up ${Number(c.returned) || 0}`)
  return bits.join(' · ')
}

const parseMoney = (s) => Number(String(s).replace(/[$,]/g, '')) || 0

function formatLedgerDollars(dollars) {
  return formatJerkyMoney(dollars)
}

/** Display label for one ledger row (capitalized action phrase). */
export function ledgerActivityLabel(ev, deliveryMode, price) {
  const pcs = Number(ev.pieces) || 0
  if (ev.type === 'drop') {
    return deliveryMode === 'ship' ? `Shipped ${pcs}` : `Dropped off ${pcs}`
  }
  if (ev.type === 'pickup') return `Picked up ${pcs}`
  if (ev.type === 'sold') return `Sold ${pcs}`
  if (ev.type === 'count') return `Counted ${pcs}`
  if (ev.type === 'starting') return `Starting count ${pcs}`
  if (ev.type === 'close') return `New cycle · ${pcs} on shelf`
  if (ev.type === 'pay') {
    if (ev.dollars > 0) return `Paid ${formatLedgerDollars(ev.dollars)}`
    const derived = payPiecesFromEvent(ev, price)
    if (derived > 0 && price > 0) return `Paid ${formatLedgerDollars(derived * price)}`
    return 'Paid'
  }
  return ev.label || ''
}

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

/** Calendar `YYYY-MM-DD` from a date column or timestamptz string — no timezone shift. */
export function isoDateOnly(raw) {
  if (raw == null || raw === '') return ''
  const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

/** Display a calendar date stored as `YYYY-MM-DD` (America/New_York books day; label is date-only). */
export function formatCalendarDate(iso) {
  const d = isoDateOnly(iso)
  if (!d) return '—'
  const [y, mo, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function payPiecesFromEvent(ev, price) {
  if (ev.pieces != null && ev.pieces > 0) return ev.pieces
  if (ev.dollars > 0 && price > 0) return Math.round(ev.dollars / price)
  return 0
}

/** @returns {{ type: string, dateIso: string, sortKey: string, seq: number, pieces: number, dollars?: number, label: string, logId?: string }[]} */
function collectSortedLogEvents(c) {
  /** @type {{ type: string, dateIso: string, sortKey: string, seq: number, pieces: number, dollars?: number, label: string, logId?: string }[]} */
  const raw = []
  ;(c.log || []).forEach((e, seq) => {
    const close = e.t?.match(CLOSE_CYCLE_NOTE)
    if (close) {
      const dateIso = isoDateOnly(e.atIso || e.at)
      raw.push({
        type: 'close',
        dateIso,
        sortKey: dateIso || `9999-12-31-${String(seq).padStart(5, '0')}`,
        seq,
        pieces: Number(close[1]) || 0,
        label: 'cycle close',
        logId: e.logId,
      })
      return
    }
    const ev = parseLogEvent(e.t)
    if (!ev) return
    const dateIso = isoDateOnly(e.atIso || ev.dateIso)
    raw.push({
      type: ev.type,
      dateIso,
      sortKey: dateIso || `9999-12-31-${String(seq).padStart(5, '0')}`,
      seq,
      pieces: ev.pieces || 0,
      dollars: ev.dollars,
      label: ev.label || '',
      logId: e.logId,
    })
  })
  raw.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.seq - b.seq)
  return raw
}

/**
 * On shelf = opening + dropped − picked up − sold (count snaps shelf; short counts imply sold).
 * Sold, not paid = sold minus payments applied; payments can imply extra sold when they exceed it.
 */
export function buildConsignMetrics(c) {
  const price = Number(c.price) || 0
  const events = collectSortedLogEvents(c)
  let openingShelf = 0
  let dropped = 0
  let pickedUp = 0
  let sold = 0
  let paidPcs = 0
  let soldUnpaid = 0
  let countVariance = 0
  let lastCountDate = ''

  const shelfNow = () => openingShelf + dropped - pickedUp - sold

  const applyCountSnap = (countVal, dateIso) => {
    const book = Math.max(0, shelfNow())
    countVariance = book - countVal
    if (book > countVal) {
      const delta = book - countVal
      sold += delta
      soldUnpaid += delta
    }
    openingShelf = countVal - dropped + pickedUp + sold
    lastCountDate = dateIso
  }

  const hasReplayableActivity = events.some((e) =>
    ['drop', 'starting', 'close', 'sold', 'pickup', 'pay', 'count'].includes(e.type),
  )
  if (!hasReplayableActivity) {
    const sent = Number(c.sent) || 0
    const ret = Number(c.returned) || 0
    const pp = paidPieces(c)
    if (sent > 0 || ret > 0 || pp > 0) {
      dropped = sent
      pickedUp = ret
      paidPcs = pp
      sold = pp
    }
  }

  for (const ev of events) {
    if (ev.type === 'close') {
      openingShelf = ev.pieces
      dropped = 0
      pickedUp = 0
      sold = 0
      paidPcs = 0
      soldUnpaid = 0
      countVariance = 0
      lastCountDate = ''
      continue
    }
    if (ev.type === 'starting') {
      openingShelf = ev.pieces
      continue
    }
    if (ev.type === 'drop') {
      dropped += ev.pieces
      continue
    }
    if (ev.type === 'pickup') {
      pickedUp += ev.pieces
      continue
    }
    if (ev.type === 'sold') {
      sold += ev.pieces
      soldUnpaid += ev.pieces
      continue
    }
    if (ev.type === 'count') {
      applyCountSnap(ev.pieces, ev.dateIso)
      continue
    }
    if (ev.type === 'pay') {
      const P = payPiecesFromEvent(ev, price)
      if (!(P > 0)) continue
      paidPcs += P
      const fromUnpaid = Math.min(P, soldUnpaid)
      soldUnpaid -= fromUnpaid
      const excess = P - fromUnpaid
      if (excess > 0) sold += excess
    }
  }

  const partnerCountDate = isoDateOnly(c.countedDate)
  if (c.counted != null && partnerCountDate && partnerCountDate !== lastCountDate) {
    const latestAct = latestActivityDateIso(c)
    if (!latestAct || partnerCountDate >= latestAct) {
      applyCountSnap(Number(c.counted), partnerCountDate)
    }
  }

  const onShelf = Math.max(0, shelfNow())
  return {
    onShelf,
    soldUnpaid,
    paidPieces: paidPcs,
    sold,
    pickedUp,
    totalDropped: dropped,
    openingShelf,
    countVariance,
    lastCountDate,
    invalid: shelfNow() < -1e-6,
  }
}

export function formatSoldLogNote(pieces, dateIso) {
  return `Sold ${pieces} pieces on ${dateIso}`
}

/** Drop-off rows for the in-store reports list (calendar dates from log `at`). */
export function buildDropReport(c) {
  const dropVerb = consignVerbs(partnerDeliveryMode(c)).sentLabel
  return collectSortedLogEvents(c)
    .filter((ev) => ev.type === 'drop')
    .map((ev) => ({
      dateIso: ev.dateIso,
      pieces: ev.pieces,
      label: `${dropVerb} ${ev.pieces}`,
      logId: ev.logId,
    }))
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
  m = note.match(SHIP_NOTE)
  if (m) return { type: 'drop', dateIso: m[2], pieces: Number(m[1]), label: m[3] }
  m = note.match(PAID_NOTE)
  if (m) return { type: 'pay', dateIso: m[1], dollars: parseMoney(m[2]), pieces: Number(m[3]) }
  m = note.match(PICKUP_NOTE)
  if (m) return { type: 'pickup', dateIso: m[2], pieces: Number(m[1]) }
  m = note.match(STARTING_COUNT_NOTE)
  if (m) return { type: 'starting', dateIso: m[2], pieces: Number(m[1]), label: '' }
  m = note.match(COUNT_LOG_NOTE)
  if (m) return { type: 'count', dateIso: null, pieces: Number(m[1]), label: m[2] || '' }
  m = note.match(SOLD_NOTE)
  if (m) return { type: 'sold', dateIso: m[2] || null, pieces: Number(m[1]), label: '' }
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

/** Chronological activity with running shelf / sold-unpaid / paid. Sorted by log `at`. */
export function buildActivityLedger(c) {
  const price = Number(c.price) || 0
  const events = collectSortedLogEvents(c)
  const mode = partnerDeliveryMode(c)

  let openingShelf = 0
  let dropped = 0
  let pickedUp = 0
  let sold = 0
  let paidPcs = 0
  let soldUnpaid = 0
  const shelfNow = () => Math.max(0, openingShelf + dropped - pickedUp - sold)

  const snap = () => ({ onShelf: shelfNow(), soldUnpaid, paidPieces: paidPcs })

  /** @type {LedgerRow[]} */
  const rows = []
  for (const ev of events) {
    if (ev.type === 'close') {
      openingShelf = ev.pieces
      dropped = 0
      pickedUp = 0
      sold = 0
      paidPcs = 0
      soldUnpaid = 0
      rows.push({
        type: 'close',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'starting') {
      openingShelf = ev.pieces
      rows.push({
        type: 'starting',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'drop') {
      dropped += ev.pieces
      rows.push({
        type: 'drop',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'pickup') {
      pickedUp += ev.pieces
      rows.push({
        type: 'pickup',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'sold') {
      sold += ev.pieces
      soldUnpaid += ev.pieces
      rows.push({
        type: 'sold',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'count') {
      const book = Math.max(0, shelfNow())
      const countVal = ev.pieces
      if (book > countVal) {
        const delta = book - countVal
        sold += delta
        soldUnpaid += delta
      }
      openingShelf = countVal - dropped + pickedUp + sold
      rows.push({
        type: 'count',
        dateIso: ev.dateIso,
        pieces: ev.pieces,
        label: ledgerActivityLabel(ev, mode, price),
        ...snap(),
        logId: ev.logId,
      })
      continue
    }
    if (ev.type === 'pay') {
      const pcs = payPiecesFromEvent(ev, price)
      if (pcs > 0) {
        paidPcs += pcs
        const fromUnpaid = Math.min(pcs, soldUnpaid)
        soldUnpaid -= fromUnpaid
        const excess = pcs - fromUnpaid
        if (excess > 0) sold += excess
      }
      rows.push({
        type: 'pay',
        dateIso: ev.dateIso,
        pieces: pcs,
        onShelf: shelfNow(),
        soldUnpaid,
        paidPieces: paidPcs,
        label: ledgerActivityLabel(ev, mode, price),
        logId: ev.logId,
      })
    }
  }
  return rows
}

/** After count log lines change, partner.counted / countedDate from the latest remaining count entry. */
export function countFieldsFromLog(log) {
  let best = null
  for (const e of log || []) {
    const ev = parseLogEvent(e.t)
    if (ev?.type !== 'count') continue
    const dateIso = (e.atIso || '').slice(0, 10)
    if (!best || dateIso > best.dateIso) best = { pieces: ev.pieces, dateIso }
  }
  if (!best) return { counted: null, countedDate: '' }
  return { counted: best.pieces, countedDate: best.dateIso }
}

/** Roll back sent / returned / paid for one deleted structured log line (not count or starting). */
export function partnerPatchForDeletedLog(partner, deletedEntry) {
  const ev = parseLogEvent(deletedEntry?.t)
  if (!ev) return {}
  if (ev.type === 'drop') {
    return { sent: Math.max(0, (Number(partner.sent) || 0) - (ev.pieces || 0)) }
  }
  if (ev.type === 'pay') {
    let dollars = ev.dollars
    if (!(dollars > 0) && ev.pieces > 0 && Number(partner.price) > 0) {
      dollars = ev.pieces * Number(partner.price)
    }
    if (!(dollars > 0)) return {}
    return { paid: Math.max(0, (Number(partner.paid) || 0) - dollars) }
  }
  if (ev.type === 'pickup') {
    return { returned: Math.max(0, (Number(partner.returned) || 0) - (ev.pieces || 0)) }
  }
  return {}
}

/** Full consignment_partners patch after removing one log row (remainingLog excludes it). */
export function partnerStateAfterLogDelete(partner, deletedEntry, remainingLog) {
  const patch = partnerPatchForDeletedLog(partner, deletedEntry)
  const ev = parseLogEvent(deletedEntry?.t)
  if (ev?.type === 'count') Object.assign(patch, countFieldsFromLog(remainingLog))
  return patch
}

/** Apply one new structured log line onto partner totals (inverse of partnerPatchForDeletedLog). */
export function partnerPatchForAddedLog(partner, entry) {
  const ev = parseLogEvent(entry?.t)
  if (!ev) return {}
  if (ev.type === 'drop') {
    return { sent: (Number(partner.sent) || 0) + (ev.pieces || 0) }
  }
  if (ev.type === 'pay') {
    let dollars = ev.dollars
    if (!(dollars > 0) && ev.pieces > 0 && Number(partner.price) > 0) {
      dollars = ev.pieces * Number(partner.price)
    }
    if (!(dollars > 0)) return {}
    return { paid: (Number(partner.paid) || 0) + dollars }
  }
  if (ev.type === 'pickup') {
    return { returned: (Number(partner.returned) || 0) + (ev.pieces || 0) }
  }
  return {}
}

/** Partner patch after replacing one log row (updatedLog already has the new line in place). */
export function partnerStateAfterLogReplace(partner, oldEntry, newEntry, updatedLog) {
  const remaining = (partner.log || []).filter(e => e.logId !== oldEntry.logId)
  const patch = partnerStateAfterLogDelete(partner, oldEntry, remaining)
  const mid = { ...partner, ...patch }
  Object.assign(patch, partnerPatchForAddedLog(mid, newEntry))
  const oldType = parseLogEvent(oldEntry.t)?.type
  const newType = parseLogEvent(newEntry.t)?.type
  if (oldType === 'count' || newType === 'count') Object.assign(patch, countFieldsFromLog(updatedLog))
  return patch
}

export function formatDropLogNote(pieces, dateIso, mode = 'drop_off') {
  const tag = consignVerbs(mode).dropLogTag
  if (mode === 'ship') return `Shipped ${pieces} pieces on ${dateIso} (${tag})`
  return `Dropped off ${pieces} pieces on ${dateIso} (${tag})`
}

export function formatPayLogNote(dateIso, dollarsLabel, pieces) {
  return `Paid ${dateIso}: ${dollarsLabel} for ${pieces} pieces`
}

export function formatPickupLogNote(pieces, dateIso) {
  return `Picked up ${pieces} bags on ${dateIso}`
}

export function formatStartingCountLogNote(pieces, dateIso) {
  return `Starting count ${pieces} on ${dateIso}`
}

export function formatCountLogNote(pieces, dateLabel) {
  return `Counted ${pieces} on shelf (${dateLabel})`
}

/** Build pay log note from raw dollars + price (same rounding as live entry form). */
export function buildPayLogNote(dateIso, dollars, price, moneyLabel) {
  const calc = paymentPiecesFromCheck(dollars, price)
  const pieces = calc ? calc.rounded : 0
  return formatPayLogNote(dateIso, moneyLabel(dollars), pieces)
}

/** Validate rename for consignment_partners.store (trimmed, case-insensitive unique). */
export function consignStoreRenameError(name, partnerId, partners) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return 'Store name cannot be blank.'
  const key = trimmed.toLowerCase()
  const dup = (partners || []).some(p =>
    p.id !== partnerId && String(p.store || '').trim().toLowerCase() === key
  )
  if (dup) return 'Another store already uses that name.'
  return null
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
  return buildConsignMetrics(c).onShelf
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
  const metrics = buildConsignMetrics(c)
  const paidUnits = metrics.paidPieces || paidPieces(c)
  const expected = metrics.onShelf
  const asOfDate = latestActivityDateIso(c)
  const latestAct = latestActivityDateIso(c)
  const countDate = c.countedDate || metrics.lastCountDate || ''
  const countActive = c.counted != null && countDate && (!latestAct || countDate >= latestAct)

  if (metrics.invalid || expected < 0) {
    return {
      paidUnits,
      expected: Math.max(expected, 0),
      asOfDate,
      variance: 0,
      varVal: 0,
      status: 'invalid',
      countActive: !!countActive,
      soldUnpaid: metrics.soldUnpaid,
      totalDropped: metrics.totalDropped,
    }
  }

  if (!countActive) {
    return {
      paidUnits,
      expected,
      asOfDate,
      variance: 0,
      varVal: 0,
      status: 'tracking',
      countActive: false,
      soldUnpaid: metrics.soldUnpaid,
      totalDropped: metrics.totalDropped,
    }
  }
  const variance = metrics.countVariance
  return {
    paidUnits,
    expected,
    asOfDate,
    variance,
    varVal: variance * (Number(c.price) || 0),
    status: variance === 0 ? 'reconciled' : variance > 0 ? 'short' : 'over',
    countActive: true,
    soldUnpaid: metrics.soldUnpaid,
    totalDropped: metrics.totalDropped,
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
