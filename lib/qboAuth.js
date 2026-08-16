// ── One place that hands out QuickBooks access tokens ────────────────────
// SERVER-SIDE ONLY.
//
// Intuit ROTATES the refresh token on every refresh: the response carries a
// new one and invalidates the old. So any code path that refreshes MUST
// persist what came back, or the next path to run gets invalid_grant and the
// client's connection is dead until somebody clicks connect again.
//
// That is why token acquisition lives here instead of being written twice.
// The nightly cron (/api/cron/qbo-sync) still does its own inline refresh —
// it persists correctly, so it is safe — but anything new goes through this.
//
// Reuses a still-valid access token when there is one, which keeps rotation
// churn down: a manual push right after the nightly sync does not need to
// spend a refresh at all.

import { qboEnv, refreshTokens } from './qbo'
import { supabaseAdmin } from './supabaseAdmin'

const SKEW_MS = 120 * 1000 // treat a token expiring inside 2 minutes as expired

export class QboAuthError extends Error {
  constructor(message, { needsReconnect = false, clientSlug = null } = {}) {
    super(message)
    this.name = 'QboAuthError'
    this.needsReconnect = needsReconnect
    this.clientSlug = clientSlug
  }
}

export async function getConnection(clientSlug) {
  const { data, error } = await supabaseAdmin
    .from('qbo_connections').select('*').eq('client_slug', clientSlug).maybeSingle()
  if (error) throw new Error(`Could not read qbo_connections: ${error.message}`)
  if (!data) {
    throw new QboAuthError(
      `No QuickBooks connection for "${clientSlug}". Connect it once at /api/qbo/connect?client=${clientSlug}.`,
      { needsReconnect: true, clientSlug }
    )
  }
  return data
}

/**
 * A live access token for one client.
 * Returns { env, token, realmId, connection, refreshed }.
 */
export async function getLiveToken(clientSlug) {
  const env = qboEnv()
  if (!env) throw new Error('QBO is not configured — set QBO_CLIENT_ID and QBO_CLIENT_SECRET.')

  const c = await getConnection(clientSlug)
  if (c.status === 'disabled') {
    throw new QboAuthError(`The "${clientSlug}" connection is disabled.`, { clientSlug })
  }

  const stillGood = c.access_token && c.access_expires_at &&
    new Date(c.access_expires_at).getTime() - Date.now() > SKEW_MS
  if (stillGood) {
    return { env, token: c.access_token, realmId: c.realm_id, connection: c, refreshed: false }
  }

  let tokens
  try {
    tokens = await refreshTokens(env, c.refresh_token)
  } catch (e) {
    // invalid_grant = refresh token revoked or idle past ~100 days.
    const dead = e.code === 'invalid_grant'
    await supabaseAdmin.from('qbo_connections').update({
      status: dead ? 'reauth_needed' : 'error',
      last_error: String(e.message || e).slice(0, 500),
      last_intuit_tid: e.intuitTid || null,
      last_error_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('client_slug', clientSlug)
    throw new QboAuthError(
      dead
        ? `QuickBooks needs reconnecting for "${clientSlug}" — the refresh token is dead. Visit /api/qbo/connect?client=${clientSlug}.`
        : `Could not refresh the QuickBooks token for "${clientSlug}": ${e.message}`,
      { needsReconnect: dead, clientSlug }
    )
  }

  // Persist BEFORE doing anything else with the token.
  await supabaseAdmin.from('qbo_connections').update({
    refresh_token: tokens.refresh_token || c.refresh_token,
    access_token: tokens.access_token,
    access_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    status: 'connected',
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq('client_slug', clientSlug)

  return { env, token: tokens.access_token, realmId: c.realm_id, connection: c, refreshed: true }
}
