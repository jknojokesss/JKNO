// GET /api/jerky/admin/change-requests?open=1

import { requireJerkyAdmin } from '../../../../lib/requireJerkyAdmin'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const gate = requireJerkyAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  let q = gate.db.from('jerky_change_requests').select('*').order('created_at', { ascending: false })

  if (req.query.open === '1' || req.query.open === 'true') {
    q = q.in('status', ['received', 'in_progress'])
  }

  const { data, error } = await q
  if (error) {
    console.error('[jerky-admin change-requests] list failed', error.message)
    return res.status(500).json({ error: 'Could not load change requests.' })
  }

  return res.status(200).json({ requests: data || [] })
}
