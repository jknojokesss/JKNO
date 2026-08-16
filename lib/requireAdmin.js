// ── Who is allowed to call the QuickBooks write endpoints ────────────────
// SERVER-SIDE ONLY.
//
// FAILS CLOSED. An earlier version of this returned true when no API key was
// configured, on the reasoning that the admin page sits behind a login — but
// the page being protected says nothing about the API route, which anyone
// could POST to directly. These routes write to clients' books, so an
// unauthenticated caller must never get through.
//
// Two ways in:
//   1. Browser — Authorization: Bearer <supabase session token>, checked
//      against the admins table. This is what /admin/qbo-push sends.
//   2. Script  — x-admin-key: <ADMIN_API_KEY>, for calling it from a terminal.

import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabaseAdmin'

export async function requireAdmin(req) {
  // 1. Machine key
  const configured = process.env.ADMIN_API_KEY
  const presented = req.headers['x-admin-key']
  if (configured && presented) {
    if (presented === configured) return { ok: true, via: 'api-key', who: 'script' }
    return { ok: false, reason: 'Bad admin key.' }
  }

  // 2. Signed-in admin
  const auth = req.headers.authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!bearer) {
    return { ok: false, reason: 'Sign in as an admin, or send x-admin-key.' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return { ok: false, reason: 'Supabase is not configured.' }

  const asUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await asUser.auth.getUser()
  if (error || !data || !data.user || !data.user.email) {
    return { ok: false, reason: 'That session is not valid.' }
  }

  const email = data.user.email
  const { data: admin } = await supabaseAdmin
    .from('admins').select('email').eq('email', email).maybeSingle()
  if (!admin) return { ok: false, reason: `${email} is not an admin.` }

  return { ok: true, via: 'session', who: email }
}
