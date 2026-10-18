import { allChannelSales } from './popinsanityComputed'
import { ClickRow, ChangeCell } from './PopinsanityShared'
import { money, money0, SPICE, STONE, MUTED, CREAM, MONO, UI } from './popinsanityUtils'

function HorizontalChannelChart({ rows }) {
  const max = Math.max(...rows.flatMap((r) => [r.this, r.prior]), 1)
  return (
    <div style={{ maxWidth: 640, width: '100%' }}>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: MUTED, marginBottom: 12, fontFamily: UI }}>
        <span><span style={{ color: SPICE, marginRight: 4 }}>■</span>Oct</span>
        <span><span style={{ color: STONE, marginRight: 4 }}>■</span>Sep</span>
      </div>
      {rows.map((r) => (
        <div key={r.id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#2B2B2B' }}>{r.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ flex: 1, minWidth: 0, height: 12, background: CREAM, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(r.this / max) * 100}%`, height: '100%', background: SPICE, minWidth: r.this > 0 ? 2 : 0 }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 12, flexShrink: 0 }}>{money0(r.this)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, height: 12, background: CREAM, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(r.prior / max) * 100}%`, height: '100%', background: STONE, minWidth: r.prior > 0 ? 2 : 0 }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 12, flexShrink: 0 }}>{money0(r.prior)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PopinsanitySalesTab({ styles, openChannel }) {
  const { card } = styles
  const sales = allChannelSales()
  const totalThis = sales.thisMonth
  const totalPrior = sales.prior

  return (
    <>
      <div style={{ ...card, marginBottom: 16 }}>
        <HorizontalChannelChart rows={sales.rows} />
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
