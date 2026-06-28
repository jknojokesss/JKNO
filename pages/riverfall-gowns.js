import { useState } from 'react'
import Head from 'next/head'

const BIZ = 'Riverfall Gowns'
const SIDEBAR = '#1E1A2E', ACCENT = '#B14D6A', BG = '#FAF8F5', BORDER = '#E8E0D8'
const INK = '#23262E', MUTED = '#8A8A93', GREEN = '#2E7D46', RED = '#C8322B', AMBER = '#9C6B12'
const mono = "'DM Mono', monospace"
const serif = "'Cormorant Garamond', serif"
const ui = "'DM Sans', sans-serif"

const money = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = (n) => '$' + Math.round(n || 0).toLocaleString()
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })

const NAV = [
  { id: 'orders',     label: 'Orders'     },
  { id: 'customers',  label: 'Customers'  },
  { id: 'financials', label: 'Financials' },
  { id: 'alterations',label: 'Alterations'},
]

const TAX = 0.08875

const ORDERS = [
  { id: 'G-001', firstName: 'Miriam',   lastName: 'Goldstein',  date: '2026-05-10', event: '2026-06-28', items: [{ desc: 'Rose Gold Gown – Style 4812', qty: 1, price: 1200 }, { desc: 'Alterations', qty: 1, price: 180, taxable: false }], payments: [{ amount: 600, method: 'Check', date: '2026-05-10' }], alterations: true, alterationsDone: false, alterationsDue: '2026-06-20', notes: 'Needs hem shortened 2 inches' },
  { id: 'G-002', firstName: 'Sarah',    lastName: 'Levine',     date: '2026-05-14', event: '2026-07-05', items: [{ desc: 'Ivory A-Line – Style 2291', qty: 1, price: 980 }], payments: [{ amount: 490, method: 'Zelle', date: '2026-05-14' }], alterations: false, alterationsDone: false, notes: '' },
  { id: 'G-003', firstName: 'Devorah',  lastName: 'Stern',      date: '2026-05-20', event: '2026-06-15', items: [{ desc: 'Navy Formal – Style 3340', qty: 1, price: 1450 }, { desc: 'Alterations', qty: 1, price: 220, taxable: false }], payments: [{ amount: 1450, method: 'Card', date: '2026-05-20' }, { amount: 220, method: 'Cash', date: '2026-06-01' }], alterations: true, alterationsDone: true, notes: '' },
  { id: 'G-004', firstName: 'Rachel',   lastName: 'Cohen',      date: '2026-06-01', event: '2026-07-12', items: [{ desc: 'Blush Satin – Style 5510', qty: 1, price: 1650 }], payments: [{ amount: 500, method: 'Check', date: '2026-06-01' }], alterations: false, alterationsDone: false, notes: 'Bride — handle with priority' },
  { id: 'G-005', firstName: 'Chana',    lastName: 'Friedman',   date: '2026-06-05', event: '2026-07-20', items: [{ desc: 'Champagne Gown – Style 1190', qty: 1, price: 875 }, { desc: 'Alterations', qty: 1, price: 150, taxable: false }], payments: [], alterations: true, alterationsDone: false, alterationsDue: '2026-07-10', notes: '' },
  { id: 'G-006', firstName: 'Leah',     lastName: 'Weiss',      date: '2026-06-10', event: '2026-08-03', items: [{ desc: 'Silver Beaded – Style 7721', qty: 1, price: 2100 }], payments: [{ amount: 1000, method: 'Zelle', date: '2026-06-10' }], alterations: false, alterationsDone: false, notes: '' },
  { id: 'G-007', firstName: 'Rivka',    lastName: 'Horowitz',   date: '2026-04-15', event: '2026-06-01', items: [{ desc: 'Burgundy Gown – Style 6603', qty: 1, price: 1100 }, { desc: 'Alterations', qty: 1, price: 200, taxable: false }], payments: [{ amount: 1100, method: 'Check', date: '2026-04-15' }, { amount: 200, method: 'Cash', date: '2026-05-20' }], alterations: true, alterationsDone: true, notes: '' },
  { id: 'G-008', firstName: 'Tova',     lastName: 'Katz',       date: '2026-04-20', event: '2026-05-30', items: [{ desc: 'Emerald Gown – Style 2280', qty: 1, price: 1350 }], payments: [{ amount: 1350, method: 'Card', date: '2026-04-20' }], alterations: false, alterationsDone: false, notes: '' },
]

