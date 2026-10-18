import { useState } from 'react'
import {
  DATA,
  tierById,
  tierStats,
  channelTotal,
  channelPrior,
  storeByName,
  wholesaleChannel,
  wholesaleStats,
  wholesaleInvoicesFiltered,
  storeOldestDays,
  PNL_CHANNEL_MAP,
  ORDER_STAGES,
  recipientShippedCounts,
  daysToTarget,
  holidayTotals,
  AS_OF_ISO,
} from './popinsanityComputed'
import { DetailShell, RowLine, ClickRow } from './PopinsanityShared'
import { CompareSheet } from './PopinsanityCompareSheet'
import {
  money,
  fmtD,
  fmtInt,
  pct1,
  tierShort,
  sumBy,
  changePct,
  changeColor,
  SPICE,
  RED,
  MUTED,
  INK,
  BORDER,
  CREAM,
  CARDBG,
  MONO,
} from './popinsanityUtils'

const stageLabel = (id) => ORDER_STAGES.find((s) => s.id === id)?.label || id

const invoiceActionBtn = {
  border: `1px solid ${BORDER}`,
  background: CARDBG,
  color: SPICE,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
  padding: '10px 14px',
  borderRadius: 2,
  width: '100%',
  textAlign: 'left',
}

function OrderRecipients({ order, lbl }) {
  const [showAll, setShowAll] = useState(false)
  const list = order.recipients || []
  const visible = showAll ? list : list.slice(0, 10)
  const hidden = list.length - visible.length
  return (
    <>
      <div style={{ marginTop: 12, ...lbl, marginBottom: 6 }}>Recipients</div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 10px' }}>
        {visible.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              padding: '7px 0',
              borderTop: i ? `1px solid ${CREAM}` : 'none',
              fontSize: 13,
            }}
          >
            <span>{r.name}</span>
            <span style={{ color: MUTED, flexShrink: 0 }}>{r.status}</span>
          </div>
        ))}
        {!showAll && hidden > 0 ? (
          <button
            type="button"
            className="pop-click"
            onClick={() => setShowAll(true)}
            style={{
              marginTop: 6,
              marginBottom: 4,
              border: 'none',
              background: 'transparent',
              color: SPICE,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              padding: '8px 0',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Show all {list.length}
          </button>
        ) : null}
      </div>
    </>
  )
}

