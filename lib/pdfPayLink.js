import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib'

// ── Stamp a clickable "Pay Online" page onto an invoice PDF ─────────────
// SERVER-SIDE ONLY. The PDF attached to an AR email is QuickBooks' own
// generated file (see lib/qboAr.js fetchInvoicePdf) — Intuit has no idea our
// Stripe link exists, so it can't be in their template. This appends one
// extra page with the link drawn as real, clickable text (a PDF Link
// annotation, not just visible text), so the attachment itself can pay the
// invoice even if it's forwarded, printed, or the email body gets stripped.
//
// pdf-lib has no high-level "add a hyperlink" API — this builds the Link
// annotation dict by hand. The one trap: PDFContext#obj() turns a plain JS
// string into a PDFName (fine for dict keys, wrong for the URI itself), so
// the URI value has to be wrapped in PDFString.of() explicitly.

const INK = rgb(0.106, 0.125, 0.153)
const MUTED = rgb(0.42, 0.45, 0.49)
const LINK_BLUE = rgb(0.11, 0.35, 0.85)

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

export async function addPayLinkPage(pdfBytes, { url, amount, doc, due, zelle }) {
  const pdf = await PDFDocument.load(pdfBytes)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const [W, H] = [612, 792] // US Letter, matching QBO's own invoice PDFs
  const page = pdf.addPage([W, H])

  let y = H - 140
  page.drawText(url ? 'Pay this invoice online' : 'How to pay this invoice', { x: 72, y, size: 22, font: bold, color: INK })
  y -= 34
  if (doc) { page.drawText(`Invoice ${doc}`, { x: 72, y, size: 12, font: reg, color: MUTED }); y -= 18 }
  if (amount) { page.drawText(`Amount due: ${amount}`, { x: 72, y, size: 12, font: reg, color: MUTED }); y -= 18 }
  if (due) { page.drawText(`Due ${due}`, { x: 72, y, size: 12, font: reg, color: MUTED }) }
  y -= 40

  if (url) {
    // Button
    const btnW = 220, btnH = 44
    page.drawRectangle({ x: 72, y: y - btnH, width: btnW, height: btnH, color: INK })
    const label = 'Pay Now'
    const labelW = bold.widthOfTextAtSize(label, 14)
    page.drawText(label, { x: 72 + (btnW - labelW) / 2, y: y - btnH / 2 - 5, size: 14, font: bold, color: rgb(1, 1, 1) })
    addLinkAnnotation(page, { x: 72, y: y - btnH, width: btnW, height: btnH, url })
    y -= btnH + 28

    // Visible URL too, also a link — for anyone who prints this or whose
    // reader doesn't render the button as clickable.
    page.drawText(url, { x: 72, y, size: 10.5, font: reg, color: LINK_BLUE })
    const urlW = reg.widthOfTextAtSize(url, 10.5)
    addLinkAnnotation(page, { x: 72, y: y - 2, width: urlW, height: 13, url })
    y -= 20
    page.drawText('Secure checkout by Stripe. No account needed.', { x: 72, y, size: 9, font: reg, color: MUTED })
  }

  if (zelle) {
    y -= url ? 34 : 6
    page.drawText('Prefer Zelle?', { x: 72, y, size: 11, font: bold, color: INK })
    y -= 16
    page.drawText(`Send to ${zelle}`, { x: 72, y, size: 11, font: reg, color: INK })
  }

  return Buffer.from(await pdf.save())
}