const sumItems = (items) => items.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0)
const calcTax = (items) => items.filter(i => i.taxable !== false).reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0) * TAX
const orderTotal = (o) => sumItems(o.items) + calcTax(o.items)
const sumPaid = (o) => o.payments.reduce((s, p) => s + p.amount, 0)
const balance = (o) => orderTotal(o) - sumPaid(o)
const isOpen = (o) => balance(o) > 0.01 || (o.alterations && !o.alterationsDone)

export default function RiverfallGowns() {
  const [tab, setTab] = useState('orders')
  const [orderTab, setOrderTab] = useState('open')
  const [expanded, setExpanded] = useState(null)

  const openOrders = ORDERS.filter(isOpen)
  const completedOrders = ORDERS.filter(o => !isOpen(o))
  const displayed = orderTab === 'open' ? openOrders : orderTab === 'completed' ? completedOrders : ORDERS

  const totalRevenue = ORDERS.reduce((s, o) => s + orderTotal(o), 0)
  const totalCollected = ORDERS.reduce((s, o) => s + sumPaid(o), 0)
  const totalOutstanding = ORDERS.reduce((s, o) => s + Math.max(0, balance(o)), 0)
  const alterationsPending = ORDERS.filter(o => o.alterations && !o.alterationsDone)

  const hcell = (align = 'left') => ({ padding: '7px 14px', fontSize: '9px', color: MUTED, background: '#F5F0EA', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, fontFamily: ui, textAlign: align })
  const cell = (align = 'left', extra = {}) => ({ padding: '10px 14px', borderBottom: `1px solid #F0EBE4`, color: INK, fontSize: '13px', fontFamily: ui, textAlign: align, ...extra })

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px 20px', flex: 1, minWidth: '140px' }}>
      <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{k}</div>
      <div style={{ fontFamily: serif, fontSize: '30px', fontWeight: 600, color: color || INK, lineHeight: 1 }}>{v}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '5px' }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <Head>
        <title>{BIZ} — Dashboard Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${ui};background:${BG};color:${INK}}
        .shell{display:flex;min-height:100vh}
        .side{width:210px;flex-shrink:0;background:${SIDEBAR};display:flex;flex-direction:column;padding:22px 12px;position:sticky;top:0;height:100vh;overflow-y:auto}
        .main{flex:1;min-width:0;padding:28px 32px 60px;overflow-y:auto}
        .nbtn{display:block;width:100%;text-align:left;padding:9px 13px;border-radius:7px;border:none;background:transparent;color:#6a6a7a;font-family:${ui};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:2px;transition:background .15s,color .15s}
        .nbtn:hover{background:rgba(255,255,255,.06);color:#ddd}
        .nbtn.on{background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 3px 0 0 ${ACCENT}}
        .otab{padding:10px 18px;border-radius:8px;border:1.5px solid;cursor:pointer;font-family:${ui};font-size:13px;font-weight:600;transition:all .15s}
        .kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
        @media(max-width:700px){.side{display:none}.main{padding:16px 14px 48px}}
      `}</style>

      <div className="shell">
        <aside className="side">
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '16px' }}>
            <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Riverfall<br />Gowns</div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: ACCENT, letterSpacing: '.18em', marginTop: '5px' }}>ORDER MANAGEMENT</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} className={`nbtn${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#444', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br /><span style={{ color: ACCENT }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>

        <main className="main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '3px' }}>June 2026</div>
              <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 600 }}>{NAV.find(n => n.id === tab)?.label}</div>
            </div>
            <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, background: '#EDE8E0', padding: '5px 12px', borderRadius: '20px' }}>Sample · JK No Jokes</div>
          </div>

          {/* ── ORDERS ── */}
          {tab === 'orders' && <>
            <div className="kpi-row">
              <Kpi k="Open Orders"  v={openOrders.length}     sub="balance remaining" color={ACCENT} />
              <Kpi k="Outstanding"  v={money0(totalOutstanding)} sub="yet to collect" color={RED} />
              <Kpi k="Completed"    v={completedOrders.length} sub="fully paid + done" color={GREEN} />
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[['open','Open'], ['completed','Completed'], ['all','All']].map(([k, l]) => (
                <button key={k} className="otab" onClick={() => setOrderTab(k)}
                  style={{ borderColor: orderTab === k ? ACCENT : BORDER, background: orderTab === k ? ACCENT : '#fff', color: orderTab === k ? '#fff' : MUTED }}>
                  {l} {k === 'open' ? `(${openOrders.length})` : k === 'completed' ? `(${completedOrders.length})` : `(${ORDERS.length})`}
                </button>
              ))}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Order #</th>
                  <th style={hcell()}>Customer</th>
                  <th style={hcell()}>Event Date</th>
                  <th style={hcell('right')}>Total</th>
                  <th style={hcell('right')}>Paid</th>
                  <th style={hcell('right')}>Balance</th>
                  <th style={hcell('center')}>Alt.</th>
                </tr></thead>
                <tbody>
                  {displayed.map((o, i) => {
                    const tot = orderTotal(o), paid = sumPaid(o), bal = balance(o)
                    const open = expanded === o.id
                    return <>
                      <tr key={o.id} onClick={() => setExpanded(open ? null : o.id)}
                        style={{ background: open ? '#FBF7F4' : i % 2 ? '#FDFAF7' : '#fff', cursor: 'pointer' }}>
                        <td style={cell('left', { fontFamily: mono, fontSize: '11px', color: MUTED })}>{o.id}</td>
                        <td style={cell('left', { fontWeight: 600 })}>{o.firstName} {o.lastName}</td>
                        <td style={cell('left', { color: MUTED })}>{fmtDate(o.event)}</td>
                        <td style={cell('right', { fontFamily: mono })}>{money(tot)}</td>
                        <td style={cell('right', { fontFamily: mono, color: GREEN })}>{money(paid)}</td>
                        <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: bal > 0.01 ? RED : GREEN })}>{bal > 0.01 ? money(bal) : '✓ Paid'}</td>
                        <td style={{ ...cell('center') }}>
                          {o.alterations && <span style={{ background: o.alterationsDone ? GREEN + '20' : AMBER + '20', color: o.alterationsDone ? GREEN : AMBER, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.alterationsDone ? 'Done' : 'Pending'}</span>}
                        </td>
                      </tr>
                      {open && (
                        <tr key={o.id + '-detail'}>
                          <td colSpan={7} style={{ background: '#FBF7F4', borderBottom: `1px solid ${BORDER}`, padding: '0 14px 16px' }}>
                            <div style={{ paddingTop: '12px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                              <div style={{ flex: 2, minWidth: '200px' }}>
                                <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '.08em', marginBottom: '8px' }}>ITEMS</div>
                                {o.items.map((it, j) => (
                                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: j < o.items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                                    <span>{it.desc}</span>
                                    <span style={{ fontFamily: mono }}>{money((it.qty || 1) * it.price)}</span>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: MUTED, padding: '4px 0', marginTop: '4px' }}>
                                  <span>Tax (8.875%)</span><span style={{ fontFamily: mono }}>{money(calcTax(o.items))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', padding: '8px 0', borderTop: `2px solid ${INK}`, marginTop: '4px' }}>
                                  <span>Total</span><span style={{ fontFamily: mono }}>{money(tot)}</span>
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: '160px' }}>
                                <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '.08em', marginBottom: '8px' }}>PAYMENTS</div>
                                {o.payments.length === 0 && <div style={{ fontSize: '12px', color: MUTED }}>No payments yet</div>}
                                {o.payments.map((p, j) => (
                                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
                                    <span style={{ color: MUTED }}>{fmtDate(p.date)} · {p.method}</span>
                                    <span style={{ fontFamily: mono, color: GREEN }}>{money(p.amount)}</span>
                                  </div>
                                ))}
                                {o.notes && <div style={{ marginTop: '12px', fontSize: '12px', color: MUTED, background: '#F5F0EA', borderRadius: '6px', padding: '8px 10px' }}>{o.notes}</div>}
                                {o.alterations && o.alterationsDue && (
                                  <div style={{ marginTop: '10px', fontFamily: mono, fontSize: '10px', color: AMBER }}>ALT DUE: {fmtDate(o.alterationsDue)}</div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  })}
                </tbody>
              </table>
            </div>
          </>}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && <>
            <div className="kpi-row">
              <Kpi k="Total Customers" v={ORDERS.length} />
              <Kpi k="Repeat Clients"  v="3" sub="ordered more than once" color={ACCENT} />
              <Kpi k="Avg Order Value" v={money0(totalRevenue / ORDERS.length)} />
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Customer</th>
                  <th style={hcell()}>Order #</th>
                  <th style={hcell()}>Event</th>
                  <th style={hcell('right')}>Order Total</th>
                  <th style={hcell('center')}>Status</th>
                </tr></thead>
                <tbody>{ORDERS.map((o, i) => {
                  const tot = orderTotal(o), bal = balance(o), open = isOpen(o)
                  return (
                    <tr key={o.id} style={{ background: i % 2 ? '#FDFAF7' : '#fff' }}>
                      <td style={cell('left', { fontWeight: 600 })}>{o.firstName} {o.lastName}</td>
                      <td style={cell('left', { fontFamily: mono, fontSize: '11px', color: MUTED })}>{o.id}</td>
                      <td style={cell('left', { color: MUTED })}>{fmtDate(o.event)}</td>
                      <td style={cell('right', { fontFamily: mono })}>{money(tot)}</td>
                      <td style={{ ...cell('center') }}>
                        <span style={{ background: open ? RED + '18' : GREEN + '18', color: open ? RED : GREEN, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{open ? 'Open' : 'Complete'}</span>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          </>}

          {/* ── FINANCIALS ── */}
          {tab === 'financials' && <>
            <div className="kpi-row">
              <Kpi k="Total Revenue"   v={money0(totalRevenue)}    sub="all orders incl. tax" />
              <Kpi k="Collected"       v={money0(totalCollected)}  sub="payments received" color={GREEN} />
              <Kpi k="Outstanding"     v={money0(totalOutstanding)} sub="balance remaining" color={RED} />
              <Kpi k="Orders"          v={ORDERS.length}           sub="total orders" />
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontFamily: mono, fontSize: '10px', color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' }}>Order Breakdown</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Order</th><th style={hcell()}>Customer</th>
                  <th style={hcell('right')}>Total</th><th style={hcell('right')}>Paid</th>
                  <th style={hcell('right')}>Balance</th>
                </tr></thead>
                <tbody>{ORDERS.map((o, i) => {
                  const tot = orderTotal(o), paid = sumPaid(o), bal = balance(o)
                  return (
                    <tr key={o.id} style={{ background: i % 2 ? '#FDFAF7' : '#fff' }}>
                      <td style={cell('left', { fontFamily: mono, fontSize: '11px', color: MUTED })}>{o.id}</td>
                      <td style={cell()}>{o.firstName} {o.lastName}</td>
                      <td style={cell('right', { fontFamily: mono })}>{money(tot)}</td>
                      <td style={cell('right', { fontFamily: mono, color: GREEN })}>{money(paid)}</td>
                      <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: bal > 0.01 ? RED : MUTED })}>{bal > 0.01 ? money(bal) : '—'}</td>
                    </tr>
                  )
                })}
                </tbody>
                <tfoot><tr style={{ background: '#F5F0EA', borderTop: `2px solid ${BORDER}` }}>
                  <td colSpan={2} style={cell('left', { fontWeight: 700, fontFamily: mono })}>Total</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700 })}>{money(totalRevenue)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, color: GREEN })}>{money(totalCollected)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, color: RED })}>{money(totalOutstanding)}</td>
                </tr></tfoot>
              </table>
            </div>
          </>}

          {/* ── ALTERATIONS ── */}
          {tab === 'alterations' && <>
            <div className="kpi-row">
              <Kpi k="Pending"  v={alterationsPending.length} sub="not yet complete" color={AMBER} />
              <Kpi k="Complete" v={ORDERS.filter(o => o.alterations && o.alterationsDone).length} sub="finished" color={GREEN} />
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Order</th><th style={hcell()}>Customer</th>
                  <th style={hcell()}>Due Date</th><th style={hcell()}>Notes</th>
                  <th style={hcell('center')}>Status</th>
                </tr></thead>
                <tbody>{ORDERS.filter(o => o.alterations).map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 ? '#FDFAF7' : '#fff' }}>
                    <td style={cell('left', { fontFamily: mono, fontSize: '11px', color: MUTED })}>{o.id}</td>
                    <td style={cell('left', { fontWeight: 600 })}>{o.firstName} {o.lastName}</td>
                    <td style={cell('left', { color: MUTED })}>{o.alterationsDue ? fmtDate(o.alterationsDue) : '—'}</td>
                    <td style={cell('left', { color: MUTED, fontSize: '12px' })}>{o.notes || '—'}</td>
                    <td style={{ ...cell('center') }}>
                      <span style={{ background: o.alterationsDone ? GREEN + '20' : AMBER + '20', color: o.alterationsDone ? GREEN : AMBER, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                        {o.alterationsDone ? 'Complete' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>}
        </main>
      </div>
    </>
  )
}
