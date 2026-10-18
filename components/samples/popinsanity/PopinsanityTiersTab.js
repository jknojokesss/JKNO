import { allTierRows } from './popinsanityComputed'
import { ClickRow } from './PopinsanityShared'
import { money, fmtInt, pct1, sumBy } from './popinsanityUtils'

export default function PopinsanityTiersTab({ styles, openTier }) {
  const { card } = styles
  const rows = allTierRows()
  const totalUnits = sumBy(rows, 'units')
  const totalGross = sumBy(rows, 'gross')
  const totalRev = rows.reduce((s, r) => s + r.units * r.price, 0)
  const blended = totalRev > 0 ? (totalGross / totalRev) * 100 : 0

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <table className="pop-table">
        <thead>
          <tr>
            <th className="pop-th">Tier</th>
            <th className="pop-th pop-th--r">Price</th>
            <th className="pop-th pop-th--r">Cost per unit</th>
            <th className="pop-th pop-th--r">Margin per unit</th>
            <th className="pop-th pop-th--r">Margin %</th>
            <th className="pop-th pop-th--r">Units ordered</th>
            <th className="pop-th pop-th--r">Gross profit on holiday orders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <ClickRow key={r.id} onClick={() => openTier(r.id)}>
              <td className="pop-td">{r.name}</td>
              <td className="pop-td pop-td--r">{money(r.price)}</td>
              <td className="pop-td pop-td--r">{money(r.cost)}</td>
              <td className="pop-td pop-td--r">{money(r.marginUnit)}</td>
              <td className="pop-td pop-td--r">{pct1(r.marginPct)}</td>
              <td className="pop-td pop-td--r">{fmtInt(r.units)}</td>
              <td className="pop-td pop-td--r">{money(r.gross)}</td>
            </ClickRow>
          ))}
        </tbody>
        <tfoot>
          <tr className="pop-tfoot">
            <td className="pop-td">Total</td>
            <td className="pop-td pop-td--r" colSpan={4}>Blended margin {pct1(blended)}</td>
            <td className="pop-td pop-td--r">{fmtInt(totalUnits)}</td>
            <td className="pop-td pop-td--r">{money(totalGross)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
