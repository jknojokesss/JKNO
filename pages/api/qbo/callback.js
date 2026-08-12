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
    const companyName = await fetchCompanyName(env, tokens.access_token, realmId).catch(() => null)

    const { error: dbErr } = await supabaseAdmin.from('qbo_connections').upsert({
      client_slug: client,
      realm_id: String(realmId),
      environment: env.sandbox ? 'sandbox' : 'production',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      company_name: companyName,
      status: 'connected',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_slug' })
    if (dbErr) throw new Error(dbErr.message)

    res.setHeader('Set-Cookie', 'qbo_oauth_state=; HttpOnly; Secure; Path=/api/qbo; Max-Age=0')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><body style="font-family:Georgia,serif;max-width:520px;margin:80px auto;color:#1A1E24">
      <h2>Connected${companyName ? `: ${companyName}` : ''}</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#444C56">
        QuickBooks company <b>${companyName || realmId}</b> is now linked to client
        <b>${client}</b> (${env.sandbox ? 'sandbox' : 'production'}). The nightly sync will
        pull its P&amp;L from here on. If that company name is wrong, run the connect
        link again and pick the right one — it overwrites this connection.
      </p></body>`)
  } catch (e) {
    return res.status(500).send(`Connect failed: ${String(e.message || e)}`)
  }
}
