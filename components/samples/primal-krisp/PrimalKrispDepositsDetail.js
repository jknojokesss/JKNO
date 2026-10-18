import DATA from '../../../data/primal-krisp.json'
import {
  payoutTotals,
  enrichPayouts,
  payoutAdjustmentRows,
  notMatchedItems,
  buildDepositedMonthBridge,
} from './primalKrispDepositsData'
import { BORDER, INK, MUTED, RED, UI, MONO, money, fmtD, fmtInt } from '../primalKrispUtils'

function Shell({ title, sub, onBack, onClose, children }) {
  const close = onClose || onBack
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button type="button" className="pk-click" onClick={onBack} style={{ border: `1px solid ${BORDER}`, background: 'transparent', padding: '8px 12px', fontFamily: UI, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back
        </button>
        <button type="button" className="pk-click" onClick={close} style={{ border: `1px solid ${BORDER}`, background: 'transparent', padding: '8px 12px', fontFamily: UI, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Close
        </button>
      </div>
      <div style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: MUTED }}>{sub}</div>
      <h2 style={{ fontFamily: UI, fontWeight: 700, fontSize: 22, color: INK, margin: '4px 0 16px' }}>{title}</h2>
      {children}
    </>
  )
}

function Lines({ rows, totalLabel, totalValue, format = money }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 14px' }}>
      {rows.map((r, i) => (
        <div key={r.key || r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13 }}>
          <span style={{ color: INK }}>{r.label}</span>
          <span style={{ fontFamily: MONO }}>{format(r.value)}</span>
        </div>
      ))}
      {totalLabel != null ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 13 }}>
          <span>{totalLabel}</span>
          <span style={{ fontFamily: MONO }}>{format(totalValue)}</span>
        </div>
      ) : null}
    </div>
  )
}

function OrderBlock({ o }) {
  return (
    <div style={{ padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 600 }}>
        <span>{o.order}</span>
        <span style={{ fontFamily: MONO }}>{money(o.amount)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: MUTED, fontSize: 12, marginTop: 4 }}>
        <span>{fmtD(o.date)}</span>
        <span>{o.payment_method}</span>
      </div>
    </div>
  )
}

export default function PrimalKrispDepositsDetail({ detail, onBack, onClose }) {
  const { payouts, summary } = enrichPayouts(DATA.deposits)
  const shell = { onBack, onClose }

  if (detail.kind === 'tableTotal') {
    const format = detail.format || money
    return (
      <Shell title={`Total ${detail.tableName}`} sub={detail.tableName} {...shell}>
        <Lines rows={detail.rows} totalLabel="Total" totalValue={detail.total} format={format} />
      </Shell>
    )
  }

  if (detail.kind === 'depDeposited') {
    const bridge = buildDepositedMonthBridge(payouts)
    const bridgeRows = [
      { label: 'Gross sales', value: bridge.gross_sales, key: 'gross' },
      { label: 'Delivery guarantee', value: bridge.delivery_guarantee, key: 'dg' },
      { label: 'Fees', value: -bridge.fees, key: 'fees' },
      { label: 'Refunds', value: -bridge.refunds, key: 'refunds' },
      { label: 'Earlier refund and chargeback', value: -bridge.not_matched, key: 'nm' },
    ]
    const payoutRows = payouts.map((p) => ({ label: `${fmtD(p.date)} · ${p.source}`, value: payoutTotals(p).deposit, key: p.id }))
    return (
      <Shell title={money(summary.deposited_this_month)} sub="Deposited Oct 1-17" {...shell}>
        <Lines rows={bridgeRows} totalLabel="Deposited" totalValue={bridge.deposited} />
        <div style={{ marginTop: 20, fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>By payout</div>
        <Lines rows={payoutRows} />
      </Shell>
    )
  }

  if (detail.kind === 'depFees') {
    const rows = payouts.map((p) => ({ label: `${fmtD(p.date)} · ${p.source}`, value: payoutTotals(p).fees, key: p.id }))
    return (
      <Shell title={money(summary.fees)} sub="Fees" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={summary.fees} />
      </Shell>
    )
  }

  if (detail.kind === 'depOrdersMatched') {
    const rows = []
    payouts.filter((p) => p.matched).forEach((p) => {
      p.orders.forEach((o) => {
        rows.push({ label: `${o.order} · ${fmtD(o.date)}`, value: o.amount, key: `${p.id}-${o.order}` })
      })
    })
    const total = roundRows(rows)
    return (
      <Shell title={fmtInt(summary.orders_matched)} sub="Orders matched" {...shell}>
        <Lines rows={rows} totalLabel="Gross sales" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'depNotMatched') {
    const items = notMatchedItems(payouts).filter(
      (x) => x.adjustment.type === 'earlier_refund' || x.adjustment.type === 'chargeback',
    )
    const rows = items.map((x) => ({
      label: x.adjustment.label,
      value: x.adjustment.amount,
      key: `${x.payout.id}-${x.adjustment.order}`,
    }))
    const nm = summary.not_matched
    return (
      <Shell title={`${fmtInt(nm.order_count)} · ${money(-nm.dollars)}`} sub="Not matched" {...shell}>
        <Lines rows={rows} totalLabel="Difference" totalValue={nm.dollars} />
      </Shell>
    )
  }

  if (detail.kind === 'depPayout') {
    const p = payouts.find((x) => x.id === detail.id)
    if (!p) return null
    const t = payoutTotals(p)
    const lineRows = [
      { label: 'Gross sales', value: t.gross_sales },
      { label: 'Delivery guarantee', value: t.delivery_guarantee },
      { label: 'Fees', value: -t.fees },
      ...(t.refunds ? [{ label: 'Refunds', value: -t.refunds }] : []),
      ...payoutAdjustmentRows(p).map((a) => ({ label: a.label, value: -a.amount, key: a.order })),
    ]
    return (
      <Shell title={money(t.deposit)} sub={`${fmtD(p.date)} · ${p.source}`} {...shell}>
        <div style={{ marginBottom: 12, fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Orders</div>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '0 14px', marginBottom: 16 }}>
          {p.orders.map((o) => <OrderBlock key={o.order} o={o} />)}
        </div>
        <Lines rows={lineRows} totalLabel="Deposit" totalValue={t.deposit} />
      </Shell>
    )
  }

  return null
}

function roundRows(rows) {
  return Math.round(rows.reduce((s, r) => s + r.value, 0) * 100) / 100
}
