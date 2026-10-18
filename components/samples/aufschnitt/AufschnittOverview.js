import DATA from './aufschnittData'
import { RevenueNetChart } from './AufschnittCharts'
import {
  SPICE,
  CREAM,
  INK,
  MUTED,
  BORDER,
  GREEN,
  MONO,
  money,
  money0,
  pct1,
  pctChange,
  changeColor,
} from './aufschnittUtils'

export default function AufschnittOverview({ card, lbl, big, KPI, brand, onOpen }) {
  const ov = DATA.overview
  const brandRows =
    brand === 'All brands'
      ? DATA.brandSummary
      : DATA.brandSummary.filter((b) => b.brand === brand)

  const salesCur =
    brand === 'All brands'
      ? ov.sepSales
      : DATA.pnlViews[brand].find((m) => m.month === '2026-09').revenue_total
  const salesPrior =
    brand === 'All brands'
      ? ov.augSales
      : DATA.pnlViews[brand].find((m) => m.month === '2026-08').revenue_total
  const salesDelta = pctChange(salesCur, salesPrior)

  const sepPnl = DATA.pnlViews[brand].find((m) => m.month === '2026-09')
  const grossPct = sepPnl.revenue_total > 0 ? (sepPnl.gross_profit / sepPnl.revenue_total) * 100 : 0
  const priorPnl = DATA.pnlViews[brand].find((m) => m.month === '2026-08')
  const priorGrossPct = priorPnl.revenue_total > 0 ? (priorPnl.gross_profit / priorPnl.revenue_total) * 100 : 0

  const stockRows =
    brand === 'All brands' ? DATA.stock : DATA.stock.filter((r) => r.brand === brand)
  const stockValue = stockRows.reduce((s, r) => s + r.valueAtCost, 0)
  const stockWeeks =
    stockRows.length > 0 ? Math.round((stockRows.reduce((s, r) => s + r.weeksSupply, 0) / stockRows.length) * 10) / 10 : 0

  const channels =
    brand === 'All brands'
      ? ov.channelSalesSep
      : DATA.brandSummary
          .find((b) => b.brand === brand)
          ?.channels.map((c) => ({
            channel: c.channel,
            revenue: c.revenue,
            prior: DATA.pnlViews[brand].find((m) => m.month === '2026-08').revenue[c.channel],
          })) || []

  const chartData =
    brand === 'All brands'
      ? ov.chartMonths
      : MONTH_CHART(brand)

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI
          k="Sales September"
          v={money0(salesCur)}
          sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs August`}
          subColor={changeColor(salesDelta)}
          accent={SPICE}
          onClick={() => onOpen({ type: 'sales-sep', brand, salesCur, salesPrior })}
        />
        <KPI
          k="Gross margin"
          v={pct1(grossPct)}
          sub={`${pct1(grossPct - priorGrossPct)} vs August`}
          subColor={changeColor(grossPct - priorGrossPct)}
          onClick={() => onOpen({ type: 'margin', brand, grossPct, priorGrossPct, sepPnl })}
        />
        <KPI
          k="Net profit September"
          v={money(sepPnl.net_profit)}
          accent={sepPnl.net_profit >= 0 ? GREEN : '#C03A22'}
          onClick={() => onOpen({ type: 'net', brand, sepPnl, priorPnl })}
        />
        <KPI
          k="Stock at cost"
          v={money0(stockValue)}
          sub={`${stockWeeks} wks supply avg`}
          onClick={() => onOpen({ type: 'stock-summary', brand, stockRows, stockValue, stockWeeks })}
        />
        {brand === 'All brands' && (
          <KPI
            k="Owed by stores"
            v={money0(ov.owedTotal)}
            sub={`${money0(ov.owedOver60)} over 60 days`}
            onClick={() => onOpen({ type: 'goto-ar' })}
          />
        )}
      </div>

      {brand === 'All brands' && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ ...lbl, marginBottom: 10 }}>By brand</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Brand', 'Sales', 'Change', 'Net profit'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i === 0 ? 'left' : 'right',
                      padding: '8px 4px',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: MUTED,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA.brandSummary.map((b) => {
                const ch = pctChange(b.sales, b.priorSales)
                return (
                  <tr
                    key={b.brand}
                    className="au-click"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen({ type: 'brand', brand: b.brand, data: b })}
                    onKeyDown={(e) => e.key === 'Enter' && onOpen({ type: 'brand', brand: b.brand, data: b })}
                    style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
                  >
                    <td style={{ padding: '10px 4px', fontWeight: 600 }}>{b.brand}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money0(b.sales)}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO, color: changeColor(ch) }}>
                      {ch >= 0 ? '+' : ''}
                      {pct1(ch)}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(b.netProfit)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...lbl, marginBottom: 10 }}>Sales by channel</div>
        {channels.map((c) => {
          const ch = pctChange(c.revenue, c.prior)
          return (
            <button
              key={c.channel}
              type="button"
              className="au-click"
              onClick={() => onOpen({ type: 'channel', channel: c.channel })}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                border: 'none',
                background: 'transparent',
                padding: '10px 6px',
                borderTop: `1px solid ${CREAM}`,
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: INK }}>{c.channel}</span>
              <span style={{ fontFamily: MONO, color: changeColor(ch), fontSize: 12 }}>{ch >= 0 ? '+' : ''}{pct1(ch)}</span>
              <span style={{ ...big, fontSize: 15, fontFamily: MONO }}>{money0(c.revenue)}</span>
              <span style={{ color: '#C6B79A', fontSize: 15 }}>›</span>
            </button>
          )
        })}
      </div>

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 12 }}>Revenue and net profit by month</div>
        <RevenueNetChart data={chartData} />
      </div>
    </>
  )
}

function MONTH_CHART(brand) {
  return DATA.pnlViews[brand].map((m) => ({
    name: m.label.slice(0, 3),
    revenue: m.revenue_total,
    net: m.net_profit,
  }))
}
