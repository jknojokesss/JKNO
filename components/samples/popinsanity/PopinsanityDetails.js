import {
  DATA,
  tierById,
  tierStats,
  channelTotal,
  channelPrior,
  storeByName,
  wholesaleChannel,
  PNL_CHANNEL_MAP,
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

export function OrderDetail({ orderId, onBack, onTier, onClient, card, big, lbl }) {
  const o = DATA.holiday_orders.find((x) => x.id === orderId)
  if (!o) return null
  const tier = tierById[o.tier]
  const cashSum = sumBy(o.cash_due, 'amount')
  const depositDue = o.cash_due.find((c) => c.type === 'Deposit')
  return (
    <DetailShell title={o.client} onBack={onBack} card={card} big={big}>
      <RowLine l="Order" v={o.id} />
      <RowLine
        l="Tier"
        v={
          <button type="button" onClick={() => onTier(o.tier)} style={{ border: 'none', background: 'none', color: SPICE, fontWeight: 600, cursor: 'pointer', fontFamily: MONO, fontSize: 13, padding: 0 }}>
            {tier.name}
          </button>
        }
      />
      <div style={{ fontSize: '12px', color: MUTED, marginBottom: 8 }}>{tier.contents}</div>
      <RowLine l="Units × price" v={`${fmtInt(o.units)} × ${money(o.price)} = ${money(o.units * o.price)}`} />
      <RowLine l="Booked" v={fmtD(o.booked)} />
      <RowLine l="Ship date" v={fmtD(o.ship_date)} />
      <RowLine l="Deposit" v={`${o.deposit_pct}% · ${money(o.deposit_amount)}`} />
      <RowLine
        l="Deposit received"
        v={
          o.deposit_received > 0
            ? `${money(o.deposit_received)} · ${fmtD(o.deposit_date)}`
            : depositDue
              ? `Not received, due ${fmtD(depositDue.date)}`
              : 'Not received'
        }
      />
      <div style={{ marginTop: 12, ...lbl, marginBottom: 6 }}>Cash due</div>
      {o.cash_due.map((c, i) => (
        <RowLine key={i} l={`${fmtD(c.date)} · ${c.type}`} v={money(c.amount)} />
      ))}
      <RowLine l="Balance due" v={money(cashSum)} bold />
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

export function PnlLineDetail({ line, section, onBack, onChannel, card, big }) {
  const isRev = section === 'revenue'
  const delta = line.prior != null ? line.this - line.prior : null
  const color = changeColor(delta, { cost: !isRev })
  const channelId = PNL_CHANNEL_MAP[line.label]
  const channelLabel =
    line.label === 'Corporate gifts' ? 'Corporate' : line.label === 'Wholesale to stores' ? 'Wholesale' : line.label
  return (
    <DetailShell title={line.label} onBack={onBack} card={card} big={big}>
      <RowLine l={DATA.meta.this_month} v={money(line.this)} />
      <RowLine l={DATA.meta.prior_month} v={money(line.prior)} />
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
