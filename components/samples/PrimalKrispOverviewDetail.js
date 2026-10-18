import DATA from '../../data/primal-krisp.json'
import { getDueToReorderStores } from './primal-krisp/primalKrispReorderData'
import { openInvoiceTotal, daysBetween, AS_OF } from './primalKrispStoreBilling'
import { BORDER, INK, MUTED, UI, MONO, money, money0, fmtInt, pct1, fmtD } from './primalKrispUtils'
import { allocateWholeDollars } from './sampleWholeDollarDisplay.js'

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
  const displays =
    totalLabel != null && totalValue != null
      ? allocateWholeDollars(rows.map((r) => r.value), totalValue)
      : null
  const fmt = (v, i) => (displays ? money0(displays[i]) : format(v))
  const fmtTotal = totalValue != null ? money0(totalValue) : null
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 14px' }}>
      {rows.map((r, i) => (
        <div key={r.key || r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13 }}>
          <span style={{ color: INK }}>{r.label}</span>
          <span style={{ fontFamily: MONO }}>{fmt(r.value, i)}</span>
        </div>
      ))}
      {totalLabel != null ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 13 }}>
          <span>{totalLabel}</span>
          <span style={{ fontFamily: MONO }}>{fmtTotal ?? format(totalValue)}</span>
        </div>
      ) : null}
    </div>
  )
}

