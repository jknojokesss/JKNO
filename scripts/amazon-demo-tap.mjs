import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'

const FLOWS = [
  {
    name: 'overview-kpi-payout',
    width: 390,
    steps: [
      { hash: '#/overview', click: 'a.ov-box[href="#/payout"]', expectHash: '#/payout' },
      { click: 'a.back-bar', expectHash: '#/overview' },
    ],
  },
  {
    name: 'overview-kpi-payables-mob',
    width: 390,
    steps: [
      { hash: '#/overview', scroll: true, click: 'a[href="#/payables"].tap-card', expectHash: '#/payables' },
    ],
  },
  {
    name: 'cash-bs-payables',
    width: 1440,
    steps: [
      { hash: '#/cash', click: 'a.kv-row[href="#/payables"]', expectHash: '#/payables' },
      { hash: '#/cash', click: 'a.stat-dd-link[href="#/payout"]', expectHash: '#/payout' },
    ],
  },
  {
    name: 'product-drawer',
    width: 390,
    steps: [
      { hash: '#/products', click: 'a.prod-card', expectDrawer: true },
      { click: 'a.back-bar', expectHash: '#/products' },
    ],
  },
]

async function runFlow(page, flow) {
  await page.setViewportSize({ width: flow.width, height: flow.width === 390 ? 844 : 900 })
  for (const step of flow.steps) {
    if (step.hash) {
      await page.goto(`${BASE}${step.hash}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('#main', { timeout: 15000 })
    }
    if (step.scroll) await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    if (step.click) {
      const sel = step.click
      await page.waitForSelector(sel, { timeout: 10000 })
      await page.click(sel)
      await page.waitForTimeout(400)
    }
    if (step.expectHash) {
      const h = await page.evaluate(() => location.hash)
      if (h !== step.expectHash) {
        return { ok: false, detail: `expected hash ${step.expectHash}, got ${h}` }
      }
    }
    if (step.expectDrawer) {
      const open = await page.evaluate(() => !document.getElementById('drawerWrap').hidden)
      if (!open) return { ok: false, detail: 'drawer did not open' }
    }
  }
  return { ok: true }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome',
  })
  const page = await browser.newPage()
  let ok = true
  for (const flow of FLOWS) {
    const r = await runFlow(page, flow)
    if (r.ok) console.log(`OK tap ${flow.name}`)
    else {
      console.error(`FAIL tap ${flow.name}: ${r.detail}`)
      ok = false
    }
  }
  await browser.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
