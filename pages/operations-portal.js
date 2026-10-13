import { useMemo, useState } from 'react'
import Head from 'next/head'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

const BIZ = 'Hayfield Global'
const HUB_PAGE = '#ECEEF2'
const HUB_INK = '#2C3440'
const HUB_MUTED = '#7A8494'
const HUB_CARD = '#FFFFFF'
const HUB_BTN = '#3D4858'
const NAVY = '#152238'
const OPS_BAR = '#4A6270'
const ACCENT = '#4A7FD4'
const BG = '#E8EAED'
const SHEET = '#FFFFFF'
const BORDER = '#D4DAE4'
const INK = '#1A2433'
const MUTED = '#5E6A7C'
const OCT_BG = '#FDF6E3'
const OCT_INK = '#9A7B1A'
const NOV_BG = '#E8F0FA'
const NOV_INK = '#2E5F9E'
const WARN = '#B84A3A'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'

const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

const ART_GREY = '#B4BCC8'
const BADGE_BG = '#2F3844'

/** Illustrated desk icons — same idea as the real portal cards, sample-only artwork. */
function HubBadge({ x, y, text }) {
  return (
    <g>
      <circle cx={x} cy={y} r="14" fill={BADGE_BG} />
      <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600">{text}</text>
    </g>
  )
}

function HubArt({ type }) {
  if (type === 'ops') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="28" y="38" width="72" height="52" rx="4" fill={ART_GREY} opacity="0.35" />
        <path d="M36 38V28h20l8 10" fill={ART_GREY} opacity="0.5" />
        <rect x="44" y="52" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="64" y="52" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="44" y="68" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="64" y="68" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="108" y="44" width="48" height="58" rx="3" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <path d="M118 58h28M118 68h28M118 78h18" stroke={ART_GREY} strokeWidth="2" strokeLinecap="round" />
        <HubBadge x={168} y={36} text="OPS" />
      </svg>
    )
  }
  if (type === 'house') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <path d="M100 28 52 58v42h96V58L100 28z" fill={ART_GREY} opacity="0.4" />
        <rect x="78" y="68" width="44" height="32" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <rect x="88" y="78" width="12" height="22" fill={ART_GREY} opacity="0.6" />
        <HubBadge x={148} y={40} text="RE" />
      </svg>
    )
  }
  if (type === 'warehouse') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="40" y="48" width="120" height="48" rx="2" fill={ART_GREY} opacity="0.35" />
        <path d="M40 48 L100 28 L160 48" fill="none" stroke={ART_GREY} strokeWidth="2" />
        <rect x="58" y="62" width="28" height="34" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <rect x="114" y="62" width="28" height="34" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <path d="M72 62v34M114 62v34" stroke={ART_GREY} strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'globe') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="68" y="22" width="64" height="64" rx="14" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <circle cx="100" cy="54" r="22" fill="none" stroke={ART_GREY} strokeWidth="2" />
        <ellipse cx="100" cy="54" rx="10" ry="22" fill="none" stroke={ART_GREY} strokeWidth="1.5" />
        <path d="M78 54h44" stroke={ART_GREY} strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'partners') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <circle cx="88" cy="58" r="26" fill={BADGE_BG} />
        <circle cx="118" cy="58" r="26" fill="#5A6575" />
        <text x="88" y="63" textAnchor="middle" fill="#fff" fontSize="14" fontFamily="IBM Plex Mono, monospace" fontWeight="600">AK</text>
        <text x="118" y="63" textAnchor="middle" fill="#fff" fontSize="14" fontFamily="IBM Plex Mono, monospace" fontWeight="600">JR</text>
      </svg>
    )
  }
  return null
}

function HubLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <rect width="36" height="36" rx="9" fill="#fff" stroke="#D8DEE6" strokeWidth="1" />
      <circle cx="18" cy="18" r="11" fill="none" stroke="#8A96A8" strokeWidth="1.5" />
      <ellipse cx="18" cy="18" rx="5" ry="11" fill="none" stroke="#8A96A8" strokeWidth="1" />
      <path d="M7 18h22" stroke="#8A96A8" strokeWidth="1" />
    </svg>
  )
}

