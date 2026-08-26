import { qboEnv, authorizeUrl } from '../../../lib/qbo'
import { makeState, stateCookie } from '../../../lib/qboState'

// Starts the QBO connect flow for one client:
//   /api/qbo/connect?client=reydel
// Whoever clicks (us, with an accountant login, or the client themselves)
// signs in at Intuit and picks a company; Intuit sends them to /callback.
// The client slug rides inside the state param, verified via cookie.
export default function handler(req, res) {
  const env = qboEnv()
  if (!env) return res.status(500).send('QBO is not configured — set QBO_CLIENT_ID and QBO_CLIENT_SECRET.')

  const client = String(req.query.client || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!client) return res.status(400).send('Missing ?client= slug (e.g. /api/qbo/connect?client=reydel).')

  const state = makeState(client)
  res.setHeader('Set-Cookie', stateCookie(req.headers.host, state))
  res.redirect(302, authorizeUrl(env, state))
}
