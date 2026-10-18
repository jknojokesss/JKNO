import DATA from '../../data/primal-krisp.json'
import { getDueToReorderStores } from './primal-krisp/primalKrispReorderData'
import { BORDER, INK, MUTED, UI, MONO, money, money0, fmtInt } from './primalKrispUtils'

function Shell({ title, sub, onBack, children }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button type="button" className="pk-click" onClick={onBack} style={{ border: `1px solid ${BORDER}`, background: 'transparent', padding: '8px 12px', fontFamily: UI, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back
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

export default function PrimalKrispOverviewDetail({ detail, onBack, storeList, openStoreBalance }) {
  const ov = DATA.overview

  if (detail.kind === 'cash') {
    const checking = Math.round((ov.cash_on_hand - ov.open_store_balance) * 100) / 100
    const rows = [
      { label: 'Business checking', value: checking },
      { label: 'Undeposited store payments', value: ov.open_store_balance },
    ]
    return (
      <Shell title={money0(ov.cash_on_hand)} sub="Cash on hand" onBack={onBack}>
        <Lines rows={rows} totalLabel="Total" totalValue={ov.cash_on_hand} />
      </Shell>
    )
  }

  if (detail.kind === 'sales') {
    const rows = detail.rows.map((c) => ({ label: c.channel, value: c.sales }))
    return (
      <Shell title={money0(detail.total)} sub={detail.periodLabel} onBack={onBack}>
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
      <Shell title={fmtInt(total)} sub={detail.periodLabel} onBack={onBack}>
        <Lines rows={rows} totalLabel="Total bags" totalValue={total} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'subs') {
    const subs = DATA.subscriptions
    const rows = subs.by_interval.map((r) => ({ label: r.interval, value: r.active }))
    return (
      <Shell title={String(subs.active)} sub="Active subscriptions" onBack={onBack}>
        <Lines rows={rows} totalLabel="Total" totalValue={subs.active} format={(v) => fmtInt(v)} />
      </Shell>
    )
  }

  if (detail.kind === 'owed') {
    const owing = storeList.filter((s) => (s.sample?.open_balance || 0) > 0).sort((a, b) => b.sample.open_balance - a.sample.open_balance)
    const total = openStoreBalance ?? ov.open_store_balance
    const rows = owing.map((s) => ({ label: s.name, value: s.sample.open_balance, key: s.name }))
    return (
      <Shell title={money0(total)} sub="Owed by stores" onBack={onBack}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'reorder') {
    const due = getDueToReorderStores(DATA)
    const rows = due.map((s) => ({ label: s.store_name, value: s.days_over, key: s.store_name }))
    return (
      <Shell title={`${due.length} stores`} sub="Due to reorder" onBack={onBack}>
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
      <Shell title={money0(rev)} sub={detail.name} onBack={onBack}>
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
      <Shell title={`${fmtInt(bags)} bags`} sub={detail.name} onBack={onBack}>
        <Lines rows={rows} totalLabel="Total bags" totalValue={bags} format={(v) => fmtInt(v)} />
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
      <Shell title={money0(p.net_profit)} sub="Net profit · September" onBack={onBack}>
        <Lines rows={rows.slice(0, -1)} totalLabel="Net profit" totalValue={p.net_profit} format={money} />
      </Shell>
    )
  }

  return null
}
