#!/usr/bin/env node
/**
 * Whole-dollar row lists must sum to their rounded totals on prospect samples.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { allocateWholeDollars, sumAllocatedWholeDollars } from '../components/samples/sampleWholeDollarDisplay.js'
import { lotCostBasis, costOfSalesForLot } from '../components/samples/closeoutExplosion/closeoutExplosionCosts.js'
import DATA_AU from '../components/samples/aufschnitt/aufschnittData.js' // default export

const root = path.dirname(fileURLToPath(import.meta.url))
const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  else console.log('ok', label)
}

const lotsDir = path.join(root, '../components/samples/closeoutExplosion/lots')
const lots = fs
  .readdirSync(lotsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(lotsDir, f), 'utf8')))
const openLots = lots.filter((l) => l.status === 'Open')
const cashTiedParts = openLots.map((lot) => {
  const { totalCost } = lotCostBasis(lot)
  const costSold = costOfSalesForLot(lot)
  return totalCost - costSold
})
const cashTiedTotal = cashTiedParts.reduce((s, v) => s + v, 0)
const cashWhole = allocateWholeDollars(cashTiedParts, cashTiedTotal)
ok('closeout cash tied row sum', cashWhole.reduce((s, n) => s + n, 0) === Math.round(cashTiedTotal))
ok('closeout cash tied card', Math.round(cashTiedTotal) === 42391)

const ov = DATA_AU.default?.overview ?? DATA_AU.overview
const salesCur = ov.sepSales
const channelParts = ov.channelSalesSep.map((c) => c.revenue)
const chWhole = allocateWholeDollars(channelParts, salesCur)
ok('aufschnitt channel row sum', chWhole.reduce((s, n) => s + n, 0) === Math.round(salesCur))
ok('aufschnitt sales september card', Math.round(salesCur) === 236149)

ok('helper sums to target', sumAllocatedWholeDollars([10.4, 20.6, 30.1], 62) === 62)

if (failures.length) {
  console.error('check-sample-whole-dollar-ties FAILED:', failures)
  process.exit(1)
}
console.log('check-sample-whole-dollar-ties OK')
