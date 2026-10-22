import DATA from '../../../data/lease-broker-crm.json'

export const BROKER_DATA = DATA

export function cloneInitialState() {
  return {
    deals: DATA.deals.map((d) => ({
      ...d,
      fee: { ...d.fee },
      quotes: d.quotes.map((q) => ({ ...q })),
      client: { ...d.client },
      vehicle: { ...d.vehicle },
    })),
    dealers: DATA.dealers.map((d) => ({ ...d, brands: [...d.brands] })),
    referrers: DATA.referrers.map((r) => ({ ...r })),
  }
}

const MS_DAY = 86400000

export function parseIso(iso) {
  return new Date(`${iso}T12:00:00.000Z`)
}

export function daysBetween(a, b) {
  return Math.round((parseIso(b) - parseIso(a)) / MS_DAY)
}

export function isQuoteStale(quoteDate, programMonth) {
  if (!quoteDate || !programMonth) return false
  const prog = `${programMonth}-01`
  return quoteDate < prog
}

export function dealerById(dealers, id) {
  return dealers.find((d) => d.id === id)
}

export function referrerById(referrers, id) {
  return referrers.find((r) => r.id === id)
}

export function leasesEndingSoon(deals, asOf, withinDays = 90) {
  const end = parseIso(asOf).getTime() + withinDays * MS_DAY
  const start = parseIso(asOf).getTime()
  return deals
    .filter((d) => d.lease_end)
    .filter((d) => {
      const t = parseIso(d.lease_end).getTime()
      return t >= start && t <= end
    })
    .sort((a, b) => a.lease_end.localeCompare(b.lease_end))
}

export function dealsInProgress(deals) {
  return deals.filter((d) => d.stage !== 'fee_paid')
}

export function feesOwed(deals) {
  return deals.filter((d) => !d.fee.paid && d.fee.amount > 0)
}

/** Delivered cars waiting on broker fee — home screen short list. */
export function feesOwedCollectible(deals) {
  return deals.filter((d) => d.stage === 'delivered' && !d.fee.paid && d.fee.amount > 0)
}

/** Total broker fees due now (delivered, unpaid). Matches Home "Fees owed". */
export function feesOwedTotal(deals) {
  return feesOwedCollectibleTotal(deals)
}

export function feesOwedCollectibleTotal(deals) {
  return feesOwedCollectible(deals).reduce((s, d) => s + d.fee.amount, 0)
}

export function feesCollectedThisMonth(deals, asOf) {
  const ym = asOf.slice(0, 7)
  return deals
    .filter((d) => d.fee.paid && d.fee.paid_date && d.fee.paid_date.slice(0, 7) === ym)
    .reduce((s, d) => s + d.fee.amount, 0)
}

export function referralCounts(deals, referrers) {
  const counts = new Map(referrers.map((r) => [r.id, 0]))
  deals.forEach((d) => {
    if (d.referrer_id && counts.has(d.referrer_id)) counts.set(d.referrer_id, counts.get(d.referrer_id) + 1)
  })
  return referrers
    .map((r) => ({ ...r, count: counts.get(r.id) || 0 }))
    .sort((a, b) => b.count - a.count)
}

export function nextDealId(deals) {
  const nums = deals.map((d) => parseInt(String(d.id).replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 400
  return `deal-${max + 1}`
}

export function nextQuoteId(deal) {
  const nums = (deal.quotes || []).map((q) => parseInt(String(q.id).replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `q-${deal.id.replace('deal-', '')}${String.fromCharCode(97 + (max % 26))}`
}

export function nextDealerId(dealers) {
  return `dlr-${Date.now().toString(36).slice(-5)}`
}
