import DATA from './aufschnittData'
import AufschnittDetailNav from './AufschnittDetailNav'
import {
  INK,
  MUTED,
  BORDER,
  CREAM,
  GREEN,
  RED,
  money,
  money0,
  pct1,
  PROFIT_TABLE_CSS,
  fmtMonthDay,
} from './aufschnittUtils'

export default function AufschnittProfitTab({ card, lbl, onOpen }) {
  const pp = DATA.profitPerOrder
  const totals = pp.channelSummary.reduce(
    (acc, row) => ({
      orders: acc.orders + row.orders,
      revenue: acc.revenue + row.revenue,
      productCost: acc.productCost + row.productCost,
      shipping: acc.shipping + row.shipping,
      discounts: acc.discounts + row.discounts,
      fees: acc.fees + row.fees,
      profit: acc.profit + row.profit,
    }),
    { orders: 0, revenue: 0, productCost: 0, shipping: 0, discounts: 0, fees: 0, profit: 0 }
  )
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0
  const totalAvgOrder = totals.orders > 0 ? totals.revenue / totals.orders : 0
  const totalAvgProfit = totals.orders > 0 ? totals.profit / totals.orders : 0

  return (
    <div style={{ ...card }}>
      <style dangerouslySetInnerHTML={{ __html: PROFIT_TABLE_CSS }} />
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>September 2026</div>

      {pp.shippingLossCount > 0 && (
        <button
          type="button"
          className="au-profit-ship-note au-click"
          onClick={() => onOpen({ type: 'profit-shipping-losses' })}
        >
          Orders that lost money on shipping: {pp.shippingLossCount}, {money(pp.shippingLossTotal)}
        </button>
      )}

      <div className="au-profit-table-wrap">
        <table className="au-profit-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Product cost</th>
              <th>Shipping</th>
              <th>Discounts</th>
              <th>Fees</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Avg order</th>
              <th>Profit / order</th>
            </tr>
          </thead>
          <tbody>
            {pp.channelSummary.map((row) => (
              <tr
                key={row.channel}
                className="au-click"
                role="button"
                tabIndex={0}
                onClick={() => onOpen({ type: 'profit-channel', channel: row.channel })}
                onKeyDown={(e) => e.key === 'Enter' && onOpen({ type: 'profit-channel', channel: row.channel })}
              >
                <td className="au-profit-ch">{row.channel}</td>
                <td>{row.orders.toLocaleString()}</td>
                <td>{money0(row.revenue)}</td>
                <td>{money0(row.productCost)}</td>
                <td>{money0(row.shipping)}</td>
                <td>{money0(row.discounts)}</td>
                <td>{money0(row.fees)}</td>
                <td style={{ color: row.profit >= 0 ? GREEN : RED }}>{money(row.profit)}</td>
                <td>{pct1(row.marginPct)}</td>
                <td>{money(row.avgOrderRevenue)}</td>
                <td>{money(row.avgProfitPerOrder)}</td>
              </tr>
            ))}
            <tr className="au-profit-total">
              <td>Total</td>
              <td>{totals.orders.toLocaleString()}</td>
              <td>{money0(totals.revenue)}</td>
              <td>{money0(totals.productCost)}</td>
              <td>{money0(totals.shipping)}</td>
              <td>{money0(totals.discounts)}</td>
              <td>{money0(totals.fees)}</td>
              <td style={{ color: totals.profit >= 0 ? GREEN : RED }}>{money(totals.profit)}</td>
              <td>{pct1(totalMargin)}</td>
              <td>{money(totalAvgOrder)}</td>
              <td>{money(totalAvgProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="au-profit-cards">
        {pp.channelSummary.map((row) => (
          <button
            key={row.channel}
            type="button"
            className="au-profit-card au-click"
            onClick={() => onOpen({ type: 'profit-channel', channel: row.channel })}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{row.channel}</div>
            <div className="au-profit-card-row">
              <span>Orders</span>
              <span>{row.orders.toLocaleString()}</span>
            </div>
            <div className="au-profit-card-row">
              <span>Avg order</span>
              <span>{money(row.avgOrderRevenue)}</span>
            </div>
            <div className="au-profit-card-row">
              <span>Profit / order</span>
              <span style={{ color: row.profit >= 0 ? GREEN : RED }}>{money(row.avgProfitPerOrder)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProfitChannelDetail({ detail, card, lbl, big, onOpen, onBack }) {
  const orders = DATA.profitPerOrder.ordersByChannel[detail.channel] || []
  const row = DATA.profitPerOrder.channelSummary.find((r) => r.channel === detail.channel)

  return (
    <div>
      <AufschnittDetailNav onBack={onBack} />
      <h2 style={{ ...big, fontSize: 22, marginBottom: 4 }}>{detail.channel}</h2>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Recent orders · September 2026</div>

      {row ? (
        <div style={{ ...card, marginBottom: 12 }}>
          <div className="au-profit-card-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: MUTED }}>Orders</span>
            <span>{row.orders.toLocaleString()}</span>
          </div>
          <div className="au-profit-card-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: MUTED }}>Avg order</span>
            <span>{money(row.avgOrderRevenue)}</span>
          </div>
          <div className="au-profit-card-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: MUTED }}>Profit / order</span>
            <span style={{ color: row.profit >= 0 ? GREEN : RED }}>{money(row.avgProfitPerOrder)}</span>
          </div>
        </div>
      ) : null}

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 10 }}>Recent orders</div>
        <style dangerouslySetInnerHTML={{ __html: PROFIT_TABLE_CSS }} />
        <div className="au-profit-orders-wrap">
          <table className="au-profit-orders">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Cost</th>
                <th>Ship</th>
                <th>Disc.</th>
                <th>Fees</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="au-click"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen({ type: 'profit-order', channel: detail.channel, orderId: o.id })}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && onOpen({ type: 'profit-order', channel: detail.channel, orderId: o.id })
                  }
                >
                  <td>{o.orderNo}</td>
                  <td>{fmtMonthDay(o.date)}</td>
                  <td className="au-profit-cust">{o.customer}</td>
                  <td className="au-profit-items">{o.items}</td>
                  <td>{money(o.orderTotal)}</td>
                  <td>{money(o.productCost)}</td>
                  <td>{money(o.shipping)}</td>
                  <td>{money(o.discount)}</td>
                  <td>{money(o.fees)}</td>
                  <td style={{ color: o.profit < 0 ? RED : INK }}>{money(o.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="au-profit-order-cards">
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              className="au-profit-order-card au-click"
              onClick={() => onOpen({ type: 'profit-order', channel: detail.channel, orderId: o.id })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{o.orderNo}</span>
                <span style={{ color: o.profit < 0 ? RED : INK }}>{money(o.profit)}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>{fmtMonthDay(o.date)} · {o.customer}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{o.items}</div>
              {o.lostOnShipping ? (
                <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>Lost money on shipping</div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProfitOrderDetail({ detail, card, lbl, big, onBack }) {
  const orders = DATA.profitPerOrder.ordersByChannel[detail.channel] || []
  const order = orders.find((o) => o.id === detail.orderId)
  if (!order) return null

  return (
    <div>
      <AufschnittDetailNav onBack={onBack} />
      <h2 style={{ ...big, fontSize: 20, marginBottom: 4 }}>{order.orderNo}</h2>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
        {fmtMonthDay(order.date)} · {order.customer}
      </div>
      {order.lostOnShipping ? (
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>Lost money on shipping</div>
      ) : null}

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Lines</div>
        {order.lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 0',
              borderTop: i ? `1px solid ${CREAM}` : 'none',
              fontSize: 13,
            }}
          >
            <span style={{ minWidth: 0 }}>
              {line.description} · {line.qty} x {money(line.unitPrice)}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(line.revenue)}</span>
          </div>
        ))}
      </div>

      <div style={{ ...card }}>
        <Row l="Order total" v={money(order.orderTotal)} />
        <Row l="Product cost" v={money(order.productCost)} />
        <Row l="Shipping" v={money(order.shipping)} />
        <Row l="Discount" v={money(order.discount)} />
        <Row l="Fees" v={money(order.fees)} />
        <Row l="Profit" v={money(order.profit)} bold accent={order.profit < 0 ? RED : INK} />
      </div>
    </div>
  )
}

export function ProfitShippingLossDetail({ card, lbl, big, onOpen, onBack }) {
  const list = DATA.profitPerOrder.shippingLossOrders
  return (
    <div>
      <AufschnittDetailNav onBack={onBack} />
      <h2 style={{ ...big, fontSize: 20, marginBottom: 14 }}>Lost money on shipping</h2>
      <div style={{ ...card }}>
        {list.map((o, i) => (
          <button
            key={o.id}
            type="button"
            className="au-click"
            onClick={() => onOpen({ type: 'profit-order', channel: o.channel, orderId: o.id })}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: 'transparent',
              padding: '10px 0',
              borderTop: i ? `1px solid ${CREAM}` : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{o.orderNo}</span>
              <span style={{ color: RED, fontVariantNumeric: 'tabular-nums' }}>{money(o.profit)}</span>
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>{o.channel} · {fmtMonthDay(o.date)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ l, v, bold, accent }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: 13,
        fontWeight: bold ? 600 : 400,
      }}
    >
      <span style={{ color: MUTED }}>{l}</span>
      <span style={{ color: accent || INK, fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )
}
