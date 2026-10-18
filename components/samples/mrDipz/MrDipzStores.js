import { money, pct1 } from './mrDipzUtils'
import { Card, MdTable } from './MrDipzKit'

export default function MrDipzStores({ model, open }) {
  const t = model.totals
  const rows = []
  model.areas.forEach((a) => {
    rows.push({
      key: a.id,
      kind: 'group',
      name: a.name,
      cells: [money(a.sales), money(a.credits), pct1(a.pct), money(a.net)],
      onClick: () => open({ type: 'area', id: a.id }),
    })
    a.storeIds.forEach((id) => {
      const s = model.storeById[id]
      rows.push({
        key: s.id,
        indent: true,
        name: s.name,
        cells: [money(s.sales), money(s.credits), pct1(s.pct), money(s.net)],
        onClick: () => open({ type: 'store', id: s.id }),
      })
    })
  })
  rows.push({
    key: 'total',
    kind: 'total',
    name: 'Total',
    cells: [money(t.sales), money(t.credits), pct1(t.pct), money(t.net)],
    onClick: () => open({ type: 'pnl', id: 'gross' }),
  })

  return (
    <Card title="Sales by store · September">
      <MdTable columns={['Store', 'Sales', 'Credits', 'Credit %', 'Net']} rows={rows} />
    </Card>
  )
}
