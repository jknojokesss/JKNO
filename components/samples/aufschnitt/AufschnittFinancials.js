import { useState } from 'react'
import DATA from './aufschnittData'
import {
  SPICE,
  INK,
  MUTED,
  BORDER,
  GREEN,
  UI,
  MONO,
  money,
  money0,
  PNL_SHEET_CSS,
} from './aufschnittUtils'

export default function AufschnittFinancials({ card, lbl, big, inp, KPI, brand, onDrill }) {
  const months = DATA.pnlViews[brand] || []
  const [pnlMonthIdx, setPnlMonthIdx] = useState(months.length - 1)
  const [pnlExpand, setPnlExpand] = useState({ revenue: true, cogs: true, opex: true })

  const cur = months[pnlMonthIdx]
  const prev = pnlMonthIdx > 0 ? months[pnlMonthIdx - 1] : null

  const openDrill = (title, ledgerKey, total, kind) => {
    const rows = cur?.drill_ledgers?.[ledgerKey] || []
    const brandRows = kind === 'cost' ? cur?.drill_ledgers?.[`${ledgerKey}_brands`] : null
    onDrill({ type: 'pnl', title, rows, brandRows, total, period: cur?.period })
  }

  const PnlLine = ({ label, amount, priorAmount, ledgerKey, indent, bold, subtotal, cost, kind }) => {
    const drillable = ledgerKey && (cur?.drill_ledgers?.[ledgerKey]?.length || kind === 'cost')
    const prior = priorAmount
    const delta = prior != null ? amount - prior : null
    const show = cost ? -amount : amount
    const showPrior = prior != null ? (cost ? -prior : prior) : null
    const changeColor =
      delta == null
        ? MUTED
        : delta > 0
          ? cost
            ? '#C03A22'
            : GREEN
          : delta < 0
            ? cost
              ? GREEN
              : '#C03A22'
            : MUTED
    const lineClass = [
      'au-pnl-line',
      indent ? 'au-pnl-line--indent' : '',
      subtotal || bold ? 'au-pnl-line--sub' : '',
      !prev ? 'au-pnl-line--solo' : '',
      drillable ? 'au-click' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <div
        role={drillable ? 'button' : undefined}
        tabIndex={drillable ? 0 : undefined}
        className={lineClass}
        onClick={drillable ? () => openDrill(label, ledgerKey, amount, kind || (cost ? 'cost' : 'rev')) : undefined}
        onKeyDown={drillable ? (e) => e.key === 'Enter' && openDrill(label, ledgerKey, amount, kind || (cost ? 'cost' : 'rev')) : undefined}
        style={{ cursor: drillable ? 'pointer' : 'default' }}
      >
        <span className="au-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
          {label}
          {drillable ? <span style={{ color: '#C9BBA0', fontSize: 11 }}> ›</span> : null}
        </span>
        <span className="au-pnl-num au-pnl-num--cur" style={{ fontWeight: bold ? 700 : 400, color: cost ? '#C03A22' : INK }}>
          {money(show)}
        </span>
        {prev ? <span className="au-pnl-num" style={{ color: MUTED }}>{money(showPrior)}</span> : null}
        {prev ? (
          <span className="au-pnl-num" style={{ color: changeColor }}>
            {delta != null ? money(delta) : '—'}
          </span>
        ) : null}
      </div>
    )
  }

  const CatHeader = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setPnlExpand((e) => ({ ...e, [id]: !e[id] }))}
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
        textAlign: 'left',
      }}
    >
      <span style={{ color: SPICE, fontSize: 10 }}>{pnlExpand[id] ? '▼' : '▶'}</span>
      {label}
    </button>
  )

  if (!cur) return null

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={lbl}>Month</span>
        <select
          value={pnlMonthIdx}
          onChange={(e) => setPnlMonthIdx(Number(e.target.value))}
          style={{ ...inp, cursor: 'pointer', minHeight: 40, borderRadius: 2 }}
        >
          {months.map((m, i) => (
            <option key={m.month} value={i}>
              {m.label} — {m.period}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <KPI k="Revenue" v={money(cur.revenue_total)} accent={GREEN} />
        <KPI k="Gross profit" v={money(cur.gross_profit)} />
        <KPI k="Net profit" v={money(cur.net_profit)} accent={SPICE} />
      </div>

      <div className="au-pnl-wrap" style={{ ...card }}>
        <style>{PNL_SHEET_CSS}</style>
        <div style={{ ...lbl, marginBottom: 8 }}>Profit &amp; loss · {cur.period}</div>
        {prev && (
          <div className="au-pnl-head">
            <span />
            <span className="au-pnl-num">This month</span>
            <span className="au-pnl-num">Prior mo.</span>
            <span className="au-pnl-num">Change</span>
          </div>
        )}

        <CatHeader id="revenue" label="Revenue" />
        {pnlExpand.revenue &&
          Object.entries(cur.revenue).map(([ch, v]) => (
            <PnlLine key={ch} label={ch} amount={v} priorAmount={prev?.revenue?.[ch]} ledgerKey={`rev_${ch}`} indent kind="rev" />
          ))}
        <PnlLine label="Total revenue" amount={cur.revenue_total} priorAmount={prev?.revenue_total} bold subtotal />

        <CatHeader id="cogs" label="Cost of goods" />
        {pnlExpand.cogs &&
          cur.cogs_entries.map((e) => {
            const pe = prev?.cogs_entries?.find((x) => x.l === e.l)
            return (
              <PnlLine
                key={e.l}
                label={e.l}
                amount={e.n}
                priorAmount={pe?.n}
                ledgerKey={`cogs_${e.l}`}
                indent
                cost
                kind="cost"
              />
            )
          })}
        <PnlLine label="Total cost of goods" amount={cur.cogs} priorAmount={prev?.cogs} bold subtotal cost />

        <PnlLine label="Gross profit" amount={cur.gross_profit} priorAmount={prev?.gross_profit} bold subtotal />

        <CatHeader id="opex" label="Operating expenses" />
        {pnlExpand.opex &&
          cur.operating_expenses_entries.map((e) => {
            const pe = prev?.operating_expenses_entries?.find((x) => x.l === e.l)
            return (
              <PnlLine
                key={e.l}
                label={e.l}
                amount={e.n}
                priorAmount={pe?.n}
                ledgerKey={`opex_${e.l}`}
                indent
                cost
                kind="cost"
              />
            )
          })}
        <PnlLine
          label="Total operating expenses"
          amount={cur.operating_expenses_total}
          priorAmount={prev?.operating_expenses_total}
          bold
          subtotal
          cost
        />

        <PnlLine label="Net profit" amount={cur.net_profit} priorAmount={prev?.net_profit} bold subtotal />
      </div>
    </>
  )
}
