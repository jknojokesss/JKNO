/**
 * September profit-per-order — channel summary ties to P&L; recent orders are a sample.
 */
import { CHANNELS, STORE_ACCOUNTS } from './aufschnittCatalog.js'
import { roundCents, sumCents } from './aufschnittUtils.js'

const SEP = '2026-09'

export const SEP_NET_PROFIT_TARGET = 16_720

export const SEP_FULFILLMENT = {
  storesShipping: 4_940,
  storesCard: 764.4,
  ownCardRate: 0.029,
  ownCardPerOrder: 0.3,
}

const OWN_SITE_CUSTOMERS = [
  'Rachel M.',
  'David K.',
  'Miriam S.',
  'Yosef L.',
  'Chana R.',
  'Eli B.',
  'Sara T.',
  'Menachem H.',
  'Leah G.',
  'Avi P.',
  'Rivka N.',
]

const AMAZON_CUSTOMERS = [
  'Jason R.',
  'Nicole W.',
  'Marcus T.',
  'Olivia H.',
  'Brian C.',
  'Emily F.',
  'Kevin M.',
  'Laura S.',
  'Aaron J.',
  'Diana L.',
  'Chris B.',
  'Hannah K.',
]

const WEB_SKUS = [
  { name: 'Beef jerky Original 3 oz', unit: 8.99 },
  { name: 'Beef jerky Teriyaki 3 oz', unit: 8.99 },
  { name: 'Beef jerky Hot 3 oz', unit: 8.99 },
  { name: 'Beef jerky Sweet & Spicy 3 oz', unit: 9.49 },
  { name: 'Turkey jerky Original 3 oz', unit: 8.49 },
  { name: 'Beef sticks Original 5 pack', unit: 11.99 },
  { name: 'Beef sticks Spicy 5 pack', unit: 11.99 },
  { name: 'Salami chips Original', unit: 6.99 },
  { name: 'Biltong Original 4 oz', unit: 12.99 },
  { name: 'Dry sausage sticks Original', unit: 13.99 },
  { name: 'Salumi 6 oz', unit: 14.99 },
]

const AMAZON_SKUS = WEB_SKUS

const STORE_CASE_LINES = [
  { name: 'Beef jerky Original — case of 12', unit: 72 },
  { name: 'Beef jerky Teriyaki — case of 12', unit: 72 },
  { name: 'Beef sticks Original — case', unit: 96 },
  { name: 'Salami chips — case', unit: 84 },
  { name: 'Biltong Original — case', unit: 108 },
  { name: 'Dry sausage — case', unit: 90 },
  { name: 'Salumi — case', unit: 120 },
]

function opexAmt(pnl, label) {
  return pnl.operating_expenses_entries.find((e) => e.l === label)?.n || 0
}

function allocCogs(channelRev, revenueTotal, cogsTotal) {
  return roundCents((cogsTotal * channelRev) / revenueTotal)
}

function channelOrderCount(channel, revenue) {
  if (channel === 'Stores') return Math.max(120, Math.round(revenue / 720))
  if (channel === 'Amazon') return Math.max(400, Math.round(revenue / 76))
  return Math.max(180, Math.round(revenue / 100))
}

function buildChannelSummary(pnl) {
  const revenueTotal = pnl.revenue_total
  const cogsTotal = pnl.cogs
  const amazonFees = opexAmt(pnl, 'Amazon fees')
  const storePromos = opexAmt(pnl, 'Store promos and credits')
  const shippingTotal = opexAmt(pnl, 'Shipping to customers')
  const cardTotal = opexAmt(pnl, 'Card processing')

  const storesShipping = SEP_FULFILLMENT.storesShipping
  const ownShipping = roundCents(shippingTotal - storesShipping)
  const storesFees = SEP_FULFILLMENT.storesCard
  const ownFees = roundCents(cardTotal - storesFees)

  const rows = CHANNELS.map((channel) => {
    const revenue = pnl.revenue[channel]
    const productCost = allocCogs(revenue, revenueTotal, cogsTotal)
    const discounts = channel === 'Stores' ? storePromos : 0
    const shipping =
      channel === 'Stores' ? storesShipping : channel === 'Own site' ? ownShipping : 0
    const fees =
      channel === 'Amazon' ? amazonFees : channel === 'Stores' ? storesFees : ownFees
    const profit = roundCents(revenue - productCost - shipping - discounts - fees)
    const orders = channelOrderCount(channel, revenue)
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0
    const avgProfitPerOrder = orders > 0 ? roundCents(profit / orders) : 0
    return {
      channel,
      orders,
      revenue,
      productCost,
      shipping,
      discounts,
      fees,
      profit,
      marginPct,
      avgProfitPerOrder,
    }
  })

  let profitFix = roundCents(
    pnl.gross_profit -
      amazonFees -
      storePromos -
      shippingTotal -
      cardTotal -
      sumCents(rows, (r) => r.profit)
  )
  if (profitFix) {
    const anchor = rows.find((r) => r.channel === 'Stores')
    if (anchor) anchor.profit = roundCents(anchor.profit + profitFix)
  }

  return rows
}

