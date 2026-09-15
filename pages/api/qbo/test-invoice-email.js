// TEMP: send a copy of the invoice email so JK can eyeball it. With an
// invoiceId it sends the REAL thing — real amount, the QBO PDF attached, and a
// live Stripe Pay-Now link. Without one, a sample. Passcode-gated.
import nodemailer from 'nodemailer'
import { invoiceEmailHtml } from '../../../lib/invoiceEmail'
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchInvoice, fetchInvoicePdf } from '../../../lib/qboAr'
import { createInvoicePayLink } from '../../../lib/stripePay'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.JK_ADMIN_CODE || req.body?.passcode !== process.env.JK_ADMIN_CODE) return res.status(401).json({ error: 'Wrong passcode.' })
  const to = req.body?.to
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return res.status(400).json({ error: 'A valid "to" is required.' })
  const invoiceId = req.body?.invoiceId ? String(req.body.invoiceId).replace(/[^0-9]/g, '') : null

  const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER
  const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
  if (!SMTP_USER || !SMTP_PASS) return res.status(503).json({ error: 'SMTP is not configured on this project.' })
  const zelleEmail = process.env.PAY_ZELLE || 'jk@jknojokes.com'

  try {
    let customer = 'Sample Client', doc = '1001', balance = 400, dueDate = '2026-08-31', attachments = []
    if (invoiceId) {
      const { env, token, realmId } = await getLiveToken('jkno')
      const inv = await fetchInvoice(env, token, realmId, invoiceId)
      doc = (inv && inv.DocNumber) || invoiceId
      balance = inv && inv.Balance != null ? Number(inv.Balance) : (inv && inv.TotalAmt != null ? Number(inv.TotalAmt) : 0)
      dueDate = (inv && inv.DueDate) || null
      customer = (inv && inv.CustomerRef && inv.CustomerRef.name) || 'customer'
      const pdf = await fetchInvoicePdf(env, token, realmId, invoiceId)
      attachments = [{ filename: `Invoice-${doc}.pdf`, content: pdf, contentType: 'application/pdf' }]
    }
    const payUrl = await createInvoicePayLink({ amount: balance, label: `Invoice ${doc} — JK No Jokes` })
    const html = invoiceEmailHtml({ customer, doc, balance, dueDate, payUrl, zelleEmail })
    const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `JK No Jokes <${SMTP_USER}>`,
      to: String(to),
      subject: `[TEST] Invoice ${doc} from JK No Jokes`,
      text: `Test of the invoice email — invoice ${doc}, $${Number(balance).toFixed(2)}.`,
      html,
      attachments,
    })
    return res.status(200).json({ ok: true, to, invoiceId: invoiceId || null, doc, balance, hasPayLink: !!payUrl, hasPdf: attachments.length > 0, messageId: info.messageId })
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}
