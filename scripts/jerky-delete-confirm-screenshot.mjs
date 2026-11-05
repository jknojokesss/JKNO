/**
 * Mock-data screenshot: consignment activity delete confirm (E2E stub, no Supabase).
 * Usage: node scripts/jerky-delete-confirm-screenshot.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })
const CHROME = process.env.E2E_CHROME || undefined
const PORT = 3112
const BASE = `http://localhost:${PORT}`

const { spawn } = await import('child_process')
const env = {
  ...process.env,
  NEXT_PUBLIC_E2E: '1',
  NEXT_PUBLIC_SUPABASE_URL: 'https://e2e-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-placeholder-key',
}
const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env, stdio: 'ignore', detached: true })
const stop = () => { try { process.kill(-server.pid) } catch { try { server.kill('SIGKILL') } catch {} } }

const ping = () => fetch(BASE + '/jerky-munch').then(r => r.ok).catch(() => false)
for (let i = 0; i < 45; i++) {
  if (await ping()) break
  await new Promise(r => setTimeout(r, 2000))
}

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 420, height: 900 } })
await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
await page.locator('button', { hasText: /^Consignment$/ }).click()
await page.waitForTimeout(400)
await page.getByText('E2E Active Store').click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Delete' }).first().click()
await page.waitForTimeout(400)
await page.locator('[data-testid="consign-delete-confirm"]').screenshot({ path: `${OUT}/jerky-consign-delete-confirm.png` })
await browser.close()
stop()
console.log(`Saved ${OUT}/jerky-consign-delete-confirm.png`)
