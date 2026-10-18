import { money, pct1, pctOf, fmtInt, deltaColor, MUTED } from './mrDipzUtils'
import { Card, KPI, MdTable } from './MrDipzKit'

export default function MrDipzCredits({ model, open }) {
  const t = model.totals
  const pctDelta = Math.round(t.pct * 10) - Math.round(t.priorPct * 10)
  const byStore = [...model.stores].sort((a, b) => b.pct - a.pct)
  const byProduct = [...model.products].sort((a, b) => b.credits - a.credits)

  return (
    <>
      <div className="md-kpis">
        <KPI
          k="CREDITS · SEPTEMBER"
          v={money(t.credits)}
          sub={`${pct1(t.pct)} of sales`}
          subColor={deltaColor(pctDelta, { cost: true })}
          onClick={() => open({ type: 'pnl', id: 'credits' })}
        />
        <KPI
          k="CREDITS · AUGUST"
          v={money(t.priorCredits)}
          sub={`${pct1(t.priorPct)} of sales`}
          onClick={() => open({ type: 'pnl', id: 'credits' })}
        />
      </div>

      <Card title="By store">
        <MdTable
          columns={['Store', 'Credits', 'Credit %', 'Last month %']}
          rows={[
            ...byStore.map((s) => {
              const d = Math.round(s.pct * 10) - Math.round(s.priorPct * 10)
              return {
                key: s.id,
                name: s.name,
                cells: [money(s.credits), pct1(s.pct), pct1(s.priorPct)],
                colors: [null, deltaColor(d, { cost: true }), MUTED],
                onClick: () => open({ type: 'storeCredit', id: s.id }),
              }
            }),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [money(t.credits), pct1(t.pct), pct1(t.priorPct)],
              colors: [null, deltaColor(pctDelta, { cost: true }), MUTED],
              onClick: () => open({ type: 'pnl', id: 'credits' }),
            },
          ]}
        />
      </Card>

      <Card title="By product">
        <MdTable
          columns={['Product', 'Expired', 'Credits', '% of sales']}
          rows={[
            ...byProduct.map((p) => ({
              key: p.id,
              name: p.name,
              cells: [fmtInt(p.expUnits), money(p.credits), pct1(p.pct)],
              onClick: () => open({ type: 'productCredit', id: p.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [fmtInt(t.expUnits), money(t.credits), pct1(pctOf(t.credits, t.sales))],
              onClick: () => open({ type: 'pnl', id: 'credits' }),
            },
          ]}
        />
      </Card>

      <Card title="By week">
        <MdTable
          columns={['Week', 'Expired', 'Credits', '% of sales']}
          rows={[
            ...model.weeks.map((w) => ({
              key: w.id,
              name: w.label,
              cells: [fmtInt(w.expUnits), money(w.credits), pct1(w.pct)],
              onClick: () => open({ type: 'week', id: w.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [fmtInt(t.expUnits), money(t.credits), pct1(t.pct)],
              onClick: () => open({ type: 'pnl', id: 'credits' }),
            },
          ]}
        />
      </Card>
    </>
  )
}
