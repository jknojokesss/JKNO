import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────
// Shared sales-demo dashboard. 100% hardcoded sample data — no Supabase, no
// auth. Rendered full-page at /demo and embedded live on the homepage.
// Pass `embedded` to fit it inside the homepage browser-frame mockup.
// ─────────────────────────────────────────────────────────────────────────

const GOLD = '#C9A84C', GREEN = '#2D6A4F', RED = '#C0392B'
const ink = '#1A1A2E', muted = '#5A6070', faint = '#A0AEC0'

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')
const usd2 = (n) => '$' + Math.abs(n).toFixed(2)

const BIZ = 'Riverside Tire & Auto'

const MONTHLY = [
  { m: 'JAN', rev: 38200, net: 9400 },
  { m: 'FEB', rev: 31400, net: 6800 },
  { m: 'MAR', rev: 49800, net: 14200 },
  { m: 'APR', rev: 41200, net: 10100 },
  { m: 'MAY', rev: 46600, net: 12600 },
  { m: 'JUN', rev: 52300, net: 14900 },
]
const TOTAL_REV = 259500, GROSS = 161300, OPEX = 93300, NET = 68000

const PL = {
  income: [
    { label: 'Tire Sales', amount: 196000 },
    { label: 'Service Income', amount: 63500 },
  ],
  cogs: [{ label: 'Cost of Goods Sold', amount: 98200 }],
  expenses: [
    { label: 'Payroll', amount: 52000 },
    { label: 'Rent', amount: 18000 },
    { label: 'Insurance', amount: 6400 },
    { label: 'Merchant / Bank Fees', amount: 4900 },
    { label: 'Vehicle', amount: 3800 },
    { label: 'Utilities', amount: 3600 },
    { label: 'Supplies', amount: 2700 },
    { label: 'Marketing', amount: 1900 },
  ],
}

const ORDERS = [
  { date: '06/10', item: '235/60/18', src: 'Inventory', sale: 189.95, cost: 86, gap: null },
  { date: '06/10', item: '215/55/17', src: 'Same-Day', sale: 159.35, cost: 64, gap: 2 },
  { date: '06/09', item: '245/50/20', src: 'Inventory', sale: 204.16, cost: 95, gap: null },
  { date: '06/09', item: '205/65/16', src: 'Inventory', sale: 144.20, cost: 56, gap: null },
  { date: '06/08', item: '275/55/20', src: 'Same-Day', sale: 204.86, cost: 98, gap: 3 },
  { date: '06/08', item: '235/65/17 (Used)', src: 'Used', sale: 95.00, cost: 18, gap: null },
  { date: '06/07', item: '225/65/17', src: 'Inventory', sale: 149.99, cost: 65, gap: null },
  { date: '06/07', item: 'Mount & Balance', src: 'Service', sale: 40.00, cost: 0, gap: null },
  { date: '06/06', item: '255/45/19', src: 'Same-Day', sale: 224.61, cost: 110, gap: 1 },
  { date: '06/06', item: '195/65/15 (Used)', src: 'Used', sale: 80.00, cost: 18, gap: null },
]

const STOCK = [
  { size: '235/60/18', qty: 12, unit: 86 },
  { size: '205/65/16', qty: 18, unit: 56 },
  { size: '215/55/17', qty: 9, unit: 64 },
  { size: '245/50/20', qty: 7, unit: 95 },
  { size: '225/65/17', qty: 11, unit: 65 },
  { size: '255/45/19', qty: 6, unit: 110 },
  { size: '275/55/20', qty: 5, unit: 98 },
]

