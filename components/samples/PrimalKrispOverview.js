import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import DATA from '../../data/primal-krisp.json'
import {
  SPICE,
  KRAFT,
  GREEN,
  CHAR,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  AMBER,
  UI,
  MONO,
  money0,
  pct1,
  BagIcon,
  CHANNEL_COLORS,
} from './primalKrispUtils'

const CHANNELS = DATA.channels
const BAG_COLORS = [SPICE, KRAFT, GREEN, '#8A5A2B', '#6B5B4F']

export default function PrimalKrispOverview({
  card,
  lbl,
  big,
  KPI,
  period,
  setPeriod,
  salesPeriod,
  salesPrior,
  salesDelta,
  bagsPeriod,
  channelRowsPeriod,
  goTab,
  goStoresFilter,
}) {
  const septPnl = DATA.pnl_by_month?.find((m) => m.month === '2026-09') || DATA.pnl_by_month?.slice(-1)[0]
  const chartMonths = (DATA.pnl_by_month || []).map((m) => ({
    name: m.label.replace(/ \d{2}$/, ''),
    Revenue: m.revenue_total,
    Net: m.net_profit,
  }))
  const donut = channelRowsPeriod.map((c) => ({ name: c.channel, value: c.sales }))
  const topStores = [...DATA.stores.list]
    .map((s) => ({ name: s.name, rev: s.sample.sales_sept || 0, bal: s.sample.open_balance || 0 }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 6)
  const topFlavors = [...DATA.product_margins_by_channel]
    .map((p) => ({ name: p.product, bags: p.bags_sold_sept_all_channels }))
    .sort((a, b) => b.bags - a.bags)
    .slice(0, 6)
  const monthBags = DATA.overview.bags_sold_this_month
  const products = DATA.product_margins_by_channel.map((p, i) => {
    const month = p.bags_sold_sept_all_channels
    const week = Math.round(month * (bagsPeriod / monthBags))
    return {
      name: p.product,
      color: BAG_COLORS[i % BAG_COLORS.length],
      month,
      week,
    }
  })

  const MiniToggle = () => (
    <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
      {[['week', 'Week'], ['month', 'Month']].map(([p, l]) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          style={{
            padding: '6px 12px',
            minHeight: '40px',
            border: 'none',
            background: period === p ? CHAR : 'transparent',
            color: period === p ? CREAM : MUTED,
            fontFamily: UI,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI k="Cash on hand" v={money0(DATA.overview.cash_on_hand)} onClick={() => goTab('financials')} />
        <KPI
          k={period === 'week' ? 'Sales this week' : 'Sales this month'}
          v={money0(salesPeriod)}
          sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs ${period === 'week' ? 'prior week' : 'last month'}`}
          accent={SPICE}
          onClick={() => goTab('financials')}
        />
        <KPI k="Bags sold" v={bagsPeriod.toLocaleString()} onClick={() => goTab('products')} />
        <KPI k="Active subscriptions" v={DATA.overview.active_subscriptions} accent={GREEN} onClick={() => goTab('subscriptions')} />
        <KPI
          k="Owed by stores"
          v={money0(DATA.overview.open_store_balance)}
          accent={AMBER}
          onClick={() => goStoresFilter('open_balance')}
        />
      </div>

      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={lbl}>Net profit · September</div>
        <div style={{ ...big, fontSize: 'clamp(34px,5.5vw,48px)', color: septPnl?.net_profit >= 0 ? GREEN : RED, lineHeight: 1, margin: '6px 0 4px' }}>
          {money0(septPnl?.net_profit || 0)}
        </div>
      </div>

      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ ...lbl, marginBottom: '12px' }}>Revenue &amp; net profit by month</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartMonths} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={BORDER} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: MUTED }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => money0(v)} contentStyle={{ fontSize: '12px', borderRadius: '2px', border: `1px solid ${BORDER}` }} />
              <Bar dataKey="Revenue" fill={KRAFT} radius={[2, 2, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="Net" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GREEN }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ ...lbl, marginBottom: '10px' }}>Revenue by channel</div>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: 180, height: 180, flexShrink: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                  {donut.map((d, i) => (
                    <Cell key={d.name} fill={CHANNEL_COLORS[d.name] || BAG_COLORS[i % BAG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money0(v)} contentStyle={{ fontSize: '12px', borderRadius: '2px', border: `1px solid ${BORDER}` }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            {donut.map((d) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: INK }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHANNEL_COLORS[d.name], flexShrink: 0 }} />
                  {d.name}
                </span>
                <span style={{ fontFamily: MONO }}>{money0(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ ...card, flex: 1, minWidth: 290 }}>
          <div style={{ ...lbl, marginBottom: 14 }}>Top stores</div>
          {topStores.map((s, i) => (
            <div
              key={s.name}
              className="pk-click"
              role="button"
              tabIndex={0}
              onClick={() => goTab('stores')}
              onKeyDown={(e) => e.key === 'Enter' && goTab('stores')}
              style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: 2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                <span style={{ ...big, fontSize: 15 }}>{money0(s.rev)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, flex: 1, minWidth: 290 }}>
          <div style={{ ...lbl, marginBottom: 14 }}>Top flavors</div>
          {topFlavors.map((f, i) => (
            <div
              key={f.name}
              className="pk-click"
              role="button"
              tabIndex={0}
              onClick={() => goTab('products')}
              onKeyDown={(e) => e.key === 'Enter' && goTab('products')}
              style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: 2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</span>
                <span style={{ fontFamily: MONO }}>{f.bags} bags</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={lbl}>Sold this {period}, by product</div>
          <MiniToggle />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
          {products
            .sort((a, b) => b[period] - a[period])
            .map((p) => (
              <div key={p.name} style={{ border: `1px solid ${BORDER}`, borderRadius: 2, padding: '16px 12px 14px', textAlign: 'center', background: CREAM }}>
                <BagIcon color={p.color} />
                <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>{p.name}</div>
                <div style={{ ...big, fontSize: 26, marginTop: 4 }}>{p[period]}</div>
                <div style={{ fontSize: 11, color: MUTED }}>bags this {period}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  )
}
