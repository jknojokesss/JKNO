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

Following up, and I did something specific this time. After I reached out, I put up live sample dashboards by industry — so instead of a generic demo, you can click your own line of work and watch a real one load: jknojokes.com/demos

Quick gut-check: do you know your actual profit for this month, today — or weeks later when the books catch up? That's the whole thing I fix.

If it's useful, 10 minutes and I'll build one around your real numbers. If not, just reply "not now" and I'll leave your inbox alone.

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
