/** Primal Krisp sample portal tokens — aligned with Jerky Munch dashboard look. */
export const CHAR = '#2B2018'
export const SPICE = '#C8462C'
export const KRAFT = '#A9763A'
export const CREAM = '#F6F0E6'
export const CARDBG = '#FFFDF9'
export const INK = '#2B2018'
export const MUTED = '#8A7A66'
export const BORDER = '#E6DBC8'
export const GREEN = '#3E7C4F'
export const AMBER = '#C98A2A'
export const RED = '#C03A22'
export const TINT_GREEN = '#EAF3EC'
export const TINT_AMBER = '#FEF6E8'
export const TINT_RED = '#FBEDE9'

/** Legacy aliases used by charts */
export const BRICK = SPICE
export const CHARCOAL = CHAR
export const SAGE = GREEN
export const BROWN = KRAFT
export const STONE = '#C9C4B8'

export const UI = "'DM Sans', system-ui, sans-serif"
export const MONO = UI

/** Fixed locale so SSR (Node) and browser hydrate the same text. */
export const PK_LOCALE = 'en-US'
export const PK_TZ = 'America/New_York'

const intFormatter = new Intl.NumberFormat(PK_LOCALE, { maximumFractionDigits: 0 })
const moneyFormatter = new Intl.NumberFormat(PK_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const fmtInt = (n) => intFormatter.format(Math.round(n))

export const money = (n) => {
  const v = Math.round(n * 100) / 100
  if (v < 0) return '-$' + moneyFormatter.format(Math.abs(v))
  return '$' + moneyFormatter.format(v)
}

export const money0 = (n) => {
  const v = Math.round(n)
  if (v < 0) return '-$' + intFormatter.format(Math.abs(v))
  return '$' + intFormatter.format(v)
}

export const moneyK = (n) => {
  const v = Math.abs(n)
  if (v >= 1000) return (n < 0 ? '-' : '') + '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return money0(n)
}

export const pct1 = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%'

/** Revenue up = green; cost up = red. */
export const deltaColor = (delta, { cost = false } = {}) => {
  if (delta == null || Math.abs(delta) < 0.005) return MUTED
  if (cost) return delta > 0 ? RED : GREEN
  return delta > 0 ? GREEN : RED
}

const asOfDateFormatter = new Intl.DateTimeFormat(PK_LOCALE, {
  timeZone: PK_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** Noon UTC keeps calendar day stable across server (UTC) and US browsers. */
export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return asOfDateFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

export const fmtD = (s) => (s ? fmtAsOfLong(s).replace(/, \d{4}$/, '') : '—')

export const centsEqual = (a, b) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) === 0

export function TieMark({ expected, actual }) {
  const ok = centsEqual(expected, actual)
  if (ok) return null
  const diff = Math.round((actual - expected) * 100) / 100
  return <span style={{ color: RED, fontSize: '11px', fontWeight: 600 }}>Off by {money(Math.abs(diff))}</span>
}

export const CHANNEL_COLORS = {
  Website: SPICE,
  Subscriptions: CHAR,
  Stores: GREEN,
  'Wholesale & bulk': KRAFT,
  'Tastings & events': STONE,
}

export function BagIcon({ color = SPICE }) {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto' }} aria-hidden>
      <rect x="13" y="8" width="38" height="9" rx="2" fill={color} opacity="0.5" />
      <rect x="14" y="14" width="36" height="44" rx="6" fill={color} />
      <rect x="14" y="14" width="36" height="11" rx="6" fill="#000" opacity="0.08" />
      <rect x="20" y="28" width="24" height="20" rx="3" fill={CARDBG} opacity="0.95" />
      <rect x="23" y="33" width="18" height="3" rx="1.5" fill={color} />
      <rect x="23" y="39" width="12" height="3" rx="1.5" fill={color} opacity="0.55" />
    </svg>
  )
}

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK}}
.pk-shell td,.pk-shell th,.pk-shell .pk-kpi-val{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pk-shell{display:flex;min-height:100vh;align-items:stretch;font-variant-numeric:tabular-nums}
.pk-shell button{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pk-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px}
.pk-nav{display:flex;flex-direction:column;gap:3px}.pk-nav--main{flex:1}
.pk-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.pk-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.pk-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.pk-click{transition:box-shadow .12s}.pk-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.pk-sort-pill{min-height:0!important;height:28px;line-height:1;padding:4px 8px;font-size:12px;box-sizing:border-box}
@media(min-width:861px){.pk-side{align-self:stretch;position:sticky;top:0;min-height:100vh;height:auto;overflow-y:auto;overflow-x:hidden}}
@media(max-width:860px){.pk-shell{flex-direction:column}.pk-side{width:auto;height:auto;min-height:0;max-height:none;align-self:auto;position:static;padding:14px 12px 10px;max-width:100%;overflow-x:hidden;overflow-y:visible}.pk-nav--main{flex:0 0 auto}.pk-nav--phone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 2px 10px;width:100%;max-width:100%;overflow-x:hidden}.pk-nav--phone-grid .pk-navbtn{width:100%;min-width:0;padding:6px 4px;border-radius:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);font-size:12px;line-height:1.25;min-height:36px;text-align:center;white-space:normal;word-break:break-word}.pk-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:390px){.pk-nav--phone-grid .pk-navbtn{font-size:12px;padding:6px 3px;min-height:36px}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}.pk-shell button:not(.pk-navbtn){min-height:40px}}`
