import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib'

// ── Stamp a clickable pay link onto the invoice PDF's own last page ──────
// SERVER-SIDE ONLY. The PDF attached to an AR email is QuickBooks' own
// generated file (see lib/qboAr.js fetchInvoicePdf) — Intuit has no idea our
// Stripe link exists, so it can't be in their template. This draws a
// compact footer strip directly onto the invoice, in the bottom margin QBO's
// own layout leaves clear, so the link travels with the invoice itself
// rather than living only in the email body (which strips on forward,
// print, or an HTML-blocking client).
//
// This used to append a whole extra page instead, specifically to avoid any
// risk of drawing over QBO's own content — there's no way to inspect an
// existing page's content stream to know for certain the bottom margin is
// empty. Overlaying is what was asked for; a long, line-item-heavy invoice
// could in theory print into this band. Keep the strip as short as
// legible/clickable allows to keep that risk small.
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

export async function stampPayLink(pdfBytes, { url, zelle }) {
  if (!url && !zelle) return pdfBytes

  const pdf = await PDFDocument.load(pdfBytes)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const pages = pdf.getPages()
  const page = pages[pages.length - 1]
  const { width: W } = page.getSize()
  const M = 40 // tighter than the invoice's own margin, reads as a footer
  const y = M
  const rowH = 20

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
