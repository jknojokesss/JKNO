import { useState } from 'react'
import Head from 'next/head'

const BIZ = 'Riverside Tires'
const THEME = { side: '#1E1C19', border: '#33302B', accent: '#B0281C', content: '#F2F0EA' }
const C = {
  paper: '#F2F0EA',
  card: '#FFFFFF',
  ink: '#1B1815',
  sub: '#6A655C',
  muted: '#9A9284',
  hair: '#DBD5C7',
  line: '#E6E1D6',
  red: '#B0281C',
  green: '#1C7A4E',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"
const FONT =
  'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap'

const fmtC = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmt0 = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n) => `${Number(n).toFixed(1)}%`

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'financials', label: 'Financials' },
  { id: 'inventory', label: 'Sales & Items' },
  { id: 'orders', label: 'Orders' },
  { id: 'stock', label: 'Stock' },
  { id: 'ai', label: 'Ask' },
]

// Fictitious shop — shaped like Reydel orders view (Clover ticket × distributor cost).
const ORDER_LINES = [
  { date: '2026-06-26', ticket: 'C-88421', item: '235/65R17 Bridgestone Ecopia ×4', sale: 520, cost: 300, source: 'Weldon · matched' },
  { date: '2026-06-26', ticket: 'C-88419', item: 'Oil change + rotation', sale: 115, cost: 42, source: 'Parts est.' },
  { date: '2026-06-25', ticket: 'C-88402', item: '205/55R16 Michelin Primacy ×2', sale: 248, cost: 130, source: 'Weldon · matched' },
  { date: '2026-06-25', ticket: 'C-88398', item: 'Tire plug repair', sale: 25, cost: 4, source: 'Service' },
  { date: '2026-06-25', ticket: 'C-88391', item: '245/70R17 BFG A/T ×4 + alignment', sale: 620, cost: 340, source: 'Weldon · matched' },
  { date: '2026-06-24', ticket: 'C-88370', item: '225/60R17 Goodyear Assurance ×4', sale: 440, cost: 280, source: 'Inventory' },
  { date: '2026-06-24', ticket: 'C-88365', item: 'TPMS sensor ×2', sale: 210, cost: 72, source: 'Parts est.' },
  { date: '2026-06-23', ticket: 'C-88340', item: '255/50R20 Michelin Latitude ×4', sale: 880, cost: 460, source: 'Weldon · same-day' },
  { date: '2026-06-23', ticket: 'C-88332', item: 'Wheel balance (set)', sale: 48, cost: 8, source: 'Service' },
  { date: '2026-06-22', ticket: 'C-88310', item: '265/70R17 Toyo Open Country ×2', sale: 280, cost: 170, source: 'Weldon · matched' },
]

const ORDER_ROWS = ORDER_LINES.map((r) => {
  const profit = r.sale - r.cost
  const margin = r.sale > 0 ? (profit / r.sale) * 100 : 0
  return { ...r, profit, margin }
})

const ITEMS = [
  { name: '235/65/17 Bridgestone Ecopia', orders: 48, qty: 96, rev: 11520, cost: 7200 },
  { name: '205/55/16 Michelin Primacy', orders: 41, qty: 82, rev: 8610, cost: 5330 },
  { name: '225/60/17 Goodyear Assurance', orders: 37, qty: 74, rev: 8140, cost: 5180 },
  { name: 'Tire plug / patch repair', orders: 62, qty: 62, rev: 1550, cost: 310 },
  { name: 'Tire rotation (set)', orders: 55, qty: 55, rev: 1925, cost: 275 },
  { name: '245/70/17 BFGoodrich A/T', orders: 28, qty: 56, rev: 7840, cost: 4760 },
]

const STOCK = [
  { size: '235/65/17', desc: 'Bridgestone Ecopia', onHand: 8, reorder: 6, unitCost: 75 },
  { size: '205/55/16', desc: 'Michelin Primacy', onHand: 6, reorder: 4, unitCost: 65 },
  { size: '225/60/17', desc: 'Goodyear Assurance', onHand: 10, reorder: 6, unitCost: 70 },
  { size: '245/70/17', desc: 'BFGoodrich A/T', onHand: 6, reorder: 4, unitCost: 85 },
  { size: '265/70/17', desc: 'Toyo Open Country', onHand: 2, reorder: 4, unitCost: 85 },
]

const CLOSED_MONTHS = [
  { label: 'MAY', month: '2026-05', revenue: 38100, cogs: 23900, profit: 14200 },
  { label: 'JUN', month: '2026-06', revenue: 34800, cogs: 21800, profit: 13000 },
]

