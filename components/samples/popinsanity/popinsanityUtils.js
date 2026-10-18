/** Popinsanity sample portal tokens — copied from Primal Krisp shell patterns. */
export const CHAR = '#2B2B2B'
export const SPICE = '#C8102E'
export const KRAFT = '#A9763A'
export const CREAM = '#F6F0E6'
export const CARDBG = '#FFFDF9'
export const INK = '#2B2B2B'
export const MUTED = '#8A7A66'
export const BORDER = '#E6DBC8'
export const GREEN = '#3E7C4F'
export const RED = '#C03A22'

export const UI = "'Inter', sans-serif"
export const MONO = "'IBM Plex Mono', monospace"

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

const asOfDateFormatter = new Intl.DateTimeFormat(PK_LOCALE, {
  timeZone: PK_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return asOfDateFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

export const fmtD = (s) => (s ? fmtAsOfLong(s).replace(/, \d{4}$/, '') : '—')

export const sumBy = (rows, key) => rows.reduce((s, r) => s + (r[key] || 0), 0)

export const changePct = (thisVal, priorVal) => (priorVal ? ((thisVal - priorVal) / priorVal) * 100 : 0)

export function changeColor(delta, { cost = false } = {}) {
  if (delta == null || Math.abs(delta) < 0.005) return MUTED
  if (delta > 0) return cost ? RED : GREEN
  return cost ? GREEN : RED
}

export function changeDisplay(thisVal, priorVal, { cost = false, revenue = true } = {}) {
  const delta = priorVal != null ? thisVal - priorVal : null
  const color = changeColor(delta, { cost: cost || !revenue })
  const pct = priorVal ? changePct(thisVal, priorVal) : null
  return { delta, color, pct }
}

export const tierShort = (tierId) => {
  const n = tierId?.replace(/^t/, '')
  return n ? `Tier ${n}` : tierId
}

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK}}
.pop-shell{display:flex;min-height:100vh;align-items:stretch}
.pop-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.pop-wordmark{font-family:${UI};font-weight:800;font-size:17px;letter-spacing:0.12em;color:${theme.CREAM};line-height:1.2;padding:4px 8px 0}
.pop-nav{display:flex;flex-direction:column;gap:3px}.pop-nav--main{flex:1}
.pop-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.pop-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.pop-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.pop-click{transition:box-shadow .12s;cursor:pointer}.pop-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.pop-back{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:${theme.SPICE};font-family:${UI};font-size:14px;font-weight:600;cursor:pointer;padding:8px 0;margin-bottom:12px;min-height:40px}
.pop-mobtab{display:none}
@media(max-width:860px){.pop-shell{flex-direction:column}.pop-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.pop-nav--main{flex-direction:row;overflow-x:auto;gap:6px;padding:4px 4px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.pop-nav::-webkit-scrollbar{display:none}.pop-navbtn{width:auto;padding:8px 14px;border-radius:2px;background:rgba(255,255,255,.07);flex-shrink:0;font-size:13px;min-height:40px}.pop-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:480px){.pop-side .pop-nav--main{display:none}.pop-mobtab{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:700;background:${theme.CHAR};border-top:1px solid rgba(255,255,255,.12);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px))}.pop-mobtab::-webkit-scrollbar{display:none}.pop-mobtab button{flex:1;min-width:max-content;padding:8px 10px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:11px;font-weight:600;cursor:pointer;border-radius:2px;min-height:44px}.pop-mobtab button.pop-mobtab--on{color:${theme.CREAM};box-shadow:inset 0 -2px 0 ${theme.SPICE}}.pop-main{padding:18px 12px calc(72px + env(safe-area-inset-bottom,0px))}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}}
.pop-table{width:100%;border-collapse:collapse;font-size:13px}
.pop-th{text-align:left;padding:8px 6px;font-family:${UI};font-size:11px;font-weight:600;letter-spacing:.7px;text-transform:uppercase;color:${MUTED};border-bottom:1px solid ${BORDER}}
.pop-th--r{text-align:right}
.pop-td{padding:10px 6px;border-bottom:1px solid ${CREAM};vertical-align:top}
.pop-td--r{text-align:right;font-family:${MONO};font-variant-numeric:tabular-nums}
.pop-tfoot td{font-weight:700;border-top:1px solid ${BORDER}}
@media(max-width:390px){
  .pop-table .pop-th{white-space:normal;line-height:1.25;font-size:9px;padding:6px 3px}
  .pop-table .pop-td{font-size:12px;padding:8px 3px}
  .pop-orders-grid{display:block}
  .pop-orders-grid thead{display:none}
  .pop-orders-grid tbody tr{display:block;border:1px solid ${BORDER};border-radius:2px;margin-bottom:10px;padding:10px 12px;background:${CARDBG}}
  .pop-orders-grid tbody td{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border:none;text-align:right}
  .pop-orders-grid tbody td::before{content:attr(data-label);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:left;flex-shrink:0}
  .pop-orders-grid .pop-order-client{display:block;width:100%;text-align:left;padding-bottom:6px;border-bottom:1px solid ${CREAM};margin-bottom:4px}
  .pop-orders-grid .pop-order-client::before{display:none}
  .pop-orders-grid .pop-hide-phone{display:none}
  .pop-cal-grid{font-size:10px}
  .pop-cal-cell{min-height:36px;padding:2px 1px}
}
.pop-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;width:100%}
.pop-cal-dow{font-size:10px;font-weight:600;text-transform:uppercase;color:${MUTED};text-align:center;padding:4px 0}
.pop-cal-cell{min-height:44px;border:1px solid ${CREAM};border-radius:2px;padding:3px 2px;text-align:center;font-family:${MONO};font-size:11px;background:${CARDBG}}
.pop-cal-cell--muted{background:transparent;border-color:transparent;color:transparent}
.pop-cal-cell--due{cursor:pointer;border-color:${BORDER}}
.pop-cal-cell--due:hover{box-shadow:inset 0 0 0 1px ${theme.SPICE}}
`
