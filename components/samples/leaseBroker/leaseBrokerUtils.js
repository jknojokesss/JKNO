/** Parkway Lease Brokers sample — tokens and formatters. */

export const SIDEBAR = '#1A1F2E'
export const ACCENT = '#2F5F9E'
export const ACCENT_LIGHT = '#EEF2F7'
export const PAPER = '#F4F5F7'
export const CARDBG = '#FFFFFF'
export const INK = '#1A1F2E'
export const MUTED = '#6B7280'
export const BORDER = '#E5E7EB'
export const GREEN = '#2F6F4E'
export const AMBER = '#92400E'
export const STALE_BG = '#FAF6EE'

export const UI = "'DM Sans', system-ui, sans-serif"
export const LOCALE = 'en-US'
export const TZ = 'America/New_York'

const intFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const moneyFmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const mfFmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 5, maximumFractionDigits: 5 })

export const money = (n) => {
  if (n == null || Number.isNaN(n)) return '—'
  const v = Math.round(n)
  if (v < 0) return '−$' + intFmt.format(Math.abs(v))
  return '$' + moneyFmt.format(v)
}

export const moneyOrDash = (n, ready) => (ready ? money(n) : '—')

export const fmtD = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00.000Z`)
  )
}

export const fmtDShort = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T12:00:00.000Z`)
  )
}

export const fmtPhone = (p) => {
  if (!p) return '—'
  const d = String(p).replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return p
}

export const fmtMf = (n) => mfFmt.format(n)

export const vehicleLabel = (v) => {
  if (!v) return '—'
  const base = [v.make, v.model, v.trim].filter(Boolean).join(' ')
  const terms = `${(v.miles_per_year || 0).toLocaleString(LOCALE)} mi/yr · ${v.term_months} mo`
  const down = v.down > 0 ? ` · $${intFmt.format(v.down)} down` : ''
  return `${base} (${terms}${down})`
}

export const STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'signed', label: 'Signed' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'fee_paid', label: 'Fee paid' },
]

export const stageLabel = (id) => STAGES.find((s) => s.id === id)?.label || id

