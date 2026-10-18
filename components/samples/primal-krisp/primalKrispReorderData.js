const round2 = (n) => Math.round(n * 100) / 100

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysBetween(a, b) {
  return Math.round((parseIso(b) - parseIso(a)) / 86400000)
}

export function storeWholesalePrice(productName, data) {
  const row = data.product_margins_by_channel.find((p) => p.product === productName)
  const price = row?.channels?.Stores?.net_price_per_bag
  return price ?? null
}

export function enrichDueStore(raw, asOf) {
  const lastDaysAgo = daysBetween(raw.last_order_date, asOf)
  const daysOver = lastDaysAgo - raw.usual_gap_days
  return {
    ...raw,
    last_order_days_ago: lastDaysAgo,
    days_over: daysOver,
  }
}

/** Stores past their usual gap, sorted by days over (desc). */
export function getDueToReorderStores(data) {
  const block = data.due_to_reorder
  const asOf = block?.as_of || '2026-10-15'
  if (!block?.stores) return []
  return block.stores
    .map((s) => enrichDueStore(s, asOf))
    .filter((s) => s.last_order_days_ago > s.usual_gap_days)
    .sort((a, b) => b.days_over - a.days_over)
}

export function reorderAsOf(data) {
  return data.due_to_reorder?.as_of || '2026-10-15'
}

export function salesSeptForStore(storeName, data) {
  const st = data.stores.list.find((s) => s.name === storeName)
  return st?.sample?.sales_sept ?? null
}

export function topStoreNames(data) {
  return [...data.stores.list]
    .map((s) => ({ name: s.name, rev: s.sample.sales_sept || 0 }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 6)
    .map((s) => s.name)
}

export function septOrderAmountInHistory(store) {
  const septRows = (store.order_history || []).filter((o) => o.date.startsWith('2026-09'))
  if (!septRows.length) return null
  return round2(septRows.reduce((s, o) => s + o.amount, 0))
}

export function lineItemsTotal(lines) {
  return round2((lines || []).reduce((s, ln) => s + ln.line_total, 0))
}

export { round2 }
