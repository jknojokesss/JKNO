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

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const prefix = width < 500 ? 'phone' : 'desk'
  await page.screenshot({
    path: path.join(OUT, `${prefix}-${name}.png`),
    fullPage: width >= 500,
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  for (const [name, hash] of TABS) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT, `desk-${name}.png`), fullPage: true })
  }

  for (const [name, hash] of TABS) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT, `phone-${name}.png`), fullPage: true })
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#mobTabs', { timeout: 15000 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(OUT, 'phone-bottom-tabs.png'), fullPage: false })

  await page.setViewportSize({ width: 900, height: 600 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.sum-hero', { timeout: 15000 })
  const hero = page.locator('.sum-hero')
  await hero.screenshot({ path: path.join(OUT, 'type-closeup.png') })

  await browser.close()
  console.log('Saved screenshots to', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
