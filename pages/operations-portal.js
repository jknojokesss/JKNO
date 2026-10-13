import { useMemo, useState } from 'react'
import Head from 'next/head'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

// Sample cash-flow ops desk — same layout patterns as a private multi-bank /
// card-payables portal (workbook-driven, upload refresh). Fictitious data.
const BIZ = 'Hayfield Finance'
const NAVY = '#1A2744'
const ACCENT = '#3D6EA8'
const BG = '#E8EBF0'
const INK = '#1A2433'
const MUTED = '#5A6578'
const OCT = '#C4A035'
const NOV = '#3D6EA8'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'

const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

const BANKS = [
  { id: 'mcb', name: 'MCB', balance: 284200, entered: 'Oct 13 · 8:42 AM' },
  { id: 'valley', name: 'Valley', balance: 91200, entered: 'Oct 13 · 9:05 AM' },
  { id: 'first', name: 'Firstbank', balance: 43800, entered: 'Oct 12 · 4:30 PM' },
]

const CARDS = [
  { id: 'cap9618', label: 'Capital One ···9618' },
  { id: 'amex', label: 'Amex ···4402' },
  { id: 'chase', label: 'Chase ···1187' },
]

const PAYABLES = [
  { card: 'cap9618', vendor: 'Eastern Warehouse', due: '2026-10-18', amount: 12400 },
  { card: 'cap9618', vendor: 'Fleet fuel', due: '2026-10-22', amount: 3200 },
  { card: 'amex', vendor: 'Software renewals', due: '2026-10-28', amount: 890 },
  { card: 'chase', vendor: 'Insurance installment', due: '2026-11-03', amount: 4100 },
  { card: 'chase', vendor: 'Office supply', due: '2026-11-08', amount: 640 },
  { card: 'amex', vendor: 'Travel — conference', due: '2026-11-12', amount: 2180 },
  { card: 'cap9618', vendor: 'Vendor terms net-30', due: '2026-11-15', amount: 18750 },
]

const STL = [
  { lender: 'Line A — Valley', balance: 85000, payment: 4200, due: '2026-10-25' },
  { lender: 'Bridge note', balance: 40000, payment: 2000, due: '2026-11-01' },
]

const US_OUTFLOW = [
  { month: 'Oct 2026', payroll: 142000, rent: 28000, debt: 18500, other: 22100 },
  { month: 'Nov 2026', payroll: 142000, rent: 28000, debt: 19200, other: 19800 },
]

const CA_PORTFOLIO = [
  { entity: 'North Maple REIT slice', exposure: 2100000, nextAction: 'Covenant cert due Nov 5' },
  { entity: 'Toronto retail JV', exposure: 890000, nextAction: 'Distribution review Oct 20' },
]

