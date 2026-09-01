// GET /api/jerky/email-status — health check for the invoice mailer.
// Returns booleans + the non-secret From/host only (never the user or password),
// so we can confirm the SMTP env vars landed and a redeploy picked them up.
import { jerkyMailerConfigured } from '../../../lib/jerkyMailer'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    configured: jerkyMailerConfigured(),
    from: process.env.JERKY_SMTP_FROM || null,
    replyTo: process.env.JERKY_SMTP_REPLYTO || null,
    host: process.env.JERKY_SMTP_HOST || 'smtp.gmail.com (default)',
    port: process.env.JERKY_SMTP_PORT || '465 (default)',
  })
}
