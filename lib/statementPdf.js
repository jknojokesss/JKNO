import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// ── The statement, as a real PDF ─────────────────────────────────────────
// SERVER-SIDE ONLY. QuickBooks has no statement API and therefore no
// statement PDF, so we draw one. It exists so a statement can be ATTACHED
// to an email like an invoice is: a customer-facing message should carry
// the sender's document, never a link to a third party's domain.
//
// Drawn directly rather than rendered from HTML — no headless browser to
// keep alive in a serverless function, and the base-14 fonts mean nothing
// to embed.

const A4 = [595.28, 841.89]
const M = 46                      // page margin
const INK = rgb(0.106, 0.125, 0.153)
const GREY = rgb(0.486, 0.514, 0.549)
const RULE = rgb(0.878, 0.867, 0.847)
const BAND = rgb(0.937, 0.925, 0.890)

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nice = (iso) => iso
  ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : '—'

export async function buildStatementPdf({ companyName, companyLines = [], customerName, customerEmail, invoices, payments, asOf }) {
  const doc = await PDFDocument.create()
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const asOfMs = Date.parse(asOf + 'T00:00:00Z')
  const total = invoices.reduce((t, i) => t + Number(i.balance || 0), 0)

  let page, y
  const newPage = (continued) => {
    page = doc.addPage(A4)
    y = A4[1] - M
    const text = (s, x, yy, size, font, color) =>
      page.drawText(String(s), { x, y: yy, size, font: font || reg, color: color || INK })

    text(companyName, M, y, 17, bold)
    text('STATEMENT' + (continued ? ' (continued)' : ''), A4[0] - M - reg.widthOfTextAtSize('STATEMENT' + (continued ? ' (continued)' : ''), 13), y + 2, 13, reg, GREY)
    y -= 15
    for (const line of companyLines) { text(line, M, y, 8.5, reg, GREY); y -= 11 }
    const asOfLabel = `as of ${nice(asOf)}`
    text(asOfLabel, A4[0] - M - reg.widthOfTextAtSize(asOfLabel, 9), y + 4, 9, reg, GREY)
    y -= 14

    text('FOR', M, y, 7.5, bold, GREY); y -= 12
    text(customerName, M, y, 12, bold)
    if (customerEmail) text(customerEmail, M, y - 12, 9, reg, GREY)
    const dueLabel = 'AMOUNT DUE'
    text(dueLabel, A4[0] - M - bold.widthOfTextAtSize(dueLabel, 7.5), y + 12, 7.5, bold, GREY)
    const amt = money(total)
    text(amt, A4[0] - M - bold.widthOfTextAtSize(amt, 19), y - 6, 19, bold)
    // Clear the customer's email line before the table label, or the two
    // collide — the amount block above is 19pt and descends past it.
    y -= customerEmail ? 54 : 42
    return page
  }

  // Columns: date, invoice, due, amount, open balance
  const COLS = [M, M + 92, M + 168, A4[0] - M - 168, A4[0] - M]
  const header = () => {
    page.drawLine({ start: { x: M, y: y + 12 }, end: { x: A4[0] - M, y: y + 12 }, thickness: 0.8, color: INK })
    const h = (s, x, right) => page.drawText(s, {
      x: right ? x - bold.widthOfTextAtSize(s, 7.5) : x, y: y - 1, size: 7.5, font: bold, color: GREY,
    })
    h('DATE', COLS[0]); h('INVOICE', COLS[1]); h('DUE', COLS[2])
    h('AMOUNT', COLS[3], true); h('OPEN BALANCE', COLS[4], true)
    y -= 15
  }

  newPage(false)
  page.drawText('OPEN INVOICES', { x: M, y: y + 16, size: 7.5, font: bold, color: GREY })
  header()

  const row = (cells, opts = {}) => {
    if (y < M + 120) { newPage(true); header() }         // keep room for the tail
    const f = opts.bold ? bold : reg
    const size = 9.5
    if (opts.band) {
      page.drawRectangle({ x: M, y: y - 4, width: A4[0] - 2 * M, height: 16, color: BAND })
    }
    cells.forEach(([s, col, right]) => {
      const x = right ? COLS[col] - f.widthOfTextAtSize(String(s), size) : COLS[col]
      page.drawText(String(s), { x, y, size, font: f, color: opts.grey ? GREY : INK })
    })
    y -= 15
    if (!opts.band) page.drawLine({ start: { x: M, y: y + 8 }, end: { x: A4[0] - M, y: y + 8 }, thickness: 0.4, color: RULE })
  }

  for (const i of [...invoices].sort((a, b) => String(a.date).localeCompare(String(b.date)))) {
    const late = i.due ? Math.floor((asOfMs - Date.parse(i.due + 'T00:00:00Z')) / 86400000) : 0
    row([
      [nice(i.date), 0],
      [i.doc ? '#' + i.doc : '—', 1],
      [nice(i.due) + (late > 0 ? `  ${late}d past due` : ''), 2],
      [money(i.total), 3, true],
      [money(i.balance), 4, true],
    ])
  }
  row([['Total due', 0], [money(total), 4, true]], { bold: true, band: true })

  if (payments && payments.length) {
    y -= 12
    if (y < M + 90) newPage(true)
    page.drawText('PAYMENTS RECEIVED — LAST 60 DAYS. THANK YOU.', { x: M, y, size: 7.5, font: bold, color: GREY })
    y -= 16
    for (const p of payments) {
      row([[nice(p.date), 0], ['Payment' + (p.ref ? ' #' + p.ref : ''), 1], [money(p.amount), 4, true]], { grey: true })
    }
  }

  // Aging strip
  y -= 16
  if (y < M + 70) newPage(true)
  const buckets = [0, 0, 0, 0, 0]
  const labels = ['CURRENT', '1-30 DAYS', '31-60 DAYS', '61-90 DAYS', '90+ DAYS']
  for (const i of invoices) {
    const d = i.due ? Math.floor((asOfMs - Date.parse(i.due + 'T00:00:00Z')) / 86400000) : 0
    buckets[d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4] += Number(i.balance || 0)
  }
  const cellW = (A4[0] - 2 * M) / 5
  labels.forEach((label, k) => {
    const x = M + k * cellW
    page.drawRectangle({ x, y: y - 6, width: cellW - 4, height: 34, color: rgb(0.973, 0.969, 0.957) })
    page.drawLine({ start: { x, y: y + 28 }, end: { x: x + cellW - 4, y: y + 28 }, thickness: 1.4, color: k >= 3 && buckets[k] > 0 ? INK : RULE })
    page.drawText(label, { x: x + 5, y: y + 16, size: 6.5, font: bold, color: GREY })
    page.drawText(buckets[k] > 0 ? money(buckets[k]) : '—', { x: x + 5, y: y + 2, size: 9.5, font: bold, color: buckets[k] > 0 ? INK : GREY })
  })
  y -= 26

  page.drawText('Questions about this statement? Just reply to this email.', { x: M, y, size: 8, font: reg, color: GREY })

  return Buffer.from(await doc.save())
}
