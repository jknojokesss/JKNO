import { money, BUCKETS } from './mrDipzUtils'
import { Card, KPI, MdTable } from './MrDipzKit'

export default function MrDipzOwed({ model, open }) {
  const t = model.totals
  const owing = model.stores.filter((s) => s.owed > 0).sort((a, b) => b.owed - a.owed)
  const agingCells = (a) => [...BUCKETS.map((b) => (a[b.id] ? money(a[b.id]) : '—')), money(a.total)]

  return (
    <>
      <div className="md-kpis">
        {BUCKETS.map((b) => (
          <KPI key={b.id} k={b.label.toUpperCase()} v={money(t.aging[b.id])} onClick={() => open({ type: 'bucket', id: b.id })} />
        ))}
        <KPI k="TOTAL" v={money(t.owed)} onClick={() => open({ type: 'bucket', id: 'all' })} />
      </div>

      <Card title="By store">
        <MdTable
          columns={['Store', ...BUCKETS.map((b) => b.short), 'Total']}
          rows={[
            ...owing.map((s) => ({
              key: s.id,
              name: s.name,
              cells: agingCells(s.aging),
              onClick: () => open({ type: 'storeInvoices', id: s.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: agingCells(t.aging),
              onClick: () =>
                open({
                  type: 'tableTotal',
                  tableName: 'By store',
                  columns: ['Store', ...BUCKETS.map((b) => b.short), 'Total'],
                  rows: owing.map((s) => ({
                    key: s.id,
                    name: s.name,
                    cells: agingCells(s.aging),
                  })),
                  totalCells: agingCells(t.aging),
                }),
            },
          ]}
        />
      </Card>
    </>
  )
}
