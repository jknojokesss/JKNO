import { qboEnv, exchangeCode, fetchCompanyName } from '../../../lib/qbo'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// OAuth landing: verify state, swap the code for tokens, confirm which
// company file we actually got, and store the connection. Shows the company
// name back so a wrong-file connect is caught on the spot.
export default async function handler(req, res) {
  const env = qboEnv()
  if (!env) return res.status(500).send('QBO is not configured.')

  const { code, state, realmId, error } = req.query
  if (error) return res.status(400).send(`Intuit returned an error: ${error}`)
  if (!code || !state || !realmId) return res.status(400).send('Missing code/state/realmId on callback.')

  const cookieState = ((req.headers.cookie || '').match(/(?:^|;\s*)qbo_oauth_state=([^;]+)/) || [])[1]
  if (!cookieState || cookieState !== state) {
    return res.status(400).send('State mismatch — start again from /api/qbo/connect?client=…')
  }
  const client = state.split('.')[0]

  try {
    const tokens = await exchangeCode(env, code)
    // Don't swallow this: if the name lookup fails the connection is stored
    // but something is wrong (usually QBO_ENV pointing at the wrong API base),
    // and the operator needs to see it here rather than at 3am in a cron log.
    let companyName = null, lookupError = null
    try {
      companyName = await fetchCompanyName(env, tokens.access_token, realmId)
    } catch (e) {
      lookupError = String(e.message || e)
    }

    // Portal-only clients (mapped in portal_users) never sync their books
    // into the shared DB — the portal reads live and stores only tokens.
    const { data: portalRow } = await supabaseAdmin
      .from('portal_users').select('email').eq('client_slug', client).limit(1).maybeSingle()

    const { error: dbErr } = await supabaseAdmin.from('qbo_connections').upsert({
      client_slug: client,
      sync_books: !portalRow,
      realm_id: String(realmId),
      environment: env.sandbox ? 'sandbox' : 'production',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      company_name: companyName,
      status: lookupError ? 'error' : 'connected',
      last_error: lookupError,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_slug' })
    if (dbErr) throw new Error(dbErr.message)

    res.setHeader('Set-Cookie', 'qbo_oauth_state=; HttpOnly; Secure; Path=/api/qbo; Max-Age=0')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><body style="font-family:Georgia,serif;max-width:560px;margin:80px auto;color:#1A1E24">
      <h2>${lookupError ? 'Authorized — but the company lookup failed' : `Connected: ${companyName}`}</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#444C56;line-height:1.6">
        QuickBooks company <b>${companyName || realmId}</b> is now linked to client
        <b>${client}</b>, using the <b>${env.sandbox ? 'sandbox' : 'production'}</b> API.
        ${lookupError ? '' : 'The nightly sync will pull its P&amp;L from here on. If that company name is wrong, run the connect link again and pick the right one — it overwrites this connection.'}
      </p>
      ${lookupError ? `<p style="font-family:sans-serif;font-size:13px;color:#444C56;line-height:1.6;background:#F6F6F6;border-left:3px solid #035CEB;padding:12px 14px">
        Tokens were stored, but reading the company failed:<br><code style="font-size:12px">${lookupError.replace(/</g, '&lt;')}</code><br><br>
        If you connected a real company while <b>QBO_ENV</b> is set to <b>sandbox</b> (or vice versa),
        fix that environment variable, redeploy, and run this connect link again.
      </p>` : ''}
      </body>`)
  } catch (e) {
    return res.status(500).send(`Connect failed: ${String(e.message || e)}`)
  }
}
