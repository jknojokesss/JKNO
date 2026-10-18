import DATA from './aufschnittData'
import { RevenueNetChart } from './AufschnittCharts'
import {
  SPICE,
  CREAM,
  INK,
  MUTED,
  BORDER,
  GREEN,
  RED,
  MONO,
  money0,
  pct1,
  pctChange,
  changeColor,
  CHANNEL_ROW_CSS,
} from './aufschnittUtils'

export default function AufschnittOverview({ card, lbl, KPI, brand, onOpen }) {
  const ov = DATA.overview

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
  const priorPnl = DATA.pnlViews[brand].find((m) => m.month === '2026-08')
  const grossPct = sepPnl.revenue_total > 0 ? (sepPnl.gross_profit / sepPnl.revenue_total) * 100 : 0
  const priorGrossPct =
    brand === 'All brands' ? ov.priorGrossMarginPct : priorPnl.revenue_total > 0 ? (priorPnl.gross_profit / priorPnl.revenue_total) * 100 : 0
  const marginPts = grossPct - priorGrossPct
  const netDelta = pctChange(sepPnl.net_profit, priorPnl.net_profit)

  const stockRows = brand === 'All brands' ? DATA.stock : DATA.stock.filter((r) => r.brand === brand)
  const stockValue = stockRows.reduce((s, r) => s + r.valueAtCost, 0)
  const stockPrior =
    brand === 'All brands' ? ov.priorStockValue : round(ov.priorStockValue * (stockValue / ov.stockValue))
  const stockDelta = pctChange(stockValue, stockPrior)
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

  const chartData = brand === 'All brands' ? ov.chartMonths : MONTH_CHART(brand)

  const owedDelta = pctChange(ov.owedTotal, ov.priorOwedTotal)

  return (
    <>
      <style>{CHANNEL_ROW_CSS}</style>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI
          k="Sales September"
          v={money0(salesCur)}
          sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs August`}
          subColor={changeColor(salesDelta)}
          accent={salesDelta >= 0 ? GREEN : RED}
          onClick={() => onOpen({ type: 'sales-sep', brand, salesCur, salesPrior })}
        />
        <KPI
          k="Gross margin"
          v={pct1(grossPct)}
          sub={`${marginPts >= 0 ? '+' : ''}${marginPts.toFixed(1)} pts vs August`}
          subColor={changeColor(marginPts)}
          onClick={() => onOpen({ type: 'margin', brand, grossPct, priorGrossPct, sepPnl })}
        />
        <KPI
          k="Net profit September"
          v={money0(sepPnl.net_profit)}
          sub={`${netDelta >= 0 ? '+' : ''}${pct1(netDelta)} vs August`}
          subColor={changeColor(netDelta)}
          accent={sepPnl.net_profit >= 0 ? GREEN : RED}
          onClick={() => onOpen({ type: 'net', brand, sepPnl, priorPnl })}
        />
        <KPI
          k="Stock at cost"
          v={money0(stockValue)}
          sub={`${stockDelta >= 0 ? '+' : ''}${pct1(stockDelta)} vs August`}
          subColor={MUTED}
          onClick={() =>
            onOpen({ type: 'stock-summary', brand, stockRows, stockValue, stockPrior, stockWeeks, stockDelta })
          }
        />
        {brand === 'All brands' && (
          <KPI
            k="Owed by stores"
            v={money0(ov.owedTotal)}
            sub={`${owedDelta >= 0 ? '+' : ''}${pct1(owedDelta)} vs August`}
            subColor={MUTED}
            onClick={() => onOpen({ type: 'owed-summary', total: ov.owedTotal, prior: ov.priorOwedTotal, over60: ov.owedOver60 })}
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
                    <td
                      style={{
                        padding: '10px 4px',
                        textAlign: 'right',
                        fontFamily: MONO,
                        color: b.netProfit < 0 ? RED : INK,
                      }}
                    >
                      {money0(b.netProfit)}
                    </td>
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
              className="au-ch-row au-click"
              onClick={() => onOpen({ type: 'channel', channel: c.channel })}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: INK }}>{c.channel}</span>
              <span className="au-ch-pct" style={{ color: changeColor(ch) }}>
                {ch >= 0 ? '+' : ''}
                {pct1(ch)}
              </span>
              <span className="au-ch-amt">{money0(c.revenue)}</span>
              <span style={{ color: '#C6B79A', fontSize: 15, textAlign: 'right' }}>›</span>
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

function round(n) {
  return Math.round(n * 100) / 100
}
