import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'

const ROUTES = [
  '#/overview',
  '#/report',
  '#/products',
  '#/shipments',
  '#/expenses',
  '#/inventory',
  '#/cash',
  '#/payables',
  '#/payout',
  '#/sources',
]

async function overflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement
    const main = document.querySelector('main')
    return {
      page: root.scrollWidth > root.clientWidth + 1,
      main: main ? main.scrollWidth > main.clientWidth + 1 : false,
    }
  })
}

async function waitMain(page) {
  await page.waitForSelector('#main', { timeout: 15000 })
  await page.waitForFunction(() => window.__portal, { timeout: 15000 })
  await page.waitForTimeout(200)
}

async function closeDrawer(page) {
  const open = await page.evaluate(() => !document.getElementById('drawerWrap').hidden)
  if (!open) return
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
}

async function tapVisible(page, selector, taps, fails, opts = {}) {
  const loc = page.locator(selector)
  const n = await loc.count()
  for (let i = 0; i < n; i++) {
    const item = loc.nth(i)
    if (!(await item.isVisible())) continue
    const before = await page.evaluate(() => location.hash)
    const href = opts.readHref ? await item.getAttribute('href') : null
    try {
      await item.click({ timeout: 8000 })
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => location.hash)
      const drawer = await page.evaluate(() => !document.getElementById('drawerWrap').hidden)
      const sameOk = opts.allowSame && href && href === before
      if (!sameOk && after === before && !drawer) {
        fails.push(`dead tap ${selector}[${i}] on ${before}`)
      }
      taps.count++
      if (drawer && opts.closeDrawer) await closeDrawer(page)
    } catch (e) {
      fails.push(`click ${selector}[${i}] on ${before}: ${e.message}`)
    }
  }
}

async function exerciseRoute(page, route, width, taps, fails) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await waitMain(page)
  await closeDrawer(page)
  const ov = await overflow(page)
  if (ov.page || ov.main) {
    fails.push(`overflow ${width}px on ${route} (page=${ov.page} main=${ov.main})`)
  }

  if (route === '#/overview') {
    await tapVisible(page, 'a.ov-box', taps, fails, { readHref: true })
    await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
    await waitMain(page)
    if (width === 390) {
      await tapVisible(page, 'a.mob-panel-link', taps, fails, { readHref: true })
      await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
      await waitMain(page)
      await tapVisible(page, '.ov-prod-list a', taps, fails, { readHref: true })
      await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
      await waitMain(page)
      await tapVisible(page, 'section.card.panel.mob-sec a.note', taps, fails, { readHref: true })
    } else {
      await tapVisible(page, 'a.block-card', taps, fails, { readHref: true })
      await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
      await waitMain(page)
      await tapVisible(page, 'tr.click.tap-row', taps, fails, { closeDrawer: true })
    }
  } else if (route === '#/cash') {
    await tapVisible(page, 'a.kv-row', taps, fails, { readHref: true, allowSame: true })
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await waitMain(page)
    await tapVisible(page, 'a.stat-dd-link', taps, fails, { readHref: true })
  } else if (route === '#/payout') {
    await tapVisible(page, 'a.back-bar', taps, fails, { readHref: true })
  } else if (route === '#/products') {
    await tapVisible(page, 'a.prod-card', taps, fails, { readHref: true, closeDrawer: true })
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await waitMain(page)
    await tapVisible(page, 'tr[data-go]', taps, fails, { closeDrawer: true })
  } else if (route === '#/shipments') {
    await tapVisible(page, 'a.ship-card', taps, fails, { readHref: true, closeDrawer: true })
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await waitMain(page)
    await closeDrawer(page)
    await tapVisible(page, 'a.claim-card', taps, fails, {
      readHref: true,
      closeDrawer: true,
      allowSame: true,
    })
  } else {
    await tapVisible(page, 'tr[data-go]', taps, fails, { closeDrawer: true })
  }
}

async function exerciseNav(page, width, taps, fails) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await waitMain(page)
  if (width === 390) {
    await tapVisible(page, '#mobTabs a[href^="#"]', taps, fails, { readHref: true, allowSame: true })
    await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
    await waitMain(page)
    const more = page.locator('#mobMoreBtn')
    if (await more.isVisible()) {
      await more.click()
      await page.waitForTimeout(250)
      await tapVisible(page, '#mobMorePanel a[href^="#"]', taps, fails, { readHref: true })
    }
  } else {
    await tapVisible(page, '.nav a[href^="#"]', taps, fails, { readHref: true, allowSame: true })
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome',
  })
  const page = await browser.newPage()
  const taps = { count: 0 }
  const fails = []

  for (const width of [390, 1440]) {
    for (const route of ROUTES) {
      await exerciseRoute(page, route, width, taps, fails)
    }
    await exerciseNav(page, width, taps, fails)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await waitMain(page)
  await page.locator('.ov-prod-list a').first().click({ force: true })
  await page.waitForTimeout(400)
  const drawer = await page.evaluate(() => !document.getElementById('drawerWrap').hidden)
  if (!drawer) fails.push('product drawer from overview')
  else {
    taps.count++
    await page.locator('a.back-bar').click()
    await page.waitForTimeout(300)
    taps.count++
    const hash = await page.evaluate(() => location.hash)
    if (hash !== '#/overview') fails.push(`product drawer back expected #/overview got ${hash}`)
  }

  console.log(`TAP_COUNT ${taps.count}`)
  if (fails.length) {
    fails.forEach((f) => console.error(`FAIL ${f}`))
    await browser.close()
    process.exit(1)
  }
  console.log('OK all taps')
  await browser.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
