import DATA from './closeoutExplosionData.js'
import {
  isOpenInvoice,
  lotStatusLabel,
  saleLineKey,
} from './closeoutExplosionSales.js'

const AS_OF = DATA.asOf
const { pnl } = DATA

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

export function lotBuyerPayStatus(lot) {
  const open = lot.sales.filter((s) => isOpenInvoice(s))
  if (!open.length) return { label: 'Paid', unpaidCount: 0, unpaidAmount: 0 }
  const unpaidAmount = open.reduce((s, x) => s + x.amount, 0)
  return {
    label: `${open.length} unpaid (${unpaidAmount})`,
    unpaidCount: open.length,
    unpaidAmount,
  }
}

export function supplierPayLabel(lot) {
  return lot.supplierPaid ? 'Paid' : 'Unpaid'
}

export function inSaleRange(date, from, to) {
  return date >= from && date <= to
}

export function enrichSale(sale, lot) {
  const ageDays = daysBetween(sale.date, AS_OF)
  const pastDue = sale.due != null && AS_OF > sale.due && sale.paid == null
  return {
    ...sale,
    lotId: lot.id,
    lotDesc: lot.desc,
    open: sale.paid == null,
    ageDays,
    pastDue,
  }
}

export function daysBetween(fromIso, toIso) {
  const a = new Date(`${fromIso}T12:00:00.000Z`).getTime()
  const b = new Date(`${toIso}T12:00:00.000Z`).getTime()
  return Math.round((b - a) / 86400000)
}

export function lotStats(lot) {
  const cost = lotCostBasis(lot)
  const { totalCost, purchaseCost, freightIn, brokerCommission } = cost
  const landed = totalCost
  const landedPerCase = lot.cases > 0 ? landed / lot.cases : 0
  const casesSold = lot.sales.reduce((s, x) => s + x.cases, 0)
  const casesLeft = lot.cases - casesSold
  const revenue = lot.sales.reduce((s, x) => s + x.amount, 0)
  const costSold = lot.sales.reduce((s, x) => s + x.cost, 0)
  const costInStock = totalCost - costSold
  const fullySold = casesLeft === 0
  const profit = revenue - costSold
  const margin = revenue > 0 ? profit / revenue : null
  const statusLabel = lotStatusLabel(lot, casesLeft)
  const cashTied = lot.status === 'Open' ? costInStock : 0
  const daysSinceBought = daysBetween(lot.bought, AS_OF)
  const buyerPay = lotBuyerPayStatus(lot)
  return {
    lot,
    ...cost,
    landed,
    landedPerCase,
    casesSold,
    casesLeft,
    revenue,
    costSold,
    costInStock,
    profit,
    margin,
    statusLabel,
    cashTied,
    daysSinceBought,
    supplierStatus: supplierPayLabel(lot),
    buyersStatus:
      buyerPay.unpaidCount === 0
        ? 'Paid'
        : `${buyerPay.unpaidCount} unpaid (${buyerPay.unpaidAmount})`,
    buyerUnpaidAmount: buyerPay.unpaidAmount,
    buyerUnpaidCount: buyerPay.unpaidCount,
  }
}

export function allLotsEnriched() {
  return DATA.lots.map(lotStats)
}

export function salesInPeriod(from, to) {
  const rows = []
  for (const lot of DATA.lots) {
    for (const sale of lot.sales) {
      if (inSaleRange(sale.date, from, to)) {
        rows.push(enrichSale(sale, lot))
      }
    }
  }
  rows.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || saleLineKey(a).localeCompare(saleLineKey(b)),
  )
  return rows
}

function periodPnl(from, to, expenseKey) {
  const salesRows = salesInPeriod(from, to)
  const sales = salesRows.reduce((s, r) => s + r.amount, 0)
  const cogs = salesRows.reduce((s, r) => s + r.cost, 0)
  const grossProfit = sales - cogs
  const grossMargin = sales > 0 ? grossProfit / sales : 0
  const isThis = from === pnl.thisFrom && to === pnl.thisTo
  const expenseLines = pnl.expenses.map((e) => ({
    name: e.name,
    amount: isThis ? e.this : e.prior,
  }))
  const operatingExpenses = expenseLines.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - operatingExpenses
  return {
    from,
    to,
    sales,
    cogs,
    grossProfit,
    grossMargin,
    expenseLines,
    operatingExpenses,
    netProfit,
    salesRows,
  }
}

