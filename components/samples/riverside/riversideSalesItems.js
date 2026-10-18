/** All-time Sales & Items aggregates (closed months + open October). */

const round2 = (n) => Math.round(n * 100) / 100

export function monthItemKeys(salesItemsByMonth) {
  return Object.keys(salesItemsByMonth || {}).filter((k) => /^\d{4}-\d{2}$/.test(k))
}

function mergeItemRows(rowsList) {
  const map = new Map()
  for (const items of rowsList) {
    for (const it of items || []) {
      const hit = map.get(it.item)
      if (hit) {
        hit.units += it.units
        hit.revenue = round2(hit.revenue + it.revenue)
      } else {
        map.set(it.item, { ...it, revenue: round2(it.revenue) })
      }
    }
  }
  return [...map.values()]
}

export function octoberOrdersSlice(orders, asOf) {
  const prefix = asOf.slice(0, 7)
  return orders.filter((o) => o.date.startsWith(prefix) && o.date <= asOf)
}

export function itemsFromOctoberOrders(orders, asOf) {
  const map = new Map()
  for (const o of octoberOrdersSlice(orders, asOf)) {
    const item = o.item || o.size
    if (!item) continue
    const qty = o.qty || 1
    const hit = map.get(item)
    if (hit) {
      hit.units += qty
      hit.revenue = round2(hit.revenue + o.sale)
    } else {
      map.set(item, {
        item,
        units: qty,
        revenue: round2(o.sale),
        category: o.source || 'Other',
      })
    }
  }
  return [...map.values()]
}

export function salesItemsForPeriod({ salesItemsByMonth, orders, asOf, periodKey, fallbackAug }) {
  if (periodKey !== 'all') {
    return salesItemsByMonth?.[periodKey] || fallbackAug || []
  }
  const closed = mergeItemRows(monthItemKeys(salesItemsByMonth).map((k) => salesItemsByMonth[k]))
  const oct = itemsFromOctoberOrders(orders, asOf)
  return mergeItemRows([closed, oct])
}

export function buildPeriodStats({ periodStats, salesItemsByMonth, monthly, orders, asOf, periodKey, lastClosedMonth }) {
  if (periodKey !== 'all') {
    return periodStats?.[periodKey] || periodStats?.[lastClosedMonth] || {}
  }
  const closedRev = round2(monthly.reduce((s, m) => s + m.revenue, 0))
  const closedTickets = monthly.reduce((s, m) => s + (m.ticketCount || 0), 0)
  const octOrders = octoberOrdersSlice(orders, asOf)
  const octRev = round2(octOrders.reduce((s, o) => s + o.sale, 0))
  const items = salesItemsForPeriod({
    salesItemsByMonth,
    orders,
    asOf,
    periodKey: 'all',
    fallbackAug: [],
  })
  const unitsSold = items.reduce((s, i) => s + i.units, 0)
  return {
    revenue: round2(closedRev + octRev),
    unitsSold,
    uniqueItems: items.length,
    ticketCount: closedTickets + octOrders.length,
  }
}
