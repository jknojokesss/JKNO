// ── Jerky Munch outbound mail (invoices from orders@jerkymunch.com) ──────
// SERVER-SIDE ONLY. Sends the QuickBooks-generated PDF from Jerky's own
// address instead of Intuit's mailer, so the store sees it from the business.
//
// Env (Vercel, JKNO project) — defaults suit Zoho, where jerkymunch.com email
// lives; override host/port for another provider:
//   JERKY_SMTP_HOST     default smtp.zoho.com
//   JERKY_SMTP_PORT     default 465
//   JERKY_SMTP_USER     e.g. orders@jerkymunch.com   (required)
//   JERKY_SMTP_PASS     an app-specific password       (required)
//   JERKY_SMTP_FROM     default "Jerky Munch <orders@jerkymunch.com>"
//   JERKY_SMTP_REPLYTO  default = JERKY_SMTP_USER
import nodemailer from 'nodemailer'

export function jerkyMailerConfigured() {
  return !!(process.env.JERKY_SMTP_USER && process.env.JERKY_SMTP_PASS)
}

const money = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export async function sendInvoiceEmail({ to, storeName, docNumber, total, dueDate, pdf }) {
  const user = process.env.JERKY_SMTP_USER
  const pass = process.env.JERKY_SMTP_PASS
  if (!user || !pass) throw new Error('Email isn\'t set up yet — add the SMTP credentials in the site settings.')
  if (!to) throw new Error('No email address on file for this store.')

  const host = process.env.JERKY_SMTP_HOST || 'smtp.zoho.com'
  const port = parseInt(process.env.JERKY_SMTP_PORT || '465', 10)
  const from = process.env.JERKY_SMTP_FROM || `Jerky Munch <${user}>`
  const replyTo = process.env.JERKY_SMTP_REPLYTO || user

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })

  const num = docNumber ? `#${docNumber}` : ''
  const subject = `Invoice ${num} from Jerky Munch`.replace(/\s+/g, ' ').trim()
  const due = dueDate ? `<p style="margin:0 0 6px">Due: <b>${dueDate}</b></p>` : ''
  const html = `
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
