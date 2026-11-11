// POST /api/jerky/change-requests — signed-in Jerky user submits a change request.

import { requireJerkyUser } from '../../../lib/requireJerkyUser'
import { postJerkyChangeRequestWebhook } from '../../../lib/jerkyChangeRequestWebhook'

const MAX_TEXT = 4000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const { data: roleRow } = await gate.db.from('user_roles').select('role').ilike('email', gate.email).maybeSingle()
  if (roleRow && roleRow.role === 'counter') {
    return res.status(403).json({ error: 'Count-only users cannot submit change requests.' })
  }

  const text = String((req.body && req.body.text) || '').trim()
  const pageLabel = String((req.body && req.body.page) || (req.body && req.body.pageLabel) || 'Dashboard').trim()
  if (!text) return res.status(400).json({ error: 'Describe what you want changed.' })
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Keep it under ${MAX_TEXT} characters.` })

  const row = {
    user_id: gate.userId,
    submitter_email: gate.email,
    request_text: text,
    page_label: pageLabel.slice(0, 200),
    status: 'received',
  }

  const { data, error } = await gate.db.from('jerky_change_requests').insert(row).select('*').single()
  if (error) {
    console.error('[jerky-change-requests] insert failed', error.message)
    return res.status(500).json({ error: 'Could not save your request. If this is new, the database migration may not be applied yet.' })
  }

  await postJerkyChangeRequestWebhook(data)

  return res.status(201).json({ request: data })
}