function buildLinesFromSpec(skus, lineSpec, costRate) {
  return lineSpec.map(([skuIdx, qty]) => {
    const sku = skus[skuIdx % skus.length]
    const revenue = roundCents(sku.unit * qty)
    return {
      description: sku.name,
      qty,
      unitPrice: sku.unit,
      revenue,
      cost: roundCents(revenue * costRate),
    }
  })
}

function itemsSummary(lines) {
  return lines.map((l) => `${l.description} x${l.qty}`).join(', ')
}

function syncLineCost(lines, productCost) {
  const lineCost = sumCents(lines, (l) => l.cost)
  const costAdj = roundCents(productCost - lineCost)
  if (costAdj && lines.length) lines[0].cost = roundCents(lines[0].cost + costAdj)
}

function ownSiteCardFee(orderTotal) {
  return roundCents(orderTotal * SEP_FULFILLMENT.ownCardRate + SEP_FULFILLMENT.ownCardPerOrder)
}

function storeCardFee(orderTotal, cardOrder) {
  return cardOrder ? roundCents(orderTotal * SEP_FULFILLMENT.ownCardRate) : 0
}

function mkOrder(fields) {
  const profit = roundCents(
    fields.orderTotal - fields.productCost - fields.shipping - fields.discount - fields.fees
  )
  return { ...fields, profit, lostOnShipping: !!fields.lostOnShipping }
}

function buildOwnSiteRecentOrders() {
  const specs = [
    { day: 4, cust: 0, no: 5124, lines: [[0, 3], [5, 2]], ship: 8.5, disc: 0 },
    { day: 7, cust: 1, no: 5131, lines: [[1, 4], [7, 2]], ship: 10, disc: 0 },
    { day: 9, cust: 2, no: 5138, lines: [[2, 2], [7, 1]], ship: 16, disc: 0, lost: true, profit: -6.5 },
    { day: 11, cust: 3, no: 5142, lines: [[0, 5], [10, 2], [5, 1]], ship: 12, disc: 8 },
    { day: 14, cust: 4, no: 5150, lines: [[0, 4], [8, 1]], ship: 9.5, disc: 0 },
    { day: 16, cust: 5, no: 5156, lines: [[1, 6], [5, 3], [9, 1]], ship: 14, disc: 10 },
    { day: 19, cust: 6, no: 5163, lines: [[6, 2], [7, 1]], ship: 15, disc: 0, lost: true, profit: -9.25 },
    { day: 21, cust: 7, no: 5171, lines: [[4, 5], [9, 2]], ship: 11, disc: 5 },
    { day: 23, cust: 8, no: 5178, lines: [[0, 3], [5, 2]], ship: 7.5, disc: 0 },
    { day: 26, cust: 9, no: 5184, lines: [[1, 8], [10, 3]], ship: 17, disc: 15 },
    { day: 28, cust: 10, no: 5190, lines: [[2, 3], [6, 2], [8, 1]], ship: 9, disc: 0 },
  ]
  return specs.map((s, i) => {
    const lines = buildLinesFromSpec(WEB_SKUS, s.lines, 0.59)
    const orderTotal = sumCents(lines, (l) => l.revenue)
    const productCost = roundCents(orderTotal * 0.59)
    syncLineCost(lines, productCost)
    const fees = ownSiteCardFee(orderTotal)
    let shipping = s.ship
    let discount = s.disc
    if (s.lost) {
      const profit = s.profit
      shipping = roundCents(orderTotal - productCost - discount - fees - profit)
    }
    return mkOrder({
      id: `Own site-${i}`,
      orderNo: `WEB-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: OWN_SITE_CUSTOMERS[s.cust],
      items: itemsSummary(lines),
      orderTotal,
      productCost,
      shipping,
      discount,
      fees,
      lostOnShipping: s.lost,
      lines,
    })
  })
}

function buildAmazonRecentOrders() {
  const specs = [
    { day: 3, cust: 0, no: 882104, lines: [[0, 3], [7, 1]], fulfill: 5.25 },
    { day: 5, cust: 1, no: 882211, lines: [[1, 3], [5, 1]], fulfill: 5.5 },
    { day: 8, cust: 2, no: 882318, lines: [[2, 3]], fulfill: 4.75 },
    { day: 10, cust: 3, no: 882402, lines: [[0, 4], [6, 1]], fulfill: 6 },
    { day: 12, cust: 4, no: 882519, lines: [[4, 2], [7, 2]], fulfill: 5.1 },
    { day: 15, cust: 5, no: 882604, lines: [[5, 3], [8, 1]], fulfill: 6.25 },
    { day: 17, cust: 6, no: 882711, lines: [[3, 2], [9, 1]], fulfill: 4.9 },
    { day: 18, cust: 7, no: 882823, lines: [[1, 4]], fulfill: 5.4 },
    { day: 20, cust: 8, no: 882901, lines: [[0, 2], [10, 1]], fulfill: 5 },
    { day: 22, cust: 9, no: 883012, lines: [[2, 3], [6, 1]], fulfill: 5.8 },
    { day: 25, cust: 10, no: 883118, lines: [[7, 3], [0, 1]], fulfill: 4.6 },
    { day: 27, cust: 11, no: 883205, lines: [[1, 2], [5, 2]], fulfill: 5.35 },
  ]
  return specs.map((s, i) => {
    const lines = buildLinesFromSpec(AMAZON_SKUS, s.lines, 0.58)
    const orderTotal = sumCents(lines, (l) => l.revenue)
    const productCost = roundCents(orderTotal * 0.58)
    syncLineCost(lines, productCost)
    const fees = roundCents(orderTotal * 0.15 + s.fulfill)
    return mkOrder({
      id: `Amazon-${i}`,
      orderNo: `AMZ-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: AMAZON_CUSTOMERS[s.cust],
      items: itemsSummary(lines),
      orderTotal,
      productCost,
      shipping: 0,
      discount: 0,
      fees,
      lines,
    })
  })
}

