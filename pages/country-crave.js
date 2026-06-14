import { useState } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for "Country Crave" (wholesale peanut chews).
// 100% hardcoded sample data — a demo to show the prospect what JK No Jokes
// Financials would build them. Front page = account follow-up / reorder tracker.
// ─────────────────────────────────────────────────────────────────────────

const DARK = '#3A2A1D', BROWN = '#8A5A3B', PEANUT = '#C28E5C', TAN = '#F3E9DB'
const INK = '#2E211A', MUTED = '#7A6A5C', FAINT = '#A99A8B'
const GREEN = '#4E7A52', RED = '#B25A3A', BLUE = '#5B7E9C'
const CARD = '#FFFFFF'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')

const ACCOUNTS = [
  { name: 'Aisle 9 Distributors', contact: 'Frank D.', last: 'May 12', days: 31, cases: 2200, status: 'reorder' },
  { name: 'Pomegranate — Brooklyn', contact: 'Eli G.', last: 'Jun 8', days: 4, cases: 1640, status: 'recent' },
  { name: 'Seasons — Lakewood', contact: 'Dovid K.', last: 'Jun 5', days: 7, cases: 1180, status: 'recent' },
  { name: 'Gourmet Glatt — Cedarhurst', contact: 'Sara L.', last: 'May 28', days: 15, cases: 960, status: 'reorder' },
  { name: 'Wesley Kosher', contact: 'Chaim T.', last: 'Apr 30', days: 44, cases: 720, status: 'reorder' },
  { name: 'KolSave — Inwood', contact: 'Yossi B.', last: 'Jun 1', days: 11, cases: 540, status: 'recent' },
  { name: 'Foodtown — Brooklyn', contact: 'Angela M.', last: 'Mar 19', days: 85, cases: 300, status: 'lapsed' },
  { name: 'Evergreen Market', contact: 'Tony P.', last: '—', days: null, cases: 0, status: 'lead' },
  { name: 'The Peppermill', contact: 'Rivka S.', last: '—', days: null, cases: 0, status: 'lead' },
]

const PRODUCTS = [
  { name: 'Original Peanut Chews', cases: 3100, rev: 96100 },
  { name: 'Dark Chocolate Peanut Chews', cases: 2400, rev: 81600 },
  { name: 'Mini Chews — Snack Packs', cases: 1800, rev: 48600 },
  { name: 'King Size Bars', cases: 1200, rev: 42000 },
  { name: 'Sugar-Free Chews', cases: 600, rev: 23400 },
]

const MONTHLY = [
  { m: 'JAN', rev: 38200 }, { m: 'FEB', rev: 35100 }, { m: 'MAR', rev: 49800 },
  { m: 'APR', rev: 44200 }, { m: 'MAY', rev: 58600 }, { m: 'JUN', rev: 65800 },
]

const ORDERS = [
  { date: 'Jun 8', account: 'Pomegranate — Brooklyn', product: 'Original Peanut Chews', cases: 60, amt: 1860 },
  { date: 'Jun 5', account: 'Seasons — Lakewood', product: 'Dark Chocolate Chews', cases: 48, amt: 1632 },
  { date: 'Jun 1', account: 'KolSave — Inwood', product: 'Mini Chews — Snack Packs', cases: 36, amt: 972 },
  { date: 'May 28', account: 'Gourmet Glatt — Cedarhurst', product: 'Original Peanut Chews', cases: 72, amt: 2232 },
  { date: 'May 12', account: 'Aisle 9 Distributors', product: 'King Size Bars', cases: 120, amt: 4200 },
  { date: 'Apr 30', account: 'Wesley Kosher', product: 'Original Peanut Chews', cases: 40, amt: 1240 },
]

const STATUS = {
  reorder: ['#F6E7D2', '#9A5A24', 'Reorder due'],
  recent:  ['#E3EFE0', GREEN, 'Recently ordered'],
  lead:    ['#E2EAF0', BLUE, 'New lead'],
  lapsed:  ['#F6E0D8', RED, 'No order 60d+'],
}
const ACTION = { reorder: 'Call for reorder', recent: '—', lead: 'Intro call', lapsed: 'Win-back call' }

