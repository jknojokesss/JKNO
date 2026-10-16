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

export const fmtD = (s) => (s ? fmtAsOf(s) : '—')

export const daysBetween = (fromIso, toIso) => {
  if (!fromIso || !toIso) return null
  return Math.round(
    (new Date(toIso + 'T00:00:00').getTime() - new Date(fromIso + 'T00:00:00').getTime()) / 86400000,
  )
}

export const centsEqual = (a, b) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) === 0

export function TieCheck({ expected, actual, label }) {
  const ok = centsEqual(expected, actual)
  const diff = Math.round((actual - expected) * 100) / 100
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        fontSize: '12px',
      }}
    >
      {label && <span style={{ color: MUTED }}>{label}</span>}
      <span
        style={{
          fontFamily: UI,
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '20px',
          background: ok ? SAGE + '33' : '#FBEDE9',
          color: ok ? CHARCOAL : RED,
        }}
      >
        {ok ? `Ties to total · ${money(expected)}` : `Off by ${money(Math.abs(diff))} · expected ${money(expected)}, got ${money(actual)}`}
      </span>
    </div>
  )
}

export function DataAsOf({ iso, style }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#A2937A',
        marginTop: '10px',
        ...style,
      }}
    >
      Data as of {fmtAsOf(iso)}
    </div>
  )
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
