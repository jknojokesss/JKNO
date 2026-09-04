/*
 * Boots a dev server with E2E mode on, runs the smoke tests against it, and
 * always tears the server down. Supabase vars are placeholders: E2E mode never
 * talks to the database, which is the point — the tests see the empty screens.
 */
const { spawn, spawnSync } = require('child_process')
const http = require('http')

const PORT = process.env.E2E_PORT || 3111
const BASE = `http://localhost:${PORT}`

const env = {
  ...process.env,
  NEXT_PUBLIC_E2E: '1',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://e2e-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'e2e-placeholder-key',
}

const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env, stdio: 'ignore', detached: true })
const stop = () => { try { process.kill(-server.pid) } catch (e) { try { server.kill('SIGKILL') } catch (e2) {} } }
process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(1) })

const ping = () => new Promise(res => {
  const req = http.get(BASE + '/gowns', r => { r.resume(); res(r.statusCode === 200) })
  req.on('error', () => res(false)); req.setTimeout(2000, () => { req.destroy(); res(false) })
})

;(async () => {
  process.stdout.write('starting dev server')
  for (let i = 0; i < 60; i++) {
    if (await ping()) { console.log(' — up\n'); break }
    process.stdout.write('.')
    await new Promise(r => setTimeout(r, 2000))
    if (i === 59) { console.log('\ndev server never came up'); stop(); process.exit(1) }
  }
  const r = spawnSync('node', [require('path').join(__dirname, 'gowns.spec.js')], {
    stdio: 'inherit', env: { ...env, E2E_BASE: BASE },
  })
  stop()
  process.exit(r.status || 0)
})()
