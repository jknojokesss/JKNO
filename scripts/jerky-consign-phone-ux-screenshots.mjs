/**
 * PR screenshots — Jerky consignment phone UX (E2E mocks).
 * Usage: NEXT_PUBLIC_E2E=1 node scripts/jerky-consign-phone-ux-screenshots.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })
mkdirSync(new URL('../artifacts', import.meta.url).pathname, { recursive: true })
const REPO_ART = new URL('../artifacts', import.meta.url).pathname
const PORT = 3113
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

async function snap(page, name) {
  const path = `${OUT}/${name}.png`
  await page.screenshot({ path, fullPage: false })
  await page.screenshot({ path: `${REPO_ART}/${name}.png`, fullPage: false })
  console.log('Saved', name)
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

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('[data-testid="consign-store-search"]').scrollIntoViewIfNeeded()
    await snap(page, 'consign-sticky-search-desktop')
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('[data-testid="consign-store-search"]').scrollIntoViewIfNeeded()
    await snap(page, 'consign-sticky-search-phone')
    await page.close()
  }

  for (const [suffix, viewport] of [
    ['desktop', { width: 1280, height: 900 }],
    ['phone', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('.jm-consign').getByText('E2E Active Store').first().click()
    await page.waitForTimeout(500)
    await page.locator('[data-testid="consign-action-chips"]').scrollIntoViewIfNeeded()
    await snap(page, `consign-visit-chips-${suffix}`)
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('.jm-consign').getByText('E2E Active Store').first().click()
    await page.waitForTimeout(500)
    await page.locator('[data-testid="consign-activity-ledger"]').scrollIntoViewIfNeeded()
    await snap(page, 'consign-activity-ledger-phone')
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
    await page.locator('button', { hasText: /^Consignment$/ }).click()
    await page.waitForTimeout(400)
    await page.locator('.jm-consign').getByText('Grand and Essex').first().click()
    await page.waitForTimeout(500)
    await page.locator('summary', { hasText: /Store settings/i }).click()
    await page.waitForTimeout(300)
    await page.locator('[data-testid="consign-delivery-e2e-ship"]').scrollIntoViewIfNeeded()
    await snap(page, 'consign-delivery-settings-phone')
    await page.close()
  }

  await browser.close()
  console.log('Screenshots in', OUT, 'and', REPO_ART)
} finally {
  child.kill('SIGTERM')
}