export function OrderDetail({ orderId, onBack, onTier, onInvoicePreview, card, big, lbl }) {
  const o = DATA.holiday_orders.find((x) => x.id === orderId)
  if (!o) return null
  const tier = tierById[o.tier]
  const depositDue = o.cash_due.find((c) => c.type === 'Deposit')
  const { shipped, total: recipTotal } = recipientShippedCounts(o)
  const days = daysToTarget(o.ship_date)
  const daysLabel = days == null ? '—' : days === 0 ? 'Today' : days > 0 ? `${days} days` : `${Math.abs(days)} days ago`
  const showDepositInvoice = o.stage === 'quote' || o.stage === 'deposit_invoiced'
  const showBalanceInvoice =
    o.stage === 'deposit_paid' || o.stage === 'shipping' || o.stage === 'balance_invoiced'

  return (
    <DetailShell title={o.client} onBack={onBack} card={card} big={big}>
      <RowLine l="Order" v={o.id} mono={false} />
      <RowLine l="Stage" v={stageLabel(o.stage)} mono={false} />
      <RowLine
        l="Tier"
        v={
          <button type="button" onClick={() => onTier(o.tier)} style={{ border: 'none', background: 'none', color: SPICE, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}>
            {tier.name}
          </button>
        }
        mono={false}
      />
      <div style={{ fontSize: '12px', color: MUTED, marginBottom: 8 }}>{tier.contents}</div>
      <RowLine l="Tins × price" v={`${fmtInt(o.units)} × ${money(o.price)} = ${money(o.order_total)}`} mono={false} />
      <RowLine l="Booked" v={fmtD(o.booked)} mono={false} />
      <RowLine l="Target delivery" v={fmtD(o.ship_date)} mono={false} />
      <RowLine l="Days to target" v={daysLabel} mono={false} />
      <RowLine l="Deposit" v={`${o.deposit_pct}% · ${money(o.deposit_amount)}`} mono={false} />
      {o.stage === 'deposit_invoiced' ? (
        <RowLine l="Deposit invoiced" v={money(o.deposit_amount)} mono={false} />
      ) : null}
      <RowLine
        l="Deposit paid"
        v={
          o.deposit_received > 0
            ? `${money(o.deposit_received)} · ${fmtD(o.deposit_date)}`
            : depositDue
              ? `Not paid, due ${fmtD(depositDue.date)}`
              : 'Not paid'
        }
        mono={false}
      />
      <RowLine l="Balance due" v={money(o.balance_due)} bold mono={false} />
      {showDepositInvoice ? (
        <button
          type="button"
          className="pop-click"
          onClick={() => onInvoicePreview?.({ orderId: o.id, kind: 'deposit' })}
          style={{ ...invoiceActionBtn, marginTop: 14 }}
        >
          Create deposit invoice
        </button>
      ) : null}
      {showBalanceInvoice ? (
        <button
          type="button"
          className="pop-click"
          onClick={() => onInvoicePreview?.({ orderId: o.id, kind: 'balance' })}
          style={{ ...invoiceActionBtn, marginTop: showDepositInvoice ? 8 : 14 }}
        >
          Create balance invoice
        </button>
      ) : null}
      <RowLine l="Recipients shipped" v={`${fmtInt(shipped)} of ${fmtInt(recipTotal)}`} mono={false} />
      <OrderRecipients order={o} lbl={lbl} />
      <div style={{ marginTop: 12, ...lbl, marginBottom: 6 }}>Cash due</div>
      {o.cash_due.map((c, i) => (
        <RowLine key={i} l={`${fmtD(c.date)} · ${c.type}`} v={money(c.amount)} mono={false} />
      ))}
    </DetailShell>
  )
}

export function InvoicePreviewDetail({ orderId, kind, onClose, card, big, lbl }) {
  const o = DATA.holiday_orders.find((x) => x.id === orderId)
  if (!o) return null
  const isDeposit = kind === 'deposit'
  const invoiceTotal = isDeposit ? o.deposit_amount : o.balance_due
  return (
    <div>
      <button type="button" className="pop-back" onClick={onClose}>
        Close
      </button>
      <div style={{ ...card }}>
        <div className="pop-client-name" style={{ ...big, fontSize: '20px', color: INK, marginBottom: '14px' }}>
          {isDeposit ? 'Deposit invoice preview' : 'Balance invoice preview'}
        </div>
        <RowLine l="Bill to" v={o.client} mono={false} />
        <RowLine l="Invoice date" v={fmtD(AS_OF_ISO)} mono={false} />
        <RowLine l="Order" v={o.id} mono={false} />
        <div style={{ marginTop: 12, ...lbl, marginBottom: 8 }}>Line items</div>
        <RowLine l={`${fmtInt(o.units)} tins × ${money(o.price)}`} v={money(o.order_total)} mono={false} />
        {!isDeposit && o.deposit_received > 0 ? (
          <RowLine l="Less deposit paid" v={money(-o.deposit_received)} mono={false} />
        ) : null}
        <RowLine l={isDeposit ? 'Deposit' : 'Balance'} v={money(invoiceTotal)} mono={false} />
        <RowLine l="Invoice total" v={money(invoiceTotal)} bold mono={false} />
        <div style={{ marginTop: 14, fontSize: 13, color: MUTED }}>Goes into QuickBooks as an invoice</div>
      </div>
    </div>
  )
}

export function HolidayOverviewDetail({ focus, onBack, onOrder, onGoOrders, card, big, lbl }) {
  const hol = holidayTotals()
  const orders = DATA.holiday_orders
  const title =
    focus === 'booked'
      ? 'Holiday orders booked'
      : focus === 'deposits'
        ? 'Deposits received'
        : focus === 'balance'
          ? 'Balance due'
          : 'Holiday orders'
  const rows =
    focus === 'deposits'
      ? orders.filter((o) => o.deposit_received > 0)
      : focus === 'balance'
        ? orders.filter((o) => o.balance_due > 0)
        : orders
  const total =
    focus === 'booked'
      ? hol.booked
      : focus === 'deposits'
        ? hol.deposits
        : focus === 'balance'
          ? hol.balance
          : hol.booked

  return (
    <DetailShell title={title} onBack={onBack} card={card} big={big}>
      {focus === 'booked' ? (
        <RowLine l="Orders" v={`${hol.count} · ${fmtInt(hol.units)} units`} mono={false} />
      ) : null}
      <div style={{ marginTop: 8, ...lbl, marginBottom: 8 }}>By order</div>
      <table className="pop-table">
        <thead>
          <tr>
            <th className="pop-th">Client</th>
            <th className="pop-th pop-th--r">{focus === 'booked' ? 'Order total' : focus === 'deposits' ? 'Deposit' : 'Balance'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <ClickRow key={o.id} onClick={() => onOrder(o.id)}>
              <td className="pop-td"><span className="pop-client-name">{o.client}</span></td>
              <td className="pop-td pop-td--r">
                {money(focus === 'booked' ? o.order_total : focus === 'deposits' ? o.deposit_received : o.balance_due)}
              </td>
            </ClickRow>
          ))}
        </tbody>
        <tfoot>
          <tr className="pop-tfoot">
            <td className="pop-td">Total</td>
            <td className="pop-td pop-td--r">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
      <button
        type="button"
        className="pop-click"
        onClick={onGoOrders}
        style={{
          marginTop: 16,
          border: `1px solid ${BORDER}`,
          background: CARDBG,
          color: SPICE,
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 13,
          padding: '10px 14px',
          borderRadius: 2,
          width: '100%',
          textAlign: 'left',
        }}
      >
        Open corporate orders board
      </button>
    </DetailShell>
  )
}

