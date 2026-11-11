// PATCH /api/jerky/admin/change-requests/[id]  { status, replyNote }

import { requireJerkyAdmin } from '../../../../../lib/requireJerkyAdmin'
import { isJerkyChangeRequestStatus } from '../../../../../lib/jerkyChangeRequests'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'PATCH only' })

  const gate = requireJerkyAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const id = req.query.id
  if (!id) return res.status(400).json({ error: 'Missing id.' })

  const patch = {}
  if (req.body && req.body.status !== undefined) {
    const status = String(req.body.status).trim()
    if (!isJerkyChangeRequestStatus(status)) return res.status(400).json({ error: 'Invalid status.' })
    patch.status = status
  }
  if (req.body && req.body.replyNote !== undefined) {
    patch.reply_note = req.body.replyNote == null ? null : String(req.body.replyNote).trim()
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' })

  const { data, error } = await gate.db
    .from('jerky_change_requests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[jerky-admin change-requests] patch failed', error.message)
    return res.status(500).json({ error: 'Update failed.' })
  }
  if (!data) return res.status(404).json({ error: 'Request not found.' })

  return res.status(200).json({ request: data })
}
