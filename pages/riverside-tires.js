import { useState } from 'react'
import Head from 'next/head'

const BIZ = 'Riverside Tires'
const SIDEBAR = '#1A1A1A', ACCENT = '#CC2222', BORDER = '#E5E5E5'
const INK = '#1A1A1A', MUTED = '#888', GREEN = '#1E7A3A', RED = '#CC2222', AMBER = '#C98A2A'
const mono = "'DM Mono', monospace"
const ui = "'Inter', sans-serif"

const fmt = (n) => '$' + Math.round(n).toLocaleString()
const fmtD = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TABS = ['Dashboard', 'Sales & Items', 'Work Orders']

const TOP_ITEMS = [
  { name: '235/65/17 Bridgestone', orders: 48, qty: 96,  rev: 11520 },
  { name: '205/55/16 Michelin',    orders: 41, qty: 82,  rev: 8610  },
  { name: '225/60/17 Goodyear',    orders: 37, qty: 74,  rev: 8140  },
  { name: '215/60/16 Cooper',      orders: 34, qty: 68,  rev: 6460  },
  { name: '245/70/17 BFG A-T',     orders: 28, qty: 56,  rev: 7840  },
  { name: 'Tire plug / repair',    orders: 62, qty: 62,  rev: 1550  },
  { name: 'Tire rotation',         orders: 55, qty: 55,  rev: 1925  },
  { name: '235/55/18 Pirelli',     orders: 22, qty: 44,  rev: 5940  },
  { name: 'Oil change',            orders: 44, qty: 44,  rev: 3080  },
  { name: '225/45/18 Continental', orders: 19, qty: 38,  rev: 4940  },
  { name: 'Wheel balance (set)',   orders: 38, qty: 38,  rev: 1900  },
  { name: '265/70/17 Toyo A-T',   orders: 16, qty: 32,  rev: 4480  },
  { name: 'Lug nut replacement',   orders: 29, qty: 58,  rev: 870   },
  { name: '195/65/15 Hankook',    orders: 18, qty: 36,  rev: 2340  },
  { name: 'TPMS sensor replace',  orders: 24, qty: 24,  rev: 1920  },
]

const ORDERS = [
  { id: 'WO-041', customer: 'David Kaplan',     service: '235/65/17 Bridgestone x4',    total: 480, status: 'completed', date: 'Jun 25' },
  { id: 'WO-042', customer: 'Rachel Goldstein',  service: 'Oil change + tire rotation',  total: 115, status: 'completed', date: 'Jun 25' },
  { id: 'WO-043', customer: 'Moshe Friedman',   service: '205/55/16 Michelin x2 + balance', total: 230, status: 'in-progress', date: 'Jun 26' },
  { id: 'WO-044', customer: 'Sarah Cohen',       service: 'Tire plug repair',            total: 25,  status: 'completed', date: 'Jun 26' },
  { id: 'WO-045', customer: 'Aaron Levy',        service: '245/70/17 BFG A-T x4',       total: 560, status: 'in-progress', date: 'Jun 27' },
  { id: 'WO-046', customer: 'Chana Weiss',       service: 'TPMS sensor x2 + balance',   total: 210, status: 'scheduled', date: 'Jun 28' },
  { id: 'WO-047', customer: 'Yosef Stern',       service: '225/60/17 Goodyear x4',      total: 440, status: 'scheduled', date: 'Jun 28' },
  { id: 'WO-048', customer: 'Rivka Horowitz',    service: 'Lug nut replacement + torque', total: 65, status: 'scheduled', date: 'Jun 28' },
]

const STATUS_COLORS = { completed: GREEN, 'in-progress': AMBER, scheduled: '#5A6070' }

const MONTH_REV = [
  { m: 'Jul', v: 28400 }, { m: 'Aug', v: 31200 }, { m: 'Sep', v: 29800 },
  { m: 'Oct', v: 33600 }, { m: 'Nov', v: 30100 }, { m: 'Dec', v: 27500 },
  { m: 'Jan', v: 24800 }, { m: 'Feb', v: 26400 }, { m: 'Mar', v: 31900 },
  { m: 'Apr', v: 35200 }, { m: 'May', v: 38100 }, { m: 'Jun', v: 34800 },
]
const maxRev = Math.max(...MONTH_REV.map(m => m.v))

const revMTD = 34800
const ordersMTD = 247
const avgTicket = Math.round(revMTD / ordersMTD)
const topItem = TOP_ITEMS[0]

