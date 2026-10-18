import DATA from '../../../data/popinsanity.json'
import { sumBy } from './popinsanityUtils'

export { DATA }

export const tierById = Object.fromEntries(DATA.tiers.map((t) => [t.id, t]))

export function channelTotal(ch) {
  if (ch.id === 'corporate') return sumBy(ch.shipped_this, 'amount')
  if (ch.id === 'wholesale') return sumBy(ch.stores, 'sales_this')
  return sumBy(ch.lines, 'this')
}

export function channelPrior(ch) {
  if (ch.id === 'corporate') return sumBy(ch.shipped_prior, 'amount')
  if (ch.id === 'wholesale') return sumBy(ch.stores, 'sales_prior')
  return sumBy(ch.lines, 'prior')
}

export function allChannelSales() {
  const thisMonth = DATA.channels.reduce((s, c) => s + channelTotal(c), 0)
  const prior = DATA.channels.reduce((s, c) => s + channelPrior(c), 0)
  return {
    thisMonth,
    prior,
    rows: DATA.channels.map((c) => ({ id: c.id, name: c.name, this: channelTotal(c), prior: channelPrior(c) })),
  }
}

export function wholesaleChannel() {
  return DATA.channels.find((c) => c.id === 'wholesale')
}

export function storeByName(name) {
  return wholesaleChannel()?.stores.find((s) => s.name === name) || null
}

export function wholesaleStats() {
  const ch = wholesaleChannel()
  const stores = ch?.stores || []
  let past30 = 0
  let bucket0 = 0
  let bucket31 = 0
  let bucket61 = 0
  stores.forEach((s) => {
    s.open_invoices.forEach((inv) => {
      if (inv.age_days > 30) past30 += inv.amount
      if (inv.age_days <= 30) bucket0 += inv.amount
      else if (inv.age_days <= 60) bucket31 += inv.amount
      else bucket61 += inv.amount
    })
  })
  return {
    stores,
    terms: ch?.terms || '',
    count: stores.length,
    salesThis: sumBy(stores, 'sales_this'),
    salesPrior: sumBy(stores, 'sales_prior'),
    owed: sumBy(stores, 'owed'),
    past30,
    aging: { bucket0, bucket31, bucket61 },
  }
}

export function storeOldestDays(store) {
  if (!store.open_invoices?.length) return null
  return Math.max(...store.open_invoices.map((i) => i.age_days))
}

/** Flat open wholesale invoices with store name; filter: all | past30 | bucket0 | bucket31 | bucket61 */
export function wholesaleInvoicesFiltered(filter = 'all') {
  const stores = wholesaleChannel()?.stores || []
  const rows = []
  stores.forEach((s) => {
    s.open_invoices.forEach((inv) => {
      rows.push({ ...inv, storeName: s.name })
    })
  })
  if (filter === 'past30') return rows.filter((i) => i.age_days > 30)
  if (filter === 'bucket0') return rows.filter((i) => i.age_days <= 30)
  if (filter === 'bucket31') return rows.filter((i) => i.age_days > 30 && i.age_days <= 60)
  if (filter === 'bucket61') return rows.filter((i) => i.age_days > 60)
  return rows
}

export function holidayTotals() {
  const orders = DATA.holiday_orders
  return {
    booked: sumBy(orders, 'order_total'),
    deposits: sumBy(orders, 'deposit_received'),
    balance: sumBy(orders, 'balance_due'),
    units: sumBy(orders, 'units'),
    count: orders.length,
  }
}

export function tierStats(tierId) {
  const tier = tierById[tierId]
  const orders = DATA.holiday_orders.filter((o) => o.tier === tierId)
  const units = sumBy(orders, 'units')
  const marginUnit = tier.price - tier.cost_per_unit
  const revenue = orders.reduce((s, o) => s + o.units * o.price, 0)
  const gross = units * marginUnit
  const marginPct = tier.price > 0 ? (marginUnit / tier.price) * 100 : 0
  return { tier, orders, units, marginUnit, revenue, gross, marginPct }
}

export function allTierRows() {
  return DATA.tiers.map((t) => {
    const s = tierStats(t.id)
    return {
      id: t.id,
      name: t.name,
      price: t.price,
      cost: t.cost_per_unit,
      marginUnit: s.marginUnit,
      marginPct: s.marginPct,
      units: s.units,
      gross: s.gross,
    }
  })
}

export function pnlComputed() {
  const revTotal = sumBy(DATA.pnl.revenue, 'this')
  const revPrior = sumBy(DATA.pnl.revenue, 'prior')
  const cogsTotal = sumBy(DATA.pnl.cogs, 'this')
  const cogsPrior = sumBy(DATA.pnl.cogs, 'prior')
  const opexTotal = sumBy(DATA.pnl.opex, 'this')
  const opexPrior = sumBy(DATA.pnl.opex, 'prior')
  const gross = revTotal - cogsTotal
  const grossPrior = revPrior - cogsPrior
  const net = gross - opexTotal
  const netPrior = grossPrior - opexPrior
  const grossMarginPct = revTotal ? (gross / revTotal) * 100 : 0
  return {
    revTotal,
    revPrior,
    cogsTotal,
    cogsPrior,
    opexTotal,
    opexPrior,
    gross,
    grossPrior,
    net,
    netPrior,
    grossMarginPct,
  }
}

export function flattenCashDue() {
  const items = []
  DATA.holiday_orders.forEach((o) => {
    o.cash_due.forEach((c) => {
      items.push({
        date: c.date,
        type: c.type,
        amount: c.amount,
        client: o.client,
        orderId: o.id,
      })
    })
  })
  return items
}

export function cashByMonthKey() {
  const items = flattenCashDue()
  const keys = ['2026-10', '2026-11', '2026-12']
  const map = {}
  keys.forEach((k) => {
    map[k] = items.filter((i) => i.date.startsWith(k))
  })
  return { items, map, keys }
}

export function monthLabel(key) {
  if (key === '2026-10') return 'Oct 2026'
  if (key === '2026-11') return 'Nov 2026'
  if (key === '2026-12') return 'Dec 2026'
  return key
}

export const PNL_CHANNEL_MAP = {
  Online: 'online',
  'Shop (Monsey)': 'shop',
  'Wholesale to stores': 'wholesale',
  'Corporate gifts': 'corporate',
}
