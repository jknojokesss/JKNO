import { chromium } from 'playwright'

const BASE = 'http://localhost:3456/aufschnitt'
const TABS = ['Overview', 'P&L', 'Sales by channel', 'Stock', 'Owed by stores']

async function metrics(page) {
  return page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    badCells: [...document.querySelectorAll('td, th, .au-pnl-num')].filter((el) => el.scrollWidth > el.clientWidth + 1).length,
  }))
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const results = []

for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  for (const tab of TABS) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await page.waitForTimeout(350)
    const m = await metrics(page)
    results.push({ w, tab, view: 'main', ...m, overflow: m.scrollW > m.clientW })

    const clickables = page.locator('button.au-click:visible, tr.au-click:visible').first()
    if (await clickables.count()) {
      await clickables.click()
      await page.waitForTimeout(300)
      const d = await metrics(page)
      results.push({ w, tab, view: 'detail', ...d, overflow: d.scrollW > d.clientW })
      const back = page.getByRole('button', { name: '← Back' })
      if (await back.count()) await back.click()
    }
  }
  if (w === 390) {
    await page.getByRole('button', { name: 'Overview', exact: true }).click()
    for (const pill of ["Abraham's", 'Essiccata']) {
      await page.getByRole('button', { name: pill, exact: true }).click()
      await page.waitForTimeout(200)
      const m = await metrics(page)
      results.push({ w, tab: `pill ${pill}`, view: 'main', ...m, overflow: m.scrollW > m.clientW })
    }
  }
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
const fails = results.filter((r) => r.overflow || (r.w === 390 && r.badCells > 0))
console.log('FAILURES', JSON.stringify(fails))
console.log('fails', fails.length)
if (fails.length) process.exit(1)
