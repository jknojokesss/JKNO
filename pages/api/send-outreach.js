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

I build live dashboards for local businesses — your sales, cash flow, and orders on one screen instead of waiting on your accountant to tell you how last month went.

I put together a demo you can click around at jknojokes.com — and beyond financials, I can build dashboards to track anything in your business: orders, inventory, team performance, you name it.

Happy to walk you through it personally too. Interested? Reach out today!

— Jonathan Katz | JK No Jokes Financials | jknojokes.com`

  try {
    await transporter.sendMail({
      from: `"Jonathan Katz at JK Financials" <${process.env.ZOHO_EMAIL}>`,
      to,
      subject: 'what your numbers could look like (demo inside)',
      text: body,
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
