// ── Shared SMTP send for /admin/ar invoice + reminder emails ─────────────
// SERVER-SIDE ONLY. Pulled out of pages/api/qbo/ar.js so the initial send
// and reminder share one path (PDF fetch, pay-link stamp, template).

import nodemailer from 'nodemailer'
import { buildInvoiceEmail } from './invoiceEmail'
import { fetchInvoice, fetchInvoicePdf } from './qboAr'
import { stampPayLink } from './pdfPayLink'

const countLines = (inv) => (inv && inv.Line ? inv.Line.filter((l) => l.DetailType === 'SalesItemLineDetail').length : 0)

export function smtpConfig() {
  const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER
  const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
  if (!SMTP_USER || !SMTP_PASS) {
    return { ok: false, error: 'Email is not set up — set SMTP_USER / SMTP_PASS (and SMTP_HOST, e.g. smtp.zoho.com) in the environment.' }
  }
  return {
    ok: true,
    SMTP_USER,
    SMTP_PASS,
    SMTP_HOST,
    SMTP_PORT,
    from: process.env.SMTP_FROM || `JK No Jokes <${SMTP_USER}>`,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseRecipientList(raw) {
  if (!raw || !String(raw).trim()) return []
  return String(raw).split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
}

export function validateEmails(list) {
  const bad = list.filter((e) => !EMAIL_RE.test(e))
  if (bad.length) return { ok: false, error: `Invalid email: ${bad.join(', ')}` }
  return { ok: true }
}

function payOptions(client, doc) {
  const owner = process.env.STRIPE_PAY_CLIENT || 'jkno'
  const canPay = client === owner
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PAYMENT_LINK || process.env.STRIPE_LINKS)
  const payUrl = (canPay && stripeConfigured)
    ? `${process.env.PORTAL_BASE_URL || 'https://jknojokes.com'}/pay?inv=${encodeURIComponent(doc)}`
    : null
  const zelle = canPay ? (process.env.PAY_ZELLE || null) : null
  return { payUrl, zelle }
}

/**
 * @param {object} opts
 * @param {boolean} [opts.reminder]
 * @param {string} [opts.intro]
 * @param {string} [opts.subject] — required for reminders; default for initial send
 */
export async function deliverInvoiceEmail(env, token, realmId, connection, client, invoiceId, {
  to, cc = [], subject, intro, reminder = false,
}) {
  const cfg = smtpConfig()
  if (!cfg.ok) return cfg

  const inv = await fetchInvoice(env, token, realmId, invoiceId)
  const doc = (inv && inv.DocNumber) || invoiceId
  const balance = inv && inv.Balance != null ? Number(inv.Balance) : null
  const dueDate = (inv && inv.DueDate) || null
  const customer = (inv && inv.CustomerRef && inv.CustomerRef.name) || 'customer'
  const pdf = await fetchInvoicePdf(env, token, realmId, invoiceId)
  const { payUrl, zelle } = payOptions(client, doc)

  const companyName = connection.company_name || 'JK No Jokes'
  const defaultSubject = `Invoice ${doc} from JK No Jokes`
  const mailSubject = subject || defaultSubject

  const mail = buildInvoiceEmail({
    companyName,
    doc,
    balance,
    dueDate,
    payUrl,
    zelle,
    replyTo: cfg.SMTP_USER,
    intro,
    reminder,
  })

  let attachedPdf = await stampPayLink(pdf, { url: payUrl, zelle, lineCount: countLines(inv) })
  if (reminder) attachedPdf = await stampReminderOnPdf(attachedPdf)

  if (process.env.AR_EMAIL_DRY_RUN === '1') {
    return {
      ok: true,
      dryRun: true,
      sent: { to, cc, subject: mailSubject, doc, customer, messageId: 'dry-run' },
    }
  }

  const transporter = nodemailer.createTransport({
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT,
    secure: cfg.SMTP_PORT === 465,
    auth: { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS },
  })

  const info = await transporter.sendMail({
    from: cfg.from,
    replyTo: cfg.SMTP_USER,
    to,
    cc: cc.length ? cc.join(', ') : undefined,
    subject: mailSubject,
    text: mail.text,
    html: mail.html,
    attachments: [{ filename: `Invoice-${doc}.pdf`, content: attachedPdf, contentType: 'application/pdf' }],
  })

  return {
    ok: true,
    sent: { to, cc, subject: mailSubject, doc, customer, messageId: info.messageId },
  }
}

async function stampReminderOnPdf(pdfBytes) {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const pdf = await PDFDocument.load(pdfBytes)
    const page = pdf.getPages()[0]
    const { width, height } = page.getSize()
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const bandH = 22
    page.drawRectangle({ x: 0, y: height - bandH, width, height: bandH, color: rgb(0.55, 0.12, 0.1) })
    const label = 'REMINDER'
    const w = bold.widthOfTextAtSize(label, 11)
    page.drawText(label, { x: (width - w) / 2, y: height - bandH + 6, size: 11, font: bold, color: rgb(1, 1, 1) })
    return Buffer.from(await pdf.save())
  } catch {
    return pdfBytes
  }
}

export { formatLongDate as formatNiceDate, defaultReminderSubject, defaultReminderBody as defaultReminderIntro } from './qboArReminderText'
