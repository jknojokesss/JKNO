import { DATA } from './popinsanityComputed'
import { ClickRow } from './PopinsanityShared'
import { money, fmtInt, tierShort, sumBy } from './popinsanityUtils'

function CardField({ k, v }) {
  return (
    <div>
      <div className="pop-card-k">{k}</div>
      <div className="pop-card-v">{v}</div>
    </div>
  )
}

export default function PopinsanityOrdersTab({ styles, openOrder }) {
  const { card } = styles
  const orders = DATA.holiday_orders
  const totals = {
    units: sumBy(orders, 'units'),
    order_total: sumBy(orders, 'order_total'),
    deposit_received: sumBy(orders, 'deposit_received'),
    balance_due: sumBy(orders, 'balance_due'),
  }

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <div className="pop-order-table-wrap">
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Client</th>
              <th className="pop-th">Tier</th>
              <th className="pop-th pop-th--r">Units</th>
              <th className="pop-th pop-th--r">Order total</th>
              <th className="pop-th pop-th--r">Deposit received</th>
              <th className="pop-th pop-th--r">Balance due</th>
              <th className="pop-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <ClickRow key={o.id} onClick={() => openOrder(o.id)}>
                <td className="pop-td">
                  <div className="pop-client-name">{o.client}</div>
                </td>
                <td className="pop-td">{tierShort(o.tier)}</td>
                <td className="pop-td pop-td--r">{fmtInt(o.units)}</td>
                <td className="pop-td pop-td--r">{money(o.order_total)}</td>
                <td className="pop-td pop-td--r">{money(o.deposit_received)}</td>
                <td className="pop-td pop-td--r">{money(o.balance_due)}</td>
                <td className="pop-td">{o.status}</td>
              </ClickRow>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td" colSpan={2}>Total</td>
              <td className="pop-td pop-td--r">{fmtInt(totals.units)}</td>
              <td className="pop-td pop-td--r">{money(totals.order_total)}</td>
              <td className="pop-td pop-td--r">{money(totals.deposit_received)}</td>
              <td className="pop-td pop-td--r">{money(totals.balance_due)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="pop-order-cards">
        {orders.map((o) => (
          <button key={o.id} type="button" className="pop-order-card" onClick={() => openOrder(o.id)}>
            <div className="pop-card-title pop-client-name">{o.client}</div>
            <div className="pop-order-sub">{tierShort(o.tier)} · {o.status}</div>
            <div className="pop-card-grid" style={{ marginTop: 10 }}>
              <CardField k="Units" v={fmtInt(o.units)} />
              <CardField k="Order total" v={money(o.order_total)} />
              <CardField k="Deposit received" v={money(o.deposit_received)} />
              <CardField k="Balance due" v={money(o.balance_due)} />
            </div>
          </button>
        ))}
        <div className="pop-order-card" style={{ cursor: 'default' }}>
          <div className="pop-card-title">Total</div>
          <div className="pop-card-grid">
            <CardField k="Units" v={fmtInt(totals.units)} />
            <CardField k="Order total" v={money(totals.order_total)} />
            <CardField k="Deposit received" v={money(totals.deposit_received)} />
            <CardField k="Balance due" v={money(totals.balance_due)} />
          </div>
        </div>
      </div>
    </div>
  )
}
