import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib'

// ── Stamp a clickable pay link onto the invoice PDF's own last page ──────
// SERVER-SIDE ONLY. The PDF attached to an AR email is QuickBooks' own
// generated file (see lib/qboAr.js fetchInvoicePdf) — Intuit has no idea our
// Stripe link exists, so it can't be in their template. This draws a
// compact footer strip directly onto the invoice, so the link travels with
// the invoice itself rather than living only in the email body (which
// strips on forward, print, or an HTML-blocking client).
//
// pdf-lib can only draw new content on a page — it has no way to read where
// QuickBooks' own renderer actually put its text, so there's no reliable
// way to detect "right after the last line item." estimateTopOffset() below
// is a guess, calibrated against one real invoice (one line item, standard
// JK No Jokes QBO template) — it uses the invoice's own line-item count
// (from the same QBO API call, not the rendered PDF) to push the guess down
// as the invoice gets longer. It will drift on a wrapped multi-line
// description, a discount or tax line, or a different template. Clamped to
// never go below the bottom margin, so a badly-off estimate falls back to
// the always-safe footer position instead of overlapping content.
//
// The URL only lives in the button's Link annotation, not as visible text —
// spelling it out too would just be clutter once the button is clickable.
//
// pdf-lib has no high-level "add a hyperlink" API — this builds the Link
// annotation dict by hand. The one trap: PDFContext#obj() turns a plain JS
// string into a PDFName (fine for dict keys, wrong for the URI itself), so
// the URI value has to be wrapped in PDFString.of() explicitly.

const INK = rgb(0.106, 0.125, 0.153)
const MUTED = rgb(0.42, 0.45, 0.49)
const RULE = rgb(0.87, 0.87, 0.85)

const M = 40                // left/right inset — tighter than the invoice's own margin, reads as a footer
const HEADER_ROWS_PT = 345  // top-of-page to the first line item row, calibrated from a real 1-item invoice
const ROW_HEIGHT_PT = 18    // vertical space per additional line item
const GAP_TO_TOTAL_PT = 30  // last line item to the Total row
const GAP_BELOW_TOTAL_PT = 26 // Total row to where the footer starts

function estimateTopOffset(lineCount) {
  const n = Math.max(1, lineCount || 1)
  return HEADER_ROWS_PT + n * ROW_HEIGHT_PT + GAP_TO_TOTAL_PT + GAP_BELOW_TOTAL_PT
}

function addLinkAnnotation(page, { x, y, width, height, url }) {
  const doc = page.doc
  const annot = doc.context.register(doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  }))
  const existing = page.node.Annots()
  if (existing) existing.push(annot)
  else page.node.set(PDFName.of('Annots'), doc.context.obj([annot]))
}

export async function stampPayLink(pdfBytes, { url, zelle, lineCount }) {
  if (!url && !zelle) return pdfBytes

  const pdf = await PDFDocument.load(pdfBytes)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const pages = pdf.getPages()
  const page = pages[pages.length - 1]
  const { width: W, height: H } = page.getSize()
  const rowH = 20

  const estimatedY = H - estimateTopOffset(lineCount) - rowH
  const y = Math.max(M, estimatedY) // never below the safe bottom-margin fallback

  let x = M
  if (url) {
    const btnW = 90
    page.drawRectangle({ x, y, width: btnW, height: rowH, color: INK })
    const label = 'Pay Now'
    const labelW = bold.widthOfTextAtSize(label, 10)
    page.drawText(label, { x: x + (btnW - labelW) / 2, y: y + 6, size: 10, font: bold, color: rgb(1, 1, 1) })
    addLinkAnnotation(page, { x, y, width: btnW, height: rowH, url })
    x += btnW + 16
  }
  if (zelle) {
    page.drawText(`Prefer Zelle? Send to ${zelle}`, { x, y: y + 6, size: 9, font: reg, color: MUTED })
  }
  page.drawLine({ start: { x: M, y: y + rowH + 10 }, end: { x: W - M, y: y + rowH + 10 }, thickness: 0.6, color: RULE })

  return Buffer.from(await pdf.save())
}
