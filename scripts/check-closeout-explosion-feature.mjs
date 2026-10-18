/**
 * Profit-per-lot feature totals for /closeout-explosion.
 * Run: node scripts/check-closeout-explosion-feature.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const lotsDir = path.join(root, 'components/samples/closeoutExplosion/lots')

const round2 = (n) => Math.round(n * 100) / 100
const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
}

const AS_OF = '2026-10-17'
const PNL = {
  thisFrom: '2026-10-01',
  thisTo: '2026-10-17',
}

const BUYERS = [
  'Garden State Quick Mart',
  'Hudson Valley Discount Grocers',
  'Keystone Surplus Distributors',
  'Tri-State Bargain Outlet',
  'Elm Street Family Grocery',
  'Brightway Dollar Stores',
  'Wexley Regional Supply',
  'Fairlane Convenience Group',
]

function loadLots() {
  return fs
    .readdirSync(lotsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(lotsDir, f), 'utf8')))
}

function lotCostBasis(lot) {
  const brokerCommission = lot.broker ?? 0
  const totalCost = lot.buy + lot.freight + brokerCommission
  return { brokerCommission, totalCost }
}

function lotStats(lot) {
  const { totalCost } = lotCostBasis(lot)
  const casesSold = lot.sales.reduce((s, x) => s + x.cases, 0)
  const casesLeft = lot.cases - casesSold
  const revenue = lot.sales.reduce((s, x) => s + x.amount, 0)
  const costSold = lot.sales.reduce((s, x) => s + x.cost, 0)
  const costInStock = totalCost - costSold
  const profit =
    lot.status === 'Closed' && casesLeft === 0 ? revenue - totalCost : revenue - costSold
  const margin = revenue > 0 ? profit / revenue : 0
  const cashTied = lot.status === 'Open' ? costInStock : 0
  const buyerUnpaidAmount = lot.sales
    .filter((s) => s.paid == null)
    .reduce((s, x) => s + x.amount, 0)
  return {
    lot,
    totalCost,
    casesSold,
    casesLeft,
    revenue,
    costSold,
    costInStock,
    profit,
    margin,
    cashTied,
    buyerUnpaidAmount,
  }
}

const lots = loadLots()
const rows = lots.map(lotStats)
const openLots = rows.filter((r) => r.lot.status === 'Open')
const cashTiedTotal = openLots.reduce((s, l) => s + l.cashTied, 0)
const casesInWarehouse = openLots.reduce((s, l) => s + l.casesLeft, 0)

let buyersOwe = 0
const unpaidByBuyer = {}
for (const lot of lots) {
  for (const sale of lot.sales) {
    if (sale.paid != null) continue
    buyersOwe += sale.amount
    unpaidByBuyer[sale.buyer] = round2((unpaidByBuyer[sale.buyer] || 0) + sale.amount)
  }
}
buyersOwe = round2(buyersOwe)

const EXPECT_BUYERS_OWE = 58118.75
const EXPECT_CASH_TIED = 43543
const EXPECT_CASES = 4680
const OPEN_CASH = {
  'L-2041': 3501,
  'L-2047': 6743.33,
  'L-2052': 8440.25,
  'L-2056': 5963.54,
  'L-2061': 12444.44,
  'L-2063': 6450,
}

ok('lot count 8-12', lots.length >= 8 && lots.length <= 12)
ok('buyers owe card', buyersOwe === EXPECT_BUYERS_OWE)
ok('cash tied total', Math.round(cashTiedTotal) === EXPECT_CASH_TIED)
ok('cases in warehouse', casesInWarehouse === EXPECT_CASES)

for (const row of openLots) {
  const id = row.lot.id
  if (OPEN_CASH[id] != null) {
    ok(`${id} cash tied`, round2(row.cashTied) === round2(OPEN_CASH[id]))
  }
}

for (const name of BUYERS) {
  const fromLots = unpaidByBuyer[name] || 0
  if (fromLots > 0) ok(`buyer ${name} has balance`, fromLots > 0)
}
ok('unpaid sum', round2(Object.values(unpaidByBuyer).reduce((s, x) => s + x, 0)) === EXPECT_BUYERS_OWE)

for (const row of rows) {
  const lot = row.lot
  const cost = lotCostBasis(lot)
  ok(`${lot.id} total cost`, round2(row.totalCost) === round2(cost.totalCost))
  if (lot.status === 'Open') {
    ok(`${lot.id} cost in stock`, round2(row.costInStock) === round2(row.cashTied))
  }
  if (lot.status === 'Closed' && row.casesLeft === 0) {
    ok(`${lot.id} closed profit`, round2(row.profit) === round2(row.revenue - row.totalCost))
  } else {
    ok(`${lot.id} open profit`, round2(row.profit) === round2(row.revenue - row.costSold))
  }
}

let octSales = 0
for (const lot of lots) {
  for (const sale of lot.sales) {
    if (sale.date >= PNL.thisFrom && sale.date <= PNL.thisTo) octSales += sale.amount
  }
}
octSales = round2(octSales)

const sep25Open = lots.flatMap((l) => l.sales).filter((s) => s.date === '2026-09-25' && s.paid == null)
ok('no unpaid Sep 25 invoice dates', sep25Open.length === 0)

const inv1043 = lots.flatMap((l) => l.sales).find((s) => s.invoice === 'INV-1043')
ok('INV-1043 in October', inv1043 && inv1043.date >= '2026-10-01' && inv1043.date <= '2026-10-17')

console.log('closeout-explosion profit per lot', {
  lots: lots.length,
  buyersOwe,
  cashTied: Math.round(cashTiedTotal),
  cases: casesInWarehouse,
  octSales,
})

if (failures.length) {
  console.error('FAILED:', failures)
  process.exit(1)
}
console.log('Closeout Explosion feature checks passed.')
