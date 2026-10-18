/**
 * Tie Sep P&L lines to monthly card; vary top sizes; add sales_items_by_month Sep.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dataPath = path.join(root, 'data/riverside-tires.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const sep = data.monthly.find((m) => m.month === '2026-09')
const pl = data.pl_by_month['2026-09']

const targetInc = sep.revenue
const targetCogs = sep.cogs
const targetExp = sep.opex
const targetNet = sep.profit

const scaleSection = (lines, target) => {
  const cur = lines.reduce((s, l) => s + l.amount, 0)
  if (Math.abs(cur) < 0.01) return
  const f = target / cur
  let rem = target
  lines.forEach((l, i) => {
    if (i === lines.length - 1) l.amount = Math.round(rem * 100) / 100
    else {
      l.amount = Math.round(l.amount * f * 100) / 100
      rem -= l.amount
    }
  })
}

scaleSection(pl.income, targetInc)
scaleSection(pl.cogs, targetCogs)
scaleSection(pl.expense, targetExp)

const inc = pl.income.reduce((s, l) => s + l.amount, 0)
const cogs = pl.cogs.reduce((s, l) => s + l.amount, 0)
const exp = pl.expense.reduce((s, l) => s + l.amount, 0)
const net = Math.round((inc - cogs - exp) * 100) / 100
if (net !== targetNet) {
  const last = pl.expense[pl.expense.length - 1]
  last.amount = Math.round((last.amount + (targetNet - net)) * 100) / 100
}

const topSep = [
  { rank: 1, size: '235/65R17', units: 42, revenue: 5565.36 },
  { rank: 2, size: '225/60R17', units: 30, revenue: 3215.3 },
  { rank: 3, size: '245/70R17', units: 22, revenue: 3082.88 },
  { rank: 4, size: '205/55R16', units: 19, revenue: 2237.87 },
  { rank: 5, size: '265/70R17', units: 17, revenue: 2311.66 },
  { rank: 6, size: '275/55R20', units: 18, revenue: 2296.5 },
]
const topSixRev = Math.round(topSep.reduce((s, t) => s + t.revenue, 0) * 100) / 100
const topSixUnits = topSep.reduce((s, t) => s + t.units, 0)
data.top_tire_sizes_sep = topSep
data.sep_tire_sales.top_six_revenue = topSixRev
data.sep_tire_sales.top_six_units = topSixUnits

const augItems = data.sales_items_by_month['2026-08']
const augRev = data.monthly.find((m) => m.month === '2026-08').revenue
const f = sep.revenue / augRev
const sepItems = augItems.map((it) => {
  const top = topSep.find((t) => t.size === it.item)
  if (top) {
    return {
      ...it,
      units: top.units,
      revenue: top.revenue,
      unitPrice: Math.round((top.revenue / top.units) * 100) / 100,
    }
  }
  const revenue = Math.round(it.revenue * f * 100) / 100
  const units = Math.max(1, Math.round(it.units * f))
  return {
    ...it,
    units,
    revenue,
    unitPrice: Math.round((revenue / units) * 100) / 100,
  }
})
let itemRev = sepItems.reduce((s, i) => s + i.revenue, 0)
const fix = Math.round((sep.revenue - itemRev) * 100) / 100
if (fix) {
  const svc = sepItems.find((i) => i.item === 'Service & labor')
  if (svc) svc.revenue = Math.round((svc.revenue + fix) * 100) / 100
}
data.sales_items_by_month['2026-09'] = sepItems

if (data.cash_flow['2026-09']?.operating) {
  const ni = data.cash_flow['2026-09'].operating.find((l) => l.label === 'Net income')
  if (ni) ni.amount = targetNet
}

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`)
console.log('Fixed Sep P&L', {
  net: pl.income.reduce((s, l) => s + l.amount, 0) - pl.cogs.reduce((s, l) => s + l.amount, 0) - pl.expense.reduce((s, l) => s + l.amount, 0),
  topSixUnits,
  topSixRev,
  itemsRev: sepItems.reduce((s, i) => s + i.revenue, 0),
})
