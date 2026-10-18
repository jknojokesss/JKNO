import { money, pct1, pctOf, fmtInt } from './mrDipzUtils'
import { Card, MdTable } from './MrDipzKit'

const GROUPS = [
  ['Dip', 'Dips'],
  ['Dressing', 'Dressings'],
]

const cellsFor = (r) => [
  fmtInt(r.units),
  money(r.sales),
  fmtInt(r.expUnits),
  money(r.credits),
  pct1(pctOf(r.credits, r.sales)),
  money(r.sales - r.credits),
]

const add = (list) =>
  list.reduce(
    (a, p) => ({
      units: a.units + p.units,
      sales: a.sales + p.sales,
      expUnits: a.expUnits + p.expUnits,
      credits: a.credits + p.credits,
    }),
    { units: 0, sales: 0, expUnits: 0, credits: 0 },
  )

export default function MrDipzProducts({ model, open }) {
  const rows = []
  GROUPS.forEach(([type, label]) => {
    const list = model.products.filter((p) => p.type === type)
    rows.push({
      key: `sub-${type}`,
      kind: 'group',
      name: label,
      cells: cellsFor(add(list)),
      onClick: () => open({ type: 'productGroup', id: type }),
    })
    list.forEach((p) => {
      rows.push({
        key: p.id,
        indent: true,
        name: p.name,
        cells: cellsFor(p),
        onClick: () => open({ type: 'product', id: p.id }),
      })
    })
  })
  const productBodyRows = model.products.map((p) => ({
    key: p.id,
    name: p.name,
    cells: cellsFor(p),
  }))
  rows.push({
    key: 'total',
    kind: 'total',
    name: 'Total',
    cells: cellsFor(model.totals),
    onClick: () =>
      open({
        type: 'tableTotal',
        tableName: 'Products · September',
        columns: ['Product', 'Units', 'Sales', 'Expired', 'Credits', 'Credit %', 'Net'],
        rows: productBodyRows,
        totalCells: cellsFor(model.totals),
      }),
  })

  return (
    <Card title="Products · September">
      <MdTable columns={['Product', 'Units', 'Sales', 'Expired', 'Credits', 'Credit %', 'Net']} rows={rows} />
    </Card>
  )
}
