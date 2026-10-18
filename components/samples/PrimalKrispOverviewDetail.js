import DATA from '../../data/primal-krisp.json'
import { getDueToReorderStores } from './primal-krisp/primalKrispReorderData'
import { BORDER, INK, MUTED, UI, MONO, money, money0, fmtInt, pct1, fmtD } from './primalKrispUtils'

function Shell({ title, sub, onBack, onClose, children }) {
  const close = onClose || onBack
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button type="button" className="pk-click" onClick={onBack} style={{ border: `1px solid ${BORDER}`, background: 'transparent', padding: '8px 12px', fontFamily: UI, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back
        </button>
        <button type="button" className="pk-click" onClick={close} style={{ border: `1px solid ${BORDER}`, background: 'transparent', padding: '8px 12px', fontFamily: UI, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Close
        </button>
      </div>
      <div style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: MUTED }}>{sub}</div>
      <h2 style={{ fontFamily: UI, fontWeight: 700, fontSize: 22, color: INK, margin: '4px 0 16px' }}>{title}</h2>
      {children}
    </>
  )
}

function Lines({ rows, totalLabel, totalValue, format = money0 }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 14px' }}>
      {rows.map((r, i) => (
        <div key={r.key || r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13 }}>
          <span style={{ color: INK }}>{r.label}</span>
          <span style={{ fontFamily: MONO }}>{format(r.value)}</span>
        </div>
      ))}
      {totalLabel != null ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 13 }}>
          <span>{totalLabel}</span>
          <span style={{ fontFamily: MONO }}>{format(totalValue)}</span>
        </div>
      ) : null}
    </div>
  )
}

