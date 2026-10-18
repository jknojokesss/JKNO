import { DATA, allChannelSales } from './popinsanityComputed'
import { ClickRow, ChangeCell } from './PopinsanityShared'
import { money, SPICE, KRAFT, MUTED, BORDER } from './popinsanityUtils'

function ChannelBars({ rows }) {
  const max = Math.max(...rows.map((r) => Math.max(r.this, r.prior)), 1)
  const h = 120
  const w = 280
  const gap = 24
  const barW = 14
  return (
    <svg viewBox={`0 0 ${rows.length * gap + 40} ${h + 36}`} style={{ width: '100%', maxWidth: 360, display: 'block', marginBottom: 16 }} aria-hidden>
      {rows.map((r, i) => {
        const x = 20 + i * gap
        const th = (r.this / max) * h
        const ph = (r.prior / max) * h
        return (
          <g key={r.id}>
            <rect x={x} y={h - ph} width={barW} height={ph} fill={KRAFT} />
            <rect x={x + barW + 4} y={h - th} width={barW} height={th} fill={SPICE} />
            <text x={x + barW} y={h + 14} textAnchor="middle" fontSize="9" fill={MUTED}>{r.name.slice(0, 3)}</text>
            <text x={x + barW + 2} y={h - th - 4} textAnchor="middle" fontSize="8" fill={SPICE}>{Math.round(r.this / 1000)}k</text>
            <text x={x + barW + 2} y={h - ph - 4} textAnchor="middle" fontSize="8" fill={KRAFT}>{Math.round(r.prior / 1000)}k</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function PopinsanitySalesTab({ styles, openChannel }) {
  const { card, lbl } = styles
  const sales = allChannelSales()
  const totalThis = sales.thisMonth
  const totalPrior = sales.prior

  return (
    <>
      <div style={{ ...card, marginBottom: 16 }}>
        <ChannelBars rows={sales.rows} />
      </div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Channel</th>
              <th className="pop-th pop-th--r">This month</th>
              <th className="pop-th pop-th--r">Prior mo.</th>
              <th className="pop-th pop-th--r">Change</th>
            </tr>
          </thead>
          <tbody>
            {sales.rows.map((r) => (
              <ClickRow key={r.id} onClick={() => openChannel(r.id)}>
                <td className="pop-td">{r.name}</td>
                <td className="pop-td pop-td--r">{money(r.this)}</td>
                <td className="pop-td pop-td--r">{money(r.prior)}</td>
                <td className="pop-td pop-td--r">
                  <ChangeCell thisVal={r.this} priorVal={r.prior} />
                </td>
              </ClickRow>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td">Total</td>
              <td className="pop-td pop-td--r">{money(totalThis)}</td>
              <td className="pop-td pop-td--r">{money(totalPrior)}</td>
              <td className="pop-td pop-td--r">
                <ChangeCell thisVal={totalThis} priorVal={totalPrior} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
