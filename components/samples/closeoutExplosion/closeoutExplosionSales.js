/** Sale line helpers — invoiced vs shipped-only rows share one array per lot. */

export function saleLineKey(sale) {
  return sale.invoice || sale.shipId
}

export function isInvoiced(sale) {
  return Boolean(sale.invoice)
}

export function isShippedOnly(sale) {
  return !sale.invoice
}

export function isOpenInvoice(sale) {
  return Boolean(sale.invoice) && sale.paid == null
}

export function maxInvoiceNumber(lots) {
  let max = 0
  for (const lot of lots) {
    for (const sale of lot.sales) {
      if (!sale.invoice) continue
      const n = parseInt(sale.invoice.replace(/^INV-/, ''), 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return max
}

export function nextInvoiceNumber(lots) {
  return `INV-${maxInvoiceNumber(lots) + 1}`
}

export function saleStatusLabel(sale) {
  if (isShippedOnly(sale)) return 'Shipped, not invoiced'
  if (sale.paid) return `Paid ${sale.paid}`
  return 'Unpaid'
}

export function lotStatusLabel(lot, casesLeft) {
  if (lot.status === 'Closed' && casesLeft === 0) return 'Sold out'
  if (lot.status === 'Open') return `Open, ${casesLeft} cases left`
  return lot.status
}
