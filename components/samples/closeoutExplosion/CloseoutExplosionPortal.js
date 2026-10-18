import { useMemo, useState, useCallback } from 'react'
import CloseoutExplosionLobby from './CloseoutExplosionLobby'
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
  fmtD,
  fmtInt,
  deltaColor,
  moneyColor,
  daysBetween,
} from './closeoutExplosionUtils'
import { buildDashboard, getLotById, salesInPeriod } from './closeoutExplosionCompute'
import DATA from './closeoutExplosionData'
import CloseoutExplosionProfitTab from './CloseoutExplosionProfitTab'
import {
  isInvoiced,
  isOpenInvoice,
  isShippedOnly,
  nextInvoiceNumber,
  saleLineKey,
  saleStatusLabel,
} from './closeoutExplosionSales'

const BIZ = 'CLOSEOUT EXPLOSION'
const buyerTypes = Object.fromEntries(DATA.buyers.map((b) => [b.name, b.type]))

function BuyerLabel({ name }) {
  const type = buyerTypes[name]
  return (
    <span className="ce-buyer-label">
      <span className="ce-buyer-name">{name}</span>
      {type ? <span className="ce-buyer-type">{type}</span> : null}
    </span>
  )
}

const StackKV = ({ k, v, vColor = INK }) => (
  <div className="ce-stack-kv">
    <span className="k">{k}</span>
    <span className="v" style={{ color: vColor }}>{v}</span>
  </div>
)

const TABS = [
  ['overview', 'Overview'],
  ['lots', 'Lots'],
  ['profit', 'Profit per lot'],
  ['cash', 'Cash in stock'],
  ['buyers', 'Buyers owe'],
  ['pnl', 'P&L'],
]

function profitColor(amount) {
  if (amount < 0) return RED
  if (amount > 0) return GREEN
  return INK
}

