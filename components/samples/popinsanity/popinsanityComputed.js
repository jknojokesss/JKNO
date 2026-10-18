import DATA from '../../../data/popinsanity.json'
import { sumBy } from './popinsanityUtils'

export { DATA }

export const tierById = Object.fromEntries(DATA.tiers.map((t) => [t.id, t]))

export function channelTotal(ch) {
  if (ch.id === 'corporate') return sumBy(ch.shipped_this, 'amount')
  return sumBy(ch.lines, 'this')
}

export function channelPrior(ch) {
  if (ch.id === 'corporate') return sumBy(ch.shipped_prior, 'amount')
  return sumBy(ch.lines, 'prior')
}

export function allChannelSales() {
  const online = DATA.channels.find((c) => c.id === 'online')
  const store = DATA.channels.find((c) => c.id === 'store')
  const corp = DATA.channels.find((c) => c.id === 'corporate')
  const thisMonth = channelTotal(online) + channelTotal(store) + channelTotal(corp)
  const prior = channelPrior(online) + channelPrior(store) + channelPrior(corp)
  return { thisMonth, prior, rows: DATA.channels.map((c) => ({ id: c.id, name: c.name, this: channelTotal(c), prior: channelPrior(c) })) }
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
