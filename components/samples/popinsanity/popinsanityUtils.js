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
export const STONE = '#C9C4B8'

export const UI = "'DM Sans', system-ui, sans-serif"
export const MONO = UI

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

/** Main KPI figure for revenue / profit lines (not brand accent). */
export function kpiValueColor(delta, { cost = false } = {}) {
  if (delta == null || Math.abs(delta) < 0.005) return INK
  return changeColor(delta, { cost })
}

export const tierShort = (tierId) => {
  const n = tierId?.replace(/^t/, '')
  return n ? `Tier ${n}` : tierId
}

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK}}
.pop-shell td,.pop-shell th,.pop-kpi-val{font-variant-numeric:tabular-nums}
.pop-shell{display:flex;min-height:100vh;align-items:stretch;font-variant-numeric:tabular-nums}
.pop-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.pop-wordmark{font-family:${UI};font-weight:800;font-size:17px;letter-spacing:0.12em;color:${theme.CREAM};line-height:1.2;padding:4px 8px 0}
.pop-nav{display:flex;flex-direction:column;gap:3px}.pop-nav--main{flex:1}
.pop-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.pop-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.pop-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px;overflow-x:hidden}
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
.pop-order-sub{display:none}
.pop-tier-cards,.pop-order-cards{display:none}
@media(max-width:480px){
  .pop-tier-table-wrap,.pop-order-table-wrap{display:none!important}
  .pop-tier-cards,.pop-order-cards{display:block}
  .pop-order-sub{display:block;font-size:11px;color:${MUTED};margin-top:2px}
  .pop-corp-detail-table thead{display:none}
  .pop-corp-detail-table tbody tr{display:block;border-bottom:1px solid ${CREAM};padding:10px 0}
  .pop-corp-detail-table tbody td{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border:none}
  .pop-corp-detail-table .pop-corp-client{display:block;width:100%;text-align:left}
  .pop-corp-detail-table .pop-corp-client::before{display:none}
  .pop-corp-detail-table .pop-corp-hide-phone{display:none}
  .pop-corp-detail-table tfoot tr{display:flex;flex-wrap:wrap;justify-content:space-between;padding-top:10px;border-top:1px solid ${BORDER}}
  .pop-corp-detail-table tfoot td{border:none;padding:4px 0}
}
.pop-tier-card,.pop-order-card{border:1px solid ${BORDER};border-radius:2px;padding:14px;margin-bottom:10px;background:${CARDBG};cursor:pointer;text-align:left;width:100%;font:inherit;color:inherit}
.pop-tier-card:hover,.pop-order-card:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.pop-card-title,.pop-client-name{font-weight:700;font-size:14px;color:${INK};margin-bottom:10px;white-space:normal;overflow-wrap:normal;word-break:normal;max-width:100%;line-height:1.35}
.pop-credit-link{color:${MUTED};font-size:12px;font-weight:500;text-decoration:none;font-family:${UI}}
.pop-credit-link:hover{text-decoration:underline}
.pop-order-card .pop-card-title{margin-bottom:4px}
.pop-table .pop-client-name{font-weight:600;font-size:13px}
.pop-corp-client .pop-client-name{font-weight:600;margin-bottom:2px}
.pop-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}
.pop-card-k{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${MUTED}}
.pop-card-v{font-family:${MONO};font-size:13px;color:${INK};text-align:right;margin-top:2px}
@media(max-width:390px){
  .pop-cal-grid{font-size:10px}
  .pop-cal-cell{min-height:36px;padding:2px 1px}
}
.pop-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;width:100%}
.pop-cal-dow{font-size:10px;font-weight:600;text-transform:uppercase;color:${MUTED};text-align:center;padding:4px 0}
.pop-cal-cell{min-height:44px;border:1px solid ${CREAM};border-radius:2px;padding:3px 2px;text-align:center;font-family:${MONO};font-size:11px;background:${CARDBG}}
.pop-cal-cell--muted{background:transparent;border-color:transparent;color:transparent}
.pop-cal-cell--due{cursor:pointer;border-color:${BORDER}}
.pop-cal-cell--due:hover{box-shadow:inset 0 0 0 1px ${theme.SPICE}}
.pop-board-summary{border:1px solid ${BORDER};background:${CARDBG}}
.pop-board-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 14px}
.pop-board-summary-val{font-size:15px;font-weight:600;text-align:right;font-variant-numeric:tabular-nums;color:${INK}}
@media(max-width:600px){.pop-board-summary-grid{grid-template-columns:1fr 1fr}}
.pop-board-filter{display:none;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.pop-board-filter button{border:1px solid ${BORDER};background:${CARDBG};color:${MUTED};font-family:${UI};font-size:12px;font-weight:600;padding:8px 10px;border-radius:2px;cursor:pointer;min-height:40px}
.pop-board-filter button.pop-board-filter--on{color:${INK};box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.pop-board-desktop{display:block}
.pop-board-mobile{display:none}
.pop-board-cols{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;align-items:start}
.pop-board-col{min-width:0;background:${CARDBG};border:1px solid ${BORDER};border-radius:2px}
.pop-board-col-head{padding:10px 10px 8px;border-bottom:1px solid ${CREAM}}
.pop-board-col-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};line-height:1.3;margin-bottom:6px}
.pop-board-col-meta{display:flex;justify-content:space-between;gap:6px;font-size:13px;font-weight:600;color:${INK};font-variant-numeric:tabular-nums}
.pop-board-col-amt{font-weight:400;text-align:right}
.pop-board-col-body{padding:8px;display:flex;flex-direction:column;gap:8px;max-height:70vh;overflow-y:auto}
.pop-board-card{border:1px solid ${BORDER};border-radius:2px;padding:10px;background:#fff;width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit}
.pop-board-card:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.pop-board-card-title{font-size:13px;margin-bottom:8px;line-height:1.3}
.pop-board-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 8px}
.pop-board-card-span{grid-column:1/-1}
.pop-board-num{font-size:12px;font-weight:400}
.pop-board-num--left{text-align:left}
.pop-board-mobile-group{margin-bottom:12px;padding:12px!important}
.pop-board-mobile-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid ${CREAM}}
@media(max-width:900px){
  .pop-board-desktop{display:none}
  .pop-board-mobile{display:block}
  .pop-board-filter{display:flex}
}
@media(min-width:901px){
  .pop-board-cols{gap:8px}
  .pop-board-col-title{font-size:10px}
}
`
