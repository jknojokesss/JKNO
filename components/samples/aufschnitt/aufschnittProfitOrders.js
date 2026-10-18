/**
 * September profit-per-order — channel summary ties to P&L; recent orders are a
 * realistic sample only (they do not sum to the month).
 */
import { CHANNELS, STORE_ACCOUNTS } from './aufschnittCatalog.js'
import { roundCents, sumCents } from './aufschnittUtils.js'

const SEP = '2026-09'
const COGS_RATE = 0.603

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

/** Retail SKUs on this sample — no fish / salmon. */
const WEB_SKUS = [
  { name: 'Beef jerky Original', unit: 4.49 },
  { name: 'Beef jerky Teriyaki', unit: 4.59 },
  { name: 'Beef jerky Hot', unit: 4.59 },
  { name: 'Beef jerky Sweet & Spicy', unit: 4.69 },
  { name: 'Turkey jerky Original', unit: 4.39 },
  { name: 'Beef sticks Original', unit: 5.29 },
  { name: 'Beef sticks Spicy', unit: 5.39 },
  { name: 'Salami chips Original', unit: 3.89 },
  { name: 'Biltong Original', unit: 5.79 },
  { name: 'Dry sausage sticks Original', unit: 4.99 },
  { name: 'Salumi snack pack', unit: 6.49 },
]

const AMAZON_SKUS = [
  { name: 'Beef jerky Original', unit: 8.99 },
  { name: 'Beef jerky Teriyaki', unit: 9.49 },
  { name: 'Beef sticks Original', unit: 11.99 },
  { name: 'Salami chips Original', unit: 7.49 },
  { name: 'Biltong Original', unit: 10.99 },
  { name: 'Dry sausage sticks Chili', unit: 9.99 },
]

const STORE_CASE_LINES = [
  { name: 'Beef jerky Original — case', unit: 52 },
  { name: 'Beef jerky Teriyaki — case', unit: 54 },
  { name: 'Beef sticks Original — case', unit: 48 },
  { name: 'Salami chips — case', unit: 62 },
  { name: 'Biltong Original — case', unit: 58 },
  { name: 'Dry sausage — case', unit: 45 },
  { name: 'Salumi — case', unit: 72 },
]

function opexAmt(pnl, label) {
  return pnl.operating_expenses_entries.find((e) => e.l === label)?.n || 0
}

function allocCogs(channelRev, revenueTotal, cogsTotal) {
  return roundCents((cogsTotal * channelRev) / revenueTotal)
}

