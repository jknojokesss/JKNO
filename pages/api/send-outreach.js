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

const FOOTER = `P.S. Not for you? Just reply STOP and I won't email again.`

const firstEmail = (firstName) => ({
  subject: 'what your numbers could look like (demo inside)',
  body: `Hi ${firstName || 'there'},

I do bookkeeping and build live dashboards for local businesses — sales, cash flow, and orders on one screen.

Here's a demo you can click around: jknojokes.com

Everything in it can be custom-built for your business — orders, inventory, team performance, whatever you need tracked. Happy to walk you through it personally. Interested? Reach out today!

— Jonathan Katz | JK No Jokes Financials | jknojokes.com

${FOOTER}`,
})

const followUpEmail = (firstName) => ({
  subject: 're: what your numbers could look like (demo inside)',
  body: `Hi ${firstName || 'there'},

Just bumping this in case it got buried — the live dashboard demo is at jknojokes.com. Takes two minutes to click around.

If now's not the time, no worries at all.

— Jonathan Katz | JK No Jokes Financials | jknojokes.com

${FOOTER}`,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, firstName, followUp } = req.body
  if (!to) return res.status(400).json({ error: 'Missing email' })

  const { subject, body } = followUp ? followUpEmail(firstName) : firstEmail(firstName)

  try {
    await transporter.sendMail({
      from: `"Jonathan Katz at JK Financials" <${process.env.ZOHO_EMAIL}>`,
      to,
      subject,
      text: body,
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
