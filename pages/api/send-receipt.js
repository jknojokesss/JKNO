import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// Only these signed-in accounts may send receipts (prevents the endpoint
// from being used as an open email relay).
const ALLOWED = ['jk@jknojokes.com', 'info@lewimports.com']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // ── Verify the caller is a signed-in, allowlisted user ──
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Not signed in.' })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user || !ALLOWED.includes((user.email || '').toLowerCase())) {
      return res.status(403).json({ error: 'Not authorized.' })
    }

    const { to, subject, html } = req.body || {}
    if (!to || !subject || !html) return res.status(400).json({ error: 'Missing to / subject / html.' })

    const GMAIL_USER = process.env.GMAIL_USER
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return res.status(503).json({ error: 'Email is not set up yet — add the Gmail credentials in the site settings.' })
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })

    await transporter.sendMail({
      from: `LEW Imports <${GMAIL_USER}>`,
      replyTo: GMAIL_USER,
      to,
      subject,
      html,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-receipt error:', err)
    return res.status(500).json({ error: err.message || 'Send failed.' })
  }
}
