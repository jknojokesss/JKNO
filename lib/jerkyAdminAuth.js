// SERVER-SIDE ONLY — bearer token check for Jerky admin APIs (no DB).

export function jerkyAdminAuthFromRequest(req) {
  const expected = process.env.JERKY_ADMIN_TOKEN
  if (!expected) return { ok: false, reason: 'Jerky admin API is not configured.' }

  const auth = req.headers.authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!bearer || bearer !== expected) return { ok: false, reason: 'Invalid admin token.' }

  return { ok: true }
}
