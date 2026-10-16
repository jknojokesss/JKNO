import { DEMO_MONO, DEMO_UI } from '../../lib/demoFonts'

export const BRICK = '#B4292E'
export const CHARCOAL = '#2B2B2B'
export const SAGE = '#A8B88F'
export const BROWN = '#976A49'
export const CREAM = '#FBF4EC'
export const CARDBG = '#FFFDFA'
export const INK = CHARCOAL
export const MUTED = '#8C7C82'
export const BORDER = '#ECE0D8'
export const AMBER = '#C98A2A'
export const RED = '#C03A22'
export const STONE = '#C9C4B8'

export const MONO = DEMO_MONO
export const UI = DEMO_UI

export const money = (n) =>
  '$' +
  (Math.round(n * 100) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const money0 = (n) => '$' + Math.round(n).toLocaleString()

export const moneyK = (n) => {
  const v = Math.abs(n)
  if (v >= 1000) return (n < 0 ? '-' : '') + '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return money0(n)
}

export const pct1 = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%'

export const fmtAsOf = (iso) => {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export const fmtD = (s) => (s ? fmtAsOf(s) : '—')

export const centsEqual = (a, b) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) === 0

/** Quiet tie indicator beside a footer total */
export function TieMark({ expected, actual }) {
  const ok = centsEqual(expected, actual)
  const diff = Math.round((actual - expected) * 100) / 100
  if (ok) {
    return (
      <span title="Ties to total" style={{ color: SAGE, fontSize: '12px', fontWeight: 600, lineHeight: 1 }}>
        ✓
      </span>
    )
  }
  return <span style={{ color: RED, fontSize: '11px', fontWeight: 600 }}>Off by {money(Math.abs(diff))}</span>
}

export const CHANNEL_COLORS = {
  Website: BRICK,
  Subscriptions: CHARCOAL,
  Stores: SAGE,
  'Wholesale & bulk': BROWN,
  'Tastings & events': STONE,
}

export const verdictPromo = (roas) =>
  roas >= 2 ? { c: SAGE, t: 'Keep' } : roas >= 1 ? { c: AMBER, t: 'Watch' } : { c: RED, t: 'Cut' }
