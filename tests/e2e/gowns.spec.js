/*
 * Gown shop smoke tests — the flows Pessi and Medina actually touch.
 *
 * Why this file exists: the Catalog once shipped with a company field that
 * could not accept a company. The dropdown only listed companies already in
 * the catalog, so on an empty catalog there was nothing to pick and no way to
 * type. `next build` was green the whole time; a real shop found it in
 * production. Every test here runs against an EMPTY database for that reason —
 * the client's screen is usually emptier than the developer's.
 *
 * Run with:  npm run test:e2e
 */
const { chromium } = require('playwright')

const BASE = process.env.E2E_BASE || 'http://localhost:3111'
const CHROME = process.env.E2E_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

let passed = 0, failed = []
const check = (msg, ok) => {
  if (ok) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg) }
  else { failed.push(msg); console.log('  \x1b[31m✗ ' + msg + '\x1b[0m') }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME })
  // Her phone, not a desktop.
  const page = await browser.newPage({ viewport: { width: 420, height: 940 } })
  await page.goto(BASE + '/gowns', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  // Next's dev error overlay swallows clicks.
  const dropOverlay = () => page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
  await dropOverlay()

  console.log('\nOwner — order list')
  let body = await page.textContent('body')
  check('order book renders for the owner', /Order Book/.test(body))
  check('one "+ New Order" button, no order-kind buttons',
    /\+ New Order/.test(body) && !/New Customer Order|New Stock Order/.test(body))
  check('tab reads "Alterations", not "Tasks"', /Alterations \(/.test(body) && !/Tasks \(/.test(body))
  check('empty list explains itself instead of showing a blank page',
    /No orders yet|Nothing here right now/.test(body))

  console.log('\nAlterations tab — empty')
  await page.locator('button', { hasText: /^Alterations \(/ }).first().click()
  await page.waitForTimeout(600)
  body = await page.textContent('body')
  check('empty state is friendly, not blank', /All caught up|No alterations waiting/.test(body))
  check('no leftover standalone-task box', !/What needs to get done/.test(body))

  console.log('\nOrder form — empty catalog (the bug that shipped)')
  await page.locator('button', { hasText: /^Open \(/ }).first().click()
  await page.waitForTimeout(400)
  await dropOverlay()
  await page.locator('button.gw-new-btn').first().click()
  await page.waitForTimeout(900)

  const company = page.locator('input[list="gown-companies"]').first()
  check('company field is present on an order line', await company.count() > 0)
  check('company field is a typeable input, not a dead dropdown',
    await company.evaluate(el => el.tagName === 'INPUT' && !el.disabled && !el.readOnly))
  await company.click()
  await company.type('Morilee')
  await page.waitForTimeout(200)
  check('a NEW company can be typed with an empty catalog', (await company.inputValue()) === 'Morilee')
  await company.evaluate(el => el.blur())
  await page.waitForTimeout(300)
  check('the typed company survives blur', (await company.inputValue()).toLowerCase() === 'morilee')

  const type = page.locator('select[title="Stock or custom order"]').first()
  check('Stock/Custom column sits on the line', await type.count() > 0)
  const opts = await type.locator('option').allTextContents()
  check('it offers both Stock and Custom', opts.includes('Stock') && opts.includes('Custom'))
  await type.selectOption('Custom')
  check('the choice sticks', (await type.inputValue()) === 'Custom')

  console.log('\nOrder form — money and layout')
  body = await page.textContent('body')
  check('payment type reads "CC Card"', /CC Card/.test(body))
  check('no credit-card-number field is asked for', !/card number|cc number|card #/i.test(body))
  check('Save is reachable at the top of the form',
    await page.locator('button', { hasText: /^Save/ }).first().isVisible())
  check('every line column stays readable (grid scrolls, not crushed)',
    await page.locator('.gw-itemscroll').first().count() > 0)
  const descBox = await page.locator('input[placeholder="Style, color, details…"]').first().boundingBox()
  // 40px "fits" but nobody can read a gown description in it — hold a real bar.
  check(`description keeps a writable width (${descBox ? Math.round(descBox.width) : 0}px, want >=90)`,
    !!descBox && descBox.width >= 90)

  console.log('\nSeamstress — workroom')
  await page.goto(BASE + '/gowns?role=seamstress', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  check('seamstress route loads without crashing', /LEW Imports/.test(await page.textContent('body')))

  await browser.close()

  console.log(`\n${passed} passed, ${failed.length} failed`)
  if (failed.length) { failed.forEach(f => console.log('  FAILED: ' + f)); process.exit(1) }
}

main().catch(e => { console.error('\nharness error:', e.message); process.exit(1) })
