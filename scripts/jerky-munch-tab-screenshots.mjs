/**
 * Screenshots every Jerky Munch owner tab (requires dev server with NEXT_PUBLIC_E2E=1).
 * Usage: E2E_BASE=http://localhost:3111 node scripts/jerky-munch-tab-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = process.env.E2E_BASE || 'http://localhost:3111'
const OUT = process.env.JERKY_SHOT_DIR || '/opt/cursor/artifacts/jerky-munch-tabs'
const PREFIX = process.env.JERKY_SHOT_PREFIX || 'after'

const TABS = [
  ['overview', 'Overview'],
  ['consign', 'Consignment'],
  ['invoices', 'Invoice Stores'],
  ['ads', 'Advertising'],
  ['financials', 'Financials'],
  ['expenses', 'Import expenses'],
  ['quickbooks', 'QuickBooks sync'],
]

mkdirSync(OUT, { recursive: true })

async function main() {
  const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {})

  for (const [suffix, w, h] of [['desktop-1280', 1280, 900], ['phone-390', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto(`${BASE}/jerky-munch`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))

    for (const [slug, label] of TABS) {
      await page.locator('button.jm-navbtn', { hasText: label }).click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${OUT}/${PREFIX}-${slug}-${suffix}.png`, fullPage: true })
    }
    await page.close()
  }

  await browser.close()
  console.log('Wrote tab screenshots to', OUT)
}

main().catch(e => { console.error(e); process.exit(1) })