function dueMonthKey(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dueTone(iso) {
  const m = new Date(iso + 'T12:00:00').getMonth()
  if (m === 9) return OCT
  if (m === 10) return NOV
  return MUTED
}

function fmtDue(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

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
  const goingOut = ccTotal + STL.reduce((s, r) => s + r.payment, 0)
  const shortage = Math.max(0, goingOut - bankTotal * 0.15)

  const calDays = useMemo(() => {
    const set = new Set(PAYABLES.map((p) => p.due))
    return [...set].sort()
  }, [])

  const dayRows = PAYABLES.filter((p) => p.due === calDay)

  const fakeUpload = () => {
    setUploadMsg('Sample only — your live portal refreshes from an .xlsx upload. No redeploy.')
    setTimeout(() => setUploadMsg(''), 4000)
  }

  const th = {
    padding: '8px 10px',
    fontSize: '9px',
    color: MUTED,
    background: '#DDE3EC',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #C8D0DC',
    fontFamily: DEMO_MONO,
    whiteSpace: 'nowrap',
  }
  const td = {
    padding: '9px 10px',
    borderBottom: '1px solid #E2E7EF',
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
          .op-top{background:${NAVY};color:#fff;padding:14px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
          .op-main{padding:20px 18px 56px;max-width:1200px;margin:0 auto}
          .op-banks{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:18px}
          .op-bank{background:#fff;border:1px solid #C8D0DC;border-radius:6px;padding:12px 14px}
          .op-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
          .op-toolbar select,.op-toolbar button{font-family:${DEMO_UI};font-size:12px;padding:7px 10px;border-radius:5px;border:1px solid #C8D0DC;background:#fff;color:${INK}}
          .op-toolbar button.on{background:${NAVY};color:#fff;border-color:${NAVY}}
          .op-card{background:#fff;border:1px solid #C8D0DC;border-radius:6px;padding:14px;margin-bottom:16px;overflow-x:auto}
          .op-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .op-cal{display:grid;grid-template-columns:repeat(7,minmax(36px,1fr));gap:4px;margin-top:10px}
          .op-cal button{border:1px solid #C8D0DC;background:#fff;border-radius:4px;padding:8px 4px;font-size:11px;cursor:pointer;font-family:${DEMO_UI}}
          .op-cal button.has{background:#EEF3FA;border-color:${ACCENT}}
          .op-cal button.sel{background:${ACCENT};color:#fff;border-color:${ACCENT}}
          @media(max-width:640px){.op-main{padding:14px 12px 48px}}
        `}</style>
      </Head>

      <DemoLobby />

      <div className={DEMO_PORTAL_ROOT_CLASS}>
        <header className="op-top">
          <div>
            <div style={{ fontFamily: DEMO_HEAD, fontSize: '18px', fontWeight: 600 }}>{BIZ}</div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', letterSpacing: '.14em', opacity: 0.85, marginTop: 2 }}>OPERATIONS · CASH FLOW</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={fakeUpload} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 5, padding: '8px 12px', fontFamily: DEMO_MONO, fontSize: '10px', letterSpacing: '.06em', cursor: 'pointer' }}>
              UPLOAD .XLSX (DEMO)
            </button>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontFamily: DEMO_MONO, fontSize: '10px', opacity: 0.9 }}>Built by JK →</a>
          </div>
        </header>

        {uploadMsg && (
          <div style={{ background: '#2E4A6E', color: '#fff', textAlign: 'center', padding: '8px 14px', fontFamily: DEMO_UI, fontSize: 13 }}>
            {uploadMsg}
          </div>
        )}

        <main className="op-main">
          <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginBottom: 12 }}>
            SAMPLE DATA · spreadsheet layout · October / November due-date colors
          </div>

          <div className="op-banks">
            {BANKS.map((b) => (
              <div key={b.id} className="op-bank">
                <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em' }}>{b.name}</div>
                <div style={{ fontFamily: DEMO_HEAD, fontSize: 22, fontWeight: 600, marginTop: 4 }}>{money(b.balance)}</div>
                <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginTop: 4 }}>Last entered {b.entered}</div>
              </div>
            ))}
          </div>

          <div className="op-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <div style={{ fontFamily: DEMO_HEAD, fontSize: 17, fontWeight: 600 }}>Credit card payables</div>
              <div style={{ fontFamily: DEMO_MONO, fontSize: 11, color: MUTED }}>
                Filtered total <span style={{ color: INK, fontWeight: 600 }}>{money(ccTotal)}</span>
              </div>
            </div>

            <div className="op-toolbar">
              <button type="button" className={view === 'sheet' ? 'on' : ''} onClick={() => setView('sheet')}>Sheet</button>
              <button type="button" className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>Calendar</button>
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Due month">
                <option value="all">All due months</option>
                <option value="2026-10">October dues</option>
                <option value="2026-11">November dues</option>
              </select>
              <select value={cardFilter} onChange={(e) => setCardFilter(e.target.value)} aria-label="Card">
                <option value="all">All cards</option>
                {CARDS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => setSortAsc((s) => !s)}>Sort due date {sortAsc ? '↑' : '↓'}</button>
            </div>

            {view === 'sheet' && (
              <div className="op-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={th}>Card</th>
                      <th style={th}>Vendor</th>
                      <th style={th}>Due</th>
                      <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={i}>
                        <td style={td}>{CARDS.find((c) => c.id === r.card)?.label}</td>
                        <td style={td}>{r.vendor}</td>
                        <td style={{ ...td, color: dueTone(r.due), fontWeight: 600 }}>{fmtDue(r.due)}</td>
                        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === 'calendar' && (
              <>
                <div className="op-cal">
                  {calDays.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`has${calDay === d ? ' sel' : ''}`}
                      onClick={() => setCalDay(d)}
                    >
                      {fmtDue(d)}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginBottom: 8 }}>{fmtDue(calDay)} · by card</div>
                  {dayRows.length === 0 ? (
                    <div style={{ color: MUTED, fontSize: 13 }}>Nothing due this day in the sample set.</div>
                  ) : (
                    dayRows.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #EEF1F5', fontSize: 13 }}>
                        <span>{CARDS.find((c) => c.id === r.card)?.label} — {r.vendor}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(r.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="op-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            <div>
              <div style={{ fontFamily: DEMO_HEAD, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Short-term loans</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Lender</th>
                    <th style={th}>Pmt due</th>
                    <th style={{ ...th, textAlign: 'right' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {STL.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.lender}</td>
                      <td style={td}>{fmtDue(r.due)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.payment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: '#F4F6FA', borderRadius: 6, padding: 14, border: '1px solid #DDE3EC' }}>
              <div style={{ fontFamily: DEMO_MONO, fontSize: 9, color: MUTED, letterSpacing: '.1em' }}>OUTFLOW CHECK</div>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Amount going out</span><strong>{money(goingOut)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>Liquid snapshot (sample)</span><strong>{money(bankTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid #C8D0DC`, color: shortage > 0 ? '#A63D2E' : INK }}>
                  <span>Shortage flag</span><strong>{shortage > 0 ? money(shortage) : '—'}</strong>
                </div>
              </div>
              <div style={{ fontFamily: DEMO_MONO, fontSize: 10, color: MUTED, marginTop: 10 }}>Totals follow workbook rules in production — not live bank feeds.</div>
            </div>
          </div>

          <div className="op-card">
            <div style={{ fontFamily: DEMO_HEAD, fontSize: 16, fontWeight: 600, marginBottom: 10 }}>US monthly outflow (sample)</div>
            <div className="op-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
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
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.payroll)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.rent)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.debt)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.other)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="op-card">
            <div style={{ fontFamily: DEMO_HEAD, fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Canada portfolio (sample)</div>
            <div className="op-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr>
                    <th style={th}>Entity</th>
                    <th style={{ ...th, textAlign: 'right' }}>Exposure</th>
                    <th style={th}>Next</th>
                  </tr>
                </thead>
                <tbody>
                  {CA_PORTFOLIO.map((r) => (
                    <tr key={r.entity}>
                      <td style={td}>{r.entity}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(r.exposure)}</td>
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
