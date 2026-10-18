import { INK, MUTED, money, moneyColor, pct1 } from './closeoutExplosionUtils'

export default function CloseoutExplosionProfitTab({
  rows,
  card,
  lbl,
  onOpenLot,
  StackKV,
}) {
  const totals = rows.reduce(
    (acc, row) => ({
      totalCost: acc.totalCost + row.totalCost,
      revenue: acc.revenue + row.revenue,
      profit: acc.profit + row.profit,
    }),
    { totalCost: 0, revenue: 0, profit: 0 },
  )
  const totalMargin = totals.revenue > 0 ? totals.profit / totals.revenue : 0

  const profitColor = (n) => {
    if (n < 0) return '#C03A22'
    if (n > 0) return '#3E7C4F'
    return INK
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
              <StackKV k="Total cost" v={money(row.totalCost)} />
              <StackKV k="Sold so far" v={money(row.revenue)} />
              <StackKV k="Profit" v={money(row.profit)} vColor={profitColor(row.profit)} />
            </div>
            <div className="ce-stack-grid ce-stack-grid-2">
              <StackKV k="Margin" v={pct1(row.margin * 100)} />
              <StackKV k="Status" v={row.lot.status} />
            </div>
          </button>
        ))}
        <div className="ce-stack-row ce-stack-row-total" style={{ cursor: 'default' }}>
          <div className="ce-stack-title">Total</div>
          <div className="ce-stack-grid ce-stack-grid-3">
            <StackKV k="Total cost" v={money(totals.totalCost)} />
            <StackKV k="Sold so far" v={money(totals.revenue)} />
            <StackKV k="Profit" v={money(totals.profit)} vColor={profitColor(totals.profit)} />
          </div>
          <div className="ce-stack-grid ce-stack-grid-2">
            <StackKV k="Margin" v={pct1(totalMargin * 100)} />
          </div>
        </div>
      </div>
      <div className="ce-table-wrap">
        <table className="ce-table ce-compact">
          <thead>
            <tr>
              <th className="ce-th-left">Lot</th>
              <th>Total cost</th>
              <th>Sold so far</th>
              <th>Profit</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lot.id} className="ce-rowbtn" onClick={() => onOpenLot(row.lot.id)}>
                <td className="ce-td-left">
                  <div style={{ fontWeight: 600 }}>{row.lot.id}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{row.lot.desc}</div>
                </td>
                <td>{money(row.totalCost)}</td>
                <td>{money(row.revenue)}</td>
                <td style={{ color: profitColor(row.profit) }}>{money(row.profit)}</td>
                <td>{pct1(row.margin * 100)}</td>
              </tr>
            ))}
            <tr className="ce-total">
              <td className="ce-td-left">Total</td>
              <td>{money(totals.totalCost)}</td>
              <td>{money(totals.revenue)}</td>
              <td style={{ color: moneyColor(totals.profit) }}>{money(totals.profit)}</td>
              <td>{pct1(totalMargin * 100)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
