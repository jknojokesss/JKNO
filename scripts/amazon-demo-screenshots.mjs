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

  for (const [name, hash] of TABS) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, `desk-${name}.png`), fullPage: true })
  }

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

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ov-boxes', { timeout: 15000 })
  await page.waitForSelector('.two.even.sec .tbl-wrap table', { timeout: 15000 })
  const clip = await page.evaluate(() => {
    const boxes = document.querySelector('.ov-boxes')
    const prodPanel = document.querySelector('.two.even.sec .tbl-wrap table')
    if (!boxes || !prodPanel) return null
    const r1 = boxes.getBoundingClientRect()
    const r2 = prodPanel.getBoundingClientRect()
    const pad = 8
    return {
      x: Math.max(0, Math.floor(r1.left - pad)),
      y: Math.max(0, Math.floor(r1.top - pad)),
      width: Math.ceil(Math.max(r1.right, r2.right) - r1.left + pad * 2),
      height: Math.ceil(r2.bottom - r1.top + pad * 2),
    }
  })
  if (clip) {
    await page.screenshot({ path: path.join(OUT, 'type-closeup.png'), clip })
  } else {
    await page.locator('.sum-hero').screenshot({ path: path.join(OUT, 'type-closeup.png') })
  }

  await browser.close()
  console.log('Saved screenshots to', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
