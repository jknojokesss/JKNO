import { chromium } from 'playwright'
import { mkdir, readdir, rm } from 'fs/promises'
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
  ['08-payables', '#/payables'],
  ['09-payout', '#/payout'],
  ['10-data-sources', '#/sources'],
]

async function purgeOldShots() {
  await mkdir(OUT, { recursive: true })
  const names = await readdir(OUT)
  for (const name of names) {
    if (name.startsWith('desk-') || name.startsWith('phone-') || name === 'type-closeup.png') {
      await rm(path.join(OUT, name), { force: true })
    }
  }
}

async function main() {
  await purgeOldShots()
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome',
  })
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
  await page.waitForSelector('.ov-prod-list a', { timeout: 15000 })
  await page.click('.ov-prod-list a')
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(OUT, 'phone-full-product-detail.png'),
    fullPage: true,
  })

  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.click('#mobMoreBtn')
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(OUT, 'phone-vp-more-open.png'),
    fullPage: false,
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ov-split', { timeout: 15000 })
  await page.waitForSelector('section.card.panel.sec .tbl-wrap table', { timeout: 15000 })
  const clip = await page.evaluate(() => {
    const boxes = document.querySelector('.ov-split')
    const table = document.querySelector('section.card.panel.sec .tbl-wrap table')
    const main = document.querySelector('#main')
    if (!boxes || !table || !main) return null
    const pad = 8
    const y0 = boxes.offsetTop
    const y1 = table.offsetTop + table.offsetHeight
    const x0 = boxes.offsetLeft + main.offsetLeft
    const w = Math.max(boxes.offsetWidth, table.offsetWidth)
    return {
      x: Math.max(0, x0 - pad),
      y: Math.max(0, y0 - pad),
      width: w + pad * 2,
      height: y1 - y0 + pad * 2,
    }
  })
  if (clip) {
    await page.screenshot({
      path: path.join(OUT, 'type-closeup.png'),
      fullPage: true,
      clip,
    })
  } else {
    await page.locator('.sum-hero').screenshot({ path: path.join(OUT, 'type-closeup.png') })
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}#/shipments`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#shipTbl tbody tr.click', { timeout: 15000 })
  const row = page.locator('#shipTbl tbody tr.click').first()
  await row.hover()
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(OUT, 'desk-04-shipments-hover.png'), fullPage: false })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}#/shipments`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#shipLeadClaims .claim-card', { timeout: 10000 })
  await page.waitForTimeout(300)
  await page.screenshot({
    path: path.join(OUT, 'phone-vp-04-claims-notfiled.png'),
    fullPage: false,
  })

  await browser.close()
  console.log('Saved screenshots to', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
