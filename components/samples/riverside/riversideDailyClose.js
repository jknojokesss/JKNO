/**
 * Daily close model for Riverside sample — register totals must tie to open-period
 * orders; journal previews are computed here so the check script and UI share one path.
 */

const TAX_RATE = 0.07
const PROCESSOR_RATE = 0.025
const DRAWER_FLOAT = 150

const round2 = (n) => Math.round(n * 100) / 100

export function classifySaleLine(order) {
  if (order.size === 'Service' || /service|oil|rotation|balance|plug|alignment|repair/i.test(order.item)) return 'service'
  if (order.size === 'Parts' || /tpms|sensor|parts/i.test(order.item)) return 'other'
  return 'tires'
}

function solveTaxableForRegister(registerSales) {
  let taxable = round2(registerSales / (1 + TAX_RATE))
  for (let i = 0; i < 25; i++) {
    const tax = round2(taxable * TAX_RATE)
    const gap = round2(registerSales - taxable - tax)
    if (Math.abs(gap) < 0.005) return { taxable, tax }
    taxable = round2(taxable + gap)
  }
  const tax = round2(taxable * TAX_RATE)
  return { taxable: round2(registerSales - tax), tax }
}

function splitRegisterSales(orders) {
  const registerSales = round2(orders.reduce((s, o) => s + o.sale, 0))
  const parts = { tires: 0, service: 0, other: 0 }
  orders.forEach((o) => {
    const bucket = classifySaleLine(o)
    const pretaxLine = round2(o.sale / (1 + TAX_RATE))
    if (bucket === 'service') parts.service += pretaxLine
    else if (bucket === 'other') parts.other += pretaxLine
    else parts.tires += pretaxLine
  })
  parts.tires = round2(parts.tires)
  parts.service = round2(parts.service)
  parts.other = round2(parts.other)
  const rawTaxable = round2(parts.tires + parts.service + parts.other)
  const { taxable: targetTaxable, tax } = solveTaxableForRegister(registerSales)
  if (rawTaxable < 0.01) {
    return { registerSales, tires: 0, service: 0, other: 0, tax }
  }
  let tires = round2((parts.tires / rawTaxable) * targetTaxable)
  let service = round2((parts.service / rawTaxable) * targetTaxable)
  let other = round2(targetTaxable - tires - service)
  const taxable = round2(tires + service + other)
  const fix = round2(targetTaxable - taxable)
  if (Math.abs(fix) >= 0.005) tires = round2(tires + fix)
  const taxExact = round2((round2(tires + service + other)) * TAX_RATE)
  return { registerSales, tires, service, other, tax: taxExact }
}

function statusForOverShort(overShort) {
  if (Math.abs(overShort) < 0.005) return 'Balanced'
  if (overShort < 0) return 'Short'
  return 'Over'
}

/**
 * @param {object} data full riverside-tires.json
 * @param {object[]} orders orders with profit fields optional
 */
export function buildDailyCloseModel(data, orders) {
  const asOf = data.meta.as_of
  const monthKey = asOf.slice(0, 7)
  const monthOrders = orders.filter((o) => o.date.slice(0, 7) === monthKey && o.date <= asOf)
  const byDate = new Map()
  monthOrders.forEach((o) => {
    const list = byDate.get(o.date) || []
    list.push(o)
    byDate.set(o.date, list)
  })
  const dates = [...byDate.keys()].sort()
  const adjustments = data.daily_close?.adjustments || {}
  let startingCash = data.daily_close?.starting_drawer ?? DRAWER_FLOAT

  const days = dates.map((date) => {
    const dayOrders = byDate.get(date)
    const split = splitRegisterSales(dayOrders)
    let cashSales = 0
    let cardSales = 0
    dayOrders.forEach((o) => {
      const pay = o.payment || 'card'
      if (pay === 'cash') cashSales += o.sale
      else cardSales += o.sale
    })
    cashSales = round2(cashSales)
    cardSales = round2(cardSales)
    const processingFee = round2(cardSales * PROCESSOR_RATE)
    const netDeposit = round2(cardSales - processingFee)
    const expectedCashInDrawer = round2(startingCash + cashSales)
    const adj = adjustments[date] || {}
    const cashCountedPhysical = adj.cash_counted != null ? round2(adj.cash_counted) : expectedCashInDrawer
    const cashToDeposit = round2(cashCountedPhysical - startingCash)
    const overShort = round2(cashToDeposit + cardSales - split.registerSales)
    const day = {
      date,
      ticketCount: dayOrders.length,
      registerSales: split.registerSales,
      salesSplit: { tires: split.tires, service: split.service, other: split.other, tax: split.tax },
      payments: { cash: cashSales, card: cardSales },
      cashDrawer: {
        startingCash: round2(startingCash),
        cashSales,
        cashCounted: cashCountedPhysical,
        cashToDeposit,
      },
      cardBatch: {
        batchTotal: cardSales,
        processingFee,
        netDeposit,
      },
      overShort,
      status: statusForOverShort(overShort),
    }
    startingCash = DRAWER_FLOAT
    return day
  })

  const totalRegister = round2(days.reduce((s, d) => s + d.registerSales, 0))
  const totalTickets = days.reduce((s, d) => s + d.ticketCount, 0)

  return {
    monthKey,
    asOf,
    days,
    totalRegister,
    totalTickets,
  }
}