export default function PrimalKrispOverviewDetail({ detail, onBack, onClose, storeList, openStoreBalance }) {
  const ov = DATA.overview
  const shell = { onBack, onClose }

  if (detail.kind === 'tableTotal') {
    const format = detail.format || money0
    return (
      <Shell title={`Total ${detail.tableName}`} sub={detail.tableName} {...shell}>
        <Lines rows={detail.rows} totalLabel="Total" totalValue={detail.total} format={format} />
      </Shell>
    )
  }

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

  if (detail.kind === 'monthEndSource') {
    const mc = DATA.monthly_close
    const row = (mc.september_sales_sources || []).find((r) => r.id === detail.id)
    if (!row) return null
    const label = `${row.label} from ${row.from}`
    return (
      <Shell title={money(row.amount)} sub={label} {...shell}>
        <Lines rows={[{ label, value: row.amount }]} totalLabel="Total" totalValue={row.amount} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'monthEndSalesTotal') {
    const mc = DATA.monthly_close
    const rows = (mc.september_sales_sources || []).map((r) => ({
      label: `${r.label} from ${r.from}`,
      value: r.amount,
      key: r.id,
    }))
    return (
      <Shell title="Total Where September's sales came from" sub={money(mc.total_sales)} {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={mc.total_sales} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'monthEndCogs') {
    const mc = DATA.monthly_close
    const sep = DATA.pnl_by_month?.find((m) => m.month === '2026-09')
    const rows = (sep?.cogs_entries || []).map((e) => ({ label: e.l, value: e.n, key: e.l }))
    const total = mc.cost_of_goods
    return (
      <Shell title={money(total)} sub="Cost of goods" {...shell}>
        <Lines rows={rows.length ? rows : [{ label: 'September COGS', value: total }]} totalLabel="Total" totalValue={total} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'monthEndGrossProfit') {
    const mc = DATA.monthly_close
    const rows = [
      { label: 'Total sales', value: mc.total_sales, key: 'sales' },
      { label: 'Cost of goods', value: -mc.cost_of_goods, key: 'cogs' },
    ]
    return (
      <Shell title={money(mc.gross_profit)} sub="Gross profit" {...shell}>
        <Lines rows={rows} totalLabel="Gross profit" totalValue={mc.gross_profit} format={money} />
      </Shell>
    )
  }

  if (detail.kind === 'monthEndStoreOwed') {
    const owing = storeList.filter((s) => openInvoiceTotal(s) > 0).sort((a, b) => openInvoiceTotal(b) - openInvoiceTotal(a))
    const total = openStoreBalance ?? DATA.monthly_close.store_owed_at_month_end
    const rows = owing.map((s) => ({ label: s.name, value: openInvoiceTotal(s), key: s.name }))
    return (
      <Shell title={money0(total)} sub="Owed by stores at month end" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'prodRun') {
    const r = DATA.production_runs.find((x) => x.run === detail.run)
    if (!r) return null
    const product = DATA.products.find((p) => p.name === r.product)
    const cost = product?.fictitious?.cost_per_bag
    const metricRows = [
      { label: 'Date', value: fmtD(r.date) },
      { label: 'Product', value: r.product },
      { label: 'Raw meat (lbs)', value: fmtInt(r.raw_meat_lbs) },
      { label: 'Bags planned', value: fmtInt(r.bags_planned) },
      { label: 'Bags packed', value: r.bags_packed != null ? fmtInt(r.bags_packed) : '—' },
      { label: 'Yield vs plan', value: r.yield_vs_plan_pct != null ? pct1(r.yield_vs_plan_pct) : '—' },
    ]
    const costRows = cost
      ? Object.entries(cost)
          .filter(([k]) => k !== 'total')
          .map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: v, key: k }))
      : []
    return (
      <Shell title={r.run} sub="Production run" {...shell}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 14px', marginBottom: costRows.length ? 14 : 0 }}>
          {metricRows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13 }}>
              <span>{row.label}</span>
              <span style={{ fontFamily: MONO }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 13 }}>
            <span>Cost per bag</span>
            <span style={{ fontFamily: MONO }}>{r.cost_per_bag != null ? money(r.cost_per_bag) : '—'}</span>
          </div>
        </div>
        {costRows.length ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>Cost per bag breakdown</div>
            <Lines rows={costRows} totalLabel="Cost per bag" totalValue={cost?.total ?? r.cost_per_bag} format={money} />
          </>
        ) : null}
      </Shell>
    )
  }

  if (detail.kind === 'promoCode') {
    const p = DATA.promo_codes.find((c) => c.code === detail.code)
    if (!p) return null
    const promoRows = [
      { label: 'Spend', display: money(p.spend) },
      { label: 'Orders', display: fmtInt(p.orders) },
      { label: 'Revenue', display: money(p.revenue) },
    ]
    return (
      <Shell title={p.code} sub="Promo code" {...shell}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '4px 14px' }}>
          {promoRows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13 }}>
              <span>{row.label}</span>
              <span style={{ fontFamily: MONO }}>{row.display}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 13 }}>
            <span>Return per $1</span>
            <span style={{ fontFamily: MONO }}>{p.return_per_dollar.toFixed(1)}</span>
          </div>
        </div>
      </Shell>
    )
  }

  if (detail.kind === 'storeOwedCard') {
    const owing = storeList.filter((s) => openInvoiceTotal(s) > 0).sort((a, b) => openInvoiceTotal(b) - openInvoiceTotal(a))
    const total = openStoreBalance ?? owing.reduce((s, st) => s + openInvoiceTotal(st), 0)
    const rows = owing.map((s) => ({ label: s.name, value: openInvoiceTotal(s), key: s.name }))
    return (
      <Shell title={money0(total)} sub="Owed by stores" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
      </Shell>
    )
  }

  if (detail.kind === 'storePast60Card') {
    const rows = []
    let total = 0
    for (const st of storeList) {
      let amt = 0
      for (const inv of st.sample.invoices || []) {
        if (inv.status !== 'Open') continue
        if (daysBetween(inv.issued, AS_OF) > 60) amt += inv.amount
      }
      amt = Math.round(amt * 100) / 100
      if (amt > 0) {
        rows.push({ label: st.name, value: amt, key: st.name })
        total += amt
      }
    }
    total = Math.round(total * 100) / 100
    rows.sort((a, b) => b.value - a.value)
    return (
      <Shell title={money0(total)} sub="Past 60 days" {...shell}>
        <Lines rows={rows} totalLabel="Total" totalValue={total} />
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
