import { chromium } from 'playwright'

const BASE = 'http://localhost:3457/aufschnitt'
const WIDTHS = [390, 768, 1440]
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const fails = []

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.locator('button[data-tab="pnl"]').evaluate((el) => el.click())
  await page.waitForTimeout(400)
  for (const pill of ['All brands', "Abraham's", 'Essiccata']) {
    if (pill !== 'All brands') await page.locator('.au-pill', { hasText: pill }).first().click({ force: true })
    for (let mi = 0; mi < 6; mi++) {
      await page.locator('select').selectOption({ index: mi })
      await page.waitForTimeout(50)
      const bad = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth
        const cw = document.documentElement.clientWidth
        const cells = [...document.querySelectorAll('.au-pnl-num')].filter((el) => el.scrollWidth > el.clientWidth + 1)
        return { sw, cw, overflow: sw > cw, bad: cells.length }
      })
      if (bad.overflow || bad.bad) fails.push({ w, pill, mi, ...bad })
    }
  }
  await page.close()
}
await browser.close()
console.log(JSON.stringify(fails, null, 2))
console.log('pnl clip fails', fails.length)
if (fails.length) process.exit(1)
