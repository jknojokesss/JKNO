// Reydel Weldon import window — stocking-era orders only (see CLAUDE.md / orders.js).

/** Earliest order_date we import or treat as inside the live scrape window. */
export const WELDON_MIN_ORDER_DATE = '2026-04-01'

/** Invoiced history URL param — must reach back past MIN_DATE however Weldon counts months. */
export const WELDON_INVOICED_MONTHS = 8

export function isOnOrAfterWeldonMin(orderDate) {
  return typeof orderDate === 'string' && orderDate >= WELDON_MIN_ORDER_DATE
}

/** DB rows eligible for cancel-if-missing: inside [oldestSeen, newestSeen] from this scrape. */
export function weldonCancelCandidate(orderDate, oldestSeen, newestSeen) {
  if (!orderDate || !oldestSeen || !newestSeen) return false
  if (orderDate < WELDON_MIN_ORDER_DATE) return false
  return orderDate >= oldestSeen && orderDate <= newestSeen
}
