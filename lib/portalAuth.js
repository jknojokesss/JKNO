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

/**
 * Is this client slug managed by a portal login?
 *
 * A portal client's books are theirs alone: we tell them at connect time
 * that nothing is stored and only they reach their data, so the admin
 * endpoints must refuse their slug outright rather than relying on nobody
 * typing it. Throws on a lookup failure so the caller fails CLOSED.
 *
 * Lifting it is deliberate and visible: delete their portal_users row.
 */
export async function isPortalClient(clientSlug) {
  if (!clientSlug) return false
  const { data, error } = await supabaseAdmin
    .from('portal_users').select('email').eq('client_slug', clientSlug).limit(1).maybeSingle()
  if (error) throw new Error(`Could not check portal ownership: ${error.message}`)
  return !!data
}

export function portalClientRefusal(clientSlug) {
  return `"${clientSlug}" is a portal client — their books are reachable only from their own portal login, never from the admin side. That is the promise made to them when they connected.`
}
