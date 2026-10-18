/**
 * September profit-per-order model — channel rows tie to P&L COGS and variable
 * selling costs (Amazon fees, store promos, shipping, card processing).
 */
import { CHANNELS, PRODUCT_DEFS, STORE_ACCOUNTS } from './aufschnittCatalog.js'
import { roundCents, sumCents } from './aufschnittUtils.js'

const SEP = '2026-09'

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
  'Shmuel D.',
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

const SHORT_ITEMS = [
  'Beef jerky',
  'Turkey jerky',
  'Beef sticks',
  'Salumi',
  'Biltong',
  'Salami chips',
  'Dry sausage',
  'Salmon jerky',
]

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function opexAmt(pnl, label) {
  return pnl.operating_expenses_entries.find((e) => e.l === label)?.n || 0
}

function allocCogs(channelRev, revenueTotal, cogsTotal) {
  return roundCents((cogsTotal * channelRev) / revenueTotal)
}

/** Card processing in P&L is own-site formula; split for Stores vs Own site in profit view. */
function splitCardFees(storesRev, ownRev, cardTotal) {
  const w = storesRev + ownRev
  if (w <= 0) return { Stores: 0, 'Own site': 0 }
  const stores = roundCents((cardTotal * storesRev) / w)
  const own = roundCents(cardTotal - stores)
  return { Stores: stores, 'Own site': own }
}

function channelOrderCount(channel, revenue) {
  if (channel === 'Stores') return Math.max(120, Math.round(revenue / 720))
  if (channel === 'Amazon') return Math.max(400, Math.round(revenue / 76))
  return Math.max(180, Math.round(revenue / 100))
}

function pickItems(seed, n) {
  const items = []
  for (let i = 0; i < n; i++) {
    const name = SHORT_ITEMS[(seed + i * 7) % SHORT_ITEMS.length]
    const qty = 1 + ((seed + i) % 4)
    items.push({ label: name, qty })
  }
  return items
}

function itemsSummary(items) {
  return items.map((it) => `${it.label} x${it.qty}`).join(', ')
}

function buildChannelSummary(pnl, salesRows) {
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

function distributeAmount(total, weights) {
  const wSum = weights.reduce((s, w) => s + w, 0)
  const raw = weights.map((w) => (total * w) / wSum)
  const floored = raw.map((v) => Math.floor(v * 100) / 100)
  let rem = Math.round(total * 100) - floored.reduce((s, v) => s + Math.round(v * 100), 0)
  const out = [...floored]
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v * 100) / 100 }))
    .sort((a, b) => b.frac - a.frac)
  for (let j = 0; j < rem; j++) out[order[j % order.length].i] = roundCents(out[order[j % order.length].i] + 0.01)
  return out
}

