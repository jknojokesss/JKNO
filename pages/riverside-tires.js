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

// Fictitious shop — sample pinned to Sep 25, 2026 (books closed through August).
const ORDER_LINES = [
  { date: '2026-09-25', ticket: 'C-89221', item: '235/65R17 Bridgestone Ecopia ×4', sale: 520, cost: 300, source: 'Weldon · matched' },
  { date: '2026-09-25', ticket: 'C-89219', item: 'Oil change + rotation', sale: 115, cost: 42, source: 'Parts est.' },
  { date: '2026-09-24', ticket: 'C-89202', item: '205/55R16 Michelin Primacy ×2', sale: 248, cost: 130, source: 'Weldon · matched' },
  { date: '2026-09-24', ticket: 'C-89198', item: 'Tire plug repair', sale: 25, cost: 4, source: 'Service' },
  { date: '2026-09-24', ticket: 'C-89191', item: '245/70R17 BFG A/T ×4 + alignment', sale: 620, cost: 340, source: 'Weldon · matched' },
  { date: '2026-09-23', ticket: 'C-89170', item: '225/60R17 Goodyear Assurance ×4', sale: 440, cost: 280, source: 'Inventory' },
  { date: '2026-09-23', ticket: 'C-89165', item: 'TPMS sensor ×2', sale: 210, cost: 72, source: 'Parts est.' },
  { date: '2026-09-22', ticket: 'C-89140', item: '255/50R20 Michelin Latitude ×4', sale: 880, cost: 460, source: 'Weldon · same-day' },
  { date: '2026-09-22', ticket: 'C-89132', item: 'Wheel balance (set)', sale: 48, cost: 8, source: 'Service' },
  { date: '2026-09-22', ticket: 'C-89110', item: '265/70R17 Toyo Open Country ×2', sale: 280, cost: 170, source: 'Weldon · matched' },
]

const ORDER_ROWS = ORDER_LINES.map((r) => {
  const profit = r.sale - r.cost
  const margin = r.sale > 0 ? (profit / r.sale) * 100 : 0
  return { ...r, profit, margin }
})

// Same lines as Orders — one row per ticket (no conflicting “full month” item totals).
const WEEK_ITEMS = ORDER_ROWS.map((r) => ({
  name: r.item,
  orders: 1,
  qty: 1,
  rev: r.sale,
  cost: r.cost,
}))

const STOCK = [
  { size: '235/65/17', desc: 'Bridgestone Ecopia', onHand: 8, reorder: 6, unitCost: 75 },
  { size: '205/55/16', desc: 'Michelin Primacy', onHand: 6, reorder: 4, unitCost: 65 },
  { size: '225/60/17', desc: 'Goodyear Assurance', onHand: 10, reorder: 6, unitCost: 70 },
  { size: '245/70/17', desc: 'BFGoodrich A/T', onHand: 6, reorder: 4, unitCost: 85 },
  { size: '265/70/17', desc: 'Toyo Open Country', onHand: 2, reorder: 4, unitCost: 85 },
]

// Closed books — line items sum to these totals (matches dashboard headline month).
const CLOSED_MONTHS = [
  { label: 'JUL', month: '2026-07', revenue: 36200, cogs: 14000, opex: 9000, profit: 13200 },
  { label: 'AUG', month: '2026-08', revenue: 37100, cogs: 14400, opex: 9100, profit: 13600 },
]

const MONTHLY_TREND = [
  { month: '2026-04', label: 'APR', revenue: 35600, profit: 12800, closed: true },
  { month: '2026-05', label: 'MAY', revenue: 38100, profit: 14200, closed: true },
  { month: '2026-06', label: 'JUN', revenue: 34800, profit: 13000, closed: true },
  { month: '2026-07', label: 'JUL', revenue: 36200, profit: 13200, closed: true },
  { month: '2026-08', label: 'AUG', revenue: 37100, profit: 13600, closed: true },
  { month: '2026-09', label: 'SEP', revenue: 16200, profit: null, closed: false },
]

