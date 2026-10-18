/** Primal Krisp online deposit payouts — totals derived from order rows. */

export const round2 = (n) => Math.round(n * 100) / 100

const FEE_RATES = {
  Shopify: { pct: 0.029, fixed: 0.3 },
  PayPal: { pct: 0.0349, fixed: 0.49 },
  'Amazon Pay': { pct: 0.029, fixed: 0.3 },
}

export function feeForOrder(source, amount) {
  const r = FEE_RATES[source]
  if (!r) return 0
  return round2(amount * r.pct + r.fixed)
}

/** Payout JSON stores adjustment rows on `adjustments`; never confuse with dollar total. */
export function payoutAdjustmentRows(payout) {
  const raw = payout?.adjustments
  return Array.isArray(raw) ? raw : []
}

export function payoutTotals(payout) {
  const gross_sales = round2((payout.orders || []).reduce((s, o) => s + o.amount, 0))
  const delivery_guarantee = round2((payout.orders || []).reduce((s, o) => s + (o.delivery_guarantee || 0), 0))
  const fees = round2((payout.orders || []).reduce((s, o) => s + feeForOrder(payout.source, o.amount), 0))
  const refunds = round2(payout.refunds || 0)
  const adjustmentsTotal = round2(payoutAdjustmentRows(payout).reduce((s, a) => s + a.amount, 0))
  const deposit = round2(gross_sales + delivery_guarantee - fees - refunds - adjustmentsTotal)
  const order_count = (payout.orders || []).length
  const expectedWithoutAdjustments = round2(gross_sales + delivery_guarantee - fees - refunds)
  const mismatch_amount = payout.matched ? 0 : round2(adjustmentsTotal)
  return {
    gross_sales,
    delivery_guarantee,
    fees,
    refunds,
    adjustmentsTotal,
    deposit,
    order_count,
    mismatch_amount,
    expectedWithoutAdjustments,
  }
}

export function notMatchedItems(payouts) {
  const items = []
  for (const p of payouts) {
    if (p.matched) continue
    for (const a of payoutAdjustmentRows(p)) {
      items.push({ payout: p, adjustment: a })
    }
  }
  return items
}

export function buildDepositsSummary(payouts) {
  let deposited = 0
  let fees = 0
  let totalOrders = 0
  let chargebackOrderHits = 0
  let notMatchedDollars = 0
  for (const p of payouts) {
    const t = payoutTotals(p)
    deposited = round2(deposited + t.deposit)
    fees = round2(fees + t.fees)
    totalOrders += t.order_count
    if (!p.matched) notMatchedDollars = round2(notMatchedDollars + t.mismatch_amount)
    for (const a of payoutAdjustmentRows(p)) {
      if (a.type === 'chargeback') chargebackOrderHits += 1
    }
  }
  const nmItems = notMatchedItems(payouts)
  const notMatchedCount = nmItems.filter((x) => x.adjustment.type === 'earlier_refund' || x.adjustment.type === 'chargeback').length
  const orders_matched = totalOrders - chargebackOrderHits
  return {
    deposited_this_month: deposited,
    fees,
    orders_matched,
    not_matched: { order_count: notMatchedCount, dollars: notMatchedDollars },
  }
}

export function enrichPayouts(deposits) {
  const payouts = (deposits?.payouts || []).map((p) => {
    const t = payoutTotals(p)
    const adjustmentRows = payoutAdjustmentRows(p)
    return {
      ...p,
      adjustments: adjustmentRows,
      ...t,
    }
  })
  const summary = buildDepositsSummary(payouts)
  return { payouts, summary }
}
