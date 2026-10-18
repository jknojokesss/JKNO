import { useState } from 'react'
import { SPICE, INK, MUTED, BORDER, GREEN, RED, UI, money, PNL_SHEET_CSS } from './mrDipzUtils'

const CUR = '2026-09'
const PREV = '2026-08'

export default function MrDipzFinancials({ model, card, lbl, onPnlLineClick }) {
  const [opexOpen, setOpexOpen] = useState(true)
  const cur = model.pnlByMonth.find((m) => m.month === CUR)?.entries || {}
  const prev = model.pnlByMonth.find((m) => m.month === PREV)?.entries || {}

  const opexLines = model.pnlLines.filter((l) => l.parent === 'opex')

  const PnlLine = ({ lineId, indent, bold, cost }) => {
    const line = model.pnlLines.find((l) => l.id === lineId)
    if (!line) return null
    const amount = cur[lineId] ?? 0
    const priorAmount = prev[lineId]
    const delta = priorAmount != null ? amount - priorAmount : null
    const show = cost ? -amount : amount
    const showPrior = priorAmount != null ? (cost ? -priorAmount : priorAmount) : null
    const changeColor =
      delta == null ? MUTED : delta > 0 ? (cost ? RED : GREEN) : delta < 0 ? (cost ? GREEN : RED) : MUTED

    return (
      <div
        role="button"
        tabIndex={0}
        className={`md-pnl-line md-click${indent ? ' md-pnl-line--indent' : ''}${bold ? ' md-pnl-line--sub' : ''}`}
        onClick={() => onPnlLineClick(line, CUR, amount, prev[lineId])}
        onKeyDown={(e) => e.key === 'Enter' && onPnlLineClick(line, CUR, amount, prev[lineId])}
        style={{ cursor: 'pointer' }}
      >
        <span className="md-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
          {line.label}
          <span style={{ color: '#C9BBA0', fontSize: 11 }}> ›</span>
        </span>
        <span className="md-pnl-num md-pnl-num--cur" style={{ fontWeight: bold ? 700 : 400, color: cost ? RED : INK }}>{money(show)}</span>
        <span className="md-pnl-num" style={{ color: MUTED }}>{priorAmount != null ? money(showPrior) : '—'}</span>
        <span className="md-pnl-num" style={{ color: changeColor }}>{delta != null ? money(delta) : '—'}</span>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PNL_SHEET_CSS() }} />
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 12 }}>P&amp;L</div>
        <div className="md-pnl-wrap">
          <div className="md-pnl-head">
            <span className="md-pnl-label" />
            <span className="md-pnl-num">This month</span>
            <span className="md-pnl-num">Prior mo.</span>
            <span className="md-pnl-num">Change</span>
          </div>
          <PnlLine lineId="gross" bold />
          <PnlLine lineId="credits" indent cost />
          <PnlLine lineId="net_sales" bold />
          <PnlLine lineId="cogs" cost />
          <PnlLine lineId="gross_profit" bold />
          <button
            type="button"
            onClick={() => setOpexOpen((o) => !o)}
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
            <span style={{ color: SPICE, fontSize: 10 }}>{opexOpen ? '▼' : '▶'}</span>
            Operating expenses
          </button>
          {opexOpen ? opexLines.map((l) => <PnlLine key={l.id} lineId={l.id} indent cost />) : null}
          <PnlLine lineId="opex" cost bold />
          <PnlLine lineId="net_profit" bold />
        </div>
      </div>
    </>
  )
}