const PL_BY_MONTH = {
  '2026-07': {
    income: [
      { label: 'Tire sales', amount: 29600 },
      { label: 'Service & labor', amount: 5000 },
      { label: 'Parts & accessories', amount: 1600 },
    ],
    cogs: [
      { label: 'Tire cost of sales', amount: 10800 },
      { label: 'Parts & fluids', amount: 2200 },
      { label: 'Shop supplies (COGS)', amount: 1000 },
    ],
    expense: [
      { label: 'Rent', amount: 4500 },
      { label: 'Payroll — shop', amount: 3100 },
      { label: 'Utilities', amount: 850 },
      { label: 'Insurance', amount: 400 },
      { label: 'Marketing', amount: 150 },
    ],
  },
  '2026-08': {
    income: [
      { label: 'Tire sales', amount: 30300 },
      { label: 'Service & labor', amount: 5200 },
      { label: 'Parts & accessories', amount: 1600 },
    ],
    cogs: [
      { label: 'Tire cost of sales', amount: 11100 },
      { label: 'Parts & fluids', amount: 2300 },
      { label: 'Shop supplies (COGS)', amount: 1000 },
    ],
    expense: [
      { label: 'Rent', amount: 4500 },
      { label: 'Payroll — shop', amount: 3200 },
      { label: 'Utilities', amount: 800 },
      { label: 'Insurance', amount: 400 },
      { label: 'Marketing', amount: 200 },
    ],
  },
}

const BS_AS_OF = {
  label: 'Aug 31, 2026',
  assets: [
    { label: 'Business checking', amount: 45200 },
    { label: 'Inventory', amount: 19200 },
    { label: 'Accounts receivable', amount: 3800 },
  ],
  liabilities: [
    { label: 'Accounts payable', amount: 10800 },
    { label: 'Credit cards', amount: 6400 },
    { label: 'Sales tax payable', amount: 2200 },
  ],
  equity: [{ label: "Owner's equity", amount: 48800 }],
}

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

function OrderCards({ rows }) {
  return (
    <div className="rt-order-cards">
      {rows.map((r) => (
        <article key={r.ticket} className="rt-order-card">
          <div className="rt-order-card__top">
            <span className="rt-order-card__ticket">{r.ticket}</span>
            <span className="rt-order-card__date">{r.date}</span>
          </div>
          <p className="rt-order-card__item">{r.item}</p>
          <dl className="rt-order-card__nums">
            <div><dt>Sale</dt><dd>{fmtC(r.sale)}</dd></div>
            <div><dt>Cost</dt><dd>{fmtC(r.cost)}</dd></div>
            <div><dt>Profit</dt><dd className="rt-order-card__profit">{fmtC(r.profit)}</dd></div>
            <div><dt>Margin</dt><dd>{pct(r.margin)}</dd></div>
          </dl>
          <p className="rt-order-card__match">{r.source}</p>
        </article>
      ))}
    </div>
  )
}

function DemoShell({ tab, setTab, right, children }) {
  return (
    <div className="rt-shell">
      <div className="rt-mobilenav" aria-label="Sections">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
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
          <a href="https://jknojokes.com" style={{ fontFamily: mono, fontSize: 10, color: '#948D81', textDecoration: 'underline' }}>
            JK No Jokes Financials
          </a>
        </div>
      </aside>
      <main className="rt-main">
        <div className="rt-status">
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
            {BIZ} · Sample · books through Aug 2026
          </span>
          {right || null}
        </div>
        <div className="rt-content">{children}</div>
      </main>
    </div>
  )
}

const sumLines = (lines) => lines.reduce((s, r) => s + r.amount, 0)
const paren = (n) => (n < 0 ? `(${fmt0(-n)})` : fmt0(n))

