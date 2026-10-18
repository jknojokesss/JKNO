import {
  DATA,
  tierById,
  tierStats,
  channelTotal,
  channelPrior,
  pnlComputed,
} from './popinsanityComputed'
import { DetailShell, RowLine, ClickRow } from './PopinsanityShared'
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
  MUTED,
  INK,
  BORDER,
  CREAM,
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
              <td className="pop-td">{o.client}</td>
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

export function ChannelDetail({ channelId, onBack, onOrder, onProductLine, card, big, lbl }) {
  const ch = DATA.channels.find((c) => c.id === channelId)
  if (!ch) return null
  const th = { className: 'pop-th' }
  const thr = { className: 'pop-th pop-th--r' }
  if (ch.id === 'corporate') {
    const renderBlock = (title, rows) => (
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>{title}</div>
        <table className="pop-table">
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
                <td className="pop-td">{r.client}</td>
                <td className="pop-td">{tierShort(r.tier)}</td>
                <td className="pop-td pop-td--r">{fmtInt(r.units)}</td>
                <td className="pop-td pop-td--r">{money(r.amount)}</td>
                <td className="pop-td pop-td--r">{fmtD(r.shipped)}</td>
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
  return (
    <DetailShell title={ch.name} onBack={onBack} card={card} big={big}>
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
            <div style={{ fontWeight: 600, fontSize: 14, color: INK }}>{it.client}</div>
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
  const channelMap = { Online: 'online', Store: 'store', 'Corporate gifts': 'corporate' }
  return (
    <DetailShell title={line.label} onBack={onBack} card={card} big={big}>
      <RowLine l={DATA.meta.this_month} v={money(line.this)} />
      <RowLine l={DATA.meta.prior_month} v={money(line.prior)} />
      <RowLine l="Change" v={<span style={{ color }}>{money(delta)} ({delta != null && line.prior ? pct1(changePct(line.this, line.prior)) : '—'})</span>} />
      {isRev && channelMap[line.label] ? (
        <button
          type="button"
          className="pop-click"
          onClick={() => onChannel(channelMap[line.label])}
          style={{ marginTop: 16, border: 'none', background: 'none', color: SPICE, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          Open {line.label} sales detail ›
        </button>
      ) : null}
    </DetailShell>
  )
}
