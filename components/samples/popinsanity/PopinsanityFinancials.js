import { useState } from 'react'
import { DATA, pnlComputed } from './popinsanityComputed'
import {
  SPICE,
  MUTED,
  INK,
  BORDER,
  UI,
  MONO,
  money,
  pct1,
  changeColor,
} from './popinsanityUtils'

const PNL_SHEET_CSS = `
.pop-pnl-wrap{
  --pop-pnl-c1:5.5rem;--pop-pnl-c2:5.5rem;--pop-pnl-c3:5.5rem;--pop-pnl-gap:6px;
  --pop-pnl-fs:12px;--pop-pnl-fs-cur:13px;--pop-pnl-fs-head:10px;
}
@media(max-width:480px){
  .pop-pnl-wrap{
    --pop-pnl-c1:4.25rem;--pop-pnl-c2:4.25rem;--pop-pnl-c3:4.75rem;--pop-pnl-gap:6px;
    --pop-pnl-fs:10px;--pop-pnl-fs-cur:10px;--pop-pnl-fs-head:9px;
    padding:12px 8px!important;
  }
  .pop-pnl-label{font-size:12px}
  .pop-pnl-head,.pop-pnl-line{padding-right:0}
  .pop-pnl-line .pop-pnl-num:last-child{font-size:9px}
}
.pop-pnl-wrap{max-width:100%;box-sizing:border-box}
.pop-pnl-head,.pop-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--pop-pnl-c1) var(--pop-pnl-c2) var(--pop-pnl-c3);
  column-gap:var(--pop-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.pop-pnl-head{padding:0 6px 8px;font-size:var(--pop-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.pop-pnl-line{padding:8px 6px;border-radius:2px}
.pop-pnl-line--indent .pop-pnl-label{padding-left:20px}
.pop-pnl-line--sub{border-top:1px solid ${BORDER}}
.pop-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.pop-pnl-num{
  font-family:${MONO};font-size:var(--pop-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;
  font-variant-numeric:tabular-nums;
}
.pop-pnl-num--cur{font-size:var(--pop-pnl-fs-cur)}
.pop-pnl-head .pop-pnl-num{font-size:var(--pop-pnl-fs-head);font-family:${UI};font-weight:600;overflow:visible}
`

function PnlLine({ label, thisVal, priorVal, cost, bold, indent, onClick }) {
  const delta = priorVal != null ? thisVal - priorVal : null
  const color = changeColor(delta, { cost })
  const clickable = !!onClick
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={['pop-pnl-line', indent ? 'pop-pnl-line--indent' : '', bold ? 'pop-pnl-line--sub' : '', clickable ? 'pop-click' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <span className="pop-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
        {label}
        {clickable ? <span style={{ color: '#C9BBA0', fontSize: 11 }}> ›</span> : null}
      </span>
      <span className="pop-pnl-num pop-pnl-num--cur" style={{ fontWeight: bold ? 700 : 400, color: cost && !bold ? INK : INK }}>
        {money(thisVal)}
      </span>
      <span className="pop-pnl-num" style={{ color: MUTED }}>{money(priorVal)}</span>
      <span className="pop-pnl-num" style={{ color }}>
        {delta != null ? money(delta) : '—'}
      </span>
    </div>
  )
}

export default function PopinsanityFinancials({ styles, openPnlLine }) {
  const { card, lbl } = styles
  const p = pnlComputed()
  const [exp, setExp] = useState({ revenue: true, cogs: true, opex: true })

  const CatHeader = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setExp((e) => ({ ...e, [id]: !e[id] }))}
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
      <span style={{ color: SPICE, fontSize: 10 }}>{exp[id] ? '▼' : '▶'}</span>
      {label}
    </button>
  )

  return (
    <div className="pop-pnl-wrap" style={{ ...card }}>
      <style>{PNL_SHEET_CSS}</style>
      <div style={{ ...lbl, marginBottom: 8 }}>Profit &amp; loss · {DATA.meta.this_month}</div>
      <div className="pop-pnl-head">
        <span />
        <span className="pop-pnl-num">This month</span>
        <span className="pop-pnl-num">Prior mo.</span>
        <span className="pop-pnl-num">Change</span>
      </div>

      <CatHeader id="revenue" label="Revenue" />
      {exp.revenue &&
        DATA.pnl.revenue.map((ln) => (
          <PnlLine
            key={ln.label}
            label={ln.label}
            thisVal={ln.this}
            priorVal={ln.prior}
            indent
            onClick={() => openPnlLine({ ...ln, section: 'revenue' })}
          />
        ))}
      <PnlLine
        label="Total revenue"
        thisVal={p.revTotal}
        priorVal={p.revPrior}
        bold
        onClick={() => openPnlLine({ label: 'Total revenue', this: p.revTotal, prior: p.revPrior, section: 'revenue' })}
      />

      <CatHeader id="cogs" label="Cost of goods sold" />
      {exp.cogs &&
        DATA.pnl.cogs.map((ln) => (
          <PnlLine
            key={ln.label}
            label={ln.label}
            thisVal={ln.this}
            priorVal={ln.prior}
            cost
            indent
            onClick={() => openPnlLine({ ...ln, section: 'cogs' })}
          />
        ))}
      <PnlLine
        label="Total COGS"
        thisVal={p.cogsTotal}
        priorVal={p.cogsPrior}
        cost
        bold
        onClick={() => openPnlLine({ label: 'Total COGS', this: p.cogsTotal, prior: p.cogsPrior, section: 'cogs' })}
      />

      <PnlLine
        label={`Gross profit (${pct1(p.grossMarginPct)} margin)`}
        thisVal={p.gross}
        priorVal={p.grossPrior}
        bold
        onClick={() => openPnlLine({ label: 'Gross profit', this: p.gross, prior: p.grossPrior, section: 'gross' })}
      />

      <CatHeader id="opex" label="Operating expenses" />
      {exp.opex &&
        DATA.pnl.opex.map((ln) => (
          <PnlLine
            key={ln.label}
            label={ln.label}
            thisVal={ln.this}
            priorVal={ln.prior}
            cost
            indent
            onClick={() => openPnlLine({ ...ln, section: 'opex' })}
          />
        ))}
      <PnlLine
        label="Total operating expenses"
        thisVal={p.opexTotal}
        priorVal={p.opexPrior}
        cost
        bold
        onClick={() => openPnlLine({ label: 'Total operating expenses', this: p.opexTotal, prior: p.opexPrior, section: 'opex' })}
      />

      <PnlLine
        label="Net profit"
        thisVal={p.net}
        priorVal={p.netPrior}
        bold
        onClick={() => openPnlLine({ label: 'Net profit', this: p.net, prior: p.netPrior, section: 'net' })}
      />
    </div>
  )
}