const hcell = (align = 'left') => ({
  padding: '7px 12px',
  fontSize: '9px',
  color: C.muted,
  background: '#ECE7DD',
  fontWeight: 400,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${C.hair}`,
  fontFamily: ui,
  textAlign: align,
})
const cell = (align = 'left', extra = {}) => ({
  padding: '9px 12px',
  borderBottom: `1px solid ${C.line}`,
  color: C.ink,
  fontSize: '11px',
  fontFamily: ui,
  textAlign: align,
  ...extra,
})

function DemoShell({ tab, setTab, right, children }) {
  return (
    <div className="rt-shell">
      <aside className="rt-side">
        <div style={{ padding: '2px 8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: THEME.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 700,
                color: '#fff',
                fontFamily: head,
              }}
            >
              R
            </span>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', fontFamily: head }}>
                RIVERSIDE
              </div>
              <div style={{ fontSize: 9, color: '#7C766B', letterSpacing: '0.3em', fontFamily: head, fontWeight: 500, marginTop: 3 }}>
                TIRE &amp; AUTO
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: THEME.border, margin: '16px 8px' }} />
        <nav className="rt-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className="rt-navbtn"
              onClick={() => setTab(n.id)}
              style={
                tab === n.id
                  ? { background: 'rgba(176,40,28,.16)', color: '#fff', boxShadow: `inset 2px 0 0 ${THEME.accent}` }
                  : undefined
              }
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="rt-foot">
          <div style={{ fontFamily: mono, fontSize: 9, color: '#7C766B', lineHeight: 1.6 }}>
            SAMPLE DEMO
            <br />
            <a href="https://jknojokes.com" style={{ color: '#948D81', textDecoration: 'underline' }}>
              JK No Jokes Financials
            </a>
          </div>
        </div>
      </aside>
      <main className="rt-main">
        <div className="rt-status">
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
            {BIZ} · FICTITIOUS SHOP
          </span>
          {right || (
            <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>Demo data · not QuickBooks</span>
          )}
        </div>
        <div className="rt-content">{children}</div>
      </main>
      <div className="rt-mobilenav">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PageHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 23,
          fontWeight: 700,
          color: C.ink,
          fontFamily: head,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: C.muted, fontFamily: ui, marginTop: 4, maxWidth: '62ch' }}>{sub}</div>
      )}
    </div>
  )
}

export default function RiversideTires() {
  const [tab, setTab] = useState('orders')
  const [sort, setSort] = useState('rev')
  const [aiQ, setAiQ] = useState('')
  const [aiA, setAiA] = useState('')

  const sortedItems = [...ITEMS].sort((a, b) => b[sort] - a[sort])
  const openRegister = ORDER_ROWS.reduce(
    (acc, r) => ({
      sale: acc.sale + r.sale,
      cost: acc.cost + r.cost,
      tickets: acc.tickets + 1,
    }),
    { sale: 0, cost: 0, tickets: 0 },
  )
  openRegister.profit = openRegister.sale - openRegister.cost
  openRegister.margin = openRegister.sale ? (openRegister.profit / openRegister.sale) * 100 : 0

  const last = CLOSED_MONTHS[CLOSED_MONTHS.length - 1]
  const totalProfit = ORDER_ROWS.reduce((s, r) => s + r.profit, 0)
  const totalRev = ORDER_ROWS.reduce((s, r) => s + r.sale, 0)

  const askAi = () => {
    if (!aiQ.trim()) return
    const q = aiQ.toLowerCase()
    let ans = `Matched tickets this week: ${fmt0(totalProfit)} est. gross on ${fmt0(totalRev)} sales.`
    if (q.includes('margin')) ans = `Average margin on shown lines is ${pct(ORDER_ROWS.reduce((s, r) => s + r.margin, 0) / ORDER_ROWS.length)}.`
    if (q.includes('stock') || q.includes('reorder')) ans = `${STOCK.filter((s) => s.onHand <= s.reorder).length} sizes at or below reorder.`
    setAiA(ans)
  }

  const panel = { background: C.card, border: `1px solid ${C.hair}`, padding: '18px 20px', marginBottom: 20 }

  return (
    <>
      <Head>
        <title>{BIZ} — Sample portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href={FONT} rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${ui};background:${C.paper};color:${C.ink};font-variant-numeric:tabular-nums}
        .rt-shell{display:flex;min-height:100vh;align-items:stretch;background:${C.paper}}
        .rt-side{width:214px;flex-shrink:0;background:${THEME.side};box-shadow:inset -3px 0 0 ${THEME.accent};display:flex;flex-direction:column;padding:20px 12px;position:sticky;top:0;height:100vh}
        .rt-nav{display:flex;flex-direction:column;gap:2px;flex:1}
        .rt-navbtn{display:block;width:100%;text-align:left;padding:10px 11px;border:none;border-left:2px solid transparent;background:transparent;color:#948D81;font-family:${head};font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
        .rt-navbtn:hover{background:rgba(255,255,255,.05);color:#EDEBE6}
        .rt-foot{padding:12px 8px 0;border-top:1px solid ${THEME.border};margin-top:8px}
        .rt-main{flex:1;min-width:0;background:${C.paper}}
        .rt-status{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${C.hair};padding:12px 30px;gap:12px;flex-wrap:wrap}
        .rt-content{padding:26px 30px 56px;max-width:1160px}
        .rt-mobilenav{display:none}
        @media(max-width:860px){
          .rt-shell{flex-direction:column}
          .rt-side{display:none}
          .rt-mobilenav{display:flex;overflow-x:auto;gap:4px;padding:8px 10px;background:${THEME.side};position:sticky;top:0;z-index:9;-webkit-overflow-scrolling:touch;box-shadow:inset 0 -3px 0 ${THEME.accent}}
          .rt-mobilenav button{flex-shrink:0;border:none;background:rgba(255,255,255,.06);color:#948D81;font-family:${head};font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;padding:8px 12px;cursor:pointer;white-space:nowrap}
          .rt-mobilenav button.on{background:rgba(176,40,28,.2);color:#fff;box-shadow:inset 0 -2px 0 ${THEME.accent}}
          .rt-content{padding:18px 14px 48px}
          .rt-status{padding:10px 14px}
        }
      `}</style>

      <DemoShell
        tab={tab}
        setTab={setTab}
        right={
          tab === 'orders' ? (
            <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
              {ORDER_ROWS.length} tickets · Clover + distributor
            </span>
          ) : undefined
        }
      >
        {tab === 'orders' && (
          <>
            <PageHead
              title="Orders"
              sub="Register tickets matched to distributor invoices. Sample numbers — not what’s in QuickBooks."
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'TICKETS', value: ORDER_ROWS.length, sub: 'shown', color: C.ink },
                { label: 'SALES', value: fmt0(totalRev), sub: 'sample week', color: C.ink },
                { label: 'EST. COST', value: fmt0(openRegister.cost), sub: 'matched + est.', color: C.sub },
                { label: 'EST. GROSS', value: fmt0(totalProfit), sub: pct((totalProfit / totalRev) * 100), color: C.green },
              ].map((k) => (
                <div key={k.label} style={{ flex: '1 1 140px', background: C.card, border: `1px solid ${C.hair}`, padding: '14px 16px' }}>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.15em', marginBottom: 6, fontFamily: ui }}>{k.label}</div>
                  <div style={{ fontSize: 18, color: k.color, fontWeight: 600, fontFamily: ui, lineHeight: 1.2 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: ui }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={hcell()}>Date</th>
                    <th style={hcell()}>Ticket</th>
                    <th style={hcell()}>Line</th>
                    <th style={hcell('right')}>Sale</th>
                    <th style={hcell('right')}>Cost</th>
                    <th style={hcell('right')}>Profit</th>
                    <th style={hcell('right')}>Margin</th>
                    <th style={hcell()}>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_ROWS.map((r, i) => (
                    <tr key={r.ticket} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                      <td style={cell('left', { fontFamily: mono, fontSize: 10, color: C.muted })}>{r.date}</td>
                      <td style={cell('left', { fontFamily: mono, fontSize: 10 })}>{r.ticket}</td>
                      <td style={cell()}>{r.item}</td>
                      <td style={cell('right', { fontFamily: mono, fontWeight: 500 })}>{fmtC(r.sale)}</td>
                      <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmtC(r.cost)}</td>
                      <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: C.green })}>{fmtC(r.profit)}</td>
                      <td style={cell('right', { fontFamily: mono, color: C.green })}>{pct(r.margin)}</td>
                      <td style={cell('left', { fontSize: 10, color: C.sub })}>{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'dashboard' && (
          <>
            <PageHead title="Dashboard" sub="Open month at the register, then closed-month books below. Sample demo." />
            <div style={{ ...panel, marginBottom: 28, cursor: 'pointer' }} onClick={() => setTab('orders')}>
              <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                June · At the register
              </div>
              <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 12 }}>
                Clover sales · distributor cost · not closed books
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {[
                  ['Sales', fmt0(openRegister.sale)],
                  ['Est. cost', fmt0(openRegister.cost)],
                  ['Est. gross', fmt0(openRegister.profit)],
                  ['Margin', pct(openRegister.margin)],
                  ['Tickets', String(openRegister.tickets)],
                ].map(([l, v], i) => (
                  <div key={l} style={{ flex: '1 1 120px', padding: '10px 14px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
                    <div style={{ fontFamily: ui, fontSize: 10.5, color: C.muted }}>{l}</div>
                    <div style={{ fontFamily: mono, fontSize: 16, color: l === 'Est. gross' ? C.green : C.ink, fontWeight: 500, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: head, fontSize: 13, fontWeight: 600, color: C.red, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Net profit · {last.label} 2026
            </div>
            <div style={{ fontFamily: head, fontSize: 56, fontWeight: 700, color: C.ink, lineHeight: 1, margin: '6px 0 16px' }}>{fmt0(last.profit)}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                ['Revenue', fmt0(last.revenue)],
                ['COGS', fmt0(last.cogs)],
                ['Net margin', pct((last.profit / last.revenue) * 100)],
              ].map(([l, v]) => (
                <div key={l} style={{ ...panel, flex: '1 1 160px', marginBottom: 0 }}>
                  <div style={{ fontFamily: ui, fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontFamily: mono, fontSize: 18, marginTop: 6, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'financials' && (
          <>
            <PageHead title="Financials" sub="Official-style P&amp;L from QuickBooks sync. Sample months." />
            <table style={{ width: '100%', borderCollapse: 'collapse', background: C.card, border: `1px solid ${C.hair}` }}>
              <thead>
                <tr>
                  <th style={hcell()}>Month</th>
                  <th style={hcell('right')}>Revenue</th>
                  <th style={hcell('right')}>COGS</th>
                  <th style={hcell('right')}>Net profit</th>
                  <th style={hcell('right')}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {CLOSED_MONTHS.map((m, i) => (
                  <tr key={m.month} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                    <td style={cell('left', { fontFamily: mono, fontWeight: 500 })}>{m.label} 2026</td>
                    <td style={cell('right', { fontFamily: mono })}>{fmt0(m.revenue)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmt0(m.cogs)}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: C.green })}>{fmt0(m.profit)}</td>
                    <td style={cell('right', { fontFamily: mono })}>{pct((m.profit / m.revenue) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'inventory' && (
          <>
            <PageHead title="Sales & Items" sub="Clover line items ranked by revenue — June sample." />
            <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['rev', 'Revenue'], ['orders', 'Orders'], ['qty', 'Units']].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    padding: '6px 10px',
                    border: `1px solid ${sort === k ? C.red : C.hair}`,
                    background: sort === k ? C.red : C.card,
                    color: sort === k ? '#fff' : C.muted,
                    cursor: 'pointer',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: C.card, border: `1px solid ${C.hair}` }}>
              <thead>
                <tr>
                  <th style={hcell()}>Item</th>
                  <th style={hcell('right')}>Orders</th>
                  <th style={hcell('right')}>Revenue</th>
                  <th style={hcell('right')}>COGS</th>
                  <th style={hcell('right')}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((it, i) => (
                  <tr key={it.name} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                    <td style={cell()}>{it.name}</td>
                    <td style={cell('right', { color: C.sub })}>{it.orders}</td>
                    <td style={cell('right', { fontFamily: mono })}>{fmt0(it.rev)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmt0(it.cost)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.green })}>{pct(((it.rev - it.cost) / it.rev) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'stock' && (
          <>
            <PageHead title="Stock" sub="On-hand from dated purchase layers minus sales — sample as of Jun 30." />
            <table style={{ width: '100%', borderCollapse: 'collapse', background: C.card, border: `1px solid ${C.hair}` }}>
              <thead>
                <tr>
                  <th style={hcell()}>Size</th>
                  <th style={hcell()}>Description</th>
                  <th style={hcell('right')}>On hand</th>
                  <th style={hcell('right')}>Reorder at</th>
                  <th style={hcell('right')}>Unit cost</th>
                </tr>
              </thead>
              <tbody>
                {STOCK.map((s, i) => {
                  const low = s.onHand <= s.reorder
                  return (
                    <tr key={s.size} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                      <td style={cell('left', { fontFamily: mono })}>{s.size}</td>
                      <td style={cell()}>{s.desc}</td>
                      <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: low ? C.red : C.ink })}>{s.onHand}</td>
                      <td style={cell('right', { fontFamily: mono, color: C.sub })}>{s.reorder}</td>
                      <td style={cell('right', { fontFamily: mono })}>{fmtC(s.unitCost)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {tab === 'ai' && (
          <>
            <PageHead title="Ask" sub="Answers from your synced books and register — sample responses." />
            <div style={{ ...panel, maxWidth: 640 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={aiQ}
                  onChange={(e) => setAiQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()}
                  placeholder="e.g. What’s my margin this week?"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${C.hair}`,
                    fontFamily: ui,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={askAi}
                  style={{
                    background: C.red,
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    fontFamily: mono,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Ask
                </button>
              </div>
              {aiA && (
                <div style={{ fontFamily: ui, fontSize: 14, lineHeight: 1.6, color: C.ink, background: '#FAF8F4', padding: 14, border: `1px solid ${C.line}` }}>
                  {aiA}
                </div>
              )}
            </div>
          </>
        )}
      </DemoShell>
    </>
  )
}