export function TierDetail({ tierId, onBack, onOrder, card, big, lbl }) {
  const stats = tierStats(tierId)
  const { tier, orders } = stats
  const costSum = sumBy(tier.cost_lines, 'amount')
  const margin = tier.price - tier.cost_per_unit
  return (
    <DetailShell title={tier.name} onBack={onBack} card={card} big={big}>
      <div style={{ fontSize: '13px', color: MUTED, marginBottom: 12 }}>{tier.contents}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Cost breakdown</div>
      {tier.cost_lines.map((c) => <RowLine key={c.label} l={c.label} v={money(c.amount)} />)}
      <RowLine l="Cost per unit" v={money(tier.cost_per_unit)} bold />
      <RowLine l="Price" v={money(tier.price)} />
      <RowLine l="Margin per unit" v={money(margin)} bold />
      <div style={{ ...lbl, margin: '16px 0 8px' }}>Holiday orders on this tier</div>
      <table className="pop-table">
        <thead>
          <tr>
            <th className="pop-th">Client</th>
            <th className="pop-th pop-th--r">Units</th>
            <th className="pop-th pop-th--r">Order total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <ClickRow key={o.id} onClick={() => onOrder(o.id)}>
              <td className="pop-td"><span className="pop-client-name">{o.client}</span></td>
              <td className="pop-td pop-td--r">{fmtInt(o.units)}</td>
              <td className="pop-td pop-td--r">{money(o.order_total)}</td>
            </ClickRow>
          ))}
        </tbody>
        <tfoot>
          <tr className="pop-tfoot">
            <td className="pop-td">Total</td>
            <td className="pop-td pop-td--r">{fmtInt(stats.units)}</td>
            <td className="pop-td pop-td--r">{money(stats.revenue)}</td>
          </tr>
        </tfoot>
      </table>
    </DetailShell>
  )
}

export function ProductLineDetail({ line, onBack, card, big }) {
  const delta = line.prior != null ? line.this - line.prior : null
  const color = changeColor(delta, { cost: false })
  return (
    <DetailShell title={line.label} onBack={onBack} card={card} big={big}>
      <RowLine l={`${line.channel} · ${DATA.meta.this_short}`} v={money(line.this)} />
      <RowLine l={`${line.channel} · ${DATA.meta.prior_short}`} v={money(line.prior)} />
      <RowLine l="Change" v={<span style={{ color }}>{money(delta)}</span>} />
    </DetailShell>
  )
}

