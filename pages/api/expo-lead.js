// Captures a lead from the /expo tablet form at an expo/trade show.
// 1) Always emails the lead to jk@jknojokes.com (works out of the box on Resend).
// 2) Best-effort auto-replies to the prospect with the demo + $25 offer. That
//    second email only delivers once a sending domain is verified in Resend and
//    RESEND_FROM is set to an address on it (e.g. "JK No Jokes <hello@jknojokes.com>").
//    Until then the prospect auto-reply is skipped/soft-fails and you follow up by hand.

const DEMO_URL = 'https://www.jknojokes.com/demo'
const BOOK_URL = 'https://calendly.com/jk-jknojokes/30min'
// Where leads get emailed. With the onboarding@resend.dev test sender, this MUST
// be the email your Resend account is registered under, or the send bounces.
// Override with LEAD_NOTIFY_EMAIL once a domain is verified.
const OWNER = process.env.LEAD_NOTIFY_EMAIL || 'jk@jknojokes.com'
// jknojokes.com is verified in Resend, so we send from the domain — this lets us
// email any prospect (not just the account owner) and lands in inboxes, not spam.
const FROM = 'JK No Jokes Financials <jk@jknojokes.com>'

const esc = (s) => String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

async function sendEmail({ to, subject, html, reply_to }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, ...(reply_to ? { reply_to } : {}) }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return res.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, business, email, phone, industry } = req.body || {}
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' })

  // 1) Notify the owner — this is the lead record, delivered to your inbox.
  try {
    await sendEmail({
      to: OWNER,
      reply_to: email,
      subject: `New expo lead: ${name}${business ? ` — ${business}` : ''}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:36px 22px;color:#1A1A2E;">
          <div style="border-bottom:2px solid #C9A84C;padding-bottom:18px;margin-bottom:26px;">
            <h1 style="font-size:22px;margin:0;">JK<span style="color:#C9A84C;">.</span></h1>
            <p style="font-size:11px;letter-spacing:3px;color:#C9A84C;margin:4px 0 0;font-family:monospace;">EXPO LEAD</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            ${[['NAME', name], ['BUSINESS', business], ['EMAIL', email], ['PHONE', phone], ['TYPE', industry]]
              .filter(([, v]) => v)
              .map(([k, v]) => `<tr style="border-bottom:1px solid #EEEAE2;"><td style="padding:12px 0;font-size:11px;color:#AAA098;font-family:monospace;letter-spacing:1px;width:110px;">${k}</td><td style="padding:12px 0;font-size:15px;color:#1A1A2E;">${esc(v)}</td></tr>`)
              .join('')}
          </table>
          <div style="margin-top:26px;padding:14px;background:#F7F4EF;border-left:3px solid #C9A84C;font-size:13px;color:#5A6070;">
            Captured at an expo. Reply to this email to reach ${esc(name)} directly — follow up within 24 hours.
          </div>
        </div>`,
    })
  } catch (e) {
    console.error('Owner notify failed:', e)
    return res.status(500).json({ error: 'Could not send the lead email.', detail: String(e.message || e).slice(0, 300) })
  }

  // 2) Auto-reply to the prospect (best effort — needs a verified Resend domain).
  let autoReplied = false
  try {
    await sendEmail({
      to: email,
      reply_to: OWNER,
      subject: 'Great meeting you — your dashboard demo + a $25 gift card',
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:36px 22px;color:#1A1A2E;">
          <h1 style="font-size:22px;margin:0 0 4px;">JK<span style="color:#C9A84C;">.</span> <span style="font-size:13px;color:#7A8090;">No Jokes Financials</span></h1>
          <p style="font-size:15px;line-height:1.6;color:#1A1A2E;">Hi ${esc(name)} — great meeting you${business ? ` and hearing about ${esc(business)}` : ''}.</p>
          <p style="font-size:15px;line-height:1.6;color:#1A1A2E;">Here's the live dashboard I showed you (sample data) so you can poke around it yourself:</p>
          <p style="margin:22px 0;"><a href="${DEMO_URL}" style="background:#C9A84C;color:#1A1A2E;text-decoration:none;padding:12px 22px;border-radius:4px;font-family:monospace;font-size:13px;letter-spacing:1px;">SEE THE LIVE DEMO →</a></p>
          <p style="font-size:15px;line-height:1.6;color:#1A1A2E;">And the offer for stopping by: book a free consultation this week and I'll send you a <strong>$25 gift card</strong> just for showing up.</p>
          <p style="margin:22px 0;"><a href="${BOOK_URL}" style="background:#1A2035;color:#F0DEAC;text-decoration:none;padding:12px 22px;border-radius:4px;font-family:monospace;font-size:13px;letter-spacing:1px;">BOOK A FREE CALL →</a></p>
          <p style="font-size:14px;line-height:1.6;color:#5A6070;">Talk soon,<br/>Jonathan Katz · <a href="mailto:${OWNER}" style="color:#C9A84C;">${OWNER}</a></p>
        </div>`,
    })
    autoReplied = true
  } catch (e) {
    console.error('Prospect auto-reply skipped (verify a Resend domain to enable):', e.message)
  }

  return res.status(200).json({ ok: true, autoReplied })
}
