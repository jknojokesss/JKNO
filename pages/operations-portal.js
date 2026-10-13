import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import MarketingShell from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

// Public sample — fictitious companies. Only the operations cash desk is interactive.
const SAMPLE_CLIENT = 'Hayfield Global'

const DESKS = [
  {
    id: 'operations',
    emoji: '📊',
    kicker: 'Liabilities, payables & cash',
    title: 'Operations center',
    blurb: 'Bank balances, card schedule, loans, and monthly outflow — workbook upload.',
    live: true,
  },
  {
    id: 'realestate',
    emoji: '🏠',
    kicker: 'Rent roll & vacancies',
    title: 'Lakeview Property Co.',
    blurb: 'Doors, delinquency, and owner statements — property management slice.',
    live: false,
  },
  {
    id: 'barber',
    emoji: '✂️',
    kicker: 'Chairs & retail mix',
    title: 'Main Street Barbers',
    blurb: 'Daily tickets, product sales, and chair utilization — shop-floor view.',
    live: false,
  },
  {
    id: 'supply',
    emoji: '📦',
    kicker: 'Wholesale & delivery',
    title: 'Northline Supply',
    blurb: 'Open orders, margin by SKU, and who still owes on net-30.',
    live: false,
  },
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

const SECTIONS = [
  { id: 'banks', label: 'Banks' },
  { id: 'cards', label: 'Cards' },
  { id: 'loans', label: 'Loans' },
  { id: 'outflow', label: 'Outflow' },
  { id: 'calendar', label: 'Calendar' },
]

const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

function dueMonthKey(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dueStyle(iso) {
  const m = new Date(iso + 'T12:00:00').getMonth()
  if (m === 9) return { bg: '#FDF6E3', color: '#9A7B1A' }
  if (m === 10) return { bg: '#E8F0FA', color: '#2E5F9E' }
  return { bg: '#F3F4F6', color: '#5E6A7C' }
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
  const router = useRouter()
  const [deskOpen, setDeskOpen] = useState(false)
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

  const pickDesk = (d) => {
    if (d.live) {
      setDeskOpen(true)
      setTimeout(() => document.getElementById('ops-desk')?.scrollIntoView({ behavior: 'smooth' }), 80)
      return
    }
    ping(`${d.title} is a placeholder in this sample — only Operations center is wired.`)
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

  return (
    <MarketingShell
      title="Operations portal sample | JK No Jokes Financials"
      description="JK No Jokes sample owner portal — pick a fictitious business. Operations cash desk is live; other desks are placeholders."
      padTop={false}
      jkTheme
    >
      <style>{`
        .ops-sample-hero{min-height:auto;padding:3.5rem 1.5rem 1.5rem;text-align:center}
        .ops-sample-hero .m-jk-home__h1{max-width:22ch;font-size:clamp(1.85rem,5vw,2.75rem)}
        .ops-sample-hero .m-jk-home__lead{max-width:42ch;margin-left:auto;margin-right:auto}
        .ops-desk-grid{display:grid;gap:.65rem;grid-template-columns:repeat(auto-fill,minmax(11.5rem,1fr))}
        .ops-desk-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;width:100%;padding:1rem 1.1rem;border-radius:10px;border:1px solid rgba(42,51,68,.12);background:#fff;cursor:pointer;font:inherit;color:inherit;transition:transform .15s,box-shadow .15s;border-left:3px solid var(--jk-orange-mid)}
        .ops-desk-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12);border-left-color:var(--jk-gold)}
        .ops-desk-card__emoji{font-size:1.5rem;line-height:1;margin-bottom:.5rem}
        .ops-desk-card__kicker{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:.35rem}
        .ops-desk-card__title{font-family:var(--jk-display);font-size:1.05rem;font-weight:600;color:var(--jk-ink);margin:0 0 .4rem}
        .ops-desk-card__blurb{font-size:.82rem;line-height:1.45;color:#64748b;margin:0 0 .65rem}
        .ops-desk-card__go{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#8f3d18}
        .ops-desk-card--live{box-shadow:inset 0 0 0 1px rgba(201,168,76,.35)}
        .ops-tabs{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem}
        .ops-tabs button{font-family:var(--jk-body);font-size:.8rem;font-weight:600;padding:.45rem .85rem;border-radius:6px;border:1px solid rgba(42,51,68,.15);background:#fff;color:#64748b;cursor:pointer}
        .ops-tabs button.is-active{background:var(--jk-ink);color:#fff;border-color:var(--jk-ink)}
        .ops-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.65rem;margin-bottom:1rem}
        .ops-kpi{padding:.85rem 1rem;border-radius:8px;border:1px solid rgba(42,51,68,.1);background:#faf9f6}
        .ops-kpi span{display:block;font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
        .ops-kpi strong{display:block;margin-top:.35rem;font-family:var(--jk-display);font-size:1.35rem;font-variant-numeric:tabular-nums;color:var(--jk-ink)}
        .ops-table-wrap{overflow-x:auto;border:1px solid rgba(42,51,68,.12);border-radius:8px;-webkit-overflow-scrolling:touch}
        .ops-table{width:100%;border-collapse:collapse;min-width:520px;font-size:.88rem}
        .ops-table th{text-align:left;padding:.55rem .75rem;font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:#64748b;background:#f0ede6;border-bottom:1px solid rgba(42,51,68,.1)}
        .ops-table td{padding:.55rem .75rem;border-bottom:1px solid #ebe8e0;color:var(--jk-ink);font-variant-numeric:tabular-nums}
        .ops-row-oct{background:#fdf6e3!important}
        .ops-row-nov{background:#e8f0fa!important}
        .ops-pill{display:inline-block;padding:2px 7px;border-radius:4px;font-size:.78rem;font-weight:600;font-family:'DM Mono',monospace}
        .ops-banks{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.65rem}
        .ops-bank{padding:.85rem 1rem;border-radius:8px;border:1px solid rgba(42,51,68,.1);background:#faf9f6}
        .ops-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:1rem 0}
        .ops-toolbar select,.ops-toolbar button{font-family:var(--jk-body);font-size:.8rem;padding:.4rem .65rem;border-radius:6px;border:1px solid rgba(42,51,68,.15);background:#fff}
        .ops-seg{display:inline-flex;border:1px solid rgba(42,51,68,.15);border-radius:6px;overflow:hidden}
        .ops-seg button{border:none;background:transparent;padding:.4rem .75rem;font-size:.8rem;font-weight:600;color:#64748b;cursor:pointer}
        .ops-seg button.on{background:var(--jk-ink);color:#fff}
        .ops-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .ops-cal button{aspect-ratio:1;min-height:38px;border:1px solid transparent;background:#fff;border-radius:6px;font-size:.78rem;cursor:pointer;position:relative}
        .ops-cal button.has{background:#fdf6e3;border-color:#e8d9a8}
        .ops-cal button.sel{outline:2px solid var(--jk-gold);font-weight:700}
        .ops-toast{text-align:center;padding:.65rem 1rem;background:var(--jk-ink);color:#fff;font-size:.88rem}
        .ops-cc-meta{display:flex;flex-wrap:wrap;gap:1rem 1.5rem;margin:.75rem 0;padding:.65rem .85rem;background:#f5f2eb;border-radius:8px;font-family:'DM Mono',monospace;font-size:.72rem;color:#64748b}
        .ops-cc-meta b{color:var(--jk-ink);margin-left:.35rem}
      `}</style>

      {toast && <div className="ops-toast">{toast}</div>}

      <div className="m-jk-home">
        <header className="ops-sample-hero m-jk-home__hero">
          <p className="m-jk-home__mark" aria-hidden="true">
            JK<span className="m-jk-home__mark-dot">.</span>
          </p>
          <p className="m-jk-story__kicker" style={{ color: 'var(--jk-gold-hi)', textShadow: '0 1px 12px rgba(8,12,24,.35)' }}>
            Sample owner portal
          </p>
          <h1 className="m-jk-home__h1">One login, different desks.</h1>
          <p className="m-jk-home__lead">
            Fictitious businesses — same build pattern I ship for real clients. Tap a desk; only the operations cash-flow screen is live here.
          </p>
        </header>

        <div className="m-jk-home__flow">
          <section className="m-jk-home__panel m-jk-home__panel--story">
            <p className="m-jk-story__kicker">Pick a desk</p>
            <h2 className="m-jk-story__title">Where do you want to go?</h2>
            <p className="m-jk-story__body m-jk-story__body--tight">
              Real estate, barbershop, wholesale, or finance ops — each client gets their own screens. This demo opens <strong>{SAMPLE_CLIENT}</strong> operations only.
            </p>
            <div className="ops-desk-grid m-jk-stagger-cards" style={{ marginTop: '1.1rem' }}>
              {DESKS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`ops-desk-card${d.live ? ' ops-desk-card--live' : ''}`}
                  onClick={() => pickDesk(d)}
                >
                  <span className="ops-desk-card__emoji" aria-hidden>{d.emoji}</span>
                  <span className="ops-desk-card__kicker">{d.kicker}</span>
                  <span className="ops-desk-card__title">{d.title}</span>
                  <p className="ops-desk-card__blurb">{d.blurb}</p>
                  <span className="ops-desk-card__go">{d.live ? 'Open sample →' : 'Placeholder'}</span>
                </button>
              ))}
            </div>
          </section>

          {deskOpen && (
            <section id="ops-desk" className="m-jk-home__panel">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p className="m-jk-story__kicker">{SAMPLE_CLIENT}</p>
                  <h2 className="m-jk-story__title" style={{ marginBottom: 0 }}>Operations center</h2>
                  <p className="m-jk-story__body" style={{ marginTop: '0.5rem', fontSize: '0.92rem' }}>
                    Workbook-style cash desk — not live bank feeds.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="m-jk-home__btn m-jk-home__btn--ghost" style={{ color: 'var(--jk-ink)', borderColor: 'rgba(42,51,68,.25)', background: '#fff' }} onClick={() => setDeskOpen(false)}>
                    Back to desks
                  </button>
                  <button type="button" className="m-jk-home__btn m-jk-home__btn--primary" onClick={() => ping('Production portals refresh from an .xlsx upload — no redeploy.')}>
                    Upload workbook
                  </button>
                </div>
              </div>

              <nav className="ops-tabs" aria-label="Sections">
                {SECTIONS.map((s) => (
                  <button key={s.id} type="button" className={activeSection === s.id ? 'is-active' : ''} onClick={() => jumpSection(s.id)}>
                    {s.label}
                  </button>
                ))}
              </nav>

              <div className="ops-kpi-row">
                <div className="ops-kpi"><span>Combined liquid</span><strong>{money(bankTotal)}</strong></div>
                <div className="ops-kpi"><span>Card payables</span><strong>{money(ccTotal)}</strong></div>
                <div className="ops-kpi"><span>Going out</span><strong>{money(goingOut)}</strong></div>
                <div className="ops-kpi"><span>Shortage flag</span><strong style={{ color: shortage > 0 ? '#b84a3a' : '#1e7a4a' }}>{shortage > 0 ? money(shortage) : '—'}</strong></div>
              </div>

              <div id="section-banks" style={{ scrollMarginTop: '5rem', marginBottom: '1.5rem' }}>
                <h3 className="m-jk-story__title" style={{ fontSize: '1.15rem' }}>Bank balances</h3>
                <div className="ops-banks">
                  {BANKS.map((b) => (
                    <div key={b.id} className="ops-bank">
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b' }}>{b.name}</span>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '.72rem', color: '#94a3b8', marginTop: '.25rem' }}>{b.account}</div>
                      <strong style={{ display: 'block', fontFamily: 'var(--jk-display)', fontSize: '1.45rem', marginTop: '.4rem' }}>{money(b.balance)}</strong>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.68rem', color: '#64748b' }}>Last entered {b.entered}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="section-cards" style={{ scrollMarginTop: '5rem', marginBottom: '1.5rem' }}>
                <h3 className="m-jk-story__title" style={{ fontSize: '1.15rem' }}>Credit card payables</h3>
                <div className="ops-cc-meta">
                  <span>Filtered<b>{money(ccTotal)}</b></span>
                  <span>October<b>{money(octDue)}</b></span>
                  <span>November<b>{money(novDue)}</b></span>
                </div>
                <div className="ops-toolbar">
                  <div className="ops-seg">
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
                  <button type="button" onClick={() => setSortAsc((s) => !s)}>Due {sortAsc ? '↑' : '↓'}</button>
                </div>
                {cardView === 'sheet' ? (
                  <div className="ops-table-wrap">
                    <table className="ops-table">
                      <thead>
                        <tr>
                          <th>Card</th>
                          <th>Vendor</th>
                          <th>Due</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r, i) => {
                          const ds = dueStyle(r.due)
                          const m = new Date(r.due + 'T12:00:00').getMonth()
                          const rowClass = m === 9 ? 'ops-row-oct' : m === 10 ? 'ops-row-nov' : ''
                          return (
                            <tr key={i} className={rowClass}>
                              <td>{CARDS.find((c) => c.id === r.card)?.label}</td>
                              <td>{r.vendor}</td>
                              <td><span className="ops-pill" style={{ background: ds.bg, color: ds.color }}>{fmtDue(r.due)}</span></td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(r.amount)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div id="section-calendar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1rem' }}>
                    <div className="ops-bank">
                      <strong style={{ fontFamily: 'var(--jk-display)' }}>October 2026</strong>
                      <div className="ops-cal" style={{ marginTop: '.75rem' }}>
                        {CAL_CELLS.map((c, i) => {
                          if (c.type === 'pad') return <div key={`p${i}`} />
                          const sel = calDay === c.iso
                          return (
                            <button key={c.iso} type="button" className={`${c.count ? 'has' : ''}${sel ? ' sel' : ''}`} onClick={() => setCalDay(c.iso)}>
                              {c.day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="ops-bank">
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.65rem', color: '#64748b' }}>{fmtDueLong(calDay)}</span>
                      {dayRows.length === 0 ? (
                        <p style={{ marginTop: '.5rem', color: '#64748b', fontSize: '.88rem' }}>No card payments this day.</p>
                      ) : (
                        dayRows.map((r, i) => (
                          <div key={i} style={{ padding: '.5rem 0', borderBottom: '1px solid #ebe8e0' }}>
                            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '.65rem', color: '#8f3d18' }}>{CARDS.find((c) => c.id === r.card)?.short}</div>
                            <div style={{ fontWeight: 600 }}>{r.vendor}</div>
                            <div style={{ color: '#64748b' }}>{money(r.amount)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div id="section-loans" style={{ scrollMarginTop: '5rem', marginBottom: '1.5rem' }}>
                <h3 className="m-jk-story__title" style={{ fontSize: '1.15rem' }}>Short-term loans & outflow</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
                  <div className="ops-table-wrap">
                    <table className="ops-table">
                      <thead>
                        <tr>
                          <th>Facility</th>
                          <th>Due</th>
                          <th style={{ textAlign: 'right' }}>Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STL.map((r, i) => (
                          <tr key={i}>
                            <td>{r.lender}</td>
                            <td>{fmtDue(r.due)}</td>
                            <td style={{ textAlign: 'right' }}>{money(r.payment)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ops-bank">
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b' }}>Outflow check</span>
                    <div style={{ marginTop: '.65rem', fontSize: '.9rem', lineHeight: 1.75 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Cards</span><strong>{money(ccTotal)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Loans</span><strong>{money(stlDue)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid #e0dcd4' }}><span style={{ color: '#64748b' }}>Cushion</span><strong>{cushion < 0 ? `(${money(Math.abs(cushion))})` : money(cushion)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="section-outflow" style={{ scrollMarginTop: '5rem' }}>
                <h3 className="m-jk-story__title" style={{ fontSize: '1.15rem' }}>US monthly outflow</h3>
                <div className="ops-table-wrap">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th style={{ textAlign: 'right' }}>Payroll</th>
                        <th style={{ textAlign: 'right' }}>Rent</th>
                        <th style={{ textAlign: 'right' }}>Debt</th>
                        <th style={{ textAlign: 'right' }}>Other</th>
                      </tr>
                    </thead>
                    <tbody>
                      {US_OUTFLOW.map((r) => (
                        <tr key={r.month}>
                          <td>{r.month}</td>
                          <td style={{ textAlign: 'right' }}>{money(r.payroll)}</td>
                          <td style={{ textAlign: 'right' }}>{money(r.rent)}</td>
                          <td style={{ textAlign: 'right' }}>{money(r.debt)}</td>
                          <td style={{ textAlign: 'right' }}>{money(r.other)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <section className="m-jk-home__panel m-jk-home__panel--story">
            <p className="m-jk-story__kicker">Want this for your shop?</p>
            <h2 className="m-jk-story__title">I build the desk, you keep the spreadsheet.</h2>
            <p className="m-jk-story__body">
              Same pattern for trades, property, wholesale, or finance ops — one login, your workbook or QuickBooks behind it.
            </p>
            <div className="m-jk-home__hero-actions" style={{ justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button type="button" className="m-jk-home__btn m-jk-home__btn--primary" onClick={() => router.push('/#contact')}>
                Tell me what you need
              </button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-jk-home__btn m-jk-home__btn--ghost">
                Book a call
              </a>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
