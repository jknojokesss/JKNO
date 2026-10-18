import { allTierRows } from './popinsanityComputed'
import { ClickRow } from './PopinsanityShared'
import { money, fmtInt, pct1, sumBy } from './popinsanityUtils'

function CardField({ k, v }) {
  return (
    <div>
      <div className="pop-card-k">{k}</div>
      <div className="pop-card-v">{v}</div>
    </div>
  )
}

export default function PopinsanityTiersTab({ styles, openTier }) {
  const { card } = styles
  const rows = allTierRows()
  const totalUnits = sumBy(rows, 'units')
  const totalGross = sumBy(rows, 'gross')
  const totalRev = rows.reduce((s, r) => s + r.units * r.price, 0)
  const blended = totalRev > 0 ? (totalGross / totalRev) * 100 : 0

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div className="pop-tier-table-wrap">
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

      <div className="pop-tier-cards">
        {rows.map((r) => (
          <button key={r.id} type="button" className="pop-tier-card" onClick={() => openTier(r.id)}>
            <div className="pop-card-title">{r.name}</div>
            <div className="pop-card-grid">
              <CardField k="Price" v={money(r.price)} />
              <CardField k="Cost per unit" v={money(r.cost)} />
              <CardField k="Margin per unit" v={money(r.marginUnit)} />
              <CardField k="Margin %" v={pct1(r.marginPct)} />
              <CardField k="Units ordered" v={fmtInt(r.units)} />
              <CardField k="Gross profit" v={money(r.gross)} />
            </div>
          </button>
        ))}
        <div className="pop-tier-card" style={{ cursor: 'default' }}>
          <div className="pop-card-title">Total</div>
          <div className="pop-card-grid">
            <CardField k="Units ordered" v={fmtInt(totalUnits)} />
            <CardField k="Revenue" v={money(totalRev)} />
            <CardField k="Gross profit" v={money(totalGross)} />
            <CardField k="Blended margin %" v={pct1(blended)} />
          </div>
        </div>
      </div>
    </div>
  )
}
