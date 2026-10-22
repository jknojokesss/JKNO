/** Broker fee is due only after delivery. */
export function feeRowStatus(deal) {
  if (deal.fee.paid) return 'paid'
  if (deal.stage === 'delivered') return 'owed'
  return 'not_due'
}

export function feeStatusLabel(deal) {
  if (deal.fee.paid) return 'Paid'
  if (deal.stage === 'delivered') return 'Owed'
  return 'Not due'
}

export function canMarkFeePaid(deal) {
  return deal.stage === 'delivered' && !deal.fee.paid
}