/** Owner portal hub — layout mirrors multi-desk ops sites; only Operations center is live in the sample. */
const PORTAL_DESKS = [
  { id: 'operations', kicker: 'Liabilities, payables & cash flow', title: 'Operations center', live: true, art: 'ops' },
  { id: 'realestate', kicker: 'Multi-family · Northeast', title: 'Real estate', live: false, art: 'house' },
  { id: 'usre', kicker: 'Commercial · warehouse', title: 'US real estate', live: false, art: 'warehouse' },
  { id: 'inventory', kicker: 'Hayfield Global', title: 'Inventory', live: false, art: 'globe' },
  { id: 'partners', kicker: '2026 report', title: 'Partners', live: false, art: 'partners' },
]

const BANKS = [
  { id: 'lakeview', name: 'Lakeview National', account: 'Operating · 4821', balance: 284200, entered: 'Oct 13 · 8:42 AM' },
  { id: 'harbor', name: 'Harbor Trust', account: 'Concentration · 9033', balance: 91200, entered: 'Oct 13 · 9:05 AM' },
  { id: 'summit', name: 'Summit Metro CU', account: 'Reserve · 1107', balance: 43800, entered: 'Oct 12 · 4:30 PM' },
]

const CARDS = [
  { id: 'visa-ops', label: 'Visa · Operations', short: 'Visa Ops' },
  { id: 'amex-team', label: 'Amex · Team travel', short: 'Amex' },
  { id: 'mc-fac', label: 'Mastercard · Facilities', short: 'MC Fac' },
]

const PAYABLES = [
  { card: 'visa-ops', vendor: 'Northline Supply Co.', due: '2026-10-18', amount: 12400 },
  { card: 'visa-ops', vendor: 'Fleet fuel — October', due: '2026-10-22', amount: 3200 },
  { card: 'amex-team', vendor: 'SaaS renewals', due: '2026-10-28', amount: 890 },
  { card: 'mc-fac', vendor: 'Insurance installment', due: '2026-11-03', amount: 4100 },
  { card: 'mc-fac', vendor: 'Office supply', due: '2026-11-08', amount: 640 },
  { card: 'amex-team', vendor: 'Conference travel', due: '2026-11-12', amount: 2180 },
  { card: 'visa-ops', vendor: 'Net-30 vendor batch', due: '2026-11-15', amount: 18750 },
]

const STL = [
  { lender: 'Lakeview revolver', balance: 85000, payment: 4200, due: '2026-10-25' },
  { lender: 'Bridge note — Series B', balance: 40000, payment: 2000, due: '2026-11-01' },
]

const US_OUTFLOW = [
  { month: 'Oct 2026', payroll: 142000, rent: 28000, debt: 18500, other: 22100 },
  { month: 'Nov 2026', payroll: 142000, rent: 28000, debt: 19200, other: 19800 },
]

const DESK_SECTIONS = [
  { id: 'banks', label: 'Banks' },
  { id: 'cards', label: 'Cards' },
  { id: 'loans', label: 'Loans' },
  { id: 'outflow', label: 'Outflow' },
  { id: 'calendar', label: 'Calendar' },
]

function Icon({ name, size = 28, color = 'currentColor' }) {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'cash') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 10h.01M18 14h.01" />
      </svg>
    )
  }
  if (name === 'boxes') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M12 3 3 7.5 12 12l9-4.5L12 3z" />
        <path d="M3 7.5V16.5L12 21l9-4.5V7.5" />
        <path d="M12 12v9" />
      </svg>
    )
  }
  if (name === 'building') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M4 21V5a1 1 0 0 1 1-1h5v17" />
        <path d="M10 21V9h10v12" />
        <path d="M7 9h1M7 13h1M7 17h1M14 13h2M14 17h2" />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (name === 'upload') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M12 3v12" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 21h14" />
      </svg>
    )
  }
  if (name === 'bank') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M3 10h18" />
        <path d="M5 10V20M9 10V20M15 10V20M19 10V20" />
        <path d="M2 20h20" />
        <path d="M12 3 2 10h20L12 3z" />
      </svg>
    )
  }
  if (name === 'card') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    )
  }
  if (name === 'loan') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  }
  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <path d="M3 3v18h18" />
        <path d="M7 16V9M12 16V5M17 16v-3" />
      </svg>
    )
  }
  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    )
  }
  return null
}

const SECTION_ICON = {
  banks: 'bank',
  cards: 'card',
  loans: 'loan',
  outflow: 'chart',
  calendar: 'calendar',
}

