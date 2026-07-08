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

I do bookkeeping and build live dashboards for local businesses — sales, cash flow, and orders on one screen.

Here's a demo you can click around: jknojokes.com

Everything in it can be custom-built for your business — orders, inventory, team performance, whatever you need tracked. Happy to walk you through it personally. Interested? Reach out today!

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
