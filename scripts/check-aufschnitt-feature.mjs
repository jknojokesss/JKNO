/**
 * Profit-per-order totals for /aufschnitt — channel rows tie to P&L; recent orders are a sample.
 * Run: node scripts/check-aufschnitt-feature.mjs
 */
import DATA from '../components/samples/aufschnitt/aufschnittData.js'
import { CHANNELS } from '../components/samples/aufschnitt/aufschnittCatalog.js'

const round2 = (n) => Math.round(n * 100) / 100
const sum = (arr, fn = (x) => x) => round2(arr.reduce((s, x) => s + fn(x), 0))

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
}

const sep = DATA.pnlViews['All brands'].find((m) => m.month === '2026-09')
const pp = DATA.profitPerOrder
const ov = DATA.overview

ok('profit data present', pp && pp.channelSummary?.length === 3)

const chRows = pp.channelSummary
const totalRev = sum(chRows, (r) => r.revenue)
const totalCost = sum(chRows, (r) => r.productCost)
const totalShip = sum(chRows, (r) => r.shipping)
const totalDisc = sum(chRows, (r) => r.discounts)
const totalFees = sum(chRows, (r) => r.fees)
const totalProfit = sum(chRows, (r) => r.profit)

ok('channel revenue = P&L total', totalRev === sep.revenue_total)
CHANNELS.forEach((ch) => {
  const row = chRows.find((r) => r.channel === ch)
  ok(`${ch} revenue = sales channel`, row.revenue === sep.revenue[ch])
  const ovCh = ov.channelSalesSep.find((c) => c.channel === ch)
  ok(`${ch} revenue = overview`, row.revenue === ovCh.revenue)
})

ok('product cost = COGS', totalCost === sep.cogs)
ok(
  'profit = gross − variable selling',
  totalProfit === round2(sep.gross_profit - pp.ties.variableSelling)
)
ok('contribution line', totalProfit === pp.contributionAfterFulfillment)

const amazonFees = sep.operating_expenses_entries.find((e) => e.l === 'Amazon fees').n
const promos = sep.operating_expenses_entries.find((e) => e.l === 'Store promos and credits').n
const shipping = sep.operating_expenses_entries.find((e) => e.l === 'Shipping to customers').n
const card = sep.operating_expenses_entries.find((e) => e.l === 'Card processing').n
ok('Amazon fees on Amazon row', chRows.find((r) => r.channel === 'Amazon').fees === amazonFees)
ok('store promos on Stores discounts', chRows.find((r) => r.channel === 'Stores').discounts === promos)
ok('shipping split', totalShip === shipping)
ok('fees amazon+card', totalFees === round2(amazonFees + card))

const banned = /salmon|fish|bresaola/i

CHANNELS.forEach((ch) => {
  const orders = pp.ordersByChannel[ch]
  ok(`${ch} sample orders`, orders.length >= 10 && orders.length <= 12)
  const sampleRev = sum(orders, (o) => o.orderTotal)
  const row = chRows.find((r) => r.channel === ch)
  ok(`${ch} sample < month revenue`, sampleRev < row.revenue)

  orders.forEach((o) => {
    const calc = round2(o.orderTotal - o.productCost - o.shipping - o.discount - o.fees)
    ok(`${o.orderNo} profit math`, calc === o.profit)
    ok(`${o.orderNo} no fish`, !banned.test(o.items))
    o.lines.forEach((line) => {
      ok(`${o.orderNo} line qty×unit`, round2(line.qty * line.unitPrice) === line.revenue)
      ok(`${o.orderNo} lines sum`, sum(o.lines, (l) => l.revenue) === o.orderTotal)
    })
    if (o.lostOnShipping) {
      ok(`${o.orderNo} shipping loss negative`, o.profit < 0 && o.profit >= -15 && o.profit <= -3)
    }
    if (ch === 'Own site' && !o.lostOnShipping) {
      ok(`${o.orderNo} web total band`, o.orderTotal >= 35 && o.orderTotal <= 160)
      ok(`${o.orderNo} web ship band`, o.shipping >= 7 && o.shipping <= 18)
      ok(`${o.orderNo} web profit band`, o.profit >= 8 && o.profit <= 45)
    }
    if (ch === 'Amazon') {
      ok(`${o.orderNo} amz total band`, o.orderTotal >= 25 && o.orderTotal <= 90)
      ok(`${o.orderNo} amz profit modest`, o.profit >= 1 && o.profit <= 18)
    }
    if (ch === 'Stores' && !o.lostOnShipping) {
      ok(`${o.orderNo} ws total band`, o.orderTotal >= 300 && o.orderTotal <= 1200)
      ok(`${o.orderNo} ws ship band`, o.shipping >= 20 && o.shipping <= 60)
    }
  })
})

ok('shipping loss count 3', pp.shippingLossCount === 3)
ok('shipping loss list', pp.shippingLossOrders.length === 3)
ok('shipping loss own 2', pp.shippingLossOrders.filter((o) => o.channel === 'Own site').length === 2)
ok('shipping loss stores 1', pp.shippingLossOrders.filter((o) => o.channel === 'Stores').length === 1)
ok(
  'shipping loss total',
  sum(pp.shippingLossOrders, (o) => o.profit) === pp.shippingLossTotal
)

const orderSum = sum(chRows, (r) => r.orders)
ok('blended avg', round2(totalProfit / orderSum) === pp.blendedAvgProfitPerOrder)
ok('overview avg', ov.profitPerOrderAvg === pp.blendedAvgProfitPerOrder)

ok('no receivables export', DATA.receivables === undefined)

if (failures.length) {
  console.error('FAILURES:', failures)
  process.exit(1)
}
console.log('check-aufschnitt-feature: OK', {
  revenue: totalRev,
  profit: totalProfit,
  contribution: pp.contributionAfterFulfillment,
  avgPerOrder: pp.blendedAvgProfitPerOrder,
  shippingLosses: pp.shippingLossCount,
})