function dueMonthKey(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dueStyle(iso) {
  const m = new Date(iso + 'T12:00:00').getMonth()
  if (m === 9) return { bg: OCT_BG, color: OCT_INK }
  if (m === 10) return { bg: NOV_BG, color: NOV_INK }
  return { bg: '#F3F4F6', color: MUTED }
}

function fmtDue(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fmtDueLong(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function buildCalCells() {
  const cells = []
  for (let i = 0; i < 3; i++) cells.push({ type: 'pad' })
  for (let day = 1; day <= 31; day++) {
    const iso = `2026-10-${String(day).padStart(2, '0')}`
    const count = PAYABLES.filter((p) => p.due === iso).length
    cells.push({ type: 'day', day, iso, count })
  }
  return cells
}

const CAL_CELLS = buildCalCells()

export default function OperationsPortalDemo() {
  const [hubOpen, setHubOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [cardView, setCardView] = useState('sheet')
  const [monthFilter, setMonthFilter] = useState('all')
  const [cardFilter, setCardFilter] = useState('all')
  const [sortAsc, setSortAsc] = useState(true)
  const [calDay, setCalDay] = useState('2026-10-18')
  const [activeSection, setActiveSection] = useState('banks')

  const filtered = useMemo(() => {
    let rows = [...PAYABLES]
    if (monthFilter === '2026-10') rows = rows.filter((r) => dueMonthKey(r.due) === '2026-10')
    if (monthFilter === '2026-11') rows = rows.filter((r) => dueMonthKey(r.due) === '2026-11')
    if (cardFilter !== 'all') rows = rows.filter((r) => r.card === cardFilter)
    rows.sort((a, b) => (sortAsc ? a.due.localeCompare(b.due) : b.due.localeCompare(a.due)))
    return rows
  }, [monthFilter, cardFilter, sortAsc])

  const ccTotal = filtered.reduce((s, r) => s + r.amount, 0)
  const octDue = PAYABLES.filter((r) => dueMonthKey(r.due) === '2026-10').reduce((s, r) => s + r.amount, 0)
  const novDue = PAYABLES.filter((r) => dueMonthKey(r.due) === '2026-11').reduce((s, r) => s + r.amount, 0)
  const bankTotal = BANKS.reduce((s, b) => s + b.balance, 0)
  const stlDue = STL.reduce((s, r) => s + r.payment, 0)
  const goingOut = ccTotal + stlDue
  const cushion = bankTotal - goingOut
  const shortage = Math.max(0, goingOut - bankTotal * 0.12)
  const dayRows = PAYABLES.filter((p) => p.due === calDay)

  const ping = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const openDesk = () => {
    setHubOpen(false)
    setActiveSection('banks')
  }

  const hubPick = (desk) => {
    if (desk.id === 'operations') {
      openDesk()
      return
    }
    ping('Sample portal — only Operations center is wired in this demo.')
  }

  const jumpSection = (id) => {
    setActiveSection(id)
    if (id === 'calendar') {
      setCardView('calendar')
      document.getElementById('section-cards')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (id === 'cards') setCardView('sheet')
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const th = {
    padding: '10px 14px',
    fontSize: '10px',
    color: MUTED,
    background: '#EEF1F6',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${BORDER}`,
    fontFamily: DEMO_MONO,
    whiteSpace: 'nowrap',
    textAlign: 'left',
  }
  const td = {
    padding: '11px 14px',
    borderBottom: '1px solid #ECEFF4',
    color: INK,
    fontSize: '13px',
    fontFamily: DEMO_UI,
  }

  return (
    <>
      <Head>
        <title>{BIZ} — Operations Portal (Sample)</title>
        <meta name="description" content="Sample operations portal with desk hub, cash flow, banks, cards, and workbook layout — fictitious data." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <DemoFontLinks />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ${DEMO_RENDER_HINTS}
          body{background:${hubOpen ? HUB_PAGE : BG};color:${INK}}
          .op-hub{min-height:calc(100vh - 48px);background:linear-gradient(180deg,#F4F5F8 0%,${HUB_PAGE} 120px,${HUB_PAGE} 100%);color:${HUB_INK}}
          .op-hub__bar{background:${HUB_CARD};border-bottom:1px solid #DDE2EA;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
          .op-hub__brand{display:flex;align-items:center;gap:12px}
          .op-hub__brand-name{font-family:${DEMO_HEAD};font-size:15px;font-weight:600;letter-spacing:.06em;color:${HUB_INK}}
          .op-hub__sample{font-family:${DEMO_MONO};font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:${HUB_MUTED};background:#F0F2F6;border:1px solid #E0E4EC;border-radius:20px;padding:6px 12px}
          .op-hub__intro{text-align:center;padding:28px 20px 8px;max-width:520px;margin:0 auto}
          .op-hub__intro p{font-family:${DEMO_UI};font-size:13px;color:${HUB_MUTED}}
          .op-hub__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:20px;width:100%;max-width:980px;margin:28px auto 48px;padding:0 20px}
          .op-hub__card{grid-column:span 2;background:${HUB_CARD};border:1px solid #E4E8EF;border-radius:16px;padding:0 0 20px;display:flex;flex-direction:column;text-align:left;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;box-shadow:0 2px 8px rgba(35,45,60,.05),0 14px 36px rgba(35,45,60,.05);overflow:hidden;min-height:310px}
          .op-hub__card--live{border-color:#B8CCE8;box-shadow:0 2px 8px rgba(74,127,212,.12),0 16px 40px rgba(35,45,60,.07)}
          .op-hub__card:hover{transform:translateY(-4px);border-color:#C8D0DC;box-shadow:0 6px 16px rgba(35,45,60,.08),0 24px 48px rgba(35,45,60,.09)}
          .op-hub__live-tag{position:absolute;top:14px;right:14px;font-family:${DEMO_MONO};font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#2E5F9E;background:#E8F0FA;border:1px solid #C5D8EF;border-radius:20px;padding:4px 8px}
          .op-hub__card-wrap{position:relative}
          .op-hub__card:focus-visible{outline:2px solid ${ACCENT};outline-offset:3px}
          .op-hub__art{padding:8px 12px 0;min-height:128px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#FAFBFC 0%,#fff 100%)}
          .op-hub__body{padding:4px 22px 0;flex:1;display:flex;flex-direction:column}
          .op-hub__kicker{font-family:${DEMO_MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${HUB_MUTED};margin-top:8px;line-height:1.5}
          .op-hub__title{font-family:${DEMO_HEAD};font-size:22px;font-weight:600;color:${HUB_INK};margin-top:10px;line-height:1.2}
          .op-hub__enter{margin:18px 22px 0;width:calc(100% - 44px);background:${HUB_BTN};color:#fff;border:none;border-radius:10px;padding:13px 16px;font-family:${DEMO_UI};font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s}
          .op-hub__card:hover .op-hub__enter{background:#2f3844}
          .op-hub__foot{text-align:center;padding-bottom:32px;font-family:${DEMO_MONO};font-size:10px}
          .op-hub__foot a{color:#5A7FA8;text-decoration:none}
          .op-desk-header{background:${OPS_BAR};color:#fff;padding:14px 22px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:20;box-shadow:0 1px 0 rgba(0,0,0,.08)}
          .op-desk-rail{background:${SHEET};border-bottom:1px solid ${BORDER};padding:10px 20px;display:flex;gap:8px;overflow-x:auto;position:sticky;top:56px;z-index:19;-webkit-overflow-scrolling:touch;max-width:1100px;margin:0 auto;width:100%}
          .op-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}
          .op-summary-item{background:${SHEET};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px}
          .op-summary-item strong{display:block;font-family:${DEMO_HEAD};font-size:22px;font-weight:600;margin-top:6px;font-variant-numeric:tabular-nums}
          .op-workbook{background:${SHEET};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;box-shadow:0 1px 0 rgba(21,34,56,.04)}
          .op-workbook-section{padding:20px 22px;border-bottom:1px solid #ECEFF4}
          .op-workbook-section:last-child{border-bottom:none}
          .op-cc-totals{display:flex;flex-wrap:wrap;gap:16px 28px;margin-bottom:14px;padding:12px 14px;background:#F7F9FC;border:1px solid #E8ECF2;border-radius:8px;font-family:${DEMO_MONO};font-size:11px;color:${MUTED}}
          .op-cc-totals b{color:${INK};font-size:13px;margin-left:6px;font-variant-numeric:tabular-nums}
          .op-row-oct{background:${OCT_BG}!important}
          .op-row-nov{background:${NOV_BG}!important}
          .op-rail-btn{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px;padding:8px 10px;border-radius:10px;border:1px solid transparent;background:transparent;cursor:pointer;font-family:${DEMO_UI};color:${MUTED}}
          .op-rail-btn.on{background:#EEF3FA;border-color:#C5D4EA;color:${INK}}
          .op-rail-btn span{font-size:10px;font-weight:600}
          .op-main{padding:20px 16px 56px;max-width:1100px;margin:0 auto}
          .op-banks{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
          .op-bank{background:#FAFBFD;border:1px solid #E2E7EF;border-radius:8px;padding:16px 18px}
          .op-bank-total{background:#F0F5FC;border-color:#C5D4EA}
          .op-panel{scroll-margin-top:130px}
          .op-seg{display:inline-flex;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;background:#F7F8FB}
          .op-seg button{border:none;background:transparent;padding:8px 16px;font-family:${DEMO_UI};font-size:12px;font-weight:600;color:${MUTED};cursor:pointer}
          .op-seg button.on{background:${NAVY};color:#fff}
          .op-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 14px}
          .op-toolbar select,.op-linkbtn{font-family:${DEMO_UI};font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid ${BORDER};background:#fff;color:${INK}}
          .op-linkbtn{cursor:pointer}
          .op-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid ${BORDER};border-radius:8px}
          .op-scroll table{width:100%;border-collapse:collapse;min-width:560px}
          .op-due-pill{display:inline-block;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600;font-family:${DEMO_MONO}}
          .op-legend{display:flex;flex-wrap:wrap;gap:12px;font-family:${DEMO_MONO};font-size:10px;color:${MUTED};margin-bottom:12px}
          .op-legend span{display:inline-flex;align-items:center;gap:6px}
          .op-legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
          .op-cal-wrap{border:1px solid ${BORDER};border-radius:8px;padding:14px;background:#FAFBFD}
          .op-cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}
          .op-cal-head div{font-family:${DEMO_MONO};font-size:9px;color:${MUTED};text-align:center}
          .op-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
          .op-cal-grid button{aspect-ratio:1;border:1px solid transparent;background:#fff;border-radius:6px;font-family:${DEMO_UI};font-size:12px;cursor:pointer;min-height:42px;position:relative}
          .op-cal-grid button.has-due{background:${OCT_BG};border-color:#E8D9A8}
          .op-cal-grid button.sel{outline:2px solid ${ACCENT};font-weight:700}
          .op-cal-grid button .dot{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:${ACCENT}}
          .op-row-2{display:grid;grid-template-columns:1fr 300px;gap:18px}
          @media(max-width:900px){
            .op-hub__grid{grid-template-columns:1fr;max-width:400px}
            .op-hub__card{grid-column:1/-1}
            .op-main{padding:16px 14px 48px}
            .op-row-2{grid-template-columns:1fr}
            .op-desk-rail{top:88px}
          }
        `}</style>
      </Head>

      <DemoLobby />

      {toast && (
        <div style={{ background: NAVY, color: '#fff', textAlign: 'center', padding: '10px 16px', fontFamily: DEMO_UI, fontSize: 13, zIndex: 30, position: 'relative' }}>
          {toast}
        </div>
      )}

      <div className={DEMO_PORTAL_ROOT_CLASS}>
        {hubOpen ? (
          <div className="op-hub">
            <header className="op-hub__bar">
              <div className="op-hub__brand">
                <HubLogo />
                <span className="op-hub__brand-name">{BIZ.toUpperCase()}</span>
              </div>
              <span className="op-hub__sample">Public sample · fictitious data</span>
            </header>
            <div className="op-hub__intro">
              <p>Owner portal · tap where you&rsquo;re going</p>
            </div>
            <div className="op-hub__grid" role="navigation" aria-label="Portal desks">
              {PORTAL_DESKS.map((d) => (
                <div key={d.id} className="op-hub__card-wrap">
                  {d.live && <span className="op-hub__live-tag">Live in sample</span>}
                  <button
                    type="button"
                    className={`op-hub__card${d.live ? ' op-hub__card--live' : ''}`}
                    onClick={() => hubPick(d)}
                    style={{ font: 'inherit', width: '100%' }}
                  >
                    <div className="op-hub__art">
                      <HubArt type={d.art} />
                    </div>
                    <div className="op-hub__body">
                      <div className="op-hub__kicker">{d.kicker}</div>
                      <div className="op-hub__title">{d.title}</div>
                    </div>
                    <span className="op-hub__enter">Enter <span aria-hidden="true">›</span></span>
                  </button>
                </div>
              ))}
            </div>
            <div className="op-hub__foot">
              <a href={BOOK} target="_blank" rel="noopener noreferrer">Built by JK No Jokes Financials →</a>
            </div>
          </div>
        ) : (
          <>
            <header className="op-desk-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button type="button" onClick={() => setHubOpen(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.25)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontFamily: DEMO_MONO, fontSize: 10, cursor: 'pointer' }}>
                  ← Desks
                </button>
                <div>
                  <div style={{ fontFamily: DEMO_HEAD, fontSize: 17, fontWeight: 600 }}>Operations center</div>
                  <div style={{ fontFamily: DEMO_MONO, fontSize: 9, opacity: 0.75, letterSpacing: '.1em' }}>{BIZ.toUpperCase()}</div>
                </div>
              </div>
              <button type="button" onClick={() => ping('Sample — production refreshes from workbook upload.')} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: DEMO_MONO, fontSize: 10, letterSpacing: '.06em', cursor: 'pointer' }}>
                UPLOAD WORKBOOK
              </button>
            </header>

            <nav className="op-desk-rail" aria-label="Cash flow sections">
              {DESK_SECTIONS.map((s) => (
                <button key={s.id} type="button" className={`op-rail-btn${activeSection === s.id ? ' on' : ''}`} onClick={() => jumpSection(s.id)}>
                  <Icon name={SECTION_ICON[s.id]} size={22} color={activeSection === s.id ? ACCENT : '#8A96A8'} />
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>

            <main className="op-main">
              <div className="op-summary">
                <div className="op-summary-item">
                  <span style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' }}>Combined liquid</span>
                  <strong>{money(bankTotal)}</strong>
                </div>
                <div className="op-summary-item">
                  <span style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' }}>Card payables (view)</span>
                  <strong>{money(ccTotal)}</strong>
                </div>
                <div className="op-summary-item">
                  <span style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' }}>Amount going out</span>
                  <strong>{money(goingOut)}</strong>
                </div>
                <div className="op-summary-item">
                  <span style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' }}>Shortage flag</span>
                  <strong style={{ color: shortage > 0 ? WARN : '#1E7A4A' }}>{shortage > 0 ? money(shortage) : '—'}</strong>
                </div>
              </div>

              <div className="op-workbook">
              <section id="section-banks" className="op-workbook-section op-panel">
                <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Bank balances</h2>
                <div className="op-banks">
                  {BANKS.map((b) => (
                    <div key={b.id} className="op-bank">
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' }}>{b.name}</div>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: '#8A96A8', marginTop: 4 }}>{b.account}</div>
                      <div style={{ fontFamily: DEMO_HEAD, fontSize: 26, fontWeight: 600, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{money(b.balance)}</div>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginTop: 8 }}>Last entered {b.entered}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="section-cards" className="op-workbook-section op-panel">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 20, fontWeight: 600 }}>Credit card payables</h2>
                </div>
                <div className="op-cc-totals">
                  <span>Filtered total<b>{money(ccTotal)}</b></span>
                  <span>October dues<b>{money(octDue)}</b></span>
                  <span>November dues<b>{money(novDue)}</b></span>
                </div>
                <div className="op-legend">
                  <span><i style={{ background: OCT_BG, border: `1px solid ${OCT_INK}` }} /> October row color</span>
                  <span><i style={{ background: NOV_BG, border: `1px solid ${NOV_INK}` }} /> November row color</span>
                </div>
                <div className="op-toolbar">
                  <div className="op-seg">
                    <button type="button" className={cardView === 'sheet' ? 'on' : ''} onClick={() => setCardView('sheet')}>Sheet</button>
                    <button type="button" className={cardView === 'calendar' ? 'on' : ''} onClick={() => setCardView('calendar')}>Calendar</button>
                  </div>
                  <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Due month">
                    <option value="all">All months</option>
                    <option value="2026-10">October</option>
                    <option value="2026-11">November</option>
                  </select>
                  <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} aria-label="Card">
                    <option value="all">All cards</option>
                    {CARDS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <button type="button" className="op-linkbtn" onClick={() => setSortAsc((s) => !s)}>Due {sortAsc ? '↑' : '↓'}</button>
                </div>
                {cardView === 'sheet' ? (
                  <div className="op-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th style={th}>Card</th>
                          <th style={th}>Vendor</th>
                          <th style={th}>Due</th>
                          <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r, i) => {
                          const ds = dueStyle(r.due)
                          const m = new Date(r.due + 'T12:00:00').getMonth()
                          const rowClass = m === 9 ? 'op-row-oct' : m === 10 ? 'op-row-nov' : ''
                          return (
                            <tr key={i} className={rowClass}>
                              <td style={td}>{CARDS.find((c) => c.id === r.card)?.label}</td>
                              <td style={td}>{r.vendor}</td>
                              <td style={td}><span className="op-due-pill" style={{ background: ds.bg, color: ds.color }}>{fmtDue(r.due)}</span></td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{money(r.amount)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div id="section-calendar" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(220px,1fr)', gap: 18 }}>
                    <div className="op-cal-wrap">
                      <div style={{ fontFamily: DEMO_HEAD, fontSize: 16, fontWeight: 600, marginBottom: 10 }}>October 2026</div>
                      <div className="op-cal-head">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
                      <div className="op-cal-grid">
                        {CAL_CELLS.map((c, i) => {
                          if (c.type === 'pad') return <div key={`p${i}`} className="pad" />
                          const sel = calDay === c.iso
                          return (
                            <button key={c.iso} type="button" className={`${c.count ? 'has-due' : ''}${sel ? ' sel' : ''}`} onClick={() => setCalDay(c.iso)}>
                              {c.day}
                              {c.count > 0 && <span className="dot" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="op-cal-wrap">
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, marginBottom: 8 }}>{fmtDueLong(calDay)}</div>
                      {dayRows.length === 0 ? (
                        <p style={{ color: MUTED, fontSize: 13 }}>No card payments this day.</p>
                      ) : (
                        dayRows.map((r, i) => (
                          <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                            <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: ACCENT }}>{CARDS.find((c) => c.id === r.card)?.short}</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.vendor}</div>
                            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{money(r.amount)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section id="section-loans" className="op-workbook-section op-panel">
                <div className="op-row-2">
                  <div>
                    <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Short-term loans</h2>
                    <div className="op-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th style={th}>Facility</th>
                            <th style={th}>Due</th>
                            <th style={{ ...th, textAlign: 'right' }}>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {STL.map((r, i) => (
                            <tr key={i}>
                              <td style={td}>{r.lender}</td>
                              <td style={td}>{fmtDue(r.due)}</td>
                              <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.payment)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ background: '#F7F9FC', borderRadius: 10, padding: 16, border: `1px solid ${BORDER}`, alignSelf: 'start' }}>
                    <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em' }}>OUTFLOW CHECK</div>
                    <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.85 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Cards</span><strong>{money(ccTotal)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Loans</span><strong>{money(stlDue)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}><span style={{ color: MUTED }}>Going out</span><strong>{money(goingOut)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: cushion < 0 ? WARN : '#1E7A4A' }}><span>Cushion</span><strong>{cushion < 0 ? `(${money(Math.abs(cushion))})` : money(cushion)}</strong></div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="section-outflow" className="op-workbook-section op-panel">
                <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>US monthly outflow</h2>
                <div className="op-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th style={th}>Month</th>
                        <th style={{ ...th, textAlign: 'right' }}>Payroll</th>
                        <th style={{ ...th, textAlign: 'right' }}>Rent</th>
                        <th style={{ ...th, textAlign: 'right' }}>Debt</th>
                        <th style={{ ...th, textAlign: 'right' }}>Other</th>
                      </tr>
                    </thead>
                    <tbody>
                      {US_OUTFLOW.map((r) => (
                        <tr key={r.month}>
                          <td style={td}>{r.month}</td>
                          <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.payroll)}</td>
                          <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.rent)}</td>
                          <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.debt)}</td>
                          <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.other)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              </div>
            </main>
          </>
        )}
      </div>
    </>
  )
}
