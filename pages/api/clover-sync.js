import { runCloverSync } from '../../lib/cloverSync'

// Manual sync, triggered by the SYNC NOW button on /admin/sync.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const { start, end } = req.body || {}
  try {
    const result = await runCloverSync({ start, end })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
