import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabaseAdmin'

// ── Client-portal auth ───────────────────────────────────────────────────
// SERVER-SIDE ONLY. A portal user is a Supabase auth account whose email is
// mapped to exactly one client_slug in portal_users. The API layer forces
// every action onto that slug — a portal login can never name a client, so
// it can never see anyone else's books. Fails closed.

export async function requirePortalUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return { ok: false, reason: 'Not signed in.' }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  const { data: { user }, error } = await anon.auth.getUser(token)
  if (error || !user || !user.email) return { ok: false, reason: 'Not signed in.' }

  const { data: row, error: dbErr } = await supabaseAdmin
    .from('portal_users').select('client_slug, label').eq('email', user.email.toLowerCase()).maybeSingle()
  if (dbErr) return { ok: false, reason: `portal_users: ${dbErr.message}` }
  if (!row) return { ok: false, reason: 'This account has no portal access.' }

  return { ok: true, email: user.email.toLowerCase(), clientSlug: row.client_slug, label: row.label }
}