export default function DemoDashboard({ embedded = false }) {
  const [tab, setTab] = useState('dashboard')

  const maxRev = Math.max(...MONTHLY.map((d) => d.rev))
  const stockUnits = STOCK.reduce((s, r) => s + r.qty, 0)
  const stockValue = STOCK.reduce((s, r) => s + r.qty * r.unit, 0)

  const newRows = ORDERS.filter((r) => r.src === 'Inventory' || r.src === 'Same-Day')
  const usedRows = ORDERS.filter((r) => r.src === 'Used')
  const avg = (arr) => {
    if (!arr.length) return { perTire: 0, margin: 0 }
    const profit = arr.reduce((s, r) => s + (r.sale - r.cost), 0)
    const rev = arr.reduce((s, r) => s + r.sale, 0)
    return { perTire: profit / arr.length, margin: (profit / rev) * 100 }
  }
  const newT = avg(newRows), usedT = avg(usedRows)

  const goContact = () => {
    if (embedded) document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    else window.location.href = '/#contact'
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'bs', label: 'Balance Sheet' },
    { id: 'orders', label: 'Sales & Margins' },
    { id: 'stock', label: 'Stock' },
  ]

  const label = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: faint }
  const card = { background: '#fff', border: '1px solid #EDF2F7', borderRadius: '4px', padding: '16px' }
  const serif = { fontFamily: 'Cormorant Garamond, serif' }

  const Kpi = ({ k, v, sub, color }) => (
    <div className="jknj-demo-kpi" style={{ ...card, flex: 1, minWidth: '140px' }}>
      <div style={label}>{k}</div>
      <div style={{ ...serif, fontSize: embedded ? '22px' : '26px', fontWeight: 600, color: ink, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || muted, marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  const srcChip = (r) => {
    const map = {
      Inventory: ['#E8EEF9', '#2C5282'],
      'Same-Day': ['#FBF3DD', '#8A6D1F'],
      Used: ['#EEF2F0', '#52796F'],
      Service: ['#F1F1F4', '#6B7280'],
    }
    const [bg, fg] = map[r.src] || map.Service
    const text = r.src === 'Same-Day' ? `Same-Day ${r.gap}d` : r.src
    return <span style={{ background: bg, color: fg, fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{text}</span>
  }

  return (
    <div style={{ background: '#F7F4EF' }}>
      {/* Mobile: let the embedded dashboard flow with the page instead of
          scrolling inside a fixed-height window, and tighten paddings.
          !important is required to beat the inline styles below. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .jknj-demo-content { height: auto !important; overflow: visible !important; padding: 14px !important; }
          .jknj-demo-titlerow { padding: 9px 12px 0 !important; }
          .jknj-demo-tabs { padding: 0 12px !important; }
          .jknj-demo-biz { font-size: 15px !important; }
        }
        @media (max-width: 400px) {
          .jknj-demo-kpi { min-width: 100% !important; }
        }
        /* Hide the scrollbar on the tab strip (it scrolls horizontally on narrow screens) */
        .jknj-demo-tabs { scrollbar-width: none; -ms-overflow-style: none; }
        .jknj-demo-tabs::-webkit-scrollbar { display: none; }
      ` }} />
      {/* App-style header: title + CTA on top, dedicated tab strip below so the
          tabs always sit on one clean baseline and never wrap awkwardly. */}
      <div className="jknj-demo-nav" style={{ background: '#1A2035', position: embedded ? 'static' : 'sticky', top: 0, zIndex: 50 }}>
        <div className="jknj-demo-titlerow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
            <span className="jknj-demo-biz" style={{ ...serif, fontSize: '17px', fontWeight: 700, color: '#EAE8E4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{BIZ}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: GOLD, flexShrink: 0 }}>FINANCIALS</span>
          </div>
          <button onClick={goContact} style={{ flexShrink: 0, background: GOLD, color: '#1A1A2E', border: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            GET THIS →
          </button>
        </div>
        <nav className="jknj-demo-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', overflowX: 'auto' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#8893B5', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${GOLD}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div className="jknj-demo-content" style={{ padding: embedded ? '16px' : '24px', maxWidth: embedded ? 'none' : '1080px', margin: '0 auto', height: embedded ? '430px' : 'auto', overflowY: embedded ? 'auto' : 'visible' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="REVENUE (YTD)" v={usd0(TOTAL_REV)} sub="Tires + service" />
              <Kpi k="GROSS PROFIT" v={usd0(GROSS)} sub={`${(GROSS / TOTAL_REV * 100).toFixed(0)}% gross margin`} color={GREEN} />
              <Kpi k="EXPENSES" v={usd0(OPEX)} sub="Operating" color={RED} />
              <Kpi k="NET INCOME" v={usd0(NET)} sub={`${(NET / TOTAL_REV * 100).toFixed(0)}% net margin`} color={GREEN} />
            </div>

            <div style={card}>
              <div style={label}>MONTHLY — REVENUE & NET PROFIT</div>
              <svg width="100%" height="190" viewBox="0 0 600 200" style={{ marginTop: '12px' }}>
                {[0.25, 0.5, 0.75, 1].map((g) => (
                  <line key={g} x1="0" y1={180 - g * 160} x2="600" y2={180 - g * 160} stroke="#F0F0F0" />
                ))}
                {MONTHLY.map((d, i) => {
                  const x = 30 + i * 95
                  const rh = (d.rev / maxRev) * 150
                  const nh = (d.net / maxRev) * 150
                  return (
                    <g key={d.m}>
                      <rect x={x} y={180 - rh} width="34" height={rh} fill={GOLD} rx="2" />
                      <rect x={x + 38} y={180 - nh} width="34" height={nh} fill={GREEN} rx="2" />
                      <text x={x + 36} y="194" textAnchor="middle" fontSize="10" fill={faint} fontFamily="monospace">{d.m}</text>
                      <text x={x + 17} y={176 - rh} textAnchor="middle" fontSize="9" fill={muted} fontFamily="monospace">{usd0(d.rev / 1000)}k</text>
                    </g>
                  )
                })}
              </svg>
              <div style={{ display: 'flex', gap: '20px', marginTop: '4px', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: muted }}>
                <span><span style={{ color: GOLD }}>■</span> Revenue</span>
                <span><span style={{ color: GREEN }}>■</span> Net profit</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ ...card, flex: 2, minWidth: '260px' }}>
                <div style={label}>TOP EXPENSES</div>
                <div style={{ marginTop: '10px' }}>
                  {PL.expenses.slice(0, 5).map((e) => {
                    const max = PL.expenses[0].amount
                    return (
                      <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                        <div style={{ width: '140px', fontSize: '12px', color: ink }}>{e.label}</div>
                        <div style={{ flex: 1, height: '6px', background: '#EEE', borderRadius: '3px' }}>
                          <div style={{ width: `${(e.amount / max) * 100}%`, height: '6px', background: GOLD, borderRadius: '3px' }} />
                        </div>
                        <div style={{ width: '60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: muted }}>{usd0(e.amount)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ ...card, flex: 1, minWidth: '170px' }}>
                <div style={label}>ON-HAND STOCK</div>
                <div style={{ ...serif, fontSize: '28px', fontWeight: 600, color: ink, marginTop: '6px' }}>{stockUnits} tires</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: muted, marginTop: '2px' }}>{usd0(stockValue)} at cost</div>
                <div style={{ marginTop: '12px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: GREEN }}>✓ Balance sheet ties out</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: GREEN, marginTop: '4px' }}>✓ Synced from POS nightly</div>
              </div>
            </div>
          </div>
        )}

        {/* PROFIT & LOSS */}
        {tab === 'pl' && (() => {
          const inc = PL.income.reduce((s, r) => s + r.amount, 0)
          const cogs = PL.cogs.reduce((s, r) => s + r.amount, 0)
          const exp = PL.expenses.reduce((s, r) => s + r.amount, 0)
          const Section = ({ title, rows, neg, total, totalLabel, totalColor }) => (
            <div style={card}>
              <div style={{ ...label, paddingBottom: '8px', borderBottom: '1px solid #F0F0F0', marginBottom: '6px' }}>{title}</div>
              {rows.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 2px', borderBottom: '1px solid #F7F7F7' }}>
                  <span style={{ fontSize: '13px', color: ink }}>{r.label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: neg ? RED : GREEN }}>{neg ? '−' : ''}{usd0(r.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: muted }}>{totalLabel}</span>
                <span style={{ color: totalColor || ink }}>{usd0(total)}</span>
              </div>
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Section title="INCOME" rows={PL.income} total={inc} totalLabel="Total Income:" totalColor={GREEN} />
              <Section title="COST OF GOODS SOLD" rows={PL.cogs} neg total={inc - cogs} totalLabel="Gross Profit:" totalColor={GREEN} />
              <Section title="OPERATING EXPENSES" rows={PL.expenses} neg total={exp} totalLabel="Total Expenses:" totalColor={RED} />
              <div style={{ background: '#F2F7F3', border: '1px solid #CFE4D6', borderRadius: '4px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', letterSpacing: '1px', color: GREEN, fontWeight: 600 }}>NET INCOME</span>
                <span style={{ ...serif, fontSize: '24px', fontWeight: 700, color: GREEN }}>{usd0(inc - cogs - exp)}</span>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: faint, textAlign: 'center' }}>
                Every line drills into the transactions behind it — pulled straight from the POS + bank feed.
              </div>
            </div>
          )
        })()}

        {/* BALANCE SHEET */}
        {tab === 'bs' && (() => {
          const assets = [['Cash / Bank', 42300], ['Accounts Receivable', 8150], ['Inventory (tires on hand)', 24500], ['Equipment (net)', 36000]]
          const liabilities = [['Accounts Payable', 12400], ['Credit Card', 3800], ['Equipment Loan', 19750]]
          const equity = [["Owner's Capital", 7000], ['Net Income (YTD)', 68000]]
          const sum = (a) => a.reduce((s, [, v]) => s + v, 0)
          const tA = sum(assets), tL = sum(liabilities), tE = sum(equity)
          const Block = ({ title, rows, total, totalLabel, color }) => (
            <div style={card}>
              <div style={{ ...label, paddingBottom: '8px', borderBottom: '1px solid #F0F0F0', marginBottom: '6px' }}>{title}</div>
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 2px', borderBottom: '1px solid #F7F7F7' }}>
                  <span style={{ fontSize: '13px', color: ink }}>{k}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: muted }}>{usd0(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: muted }}>{totalLabel}:</span>
                <span style={{ color: color || ink }}>{usd0(total)}</span>
              </div>
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Block title="ASSETS" rows={assets} total={tA} totalLabel="Total Assets" color={GREEN} />
              <Block title="LIABILITIES" rows={liabilities} total={tL} totalLabel="Total Liabilities" color={RED} />
              <Block title="EQUITY" rows={equity} total={tE} totalLabel="Total Equity" color={ink} />
              <div style={{ background: '#F2F7F3', border: '1px solid #CFE4D6', borderRadius: '4px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', color: GREEN, fontWeight: 600 }}>✓ IN BALANCE</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: muted }}>Assets {usd0(tA)} = Liabilities + Equity {usd0(tL + tE)}</span>
              </div>
            </div>
          )
        })()}

        {/* SALES & MARGINS */}
        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="PROFIT / NEW TIRE" v={usd2(newT.perTire)} sub={`${newT.margin.toFixed(0)}% margin · ${newRows.length} sold`} color={GREEN} />
              <Kpi k="PROFIT / USED TIRE" v={usd2(usedT.perTire)} sub={`${usedT.margin.toFixed(0)}% margin · ${usedRows.length} sold`} color={GREEN} />
              <Kpi k="BEST MARGIN SIZE" v="205/65/16" sub="61% · best seller" color={GOLD} />
            </div>
            <div style={card}>
              <div style={{ ...label, marginBottom: '8px' }}>RECENT SALES — COSTED TO THE TIRE</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
                  <thead>
                    <tr>{['DATE', 'TIRE / ITEM', 'SOURCE', 'SALE', 'COST', 'PROFIT', 'MARGIN'].map((h, i) => (
                      <th key={h} style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: faint, textAlign: i < 3 ? 'left' : 'right', padding: '6px 8px', borderBottom: '1px solid #E5E5E5' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {ORDERS.map((r, i) => {
                      const profit = r.sale - r.cost
                      const margin = r.sale > 0 ? (profit / r.sale) * 100 : 0
                      return (
                        <tr key={i}>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: muted, padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{r.date}</td>
                          <td style={{ fontSize: '12px', color: ink, padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{r.item}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{srcChip(r)}</td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: ink, textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{usd2(r.sale)}</td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: muted, textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{usd2(r.cost)}</td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: GREEN, fontWeight: 600, textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>{usd2(profit)}</td>
                          <td style={{ textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid #F5F5F5' }}>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: margin >= 55 ? '#E3F1E8' : '#FBF3DD', color: margin >= 55 ? GREEN : '#8A6D1F' }}>{margin.toFixed(0)}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: faint, marginTop: '10px' }}>
                Each tire is matched to its supplier cost automatically — even special-orders (Same-Day) vs. shelf stock (Inventory).
              </div>
            </div>
          </div>
        )}

        {/* STOCK */}
        {tab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="TIRES ON HAND" v={`${stockUnits}`} sub="Across all sizes" />
              <Kpi k="STOCK VALUE" v={usd0(stockValue)} sub="At supplier cost" color={GREEN} />
              <Kpi k="LIVE FROM POS" v="Nightly" sub="Auto-synced" color={GOLD} />
            </div>
            <div style={card}>
              <div style={{ ...label, marginBottom: '8px' }}>ON-HAND BY SIZE</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['SIZE', 'ON HAND', 'UNIT COST', 'VALUE'].map((h, i) => (
                    <th key={h} style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: faint, textAlign: i === 0 ? 'left' : 'right', padding: '6px 8px', borderBottom: '1px solid #E5E5E5' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {STOCK.map((r) => (
                    <tr key={r.size}>
                      <td style={{ fontSize: '13px', color: ink, padding: '8px', borderBottom: '1px solid #F5F5F5' }}>{r.size}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: ink, textAlign: 'right', padding: '8px', borderBottom: '1px solid #F5F5F5' }}>{r.qty}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: muted, textAlign: 'right', padding: '8px', borderBottom: '1px solid #F5F5F5' }}>{usd0(r.unit)}</td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: ink, textAlign: 'right', padding: '8px', borderBottom: '1px solid #F5F5F5' }}>{usd0(r.qty * r.unit)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: ink, textAlign: 'right', padding: '10px 8px', borderTop: '2px solid #E5E5E5' }}>Total stock value</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: GREEN, textAlign: 'right', padding: '10px 8px', borderTop: '2px solid #E5E5E5' }}>{usd0(stockValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
