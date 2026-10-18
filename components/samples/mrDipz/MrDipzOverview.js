import { money, pct1, fmtInt, GREEN, RED, deltaColor } from './mrDipzUtils'
import { Card, KPI, MdTable } from './MrDipzKit'

export default function MrDipzOverview({ model, open, goTab }) {
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
          onClick={() => goTab('stores')}
        />
        <KPI
          k="CREDITS FOR EXPIRED"
          v={money(t.credits)}
          sub={`${pct1(t.pct)} of sales · ${pct1(t.priorPct)} last month`}
          subColor={deltaColor(pctDelta, { cost: true })}
          onClick={() => goTab('credits')}
        />
        <KPI k="NET AFTER CREDITS" v={money(t.net)} onClick={() => goTab('stores')} />
        <KPI k="OWED BY STORES" v={money(t.owed)} onClick={() => goTab('owed')} />
        <KPI
          k="NET PROFIT · SEPTEMBER"
          v={money(model.pnl.sep.netProfit)}
          accent={model.pnl.sep.netProfit >= 0 ? GREEN : RED}
          onClick={() => goTab('financials')}
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
              onClick: () => goTab('stores'),
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
              onClick: () => goTab('credits'),
            },
          ]}
        />
      </Card>
    </>
  )
}
