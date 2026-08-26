import crypto from 'crypto'

// ── OAuth state for the QuickBooks connect flow ──────────────────────────
// SERVER-SIDE ONLY.
//
// The state param is CSRF protection: it proves the callback belongs to a
// flow we started. It used to be proved by a cookie alone, which stranded
// real users three ways — the cookie is host-only (a flow begun on the apex
// domain is invisible to www), it lived 10 minutes (shorter than an Intuit
// login with 2FA and a company picker), and the callback clears it on
// success (so a refresh of the success page looked like an attack).
//
// So the state now carries its own proof: client, nonce, expiry, HMAC. The
// cookie is still honoured when present, but its absence no longer strands
// anyone. Without a configured secret we fall back to cookie-only, which is
// the old behaviour rather than an open door.

const SECRET = () => process.env.PORTAL_LINK_SECRET || process.env.CRON_SECRET || ''
const TTL_MS = 30 * 60 * 1000

const sign = (payload) => crypto.createHmac('sha256', SECRET()).update(payload).digest('base64url')

export function makeState(client) {
  const nonce = crypto.randomBytes(12).toString('hex')
  const exp = Date.now() + TTL_MS
  const payload = `${client}.${nonce}.${exp}`
  return SECRET() ? `${payload}.${sign(payload)}` : payload
}

/** → { ok, client, reason }. `reason` is for our logs, not the user. */
export function verifyState(state, cookieState) {
  const raw = String(state || '')
  if (!raw) return { ok: false, reason: 'missing' }
  const parts = raw.split('.')

  // Same browser that started the flow — proof enough on its own.
  if (cookieState && cookieState === raw) return { ok: true, client: parts[0] }

  if (SECRET() && parts.length === 4) {
    const [client, nonce, exp, sig] = parts
    const expect = sign(`${client}.${nonce}.${exp}`)
    const same = expect.length === sig.length &&
      crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))
    if (!same) return { ok: false, reason: 'bad-signature' }
    if (Date.now() > Number(exp)) return { ok: false, reason: 'expired' }
    return { ok: true, client }
  }
  return { ok: false, reason: 'no-cookie' }
}

/** Scoped to the registrable domain so apex and www share one flow. */
export function stateCookie(host, state) {
  const bare = String(host || '').split(':')[0].replace(/^www\./, '')
  const shareable = bare.includes('.') && !/^\d+(\.\d+){3}$/.test(bare)
  return `qbo_oauth_state=${state}; HttpOnly; Secure; Path=/api/qbo; Max-Age=1800; SameSite=Lax` +
    (shareable ? `; Domain=${bare}` : '')
}

export function clearStateCookie(host) {
  const bare = String(host || '').split(':')[0].replace(/^www\./, '')
  const shareable = bare.includes('.') && !/^\d+(\.\d+){3}$/.test(bare)
  return `qbo_oauth_state=; HttpOnly; Secure; Path=/api/qbo; Max-Age=0; SameSite=Lax` +
    (shareable ? `; Domain=${bare}` : '')
}
