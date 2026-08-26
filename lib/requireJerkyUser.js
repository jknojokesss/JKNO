// ── Who may call the Jerky Munch invoice endpoints ───────────────────────
// SERVER-SIDE ONLY. FAILS CLOSED.
//
// These routes create real invoices in Efraim's QuickBooks, so an
// unauthenticated caller must never get through. The Jerky portal signs users
// into Jerky's own Supabase project; we verify that session token against that
// same project (service-role client) and refuse the count-only "counter" role.

import { targetFor } from './qboTargets'

export async function requireJerkyUser(req) {
  const auth = req.headers.authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!bearer) return { ok: false, reason: 'Sign in to Jerky Munch first.' }

  let db
  try { db = targetFor('jerky').db } catch (e) { return { ok: false, reason: 'Jerky project is not configured on the server.' } }

  const { data, error } = await db.auth.getUser(bearer)
  if (error || !data || !data.user || !data.user.email) return { ok: false, reason: 'That session is not valid — sign in again.' }
  const email = data.user.email

  const { data: roleRow } = await db.from('user_roles').select('role').ilike('email', email).maybeSingle()
  if (roleRow && roleRow.role === 'counter') return { ok: false, reason: "Count-only users can't create invoices." }

  return { ok: true, email, db }
}