function buildSampleOrders(channelRow, channel) {
  const count = channel === 'Stores' ? 11 : channel === 'Amazon' ? 12 : 11
  const weights = Array.from({ length: count }, (_, i) => 0.6 + (hash(`${channel}-${i}`) % 40) / 100)
  const revParts = distributeAmount(channelRow.revenue, weights)
  const costParts = distributeAmount(channelRow.productCost, weights)
  const shipParts = distributeAmount(channelRow.shipping, weights)
  const discParts = distributeAmount(channelRow.discounts, weights)
  const feeParts = distributeAmount(channelRow.fees, weights)

  const shippingLossIdx =
    channel === 'Own site' ? [2, 7] : channel === 'Stores' ? [4] : []

  const orders = []
  for (let i = 0; i < count; i++) {
    const seed = hash(`${channel}|${i}`)
    let shipping = shipParts[i]
    let revenue = revParts[i]
    let productCost = costParts[i]
    let discount = discParts[i]
    let fees = feeParts[i]
    let lostOnShipping = false

    if (shippingLossIdx.includes(i)) {
      lostOnShipping = true
      shipping = roundCents(shipping + 18 + (seed % 9))
      revenue = roundCents(Math.max(48, revenue * 0.42))
      productCost = roundCents(productCost * 0.4)
      fees = roundCents(fees * 0.35)
      discount = 0
    }

    let profit = roundCents(revenue - productCost - shipping - discount - fees)
    if (lostOnShipping && profit >= 0) {
      profit = roundCents(-(8 + (seed % 12)))
      shipping = roundCents(revenue - productCost - discount - fees - profit)
    }

    const day = 3 + (seed % 26)
    const date = `2026-09-${String(day).padStart(2, '0')}`
    let customer
    let orderNo
    if (channel === 'Stores') {
      customer = STORE_ACCOUNTS[(seed + i) % STORE_ACCOUNTS.length]
      orderNo = `WS-${10420 + i + (seed % 40)}`
    } else if (channel === 'Amazon') {
      customer = AMAZON_CUSTOMERS[i % AMAZON_CUSTOMERS.length]
      orderNo = `AMZ-${8200 + seed % 9000}`
    } else {
      customer = OWN_SITE_CUSTOMERS[i % OWN_SITE_CUSTOMERS.length]
      orderNo = `WEB-${5100 + i + (seed % 200)}`
    }

    const lineItems = pickItems(seed, 2 + (seed % 2)).map((it, li) => {
      const unit = roundCents(12 + ((seed + li * 11) % 28))
      const lineRev = roundCents(unit * it.qty)
      const lineCost = roundCents(lineRev * 0.58)
      return {
        description: `${it.label} ${it.qty > 1 ? `${it.qty} ct` : ''}`.trim(),
        qty: it.qty,
        revenue: lineRev,
        cost: lineCost,
      }
    })
    let lineRevSum = sumCents(lineItems, (l) => l.revenue)
    if (lineRevSum !== revenue && lineItems.length) {
      const diff = roundCents(revenue - lineRevSum)
      lineItems[0].revenue = roundCents(lineItems[0].revenue + diff)
      lineItems[0].cost = roundCents(lineItems[0].cost + diff * 0.58)
    }

    orders.push({
      id: `${channel}-${i}`,
      orderNo,
      date,
      customer,
      items: itemsSummary(pickItems(seed, 2 + (seed % 2))),
      orderTotal: revenue,
      productCost,
      shipping,
      discount,
      fees,
      profit,
      lostOnShipping,
      lines: lineItems,
    })
  }

  const reconcileField = (orderKey, rowKey) => {
    const target = channelRow[rowKey]
    const got = sumCents(orders, (o) => o[orderKey])
    const diff = roundCents(target - got)
    if (diff && orders.length) {
      orders[orders.length - 1][orderKey] = roundCents(orders[orders.length - 1][orderKey] + diff)
    }
  }
  reconcileField('orderTotal', 'revenue')
  reconcileField('productCost', 'productCost')
  reconcileField('discount', 'discounts')
  reconcileField('fees', 'fees')
  const shipOthers = sumCents(orders.slice(0, -1), (o) => o.shipping)
  orders[orders.length - 1].shipping = roundCents(channelRow.shipping - shipOthers)

  orders.forEach((o) => {
    o.profit = roundCents(o.orderTotal - o.productCost - o.shipping - o.discount - o.fees)
  })
  const profitDiff = roundCents(channelRow.profit - sumCents(orders, (o) => o.profit))
  if (profitDiff && orders.length) {
    const last = orders[orders.length - 1]
    last.shipping = roundCents(last.shipping - profitDiff)
    last.profit = roundCents(last.orderTotal - last.productCost - last.shipping - last.discount - last.fees)
  }

  return orders
}

export function buildProfitPerOrder(pnlSep) {
  const channelSummary = buildChannelSummary(pnlSep, [])
  const ordersByChannel = {}
  CHANNELS.forEach((ch) => {
    const row = channelSummary.find((r) => r.channel === ch)
    ordersByChannel[ch] = buildSampleOrders(row, ch)
  })

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
