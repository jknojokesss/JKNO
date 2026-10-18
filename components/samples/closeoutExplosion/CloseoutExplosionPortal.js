import { useMemo, useState, useCallback } from 'react'
import DemoLobby from '../../DemoLobby'
import {
  CHAR,
  SPICE,
  KRAFT,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  GREEN,
  RED,
  UI,
  MONO,
  SHELL_CSS,
  money,
  money0,
  pct1,
  fmtAsOfLong,
  fmtD,
  fmtInt,
  deltaColor,
  moneyColor,
} from './closeoutExplosionUtils'
import { buildDashboard, getLotById, salesInPeriod } from './closeoutExplosionCompute'
import DATA from './closeoutExplosionData'

const BIZ = 'CLOSEOUT EXPLOSION'
const TABS = [
  ['overview', 'Overview'],
  ['lots', 'Lots'],
  ['cash', 'Cash in stock'],
  ['buyers', 'Buyers owe'],
  ['pnl', 'P&L'],
]

export default function CloseoutExplosionPortal() {
  const dash = useMemo(() => buildDashboard(), [])
  const [tab, setTab] = useState('overview')
  const [lotFilter, setLotFilter] = useState('Open')
  const [stack, setStack] = useState([])

  const sampleHeader = `Sample — fictitious numbers · as of ${fmtAsOfLong(dash.asOf)}`
  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''

  const push = useCallback((frame) => setStack((s) => [...s, frame]), [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  const resetStack = useCallback(() => setStack([]), [])

  const goTab = (id) => {
    setTab(id)
    resetStack()
  }

  const openLot = (id) => push({ type: 'lot', id })
  const openBuyer = (name) => push({ type: 'buyer', name })

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '20px' }
  const lbl = {
    fontFamily: UI,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: KRAFT,
  }
  const big = { fontFamily: UI, fontWeight: 700, letterSpacing: '-0.4px' }

  const KPI = ({ k, v, sub, accent, onClick }) => {
    const inner = (
      <>
        <div style={lbl}>{k}</div>
        <div style={{ ...big, fontSize: '26px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
        {sub ? (
          <div style={{ fontFamily: UI, fontSize: '12px', color: sub.color || '#A2937A', marginTop: '3px' }}>{sub.text}</div>
        ) : null}
      </>
    )
    if (!onClick) {
      return <div style={{ ...card, flex: 1, minWidth: '140px', padding: '15px 17px' }}>{inner}</div>
    }
    return (
      <button
        type="button"
        className="ce-click"
        onClick={onClick}
        style={{
          ...card,
          flex: 1,
          minWidth: '140px',
          padding: '15px 17px',
          textAlign: 'left',
          cursor: 'pointer',
          border: `1px solid ${BORDER}`,
          position: 'relative',
        }}
      >
        {inner}
        <span style={{ position: 'absolute', top: 11, right: 13, color: '#C6B79A', fontSize: 15 }}>›</span>
      </button>
    )
  }

  const salesDeltaColor = dash.salesPctChange >= 0 ? GREEN : RED
  const salesSub = {
    text: `${dash.salesPctChange >= 0 ? '+' : ''}${pct1(dash.salesPctChange)} vs ${dash.pnlLabels.prior}`,
    color: salesDeltaColor,
  }

  const filteredLots =
    lotFilter === 'Open' ? dash.openLots : dash.closedLots

  const lotGroupTotals = filteredLots.reduce(
    (acc, row) => ({
      landed: acc.landed + row.landed,
      casesSold: acc.casesSold + row.casesSold,
      casesLeft: acc.casesLeft + row.casesLeft,
      revenue: acc.revenue + row.revenue,
      profit: acc.profit + row.profit,
    }),
    { landed: 0, casesSold: 0, casesLeft: 0, revenue: 0, profit: 0 },
  )

  const cashSorted = [...dash.openLots].sort((a, b) => b.cashTied - a.cashTied)

  const topFrame = stack[stack.length - 1]

  const portalStyles = SHELL_CSS({ CHAR, CREAM, INK, SPICE })

  const DetailBack = ({ label }) => (
    <button type="button" className="ce-back" onClick={pop}>
      ‹ Back{label ? ` · ${label}` : ''}
    </button>
  )

  const LotDetail = ({ id }) => {
    const row = getLotById(id)
    if (!row) return <p>Lot not found.</p>
    const { lot } = row
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl, color: SPICE }}>{lot.id}</div>
        <h2 style={{ ...big, fontSize: '22px', marginTop: 4, marginBottom: 16 }}>{lot.desc}</h2>
        <div style={{ ...card, marginBottom: 16 }}>
          {[
            ['Bought', fmtD(lot.bought)],
            ['Cases bought', fmtInt(lot.cases)],
            ['Buy price', money(lot.buy)],
            ['Freight', money(lot.freight)],
            ['Landed cost', money(row.landed)],
            ['Landed cost per case', money(row.landedPerCase)],
            ['Cases sold', fmtInt(row.casesSold)],
            ['Cases left', fmtInt(row.casesLeft)],
            ['Revenue so far', money(row.revenue)],
            ['Cost of cases sold', money(row.costSold)],
            ['Profit so far', money(row.profit)],
            ['Margin', pct1(row.margin * 100)],
            ['Cash tied up in stock', money(row.cashTied)],
          ].map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <span style={{ fontSize: 13, color: MUTED }}>{l}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: l.includes('Profit') ? moneyColor(row.profit) : INK }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Sales</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left ce-hide-sm">Invoice</th>
                <th className="ce-th-left">Buyer</th>
                <th>Cases</th>
                <th>Price</th>
                <th>Amount</th>
                <th className="ce-th-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {lot.sales.map((s) => (
                <tr
                  key={s.invoice}
                  className="ce-rowbtn"
                  onClick={() => openBuyer(s.buyer)}
                >
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left ce-hide-sm">{s.invoice}</td>
                  <td className="ce-td-left">{s.buyer}</td>
                  <td>{fmtInt(s.cases)}</td>
                  <td>{money(s.price)}</td>
                  <td>{money(s.amount)}</td>
                  <td className="ce-td-left" style={{ fontSize: 12, color: s.paid ? MUTED : INK }}>
                    {s.paid ? `Paid ${fmtD(s.paid)}` : 'Open'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const BuyerDetail = ({ name }) => {
    const terms = dash.buyerTerms[name] || 30
    const openInv = dash.openSales.filter((s) => s.buyer === name)
    const balance = openInv.reduce((sum, s) => sum + s.amount, 0)
    const paidFall = dash.paidFallByBuyer(name)
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl, color: SPICE }}>Buyer</div>
        <h2 style={{ ...big, fontSize: '20px', marginTop: 4, marginBottom: 8 }}>{name}</h2>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Terms · Net {terms}</div>
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={lbl}>Balance owed</div>
          <div style={{ ...big, fontSize: 28, marginTop: 4 }}>{money(balance)}</div>
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Open invoices</div>
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left ce-hide-sm">Invoice</th>
                <th className="ce-th-left ce-hide-sm">Lot</th>
                <th>Cases</th>
                <th>Amount</th>
                <th>Age</th>
                <th className="ce-th-left">Due</th>
              </tr>
            </thead>
            <tbody>
              {openInv.map((s) => (
                <tr key={s.invoice} className="ce-rowbtn" onClick={() => openLot(s.lotId)}>
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left ce-hide-sm">{s.invoice}</td>
                  <td className="ce-td-left ce-hide-sm">{s.lotId}</td>
                  <td>{fmtInt(s.cases)}</td>
                  <td>{money(s.amount)}</td>
                  <td>{s.ageDays}d</td>
                  <td className="ce-td-left">
                    {fmtD(s.due)}
                    {s.pastDue ? <span style={{ color: RED, marginLeft: 6 }}>Past due</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Paid invoices this fall</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left ce-hide-sm">Invoice</th>
                <th className="ce-th-left ce-hide-sm">Lot</th>
                <th>Amount</th>
                <th className="ce-th-left">Paid</th>
              </tr>
            </thead>
            <tbody>
              {paidFall.map((s) => (
                <tr key={s.invoice} className="ce-rowbtn" onClick={() => openLot(s.lotId)}>
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left ce-hide-sm">{s.invoice}</td>
                  <td className="ce-td-left ce-hide-sm">{s.lotId}</td>
                  <td>{money(s.amount)}</td>
                  <td className="ce-td-left">{fmtD(s.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const PnlSalesDrill = ({ which, mode }) => {
    const from = which === 'this' ? DATA.pnl.thisFrom : DATA.pnl.priorFrom
    const to = which === 'this' ? DATA.pnl.thisTo : DATA.pnl.priorTo
    const label = which === 'this' ? dash.pnlLabels.this : dash.pnlLabels.prior
    const rows = salesInPeriod(from, to)
    const total = mode === 'sales' ? rows.reduce((s, r) => s + r.amount, 0) : rows.reduce((s, r) => s + r.cost, 0)
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl }}>{mode === 'sales' ? 'Sales' : 'Cost of goods sold'} · {label}</div>
        <div style={{ ...big, fontSize: 22, margin: '8px 0 16px' }}>{money(total)}</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left ce-hide-sm">Invoice</th>
                <th className="ce-th-left ce-hide-sm">Lot</th>
                <th className="ce-th-left">Buyer</th>
                <th>{mode === 'sales' ? 'Amount' : 'Cost'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.invoice} className="ce-rowbtn" onClick={() => openLot(s.lotId)}>
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left ce-hide-sm">{s.invoice}</td>
                  <td className="ce-td-left ce-hide-sm">{s.lotId}</td>
                  <td className="ce-td-left">{s.buyer}</td>
                  <td>{money(mode === 'sales' ? s.amount : s.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ce-total">
                <td className="ce-td-left" colSpan={4}>Total</td>
                <td>{money(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  const ExpenseDrill = ({ name }) => {
    const line = DATA.pnl.expenses.find((e) => e.name === name)
    if (!line) return null
    const delta = line.this - line.prior
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl }}>Operating expense</div>
        <h2 style={{ ...big, fontSize: 20, margin: '8px 0 16px' }}>{name}</h2>
        <div style={{ ...card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: MUTED }}>{dash.pnlLabels.this}</span>
            <span style={{ fontFamily: MONO }}>{money(line.this)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ color: MUTED }}>{dash.pnlLabels.prior}</span>
            <span style={{ fontFamily: MONO }}>{money(line.prior)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ color: MUTED }}>Change</span>
            <span style={{ fontFamily: MONO, color: deltaColor(delta, true) }}>{money(delta)}</span>
          </div>
        </div>
      </div>
    )
  }

  const PnlTable = () => {
    const { thisP, priorP, pnlLabels } = dash
    const rows = [
      { key: 'sales', label: 'Sales', this: thisP.sales, prior: priorP.sales, cost: false, drill: { type: 'pnlSales', which: 'this', mode: 'sales' } },
      { key: 'cogs', label: 'Cost of goods sold', this: thisP.cogs, prior: priorP.cogs, cost: true, drill: { type: 'pnlSales', which: 'this', mode: 'cogs' } },
      { key: 'gross', label: 'Gross profit', this: thisP.grossProfit, prior: priorP.grossProfit, cost: false, bold: true },
      { key: 'gm', label: 'Gross margin %', this: thisP.grossMargin * 100, prior: priorP.grossMargin * 100, cost: false, pct: true },
      ...thisP.expenseLines.map((e) => {
        const pe = priorP.expenseLines.find((x) => x.name === e.name)
        return {
          key: e.name,
          label: e.name,
          this: e.amount,
          prior: pe?.amount ?? 0,
          cost: true,
          expense: e.name,
        }
      }),
      { key: 'opex', label: 'Total operating expenses', this: thisP.operatingExpenses, prior: priorP.operatingExpenses, cost: true, bold: true },
      { key: 'net', label: 'Net profit', this: thisP.netProfit, prior: priorP.netProfit, cost: false, bold: true },
    ]

    return (
      <div style={{ ...card, overflowX: 'auto' }}>
        <table className="ce-table" style={{ minWidth: 320 }}>
          <thead>
            <tr>
              <th className="ce-th-left" />
              <th>{pnlLabels.this}</th>
              <th>{pnlLabels.prior}</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.this - r.prior
              const fmt = (v) => (r.pct ? pct1(v) : money(v))
              const onDrill = () => {
                if (r.drill) push(r.drill)
                else if (r.expense) push({ type: 'expense', name: r.expense })
              }
              const clickable = r.drill || r.expense
              return (
                <tr
                  key={r.key}
                  className={clickable ? 'ce-rowbtn' : undefined}
                  onClick={clickable ? onDrill : undefined}
                  style={r.bold ? { fontWeight: 700 } : undefined}
                >
                  <td className="ce-td-left" style={{ fontWeight: r.bold ? 700 : 400, color: INK }}>
                    {r.label}
                    {clickable ? <span style={{ color: '#C9BBA0', fontSize: 11 }}> ›</span> : null}
                  </td>
                  <td style={{ color: r.cost ? RED : moneyColor(r.this) }}>{fmt(r.this)}</td>
                  <td style={{ color: MUTED }}>{fmt(r.prior)}</td>
                  <td style={{ color: deltaColor(delta, r.cost) }}>{r.pct ? `${delta >= 0 ? '+' : ''}${pct1(delta)}` : money(delta)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const renderSection = () => {
    if (topFrame?.type === 'lot') return <LotDetail id={topFrame.id} />
    if (topFrame?.type === 'buyer') return <BuyerDetail name={topFrame.name} />
    if (topFrame?.type === 'pnlSales') return <PnlSalesDrill which={topFrame.which} mode={topFrame.mode} />
    if (topFrame?.type === 'expense') return <ExpenseDrill name={topFrame.name} />

    if (tab === 'overview') {
      const openList = [...dash.openLots].sort((a, b) => b.cashTied - a.cashTied).slice(0, 6)
      return (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <KPI
              k={`Sales ${dash.pnlLabels.this}`}
              v={money0(dash.thisP.sales)}
              sub={salesSub}
              accent={SPICE}
              onClick={() => goTab('pnl')}
            />
            <KPI k={`Net profit ${dash.pnlLabels.this}`} v={money0(dash.thisP.netProfit)} accent={dash.thisP.netProfit >= 0 ? GREEN : RED} onClick={() => goTab('pnl')} />
            <KPI k="Cash tied up in stock" v={money0(dash.cashTiedTotal)} onClick={() => goTab('cash')} />
            <KPI k="Buyers owe" v={money0(dash.buyersOwe)} onClick={() => goTab('buyers')} />
            <KPI k="Open lots" v={fmtInt(dash.openLots.length)} onClick={() => goTab('lots')} />
            <KPI k="Cases in warehouse" v={fmtInt(dash.casesInWarehouse)} onClick={() => goTab('cash')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={card}>
              <div style={{ ...lbl, marginBottom: 12 }}>Open lots</div>
              {openList.map((row, i) => (
                <button
                  key={row.lot.id}
                  type="button"
                  className="ce-click"
                  onClick={() => openLot(row.lot.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    width: '100%',
                    border: 'none',
                    borderTop: i ? `1px solid ${BORDER}` : 'none',
                    background: 'transparent',
                    padding: '10px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{row.lot.id}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{row.lot.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 12 }}>{fmtInt(row.casesLeft)} left</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{money0(row.cashTied)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={card}>
              <div style={{ ...lbl, marginBottom: 12 }}>Buyers owe</div>
              {dash.buyerRows.slice(0, 6).map((b, i) => (
                <button
                  key={b.name}
                  type="button"
                  className="ce-click"
                  onClick={() => {
                    setTab('buyers')
                    setStack([{ type: 'buyer', name: b.name }])
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    border: 'none',
                    borderTop: i ? `1px solid ${BORDER}` : 'none',
                    background: 'transparent',
                    padding: '10px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
                >
                  <span style={{ paddingRight: 8 }}>{b.name}</span>
                  <span style={{ fontFamily: MONO, flexShrink: 0 }}>{money(b.total)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )
    }

    if (tab === 'lots') {
      return (
        <>
          <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
            {['Open', 'Closed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLotFilter(f)}
                style={{
                  padding: '8px 14px',
                  minHeight: 40,
                  border: 'none',
                  background: lotFilter === f ? CHAR : 'transparent',
                  color: lotFilter === f ? CREAM : MUTED,
                  fontFamily: UI,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ce-table ce-compact">
              <thead>
                <tr>
                  <th className="ce-th-left">Lot</th>
                  <th>Landed</th>
                  <th>Sold</th>
                  <th>Left</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((row) => (
                  <tr key={row.lot.id} className="ce-rowbtn" onClick={() => openLot(row.lot.id)}>
                    <td className="ce-td-left">
                      <div style={{ fontWeight: 600 }}>{row.lot.id}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{row.lot.desc}</div>
                    </td>
                    <td>{money(row.landed)}</td>
                    <td>{fmtInt(row.casesSold)}</td>
                    <td>{fmtInt(row.casesLeft)}</td>
                    <td>{money(row.revenue)}</td>
                    <td style={{ color: moneyColor(row.profit) }}>{money(row.profit)}</td>
                  </tr>
                ))}
                <tr className="ce-total">
                  <td className="ce-td-left">Total</td>
                  <td>{money(lotGroupTotals.landed)}</td>
                  <td>{fmtInt(lotGroupTotals.casesSold)}</td>
                  <td>{fmtInt(lotGroupTotals.casesLeft)}</td>
                  <td>{money(lotGroupTotals.revenue)}</td>
                  <td style={{ color: moneyColor(lotGroupTotals.profit) }}>{money(lotGroupTotals.profit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )
    }

    if (tab === 'cash') {
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Lot</th>
                <th>Left</th>
                <th>Cost / case</th>
                <th>Cash tied up</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {cashSorted.map((row) => (
                <tr key={row.lot.id} className="ce-rowbtn" onClick={() => openLot(row.lot.id)}>
                  <td className="ce-td-left">
                    <div style={{ fontWeight: 600 }}>{row.lot.id}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{row.lot.desc}</div>
                  </td>
                  <td>{fmtInt(row.casesLeft)}</td>
                  <td>{money(row.landedPerCase)}</td>
                  <td>{money(row.cashTied)}</td>
                  <td>{row.daysSinceBought}</td>
                </tr>
              ))}
              <tr className="ce-total">
                <td className="ce-td-left">Total</td>
                <td>{fmtInt(dash.casesInWarehouse)}</td>
                <td>—</td>
                <td>{money(dash.cashTiedTotal)}</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (tab === 'buyers') {
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Buyer</th>
                <th>Invoices</th>
                <th>0–15</th>
                <th>16–30</th>
                <th>Over 30</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {dash.buyerRows.map((b) => (
                <tr key={b.name} className="ce-rowbtn" onClick={() => openBuyer(b.name)}>
                  <td className="ce-td-left">{b.name}</td>
                  <td>{b.count}</td>
                  <td>{money(b.bucket015)}</td>
                  <td>{money(b.bucket1630)}</td>
                  <td>{money(b.bucketOver30)}</td>
                  <td>{money(b.total)}</td>
                </tr>
              ))}
              <tr className="ce-total">
                <td className="ce-td-left">Total</td>
                <td>{dash.bucketTotals.count}</td>
                <td>{money(dash.bucketTotals.bucket015)}</td>
                <td>{money(dash.bucketTotals.bucket1630)}</td>
                <td>{money(dash.bucketTotals.bucketOver30)}</td>
                <td>{money(dash.bucketTotals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (tab === 'pnl') return <PnlTable />
    return null
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <DemoLobby />
      <div className="ce-shell">
        <aside className="ce-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ ...big, fontSize: 18, color: CREAM, letterSpacing: '0.4px', lineHeight: 1.2 }}>Closeout Explosion</div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: 12 }}>Owner portal</div>
          </div>
          <nav className="ce-nav ce-nav--main" aria-label="Sections">
            {TABS.map(([id, label]) => {
              const active = tab === id && !stack.length
              return (
                <button
                  key={id}
                  type="button"
                  className="ce-navbtn"
                  onClick={() => goTab(id)}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` }
                      : undefined
                  }
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#8A7A66', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: SPICE, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>
        <main className="ce-main">
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...lbl, color: KRAFT }}>SAMPLE DASHBOARD / JK No Jokes Financials</div>
            <h1 style={{ ...big, fontSize: 28, color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: 4 }}>{BIZ}</h1>
            {!stack.length ? (
              <h2 style={{ ...big, fontSize: 22, color: INK, marginTop: 8, fontWeight: 600 }}>{currentLabel}</h2>
            ) : null}
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{sampleHeader}</div>
          </div>
          {renderSection()}
        </main>
      </div>
    </>
  )
}
