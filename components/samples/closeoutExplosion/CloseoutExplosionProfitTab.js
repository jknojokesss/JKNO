import { INK, MUTED, money, pct1 } from './closeoutExplosionUtils'

export default function CloseoutExplosionProfitTab({ rows, onOpenLot, StackKV }) {
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      costSold: acc.costSold + row.costSold,
      profit: acc.profit + row.profit,
    }),
    { revenue: 0, costSold: 0, profit: 0 },
  )
  const totalMargin = totals.revenue > 0 ? totals.profit / totals.revenue : null

  const profitColor = (n) => {
    if (n < 0) return '#C03A22'
    if (n > 0) return '#3E7C4F'
    return INK
  }

  const marginLabel = (row) => {
    if (row.revenue <= 0) return 'No sales yet'
    return pct1(row.margin * 100)
  }

  return (
    <>
      <div className="ce-stack-only">
        {rows.map((row) => (
          <button
            key={row.lot.id}
            type="button"
            className="ce-stack-row ce-click"
            onClick={() => onOpenLot(row.lot.id)}
          >
            <div className="ce-stack-title">
              <strong>{row.lot.id}</strong> {row.lot.desc}
            </div>
            <div className="ce-stack-grid ce-stack-grid-3">
              <StackKV k="Sales" v={money(row.revenue)} />
              <StackKV k="Cost of sales" v={money(row.costSold)} />
              <StackKV k="Profit" v={money(row.profit)} vColor={profitColor(row.profit)} />
            </div>
            <div className="ce-stack-grid ce-stack-grid-2">
              <StackKV k="Margin" v={marginLabel(row)} />
              <StackKV k="Status" v={row.statusLabel} />
            </div>
          </button>
        ))}
        <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
          <div className="ce-stack-title">Total</div>
          <div className="ce-stack-grid ce-stack-grid-3">
            <StackKV k="Sales" v={money(totals.revenue)} />
            <StackKV k="Cost of sales" v={money(totals.costSold)} />
            <StackKV k="Profit" v={money(totals.profit)} vColor={profitColor(totals.profit)} />
          </div>
          <div className="ce-stack-grid ce-stack-grid-2">
            <StackKV
              k="Margin"
              v={totalMargin == null ? 'No sales yet' : pct1(totalMargin * 100)}
            />
          </div>
        </div>
      </div>
      <div className="ce-table-wrap">
        <table className="ce-table ce-compact">
          <thead>
            <tr>
              <th className="ce-th-left">Lot</th>
              <th>Sales</th>
              <th>Cost of sales</th>
              <th>Profit</th>
              <th>Margin</th>
              <th className="ce-th-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lot.id} className="ce-rowbtn" onClick={() => onOpenLot(row.lot.id)}>
                <td className="ce-td-left">
                  <div style={{ fontWeight: 600 }}>{row.lot.id}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{row.lot.desc}</div>
                </td>
                <td>{money(row.revenue)}</td>
                <td>{money(row.costSold)}</td>
                <td style={{ color: profitColor(row.profit) }}>{money(row.profit)}</td>
                <td>{marginLabel(row)}</td>
                <td className="ce-td-left" style={{ fontSize: 12 }}>{row.statusLabel}</td>
              </tr>
            ))}
            <tr className="ce-total">
              <td className="ce-td-left">Total</td>
              <td>{money(totals.revenue)}</td>
              <td>{money(totals.costSold)}</td>
              <td style={{ color: profitColor(totals.profit) }}>{money(totals.profit)}</td>
              <td>{totalMargin == null ? '—' : pct1(totalMargin * 100)}</td>
              <td className="ce-td-left" />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