export function buildDashboard() {
  const lots = allLotsEnriched()
  const openLots = lots.filter((l) => l.lot.status === 'Open')
  const closedLots = lots.filter((l) => l.lot.status === 'Closed')
  const cashTiedTotal = openLots.reduce((s, l) => s + l.cashTied, 0)
  const casesInWarehouse = openLots.reduce((s, l) => s + l.casesLeft, 0)

  const openSales = []
  for (const lot of DATA.lots) {
    for (const sale of lot.sales) {
      if (isOpenInvoice(sale)) openSales.push(enrichSale(sale, lot))
    }
  }
  const buyersOwe = openSales.reduce((s, r) => s + r.amount, 0)

  const thisP = periodPnl(pnl.thisFrom, pnl.thisTo)
  const priorP = periodPnl(pnl.priorFrom, pnl.priorTo)
  const salesPctChange = priorP.sales > 0 ? ((thisP.sales - priorP.sales) / priorP.sales) * 100 : 0

  const buyerTerms = Object.fromEntries(DATA.buyers.map((b) => [b.name, b.termsDays]))

  const buyerRows = DATA.buyers.map((b) => {
    const invs = openSales.filter((s) => s.buyer === b.name)
    const b0 = invs.filter((s) => s.ageDays <= 15).reduce((sum, s) => sum + s.amount, 0)
    const b1 = invs.filter((s) => s.ageDays >= 16 && s.ageDays <= 30).reduce((sum, s) => sum + s.amount, 0)
    const b2 = invs.filter((s) => s.ageDays > 30).reduce((sum, s) => sum + s.amount, 0)
    const total = b0 + b1 + b2
    return {
      name: b.name,
      type: b.type,
      termsDays: b.termsDays,
      count: invs.length,
      bucket015: b0,
      bucket1630: b1,
      bucketOver30: b2,
      total,
    }
  }).filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  const bucketTotals = buyerRows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      bucket015: acc.bucket015 + r.bucket015,
      bucket1630: acc.bucket1630 + r.bucket1630,
      bucketOver30: acc.bucketOver30 + r.bucketOver30,
      total: acc.total + r.total,
    }),
    { count: 0, bucket015: 0, bucket1630: 0, bucketOver30: 0, total: 0 },
  )

  const fallPaidStart = '2026-09-01'
  const paidFallByBuyer = (buyerName) => {
    const rows = []
    for (const lot of DATA.lots) {
      for (const sale of lot.sales) {
        if (sale.buyer !== buyerName || !sale.paid) continue
        if (sale.paid >= fallPaidStart) {
          rows.push(enrichSale(sale, lot))
        }
      }
    }
    rows.sort((a, b) => b.date.localeCompare(a.date))
    return rows
  }

  return {
    asOf: AS_OF,
    lots,
    openLots,
    closedLots,
    cashTiedTotal,
    casesInWarehouse,
    openSales,
    buyersOwe,
    openInvoiceCount: openSales.length,
    thisP,
    priorP,
    salesPctChange,
    buyerRows,
    bucketTotals,
    buyerTerms,
    paidFallByBuyer,
    pnlLabels: { this: pnl.thisLabel, prior: pnl.priorLabel },
  }
}

export function getLotById(id) {
  const lot = DATA.lots.find((l) => l.id === id)
  if (!lot) return null
  return lotStats(lot)
}

export function sanityCheck() {
  const d = buildDashboard()
  return {
    thisSales: d.thisP.sales,
    thisCogs: d.thisP.cogs,
    thisGross: d.thisP.grossProfit,
    thisOpex: d.thisP.operatingExpenses,
    thisNet: d.thisP.netProfit,
    priorSales: d.priorP.sales,
    priorCogs: d.priorP.cogs,
    priorNet: d.priorP.netProfit,
    cashTied: d.cashTiedTotal,
    openLotCount: d.openLots.length,
    buyersOwe: d.buyersOwe,
    openInvoices: d.openInvoiceCount,
    closedLots: d.closedLots.length,
    l2050Profit: getLotById('L-2050')?.profit,
  }
}
