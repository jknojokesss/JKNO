import { money, pct1, fmtInt, GREEN, RED, deltaColor } from './mrDipzUtils'
import { Card, KPI, MdTable } from './MrDipzKit'

export default function MrDipzOverview({ model, open }) {
  const t = model.totals
  const pctDelta = Math.round(t.pct * 10) - Math.round(t.priorPct * 10)

  return (
    <>
      <div className="md-kpis">
        <KPI
          k="SALES · SEPTEMBER"
          v={money(t.sales)}
          sub={`${t.salesChangePct >= 0 ? '+' : ''}${pct1(t.salesChangePct)} vs last month`}
          subColor={deltaColor(t.salesChangePct)}
          onClick={() => open({ type: 'pnl', id: 'gross' })}
        />
        <KPI
          k="CREDITS FOR EXPIRED"
          v={money(t.credits)}
          sub={`${pct1(t.pct)} of sales · ${pct1(t.priorPct)} last month`}
          subColor={deltaColor(pctDelta, { cost: true })}
          onClick={() => open({ type: 'pnl', id: 'credits' })}
        />
        <KPI
          k="DISTRIBUTOR DEDUCTIONS"
          v={money(model.deductions.openReview)}
          sub="Open to review"
          onClick={() => open({ type: 'deductionsOpen' })}
        />
        <KPI k="NET AFTER CREDITS" v={money(t.net)} onClick={() => open({ type: 'pnl', id: 'netSales' })} />
        <KPI k="OWED BY STORES" v={money(t.owed)} onClick={() => open({ type: 'bucket', id: 'all' })} />
        <KPI
          k="NET PROFIT · SEPTEMBER"
          v={money(model.pnl.sep.netProfit)}
          accent={model.pnl.sep.netProfit >= 0 ? GREEN : RED}
          onClick={() => open({ type: 'pnl', id: 'netProfit' })}
        />
      </div>

      <Card title="By area">
        <MdTable
          columns={['Area', 'Sales', 'Credits', 'Credit %', 'Net']}
          rows={[
            ...model.areas.map((a) => ({
              key: a.id,
              name: a.name,
              cells: [money(a.sales), money(a.credits), pct1(a.pct), money(a.net)],
              onClick: () => open({ type: 'area', id: a.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [money(t.sales), money(t.credits), pct1(t.pct), money(t.net)],
              onClick: () => open({ type: 'pnl', id: 'gross' }),
            },
          ]}
        />
      </Card>

      <Card title="Credits by week">
        <MdTable
          columns={['Week', 'Expired', 'Credits']}
          rows={[
            ...model.weeks.map((w) => ({
              key: w.id,
              name: w.label,
              cells: [fmtInt(w.expUnits), money(w.credits)],
              onClick: () => open({ type: 'week', id: w.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [fmtInt(t.expUnits), money(t.credits)],
              onClick: () => open({ type: 'pnl', id: 'credits' }),
            },
          ]}
        />
      </Card>
    </>
  )
}
