import { useState } from 'react'
import {
  ORDER_STAGES,
  ordersByStage,
  stageColumnTotals,
  recipientShippedCounts,
  daysToTarget,
  holidayTotals,
} from './popinsanityComputed'
import { money, fmtInt, fmtD } from './popinsanityUtils'
import { MUTED, INK } from './popinsanityUtils'

function OrderBoardCard({ order, onOpen }) {
  const { shipped, total: recipTotal } = recipientShippedCounts(order)
  const days = daysToTarget(order.ship_date)
  const daysLabel = days == null ? '—' : days === 0 ? 'Today' : days > 0 ? `${days} days` : `${Math.abs(days)} days ago`

  return (
    <button type="button" className="pop-board-card" onClick={() => onOpen(order.id)}>
      <div className="pop-client-name pop-board-card-title">{order.client}</div>
      <div className="pop-board-card-grid">
        <div>
          <div className="pop-card-k">Tins</div>
          <div className="pop-card-v pop-board-num">{fmtInt(order.units)}</div>
        </div>
        <div>
          <div className="pop-card-k">Per tin</div>
          <div className="pop-card-v pop-board-num">{money(order.price)}</div>
        </div>
        <div>
          <div className="pop-card-k">Order total</div>
          <div className="pop-card-v pop-board-num">{money(order.order_total)}</div>
        </div>
        <div>
          <div className="pop-card-k">Deposit</div>
          <div className="pop-card-v pop-board-num">{money(order.deposit_received)}</div>
        </div>
        <div>
          <div className="pop-card-k">Balance</div>
          <div className="pop-card-v pop-board-num">{money(order.balance_due)}</div>
        </div>
        <div>
          <div className="pop-card-k">Target delivery</div>
          <div className="pop-card-v pop-board-num pop-board-num--left">{fmtD(order.ship_date)}</div>
        </div>
        <div className="pop-board-card-span">
          <div className="pop-card-k">Recipients shipped</div>
          <div className="pop-card-v pop-board-num pop-board-num--left">
            {fmtInt(shipped)} of {fmtInt(recipTotal)}
          </div>
        </div>
        <div>
          <div className="pop-card-k">Days to target</div>
          <div className="pop-card-v pop-board-num pop-board-num--left">{daysLabel}</div>
        </div>
      </div>
    </button>
  )
}

function StageColumn({ stage, orders, onOpen }) {
  const { count, dollars } = stageColumnTotals(stage.id, orders)
  return (
    <div className="pop-board-col">
      <div className="pop-board-col-head">
        <div className="pop-board-col-title">{stage.label}</div>
        <div className="pop-board-col-meta">
          <span>{count}</span>
          <span className="pop-board-col-amt">{money(dollars)}</span>
        </div>
      </div>
      <div className="pop-board-col-body">
        {orders.map((o) => (
          <OrderBoardCard key={o.id} order={o} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export default function PopinsanityOrdersTab({ styles, openOrder, openHolidaySummary }) {
  const { card, lbl } = styles
  const byStage = ordersByStage()
  const hol = holidayTotals()
  const [mobileStage, setMobileStage] = useState('all')

  const summaryRow = (
    <button
      type="button"
      className="pop-board-summary pop-click"
      onClick={() => openHolidaySummary?.()}
      style={{ ...card, width: '100%', textAlign: 'left', marginBottom: 14, cursor: openHolidaySummary ? 'pointer' : 'default' }}
    >
      <div style={{ ...lbl, marginBottom: 8 }}>Holiday pipeline</div>
      <div className="pop-board-summary-grid">
        <div>
          <div className="pop-card-k">Orders booked</div>
          <div className="pop-board-summary-val">{money(hol.booked)}</div>
        </div>
        <div>
          <div className="pop-card-k">Units</div>
          <div className="pop-board-summary-val">{fmtInt(hol.units)}</div>
        </div>
        <div>
          <div className="pop-card-k">Deposits received</div>
          <div className="pop-board-summary-val">{money(hol.deposits)}</div>
        </div>
        <div>
          <div className="pop-card-k">Balance due</div>
          <div className="pop-board-summary-val">{money(hol.balance)}</div>
        </div>
      </div>
    </button>
  )

  return (
    <div>
      {summaryRow}
      <div className="pop-board-filter" role="tablist" aria-label="Stage filter">
        <button
          type="button"
          className={mobileStage === 'all' ? 'pop-board-filter--on' : ''}
          onClick={() => setMobileStage('all')}
        >
          All
        </button>
        {ORDER_STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={mobileStage === s.id ? 'pop-board-filter--on' : ''}
            onClick={() => setMobileStage(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="pop-board-desktop">
        <div className="pop-board-cols">
          {ORDER_STAGES.map((stage) => (
            <StageColumn key={stage.id} stage={stage} orders={byStage[stage.id]} onOpen={openOrder} />
          ))}
        </div>
      </div>

      <div className="pop-board-mobile">
        {(mobileStage === 'all' ? ORDER_STAGES : ORDER_STAGES.filter((s) => s.id === mobileStage)).map((stage) => {
          const orders = byStage[stage.id]
          if (!orders.length) return null
          const { count, dollars } = stageColumnTotals(stage.id, orders)
          return (
            <div key={stage.id} className="pop-board-mobile-group" style={card}>
              <div className="pop-board-mobile-head">
                <span style={{ fontWeight: 600, fontSize: 14, color: INK }}>{stage.label}</span>
                <span style={{ fontSize: 13, color: MUTED }}>
                  {count} · {money(dollars)}
                </span>
              </div>
              {orders.map((o) => (
                <OrderBoardCard key={o.id} order={o} onOpen={openOrder} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
