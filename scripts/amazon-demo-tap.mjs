import { chromium, webkit, devices } from 'playwright'
import { runLayoutAudits, LAYOUT_ROUTES } from './amazon-demo-layout-audit.mjs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'
const CHROME =
  process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome'

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

const RANGES = ['week', 'last', 'mtd', 'custom']

function attachQualityHooks(page, bucket) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const t = msg.text()
    if (/favicon|fonts\.(googleapis|gstatic)/i.test(t)) return
    const loc = msg.location()?.url || ''
    if (/favicon\.ico/i.test(loc)) return
    bucket.consoleErrors.push(t)
  })
  page.on('pageerror', (err) => bucket.consoleErrors.push(String(err)))
  page.on('requestfailed', (req) => {
    const u = req.url()
    if (u.startsWith('data:') || u.includes('chrome-extension') || u.includes('favicon')) return
    bucket.failedRequests.push(`${req.failure()?.errorText || 'failed'} ${u}`)
  })
  page.on('response', (res) => {
    const u = res.url()
    const local = u.includes('127.0.0.1') || u.includes('localhost') || u.includes('jknojokes.com')
    if (local && res.status() >= 400 && !u.includes('favicon')) {
      bucket.badResponses.push(`${res.status()} ${u}`)
    }
  })
}

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

async function badText(page) {
  return page.evaluate(() => {
    const t = (document.body.innerText || '').toLowerCase()
    const bad = []
    if (/\bnan\b/.test(t)) bad.push('NaN in body text')
    if (/\bundefined\b/.test(t)) bad.push('undefined in body text')
    document.querySelectorAll('.ov-box-val, .stat-grid dd, .kpi .val, .inv-total strong').forEach((el) => {
      const x = (el.textContent || '').trim()
      if (x === '$0' && el.closest('a[href="#/cash"]')) return
      if (x === '$0' && el.textContent === '$0') {
        /* allowed in some empty states only on non-KPI */
      }
    })
    const chart = document.querySelector('svg.chart')
    if (chart && !chart.querySelector('rect.bar, path.lineA, circle.ptA') && document.querySelector('.ov-sec-h, .panel-h h2')) {
      const onOverview = location.hash.includes('overview')
      if (onOverview && !document.querySelector('.empty')) bad.push('empty chart on overview')
    }
    return bad
  })
}

