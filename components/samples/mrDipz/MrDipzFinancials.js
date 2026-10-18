import { useState } from 'react'
import {
  SPICE,
  INK,
  MUTED,
  BORDER,
  GREEN,
  RED,
  UI,
  money,
  PNL_SHEET_CSS,
  CHAR,
  CREAM,
  CARDBG,
} from './mrDipzUtils'

export default function MrDipzFinancials({ model, card, lbl }) {
  const { pnlSep, pnlAug } = model
  const cur = pnlSep
  const prev = pnlAug
  const [expand, setExpand] = useState({ opex: true })

  if (!cur) return null

  const portalStyles = PNL_SHEET_CSS({ CHAR, CREAM, INK, SPICE, CARDBG })

  const PnlLine = ({ label, amount, priorAmount, indent, bold, subtotal, cost }) => {
    const prior = priorAmount
    const delta = prior != null ? amount - prior : null
    const show = cost ? -amount : amount
    const showPrior = prior != null ? (cost ? -prior : prior) : null
    const changeColor =
      delta == null
        ? MUTED
        : delta > 0
          ? cost
            ? RED
            : GREEN
          : delta < 0
            ? cost
              ? GREEN
              : RED
            : MUTED
    const lineClass = [
      'md-pnl-line',
      indent ? 'md-pnl-line--indent' : '',
      subtotal || bold ? 'md-pnl-line--sub' : '',
      !prev ? 'md-pnl-line--solo' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <div className={lineClass}>
        <span className="md-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>{label}</span>
        <span className="md-pnl-num md-pnl-num--cur" style={{ fontWeight: bold ? 700 : 400, color: cost ? RED : INK }}>
          {money(show)}
        </span>
        {prev ? <span className="md-pnl-num" style={{ color: MUTED }}>{money(showPrior)}</span> : null}
        {prev ? (
          <span className="md-pnl-num" style={{ color: changeColor }}>
            {delta != null ? money(delta) : '—'}
          </span>
        ) : null}
      </div>
    )
  }

  const opexEntries = Object.entries(cur.operatingExpenses || {})

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 8 }}>P&amp;L — {cur.period}</div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Accrual sample · compares September to August</p>
        <div className="md-pnl-wrap">
          <div className="md-pnl-head">
            <span className="md-pnl-label" />
            <span className="md-pnl-num">This month</span>
            <span className="md-pnl-num">Prior mo.</span>
            <span className="md-pnl-num">Change</span>
          </div>
          <PnlLine label="Gross sales" amount={cur.grossSales} priorAmount={prev?.grossSales} bold />
          <PnlLine label="Credits & returns" amount={cur.credits} priorAmount={prev?.credits} indent cost />
          <PnlLine label="Net sales" amount={cur.netSales} priorAmount={prev?.netSales} subtotal bold />
          <PnlLine label="Cost of goods sold" amount={cur.cogs} priorAmount={prev?.cogs} cost />
          <PnlLine label="Gross profit" amount={cur.grossProfit} priorAmount={prev?.grossProfit} subtotal bold />
          <button
            type="button"
            onClick={() => setExpand((e) => ({ ...e, opex: !e.opex }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              border: 'none',
              background: 'transparent',
              padding: '10px 6px',
              cursor: 'pointer',
              fontFamily: UI,
              fontSize: 13,
              fontWeight: 700,
              color: INK,
            }}
          >
            <span style={{ color: SPICE, fontSize: 10 }}>{expand.opex ? '▼' : '▶'}</span>
            Operating expenses
          </button>
          {expand.opex
            ? opexEntries.map(([label, amt]) => {
                const prevAmt = prev?.operatingExpenses?.[label]
                return (
                  <PnlLine key={label} label={label} amount={amt} priorAmount={prevAmt} indent cost />
                )
              })
            : null}
          <PnlLine
            label="Total operating expenses"
            amount={cur.operatingExpensesTotal}
            priorAmount={prev?.operatingExpensesTotal}
            cost
            subtotal
          />
          <PnlLine label="Net profit" amount={cur.netProfit} priorAmount={prev?.netProfit} bold subtotal />
        </div>
      </div>
    </>
  )
}
