import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, firstName } = req.body
  if (!to) return res.status(400).json({ error: 'Missing email' })

  const body = `Hi ${firstName || 'there'},

Do you actually know your numbers week to week, or are you waiting on your accountant to tell you how last month went?

I build financial dashboards for local businesses that give you a live view of your P&L, cash flow, and sales — and beyond just financials, I can build dashboards to track anything in your business: orders, inventory, team performance, you name it.

You can see a live demo at jknojokes.com — happy to walk you through it personally too.

Interested? Reach out today!

— Jonathan Katz | JK No Jokes Financials | jknojokes.com`

  try {
    await transporter.sendMail({
      from: `"JK No Jokes Financials" <${process.env.ZOHO_EMAIL}>`,
      to,
      subject: 'Quick question about your books',
      text: body,
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
