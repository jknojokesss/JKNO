/**
 * Profit-per-order totals for /aufschnitt — channel rows, sample orders, P&L ties.
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

CHANNELS.forEach((ch) => {
  const row = chRows.find((r) => r.channel === ch)
  const orders = pp.ordersByChannel[ch]
  ok(`${ch} sample orders`, orders.length >= 10 && orders.length <= 12)
  ok(`${ch} orders revenue`, sum(orders, (o) => o.orderTotal) === row.revenue)
  ok(`${ch} orders cost`, sum(orders, (o) => o.productCost) === row.productCost)
  ok(`${ch} orders shipping`, sum(orders, (o) => o.shipping) === row.shipping)
  ok(`${ch} orders discounts`, sum(orders, (o) => o.discount) === row.discounts)
  ok(`${ch} orders fees`, sum(orders, (o) => o.fees) === row.fees)
  ok(`${ch} orders profit`, sum(orders, (o) => o.profit) === row.profit)
  orders.forEach((o) => {
    const calc = round2(o.orderTotal - o.productCost - o.shipping - o.discount - o.fees)
    ok(`${o.orderNo} profit math`, calc === o.profit)
    if (o.lostOnShipping) ok(`${o.orderNo} shipping loss negative`, o.profit < 0)
  })
})

ok('shipping loss count 2-3', pp.shippingLossCount >= 2 && pp.shippingLossCount <= 3)
ok('shipping loss list', pp.shippingLossOrders.length === pp.shippingLossCount)
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