async function smallTapTargets(page) {
  return page.evaluate(() => {
    const fails = []
    const sel =
      'a.ov-box, a.ov-sec-item, a.ov-low-item, button.show-more, .mob-tabs a, .mob-tabs button, .chip, .seg button, a.note.tap-card, .back-bar, a.kv-row.tap-card, tr.tap-row, a.brand-home'
    document.querySelectorAll(sel).forEach((el) => {
      if (!el.offsetParent) return
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      if (w < 40 || h < 40) {
        const label = el.textContent?.trim().slice(0, 24) || el.className
        fails.push(`tap target <40px: "${label}" (${w}×${h})`)
      }
    })
    return fails
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

async function directLoads(page, fails, productSkus) {
  for (const hash of ROUTES) {
    await page.goto(`${BASE}${hash}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    const main = await page.$('#main')
    if (!main) fails.push(`direct load missing #main ${hash}`)
  }
  for (const sku of productSkus) {
    await page.goto(`${BASE}#/products/${encodeURIComponent(sku)}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    const open = await page.evaluate(() => !document.getElementById('drawerWrap').hidden)
    if (!open) fails.push(`direct load product drawer ${sku}`)
    await closeDrawer(page)
  }
}

async function exerciseRanges(page, fails) {
  await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
  await waitMain(page)
  for (const r of RANGES) {
    await page.locator(`button[data-range="${r}"]`).click()
    await page.waitForTimeout(350)
    const bad = await badText(page)
    bad.forEach((b) => fails.push(`range ${r} overview: ${b}`))
  }
  for (const route of ['#/products', '#/expenses']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    for (const r of RANGES) {
      await page.locator(`button[data-range="${r}"]`).click()
      await page.waitForTimeout(350)
      const bad = await badText(page)
      bad.forEach((b) => fails.push(`range ${r} ${route}: ${b}`))
    }
  }
}

async function exerciseMobExpand(page, fails) {
  await page.setViewportSize({ width: 390, height: 844 })
  const routes = [
    ['#/products', 'button[data-prod-all="1"]', 'Show all products'],
    ['#/payables', 'button[data-expand="payMoreExpand"]', 'payables expand'],
    ['#/shipments', 'button[data-expand="shipExpand"]', 'shipments expand'],
    ['#/expenses', 'button[data-expand="expExpand"]', 'expenses expand'],
    ['#/inventory', 'button[data-expand="invExpand"]', 'inventory expand'],
    ['#/cash', 'button[data-expand="cashExpand"]', 'cash expand'],
    ['#/report', 'button[data-expand="repExpand"]', 'report expand'],
    ['#/overview', 'button[data-expand="ovLowExpand"]', 'running low expand'],
  ]
  for (const [route, sel, label] of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    const btn = page.locator(sel)
    if ((await btn.count()) === 0) continue
    if (!(await btn.first().isVisible())) continue
    await btn.first().click()
    await page.waitForTimeout(250)
    if (sel.includes('data-prod-all')) {
      const cards = await page.locator('a.prod-card').count()
      if (cards <= 5) fails.push(`mob expand ${label}: expected >5 product cards`)
    } else {
      const expanded = await page.locator(sel).first().getAttribute('aria-expanded')
      if (expanded !== 'true') fails.push(`mob expand ${label}: aria-expanded not true`)
    }
  }
  await page.goto(`${BASE}#/products`, { waitUntil: 'load', timeout: 60000 })
  await waitMain(page)
  const prodBtn = page.locator('button[data-prod-all="1"]')
  if ((await prodBtn.count()) && (await prodBtn.first().isVisible())) {
    await prodBtn.first().click()
    await page.waitForTimeout(250)
    await page.locator('button[data-range="mtd"]').click()
    await page.waitForTimeout(350)
    const cards = await page.locator('a.prod-card').count()
    if (cards <= 5) fails.push('mob expand products: collapsed after range change')
  }
}

async function exerciseBrandHome(page, width, taps, fails) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 })
  const sel =
    width <= 640 ? 'a.brand-home[href="#/overview"]' : 'a.brand[href="#/overview"]'
  for (const route of ['#/inventory', '#/payables', '#/products']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await closeDrawer(page)
    const link = page.locator(sel).first()
    if (!(await link.isVisible())) {
      fails.push(`brand home not visible ${width}px on ${route}`)
      continue
    }
    const r = await link.boundingBox()
    if (width <= 640 && r && (r.height < 44 || r.width < 44)) {
      fails.push(`brand home tap target ${width}px on ${route}: ${Math.round(r.width)}×${Math.round(r.height)}`)
    }
    try {
      await link.click({ timeout: 8000 })
      await page.waitForTimeout(350)
      taps.count++
    } catch (e) {
      fails.push(`brand home click ${route}: ${e.message}`)
      continue
    }
    const hash = await page.evaluate(() => location.hash)
    const title = await page.evaluate(() => document.getElementById('pageTitle')?.textContent?.trim())
    if (!hash.includes('overview')) fails.push(`brand home ${route} hash ${hash}`)
    if (title !== 'Overview') fails.push(`brand home ${route} title "${title}"`)
  }
}

async function exerciseHistory(page, fails) {
  await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
  await waitMain(page)
  await page.locator('a.ov-box[href="#/cash"]').click()
  await page.waitForTimeout(300)
  await page.goBack()
  await page.waitForTimeout(400)
  const h1 = await page.evaluate(() => location.hash)
  if (!h1.includes('overview')) fails.push(`back from cash expected overview got ${h1}`)
  await page.goForward()
  await page.waitForTimeout(400)
  const h2 = await page.evaluate(() => location.hash)
  if (!h2.includes('cash')) fails.push(`forward expected cash got ${h2}`)
}

async function exerciseRoute(page, route, width, taps, fails) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 })
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
  await waitMain(page)
  await closeDrawer(page)
  const ov = await overflow(page)
  if (ov.page || ov.main) {
    fails.push(`overflow ${width}px on ${route} (page=${ov.page} main=${ov.main})`)
  }
  const bad = await badText(page)
  bad.forEach((b) => fails.push(`${width}px ${route}: ${b}`))

  if (width <= 430) {
    const small = await smallTapTargets(page)
    small.slice(0, 5).forEach((s) => fails.push(`${width}px ${route}: ${s}`))
  }

  if (route === '#/overview') {
    await tapVisible(page, 'a.ov-box', taps, fails, { readHref: true })
    await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await tapVisible(page, 'a.ov-sec-item', taps, fails, { readHref: true })
    await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await tapVisible(page, 'a.ov-low-item', taps, fails, { readHref: true, closeDrawer: true })
    await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await closeDrawer(page)
    if (width <= 430) {
      await tapVisible(page, 'a.mob-panel-link', taps, fails, { readHref: true, closeDrawer: true })
      await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
      await waitMain(page)
      await closeDrawer(page)
      await tapVisible(page, '.ov-prod-list a', taps, fails, { readHref: true, closeDrawer: true })
    } else {
      await tapVisible(page, 'section.card.panel.sec tr.click.tap-row', taps, fails, { closeDrawer: true })
    }
  } else if (route === '#/products') {
    await tapVisible(page, 'a.prod-card', taps, fails, { readHref: true, closeDrawer: true })
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await tapVisible(page, 'tr[data-go]', taps, fails, { closeDrawer: true })
  } else if (route === '#/shipments') {
    await tapVisible(page, 'a.ship-card', taps, fails, { readHref: true, closeDrawer: true })
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
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

async function runBrowser(name, launch, contextOpts, productSkus) {
  const browser = await launch()
  const context = await browser.newContext(contextOpts)
  const page = await context.newPage()
  const quality = { consoleErrors: [], failedRequests: [], badResponses: [] }
  attachQualityHooks(page, quality)
  const taps = { count: 0 }
  const fails = []

  console.log(`\n=== ${name} ===`)

  await directLoads(page, fails, productSkus)
  await exerciseRanges(page, fails)
  await exerciseHistory(page, fails)
  if (name.includes('iPhone')) await exerciseMobExpand(page, fails)

  const widths = name.includes('iPhone') ? [390] : [390, 1440]
  for (const width of widths) {
    await exerciseBrandHome(page, width, taps, fails)
  }

  for (const width of widths) {
    for (const route of ROUTES) {
      await exerciseRoute(page, route, width, taps, fails)
    }
  }

  if (name.includes('iPhone')) {
    await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
    await waitMain(page)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(150)
    const covered = await page.evaluate(() => {
      const tabs = document.querySelector('.mob-tabs')
      if (!tabs) return true
      const tr = tabs.getBoundingClientRect()
      let maxBottom = 0
      document.querySelectorAll('main > *, .foot').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height > 0) maxBottom = Math.max(maxBottom, r.bottom)
      })
      return maxBottom <= tr.top + 4
    })
    if (!covered) fails.push('iPhone: bottom bar covers main content')
  }

  const layoutFails = await runLayoutAudits(page, BASE)
  layoutFails.forEach((f) => fails.push(`layout ${f}`))

  if (quality.consoleErrors.length) {
    quality.consoleErrors.forEach((e) => fails.push(`console: ${e}`))
  }
  if (quality.failedRequests.length) {
    quality.failedRequests.forEach((e) => fails.push(`request: ${e}`))
  }
  if (quality.badResponses.length) {
    quality.badResponses.forEach((e) => fails.push(`http: ${e}`))
  }

  console.log(`${name} TAP_COUNT ${taps.count}`)
  if (fails.length) {
    fails.forEach((f) => console.error(`${name} FAIL ${f}`))
  } else {
    console.log(`${name} OK all taps`)
  }

  await browser.close()
  return fails.length === 0
}

async function main() {
  const productSkus = await (async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
    })
    const page = await browser.newPage()
    await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
    await page.waitForFunction(() => window.__portal)
    const skus = await page.evaluate(() => window.PORTAL_DATA.skus.map((s) => s.sku))
    await browser.close()
    return skus
  })()

  const okChrome = await runBrowser(
    'chromium',
    () => chromium.launch({ headless: true, executablePath: CHROME }),
    {},
    productSkus,
  )

  const iPhone14 = devices['iPhone 14']
  const okWebkit = await runBrowser(
    'webkit-iPhone14',
    () => webkit.launch({ headless: true }),
    { ...iPhone14, locale: 'en-US' },
    productSkus,
  )

  process.exit(okChrome && okWebkit ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