export default function RiversideTires() {
  const [tab, setTab] = useState('Dashboard')
  const [sort, setSort] = useState('rev')

  const sorted = [...TOP_ITEMS].sort((a, b) => b[sort] - a[sort])

  const hcell = (align = 'left') => ({
    padding: '7px 12px', fontSize: '9px', color: MUTED, background: '#FAFAFA',
    fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase',
    borderBottom: `1px solid ${BORDER}`, fontFamily: ui, textAlign: align,
  })
  const cell = (align = 'left', extra = {}) => ({
    padding: '9px 12px', borderBottom: `1px solid #F5F5F5`,
    color: INK, fontSize: '12px', fontFamily: ui, textAlign: align, ...extra,
  })

  return (
    <>
      <Head>
        <title>{BIZ} — Dashboard Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F8F8; color: ${INK}; }
        .shell { display: flex; min-height: 100vh; }
        .side { width: 200px; flex-shrink: 0; background: ${SIDEBAR}; display: flex; flex-direction: column; padding: 20px 12px; }
        .main { flex: 1; min-width: 0; padding: 28px 32px; overflow-y: auto; }
        .navbtn { display: block; width: 100%; text-align: left; padding: 9px 12px; border-radius: 6px; border: none; background: transparent; color: #6A6A6A; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; margin-bottom: 2px; }
        .navbtn:hover { background: rgba(255,255,255,.06); color: #ccc; }
        .navbtn.on { background: rgba(255,255,255,.09); color: #fff; box-shadow: inset 3px 0 0 ${ACCENT}; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 12px; margin-bottom: 24px; }
        .kpi { background: #fff; border: 1px solid ${BORDER}; border-radius: 8px; padding: 16px; }
        .kpi-lbl { font-size: 10px; color: ${MUTED}; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; font-family: ${mono}; }
        .kpi-val { font-size: 26px; font-weight: 500; color: ${INK}; font-family: ${mono}; }
        .kpi-sub { font-size: 11px; color: ${MUTED}; margin-top: 4px; }
        .card { background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
        .card-hdr { padding: 14px 16px; border-bottom: 1px solid ${BORDER}; font-size: 11px; font-weight: 500; color: ${MUTED}; letter-spacing: .08em; text-transform: uppercase; font-family: ${mono}; display: flex; justify-content: space-between; align-items: center; }
        .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        @media(max-width:640px){ .side{display:none} .main{padding:16px} }
      `}</style>

      <div className="shell">
        {/* Sidebar */}
        <aside className="side">
          <div style={{ paddingBottom: '20px' }}>
            <div style={{ fontFamily: mono, fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '.1em' }}>RIVERSIDE</div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: ACCENT, letterSpacing: '.2em', marginTop: '2px' }}>TIRES &amp; AUTO</div>
          </div>
          <nav style={{ flex: 1 }}>
            {TABS.map(t => (
              <button key={t} className={`navbtn${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#444', lineHeight: 1.6 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: ACCENT }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>June 2026</div>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>{tab}</div>
            </div>
            <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, background: '#F0F0F0', padding: '5px 12px', borderRadius: '20px' }}>
              Live · JK No Jokes
            </div>
          </div>

          {/* ── DASHBOARD ── */}
          {tab === 'Dashboard' && (<>
            <div className="kpi-grid">
              <div className="kpi"><div className="kpi-lbl">Revenue MTD</div><div className="kpi-val">{fmt(revMTD)}</div><div className="kpi-sub">June 2026</div></div>
              <div className="kpi"><div className="kpi-lbl">Work Orders</div><div className="kpi-val">{ordersMTD}</div><div className="kpi-sub">this month</div></div>
              <div className="kpi"><div className="kpi-lbl">Avg Ticket</div><div className="kpi-val">{fmt(avgTicket)}</div><div className="kpi-sub">per order</div></div>
              <div className="kpi"><div className="kpi-lbl">Top Item</div><div className="kpi-val" style={{ fontSize: '14px', lineHeight: 1.3 }}>{topItem.name}</div><div className="kpi-sub">{fmt(topItem.rev)} MTD</div></div>
            </div>

            {/* Revenue chart */}
            <div className="card">
              <div className="card-hdr">Monthly Revenue — Last 12 Months</div>
              <div style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px' }}>
                {MONTH_REV.map((m, i) => (
                  <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: i === 11 ? ACCENT : '#E5E5E5', borderRadius: '3px 3px 0 0', height: `${Math.round((m.v / maxRev) * 110)}px`, minHeight: '4px' }} />
                    <div style={{ fontFamily: mono, fontSize: '8px', color: i === 11 ? ACCENT : MUTED }}>{m.m}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top items preview */}
            <div className="card">
              <div className="card-hdr">Top Sellers — June <span style={{ cursor: 'pointer', color: ACCENT }} onClick={() => setTab('Sales & Items')}>View all →</span></div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Item</th>
                  <th style={hcell('right')}>Orders</th>
                  <th style={hcell('right')}>Revenue</th>
                </tr></thead>
                <tbody>{TOP_ITEMS.slice(0, 5).map((it, i) => (
                  <tr key={i}>
                    <td style={cell()}>{it.name}</td>
                    <td style={cell('right', { color: MUTED })}>{it.orders}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 500 })}>{fmt(it.rev)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>)}

          {/* ── SALES & ITEMS ── */}
          {tab === 'Sales & Items' && (<>
            <div className="card">
              <div className="card-hdr">
                All Items — June 2026
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[['rev','Revenue'],['orders','Orders'],['qty','Qty']].map(([k,l]) => (
                    <button key={k} onClick={() => setSort(k)}
                      style={{ fontFamily: mono, fontSize: '10px', padding: '4px 10px', borderRadius: '5px', border: `1px solid ${sort===k?ACCENT:BORDER}`, background: sort===k?ACCENT:'transparent', color: sort===k?'#fff':MUTED, cursor: 'pointer' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>#</th>
                  <th style={hcell()}>Item / Service</th>
                  <th style={hcell('right')}>Orders</th>
                  <th style={hcell('right')}>Qty</th>
                  <th style={hcell('right')}>Revenue</th>
                </tr></thead>
                <tbody>{sorted.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                    <td style={cell('left', { color: MUTED, fontFamily: mono, fontSize: '11px', width: '32px' })}>{i + 1}</td>
                    <td style={cell()}>{it.name}</td>
                    <td style={cell('right', { color: MUTED })}>{it.orders}</td>
                    <td style={cell('right', { color: MUTED })}>{it.qty}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 500, color: INK })}>{fmt(it.rev)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ background: '#F5F5F5', borderTop: `2px solid ${BORDER}` }}>
                  <td style={{ ...cell(), fontWeight: 600 }} colSpan={2}>Total</td>
                  <td style={cell('right', { fontWeight: 600 })}>{sorted.reduce((s,i)=>s+i.orders,0)}</td>
                  <td style={cell('right', { fontWeight: 600 })}>{sorted.reduce((s,i)=>s+i.qty,0)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, color: ACCENT })}>{fmt(sorted.reduce((s,i)=>s+i.rev,0))}</td>
                </tr></tfoot>
              </table>
            </div>
          </>)}

          {/* ── WORK ORDERS ── */}
          {tab === 'Work Orders' && (<>
            <div className="kpi-grid">
              <div className="kpi"><div className="kpi-lbl">Open</div><div className="kpi-val" style={{ color: AMBER }}>{ORDERS.filter(o=>o.status!=='completed').length}</div></div>
              <div className="kpi"><div className="kpi-lbl">Completed today</div><div className="kpi-val" style={{ color: GREEN }}>{ORDERS.filter(o=>o.status==='completed').length}</div></div>
              <div className="kpi"><div className="kpi-lbl">Revenue today</div><div className="kpi-val">{fmt(ORDERS.filter(o=>o.status==='completed').reduce((s,o)=>s+o.total,0))}</div></div>
            </div>
            <div className="card">
              <div className="card-hdr">Work Orders — Jun 25–28</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>WO #</th>
                  <th style={hcell()}>Customer</th>
                  <th style={hcell()}>Service</th>
                  <th style={hcell('right')}>Total</th>
                  <th style={hcell('center')}>Status</th>
                  <th style={hcell('right')}>Date</th>
                </tr></thead>
                <tbody>{ORDERS.map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                    <td style={cell('left', { fontFamily: mono, fontSize: '11px', color: MUTED })}>{o.id}</td>
                    <td style={cell()}>{o.customer}</td>
                    <td style={cell('left', { color: MUTED, fontSize: '11px' })}>{o.service}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 500 })}>{fmt(o.total)}</td>
                    <td style={{ ...cell('center') }}>
                      <span className="badge" style={{ background: STATUS_COLORS[o.status] + '18', color: STATUS_COLORS[o.status] }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={cell('right', { color: MUTED, fontSize: '11px' })}>{o.date}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>)}
        </main>
      </div>
    </>
  )
}
