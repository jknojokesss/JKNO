/*
 * Jerky Munch consignment store tab — inputs must keep focus while typing.
 * Runs against NEXT_PUBLIC_E2E mock stores (no Supabase).
 */
const { chromium } = require('playwright')

const BASE = process.env.E2E_BASE || 'http://localhost:3111'
const CHROME = process.env.E2E_CHROME || undefined

let passed = 0
const failed = []
const check = (msg, ok) => {
  if (ok) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg) }
  else { failed.push(msg); console.log('  \x1b[31m✗ ' + msg + '\x1b[0m') }
}

async function dropOverlay(page) {
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()))
}

async function openConsignStore(scope, page, storeName) {
  await page.locator('button', { hasText: /^Consignment$/ }).click()
  await page.waitForTimeout(400)
  await scope.getByText(storeName).first().click()
  await page.waitForTimeout(500)
}

/** Type digit-by-digit; fail if focus leaves the field before the string is complete. */
async function typeDigitsKeepingFocus(page, input, target, label) {
  await input.click()
  await input.fill('')
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    await input.press(ch)
    const focused = await input.evaluate(el => document.activeElement === el)
    check(`${label}: focus after "${target.slice(0, i + 1)}"`, focused)
  }
  check(`${label}: full value "${target}"`, (await input.inputValue()) === target)
  for (let i = 0; i < target.length; i++) {
    await input.press('Backspace')
    const focused = await input.evaluate(el => document.activeElement === el)
    check(`${label}: focus after backspace ${i + 1}`, focused)
  }
  check(`${label}: empty after backspaces`, (await input.inputValue()) === '')
  await input.fill(target)
  check(`${label}: value after retype "${target}"`, (await input.inputValue()) === target)
}

async function runViewport(browser, viewport, tag) {
  const page = await browser.newPage({ viewport })
  await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await dropOverlay(page)

  console.log(`\n${tag} — open consignment store panel`)
  const scope = page.locator('.jm-consign')
  await openConsignStore(scope, page, 'E2E Active Store')

  console.log(`\n${tag} — visit date`)
  const visitDate = scope.getByLabel('Visit date')
  await visitDate.click()
  check('Visit date: focus on click', await visitDate.evaluate(el => document.activeElement === el))
  await visitDate.fill('2026-08-20')
  check('Visit date: value after fill', (await visitDate.inputValue()) === '2026-08-20')

  console.log(`\n${tag} — active store fields`)
  await scope.locator('[data-testid="consign-chip-drop-e2e-active"]').click()
  await page.waitForTimeout(200)
  await typeDigitsKeepingFocus(page, scope.getByLabel('Pieces added'), '125', 'Drop-off pieces')

  await scope.locator('[data-testid="consign-chip-pay-e2e-active"]').click()
  await page.waitForTimeout(200)
  await typeDigitsKeepingFocus(page, scope.getByLabel('Check amount $'), '4.50', 'Check amount')

  await scope.locator('[data-testid="consign-chip-pickup-e2e-active"]').click()
  await page.waitForTimeout(200)
  await typeDigitsKeepingFocus(page, scope.getByLabel('Pieces picked up'), '125', 'Pickup pieces')

  await scope.locator('summary', { hasText: /Store settings/i }).click()
  await page.waitForTimeout(200)
  const priceInput = scope.locator('[data-testid="consign-price-e2e-active"]')
  await priceInput.click()
  await priceInput.fill('')
  for (const ch of '4.50') {
    await priceInput.press(ch)
    check(`Price per bag: focus after "${ch}"`, await priceInput.evaluate(el => document.activeElement === el))
  }
  const priceVal = await priceInput.inputValue()
  const priceNum = parseFloat(String(priceVal).replace(/[^0-9.]/g, ''))
  check('Price per bag: holds typed value', Math.abs(priceNum - 4.5) < 0.01)

  await scope.locator('[data-testid="consign-chip-count-e2e-active"]').click()
  await page.waitForTimeout(200)
  const shelfCount = scope.getByLabel('Bags on shelf')
  await typeDigitsKeepingFocus(page, shelfCount, '125', 'Shelf count')

  const firstCard = page.locator('.jm-consign').getByText('E2E First Visit').first()
  await firstCard.click()
  await page.waitForTimeout(400)

  console.log(`\n${tag} — first-visit starting count`)
  await scope.locator('[data-testid="consign-chip-count-e2e-first"]').click()
  await page.waitForTimeout(200)
  await typeDigitsKeepingFocus(page, scope.getByLabel('Pieces on shelf (starting count)'), '125', 'Starting count')

  await page.close()
}

async function testRenameStoreRules(page, tag) {
  console.log(`\n${tag} — rename store visibility and validation`)
  await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await dropOverlay(page)
  const scope = page.locator('.jm-consign')
  await openConsignStore(scope, page, 'E2E Linked QB Store')
  await scope.locator('summary', { hasText: /Store settings/i }).click()
  await page.waitForTimeout(200)
  check(`${tag}: QB-linked store hides Rename`, await page.locator('[data-testid="consign-rename-e2e-linked"]').count() === 0)
  await scope.getByText('E2E Active Store').click()
  await page.waitForTimeout(400)
  await scope.locator('summary', { hasText: /Store settings/i }).click()
  await page.waitForTimeout(200)
  check(`${tag}: unlinked store shows Rename`, await page.locator('[data-testid="consign-rename-e2e-active"]').count() === 1)
  await page.locator('[data-testid="consign-rename-e2e-active"]').click()
  await page.waitForTimeout(200)
  const nameInput = page.locator('[data-testid="consign-rename-dialog"] input').first()
  await nameInput.fill('   ')
  await page.getByRole('button', { name: 'Save name' }).click()
  check(`${tag}: blank name blocked`, /cannot be blank/.test(await page.locator('[data-testid="consign-rename-dialog"]').textContent()))
  await nameInput.fill('E2E First Visit')
  await page.getByRole('button', { name: 'Save name' }).click()
  check(`${tag}: duplicate name blocked`, /already uses that name/.test(await page.locator('[data-testid="consign-rename-dialog"]').textContent()))
}

async function testDoubleSubmitDrop(page, tag) {
  console.log(`\n${tag} — double-submit guard on visit save`)
  await page.goto(BASE + '/jerky-munch', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await dropOverlay(page)
  const scope = page.locator('.jm-consign')
  await openConsignStore(scope, page, 'E2E First Visit')
  await scope.locator('[data-testid="consign-chip-drop-e2e-first"]').click()
  await scope.getByLabel('Pieces added').fill('42')
  const saveBtn = scope.locator('[data-testid="consign-log-visit-e2e-first"]')
  await saveBtn.dblclick({ delay: 30 })
  await page.waitForTimeout(1200)
  const sentLine = await scope.locator('[data-testid="consign-sent-e2e-first"]').textContent()
  check(`${tag}: one drop-off saved (42 sent, not 84)`, /dropped off 42\b/.test(sentLine || ''))
}

async function main() {
  const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})
  await runViewport(browser, { width: 1280, height: 900 }, 'Desktop')
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await testDoubleSubmitDrop(page, 'Desktop')
  await testRenameStoreRules(page, 'Desktop')
  await page.close()
  await runViewport(browser, { width: 390, height: 844 }, 'Mobile')
  await browser.close()

  console.log(`\n${passed} passed, ${failed.length} failed`)
  if (failed.length) {
    failed.forEach(f => console.log('  - ' + f))
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
