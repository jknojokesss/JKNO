import { DATA, allChannelSales, holidayTotals, allTierRows, cashByMonthKey, monthLabel, wholesaleStats } from './popinsanityComputed'
import { pnlComputed } from './popinsanityComputed'
import { KPI, RankedBars } from './PopinsanityShared'
import { money0, money, pct1, changePct, RED, GREEN, SPICE } from './popinsanityUtils'

export default function PopinsanityOverview({ styles, goTab, setCalendarMonth, openChannel, openTier }) {
  const { card, lbl, big } = styles
  const hol = holidayTotals()
  const ws = wholesaleStats()
  const sales = allChannelSales()
  const pnl = pnlComputed()
  const salesDelta = changePct(sales.thisMonth, sales.prior)
  const { map } = cashByMonthKey()

  const channelBars = sales.rows.map((r) => ({ key: r.id, label: r.name, value: r.this, id: r.id }))
  const cashBars = ['2026-10', '2026-11', '2026-12'].map((k) => ({
    key: k,
    label: monthLabel(k).replace(' 2026', ''),
    value: map[k].reduce((s, i) => s + i.amount, 0),
    monthKey: k,
  }))
  const tierBars = allTierRows()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => ({
      key: t.id,
      label: t.name.split(':')[0],
      value: t.marginPct,
      id: t.id,
    }))

  return (
    <>
      <div style={{ fontSize: '12px', color: '#8A7A66', marginBottom: '16px' }}>{DATA.meta.sample_label}</div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI
          card={card}
          lbl={lbl}
          big={big}
          k="Holiday orders booked"
          v={money0(hol.booked)}
          sub={`${hol.count} orders · ${hol.units.toLocaleString('en-US')} units`}
          onClick={() => goTab('orders')}
        />
        <KPI card={card} lbl={lbl} big={big} k="Deposits received" v={money0(hol.deposits)} onClick={() => goTab('orders')} />
        <KPI card={card} lbl={lbl} big={big} k="Balance due" v={money0(hol.balance)} onClick={() => goTab('orders')} />
        <KPI card={card} lbl={lbl} big={big} k="Owed by stores" v={money(ws.owed)} onClick={() => goTab('stores')} />
        <KPI
          card={card}
          lbl={lbl}
          big={big}
          k="Sales this month"
          v={money0(sales.thisMonth)}
          sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs ${DATA.meta.prior_short}`}
          accent={SPICE}
          onClick={() => goTab('sales')}
        />
        <KPI
          card={card}
          lbl={lbl}
          big={big}
          k={`Net profit · ${DATA.meta.this_short}`}
          v={money0(pnl.net)}
          accent={pnl.net < 0 ? RED : GREEN}
          onClick={() => goTab('financials')}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <RankedBars
          card={card}
          lbl={lbl}
          big={big}
          title={`Sales by channel · ${DATA.meta.this_short}`}
          rows={channelBars}
          onRow={(r) => openChannel(r.id)}
        />
        <RankedBars
          card={card}
          lbl={lbl}
          big={big}
          title="Cash due by month"
          rows={cashBars}
          preserveOrder
          onRow={(r) => {
            setCalendarMonth(r.monthKey)
            goTab('calendar')
          }}
        />
        <RankedBars
          card={card}
          lbl={lbl}
          big={big}
          title="Margin by tier"
          rows={tierBars}
          preserveOrder
          formatValue={(v) => pct1(v)}
          onRow={(r) => openTier(r.id)}
        />
      </div>
    </>
  )
}
