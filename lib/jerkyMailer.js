// ── Jerky Munch outbound mail (invoices from orders@jerkymunch.com) ──────
// SERVER-SIDE ONLY. Sends the QuickBooks-generated PDF from Jerky's own
// address instead of Intuit's mailer, so the store sees it from the business.
//
// Env (Vercel, JKNO project) — defaults suit Google Workspace, where
// jerkymunch.com email lives. accounting@jerkymunch.com needs 2-Step
// Verification on and an APP PASSWORD (Google blocks a plain password over SMTP):
//   JERKY_SMTP_HOST     default smtp.gmail.com
//   JERKY_SMTP_PORT     default 465
//   JERKY_SMTP_USER     accounting@jerkymunch.com      (required)
//   JERKY_SMTP_PASS     the 16-char Google app password (required)
//   JERKY_SMTP_FROM     default "Jerky Munch <accounting@jerkymunch.com>"
//   JERKY_SMTP_REPLYTO  default = JERKY_SMTP_USER
import nodemailer from 'nodemailer'

export function jerkyMailerConfigured() {
  return !!(process.env.JERKY_SMTP_USER && process.env.JERKY_SMTP_PASS)
}

const money = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sendInvoiceEmail({ to, storeName, docNumber, total, dueDate, pdf, subject: subjectIn, message: messageIn }) {
  const user = process.env.JERKY_SMTP_USER
  const pass = process.env.JERKY_SMTP_PASS
  if (!user || !pass) throw new Error('Email isn\'t set up yet — add the SMTP credentials in the site settings.')
  if (!to) throw new Error('No email address on file for this store.')

  const host = process.env.JERKY_SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.JERKY_SMTP_PORT || '465', 10)
  const from = process.env.JERKY_SMTP_FROM || `Jerky Munch <${user}>`
  const replyTo = process.env.JERKY_SMTP_REPLYTO || user

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })

  const num = docNumber ? `#${docNumber}` : ''
  // Prefer the subject/body Efraim already uses in QuickBooks; fall back to a plain default.
  const subject = (subjectIn && subjectIn.trim())
    ? subjectIn.trim()
    : `Invoice ${num} from Jerky Munch`.replace(/\s+/g, ' ').trim()
  const due = dueDate ? `<p style="margin:0 0 6px">Due: <b>${dueDate}</b></p>` : ''
  const html = (messageIn && messageIn.trim())
    ? `<div style="font-family:Arial,Helvetica,sans-serif;color:#2B2018;font-size:15px;line-height:1.5">${esc(messageIn.trim()).replace(/\n/g, '<br/>')}</div>`
    : `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#2B2018;font-size:15px;line-height:1.5">
      <p style="margin:0 0 12px">Hi${storeName ? ` ${storeName}` : ''},</p>
      <p style="margin:0 0 12px">Please find your invoice ${num} attached.</p>
      <p style="margin:0 0 6px">Amount: <b>${money(total)}</b></p>
      ${due}
      <p style="margin:16px 0 0">Thank you,<br/>Jerky Munch</p>
    </div>`

  await transporter.sendMail({
    from, replyTo, to, subject, html,
    attachments: [{ filename: `invoice-${docNumber || 'jerky-munch'}.pdf`, content: pdf, contentType: 'application/pdf' }],
  })
}
