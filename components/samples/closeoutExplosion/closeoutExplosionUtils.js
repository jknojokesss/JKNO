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

export const UI = "'DM Sans', system-ui, sans-serif"
export const MONO = UI

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
body{background:${theme.CREAM};font-family:${UI};font-variant-numeric:tabular-nums;color:${theme.INK};overflow-x:hidden}
.ce-shell{display:flex;min-height:100vh;align-items:stretch;max-width:100vw;overflow-x:hidden}
.ce-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.ce-nav{display:flex;flex-direction:column;gap:3px}.ce-nav--main{flex:1}
.ce-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.ce-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.ce-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px;overflow-x:hidden}
.ce-click{transition:box-shadow .12s}.ce-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.ce-table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}
.ce-table th{font-family:${MONO};font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:right;padding:8px 6px;border-bottom:1px solid ${BORDER}}
.ce-table th.ce-th-left{text-align:left}
.ce-table td{font-family:${MONO};font-size:12px;padding:10px 6px;border-top:1px solid ${BORDER};text-align:right;vertical-align:top;word-break:break-word}
.ce-table td.ce-td-left{text-align:left;font-family:${UI};font-size:13px}
.ce-table tr.ce-rowbtn{cursor:pointer}
.ce-table tr.ce-rowbtn:hover td{background:rgba(200,70,44,.04)}
.ce-total td{font-weight:700;border-top:2px solid ${BORDER}}
.ce-detail{max-width:640px;width:100%}
.ce-back{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:${MUTED};font-family:${UI};font-size:13px;font-weight:600;cursor:pointer;padding:0 0 14px;min-height:40px;text-decoration:underline;text-underline-offset:3px}
.ce-back:hover{color:${INK}}
.ce-invoice-overlay{position:fixed;inset:0;background:rgba(43,32,24,.45);z-index:40;display:flex;align-items:flex-end;justify-content:center;padding:12px}
@media(min-width:520px){.ce-invoice-overlay{align-items:center;padding:24px}}
.ce-invoice-panel{background:${CARDBG};border:1px solid ${BORDER};border-radius:2px;width:100%;max-width:420px;max-height:90vh;overflow:auto;padding:20px;box-shadow:0 8px 32px rgba(43,32,24,.18)}
.ce-invoice-panel h3{font-size:18px;font-weight:700;margin:0 0 12px}
.ce-btn-secondary{margin-top:16px;width:100%;padding:10px 14px;border:1px solid ${BORDER};background:transparent;font-family:${UI};font-size:14px;font-weight:600;cursor:pointer;border-radius:2px;color:${INK}}
.ce-btn-secondary:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.ce-btn-primary{margin-top:10px;padding:8px 12px;border:1px solid ${theme.SPICE};background:${theme.SPICE};color:#fff;font-family:${UI};font-size:13px;font-weight:600;cursor:pointer;border-radius:2px}
.ce-status-line{font-size:13px;color:${MUTED};margin:8px 0 0}
.ce-table-wrap{width:100%;max-width:100%}
.ce-stack-only{display:none;width:100%;max-width:100%}
.ce-stack-row{display:block;width:100%;text-align:left;border:none;border-top:1px solid ${BORDER};background:transparent;padding:12px 0;cursor:pointer;font:inherit;color:inherit}
.ce-stack-row:first-child{border-top:none}
.ce-stack-row.ce-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
.ce-stack-title{font-size:13px;line-height:1.35;color:${INK}}
.ce-stack-title strong{font-weight:700}
.ce-stack-sub{font-size:11px;color:${MUTED};margin-top:3px;font-family:${MONO}}
.ce-stack-grid{display:grid;gap:8px 10px;margin-top:10px}
.ce-stack-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.ce-stack-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.ce-stack-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.ce-stack-kv{min-width:0}
.ce-stack-kv .k{display:block;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:${MUTED};margin-bottom:2px}
.ce-stack-kv .v{display:block;font-family:${MONO};font-size:11px;color:${INK};line-height:1.2}
.ce-stack-row-total{font-weight:700}
.ce-stack-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.ce-pnl-stack-row{border-top:1px solid ${BORDER};padding:12px 0}
.ce-pnl-stack-row:first-child{border-top:none}
.ce-pnl-stack-label{font-size:13px;font-weight:600;color:${INK};margin-bottom:8px}
.ce-pnl-stack-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.ce-pnl-stack-cols .k{font-size:9px;text-transform:uppercase;color:${MUTED};margin-bottom:2px}
.ce-pnl-stack-cols .v{font-family:${MONO};font-size:11px}
.ce-kpi-lbl{padding-right:22px;line-height:1.3}
@media(max-width:860px){.ce-shell{flex-direction:column}.ce-side{width:100%;max-width:100%;height:auto;position:static;padding:14px 12px 10px;overflow:hidden}.ce-nav--main{flex-direction:row;flex-wrap:wrap;overflow:visible;gap:4px;padding:4px 2px 10px;max-width:100%}.ce-navbtn{width:auto;flex:1 1 calc(33.333% - 4px);min-width:0;padding:7px 6px;border-radius:2px;background:rgba(255,255,255,.07);font-size:10px;min-height:36px;white-space:normal;text-align:center;line-height:1.2}.ce-main{padding:18px 12px 52px;max-width:100%}}
@media(max-width:480px){.ce-table-wrap{display:none!important}.ce-stack-only{display:block!important}.ce-navbtn{font-size:10px;padding:6px 7px}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}}
.ce-buyer-label{display:block;min-width:0}
.ce-buyer-name{display:block;font-weight:600;font-size:13px;line-height:1.3;overflow:hidden;text-overflow:ellipsis}
.ce-buyer-type{display:block;font-size:12px;font-weight:400;color:${MUTED};margin-top:2px;line-height:1.25}
.ce-table.ce-compact .ce-buyer-type{display:none}`
