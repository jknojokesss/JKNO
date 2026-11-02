// Weldon order-history cells[1]: MM/DD/YYYY plus optional h:mm:ss AM/PM (America/New_York).
// Bookmarklet sends NY-local ordered_at; this module validates and converts for timestamptz.

export function parseTime12To24(h, min, sec, ampm) {
  let hour = parseInt(h, 10)
  const ap = String(ampm).toUpperCase()
  if (ap === 'AM') {
    if (hour === 12) hour = 0
  } else if (ap === 'PM') {
    if (hour !== 12) hour += 12
  }
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** NY-local "YYYY-MM-DDTHH:mm:ss" from the Order Date cell text, or null if no time. */
export function orderedAtFromOrderDateCell(cellText) {
  const raw = String(cellText ?? '')
  const dm = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!dm) return null
  const dateIso = `${dm[3]}-${String(dm[1]).padStart(2, '0')}-${String(dm[2]).padStart(2, '0')}`
  const tm = raw.match(/(\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)/i)
  if (!tm) return null
  return `${dateIso}T${parseTime12To24(tm[1], tm[2], tm[3], tm[4])}`
}

export function isNyLocalOrderedAt(s) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s || '')
}

function formatNyLocalFromUtc(ms) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))
  const g = (t) => parts.find((p) => p.type === t)?.value
  let hour = g('hour')
  if (hour === '24') hour = '00'
  return `${g('year')}-${g('month')}-${g('day')}T${hour}:${g('minute')}:${g('second')}`
}

/** Convert NY-local ordered_at to UTC ISO string for Postgres timestamptz, or null. */
export function nyLocalOrderedAtToTimestamptz(local) {
  if (!isNyLocalOrderedAt(local)) return null
  const [datePart, timePart] = local.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi, s] = timePart.split(':').map(Number)
  if (![y, mo, d, h, mi, s].every(Number.isFinite)) return null

  for (const offsetHours of [-5, -4]) {
    const utcMs = Date.UTC(y, mo - 1, d, h, mi, s) - offsetHours * 3600 * 1000
    if (formatNyLocalFromUtc(utcMs) === local) return new Date(utcMs).toISOString()
  }
  return null
}

export function sanitizeOrderedAtFromClient(value) {
  const s = typeof value === 'string' ? value.trim() : ''
  if (!isNyLocalOrderedAt(s)) return null
  return nyLocalOrderedAtToTimestamptz(s)
}