function splitCardFees(storesRev, ownRev, cardTotal) {
  const w = storesRev + ownRev
  if (w <= 0) return { Stores: 0, 'Own site': 0 }
  const stores = roundCents((cardTotal * storesRev) / w)
  return { Stores: stores, 'Own site': roundCents(cardTotal - stores) }
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
  const storesRev = pnl.revenue.Stores
  const ownRev = pnl.revenue['Own site']
  const cardSplit = splitCardFees(storesRev, ownRev, cardTotal)

  const storesShipping = roundCents(shippingTotal * 0.131)
  const ownShipping = roundCents(shippingTotal - storesShipping)

  const rows = CHANNELS.map((channel) => {
    const revenue = pnl.revenue[channel]
    const productCost = allocCogs(revenue, revenueTotal, cogsTotal)
    const discounts = channel === 'Stores' ? storePromos : 0
    const shipping =
      channel === 'Stores' ? storesShipping : channel === 'Own site' ? ownShipping : 0
    const fees =
      channel === 'Amazon'
        ? amazonFees
        : channel === 'Stores'
          ? cardSplit.Stores
          : cardSplit['Own site']
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

function buildLines(orderTotal, skus, lineSpec, costRate = COGS_RATE) {
  const lines = []
  let running = 0
  lineSpec.forEach(([skuIdx, qty], i) => {
    const sku = skus[skuIdx % skus.length]
    const isLast = i === lineSpec.length - 1
    let unitPrice = sku.unit
    let q = qty
    let revenue
    if (isLast) {
      revenue = roundCents(orderTotal - running)
      if (q === 1) {
        unitPrice = revenue
      } else {
        unitPrice = roundCents(revenue / q)
        revenue = roundCents(unitPrice * q)
        const target = roundCents(orderTotal - running)
        if (revenue !== target) {
          q = 1
          unitPrice = target
          revenue = target
        }
      }
    } else {
      revenue = roundCents(unitPrice * q)
      running = roundCents(running + revenue)
    }
    lines.push({
      description: sku.name,
      qty: q,
      unitPrice,
      revenue,
      cost: roundCents(revenue * costRate),
    })
  })
  return lines
}

function itemsSummary(lines) {
  return lines.map((l) => `${l.description} x${l.qty}`).join(', ')
}

function mkOrder({
  id,
  orderNo,
  date,
  customer,
  orderTotal,
  productCost,
  shipping,
  discount,
  fees,
  lostOnShipping,
  lines,
}) {
  const profit = roundCents(orderTotal - productCost - shipping - discount - fees)
  return {
    id,
    orderNo,
    date,
    customer,
    items: itemsSummary(lines),
    orderTotal,
    productCost,
    shipping,
    discount,
    fees,
    profit,
    lostOnShipping: !!lostOnShipping,
    lines,
  }
}

function buildOwnSiteRecentOrders() {
  const specs = [
    { day: 4, cust: 0, no: 5124, total: 58.87, ship: 9.5, disc: 0, lines: [[0, 3], [7, 2]] },
    { day: 7, cust: 1, no: 5131, total: 94.24, ship: 11, disc: 5, lines: [[1, 4], [5, 6]] },
    { day: 9, cust: 2, no: 5138, total: 42.5, ship: 14.25, disc: 0, lost: true, lines: [[3, 2], [8, 1]] },
    { day: 11, cust: 3, no: 5142, total: 127.6, ship: 12, disc: 10, lines: [[0, 6], [4, 4], [9, 2]] },
    { day: 14, cust: 4, no: 5150, total: 76.33, ship: 8.75, disc: 0, lines: [[2, 5], [7, 3]] },
    { day: 16, cust: 5, no: 5156, total: 148.9, ship: 15, disc: 12, lines: [[1, 8], [5, 8], [10, 2]] },
    { day: 19, cust: 6, no: 5163, total: 39.95, ship: 13.5, disc: 0, lost: true, lines: [[6, 3], [8, 2]] },
    { day: 21, cust: 7, no: 5171, total: 112.44, ship: 10.5, disc: 8, lines: [[4, 6], [9, 4]] },
    { day: 23, cust: 8, no: 5178, total: 67.18, ship: 7.25, disc: 0, lines: [[0, 4], [3, 3], [7, 2]] },
    { day: 26, cust: 9, no: 5184, total: 155.2, ship: 18, disc: 15, lines: [[1, 10], [5, 10]] },
    { day: 28, cust: 10, no: 5190, total: 88.06, ship: 9, disc: 0, lines: [[2, 4], [6, 6], [10, 1]] },
  ]
  return specs.map((s, i) => {
    const orderTotal = s.total
    const productCost = roundCents(orderTotal * COGS_RATE)
    const fees = roundCents(orderTotal * 0.03)
    let shipping = s.ship
    let profit = roundCents(orderTotal - productCost - shipping - s.disc - fees)
    if (s.lost) {
      profit = roundCents(-(4 + (i % 9)))
      shipping = roundCents(orderTotal - productCost - s.disc - fees - profit)
    }
    const lines = buildLines(orderTotal, WEB_SKUS, s.lines)
    const lineCost = sumCents(lines, (l) => l.cost)
    const costAdj = roundCents(productCost - lineCost)
    if (costAdj && lines.length) lines[0].cost = roundCents(lines[0].cost + costAdj)

    return mkOrder({
      id: `Own site-${i}`,
      orderNo: `WEB-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: OWN_SITE_CUSTOMERS[s.cust],
      orderTotal,
      productCost,
      shipping,
      discount: s.disc,
      fees,
      lostOnShipping: s.lost,
      lines,
    })
  })
}

function buildAmazonRecentOrders() {
  const specs = [
    { day: 3, cust: 0, no: 882104, total: 34.97, fulfill: 5.2, lines: [[0, 2], [2, 1]] },
    { day: 5, cust: 1, no: 882211, total: 52.45, fulfill: 5.5, lines: [[1, 3], [4, 2]] },
    { day: 8, cust: 2, no: 882318, total: 28.5, fulfill: 4.75, lines: [[3, 2], [5, 1]] },
    { day: 10, cust: 3, no: 882402, total: 67.88, fulfill: 6, lines: [[0, 4], [2, 3]] },
    { day: 12, cust: 4, no: 882519, total: 41.2, fulfill: 5.1, lines: [[4, 2], [1, 2]] },
    { day: 15, cust: 5, no: 882604, total: 89.95, fulfill: 6.25, lines: [[2, 5], [3, 4]] },
    { day: 17, cust: 6, no: 882711, total: 36.75, fulfill: 4.9, lines: [[5, 2], [0, 1]] },
    { day: 18, cust: 7, no: 882823, total: 58.4, fulfill: 5.4, lines: [[1, 4], [4, 1]] },
    { day: 20, cust: 8, no: 882901, total: 45.6, fulfill: 5, lines: [[3, 3], [5, 2]] },
    { day: 22, cust: 9, no: 883012, total: 72.3, fulfill: 5.8, lines: [[2, 4], [4, 2]] },
    { day: 25, cust: 10, no: 883118, total: 31.99, fulfill: 4.6, lines: [[0, 2], [5, 1]] },
    { day: 27, cust: 11, no: 883205, total: 54.15, fulfill: 5.35, lines: [[1, 3], [3, 2]] },
  ]
  return specs.map((s, i) => {
    const orderTotal = s.total
    const productCost = roundCents(orderTotal * COGS_RATE)
    const referral = roundCents(orderTotal * 0.15)
    const fees = roundCents(referral + s.fulfill)
    const shipping = 0
    const lines = buildLines(orderTotal, AMAZON_SKUS, s.lines)
    const lineCost = sumCents(lines, (l) => l.cost)
    const costAdj = roundCents(productCost - lineCost)
    if (costAdj && lines.length) lines[0].cost = roundCents(lines[0].cost + costAdj)

    return mkOrder({
      id: `Amazon-${i}`,
      orderNo: `AMZ-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: AMAZON_CUSTOMERS[s.cust],
      orderTotal,
      productCost,
      shipping,
      discount: 0,
      fees,
      lines,
    })
  })
}

function buildStoresRecentOrders() {
  const specs = [
    { day: 2, store: 6, no: 10431, total: 864, ship: 42, disc: 28, cases: [[0, 8], [2, 6]] },
    { day: 5, store: 7, no: 10438, total: 1124, ship: 48, disc: 0, cases: [[1, 12], [4, 8]] },
    { day: 8, store: 0, no: 10445, total: 468, ship: 38, disc: 15, cases: [[3, 6], [5, 4]] },
    { day: 10, store: 12, no: 10452, total: 692, ship: 35, disc: 22, cases: [[0, 6], [6, 6]] },
    { day: 13, store: 14, no: 10459, total: 318, ship: 52, disc: 0, lost: true, cases: [[5, 4], [2, 2]] },
    { day: 15, store: 8, no: 10466, total: 956, ship: 44, disc: 35, cases: [[1, 10], [3, 8]] },
    { day: 17, store: 10, no: 10473, total: 540, ship: 28, disc: 12, cases: [[4, 6], [5, 6]] },
    { day: 19, store: 4, no: 10480, total: 1188, ship: 55, disc: 0, cases: [[0, 14], [6, 10]] },
    { day: 22, store: 11, no: 10487, total: 624, ship: 32, disc: 18, cases: [[2, 8], [4, 4]] },
    { day: 24, store: 16, no: 10494, total: 792, ship: 40, disc: 25, cases: [[1, 8], [6, 8]] },
    { day: 27, store: 2, no: 10501, total: 408, ship: 24, disc: 10, cases: [[3, 4], [5, 4]] },
  ]
  return specs.map((s, i) => {
    const orderTotal = s.total
    const productCost = roundCents(orderTotal * 0.58)
    const fees = roundCents(orderTotal * 0.0045)
    let shipping = s.ship
    let discount = s.disc
    let profit = roundCents(orderTotal - productCost - shipping - discount - fees)
    if (s.lost) {
      profit = roundCents(-11.5)
      shipping = roundCents(orderTotal - productCost - discount - fees - profit)
    }
    const lines = buildLines(orderTotal, STORE_CASE_LINES, s.cases, 0.58)
    const lineCost = sumCents(lines, (l) => l.cost)
    const costAdj = roundCents(productCost - lineCost)
    if (costAdj && lines.length) lines[0].cost = roundCents(lines[0].cost + costAdj)

    return mkOrder({
      id: `Stores-${i}`,
      orderNo: `WS-${s.no}`,
      date: `2026-09-${String(s.day).padStart(2, '0')}`,
      customer: STORE_ACCOUNTS[s.store],
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
