import { useMemo, useState } from 'react'
import Head from 'next/head'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

// Fictitious cash-flow ops desk — layout only; no real institutions or card numbers.
const BIZ = 'Hayfield Finance'
const SIDEBAR = '#152238'
const ACCENT = '#4A7FD4'
const BG = '#F0F2F6'
const PAPER = '#FFFFFF'
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

const CA_PORTFOLIO = [
  { entity: 'Prairie REIT tranche', exposure: 2100000, nextAction: 'Covenant cert due Nov 5' },
  { entity: 'Halifax retail JV', exposure: 890000, nextAction: 'Distribution review Oct 20' },
]

function dueMonthKey(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dueStyle(iso) {
  const m = new Date(iso + 'T12:00:00').getMonth()
  if (m === 9) return { bg: OCT_BG, color: OCT_INK, tag: 'Oct due' }
  if (m === 10) return { bg: NOV_BG, color: NOV_INK, tag: 'Nov due' }
  return { bg: '#F3F4F6', color: MUTED, tag: '' }
}

function fmtDue(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fmtDueLong(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

/** October 2026 mini-calendar for demo */
function buildCalCells() {
  const cells = []
  for (let i = 0; i < 3; i++) cells.push({ type: 'pad' })
  for (let day = 1; day <= 31; day++) {
    const iso = `2026-10-${String(day).padStart(2, '0')}`
    const due = PAYABLES.filter((p) => p.due === iso)
    cells.push({ type: 'day', day, iso, due, count: due.length })
  }
  return cells
}

const CAL_CELLS = buildCalCells()

export default function OperationsPortalDemo() {
  const [view, setView] = useState('sheet')
  const [monthFilter, setMonthFilter] = useState('all')
  const [cardFilter, setCardFilter] = useState('all')
  const [sortAsc, setSortAsc] = useState(true)
  const [calDay, setCalDay] = useState('2026-10-18')
  const [uploadMsg, setUploadMsg] = useState('')

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

  const fakeUpload = () => {
    setUploadMsg('Sample only — production portals refresh from your workbook upload.')
    setTimeout(() => setUploadMsg(''), 4500)
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
    borderBottom: `1px solid #ECEFF4`,
    color: INK,
    fontSize: '13px',
    fontFamily: DEMO_UI,
  }

  return (
    <>
      <Head>
        <title>{BIZ} — Cash Flow Ops Desk (Sample)</title>
        <meta name="description" content="Sample operations portal: bank balances, card payables, calendar, and workbook-style totals — fictitious data." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <DemoFontLinks />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ${DEMO_RENDER_HINTS}
          body{background:${BG};color:${INK}}
          .op-shell{display:flex;min-height:calc(100vh - 0px)}
          .op-side{width:220px;flex-shrink:0;background:${SIDEBAR};color:#fff;padding:24px 14px 20px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
          .op-main{flex:1;min-width:0;padding:28px 32px 64px}
          .op-nav-btn{display:block;width:100%;text-align:left;padding:10px 14px;border-radius:8px;border:none;background:transparent;color:#8FA3BC;font-family:${DEMO_UI};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:4px}
          .op-nav-btn.on{background:rgba(255,255,255,.08);color:#fff;box-shadow:inset 3px 0 0 ${ACCENT}}
          .op-panel{background:${PAPER};border:1px solid ${BORDER};border-radius:10px;padding:20px 22px;margin-bottom:18px;box-shadow:0 1px 0 rgba(21,34,56,.04)}
          .op-banks{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:22px}
          .op-bank{background:${PAPER};border:1px solid ${BORDER};border-radius:10px;padding:18px 20px;box-shadow:0 1px 0 rgba(21,34,56,.04)}
          .op-bank-total{border-color:${ACCENT};box-shadow:inset 0 0 0 1px rgba(74,127,212,.15)}
          .op-seg{display:inline-flex;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;background:#F7F8FB}
          .op-seg button{border:none;background:transparent;padding:8px 16px;font-family:${DEMO_UI};font-size:12px;font-weight:600;color:${MUTED};cursor:pointer}
          .op-seg button.on{background:${SIDEBAR};color:#fff}
          .op-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 14px}
          .op-toolbar select{font-family:${DEMO_UI};font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid ${BORDER};background:#fff;color:${INK}}
          .op-toolbar .op-linkbtn{border:1px solid ${BORDER};background:#fff;border-radius:8px;padding:8px 12px;font-family:${DEMO_UI};font-size:12px;cursor:pointer;color:${INK}}
          .op-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid ${BORDER};border-radius:8px}
          .op-scroll table{width:100%;border-collapse:collapse;min-width:560px}
          .op-due-pill{display:inline-block;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600;font-family:${DEMO_MONO}}
          .op-legend{display:flex;flex-wrap:wrap;gap:12px;font-family:${DEMO_MONO};font-size:10px;color:${MUTED};margin-bottom:12px}
          .op-legend span{display:inline-flex;align-items:center;gap:6px}
          .op-legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
          .op-cal-wrap{border:1px solid ${BORDER};border-radius:8px;padding:14px;background:#FAFBFD}
          .op-cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}
          .op-cal-head div{font-family:${DEMO_MONO};font-size:9px;color:${MUTED};text-align:center;letter-spacing:.06em}
          .op-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
          .op-cal-grid button{aspect-ratio:1;border:1px solid transparent;background:#fff;border-radius:6px;font-family:${DEMO_UI};font-size:12px;cursor:pointer;color:${INK};position:relative;min-height:42px}
          .op-cal-grid button.has-due{background:${OCT_BG};border-color:#E8D9A8}
          .op-cal-grid button.sel{outline:2px solid ${ACCENT};outline-offset:-1px;font-weight:700}
          .op-cal-grid button .dot{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:${ACCENT}}
          .op-cal-grid .pad{visibility:hidden;pointer-events:none}
          .op-upload{background:${ACCENT};color:#fff;border:none;border-radius:8px;padding:9px 14px;font-family:${DEMO_MONO};font-size:10px;letter-spacing:.08em;cursor:pointer;font-weight:600}
          .op-upload:hover{filter:brightness(1.05)}
          .op-row-2{display:grid;grid-template-columns:1fr 320px;gap:18px}
          @media(max-width:900px){.op-side{display:none}.op-main{padding:18px 16px 52px}.op-row-2{grid-template-columns:1fr}}
        `}</style>
      </Head>

      <DemoLobby />

      {uploadMsg && (
        <div style={{ background: SIDEBAR, color: '#fff', textAlign: 'center', padding: '10px 16px', fontFamily: DEMO_UI, fontSize: 13 }}>
          {uploadMsg}
        </div>
      )}

      <div className={`op-shell ${DEMO_PORTAL_ROOT_CLASS}`}>
        <aside className="op-side">
          <div style={{ paddingBottom: 22, borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 18 }}>
            <div style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>{BIZ}</div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: ACCENT, letterSpacing: '.16em', marginTop: 6 }}>CASH FLOW DESK</div>
          </div>
          <nav style={{ flex: 1 }}>
            <button type="button" className="op-nav-btn on">Cash flow</button>
            <button type="button" className="op-nav-btn" disabled style={{ opacity: 0.45, cursor: 'default' }}>US outflow</button>
            <button type="button" className="op-nav-btn" disabled style={{ opacity: 0.45, cursor: 'default' }}>Canada book</button>
          </nav>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16, fontFamily: DEMO_MONO, fontSize: 9, color: '#6A849C', lineHeight: 1.7 }}>
            SAMPLE · FICTITIOUS DATA
            <br />
            <span style={{ color: ACCENT }}>JK No Jokes Financials</span>
          </div>
          <button type="button" className="op-upload" style={{ marginTop: 14, width: '100%' }} onClick={fakeUpload}>
            UPLOAD WORKBOOK
          </button>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, textAlign: 'center', color: '#8FA3BC', fontFamily: DEMO_MONO, fontSize: 10, textDecoration: 'none' }}>
            Built by JK →
          </a>
        </aside>

        <main className="op-main">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' }}>As of Oct 13, 2026</div>
              <h1 style={{ fontFamily: DEMO_HEAD, fontSize: 26, fontWeight: 600, marginTop: 4 }}>Cash position</h1>
            </div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, background: '#E8ECF2', padding: '6px 12px', borderRadius: 20 }}>
              Workbook layout · not live bank feeds
            </div>
          </div>

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
              <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginTop: 8 }}>Three operating accounts</div>
            </div>
          </div>

          <div className="op-panel">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 20, fontWeight: 600 }}>Card payables</h2>
                <p style={{ fontFamily: DEMO_UI, fontSize: 13, color: MUTED, marginTop: 4 }}>Due-date sheet or calendar — filter by month and card.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em' }}>FILTERED TOTAL</div>
                <div style={{ fontFamily: DEMO_HEAD, fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{money(ccTotal)}</div>
              </div>
            </div>

            <div className="op-legend">
              <span><i style={{ background: OCT_BG, border: `1px solid ${OCT_INK}` }} /> October due dates</span>
              <span><i style={{ background: NOV_BG, border: `1px solid ${NOV_INK}` }} /> November due dates</span>
            </div>

            <div className="op-toolbar">
              <div className="op-seg" role="tablist">
                <button type="button" className={view === 'sheet' ? 'on' : ''} onClick={() => setView('sheet')}>Sheet</button>
                <button type="button" className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>Calendar</button>
              </div>
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Due month">
                <option value="all">All due months</option>
                <option value="2026-10">October</option>
                <option value="2026-11">November</option>
              </select>
              <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} aria-label="Card">
                <option value="all">All cards</option>
                {CARDS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button type="button" className="op-linkbtn" onClick={() => setSortAsc((s) => !s)}>
                Due date {sortAsc ? '↑' : '↓'}
              </button>
            </div>

            {view === 'sheet' && (
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
                          <td style={td}>
                            <span className="op-due-pill" style={{ background: ds.bg, color: ds.color }}>{fmtDue(r.due)}</span>
                          </td>
                          <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{money(r.amount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {view === 'calendar' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(220px,340px)', gap: 18 }}>
                <div className="op-cal-wrap">
                  <div style={{ fontFamily: DEMO_HEAD, fontSize: 16, fontWeight: 600, marginBottom: 10 }}>October 2026</div>
                  <div className="op-cal-head">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="op-cal-grid">
                    {CAL_CELLS.map((c, i) => {
                      if (c.type === 'pad') return <div key={`p${i}`} className="pad" />
                      const sel = calDay === c.iso
                      return (
                        <button
                          key={c.iso}
                          type="button"
                          className={`${c.count ? 'has-due' : ''}${sel ? ' sel' : ''}`}
                          onClick={() => setCalDay(c.iso)}
                        >
                          {c.day}
                          {c.count > 0 && <span className="dot" />}
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ fontFamily: DEMO_UI, fontSize: 11, color: MUTED, marginTop: 10 }}>November dues appear on the sheet view with blue highlighting.</p>
                </div>
                <div className="op-cal-wrap">
                  <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em', marginBottom: 8 }}>{fmtDueLong(calDay)}</div>
                  {dayRows.length === 0 ? (
                    <p style={{ color: MUTED, fontSize: 13 }}>No card payments due this day in the sample.</p>
                  ) : (
                    dayRows.map((r, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: ACCENT }}>{CARDS.find((c) => c.id === r.card)?.short}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{r.vendor}</div>
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{money(r.amount)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="op-row-2">
            <div className="op-panel" style={{ marginBottom: 0 }}>
              <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Short-term loans</h2>
              <div className="op-scroll">
                <table>
                  <thead>
                    <tr>
                      <th style={th}>Facility</th>
                      <th style={th}>Payment due</th>
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
            <div className="op-panel" style={{ marginBottom: 0, background: '#F7F9FC' }}>
              <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em' }}>OUTFLOW CHECK</div>
              <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.85, fontFamily: DEMO_UI }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Cards (filtered)</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{money(ccTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Loan payments</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{money(stlDue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ color: MUTED }}>Amount going out</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{money(goingOut)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: cushion < 0 ? WARN : '#1E7A4A' }}>
                  <span>Cushion vs. combined liquid</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{cushion < 0 ? `(${money(Math.abs(cushion))})` : money(cushion)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="op-panel" style={{ marginTop: 18 }}>
            <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>US monthly outflow</h2>
            <div className="op-scroll">
              <table>
                <thead>
                  <tr>
                    <th style={th}>Month</th>
                    <th style={{ ...th, textAlign: 'right' }}>Payroll</th>
                    <th style={{ ...th, textAlign: 'right' }}>Rent</th>
                    <th style={{ ...th, textAlign: 'right' }}>Debt service</th>
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
          </div>

          <div className="op-panel">
            <h2 style={{ fontFamily: DEMO_HEAD, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Canada portfolio</h2>
            <div className="op-scroll">
              <table>
                <thead>
                  <tr>
                    <th style={th}>Entity</th>
                    <th style={{ ...th, textAlign: 'right' }}>Exposure</th>
                    <th style={th}>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {CA_PORTFOLIO.map((r) => (
                    <tr key={r.entity}>
                      <td style={td}>{r.entity}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.exposure)}</td>
                      <td style={{ ...td, color: MUTED, fontSize: 12 }}>{r.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
