/** Landed cost per case includes purchase, freight, and broker on every lot. */

const round2 = (n) => Math.round(n * 100) / 100

export function lotCostBasis(lot) {
  const brokerCommission = lot.broker ?? 0
  const totalCost = lot.buy + lot.freight + brokerCommission
  return {
    purchaseCost: lot.buy,
    freightIn: lot.freight,
    brokerCommission,
    totalCost,
  }
}

/** Per-line cost of sales; sold-out lots tie exactly to total cost. */
export function saleCostsForLot(lot) {
  const { totalCost } = lotCostBasis(lot)
  if (!lot.cases || !lot.sales.length) return []
  const perCase = totalCost / lot.cases
  const casesSold = lot.sales.reduce((s, x) => s + x.cases, 0)
  const soldOut = casesSold === lot.cases
  let allocated = 0
  return lot.sales.map((sale, i) => {
    const isLast = i === lot.sales.length - 1
    if (soldOut && isLast) {
      return round2(totalCost - allocated)
    }
    const line = round2(perCase * sale.cases)
    allocated += line
    return line
  })
}

export function costOfSalesForLot(lot) {
  return saleCostsForLot(lot).reduce((s, c) => s + c, 0)
}

export function saleLandedCost(lot, sale) {
  const idx = lot.sales.indexOf(sale)
  if (idx < 0) return sale.cost ?? 0
  return saleCostsForLot(lot)[idx]
}