export function buildDailyCloseJournal(day) {
  const lines = []
  const { registerSales, salesSplit, cardBatch, overShort, cashDrawer } = day
  const cashToBank = Math.max(0, cashDrawer.cashToDeposit)
  if (cashToBank > 0) lines.push({ account: 'Cash', debit: cashToBank, credit: 0 })
  if (cardBatch.netDeposit > 0) lines.push({ account: 'Card clearing', debit: cardBatch.netDeposit, credit: 0 })
  if (cardBatch.processingFee > 0) lines.push({ account: 'Merchant card fees', debit: cardBatch.processingFee, credit: 0 })
  if (salesSplit.tires > 0) lines.push({ account: 'Sales — tires', debit: 0, credit: salesSplit.tires })
  if (salesSplit.service > 0) lines.push({ account: 'Sales — service', debit: 0, credit: salesSplit.service })
  if (salesSplit.other > 0) lines.push({ account: 'Sales — other', debit: 0, credit: salesSplit.other })
  if (salesSplit.tax > 0) lines.push({ account: 'Sales tax payable', debit: 0, credit: salesSplit.tax })
  if (overShort > 0.005) lines.push({ account: 'Cash over / short', debit: 0, credit: round2(overShort) })
  else if (overShort < -0.005) lines.push({ account: 'Cash over / short', debit: round2(-overShort), credit: 0 })
  const debitTotal = round2(lines.reduce((s, l) => s + l.debit, 0))
  const creditTotal = round2(lines.reduce((s, l) => s + l.credit, 0))
  const salesCredits = round2(salesSplit.tires + salesSplit.service + salesSplit.other + salesSplit.tax)
  return {
    date: day.date,
    lines,
    debitTotal,
    creditTotal,
    salesCredits,
    registerSales,
  }
}

export function assertDailyCloseTies(data, orders, openPeriodTotals) {
  const model = buildDailyCloseModel(data, orders)
  const errors = []
  if (Math.abs(model.totalRegister - openPeriodTotals.sale) > 0.02) {
    errors.push(`daily register ${model.totalRegister} vs open sales ${openPeriodTotals.sale}`)
  }
  if (model.totalTickets !== openPeriodTotals.tickets) {
    errors.push(`daily tickets ${model.totalTickets} vs open tickets ${openPeriodTotals.tickets}`)
  }
  model.days.forEach((day) => {
    const je = buildDailyCloseJournal(day)
    if (Math.abs(je.debitTotal - je.creditTotal) > 0.02) {
      errors.push(`JE unbalanced ${day.date}`)
    }
    if (Math.abs(je.salesCredits - je.registerSales) > 0.05) {
      errors.push(`JE sales lines ${day.date}`)
    }
    const os = round2(day.cashDrawer.cashToDeposit + day.cardBatch.batchTotal - day.registerSales)
    if (Math.abs(os - day.overShort) > 0.02) errors.push(`over/short ${day.date}`)
    const pay = round2(day.payments.cash + day.payments.card)
    if (Math.abs(pay - day.registerSales) > 0.02) errors.push(`payments ${day.date}`)
    const split = round2(day.salesSplit.tires + day.salesSplit.service + day.salesSplit.other + day.salesSplit.tax)
    if (Math.abs(split - day.registerSales) > 0.05) errors.push(`sales split ${day.date}`)
  })
  return { model, errors }
}
