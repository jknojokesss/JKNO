// POST /api/jerky/admin/change-requests/[id]/notify — re-send webhook ping

import { requireJerkyAdmin } from '../../../../../../lib/requireJerkyAdmin'
import { postJerkyChangeRequestWebhook } from '../../../../../../lib/jerkyChangeRequestWebhook'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const gate = requireJerkyAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const id = req.query.id
  if (!id) return res.status(400).json({ error: 'Missing id.' })

  const { data, error } = await gate.db.from('jerky_change_requests').select('*').eq('id', id).maybeSingle()
  if (error) {
    console.error('[jerky-admin change-requests] load failed', error.message)
    return res.status(500).json({ error: 'Could not load request.' })
  }
  if (!data) return res.status(404).json({ error: 'Request not found.' })

  const result = await postJerkyChangeRequestWebhook(data, { logTag: 'jerky-change-request-notify' })

  return res.status(200).json({ notified: true, webhook: result })
}
