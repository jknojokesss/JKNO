import { money, moneySigned, deltaColor, INK, MUTED, BORDER, UI, MONO } from './mrDipzUtils'
import { LabelWithChevron } from './MrDipzKit'

const PNL_CSS = `
.md-pnl-wrap{
  --md-pnl-c1:8.5rem;--md-pnl-c2:8.5rem;--md-pnl-c3:8.5rem;--md-pnl-gap:1.5rem;
  --md-pnl-fs:12px;--md-pnl-fs-cur:13px;--md-pnl-fs-head:10px;
}
@media(max-width:480px){
  .md-pnl-wrap{
    --md-pnl-c1:4.75rem;--md-pnl-c2:4.75rem;--md-pnl-c3:4.75rem;--md-pnl-gap:6px;
    --md-pnl-fs:10px;--md-pnl-fs-cur:10px;--md-pnl-fs-head:9px;
  }
  .md-pnl-label{font-size:12px}
  .md-pnl-head .md-pnl-num{white-space:nowrap}
}
.md-pnl-head,.md-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--md-pnl-c1) var(--md-pnl-c2) var(--md-pnl-c3);
  column-gap:var(--md-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.md-pnl-head{padding:0 6px 8px;font-size:var(--md-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.md-pnl-line{padding:8px 6px;border-radius:2px}
.md-pnl-line--indent{padding:4px 6px 4px 0}
.md-pnl-line--indent .md-pnl-label{padding-left:20px}
.md-pnl-line--sub{border-top:1px solid ${BORDER}}
.md-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.md-pnl-num{
  font-family:${MONO};font-size:var(--md-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;
  font-variant-numeric:tabular-nums;
}
.md-pnl-num--cur{font-size:var(--md-pnl-fs-cur)}
.md-pnl-head .md-pnl-num{font-size:var(--md-pnl-fs-head);font-family:${UI};font-weight:600}
.md-pnl-cat{padding:12px 6px 6px;font-family:${UI};font-size:13px;font-weight:700;color:${INK}}
`

export default function MrDipzFinancials({ model, open }) {
  const { sep, aug, cogsLines, opexLines } = model.pnl

  const Line = ({ id, label, cur, prior, indent, bold, cost }) => {
    const delta = cur - prior
    const cls = ['md-pnl-line', 'md-click', indent ? 'md-pnl-line--indent' : '', bold ? 'md-pnl-line--sub' : '']
      .filter(Boolean)
      .join(' ')
    const go = () => open({ type: 'pnl', id })
    return (
      <div role="button" tabIndex={0} className={cls} onClick={go} onKeyDown={(e) => e.key === 'Enter' && go()}>
        <span className="md-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
          <LabelWithChevron text={label} />
        </span>
        <span className="md-pnl-num md-pnl-num--cur md-num" style={{ fontWeight: bold ? 700 : 400, color: INK }}>
          {money(cur)}
        </span>
        <span className="md-pnl-num md-num" style={{ color: MUTED }}>
          {money(prior)}
        </span>
        <span className="md-pnl-num md-num" style={{ color: deltaColor(delta, { cost }) }}>
          {moneySigned(delta)}
        </span>
      </div>
    )
  }

  return (
    <div className="md-pnl-wrap md-card">
      <style dangerouslySetInnerHTML={{ __html: PNL_CSS }} />
      <div className="md-lbl" style={{ marginBottom: 8 }}>
        Profit &amp; loss · September 2026
      </div>
      <div className="md-pnl-head">
        <span />
        <span className="md-pnl-num">This month</span>
        <span className="md-pnl-num">Prior mo.</span>
        <span className="md-pnl-num">Change</span>
      </div>

      <Line id="gross" label="Gross sales" cur={sep.gross} prior={aug.gross} />
      <Line id="credits" label="Less credits for expired product" cur={sep.credits} prior={aug.credits} />
      <Line id="netSales" label="Net sales" cur={sep.netSales} prior={aug.netSales} bold />

      <div
        className="md-pnl-cat md-click"
        role="button"
        tabIndex={0}
        onClick={() => open({ type: 'pnl', id: 'cogs' })}
        onKeyDown={(e) => e.key === 'Enter' && open({ type: 'pnl', id: 'cogs' })}
      >
        Cost of goods
      </div>
      {cogsLines.map((l) => (
        <Line key={l.id} id={`line:${l.id}`} label={l.label} cur={sep.lines[l.id].amount} prior={aug.lines[l.id].amount} indent cost />
      ))}
      <Line id="cogs" label="Total cost of goods" cur={sep.cogs} prior={aug.cogs} bold cost />
      <Line id="grossProfit" label="Gross profit" cur={sep.grossProfit} prior={aug.grossProfit} bold />

      <div
        className="md-pnl-cat md-click"
        role="button"
        tabIndex={0}
        onClick={() => open({ type: 'pnl', id: 'opex' })}
        onKeyDown={(e) => e.key === 'Enter' && open({ type: 'pnl', id: 'opex' })}
      >
        Operating expenses
      </div>
      {opexLines.map((l) => (
        <Line key={l.id} id={`line:${l.id}`} label={l.label} cur={sep.lines[l.id].amount} prior={aug.lines[l.id].amount} indent cost />
      ))}
      <Line id="opex" label="Total operating expenses" cur={sep.opex} prior={aug.opex} bold cost />
      <Line id="netProfit" label="Net profit" cur={sep.netProfit} prior={aug.netProfit} bold />
    </div>
  )
}
