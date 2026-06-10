import { runCloverSync } from '../../../lib/cloverSync'

// Nightly auto-sync, triggered by the Vercel cron defined in vercel.json.
// Vercel automatically attaches "Authorization: Bearer <CRON_SECRET>" to cron
// requests when the CRON_SECRET env var is set, so we require it here — that
// keeps this endpoint from being triggerable by the public internet.
export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    // Rolling window: re-pull the last 7 days every night. Dedupe on
    // order_line_id means the overlap never creates duplicates, and it
    // catches any orders that were edited/closed after the fact.
    const end = new Date()
    const start = new Date(Date.now() - 7 * 864e5)
    const fmt = (d) => d.toISOString().slice(0, 10)
    const result = await runCloverSync({ start: fmt(start), end: fmt(end) })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