export default function CloseoutExplosionPortal() {
  const dash = useMemo(() => buildDashboard(), [])
  const [tab, setTab] = useState('overview')
  const [lotFilter, setLotFilter] = useState('Open')
  const [stack, setStack] = useState([])

  const sampleHeader = 'Sample — fictitious numbers · as of Oct 2026'
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
  const openSale = (lotId, saleKey) => push({ type: 'sale', lotId, saleKey })
  const openInvoicePreview = (lotId, saleKey, mode) =>
    push({ type: 'invoicePreview', lotId, saleKey, mode })

  const findSale = (lotId, saleKey) => {
    const lot = DATA.lots.find((l) => l.id === lotId)
    return lot?.sales.find((s) => saleLineKey(s) === saleKey) ?? null
  }

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

  const KPI = ({ k, v, sub, valueColor, onClick }) => {
    const inner = (
      <>
        <div style={{ ...lbl, ...(onClick ? { lineHeight: 1.3 } : {}) }}>{k}</div>
        <div style={{ ...big, fontSize: '26px', color: valueColor || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
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

  const profitLotRows = useMemo(
    () => [...dash.lots].sort((a, b) => a.lot.id.localeCompare(b.lot.id)),
    [dash.lots],
  )

  const topFrame = stack[stack.length - 1]

  const portalStyles = SHELL_CSS({ CHAR, CREAM, INK, SPICE })

  const DetailBack = () => (
    <button type="button" className="ce-back" onClick={pop}>
      Back
    </button>
  )

  const LotDetail = ({ id }) => {
    const row = getLotById(id)
    if (!row) return <p>Lot not found.</p>
    const { lot } = row
    const costLines = [
      ['Purchase cost', money(row.purchaseCost)],
      ['Freight in', money(row.freightIn)],
    ]
    if (row.brokerCommission > 0) {
      costLines.push(['Broker commission', money(row.brokerCommission)])
    }
    costLines.push(['Total cost', money(row.totalCost)])
    if (row.lot.status === 'Open') {
      costLines.push(['Cost still in stock', money(row.costInStock)])
    }

    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl, color: SPICE }}>{lot.id}</div>
        <h2 style={{ ...big, fontSize: '22px', marginTop: 4, marginBottom: 12 }}>{lot.desc}</h2>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
          <div>Supplier: {row.supplierStatus}</div>
          <div>
            Buyers:{' '}
            {row.buyerUnpaidCount === 0
              ? 'Paid'
              : `${row.buyerUnpaidCount} unpaid (${money(row.buyerUnpaidAmount)})`}
          </div>
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Cost</div>
        <div style={{ ...card, marginBottom: 16 }}>
          {costLines.map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <span style={{ fontSize: 13, color: MUTED }}>{l}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: INK }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginBottom: 16 }}>
          {[
            ['Cases sold', fmtInt(row.casesSold)],
            ['Cases left', fmtInt(row.casesLeft)],
            ['Sold so far', money(row.revenue)],
            ['Cost of cases sold', money(row.costSold)],
            ['Profit', money(row.profit)],
            ['Margin', row.revenue > 0 ? pct1(row.margin * 100) : 'No sales yet'],
          ].map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <span style={{ fontSize: 13, color: MUTED }}>{l}</span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  color: l === 'Profit' ? profitColor(row.profit) : INK,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Sales</div>
        <div className="ce-stack-only">
          {lot.sales.map((s) => (
            <button
              key={saleLineKey(s)}
              type="button"
              className="ce-stack-row ce-click"
              onClick={() => openSale(lot.id, saleLineKey(s))}
            >
              <div className="ce-stack-title">{fmtD(s.date)}</div>
              <div className="ce-stack-sub">{isInvoiced(s) ? s.invoice : 'Shipped, not invoiced'}</div>
              <div style={{ marginTop: 4 }}>
                <BuyerLabel name={s.buyer} />
              </div>
              <div className="ce-stack-grid ce-stack-grid-3">
                <StackKV k="Cases" v={fmtInt(s.cases)} />
                <StackKV k="Price" v={money(s.price)} />
                <StackKV k="Amount" v={money(s.amount)} />
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{saleStatusLabel(s)}</div>
            </button>
          ))}
        </div>
        <div className="ce-table-wrap">
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left ce-hide-sm">Ref</th>
                <th className="ce-th-left">Buyer</th>
                <th>Cases</th>
                <th>Amount</th>
                <th className="ce-th-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {lot.sales.map((s) => (
                <tr
                  key={saleLineKey(s)}
                  className="ce-rowbtn"
                  onClick={() => openSale(lot.id, saleLineKey(s))}
                >
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left ce-hide-sm">{isInvoiced(s) ? s.invoice : '—'}</td>
                  <td className="ce-td-left">
                    <BuyerLabel name={s.buyer} />
                  </td>
                  <td>{fmtInt(s.cases)}</td>
                  <td>{money(s.amount)}</td>
                  <td className="ce-td-left" style={{ fontSize: 12, color: MUTED }}>
                    {saleStatusLabel(s)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const SaleDetail = ({ lotId, saleKey }) => {
    const row = getLotById(lotId)
    const sale = findSale(lotId, saleKey)
    if (!row || !sale) return <p>Sale not found.</p>
    const { lot } = row
    const shippedOnly = isShippedOnly(sale)
    const openInvoiced = isOpenInvoice(sale)
    const detailRows = [
      ['Date', fmtD(sale.date)],
      ['Lot', `${lot.id} · ${lot.desc}`],
      ['Cases', fmtInt(sale.cases)],
      ['Price per case', money(sale.price)],
      ['Amount', money(sale.amount)],
      ['Status', saleStatusLabel(sale)],
    ]
    if (isInvoiced(sale) && sale.due) {
      detailRows.push(['Due', fmtD(sale.due)])
    }
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl, color: SPICE }}>{isInvoiced(sale) ? sale.invoice : 'Shipment'}</div>
        <h2 style={{ ...big, fontSize: 20, marginTop: 4, marginBottom: 8 }}>
          <BuyerLabel name={sale.buyer} />
        </h2>
        <div style={{ ...card, marginBottom: 16 }}>
          {detailRows.map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{l}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        {shippedOnly ? (
          <button
            type="button"
            className="ce-btn-primary"
            onClick={() => openInvoicePreview(lotId, saleKey, 'create')}
          >
            Create invoice
          </button>
        ) : null}
        {openInvoiced ? (
          <button
            type="button"
            className="ce-btn-primary"
            onClick={() => openInvoicePreview(lotId, saleKey, 'view')}
          >
            View invoice
          </button>
        ) : null}
        {isInvoiced(sale) ? (
          <button type="button" className="ce-btn-secondary" onClick={() => openBuyer(sale.buyer)}>
            View buyer balance
          </button>
        ) : null}
      </div>
    )
  }

  const InvoicePreview = ({ lotId, saleKey, mode }) => {
    const row = getLotById(lotId)
    const sale = findSale(lotId, saleKey)
    if (!row || !sale) return null
    const { lot } = row
    const terms = dash.buyerTerms[sale.buyer] || 30
    const createMode = mode === 'create'
    const previewInv = createMode ? nextInvoiceNumber(DATA.lots) : sale.invoice
    const previewDate = createMode ? DATA.asOf : sale.date
    const previewDue = createMode
      ? (() => {
          const d = new Date(`${DATA.asOf}T12:00:00.000Z`)
          d.setUTCDate(d.getUTCDate() + terms)
          return d.toISOString().slice(0, 10)
        })()
      : sale.due
    const ageDays = createMode ? 0 : daysBetween(sale.date, DATA.asOf)
    const statusLine = createMode
      ? 'Goes into QuickBooks as an invoice'
      : `In QuickBooks as invoice ${sale.invoice}, open`
    return (
      <div className="ce-invoice-overlay" role="presentation" onClick={pop}>
        <div
          className="ce-invoice-panel"
          role="dialog"
          aria-labelledby="ce-inv-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="ce-inv-title">{createMode ? 'New invoice' : 'Invoice'}</h3>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <div><span style={{ color: MUTED }}>Buyer</span><br />{sale.buyer}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Invoice</span><br />{previewInv}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Date</span><br />{fmtD(previewDate)}</div>
            {!createMode ? (
              <div style={{ marginTop: 10 }}>
                <span style={{ color: MUTED }}>Days outstanding</span><br />{ageDays}
              </div>
            ) : null}
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Due</span><br />{fmtD(previewDue)}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Lot</span><br />{lot.id} · {lot.desc}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Cases</span><br />{fmtInt(sale.cases)}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Price per case</span><br />{money(sale.price)}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Total</span><br />{money(sale.amount)}</div>
            <div style={{ marginTop: 10 }}><span style={{ color: MUTED }}>Terms</span><br />Net {terms}</div>
          </div>
          <p className="ce-status-line">{statusLine}</p>
          <button type="button" className="ce-btn-secondary" onClick={pop}>
            Close
          </button>
        </div>
      </div>
    )
  }

  const BuyerDetail = ({ name }) => {
    const terms = dash.buyerTerms[name] || 30
    const buyerType = buyerTypes[name]
    const openInv = dash.openSales
      .filter((s) => s.buyer === name)
      .sort((a, b) => a.date.localeCompare(b.date) || a.invoice.localeCompare(b.invoice))
    const balance = openInv.reduce((sum, s) => sum + s.amount, 0)
    const paidFall = [...dash.paidFallByBuyer(name)].sort(
      (a, b) => a.date.localeCompare(b.date) || a.invoice.localeCompare(b.invoice),
    )
    return (
      <div className="ce-detail">
        <DetailBack />
        <div style={{ ...lbl, color: SPICE }}>Buyer</div>
        <h2 style={{ ...big, fontSize: '20px', marginTop: 4, marginBottom: 4 }}>{name}</h2>
        {buyerType ? (
          <div style={{ fontSize: 12, fontWeight: 400, color: MUTED, marginBottom: 8 }}>{buyerType}</div>
        ) : null}
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Terms · Net {terms}</div>
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={lbl}>Balance owed</div>
          <div style={{ ...big, fontSize: 28, marginTop: 4 }}>{money(balance)}</div>
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Open invoices</div>
        <div className="ce-stack-only" style={{ marginBottom: 24 }}>
          {openInv.map((s) => (
            <button key={s.invoice} type="button" className="ce-stack-row ce-click" onClick={() => openSale(s.lotId, s.invoice)}>
              <div className="ce-stack-title">{fmtD(s.date)}</div>
              <div className="ce-stack-sub">{s.invoice} · {s.lotId}</div>
              <div className="ce-stack-grid ce-stack-grid-3">
                <StackKV k="Cases" v={fmtInt(s.cases)} />
                <StackKV k="Amount" v={money(s.amount)} />
                <StackKV k="Age" v={`${s.ageDays}d`} />
              </div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Due {fmtD(s.due)}
                {s.pastDue ? <span style={{ color: RED, marginLeft: 6 }}>Past due</span> : null}
              </div>
            </button>
          ))}
        </div>
        <div className="ce-table-wrap" style={{ marginBottom: 24 }}>
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
                <tr key={s.invoice} className="ce-rowbtn" onClick={() => openSale(s.lotId, s.invoice)}>
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
        <div className="ce-stack-only">
          {paidFall.map((s) => (
            <button key={s.invoice} type="button" className="ce-stack-row ce-click" onClick={() => openSale(s.lotId, s.invoice)}>
              <div className="ce-stack-title">{fmtD(s.date)}</div>
              <div className="ce-stack-sub">{s.invoice} · {s.lotId}</div>
              <div className="ce-stack-grid ce-stack-grid-2">
                <StackKV k="Amount" v={money(s.amount)} />
                <StackKV k="Paid" v={fmtD(s.paid)} />
              </div>
            </button>
          ))}
        </div>
        <div className="ce-table-wrap">
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
        <div className="ce-stack-only">
          {rows.map((s) => (
            <button key={s.invoice} type="button" className="ce-stack-row ce-click" onClick={() => openSale(s.lotId, s.invoice)}>
              <div className="ce-stack-title">{fmtD(s.date)}</div>
              <div className="ce-stack-sub">{s.invoice} · {s.lotId}</div>
              <div style={{ marginTop: 4 }}>
                <BuyerLabel name={s.buyer} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 8 }}>
                {mode === 'sales' ? money(s.amount) : money(s.cost)}
              </div>
            </button>
          ))}
          <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
            <div className="ce-stack-title">Total</div>
            <div style={{ fontFamily: MONO, fontSize: 13, marginTop: 6 }}>{money(total)}</div>
          </div>
        </div>
        <div className="ce-table-wrap">
          <table className="ce-table ce-compact">
            <thead>
              <tr>
                <th className="ce-th-left">Date</th>
                <th className="ce-th-left">Invoice</th>
                <th className="ce-th-left">Lot</th>
                <th className="ce-th-left">Buyer</th>
                <th>{mode === 'sales' ? 'Amount' : 'Cost'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.invoice} className="ce-rowbtn" onClick={() => openLot(s.lotId)}>
                  <td className="ce-td-left">{fmtD(s.date)}</td>
                  <td className="ce-td-left">{s.invoice}</td>
                  <td className="ce-td-left">{s.lotId}</td>
                  <td className="ce-td-left">
                    <BuyerLabel name={s.buyer} />
                  </td>
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

  const OverviewLinesDetail = ({ title, sub, rows, total, format = money }) => (
    <div className="ce-detail">
      <DetailBack />
      <div style={{ ...lbl }}>{sub}</div>
      <h2 style={{ ...big, fontSize: 22, margin: '8px 0 16px' }}>{format(total)}</h2>
      <div style={{ ...card }}>
        {rows.map((r, i) => (
          <div key={r.key || r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
            <span style={{ fontSize: 13, color: MUTED }}>{r.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 13 }}>{format(r.value)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700 }}>
          <span style={{ fontSize: 13 }}>Total</span>
          <span style={{ fontFamily: MONO, fontSize: 13 }}>{format(total)}</span>
        </div>
      </div>
    </div>
  )

  const OverviewNetDetail = () => {
    const { thisP } = dash
    const rows = [
      { label: 'Sales', value: thisP.sales },
      { label: 'Cost of goods sold', value: -thisP.cogs },
      ...thisP.expenseLines.map((e) => ({ label: e.name, value: -e.amount, key: e.name })),
    ]
    return (
      <OverviewLinesDetail
        title={`Net profit ${dash.pnlLabels.this}`}
        sub="Profit & loss"
        rows={rows}
        total={thisP.netProfit}
      />
    )
  }

  const OverviewCashDetail = () => {
    const rows = cashSorted.map((row) => ({ label: `${row.lot.id} · ${row.lot.desc}`, value: row.cashTied, key: row.lot.id }))
    return <OverviewLinesDetail title="Cash tied up in stock" sub="Open lots" rows={rows} total={dash.cashTiedTotal} />
  }

  const OverviewCasesDetail = () => {
    const rows = cashSorted.map((row) => ({ label: `${row.lot.id} · ${row.lot.desc}`, value: row.casesLeft, key: row.lot.id }))
    return <OverviewLinesDetail title="Cases in warehouse" sub="Open lots" rows={rows} total={dash.casesInWarehouse} format={(v) => fmtInt(v)} />
  }

  const OverviewOpenLotsDetail = () => {
    const rows = dash.openLots.map((row) => ({ label: `${row.lot.id} · ${row.lot.desc}`, value: 1, key: row.lot.id }))
    return <OverviewLinesDetail title="Open lots" sub="Inventory" rows={rows} total={dash.openLots.length} format={(v) => fmtInt(v)} />
  }

  const OverviewBuyersDetail = () => {
    const rows = dash.buyerRows.map((b) => ({ label: b.name, value: b.total, key: b.name }))
    return <OverviewLinesDetail title="Buyers owe" sub="Open invoices" rows={rows} total={dash.buyersOwe} />
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

    const pnlThisColor = (r) => (r.key === 'net' && r.this < 0 ? RED : INK)

    return (
      <>
        <div className="ce-stack-only" style={card}>
          {rows.map((r) => {
            const delta = r.this - r.prior
            const fmt = (v) => (r.pct ? pct1(v) : money(v))
            const onDrill = () => {
              if (r.drill) push(r.drill)
              else if (r.expense) push({ type: 'expense', name: r.expense })
            }
            const clickable = r.drill || r.expense
            return (
              <div
                key={r.key}
                className={`ce-pnl-stack-row${clickable ? ' ce-click' : ''}`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? onDrill : undefined}
                onKeyDown={clickable ? (e) => e.key === 'Enter' && onDrill() : undefined}
              >
                <div className="ce-pnl-stack-label">
                  {r.label}
                </div>
                <div className="ce-pnl-stack-cols">
                  <div>
                    <div className="k">{pnlLabels.this}</div>
                    <div className="v" style={{ color: pnlThisColor(r) }}>{fmt(r.this)}</div>
                  </div>
                  <div>
                    <div className="k">{pnlLabels.prior}</div>
                    <div className="v" style={{ color: MUTED }}>{fmt(r.prior)}</div>
                  </div>
                  <div>
                    <div className="k">Change</div>
                    <div className="v" style={{ color: deltaColor(delta, r.cost && !r.pct) }}>
                      {r.pct ? `${delta >= 0 ? '+' : ''}${pct1(delta)}` : money(delta)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="ce-table-wrap" style={card}>
        <table className="ce-table">
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
                  </td>
                  <td style={{ color: pnlThisColor(r) }}>{fmt(r.this)}</td>
                  <td style={{ color: MUTED }}>{fmt(r.prior)}</td>
                  <td style={{ color: deltaColor(delta, r.cost && !r.pct) }}>{r.pct ? `${delta >= 0 ? '+' : ''}${pct1(delta)}` : money(delta)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </>
    )
  }

  const renderSection = () => {
    if (topFrame?.type === 'invoicePreview') {
      const prev = stack[stack.length - 2]
      return (
        <>
          {prev?.type === 'sale' ? (
            <SaleDetail lotId={prev.lotId} saleKey={prev.saleKey} />
          ) : null}
          <InvoicePreview
            lotId={topFrame.lotId}
            saleKey={topFrame.saleKey}
            mode={topFrame.mode}
          />
        </>
      )
    }
    if (topFrame?.type === 'sale') {
      return <SaleDetail lotId={topFrame.lotId} saleKey={topFrame.saleKey} />
    }
    if (topFrame?.type === 'lot') return <LotDetail id={topFrame.id} />
    if (topFrame?.type === 'buyer') return <BuyerDetail name={topFrame.name} />
    if (topFrame?.type === 'pnlSales') return <PnlSalesDrill which={topFrame.which} mode={topFrame.mode} />
    if (topFrame?.type === 'expense') return <ExpenseDrill name={topFrame.name} />
    if (topFrame?.type === 'overviewNet') return <OverviewNetDetail />
    if (topFrame?.type === 'overviewCash') return <OverviewCashDetail />
    if (topFrame?.type === 'overviewCases') return <OverviewCasesDetail />
    if (topFrame?.type === 'overviewOpenLots') return <OverviewOpenLotsDetail />
    if (topFrame?.type === 'overviewBuyers') return <OverviewBuyersDetail />

    if (tab === 'overview') {
      const openList = [...dash.openLots].sort((a, b) => b.cashTied - a.cashTied).slice(0, 6)
      return (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <KPI
              k={`Sales ${dash.pnlLabels.this}`}
              v={money0(dash.thisP.sales)}
              sub={salesSub}
              valueColor={salesDeltaColor}
              onClick={() => push({ type: 'pnlSales', which: 'this', mode: 'sales' })}
            />
            <KPI
              k={`Net profit ${dash.pnlLabels.this}`}
              v={money0(dash.thisP.netProfit)}
              valueColor={dash.thisP.netProfit >= 0 ? GREEN : RED}
              onClick={() => push({ type: 'overviewNet' })}
            />
            <KPI k="Cash tied up in stock" v={money0(dash.cashTiedTotal)} onClick={() => push({ type: 'overviewCash' })} />
            <KPI k="Buyers owe" v={money0(dash.buyersOwe)} onClick={() => push({ type: 'overviewBuyers' })} />
            <KPI k="Open lots" v={fmtInt(dash.openLots.length)} onClick={() => push({ type: 'overviewOpenLots' })} />
            <KPI k="Cases in warehouse" v={fmtInt(dash.casesInWarehouse)} onClick={() => push({ type: 'overviewCases' })} />
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
                  onClick={() => openBuyer(b.name)}
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
                  <span style={{ paddingRight: 8, minWidth: 0, flex: 1 }}>
                    <BuyerLabel name={b.name} />
                  </span>
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
          <div className="ce-stack-only">
            {filteredLots.map((row) => (
              <button
                key={row.lot.id}
                type="button"
                className="ce-stack-row ce-click"
                onClick={() => openLot(row.lot.id)}
              >
                <div className="ce-stack-title">
                  <strong>{row.lot.id}</strong> {row.lot.desc}
                </div>
                <div className="ce-stack-grid ce-stack-grid-3">
                  <StackKV k="Landed" v={money(row.landed)} />
                  <StackKV k="Sold" v={fmtInt(row.casesSold)} />
                  <StackKV k="Left" v={fmtInt(row.casesLeft)} />
                </div>
                <div className="ce-stack-grid ce-stack-grid-2">
                  <StackKV k="Revenue" v={money(row.revenue)} />
                  <StackKV k="Profit" v={money(row.profit)} vColor={moneyColor(row.profit)} />
                </div>
              </button>
            ))}
            <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
              <div className="ce-stack-title">Total</div>
              <div className="ce-stack-grid ce-stack-grid-3">
                <StackKV k="Landed" v={money(lotGroupTotals.landed)} />
                <StackKV k="Sold" v={fmtInt(lotGroupTotals.casesSold)} />
                <StackKV k="Left" v={fmtInt(lotGroupTotals.casesLeft)} />
              </div>
              <div className="ce-stack-grid ce-stack-grid-2">
                <StackKV k="Revenue" v={money(lotGroupTotals.revenue)} />
                <StackKV k="Profit" v={money(lotGroupTotals.profit)} vColor={moneyColor(lotGroupTotals.profit)} />
              </div>
            </div>
          </div>
          <div className="ce-table-wrap">
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

    if (tab === 'profit') {
      return (
        <CloseoutExplosionProfitTab
          rows={profitLotRows}
          onOpenLot={openLot}
          StackKV={StackKV}
        />
      )
    }

    if (tab === 'cash') {
      return (
        <>
          <div className="ce-stack-only">
            {cashSorted.map((row) => (
              <button
                key={row.lot.id}
                type="button"
                className="ce-stack-row ce-click"
                onClick={() => openLot(row.lot.id)}
              >
                <div className="ce-stack-title">
                  <strong>{row.lot.id}</strong> {row.lot.desc}
                </div>
                <div className="ce-stack-grid ce-stack-grid-2">
                  <StackKV k="Left" v={fmtInt(row.casesLeft)} />
                  <StackKV k="Cost / case" v={money(row.landedPerCase)} />
                  <StackKV k="Cash tied up" v={money(row.cashTied)} />
                  <StackKV k="Days" v={String(row.daysSinceBought)} />
                </div>
              </button>
            ))}
            <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
              <div className="ce-stack-title">Total</div>
              <div className="ce-stack-grid ce-stack-grid-2">
                <StackKV k="Left" v={fmtInt(dash.casesInWarehouse)} />
                <StackKV k="Cash tied up" v={money(dash.cashTiedTotal)} />
              </div>
            </div>
          </div>
          <div className="ce-table-wrap">
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
        </>
      )
    }

    if (tab === 'buyers') {
      return (
        <>
          <div className="ce-stack-only">
            {dash.buyerRows.map((b) => (
              <button
                key={b.name}
                type="button"
                className="ce-stack-row ce-click"
                onClick={() => openBuyer(b.name)}
              >
                <div className="ce-stack-head">
                  <span className="ce-stack-title" style={{ minWidth: 0, flex: 1 }}>
                    <BuyerLabel name={b.name} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, flexShrink: 0 }}>{money(b.total)}</span>
                </div>
                <div className="ce-stack-grid ce-stack-grid-4">
                  <StackKV k="0–15" v={money(b.bucket015)} />
                  <StackKV k="16–30" v={money(b.bucket1630)} />
                  <StackKV k="Over 30" v={money(b.bucketOver30)} />
                  <StackKV k="Invoices" v={String(b.count)} />
                </div>
              </button>
            ))}
            <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
              <div className="ce-stack-head">
                <span className="ce-stack-title">Total</span>
                <span style={{ fontFamily: MONO, fontSize: 12 }}>{money(dash.bucketTotals.total)}</span>
              </div>
              <div className="ce-stack-grid ce-stack-grid-4">
                <StackKV k="0–15" v={money(dash.bucketTotals.bucket015)} />
                <StackKV k="16–30" v={money(dash.bucketTotals.bucket1630)} />
                <StackKV k="Over 30" v={money(dash.bucketTotals.bucketOver30)} />
                <StackKV k="Invoices" v={String(dash.bucketTotals.count)} />
              </div>
            </div>
          </div>
          <div className="ce-table-wrap">
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
                  <td className="ce-td-left">
                    <BuyerLabel name={b.name} />
                  </td>
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
        </>
      )
    }

    if (tab === 'pnl') return <PnlTable />
    return null
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <CloseoutExplosionLobby />
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
        </aside>
        <main className="ce-main">
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...lbl, color: SPICE }}>{BIZ}</div>
            <h1 style={{ ...big, fontSize: 28, color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: 4 }}>{currentLabel}</h1>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{sampleHeader}</div>
          </div>
          {renderSection()}
        </main>
      </div>
    </>
  )
}
