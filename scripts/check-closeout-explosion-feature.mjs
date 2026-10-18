/**
 * Profit-per-lot feature totals for /closeout-explosion.
 * Run: node scripts/check-closeout-explosion-feature.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  costOfSalesForLot,
  lotCostBasis,
  saleCostsForLot,
} from '../components/samples/closeoutExplosion/closeoutExplosionCosts.js'

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
  expensesThis: 1400 + 2180 + 870 + 210 + 260 + 140,
}

function loadLots() {
  return fs
    .readdirSync(lotsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(lotsDir, f), 'utf8')))
}

function isOpenInvoice(sale) {
  return Boolean(sale.invoice) && sale.paid == null
}

function lotStats(lot) {
  const { totalCost } = lotCostBasis(lot)
  const casesSold = lot.sales.reduce((s, x) => s + x.cases, 0)
  const casesLeft = lot.cases - casesSold
  const revenue = lot.sales.reduce((s, x) => s + x.amount, 0)
  const costSold = costOfSalesForLot(lot)
  const costInStock = totalCost - costSold
  const profit = revenue - costSold
  const margin = revenue > 0 ? profit / revenue : null
  const cashTied = lot.status === 'Open' ? costInStock : 0
  const buyerUnpaidAmount = lot.sales
    .filter((s) => isOpenInvoice(s))
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
let shippedOnly = 0
for (const lot of lots) {
  for (const sale of lot.sales) {
    if (!sale.invoice) {
      shippedOnly += 1
      continue
    }
    if (sale.paid != null) continue
    buyersOwe += sale.amount
  }
}
buyersOwe = round2(buyersOwe)

const EXPECT_BUYERS_OWE = 58118.75
const EXPECT_CASH_TIED = 42391
const EXPECT_CASES = 4545
const EXPECT_OCT_SALES = 36524.25
const EXPECT_OCT_NET = 2588.15

const OPEN_CASH = {
  'L-2041': 3063.36,
  'L-2047': 6743.34,
  'L-2052': 8440.24,
  'L-2056': 5701.15,
  'L-2061': 12444.45,
  'L-2063': 5998.5,
}

ok('lot count 8-12', lots.length >= 8 && lots.length <= 12)
ok('buyers owe card', buyersOwe === EXPECT_BUYERS_OWE)
ok('cash tied total', Math.round(cashTiedTotal) === EXPECT_CASH_TIED)
ok('cases in warehouse', casesInWarehouse === EXPECT_CASES)
ok('three shipped not invoiced', shippedOnly === 3)

for (const row of openLots) {
  const id = row.lot.id
  if (OPEN_CASH[id] != null) {
    ok(`${id} cash tied`, round2(row.cashTied) === round2(OPEN_CASH[id]))
  }
}

for (const row of rows) {
  const lot = row.lot
  ok(`${lot.id} profit = sales - cost of sales`, round2(row.profit) === round2(row.revenue - row.costSold))
  if (row.revenue > 0) {
    ok(`${lot.id} margin`, round2(row.margin) === round2(row.profit / row.revenue))
  } else {
    ok(`${lot.id} no sales margin`, row.margin == null)
  }
  if (lot.status === 'Open') {
    ok(`${lot.id} cost in stock`, round2(row.costInStock) === round2(row.cashTied))
  }
  if (row.casesLeft === 0) {
    ok(`${lot.id} sold out cost of sales`, round2(row.costSold) === round2(row.totalCost))
  }
}

let octSales = 0
let octCogs = 0
for (const lot of lots) {
  const lineCosts = saleCostsForLot(lot)
  lot.sales.forEach((sale, i) => {
    if (sale.date >= PNL.thisFrom && sale.date <= PNL.thisTo) {
      octSales += sale.amount
      octCogs += lineCosts[i]
    }
  })
}
octSales = round2(octSales)
octCogs = round2(octCogs)
const octGross = round2(octSales - octCogs)
const octNet = round2(octGross - PNL.expensesThis)

ok('oct sales period', octSales === EXPECT_OCT_SALES)
ok('oct net profit', octNet === EXPECT_OCT_NET)

const sep25Open = lots
  .flatMap((l) => l.sales)
  .filter((s) => s.date === '2026-09-25' && isOpenInvoice(s))
ok('no unpaid Sep 25 invoice dates', sep25Open.length === 0)

const inv1043 = lots.flatMap((l) => l.sales).find((s) => s.invoice === 'INV-1043')
ok('INV-1043 in October', inv1043 && inv1043.date >= '2026-10-01' && inv1043.date <= '2026-10-17')

let maxInv = 0
for (const lot of lots) {
  for (const sale of lot.sales) {
    if (!sale.invoice) continue
    const n = parseInt(sale.invoice.replace(/^INV-/, ''), 10)
    if (n > maxInv) maxInv = n
  }
}
ok('next invoice after max', maxInv === 1090)

console.log('closeout-explosion profit per lot', {
  lots: lots.length,
  buyersOwe,
  cashTied: Math.round(cashTiedTotal),
  cases: casesInWarehouse,
  octSales,
  octNet,
  shippedOnly,
})

if (failures.length) {
  console.error('FAILED:', failures)
  process.exit(1)
}
console.log('Closeout Explosion feature checks passed.')
