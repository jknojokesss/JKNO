// SERVER-SIDE ONLY — bearer token gate for Jerky admin APIs.

import { targetFor } from './qboTargets'
import { jerkyAdminAuthFromRequest } from './jerkyAdminAuth.js'

export function requireJerkyAdmin(req) {
  const auth = jerkyAdminAuthFromRequest(req)
  if (!auth.ok) return auth

  let db
  try {
    db = targetFor('jerky').db
  } catch (e) {
    return { ok: false, reason: 'Jerky project is not configured on the server.' }
  }

  return { ok: true, db }
}
