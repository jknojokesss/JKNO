/*
 * Full Jerky Munch owner dashboard — every tab at desktop + mobile (E2E mock data).
 */
const { chromium } = require('playwright')

const BASE = process.env.E2E_BASE || 'http://localhost:3111'
const CHROME = process.env.E2E_CHROME || undefined

const OWNER_TABS = [
  'Overview',
  'Consignment',
  'Invoice Stores',
  'Advertising',
  'Financials',
  'Import expenses',
  'QuickBooks sync',
]

let passed = 0
const failed = []
const check = (msg, ok) => {
  if (ok) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg) }
  else { failed.push(msg); console.log('  \x1b[31m✗ ' + msg + '\x1b[0m') }
}

async function dropOverlay(page) {
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
}

async function waitReady(page) {
  await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await dropOverlay(page)
  await page.waitForSelector('button.jm-navbtn', { timeout: 15000 })
}

async function openTab(page, label) {
  await page.locator('button.jm-navbtn', { hasText: label }).click()
  await page.waitForTimeout(500)
}

async function assertTabHealthy(page, tag, label) {
  const main = page.locator('.jm-main')
  const text = await main.innerText()
  check(`${tag} ${label}: no NaN/Infinity`, !/NaN|Infinity/.test(text))
  check(`${tag} ${label}: no undefined`, !/\bundefined\b/i.test(text))
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth > el.clientWidth + 2
  })
  check(`${tag} ${label}: no horizontal overflow`, !overflow)
}

async function runViewport(browser, viewport, tag) {
  const page = await browser.newPage({ viewport })
  await waitReady(page)

  for (const label of OWNER_TABS) {
    await openTab(page, label)
    await assertTabHealthy(page, tag, label)
  }

  await openTab(page, 'Consignment')
  check(`${tag}: invoice-type store not on consignment tab`, await page.locator('.jm-consign').getByText('E2E Invoice Store').count() === 0)
  const partnersKpi = page.locator('.jm-consign').getByText('Partners', { exact: true }).locator('xpath=..')
  check(`${tag}: consignment partners KPI is 3`, /\b3\b/.test(await partnersKpi.innerText()))

  await openTab(page, 'Invoice Stores')
  check(`${tag}: invoice store listed`, await page.getByText('E2E Invoice Store').count() >= 1)

  await openTab(page, 'Advertising')
  check(`${tag}: zero-spend ad channel shows without NaN`, !/NaN/.test(await page.locator('.jm-main').innerText()))

  await page.close()
}

async function main() {
  const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})
  await runViewport(browser, { width: 1280, height: 900 }, 'Desktop')
  await runViewport(browser, { width: 390, height: 844 }, 'Mobile')
  await browser.close()

  console.log(`\n${passed} passed, ${failed.length} failed`)
  if (failed.length) {
    failed.forEach(f => console.log('  - ' + f))
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
