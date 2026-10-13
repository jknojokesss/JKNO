import { useMemo, useState } from 'react'
import Head from 'next/head'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

const BIZ = 'Hayfield Finance'
const HUB_BG = '#0f1419'
const HUB_MUTED = '#9aa8b5'
const HUB_TILE = '#1a2332'
const HUB_ACCENT = '#6b9cb8'
const NAVY = '#152238'
const ACCENT = '#4A7FD4'
const BG = '#F0F2F6'
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

/** Five-desk hub — only Cash flow is interactive in this sample. */
const HUB_DESKS = [
  { id: 'cash-flow', label: 'Cash flow', sub: 'Banks & cards', live: true },
  { id: 'inventory', label: 'Inventory', sub: 'SKU ledger', live: false },
  { id: 'properties', label: 'Properties', sub: 'Rent roll', live: false },
  { id: 'partners', label: 'Partners', sub: 'Statements', live: false },
  { id: 'upload', label: 'Workbook', sub: 'Upload .xlsx', live: false },
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

const HUB_ICON = {
  'cash-flow': 'cash',
  inventory: 'boxes',
  properties: 'building',
  partners: 'users',
  upload: 'upload',
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
  const bankTotal = BANKS.reduce((s, b) => s + b.balance, 0)
  const stlDue = STL.reduce((s, r) => s + r.payment, 0)
  const goingOut = ccTotal + stlDue
  const cushion = bankTotal - goingOut
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
    if (desk.id === 'cash-flow') {
      openDesk()
      return
    }
    ping('Sample hub — only Cash flow is wired in this demo.')
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
          body{background:${hubOpen ? HUB_BG : BG};color:${INK}}
          .op-hub{min-height:calc(100vh - 48px);background:${HUB_BG};color:#eef2f6;padding:48px 24px 64px;display:flex;flex-direction:column;align-items:center}
          .op-hub__grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;width:100%;max-width:720px;margin-top:36px}
          .op-hub__tile{background:${HUB_TILE};border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:22px 12px 18px;text-align:center;cursor:pointer;transition:transform .15s,border-color .15s,background .15s}
          .op-hub__tile:hover{border-color:${HUB_ACCENT};transform:translateY(-2px);background:#222d3f}
          .op-hub__icon{width:52px;height:52px;margin:0 auto 14px;border-radius:12px;background:rgba(107,156,184,.12);display:flex;align-items:center;justify-content:center;color:${HUB_ACCENT}}
          .op-hub__label{font-family:${DEMO_UI};font-size:13px;font-weight:600;color:#fff}
          .op-hub__sub{font-family:${DEMO_MONO};font-size:9px;color:${HUB_MUTED};margin-top:6px;letter-spacing:.06em}
          .op-desk-header{background:${NAVY};color:#fff;padding:12px 20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:20}
          .op-desk-rail{background:#fff;border-bottom:1px solid ${BORDER};padding:10px 16px;display:flex;gap:8px;overflow-x:auto;position:sticky;top:52px;z-index:19;-webkit-overflow-scrolling:touch}
          .op-rail-btn{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px;padding:8px 10px;border-radius:10px;border:1px solid transparent;background:transparent;cursor:pointer;font-family:${DEMO_UI};color:${MUTED}}
          .op-rail-btn.on{background:#EEF3FA;border-color:#C5D4EA;color:${INK}}
          .op-rail-btn span{font-size:10px;font-weight:600}
          .op-main{padding:24px 20px 56px;max-width:1100px;margin:0 auto}
          .op-banks{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:22px}
          .op-bank{background:#fff;border:1px solid ${BORDER};border-radius:10px;padding:18px 20px;box-shadow:0 1px 0 rgba(21,34,56,.04)}
          .op-bank-total{border-color:${ACCENT}}
          .op-panel{background:#fff;border:1px solid ${BORDER};border-radius:10px;padding:20px 22px;margin-bottom:18px;scroll-margin-top:120px}
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
          @media(max-width:800px){
            .op-hub__grid{grid-template-columns:repeat(2,1fr);max-width:360px}
            .op-hub__grid button:nth-child(5){grid-column:span 2;max-width:50%;margin:0 auto;width:100%}
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
            <p style={{ fontFamily: DEMO_MONO, fontSize: 10, letterSpacing: '.14em', color: HUB_MUTED, textTransform: 'uppercase' }}>Sample owner portal</p>
            <h1 style={{ fontFamily: DEMO_HEAD, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 600, marginTop: 10, textAlign: 'center', color: '#fff' }}>{BIZ}</h1>
            <p style={{ fontFamily: DEMO_UI, fontSize: 14, color: HUB_MUTED, marginTop: 10, textAlign: 'center', maxWidth: 420 }}>
              Pick a desk — same five-icon entry as a private ops portal. This public demo opens Cash flow only.
            </p>
            <div className="op-hub__grid" role="navigation" aria-label="Portal desks">
              {HUB_DESKS.map((d) => (
                <button key={d.id} type="button" className="op-hub__tile" onClick={() => hubPick(d)} style={{ border: 'none', font: 'inherit' }}>
                  <div className="op-hub__icon">
                    <Icon name={HUB_ICON[d.id]} size={26} color={HUB_ACCENT} />
                  </div>
                  <div className="op-hub__label">{d.label}</div>
                  <div className="op-hub__sub">{d.sub}</div>
                </button>
              ))}
            </div>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ marginTop: 32, fontFamily: DEMO_MONO, fontSize: 10, color: HUB_ACCENT, textDecoration: 'none' }}>
              Built by JK No Jokes →
            </a>
          </div>
        ) : (
          <>
            <header className="op-desk-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button type="button" onClick={() => setHubOpen(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.25)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontFamily: DEMO_MONO, fontSize: 10, cursor: 'pointer' }}>
                  ← Desks
                </button>
                <div>
                  <div style={{ fontFamily: DEMO_HEAD, fontSize: 17, fontWeight: 600 }}>Cash flow desk</div>
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
              <section id="section-banks" className="op-panel">
                <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Bank balances</h2>
                <div className="op-banks">
                  {BANKS.map((b) => (
                    <div key={b.id} className="op-bank">
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' }}>{b.name}</div>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: '#8A96A8', marginTop: 4 }}>{b.account}</div>
                      <div style={{ fontFamily: DEMO_HEAD, fontSize: 28, fontWeight: 600, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{money(b.balance)}</div>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginTop: 8 }}>Last entered {b.entered}</div>
                    </div>
                  ))}
                  <div className="op-bank op-bank-total">
                    <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: ACCENT, letterSpacing: '.1em', textTransform: 'uppercase' }}>Combined liquid</div>
                    <div style={{ fontFamily: DEMO_HEAD, fontSize: 28, fontWeight: 600, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>{money(bankTotal)}</div>
                  </div>
                </div>
              </section>

              <section id="section-cards" className="op-panel">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 20, fontWeight: 600 }}>Card payables</h2>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED }}>FILTERED TOTAL</div>
                    <div style={{ fontFamily: DEMO_HEAD, fontSize: 22, fontWeight: 600 }}>{money(ccTotal)}</div>
                  </div>
                </div>
                <div className="op-legend">
                  <span><i style={{ background: OCT_BG, border: `1px solid ${OCT_INK}` }} /> October dues</span>
                  <span><i style={{ background: NOV_BG, border: `1px solid ${NOV_INK}` }} /> November dues</span>
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
                          return (
                            <tr key={i} style={{ background: i % 2 ? '#FAFBFD' : '#fff' }}>
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

              <section id="section-loans" className="op-panel">
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

              <section id="section-outflow" className="op-panel">
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
            </main>
          </>
        )}
      </div>
    </>
  )
}