export default function CountryCrave() {
  const [tab, setTab] = useState('dashboard')

  const totalRev = PRODUCTS.reduce((s, p) => s + p.rev, 0)
  const totalCases = PRODUCTS.reduce((s, p) => s + p.cases, 0)
  const active = ACCOUNTS.filter((a) => a.cases > 0).length
  const followups = ACCOUNTS.filter((a) => a.status !== 'recent')
  const maxRev = Math.max(...MONTHLY.map((d) => d.rev))

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'orders', label: 'Orders' },
    { id: 'financials', label: 'Financials' },
  ]

  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #E8DDCC', borderRadius: '6px', padding: '16px' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const Badge = ({ s }) => {
    const [bg, fg, text] = STATUS[s]
    return <span style={{ background: bg, color: fg, fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{text}</span>
  }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid #E8DDCC' }
  const td = { fontSize: '12px', color: INK, padding: '8px 10px', borderBottom: '1px solid #F2EADF' }

  return (
    <>
      <Head>
        <title>Country Crave — Dashboard Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${TAN};font-family:'DM Sans',sans-serif}
          .cc-tabs::-webkit-scrollbar{display:none}.cc-tabs{scrollbar-width:none}`}</style>
      </Head>

      {/* Demo banner */}
      <div style={{ background: PEANUT, color: DARK, textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for Country Crave by JK No Jokes Financials
      </div>

      {/* Nav */}
      <div style={{ background: DARK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🥜</span>
            <span style={{ ...serif, fontSize: '20px', fontWeight: 700, color: '#F3E3CE' }}>Country Crave</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: PEANUT }}>WHOLESALE PEANUT CHEWS</span>
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: PEANUT, color: DARK, textDecoration: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>GET THIS BUILT →</a>
        </div>
        <nav className="cc-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#B9A589', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${PEANUT}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* DASHBOARD — front page = account follow-up tracker */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="REVENUE (YTD)" v={usd0(totalRev)} sub="All accounts" />
              <Kpi k="CASES SHIPPED" v={totalCases.toLocaleString()} sub="Year to date" />
              <Kpi k="ACTIVE ACCOUNTS" v={active} sub={`of ${ACCOUNTS.length} total`} />
              <Kpi k="NEED FOLLOW-UP" v={followups.length} sub="Action today" color={RED} />
            </div>

            {/* The differentiator: who to reach out to */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                <div>
                  <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Accounts that need you</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Who to call today, who's due to reorder, and who's gone quiet</div>
                </div>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: RED }}>● {followups.length} need action</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead><tr>
                    {['ACCOUNT', 'CONTACT', 'LAST ORDER', 'CASES (YTD)', 'STATUS', 'NEXT STEP'].map((h, i) => (
                      <th key={h} style={{ ...th, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...ACCOUNTS].sort((a, b) => (b.days || 999) - (a.days || 999)).map((a, i) => (
                      <tr key={i} style={{ background: a.status === 'recent' ? 'transparent' : '#FBF6EE' }}>
                        <td style={{ ...td, fontWeight: 500 }}>{a.name}</td>
                        <td style={{ ...td, color: MUTED }}>{a.contact}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{a.last}{a.days != null ? ` · ${a.days}d ago` : ''}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{a.cases ? a.cases.toLocaleString() : '—'}</td>
                        <td style={td}><Badge s={a.status} /></td>
                        <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontSize: '11px', color: a.status === 'recent' ? FAINT : BROWN, fontWeight: a.status === 'recent' ? 400 : 600 }}>{ACTION[a.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ ...card, flex: 2, minWidth: '280px' }}>
                <div style={lbl}>MONTHLY SALES</div>
                <svg width="100%" height="170" viewBox="0 0 560 180" style={{ marginTop: '10px' }}>
                  {MONTHLY.map((d, i) => {
                    const x = 30 + i * 88, h = (d.rev / maxRev) * 140
                    return (
                      <g key={d.m}>
                        <rect x={x} y={160 - h} width="48" height={h} fill={BROWN} rx="3" />
                        <text x={x + 24} y="174" textAnchor="middle" fontSize="10" fill={FAINT} fontFamily="monospace">{d.m}</text>
                        <text x={x + 24} y={156 - h} textAnchor="middle" fontSize="9" fill={MUTED} fontFamily="monospace">{usd0(d.rev / 1000)}k</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                <div style={lbl}>TOP PRODUCTS</div>
                <div style={{ marginTop: '10px' }}>
                  {PRODUCTS.slice(0, 4).map((p) => {
                    const max = PRODUCTS[0].rev
                    return (
                      <div key={p.name} style={{ padding: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: INK, marginBottom: '3px' }}>
                          <span>{p.name}</span><span style={{ fontFamily: 'DM Mono, monospace', color: MUTED }}>{usd0(p.rev)}</span>
                        </div>
                        <div style={{ height: '5px', background: '#EFE3D3', borderRadius: '3px' }}>
                          <div style={{ width: `${(p.rev / max) * 100}%`, height: '5px', background: PEANUT, borderRadius: '3px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS — full customer book */}
        {tab === 'accounts' && (
          <div style={card}>
            <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK, marginBottom: '4px' }}>Customer book</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '12px' }}>Every account, what they've bought, and where they stand</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead><tr>{['ACCOUNT', 'CONTACT', 'LAST ORDER', 'CASES (YTD)', 'EST. VALUE', 'STATUS'].map((h, i) => (
                  <th key={h} style={{ ...th, textAlign: i >= 3 && i <= 4 ? 'right' : 'left' }}>{h}</th>))}</tr></thead>
                <tbody>
                  {ACCOUNTS.map((a, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight: 500 }}>{a.name}</td>
                      <td style={{ ...td, color: MUTED }}>{a.contact}</td>
                      <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{a.last}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{a.cases ? a.cases.toLocaleString() : '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: GREEN }}>{a.cases ? usd0(a.cases * 31) : '—'}</td>
                      <td style={td}><Badge s={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div style={card}>
            <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK, marginBottom: '12px' }}>Recent orders</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead><tr>{['DATE', 'ACCOUNT', 'PRODUCT', 'CASES', 'AMOUNT'].map((h, i) => (
                  <th key={h} style={{ ...th, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>))}</tr></thead>
                <tbody>
                  {ORDERS.map((o, i) => (
                    <tr key={i}>
                      <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{o.date}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{o.account}</td>
                      <td style={{ ...td, color: MUTED }}>{o.product}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{o.cases}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: GREEN, fontWeight: 600 }}>{usd0(o.amt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCIALS — simple P&L */}
        {tab === 'financials' && (() => {
          const cogs = Math.round(totalRev * 0.55)
          const exp = [['Payroll', 52000], ['Warehouse / Rent', 21000], ['Freight & Shipping', 16400], ['Packaging', 9800], ['Marketing', 6200], ['Insurance', 4100]]
          const totalExp = exp.reduce((s, [, v]) => s + v, 0)
          const gross = totalRev - cogs, net = gross - totalExp
          const Row = ({ k, v, neg, bold, color }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 2px', borderBottom: '1px solid #F2EADF' }}>
              <span style={{ fontSize: '13px', color: INK, fontWeight: bold ? 600 : 400 }}>{k}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: color || (neg ? RED : INK), fontWeight: bold ? 600 : 400 }}>{neg ? '−' : ''}{usd0(v)}</span>
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={card}>
                <div style={{ ...lbl, marginBottom: '6px' }}>PROFIT &amp; LOSS — YTD</div>
                <Row k="Revenue" v={totalRev} color={GREEN} bold />
                <Row k="Cost of Goods (peanuts, choc, production)" v={cogs} neg />
                <Row k="Gross Profit" v={gross} color={GREEN} bold />
                {exp.map(([k, v]) => <Row key={k} k={k} v={v} neg />)}
                <Row k="Total Operating Expenses" v={totalExp} neg bold />
              </div>
              <div style={{ background: '#EFF5EC', border: '1px solid #CFE0C7', borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', letterSpacing: '1px', color: GREEN, fontWeight: 600 }}>NET PROFIT</span>
                <span style={{ ...serif, fontSize: '24px', fontWeight: 700, color: GREEN }}>{usd0(net)}</span>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: FAINT, textAlign: 'center' }}>
                Clean books, reconciled to your bank — every number drills into the orders behind it.
              </div>
            </div>
          )
        })()}

        {/* Bottom CTA */}
        <div style={{ marginTop: '28px', textAlign: 'center', background: CARD, border: '1px solid #E8DDCC', borderRadius: '10px', padding: '30px' }}>
          <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK }}>Want this for Country Crave?</div>
          <p style={{ color: MUTED, fontSize: '14px', margin: '8px auto 18px', maxWidth: '460px', lineHeight: 1.6 }}>
            This is a sample. I'd build you the real thing — wired to your orders, so you always know who to call, who's due to reorder, and exactly where your money is.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: BROWN, color: '#fff', textDecoration: 'none', padding: '14px 30px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>BOOK A FREE CALL →</a>
          <div style={{ marginTop: '14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: FAINT }}>Jonathan Katz · JK No Jokes Financials · jk@jknojokes.com</div>
        </div>
      </div>
    </>
  )
}
