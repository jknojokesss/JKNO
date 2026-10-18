/** Closeout Explosion sample portal tokens — aligned with Primal Krisp sample look. */
export const CHAR = '#2B2018'
export const SPICE = '#C8462C'
export const KRAFT = '#A9763A'
export const CREAM = '#F6F0E6'
export const CARDBG = '#FFFDF9'
export const INK = '#2B2018'
export const MUTED = '#8A7A66'
export const BORDER = '#E6DBC8'
export const GREEN = '#3E7C4F'
export const RED = '#C03A22'

export const UI = "'Inter', sans-serif"
export const MONO = "'IBM Plex Mono', monospace"

export const CE_LOCALE = 'en-US'
export const CE_TZ = 'America/New_York'

const intFormatter = new Intl.NumberFormat(CE_LOCALE, { maximumFractionDigits: 0 })
const moneyFormatter = new Intl.NumberFormat(CE_LOCALE, {
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

export const pct1 = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%'

const asOfDateFormatter = new Intl.DateTimeFormat(CE_LOCALE, {
  timeZone: CE_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return asOfDateFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

export const fmtD = (s) => (s ? fmtAsOfLong(s).replace(/, \d{4}$/, '') : '—')

export const daysBetween = (fromIso, toIso) => {
  const a = new Date(`${fromIso}T12:00:00.000Z`).getTime()
  const b = new Date(`${toIso}T12:00:00.000Z`).getTime()
  return Math.round((b - a) / 86400000)
}

/** Good = revenue-side up; bad = cost-side up */
export function deltaColor(delta, costLine = false) {
  if (delta === 0 || delta == null) return MUTED
  if (costLine) return delta > 0 ? RED : GREEN
  return delta > 0 ? GREEN : RED
}

export function moneyColor(amount) {
  if (amount < 0) return RED
  return INK
}

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;overflow-x:hidden}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK};overflow-x:hidden}
.ce-shell{display:flex;min-height:100vh;align-items:stretch;max-width:100vw}
.ce-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.ce-nav{display:flex;flex-direction:column;gap:3px}.ce-nav--main{flex:1}
.ce-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.ce-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.ce-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.ce-click{transition:box-shadow .12s}.ce-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.ce-table{width:100%;border-collapse:collapse;font-size:13px}
.ce-table th{font-family:${MONO};font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:right;padding:8px 6px;border-bottom:1px solid ${BORDER}}
.ce-table th.ce-th-left{text-align:left}
.ce-table td{font-family:${MONO};font-size:12px;padding:10px 6px;border-top:1px solid ${BORDER};text-align:right;vertical-align:top}
.ce-table td.ce-td-left{text-align:left;font-family:${UI};font-size:13px}
.ce-table tr.ce-rowbtn{cursor:pointer}
.ce-table tr.ce-rowbtn:hover td{background:rgba(200,70,44,.04)}
.ce-total td{font-weight:700;border-top:2px solid ${BORDER}}
.ce-detail{max-width:640px}
.ce-back{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:${MUTED};font-family:${UI};font-size:13px;font-weight:600;cursor:pointer;padding:0 0 14px;min-height:40px}
.ce-back:hover{color:${INK}}
@media(max-width:860px){.ce-shell{flex-direction:column}.ce-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.ce-nav--main{flex-direction:row;overflow-x:auto;gap:6px;padding:4px 4px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ce-nav::-webkit-scrollbar{display:none}.ce-navbtn{width:auto;padding:8px 14px;border-radius:2px;background:rgba(255,255,255,.07);flex-shrink:0;font-size:13px;min-height:40px}.ce-main{padding:18px 12px 52px;max-width:100%}}
@media(max-width:480px){.ce-table.ce-compact th,.ce-table.ce-compact td{padding:8px 4px;font-size:11px}.ce-table.ce-compact td.ce-td-left{font-size:12px}.ce-hide-sm{display:none}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}}`
