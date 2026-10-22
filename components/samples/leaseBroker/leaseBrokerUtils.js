/** Parkway Lease Brokers sample — tokens and formatters. */

export const SIDEBAR = '#1A1F2E'
export const ACCENT = '#2F5F9E'
export const ACCENT_LIGHT = '#E8EFF8'
export const PAPER = '#F4F5F7'
export const CARDBG = '#FFFFFF'
export const INK = '#1A1F2E'
export const MUTED = '#6B7280'
export const BORDER = '#E2E5EB'
export const GREEN = '#2F6F4E'
export const RED = '#C0392B'
export const AMBER = '#B8860B'
export const STALE_BG = '#FEF6E8'
export const STALE_BORDER = '#E8C97A'

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
body{background:${PAPER};font-family:${UI};color:${INK};overflow-x:hidden}
.lb-shell td,.lb-shell th,.lb-num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.lb-shell{display:flex;min-height:100vh;align-items:stretch;max-width:100vw;overflow-x:hidden}
.lb-shell button{font-variant-numeric:tabular-nums;font-family:${UI}}
.lb-side{width:236px;flex-shrink:0;background:${SIDEBAR};color:#E8EAED;display:flex;flex-direction:column;padding:22px 14px;min-width:0}
.lb-nav{display:flex;flex-direction:column;gap:3px}
.lb-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#9CA3AF;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.lb-navbtn:hover{background:rgba(255,255,255,.08);color:#fff}
.lb-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px;overflow-x:hidden}
.lb-card{background:${CARDBG};border:1px solid ${BORDER};border-radius:4px;padding:18px 20px;margin-bottom:14px;max-width:100%}
.lb-card--flush{padding:0;overflow:hidden}
.lb-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}
.lb-table--wide{min-width:640px}
.lb-lbl{font-family:${UI};font-size:11px;font-weight:600;letter-spacing:.65px;text-transform:uppercase;color:${MUTED}}
.lb-btn{font-family:${UI};font-size:13px;font-weight:600;padding:9px 14px;min-height:40px;border-radius:4px;border:1px solid ${BORDER};background:${CARDBG};color:${INK};cursor:pointer}
.lb-btn--primary{background:${ACCENT};border-color:${ACCENT};color:#fff}
.lb-btn--ghost{background:transparent}
.lb-inp{font-family:${UI};font-size:14px;padding:9px 11px;border:1px solid ${BORDER};border-radius:4px;width:100%;min-height:40px}
.lb-table{width:100%;border-collapse:collapse;font-size:13px}
.lb-table th,.lb-table td{padding:10px 8px;border-bottom:1px solid ${BORDER};text-align:left;vertical-align:top}
.lb-table th{font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:${MUTED}}
.lb-table .lb-num{text-align:right;white-space:nowrap}
.lb-tag{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;padding:2px 8px;border-radius:10px;vertical-align:middle;line-height:1.25}
.lb-stage-pill{display:inline-block;font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;padding:4px 10px;border-radius:999px;line-height:1.2;white-space:nowrap;align-self:flex-start;flex-shrink:0}
.lb-show-mobile{display:none}
.lb-stack{display:flex;flex-direction:column}
.lb-stack-row{padding:12px 16px;border-bottom:1px solid ${BORDER}}
.lb-stack-row:last-child{border-bottom:none}
.lb-stack-line1{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px;font-weight:600}
.lb-stack-line2{font-size:13px;color:${MUTED};margin-top:4px;line-height:1.35}
.lb-stack-line3{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;font-size:13px}
.lb-quote-stack{display:flex;flex-direction:column;gap:10px}
.lb-quote-card{border:1px solid ${BORDER};border-radius:4px;padding:12px;font-size:13px}
.lb-quote-card--stale{background:${STALE_BG};border-color:${STALE_BORDER}}
.lb-quote-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:8px;font-size:12px}
.lb-quote-grid dt{color:${MUTED};font-size:10px;text-transform:uppercase;letter-spacing:.4px}
.lb-quote-grid dd{font-weight:600;margin:0}
.lb-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:start}
.lb-col{min-width:0;background:${CARDBG};border:1px solid ${BORDER};border-radius:4px;padding:8px}
.lb-col-h{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${MUTED};padding:6px 4px 10px;border-bottom:1px solid ${BORDER};margin-bottom:8px}
.lb-card-deal{border:1px solid ${BORDER};border-radius:4px;padding:10px;margin-bottom:8px;background:#fff;cursor:grab;font-size:13px;line-height:1.35}
.lb-card-deal:active{cursor:grabbing}
.lb-card-deal.lb-drag-over{outline:2px dashed ${ACCENT};outline-offset:2px}
.lb-modal-back{position:fixed;inset:0;background:rgba(26,31,46,.45);z-index:100;display:flex;align-items:flex-end;justify-content:center;padding:16px}
@media(min-width:520px){.lb-modal-back{align-items:center}}
.lb-modal{background:${CARDBG};border-radius:8px;max-width:440px;width:100%;max-height:90vh;overflow:auto;padding:20px;border:1px solid ${BORDER}}
.lb-search{margin-bottom:14px}
@media(min-width:861px){.lb-side{align-self:stretch;position:sticky;top:0;min-height:100vh;height:auto;overflow-y:auto}}
@media(max-width:860px){.lb-shell{flex-direction:column}.lb-side{width:auto;max-width:100%;position:static;padding:14px 12px 8px}.lb-nav--phone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}.lb-nav--phone-grid .lb-navbtn{width:100%;min-width:0;padding:8px 4px;border-radius:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:12px;line-height:1.25;min-height:40px;text-align:center;white-space:normal;word-break:break-word}.lb-main{padding:18px 16px 52px;max-width:100%}.lb-board{grid-template-columns:1fr;gap:12px}}
@media(max-width:390px){.lb-nav--phone-grid .lb-navbtn{font-size:11px;padding:7px 3px}}
@media(max-width:640px){.lb-show-desktop{display:none!important}.lb-show-mobile{display:block!important}}
@media(min-width:641px){.lb-show-mobile{display:none!important}}
@media(max-width:600px){.lb-table{font-size:12px}.lb-table th,.lb-table td{padding:8px 4px}input,select,textarea{font-size:16px!important}.lb-card{padding:14px}}
@media(min-width:861px) and (max-width:1100px){.lb-board{grid-template-columns:repeat(3,minmax(0,1fr))}}`
