import { requireAdmin } from '../../../lib/requireAdmin'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { CLIENT_LAUNCHERS, ADMIN_TOOLS } from '../../../lib/adminHub'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireAdmin(req)
  if (!auth.ok) return res.status(401).json({ error: auth.reason })

  let connections = []
  try {
    const { data } = await supabaseAdmin
      .from('qbo_connections')
      .select('client_slug, status, company_name, last_synced_at, last_error')
    connections = data || []
  } catch {
    connections = []
  }

  const bySlug = Object.fromEntries(connections.map((c) => [c.client_slug, c]))

  const clients = CLIENT_LAUNCHERS.map((c) => ({
    ...c,
    qbo: c.slug ? bySlug[c.slug] || null : null,
  }))

  return res.status(200).json({ clients, tools: ADMIN_TOOLS })
}
