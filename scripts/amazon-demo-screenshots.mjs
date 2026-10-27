import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'
const OUT = process.env.OUT_DIR || '/opt/cursor/artifacts/amazon-demo'

const TABS = [
  ['01-overview', '#/overview'],
  ['02-weekly-report', '#/report'],
  ['03-products', '#/products'],
  ['04-fba-shipments', '#/shipments'],
  ['05-expenses', '#/expenses'],
  ['06-inventory', '#/inventory'],
  ['07-cash', '#/cash'],
  ['08-data-sources', '#/sources'],
]

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#main', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'desk-01-overview.png'), fullPage: true })

  await page.goto(`${BASE}#/cash`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#main', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'desk-07-cash.png'), fullPage: true })

  for (const [name, hash] of TABS) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, `phone-vp-${name}.png`),
      fullPage: false,
    })
    await page.screenshot({
      path: path.join(OUT, `phone-full-${name}.png`),
      fullPage: true,
    })
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.click('#mobMoreBtn')
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(OUT, 'phone-vp-more-open.png'),
    fullPage: false,
  })

  await browser.close()
  console.log('Saved screenshots to', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
