import { chromium } from 'playwright'

const BASE = 'http://localhost:3457/aufschnitt'
const WIDTHS = [390, 768, 1440]
const TABS = [
  ['overview', 'Overview', 'Overview'],
  ['pnl', 'P&L', 'P&L'],
  ['channels', 'Sales by channel', 'Channels'],
  ['stock', 'Stock', 'Stock'],
  ['profit', 'Profit per order', 'Profit'],
]

async function metrics(page) {
  return page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    badCells: [...document.querySelectorAll('td, th, .au-pnl-num, .au-ch-amt, .au-ch-pct')].filter(
      (el) => el.scrollWidth > el.clientWidth + 1
    ).length,
  }))
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const results = []

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const useShort = w <= 860

  for (const [id, long, short] of TABS) {
    await page.locator(`.au-nav--main button[data-tab="${id}"]`).evaluate((el) => el.click())
    await page.waitForTimeout(300)
    const m = await metrics(page)
    results.push({ w, tab: long, view: 'main', ...m, overflow: m.scrollW > m.clientW })

    if (id === 'pnl') {
      for (const pill of ['All brands', "Abraham's", 'Essiccata']) {
        await page.getByRole('button', { name: pill, exact: true }).click()
        await page.waitForTimeout(120)
        for (let mi = 0; mi < 6; mi++) {
          await page.locator('select').selectOption({ index: mi })
          await page.waitForTimeout(60)
          const pm = await metrics(page)
          results.push({ w, tab: `P&L ${pill} m${mi}`, ...pm, overflow: pm.scrollW > pm.clientW })
        }
      }
    }

    const click = page.locator('main button.au-click:visible, main tr.au-click:visible, main .au-ch-row:visible').first()
    if (await click.count()) {
      await click.click()
      await page.waitForTimeout(250)
      const d = await metrics(page)
      results.push({ w, tab: long, view: 'detail', ...d, overflow: d.scrollW > d.clientW })
      await page.getByRole('button', { name: 'Back' }).click()
      await page.waitForTimeout(200)
    }
  }

  if (w === 390) {
    const navBtns = await page.locator('.au-nav--main .au-navbtn').count()
    const navScroll = await page.evaluate(() => document.querySelector('.au-nav--main')?.scrollWidth)
    results.push({ w, tab: 'nav', count: navBtns, navScroll })
  }
  await page.close()
}

const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.locator('.au-nav--main button[data-tab="stock"]').click()
await page.locator('th button', { hasText: 'Wks' }).click()
const sortBefore = await page.locator('th button', { hasText: 'Wks' }).textContent()
await page.locator('main tr.au-click').first().click()
await page.getByRole('button', { name: 'Back' }).click()
const sortAfter = await page.locator('th button', { hasText: 'Wks' }).textContent()
results.push({ test: 'stock-back-sort', ok: sortBefore === sortAfter, sortBefore, sortAfter })

await page.locator('.au-nav--main button[data-tab="channels"]').click()
await page.locator('main button.au-click').first().click()
await page.getByRole('button', { name: 'Back' }).click()
const channelsActive = await page
  .locator('.au-nav--main')
  .locator('button[data-tab="channels"]')
  .evaluate((el) => getComputedStyle(el).boxShadow.includes('inset'))
results.push({ test: 'channel-back-tab', channelsActive })

await browser.close()

console.log(JSON.stringify(results.filter((r) => r.overflow || r.badCells > 0), null, 2))
const fails = results.filter((r) => r.overflow || (r.badCells > 0 && r.w))
const backFails = results.filter((r) => r.test && (r.ok === false || r.channelsActive === false))
console.log('layout fails', fails.length, 'back fails', backFails.length)
if (fails.length || backFails.length) process.exit(1)
