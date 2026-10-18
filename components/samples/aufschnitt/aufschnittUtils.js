/** Aufschnitt sample portal tokens — aligned with Primal Krisp / Jerky look. */
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

export const UI = "'DM Sans', system-ui, sans-serif"
export const MONO = UI

export const AU_LOCALE = 'en-US'
export const AU_TZ = 'America/New_York'

const intFormatter = new Intl.NumberFormat(AU_LOCALE, { maximumFractionDigits: 0 })
const moneyFormatter = new Intl.NumberFormat(AU_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const fmtInt = (n) => intFormatter.format(Math.round(n))

/** Case counts: whole numbers or one decimal — never fake two-decimal precision. */
export const fmtCases = (n) => {
  const t = Math.round(n * 10) / 10
  if (Math.abs(t - Math.round(t)) < 0.05) return String(Math.round(t))
  return t.toFixed(1)
}

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

const asOfDateFormatter = new Intl.DateTimeFormat(AU_LOCALE, {
  timeZone: AU_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return asOfDateFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

const weekEndingFormatter = new Intl.DateTimeFormat(AU_LOCALE, {
  timeZone: AU_TZ,
  month: 'short',
  day: 'numeric',
})

export const fmtWeekEnding = (iso) => {
  if (!iso) return '—'
  return `Week ending ${weekEndingFormatter.format(new Date(`${iso}T12:00:00.000Z`))}`
}

/** Sample order dates in copy: "Sep 18" */
export const fmtMonthDay = (iso) => {
  if (!iso) return '—'
  return weekEndingFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

export const centsEqual = (a, b) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) === 0

export const roundCents = (n) => Math.round(n * 100) / 100

export const sumCents = (arr, fn = (x) => x) =>
  roundCents(arr.reduce((s, x) => s + fn(x), 0))

/** Allocate `total` across keys by weight; remainder cent goes to largest weight key. */
export function allocateByWeight(total, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  const wSum = entries.reduce((s, [, w]) => s + w, 0)
  if (wSum <= 0 || entries.length === 0) return {}
  const raw = entries.map(([k, w]) => [k, (total * w) / wSum])
  const floored = raw.map(([k, v]) => [k, Math.floor(v * 100) / 100])
  let rem = Math.round(total * 100) - floored.reduce((s, [, v]) => s + Math.round(v * 100), 0)
  const sorted = [...floored].sort((a, b) => b[1] - a[1])
  const out = {}
  sorted.forEach(([k, v], i) => {
    const add = i < rem ? 0.01 : 0
    out[k] = roundCents(v + add)
  })
  return out
}

export const changeColor = (delta, { cost = false } = {}) => {
  if (delta == null || delta === 0) return MUTED
  if (delta > 0) return cost ? RED : GREEN
  return cost ? GREEN : RED
}

export const pctChange = (cur, prior) => (prior > 0 ? ((cur - prior) / prior) * 100 : 0)

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK};overflow-x:hidden}
.au-shell td,.au-shell th,.au-kpi-val{font-variant-numeric:tabular-nums}
.au-shell{max-width:100%;overflow-x:hidden;font-variant-numeric:tabular-nums}
.au-prospect-credit{margin:0;padding:10px 16px 0;max-width:1180px;font-family:${UI};font-size:11px;font-weight:500;color:${MUTED};line-height:1.35;background:${theme.CREAM}}
.au-prospect-credit__link{color:inherit;text-decoration:none;font-weight:inherit}
.au-prospect-credit__link:hover{text-decoration:underline}
@media(min-width:861px){.au-prospect-credit{padding:10px 30px 0;margin:0 auto}}
.au-shell{display:flex;min-height:100vh;align-items:stretch}
.au-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.au-nav{display:flex;flex-direction:column;gap:3px}.au-nav--main{flex:1}
.au-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.au-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.au-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.au-click{transition:box-shadow .12s}.au-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.au-brand-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.au-pill{padding:8px 14px;min-height:40px;border-radius:18px;border:1px solid ${BORDER};background:${CARDBG};color:${MUTED};font-family:${UI};font-size:13px;font-weight:600;cursor:pointer}
.au-pill--on{background:${CHAR};color:${CREAM};border-color:${CHAR}}
.au-detail-back{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:${SPICE};font-family:${UI};font-size:14px;font-weight:600;cursor:pointer;padding:0 0 14px;min-height:40px}
@media(max-width:860px){.au-shell{flex-direction:column}.au-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.au-nav--main{flex-direction:row;flex-wrap:nowrap;justify-content:space-between;overflow-x:visible;gap:4px;padding:4px 2px 10px;width:100%}.au-navbtn{width:auto;flex:1 1 0;min-width:0;padding:8px 6px;border-radius:2px;background:rgba(255,255,255,.07);flex-shrink:1;font-size:12px;min-height:40px;text-align:center;white-space:nowrap}.au-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}.au-nav--main .au-navbtn{font-size:11px;padding:8px 4px}}`

export const PNL_SHEET_CSS = `
.au-pnl-wrap{
  --au-pnl-c1:6.75rem;--au-pnl-c2:6.75rem;--au-pnl-c3:6.25rem;--au-pnl-gap:8px;
  --au-pnl-fs:12px;--au-pnl-fs-cur:13px;--au-pnl-fs-head:10px;
}
@media(max-width:480px){
  .au-pnl-wrap{
    --au-pnl-c1:4.75rem;--au-pnl-c2:4.75rem;--au-pnl-c3:4.25rem;--au-pnl-gap:6px;
    --au-pnl-fs:10px;--au-pnl-fs-cur:10px;--au-pnl-fs-head:9px;
  }
  .au-pnl-label{font-size:12px}
}
@media(min-width:481px) and (max-width:900px){
  .au-pnl-wrap{
    --au-pnl-c1:6rem;--au-pnl-c2:6rem;--au-pnl-c3:5.5rem;
  }
}
@media(min-width:1024px){
  .au-pnl-wrap{
    --au-pnl-c1:7.25rem;--au-pnl-c2:7.25rem;--au-pnl-c3:6.75rem;
  }
}
.au-pnl-head,.au-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--au-pnl-c1) var(--au-pnl-c2) var(--au-pnl-c3);
  column-gap:var(--au-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.au-pnl-line--solo{grid-template-columns:minmax(0,1fr) var(--au-pnl-c1)}
.au-pnl-head{padding:0 6px 8px;font-size:var(--au-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.au-pnl-line{padding:8px 6px;border-radius:2px}
.au-pnl-line--indent{padding:4px 6px 4px 0}
.au-pnl-line--indent .au-pnl-label{padding-left:20px}
.au-pnl-line--sub{border-top:1px solid ${BORDER}}
.au-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.au-pnl-num{
  font-family:${MONO};font-size:var(--au-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;
  font-variant-numeric:tabular-nums;
}
.au-pnl-num--cur{font-size:var(--au-pnl-fs-cur)}
.au-pnl-head .au-pnl-num{font-size:var(--au-pnl-fs-head);font-family:${UI};font-weight:600;overflow:visible}
`

export const AGING_CSS = `
.au-aging{width:100%;border-collapse:collapse;font-size:13px}
.au-aging th,.au-aging td{padding:8px 4px;text-align:right;font-variant-numeric:tabular-nums}
.au-aging th:first-child,.au-aging td:first-child{text-align:left}
.au-aging thead th{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};border-bottom:1px solid ${BORDER}}
.au-aging tbody tr{border-bottom:1px solid ${CREAM}}
.au-aging .au-aging-acct{font-weight:600;color:${INK};white-space:normal;line-height:1.35;max-width:10.5rem}
.au-aging th:not(:first-child),.au-aging td:not(:first-child){white-space:nowrap}
@media(max-width:480px){
  .au-aging--full{display:none}
  .au-aging-cards{display:flex;flex-direction:column;gap:10px}
  .au-aging-card{border:1px solid ${BORDER};border-radius:2px;padding:12px;background:${CARDBG}}
  .au-aging-card-title{font-weight:700;margin-bottom:8px;font-size:14px;line-height:1.35;word-break:break-word}
  .au-aging-card-row{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:3px 0}
}
@media(min-width:481px){
  .au-aging-cards{display:none}
}
`

export const PROFIT_TABLE_CSS = `
.au-profit-ship-note{
  display:block;width:100%;text-align:left;border:none;background:transparent;
  font-family:${UI};font-size:13px;color:${MUTED};padding:0 0 14px;cursor:pointer;
}
.au-profit-table-wrap{overflow-x:auto}
.au-profit-table{width:100%;border-collapse:collapse;font-size:13px;font-weight:400}
.au-profit-table th,.au-profit-table td{padding:8px 6px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.au-profit-table th:first-child,.au-profit-table td:first-child{text-align:left}
.au-profit-table thead th{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};border-bottom:1px solid ${BORDER}}
.au-profit-table tbody tr{border-bottom:1px solid ${CREAM};cursor:pointer}
.au-profit-table .au-profit-ch{font-weight:600;color:${INK}}
.au-profit-table .au-profit-total{font-weight:600;border-top:2px solid ${BORDER}}
.au-profit-cards{display:none}
@media(max-width:720px){
  .au-profit-table-wrap{display:none}
  .au-profit-cards{display:flex;flex-direction:column;gap:10px;margin-top:4px}
  .au-profit-card{border:1px solid ${BORDER};border-radius:2px;padding:14px;background:${CARDBG};text-align:left;cursor:pointer;width:100%}
  .au-profit-card-row{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:3px 0;font-variant-numeric:tabular-nums}
}
.au-profit-orders-wrap{overflow-x:auto}
.au-profit-orders{width:100%;border-collapse:collapse;font-size:12px}
.au-profit-orders th,.au-profit-orders td{padding:7px 4px;text-align:right;font-variant-numeric:tabular-nums}
.au-profit-orders th:first-child,.au-profit-orders td:first-child,.au-profit-orders .au-profit-cust,.au-profit-orders .au-profit-items{text-align:left}
.au-profit-orders .au-profit-items{max-width:9rem;white-space:normal;line-height:1.35}
.au-profit-orders thead th{font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:${MUTED};border-bottom:1px solid ${BORDER}}
.au-profit-orders tbody tr{border-bottom:1px solid ${CREAM};cursor:pointer}
.au-profit-order-cards{display:none}
@media(max-width:720px){
  .au-profit-orders-wrap{display:none}
  .au-profit-order-cards{display:flex;flex-direction:column;gap:8px}
  .au-profit-order-card{border:1px solid ${BORDER};border-radius:2px;padding:12px;background:${CARDBG};text-align:left;width:100%;cursor:pointer}
}
`

export const CHANNEL_ROW_CSS = `
.au-ch-row{
  display:grid;grid-template-columns:minmax(0,1fr) 4.5rem 5.5rem 1rem;
  column-gap:10px;align-items:center;width:100%;padding:10px 6px;border:none;border-top:1px solid ${CREAM};
  background:transparent;cursor:pointer;text-align:left;
}
@media(max-width:480px){
  .au-ch-row{grid-template-columns:minmax(0,1fr) 3.75rem 4.75rem 1rem;column-gap:8px}
}
.au-ch-amt,.au-ch-pct{font-family:${MONO};font-size:13px;text-align:right;font-variant-numeric:tabular-nums}
`