export const SHELL_CSS = `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;overflow-x:hidden}
body{background:${PAPER};font-family:${UI};font-size:14px;font-weight:400;line-height:1.4;color:${INK};overflow-x:hidden}
.lb-shell{font-family:${UI};font-size:14px;line-height:1.4;color:${INK}}
.lb-shell button,.lb-shell input,.lb-shell select,.lb-shell textarea{font-family:${UI}}
.lb-num,.lb-tabnum{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.lb-shell td.lb-num,.lb-shell th.lb-num,.lb-quote-grid dd,.lb-kpi-val{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.lb-page-title{font-size:28px;font-weight:600;line-height:1.2;margin:0}
.lb-sample-line{font-size:12px;font-weight:400;color:${MUTED};margin-top:8px}
.lb-section-h{font-size:20px;font-weight:600;line-height:1.2;margin:0 0 8px;color:${INK}}
.lb-card-title{font-size:16px;font-weight:500;line-height:1.4;color:${INK}}
.lb-meta{font-size:12px;font-weight:400;color:${MUTED}}
.lb-shell{display:flex;min-height:100vh;align-items:stretch;max-width:100vw;overflow-x:hidden}
.lb-side{width:236px;flex-shrink:0;background:${SIDEBAR};color:#E8EAED;display:flex;flex-direction:column;padding:20px 16px;min-width:0}
.lb-brand{font-size:16px;font-weight:600;line-height:1.2;color:#F4F5F7;border:none;background:transparent;padding:0;cursor:pointer;text-align:left;width:100%;margin-bottom:16px}
.lb-side .lb-nav{display:flex;flex-direction:column;gap:4px}
.lb-side .lb-navbtn{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:6px;border:none;background:transparent;color:#9CA3AF;font-size:14px;font-weight:500;line-height:1.4;cursor:pointer;white-space:nowrap}
.lb-side .lb-navbtn:hover{background:rgba(255,255,255,.08);color:#fff}
.lb-side .lb-navbtn--active{background:rgba(255,255,255,.1);color:#fff}
.lb-side-add{margin-top:auto;padding-top:16px}
.lb-main{flex:1;min-width:0;max-width:1180px;padding:24px 20px 48px;overflow-x:hidden}
.lb-page-head{margin-bottom:24px}
.lb-card{background:${CARDBG};border:1px solid ${BORDER};border-radius:6px;padding:20px;margin-bottom:16px;max-width:100%}
.lb-card--flush{padding:0;overflow:hidden}
.lb-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}
.lb-table--wide{min-width:640px}
.lb-btn{font-size:14px;font-weight:500;line-height:1.4;padding:8px 14px;min-height:40px;border-radius:6px;border:1px solid ${BORDER};background:${CARDBG};color:${INK};cursor:pointer}
.lb-btn--primary{background:${ACCENT};border-color:${ACCENT};color:#fff}
.lb-btn--quiet{background:transparent;border-color:${BORDER};color:${INK}}
.lb-btn--ghost{background:transparent;border:none;padding:0;min-height:0;color:${INK}}
.lb-link-btn{display:inline;border:none;background:transparent;padding:0;margin:0;font:inherit;font-weight:500;color:${INK};cursor:pointer;text-decoration:none}
.lb-link-btn:hover{text-decoration:underline}
.lb-inp{font-size:14px;font-weight:400;padding:8px 12px;border:1px solid ${BORDER};border-radius:6px;width:100%;min-height:40px;line-height:1.4}
.lb-table{width:100%;border-collapse:collapse;font-size:14px}
.lb-table th,.lb-table td{padding:8px;border-bottom:1px solid ${BORDER};text-align:left;vertical-align:top;line-height:1.4}
.lb-table th{font-size:12px;font-weight:500;color:${MUTED};letter-spacing:normal;text-transform:none}
.lb-table .lb-num{text-align:right;white-space:nowrap;font-weight:500}
.lb-status{display:inline-block;font-size:12px;font-weight:500;line-height:1.3;padding:2px 6px;border-radius:4px;vertical-align:middle}
.lb-status--neutral{background:#F3F4F6;color:#4B5563}
.lb-status--accent{background:${ACCENT_LIGHT};color:${ACCENT}}
.lb-status--ok{background:#ECFDF3;color:${GREEN}}
.lb-status--warn{background:${STALE_BG};color:${AMBER}}
.lb-kpi-val{font-size:20px;font-weight:600;line-height:1.2}
.lb-show-mobile{display:none}
.lb-stack{display:flex;flex-direction:column}
.lb-stack-row{padding:16px;border-bottom:1px solid ${BORDER}}
.lb-stack-row:last-child{border-bottom:none}
.lb-stack-line1{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:16px;font-weight:500}
.lb-stack-line2{font-size:14px;color:${MUTED};margin-top:4px;line-height:1.4}
.lb-stack-line3{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;font-size:14px}
.lb-client-run{line-height:1.5}
.lb-client-item{display:inline;white-space:nowrap}
.lb-quote-stack{display:flex;flex-direction:column;gap:8px}
.lb-quote-card{border:1px solid ${BORDER};border-radius:6px;padding:16px;font-size:14px}
.lb-quote-card--stale{background:${STALE_BG}}
.lb-quote-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:8px;font-size:14px}
.lb-quote-grid dt{font-size:12px;font-weight:500;color:${MUTED};letter-spacing:normal;text-transform:none}
.lb-quote-grid dd{font-weight:500;margin:0}
.lb-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-items:start}
.lb-col{min-width:0;background:${CARDBG};border:1px solid ${BORDER};border-radius:6px;padding:8px}
.lb-col-h{font-size:12px;font-weight:500;color:${MUTED};padding:8px 4px;border-bottom:1px solid ${BORDER};margin-bottom:8px;line-height:1.4}
.lb-card-deal{border:1px solid ${BORDER};border-radius:6px;padding:12px;margin-bottom:8px;background:#fff;cursor:grab;font-size:14px;line-height:1.4}
.lb-card-deal:active{cursor:grabbing}
.lb-modal-back{position:fixed;inset:0;background:rgba(26,31,46,.45);z-index:100;display:flex;align-items:flex-end;justify-content:center;padding:16px}
.lb-modal-title{font-size:20px;font-weight:600;line-height:1.2;margin-bottom:16px;color:${INK}}
.lb-field{margin-bottom:12px}
.lb-field label{display:block;font-size:12px;font-weight:500;color:${MUTED};margin-bottom:4px}
@media(min-width:520px){.lb-modal-back{align-items:center}}
.lb-modal{background:${CARDBG};border-radius:8px;max-width:440px;width:100%;max-height:90vh;overflow:auto;padding:20px;border:1px solid ${BORDER}}
.lb-search{margin-bottom:16px}
.lb-mobile-top{display:none}
.lb-tabbar{display:none}
@media(min-width:861px){
.lb-side{align-self:stretch;position:sticky;top:0;min-height:100vh;height:auto;overflow-y:auto}
.lb-side .lb-navbtn--active{box-shadow:inset 3px 0 0 ${ACCENT}}
.lb-main{padding:24px 30px 48px}
}
@media(min-width:861px) and (max-width:1100px){.lb-board{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:860px){
.lb-shell{flex-direction:column;padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))}
.lb-side--desktop{display:none}
.lb-mobile-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:${CARDBG};border-bottom:1px solid ${BORDER};position:sticky;top:0;z-index:20}
.lb-mobile-top .lb-brand{color:${INK};margin:0;font-size:16px;font-weight:600;flex:1;min-width:0}
.lb-mobile-top .lb-btn--primary{white-space:nowrap;font-size:14px;font-weight:500;padding:8px 14px;min-height:36px;height:36px;flex-shrink:0;line-height:1.2}
.lb-main{padding:16px 16px 24px;max-width:100%}
.lb-card{padding:16px}
.lb-board{grid-template-columns:1fr;gap:12px}
.lb-tabbar{display:flex;flex-direction:row;align-items:stretch;position:fixed;left:0;right:0;bottom:0;z-index:30;width:100%;max-width:100vw;background:#fff;border-top:1px solid ${BORDER};padding:0;padding-bottom:env(safe-area-inset-bottom,0px);min-height:56px;height:calc(56px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
.lb-tabbar .lb-navbtn{flex:1 1 0;width:auto;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px 8px;min-height:56px;height:auto;text-align:center;color:${MUTED};border-radius:0;border:none;background:transparent;box-shadow:none;white-space:nowrap}
.lb-tabbar .lb-navbtn:hover{background:transparent;color:${MUTED}}
.lb-tabbar .lb-navbtn--active{color:${ACCENT};background:transparent;box-shadow:none}
.lb-tab-label{font-size:12px;font-weight:500;line-height:1.2}
}
@media(max-width:640px){.lb-show-desktop{display:none!important}.lb-show-mobile{display:block!important}}
@media(min-width:641px){.lb-show-mobile{display:none!important}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}}`