export function StoreDetail({ storeName, onBack, card, big, lbl }) {
  const store = storeByName(storeName)
  const ch = wholesaleChannel()
  if (!store || !ch) return null
  const delta = store.sales_prior != null ? store.sales_this - store.sales_prior : null
  const color = changeColor(delta, { cost: false })
  const owed = sumBy(store.open_invoices, 'amount')
  return (
    <DetailShell title={store.name} onBack={onBack} card={card} big={big}>
      <RowLine l="Area" v={store.area} />
      <RowLine l="Terms" v={ch.terms} />
      <RowLine l={`${DATA.meta.this_short} sales`} v={money(store.sales_this)} />
      <RowLine l={`${DATA.meta.prior_short} sales`} v={money(store.sales_prior)} />
      <RowLine l="Change" v={<span style={{ color }}>{money(delta)} ({store.sales_prior ? pct1(changePct(store.sales_this, store.sales_prior)) : '—'})</span>} />
      <div style={{ ...lbl, margin: '16px 0 8px' }}>Open invoices</div>
      {store.open_invoices.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No open invoices</div>
      ) : (
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Invoice</th>
              <th className="pop-th">Date</th>
              <th className="pop-th pop-th--r">Amount</th>
              <th className="pop-th pop-th--r">Age</th>
            </tr>
          </thead>
          <tbody>
            {store.open_invoices.map((inv) => (
              <tr key={inv.invoice}>
                <td className="pop-td">{inv.invoice}</td>
                <td className="pop-td">{fmtD(inv.date)}</td>
                <td className="pop-td pop-td--r">{money(inv.amount)}</td>
                <td className="pop-td pop-td--r" style={{ color: inv.age_days > 60 ? RED : INK }}>{inv.age_days} days</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td" colSpan={2}>Owed</td>
              <td className="pop-td pop-td--r">{money(owed)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </DetailShell>
  )
}

export function ChannelDetail({ channelId, onBack, onOrder, onProductLine, onStore, card, big, lbl }) {
  const ch = DATA.channels.find((c) => c.id === channelId)
  if (!ch) return null
  const th = { className: 'pop-th' }
  const thr = { className: 'pop-th pop-th--r' }
  if (ch.id === 'wholesale') {
    const thisT = channelTotal(ch)
    const priorT = channelPrior(ch)
    const sheetRows = ch.stores.map((s) => ({
      key: s.name,
      label: s.name,
      this: s.sales_this,
      prior: s.sales_prior,
      meta: s,
    }))
    return (
      <DetailShell title={ch.name} onBack={onBack} card={card} big={big}>
        <div className="pop-compare-mobile pop-wholesale-mobile">
          <CompareSheet
            thisCol={DATA.meta.this_short}
            priorCol={DATA.meta.prior_short}
            changeCol="Change"
            rows={sheetRows}
            footer={{ label: 'Total', this: thisT, prior: priorT }}
            onRow={(r) => onStore?.(r.meta.name)}
          />
        </div>
        <div className="pop-channel-table-wrap pop-wholesale-desktop">
          <table className="pop-table">
            <thead>
              <tr>
                <th className="pop-th">Store</th>
                <th className="pop-th pop-th--r">{DATA.meta.this_short}</th>
                <th className="pop-th pop-th--r">{DATA.meta.prior_short}</th>
                <th className="pop-th pop-th--r">Change</th>
              </tr>
            </thead>
            <tbody>
              {ch.stores.map((s) => {
                const d = s.sales_this - s.sales_prior
                return (
                  <ClickRow key={s.name} onClick={() => onStore?.(s.name)}>
                    <td className="pop-td"><span className="pop-client-name" style={{ fontWeight: 600, fontSize: 13, marginBottom: 0 }}>{s.name}</span></td>
                    <td className="pop-td pop-td--r">{money(s.sales_this)}</td>
                    <td className="pop-td pop-td--r">{money(s.sales_prior)}</td>
                    <td className="pop-td pop-td--r" style={{ color: changeColor(d) }}>{money(d)}</td>
                  </ClickRow>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="pop-tfoot">
                <td className="pop-td">Total</td>
                <td className="pop-td pop-td--r">{money(thisT)}</td>
                <td className="pop-td pop-td--r">{money(priorT)}</td>
                <td className="pop-td pop-td--r" style={{ color: changeColor(thisT - priorT) }}>{money(thisT - priorT)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DetailShell>
    )
  }
  if (ch.id === 'corporate') {
    const renderBlock = (title, rows) => (
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>{title}</div>
        <table className="pop-table pop-corp-detail-table">
          <thead>
            <tr>
              <th {...th}>Client</th>
              <th {...th}>Tier</th>
              <th {...thr}>Units</th>
              <th {...thr}>Amount</th>
              <th {...thr}>Shipped</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="pop-td pop-corp-client">
                  <div className="pop-client-name">{r.client}</div>
                  <div className="pop-order-sub">{tierShort(r.tier)} · Shipped {fmtD(r.shipped)}</div>
                </td>
                <td className="pop-td pop-corp-hide-phone">{tierShort(r.tier)}</td>
                <td className="pop-td pop-td--r" data-label="Units">{fmtInt(r.units)}</td>
                <td className="pop-td pop-td--r" data-label="Amount">{money(r.amount)}</td>
                <td className="pop-td pop-td--r pop-corp-hide-phone">{fmtD(r.shipped)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td" colSpan={2}>Total</td>
              <td className="pop-td pop-td--r">{fmtInt(sumBy(rows, 'units'))}</td>
              <td className="pop-td pop-td--r">{money(sumBy(rows, 'amount'))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    )
    return (
      <DetailShell title={`${ch.name} · shipped`} onBack={onBack} card={card} big={big}>
        {renderBlock(`${DATA.meta.this_short} 2026`, ch.shipped_this)}
        {renderBlock(`${DATA.meta.prior_short} 2026`, ch.shipped_prior)}
      </DetailShell>
    )
  }
  const thisT = channelTotal(ch)
  const priorT = channelPrior(ch)
  if (!ch.lines) return null
  const sheetRows = ch.lines.map((ln) => ({
    key: ln.label,
    label: ln.label,
    this: ln.this,
    prior: ln.prior,
    meta: ln,
  }))
  return (
    <DetailShell title={ch.name} onBack={onBack} card={card} big={big}>
      <div className="pop-channel-table-wrap">
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Product</th>
              <th className="pop-th pop-th--r">{DATA.meta.this_short}</th>
              <th className="pop-th pop-th--r">{DATA.meta.prior_short}</th>
              <th className="pop-th pop-th--r">Change</th>
            </tr>
          </thead>
          <tbody>
            {ch.lines.map((ln) => {
              const d = ln.this - ln.prior
              const color = changeColor(d, { cost: false })
              return (
                <ClickRow
                  key={ln.label}
                  onClick={() =>
                    onProductLine?.({
                      channel: ch.name,
                      label: ln.label,
                      this: ln.this,
                      prior: ln.prior,
                    })
                  }
                >
                  <td className="pop-td">{ln.label}</td>
                  <td className="pop-td pop-td--r">{money(ln.this)}</td>
                  <td className="pop-td pop-td--r">{money(ln.prior)}</td>
                  <td className="pop-td pop-td--r" style={{ color }}>{money(d)}</td>
                </ClickRow>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td">Total</td>
              <td className="pop-td pop-td--r">{money(thisT)}</td>
              <td className="pop-td pop-td--r">{money(priorT)}</td>
              <td className="pop-td pop-td--r" style={{ color: changeColor(thisT - priorT) }}>{money(thisT - priorT)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="pop-compare-mobile">
        <CompareSheet
          thisCol={DATA.meta.this_short}
          priorCol={DATA.meta.prior_short}
          changeCol="Change"
          rows={sheetRows}
          footer={{ label: 'Total', this: thisT, prior: priorT }}
          onRow={(r) =>
            onProductLine?.({
              channel: ch.name,
              label: r.meta.label,
              this: r.meta.this,
              prior: r.meta.prior,
            })
          }
        />
      </div>
    </DetailShell>
  )
}

export function DayDetail({ date, items, onBack, onOrder, card, big }) {
  const total = sumBy(items, 'amount')
  return (
    <DetailShell title={fmtD(date)} onBack={onBack} card={card} big={big}>
      {items.map((it, i) => (
        <div
          key={i}
          role="button"
          tabIndex={0}
          className="pop-click"
          onClick={() => onOrder(it.orderId)}
          onKeyDown={(e) => e.key === 'Enter' && onOrder(it.orderId)}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer' }}
        >
          <div>
            <div className="pop-client-name" style={{ fontSize: 14 }}>{it.client}</div>
            <div style={{ fontSize: 12, color: MUTED }}>{it.type}</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13 }}>{money(it.amount)}</div>
        </div>
      ))}
      <RowLine l="Total" v={money(total)} bold />
    </DetailShell>
  )
}

export function StoresListDetail({ onBack, onStore, card, big }) {
  const ws = wholesaleStats()
  const footer = {
    salesThis: sumBy(ws.stores, 'sales_this'),
    salesPrior: sumBy(ws.stores, 'sales_prior'),
    owed: sumBy(ws.stores, 'owed'),
  }
  return (
    <DetailShell title="Stores carrying" onBack={onBack} card={card} big={big}>
      <div style={{ overflowX: 'auto' }}>
        <div className="pop-order-table-wrap">
          <table className="pop-table">
            <thead>
              <tr>
                <th className="pop-th">Store</th>
                <th className="pop-th">Area</th>
                <th className="pop-th pop-th--r">Oct sales</th>
                <th className="pop-th pop-th--r">Sep sales</th>
                <th className="pop-th pop-th--r">Owed</th>
                <th className="pop-th pop-th--r">Oldest invoice</th>
              </tr>
            </thead>
            <tbody>
              {ws.stores.map((s) => {
                const oldest = storeOldestDays(s)
                return (
                  <ClickRow key={s.name} onClick={() => onStore(s.name)}>
                    <td className="pop-td"><span className="pop-client-name" style={{ fontWeight: 600, fontSize: 13, marginBottom: 0 }}>{s.name}</span></td>
                    <td className="pop-td">{s.area}</td>
                    <td className="pop-td pop-td--r">{money(s.sales_this)}</td>
                    <td className="pop-td pop-td--r">{money(s.sales_prior)}</td>
                    <td className="pop-td pop-td--r">{money(s.owed)}</td>
                    <td className="pop-td pop-td--r" style={{ color: oldest != null && oldest > 60 ? RED : INK }}>{oldest != null ? `${oldest} days` : '—'}</td>
                  </ClickRow>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="pop-tfoot">
                <td className="pop-td" colSpan={2}>Total</td>
                <td className="pop-td pop-td--r">{money(footer.salesThis)}</td>
                <td className="pop-td pop-td--r">{money(footer.salesPrior)}</td>
                <td className="pop-td pop-td--r">{money(footer.owed)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </DetailShell>
  )
}

export function StoreInvoiceListDetail({ title, filter, onBack, onStore, card, big }) {
  const rows = wholesaleInvoicesFiltered(filter)
  const total = sumBy(rows, 'amount')
  return (
    <DetailShell title={title} onBack={onBack} card={card} big={big}>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No open invoices</div>
      ) : (
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Store</th>
              <th className="pop-th">Invoice</th>
              <th className="pop-th">Date</th>
              <th className="pop-th pop-th--r">Amount</th>
              <th className="pop-th pop-th--r">Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <ClickRow key={`${inv.storeName}-${inv.invoice}`} onClick={() => onStore(inv.storeName)}>
                <td className="pop-td"><span className="pop-client-name" style={{ fontWeight: 600, fontSize: 13, marginBottom: 0 }}>{inv.storeName}</span></td>
                <td className="pop-td">{inv.invoice}</td>
                <td className="pop-td">{fmtD(inv.date)}</td>
                <td className="pop-td pop-td--r">{money(inv.amount)}</td>
                <td className="pop-td pop-td--r" style={{ color: inv.age_days > 60 ? RED : INK }}>{inv.age_days} days</td>
              </ClickRow>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td" colSpan={3}>Total</td>
              <td className="pop-td pop-td--r">{money(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </DetailShell>
  )
}

export function PnlLineDetail({ line, section, onBack, onChannel, card, big }) {
  const isRev = section === 'revenue'
  const delta = line.prior != null ? line.this - line.prior : null
  const color = changeColor(delta, { cost: !isRev })
  const channelId = PNL_CHANNEL_MAP[line.label]
  const channelLabel =
    line.label === 'Corporate gifts' ? 'Corporate' : line.label === 'Wholesale to stores' ? 'Wholesale' : line.label
  return (
    <DetailShell title={line.label} onBack={onBack} card={card} big={big}>
      <RowLine l="This month" v={money(line.this)} />
      <RowLine l="Prior month" v={money(line.prior)} />
      <RowLine l="Change" v={<span style={{ color }}>{money(delta)} ({delta != null && line.prior ? pct1(changePct(line.this, line.prior)) : '—'})</span>} />
      {isRev && channelId ? (
        <button
          type="button"
          className="pop-click"
          onClick={() => onChannel(channelId)}
          style={{ marginTop: 16, border: `1px solid ${BORDER}`, background: CARDBG, color: SPICE, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: '10px 14px', borderRadius: 2, width: '100%', textAlign: 'left' }}
        >
          Open {channelLabel} sales detail ›
        </button>
      ) : null}
    </DetailShell>
  )
}