function buildStoresRecentOrders() {
  const specs = [
    { day: 2, store: 6, no: 10431, lines: [[0, 8], [2, 4]], ship: 28, disc: 28, card: true },
    { day: 5, store: 7, no: 10438, lines: [[1, 8], [4, 5]], ship: 26, disc: 0, card: false },
    { day: 8, store: 0, no: 10445, lines: [[3, 4], [5, 4]], ship: 24, disc: 15, card: true },
    { day: 10, store: 12, no: 10452, lines: [[0, 6], [6, 5]], ship: 27, disc: 22, card: false },
    { day: 13, store: 14, no: 10459, lines: [[5, 2], [2, 2]], ship: 38, disc: 0, lost: true, profit: -11.5, card: true },
    { day: 15, store: 8, no: 10466, lines: [[1, 8], [3, 6]], ship: 30, disc: 35, card: true },
    { day: 17, store: 10, no: 10473, lines: [[4, 5], [5, 3]], ship: 22, disc: 12, card: false },
    { day: 19, store: 4, no: 10480, lines: [[0, 10], [6, 4]], ship: 29, disc: 0, card: false },
    { day: 22, store: 11, no: 10487, lines: [[2, 6], [4, 3]], ship: 25, disc: 18, card: true },
    { day: 24, store: 16, no: 10494, lines: [[1, 6], [6, 4]], ship: 28, disc: 25, card: false },
    { day: 27, store: 2, no: 10501, lines: [[3, 3], [5, 2]], ship: 23, disc: 10, card: true },
  ]
  return specs.map((s, i) => {
    const lines = buildLinesFromSpec(STORE_CASE_LINES, s.lines, 0.57)
    const orderTotal = sumCents(lines, (l) => l.revenue)
    const productCost = roundCents(orderTotal * 0.57)
    syncLineCost(lines, productCost)
    const fees = storeCardFee(orderTotal, s.card)
    let shipping = s.ship
    const discount = s.disc
    if (s.lost) {
      shipping = roundCents(orderTotal - productCost - discount - fees - s.profit)
    }
    return mkOrder({
      id: `Stores-${i}`,
      orderNo: `WS-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: STORE_ACCOUNTS[s.store],
      items: itemsSummary(lines),
      orderTotal,
      productCost,
      shipping,
      discount,
      fees,
      lostOnShipping: s.lost,
      lines,
    })
  })
}

export function buildProfitPerOrder(pnlSep) {
  const channelSummary = buildChannelSummary(pnlSep)
  const ordersByChannel = {
    'Own site': buildOwnSiteRecentOrders(),
    Amazon: buildAmazonRecentOrders(),
    Stores: buildStoresRecentOrders(),
  }

  const shippingLossOrders = CHANNELS.flatMap((ch) =>
    ordersByChannel[ch].filter((o) => o.lostOnShipping).map((o) => ({ ...o, channel: ch }))
  )
  const shippingLossTotal = sumCents(shippingLossOrders, (o) => o.profit)

  const totalOrders = sumCents(channelSummary, (r) => r.orders)
  const totalProfit = sumCents(channelSummary, (r) => r.profit)
  const blendedAvgProfitPerOrder = totalOrders > 0 ? roundCents(totalProfit / totalOrders) : 0

  const variableSelling =
    opexAmt(pnlSep, 'Amazon fees') +
    opexAmt(pnlSep, 'Store promos and credits') +
    opexAmt(pnlSep, 'Shipping to customers') +
    opexAmt(pnlSep, 'Card processing')
  const contributionAfterFulfillment = roundCents(pnlSep.gross_profit - variableSelling)

  return {
    month: SEP,
    channelSummary,
    ordersByChannel,
    shippingLossOrders,
    shippingLossCount: shippingLossOrders.length,
    shippingLossTotal,
    blendedAvgProfitPerOrder,
    totalOrders,
    totalProfit,
    contributionAfterFulfillment,
    ties: {
      cogs: pnlSep.cogs,
      grossProfit: pnlSep.gross_profit,
      variableSelling,
    },
  }
}