export default function PrimalKrispOverviewDetail({ detail, onBack, onClose, storeList, openStoreBalance }) {
  const ov = DATA.overview
  const shell = { onBack, onClose }

  if (detail.kind === 'cash') {
    const checking = Math.round((ov.cash_on_hand - ov.open_store_balance) * 100) / 100
    const rows = [
      { label: 'Business checking', value: checking },
      { label: 'Undeposited store payments', value: ov.open_store_balance },
    ]
    return (
      <Shell title={money0(ov.cash_on_hand)} sub="Cash on hand" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={ov.cash_on_hand} />
      </Shell>
    )
  }

  if (detail.kind === 'sales') {
    const rows = detail.rows.map((c) => ({ label: c.channel, value: c.sales }))
    return (
      <Shell title={money0(detail.total)} sub={detail.periodLabel} {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={detail.total} />
      </Shell>
    )
  }

  if (detail.kind === 'bags') {
    const rows = detail.products
      .sort((a, b) => b.bags - a.bags)
      .map((p) => ({ label: p.name, value: p.bags, key: p.name }))
    const total = detail.total
    return (
      <Shell title={fmtInt(total)} sub={detail.periodLabel} {...shell}>
        <Lines rows={rows} totalLabel="Total bags" totalValue={total} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'subs') {
    const subs = DATA.subscriptions
    const rows = subs.by_interval.map((r) => ({ label: r.interval, value: r.active }))
    return (
      <Shell title={String(subs.active)} sub="Active subscriptions" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={subs.active} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'owed') {
    const owing = storeList.filter((s) => (s.sample?.open_balance || 0) > 0).sort((a, b) => b.sample.open_balance - a.sample.open_balance)
    const total = openStoreBalance ?? ov.open_store_balance
    const rows = owing.map((s) => ({ label: s.name, value: s.sample.open_balance, key: s.name }))
    return (
      <Shell title={money0(total)} sub="Owed by stores" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'reorder') {
    const due = getDueToReorderStores(DATA)
    const rows = due.map((s) => ({ label: s.store_name, value: s.days_over, key: s.store_name }))
    return (
      <Shell title={`${due.length} stores`} sub="Due to reorder" {...shell}>
        <Lines rows={rows} totalLabel="Stores" totalValue={due.length} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'store') {
    const st = DATA.stores.list.find((s) => s.name === detail.name)
    const rev = st?.sample?.sales_sept || 0
    const rows = []
    for (const br of DATA.product_store_breakdown || []) {
      const storeRow = br.stores?.find((x) => x.store === detail.name)
      if (storeRow?.dollars) rows.push({ label: br.product, value: storeRow.dollars })
    }
    const lineSum = Math.round(rows.reduce((s, r) => s + r.value, 0) * 100) / 100
    const show = rows.length ? rows : [{ label: 'September sales', value: rev }]
    const total = rows.length ? lineSum : rev
    return (
      <Shell title={money0(rev)} sub={detail.name} {...shell}>
        <Lines rows={show} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'flavor') {
    const p = DATA.product_margins_by_channel.find((x) => x.product === detail.name)
    const bags = p?.bags_sold_sept_all_channels || 0
    const rows = Object.entries(p?.channels || {})
      .map(([ch, v]) => ({ label: ch, value: v.bags_sold_sept || 0 }))
      .filter((r) => r.value > 0)
    return (
      <Shell title={`${fmtInt(bags)} bags`} sub={detail.name} {...shell}>
        <Lines rows={rows} totalLabel="Total bags" totalValue={bags} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'subChannel') {
    const col = detail.channel === 'Website' ? 'Website' : 'Subscriptions'
    const rows = (DATA.weekly_in_september || []).map((w) => ({ label: w.label, value: w[col] || 0, key: w.week_of }))
    const total = Math.round(rows.reduce((s, r) => s + r.value, 0) * 100) / 100
    return (
      <Shell title={money0(total)} sub={`${detail.channel} · September`} {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'subChurn') {
    const subs = DATA.subscriptions
    const rows = subs.cancel_reasons.map((r) => ({ label: r.reason, value: r.count, key: r.reason }))
    const total = rows.reduce((s, r) => s + r.value, 0)
    return (
      <Shell title={pct1(subs.churn_sept_pct)} sub="September churn" {...shell}>
        <Lines rows={rows} totalLabel="Cancellations" totalValue={total} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'subFailed') {
    const fp = DATA.subscriptions.failed_payments_open
    const each = fp.count > 0 ? Math.round((fp.amount / fp.count) * 100) / 100 : 0
    const rows = Array.from({ length: fp.count }, (_, i) => ({
      label: `Failed payment ${i + 1}`,
      value: each,
      key: `fp-${i}`,
    }))
    return (
      <Shell title={money0(fp.amount)} sub="Failed payments" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={fp.amount} />
      </Shell>
    )
  }

  if (detail.kind === 'subMonthly') {
    const rows = DATA.subscriptions.monthly.map((m) => ({
      label: m.month,
      value: m.active,
      key: m.month,
    }))
    const last = DATA.subscriptions.monthly[DATA.subscriptions.monthly.length - 1]
    return (
      <Shell title={fmtInt(last?.active || 0)} sub="Active subscribers" {...shell}>
        <Lines rows={rows} totalLabel="Latest month" totalValue={last?.active || 0} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'subRenewals') {
    const rows = DATA.subscriptions.renewals_next_14_days.map((d) => ({
      label: fmtD(d.date),
      value: d.amount,
      key: d.date,
    }))
    const total = DATA.subscriptions.renewals_next_14_days_total
    return (
      <Shell title={money0(total)} sub="Renewals · next 14 days" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'subBar') {
    const rows = detail.rows.map((r) => ({ label: r.label, value: r.value, key: r.label }))
    return (
      <Shell title={detail.formatTitle(detail.total)} sub={detail.sub} {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={detail.total} format={detail.format || ((v) => fmtInt(v))} />
      </Shell>
    )
  }

  if (detail.kind === 'closeIncome') {
    const mc = DATA.monthly_close
    const rows = Object.entries(mc.income_to_post).map(([k, v]) => ({ label: k, value: v, key: k }))
    return (
      <Shell title={money(mc.income_to_post_total)} sub="Income to post" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={mc.income_to_post_total} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'closeIncomeLine') {
    const v = DATA.monthly_close.income_to_post[detail.key]
    return (
      <Shell title={money(v)} sub={detail.key} {...shell}>
        <Lines rows={[{ label: detail.key, value: v }]} totalLabel="Total" totalValue={v} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'closeCogs') {
    const c = DATA.monthly_close.cogs_to_post
    const rows = [
      { label: 'Bags', value: c.bags },
      { label: 'Amount at cost', value: c.amount },
    ]
    return (
      <Shell title={money(c.amount)} sub="COGS to post" {...shell}>
        <Lines rows={[{ label: 'Bags', value: c.bags }]} totalLabel="COGS" totalValue={c.amount} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'closeBooked') {
    const booked = DATA.monthly_close.booked_through_shopify_do_not_reenter
    const rows = Object.entries(booked).map(([k, v]) => ({ label: k, value: v, key: k }))
    const total = rows.reduce((s, r) => s + r.value, 0)
    return (
      <Shell title={money0(total)} sub="Booked elsewhere" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'closeBookedLine') {
    const v = DATA.monthly_close.booked_through_shopify_do_not_reenter[detail.key]
    return (
      <Shell title={money0(v)} sub={detail.key} {...shell}>
        <Lines rows={[{ label: detail.key, value: v }]} totalLabel="Total" totalValue={v} />
      </Shell>
    )
  }

  if (detail.kind === 'closeAR') {
    const owing = storeList.filter((s) => (s.sample?.open_balance || 0) > 0).sort((a, b) => b.sample.open_balance - a.sample.open_balance)
    const total = openStoreBalance ?? DATA.monthly_close.ar_open_at_month_end
    const rows = owing.map((s) => ({ label: s.name, value: s.sample.open_balance, key: s.name }))
    return (
      <Shell title={money0(total)} sub="AR at month end" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'closeJournal') {
    const je = DATA.monthly_close.journal_entries_preview[detail.index]
    const rows = [
      { label: `Debit · ${je.debit}`, value: je.amount },
      { label: `Credit · ${je.credit}`, value: je.amount },
    ]
    return (
      <Shell title={money(je.amount)} sub={je.memo} {...shell}>
        <Lines rows={rows} totalLabel="Amount" totalValue={je.amount} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'netProfit') {
    const p = DATA.pnl_by_month.find((m) => m.month === '2026-09')
    if (!p) return null
    const rows = [
      { label: 'Revenue', value: p.revenue_total },
      { label: 'Cost of goods sold', value: -p.cogs },
      { label: 'Gross profit', value: p.gross_profit },
      ...p.operating_expenses_entries.map((e) => ({ label: e.l, value: -e.n })),
      { label: 'Net profit', value: p.net_profit },
    ]
    return (
      <Shell title={money0(p.net_profit)} sub="Net profit · September" {...shell}>
        <Lines rows={rows.slice(0, -1)} totalLabel="Net profit" totalValue={p.net_profit} format={money} />
      </Shell>
    )
  }

  return null
}
