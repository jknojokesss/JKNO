import { DATA } from './popinsanityComputed'
import { ClickRow } from './PopinsanityShared'
import { money, fmtInt, tierShort, sumBy } from './popinsanityUtils'

export default function PopinsanityOrdersTab({ styles, openOrder }) {
  const { card, lbl } = styles
  const orders = DATA.holiday_orders
  const totals = {
    units: sumBy(orders, 'units'),
    order_total: sumBy(orders, 'order_total'),
    deposit_received: sumBy(orders, 'deposit_received'),
    balance_due: sumBy(orders, 'balance_due'),
  }

  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      <table className="pop-table pop-orders-grid">
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
              <td className="pop-td pop-order-client" data-label="Client">
                <div style={{ fontWeight: 600 }}>{o.client}</div>
                <div style={{ fontSize: 11, color: '#8A7A66', marginTop: 2 }}>{tierShort(o.tier)} · {o.status}</div>
              </td>
              <td className="pop-td pop-hide-phone" data-label="Tier">{tierShort(o.tier)}</td>
              <td className="pop-td pop-td--r" data-label="Units">{fmtInt(o.units)}</td>
              <td className="pop-td pop-td--r" data-label="Order total">{money(o.order_total)}</td>
              <td className="pop-td pop-td--r" data-label="Deposit received">{money(o.deposit_received)}</td>
              <td className="pop-td pop-td--r" data-label="Balance due">{money(o.balance_due)}</td>
              <td className="pop-td pop-hide-phone" data-label="Status">{o.status}</td>
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
  )
}
