/**
 * PR artifact screenshots — Jerky consignment badge + ship store (E2E mocks, no Supabase).
 * Usage: NEXT_PUBLIC_E2E=1 node scripts/jerky-consign-pr-screenshots.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })
const PORT = 3112
const BASE = `http://127.0.0.1:${PORT}`

function waitForServer(ms = 120000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const r = await fetch(BASE + '/jerky-munch')
        if (r.ok) return resolve()
      } catch (_) { /* retry */ }
      if (Date.now() - start > ms) return reject(new Error('dev server timeout'))
      setTimeout(tick, 400)
    }
    tick()
  })
}

const child = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname,
  env: { ...process.env, NEXT_PUBLIC_E2E: '1' },
  stdio: 'ignore',
})

try {
  await waitForServer()
  const chrome = process.env.E2E_CHROME || '/usr/local/bin/google-chrome'
  const browser = await chromium.launch({ executablePath: chrome })
  for (const [name, viewport] of [
    ['consign-badge-desktop', { width: 1280, height: 900 }],
    ['consign-badge-phone', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('.jm-consign').getByText('E2E Active Store').first().click()
    await page.waitForTimeout(500)
    await page.locator('[data-testid="consign-shelf-badge"]').first().scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
    await page.close()
  }

  for (const [name, viewport] of [
    ['consign-ship-grand-essex-desktop', { width: 1280, height: 900 }],
    ['consign-ship-grand-essex-phone', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('.jm-consign').getByText('Grand and Essex').first().click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    await page.close()
  }

  await browser.close()
  console.log('Saved screenshots to', OUT)
} finally {
  child.kill('SIGTERM')
}