function FinTabs({ active, onChange, tabs }) {
  return (
    <div className="rt-fintabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" className={active === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function PlStatement({ monthKey }) {
  const pl = PL_BY_MONTH[monthKey]
  const meta = CLOSED_MONTHS.find((m) => m.month === monthKey)
  if (!pl || !meta) return null
  const inc = sumLines(pl.income)
  const cogs = sumLines(pl.cogs)
  const exp = sumLines(pl.expense)
  const gross = inc - cogs
  const net = gross - exp
  const panel = { background: C.card, border: `1px solid ${C.hair}`, padding: '18px 20px', maxWidth: 680 }

  const SectionHead = ({ children }) => (
    <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', fontWeight: 700, padding: '14px 8px 4px', fontFamily: ui }}>
      {children}
    </div>
  )
  const Line = ({ label, amount, indent }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: `6px 8px 6px ${indent ? 20 : 8}px`, fontFamily: ui, fontSize: 12, color: C.sub }}>
      <span>{label}</span>
      <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', color: C.ink }}>{paren(amount)}</span>
    </div>
  )
  const Total = ({ label, amount, accent, sub }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '9px 8px 4px',
        marginTop: 2,
        borderTop: `1px solid ${C.hair}`,
        fontFamily: ui,
        fontSize: 12,
        fontWeight: 600,
        color: C.ink,
      }}
    >
      <span>
        {label}
        {sub && <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginLeft: 8 }}>{sub}</span>}
      </span>
      <span style={{ fontFamily: mono, fontWeight: 700, color: accent ? C.green : C.ink }}>{paren(amount)}</span>
    </div>
  )

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${C.hair}`, paddingBottom: 12, marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: ui }}>Profit &amp; Loss</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontFamily: ui }}>{BIZ}</div>
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontFamily: ui, fontWeight: 500 }}>{meta.label} 2026 · Closed</div>
      </div>
      <SectionHead>INCOME</SectionHead>
      {pl.income.map((r) => <Line key={r.label} label={r.label} amount={r.amount} indent />)}
      <Total label="Total income" amount={inc} />
      <SectionHead>COST OF GOODS SOLD</SectionHead>
      {pl.cogs.map((r) => <Line key={r.label} label={r.label} amount={-r.amount} indent />)}
      <Total label="Gross profit" amount={gross} accent sub={inc > 0 ? `${pct((gross / inc) * 100)} margin` : null} />
      <SectionHead>OPERATING EXPENSES</SectionHead>
      {pl.expense.map((r) => <Line key={r.label} label={r.label} amount={-r.amount} indent />)}
      <Total label="Total operating expenses" amount={-exp} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          padding: '14px 12px',
          background: net >= 0 ? '#EEF3EE' : '#fef2f2',
          border: `1px solid ${net >= 0 ? '#C6DECB' : '#fecaca'}`,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: net >= 0 ? C.green : C.red, fontFamily: ui }}>NET INCOME</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          {inc > 0 && <span style={{ fontSize: 11, color: C.sub, fontFamily: ui }}>{pct((net / inc) * 100)} margin</span>}
          <span style={{ fontSize: 21, fontWeight: 700, color: net >= 0 ? C.green : C.red, fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt0(net)}</span>
        </span>
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

const FIN_TABS = [
  { id: 'pl', label: 'Profit & Loss' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'bs', label: 'Balance Sheet' },
]

export default function RiversideTires() {
  const [tab, setTab] = useState('orders')
  const [sort, setSort] = useState('rev')
  const [aiQ, setAiQ] = useState('')
  const [aiA, setAiA] = useState('')
  const [finView, setFinView] = useState('pl')
  const [plMonth, setPlMonth] = useState('2026-08')

  const sortedItems = [...WEEK_ITEMS].sort((a, b) => b[sort] - a[sort])
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
    if (q.includes('stock') || q.includes('reorder')) {
      const n = STOCK.filter((s) => s.onHand <= s.reorder).length
      ans = `${n} size${n === 1 ? '' : 's'} at or below reorder in the sample stock list.`
    }
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
        .rt-order-cards{display:none}
        .rt-order-card{background:${C.card};border:1px solid ${C.hair};padding:14px 16px}
        .rt-order-card__top{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px;font-family:${mono};font-size:11px;color:${C.muted}}
        .rt-order-card__ticket{color:${C.ink};font-weight:600;white-space:nowrap}
        .rt-order-card__date{white-space:nowrap}
        .rt-order-card__item{font-size:14px;line-height:1.4;margin:0 0 12px;color:${C.ink}}
        .rt-order-card__nums{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}
        .rt-order-card__nums dt{font-family:${ui};font-size:10px;color:${C.muted};text-transform:uppercase;letter-spacing:.06em}
        .rt-order-card__nums dd{margin:2px 0 0;font-family:${mono};font-size:15px;font-weight:500;color:${C.ink}}
        .rt-order-card__profit{color:${C.green}!important;font-weight:600!important}
        .rt-order-card__match{margin:12px 0 0;font-size:11px;color:${C.sub}}
        .rt-fintabs{display:flex;gap:2px;border-bottom:1px solid ${C.hair};margin-bottom:18px;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .rt-fintabs button{padding:8px 14px;font-size:10px;font-family:${ui};letter-spacing:.08em;background:none;border:none;cursor:pointer;color:${C.muted};border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
        .rt-fintabs button.on{color:${C.ink};border-bottom-color:${THEME.accent}}
        .rt-fin-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
        .rt-fin-pills span{font-size:9px;color:${C.muted};letter-spacing:.14em;font-weight:600;margin-right:2px}
        .rt-fin-pills button{font-family:${mono};font-size:10px;padding:6px 10px;border:1px solid ${C.hair};background:${C.card};color:${C.muted};cursor:pointer}
        .rt-fin-pills button.on{border-color:${C.red};background:${C.red};color:#fff}
        @media(max-width:860px){
          .rt-shell{flex-direction:column}
          .rt-side{display:none}
          .rt-mobilenav{display:flex;overflow-x:auto;gap:4px;padding:8px 10px;background:${THEME.side};position:sticky;top:0;z-index:20;-webkit-overflow-scrolling:touch;box-shadow:inset 0 -3px 0 ${THEME.accent}}
          .rt-mobilenav button{flex-shrink:0;border:none;background:rgba(255,255,255,.06);color:#948D81;font-family:${head};font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;padding:8px 12px;cursor:pointer;white-space:nowrap}
          .rt-mobilenav button.on{background:rgba(176,40,28,.2);color:#fff;box-shadow:inset 0 -2px 0 ${THEME.accent}}
          .rt-content{padding:18px 14px 48px}
          .rt-status{padding:10px 14px}
          .rt-order-table{display:none}
          .rt-order-cards{display:flex;flex-direction:column;gap:10px}
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
              sub="Register tickets matched to distributor cost for the last 7 days in the sample."
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
            <OrderCards rows={ORDER_ROWS} />
            <div className="rt-order-table" style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
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
            <PageHead title="Dashboard" sub="September at the register; books closed through August." />
            <div style={{ ...panel, marginBottom: 28, cursor: 'pointer' }} onClick={() => setTab('orders')}>
              <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Last 7 days · At the register
              </div>
              <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 12 }}>
                Through Sep 25 · {ORDER_ROWS.length} tickets · Clover sales · distributor cost
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
              Net profit · {last.label} 2026 · Books (closed)
            </div>
            <div style={{ fontFamily: head, fontSize: 56, fontWeight: 700, color: C.ink, lineHeight: 1, margin: '6px 0 16px' }}>{fmt0(last.profit)}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                ['Revenue', fmt0(last.revenue)],
                ['COGS', fmt0(last.cogs)],
                ['Operating', fmt0(last.opex)],
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
            <PageHead title="Financials" sub="Closed months through August; September is still open in the sample." />
            <FinTabs active={finView} onChange={setFinView} tabs={FIN_TABS} />

            {finView === 'pl' && (
              <>
                <div className="rt-fin-pills">
                  <span>PERIOD</span>
                  {CLOSED_MONTHS.map((m) => (
                    <button key={m.month} type="button" className={plMonth === m.month ? 'on' : ''} onClick={() => setPlMonth(m.month)}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <PlStatement monthKey={plMonth} />
              </>
            )}

            {finView === 'monthly' && (
              <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={hcell()}>Month</th>
                      <th style={hcell('right')}>Revenue</th>
                      <th style={hcell('right')}>Net income</th>
                      <th style={hcell('right')}>Margin</th>
                      <th style={hcell('right')}>vs prior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_TREND.map((m, i) => {
                      const priorProfit = i > 0 ? MONTHLY_TREND[i - 1].profit : null
                      const delta = m.profit != null && priorProfit != null ? m.profit - priorProfit : null
                      return (
                        <tr key={m.month} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                          <td style={cell('left', { fontFamily: mono, fontWeight: m.closed ? 600 : 400 })}>
                            {m.label} 2026{m.closed ? ' · closed' : ' · open'}
                          </td>
                          <td style={cell('right', { fontFamily: mono })}>
                            {fmt0(m.revenue)}{!m.closed ? ' MTD' : ''}
                          </td>
                          <td style={cell('right', { fontFamily: mono, fontWeight: m.closed ? 600 : 400, color: m.closed ? C.green : C.muted })}>
                            {m.profit != null ? fmt0(m.profit) : '—'}
                          </td>
                          <td style={cell('right', { fontFamily: mono })}>
                            {m.profit != null ? pct((m.profit / m.revenue) * 100) : '—'}
                          </td>
                          <td style={cell('right', { fontFamily: mono, color: delta == null ? C.muted : delta >= 0 ? C.green : C.red })}>
                            {delta == null ? '—' : `${delta >= 0 ? '+' : '−'}${fmt0(Math.abs(delta))}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {finView === 'bs' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {[
                  { title: 'Assets', rows: BS_AS_OF.assets, total: sumLines(BS_AS_OF.assets) },
                  { title: 'Liabilities', rows: BS_AS_OF.liabilities, total: sumLines(BS_AS_OF.liabilities) },
                  { title: 'Equity', rows: BS_AS_OF.equity, total: sumLines(BS_AS_OF.equity) },
                ].map((block) => (
                  <div key={block.title} style={{ flex: '1 1 220px', background: C.card, border: `1px solid ${C.hair}`, padding: '16px 18px' }}>
                    <div style={{ fontFamily: head, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{block.title}</div>
                    {block.rows.map((r) => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${C.line}`, fontFamily: ui }}>
                        <span style={{ color: C.sub }}>{r.label}</span>
                        <span style={{ fontFamily: mono }}>{fmt0(r.amount)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 600, fontFamily: ui, fontSize: 12 }}>
                      <span>Total {block.title.toLowerCase()}</span>
                      <span style={{ fontFamily: mono }}>{fmt0(block.total)}</span>
                    </div>
                  </div>
                ))}
                <p style={{ width: '100%', fontSize: 11, color: C.muted, fontFamily: ui, margin: 0 }}>As of {BS_AS_OF.label} · sample balances</p>
              </div>
            )}
          </>
        )}

        {tab === 'inventory' && (
          <>
            <PageHead title="Sales & Items" sub="Same ticket lines as Orders, sorted by revenue." />
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
            <PageHead title="Stock" sub="On-hand from dated purchase layers minus sales — sample as of Aug 31." />
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
            <PageHead title="Ask" sub="Answers from the ticket and stock sample on this page." />
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
