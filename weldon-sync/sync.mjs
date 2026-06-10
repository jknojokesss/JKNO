// Weldon → Supabase nightly sync.
//
// READ-ONLY on Weldon: logs in, reads the order-history pages, never clicks
// buy/cancel/anything that changes the account. Writes only to our own
// weldon_orders table (new web_ids only — never overwrites a row we already
// have, so manual cost corrections are safe).
//
// Runs in GitHub Actions (see ../.github/workflows/weldon-sync.yml).

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import WebSocketImpl from 'ws'

// supabase-js initializes a realtime client on createClient() that requires a
// global WebSocket constructor. We only use the database here (never realtime),
// but the check still runs at init — polyfill it so this works on any Node
// version (Node < 22 has no native WebSocket).
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl

const { WELDON_USER, WELDON_PASS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
for (const [k, v] of Object.entries({ WELDON_USER, WELDON_PASS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!v) { console.error(`Missing required env var: ${k}`); process.exit(1) }
}

const BASE = 'https://www.weldontire.net/productcart/pc'
const LOGIN_URL = `${BASE}/_com_login.asp`
const PAGES = [
  `${BASE}/_com_orderhistory.asp?show=invoiced&months=6`,
  `${BASE}/_com_orderhistory.asp?show=open&months=3`,
]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---- the same row parser I use by hand, run inside the page ----
function extractRowsInPage() {
  const rows = [...document.querySelectorAll('tr')]
  const sizeRe = /(\d{3})[\s\/\\-]+(\d{2})[\s\/\\-]*[A-Za-z]{0,3}(\d{2})/i
  const toIso = (s) => {
    const m = (s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    return m ? `${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}` : null
  }
  const out = []
  for (const tr of rows) {
    const cells = [...tr.cells].map((c) => (c.innerText || '').trim().replace(/\s+/g, ' '))
    if (cells.length < 6) continue
    const m = (cells[0] || '').match(/^(13\d{6})$/)
    if (!m) continue
    const web_id = m[1]
    const order_date = toIso(cells[1])
    const qty = parseInt((cells[2] || '').replace(/[^0-9]/g, ''), 10) || null
    const desc = cells[3] || ''
    const sm = desc.match(sizeRe)
    const size = sm ? `${sm[1]}/${sm[2]}/${sm[3]}` : null
    let brand = desc.replace(/^Item:\s*\S+\s*/i, '')
    if (sm) brand = brand.slice(0, brand.indexOf(sm[0]))
    brand = brand.replace(/\s+/g, ' ').trim()
    const unit_cost = parseFloat((cells[4] || '').replace(/[^0-9.]/g, '')) || null
    const status = cells[6] || ''
    const im = status.match(/Invoiced:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    const invoiced_date = im ? toIso(im[0]) : null
    const link = tr.querySelector('a[href*="orderdetail"]')
    const detail_href = link ? link.getAttribute('href') : null
    out.push({ web_id, order_date, invoiced_date, size, qty, unit_cost, description: brand, detail_href })
  }
  return out
}

// When the list view leaves the cost column blank (happens on some cash
// orders), read it off the order-detail page: unit cost = Price per tire,
// falling back to line Total ÷ qty.
function extractCostFromDetailPage(qty) {
  const text = document.body.innerText.replace(/\r/g, '')
  const dollars = (text.match(/\$[\d,]+(?:\.\d{2})?/g) || [])
    .map((s) => parseFloat(s.replace(/[^0-9.]/g, '')))
    .filter((n) => n > 0)
  if (!dollars.length) return null
  // The line row shows "... Price Total"; the smaller of the last two is the
  // per-tire price. If only a total is present, divide by qty.
  const lastTwo = dollars.slice(-2)
  if (lastTwo.length === 2) return Math.min(lastTwo[0], lastTwo[1])
  return qty ? +(lastTwo[0] / qty).toFixed(2) : lastTwo[0]
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  try {
    // ---- log in ----
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
    const passInput = page.locator('input[type="password"]').first()
    await passInput.waitFor({ state: 'visible', timeout: 20000 })
    const form = page.locator('form', { has: page.locator('input[type="password"]') }).first()
    const userInput = form.locator('input[type="email"], input[type="text"]').first()
    await userInput.fill(WELDON_USER)
    await passInput.fill(WELDON_PASS)
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {}),
      form.locator('input[type="submit"], button[type="submit"], button').first().click(),
    ])

    // Verify we're actually logged in (login form should be gone).
    if (await page.locator('input[type="password"]').count()) {
      throw new Error('Login appears to have failed — password field still present. Check WELDON_USER / WELDON_PASS.')
    }

    // ---- scrape both history views ----
    const byWebId = new Map()
    for (const url of PAGES) {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
      const rows = await page.evaluate(extractRowsInPage)
      for (const r of rows) if (!byWebId.has(r.web_id)) byWebId.set(r.web_id, r)
    }
    let scraped = [...byWebId.values()]
    console.log(`Scraped ${scraped.length} order rows from Weldon.`)

    // ---- only keep ones we don't already have ----
    const ids = scraped.map((r) => r.web_id)
    const { data: existing, error: exErr } = await supabase
      .from('weldon_orders').select('web_id').in('web_id', ids)
    if (exErr) throw new Error(`Supabase read failed: ${exErr.message}`)
    const have = new Set((existing || []).map((r) => r.web_id))
    let fresh = scraped.filter((r) => !have.has(r.web_id))
    console.log(`${fresh.length} are new (not already on file).`)

    if (!fresh.length) {
      console.log('Nothing new — done.')
      return
    }

    // ---- fill blank costs from the order-detail page ----
    for (const r of fresh) {
      if (r.unit_cost == null && r.detail_href) {
        const detailUrl = r.detail_href.startsWith('http') ? r.detail_href : `${BASE}/${r.detail_href.replace(/^\/?(productcart\/pc\/)?/, '')}`
        try {
          await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 45000 })
          r.unit_cost = await page.evaluate(extractCostFromDetailPage, r.qty)
          console.log(`  filled cost for ${r.web_id} from detail page: ${r.unit_cost}`)
        } catch (e) {
          console.warn(`  could not read detail page for ${r.web_id}: ${e.message}`)
        }
      }
    }

    // ---- insert (strip the helper field; never overwrite existing rows) ----
    const toInsert = fresh.map(({ detail_href, ...row }) => row)
    const { error: insErr } = await supabase.from('weldon_orders').insert(toInsert)
    if (insErr) throw new Error(`Supabase insert failed: ${insErr.message}`)

    console.log(`Inserted ${toInsert.length} new Weldon orders:`)
    for (const r of toInsert) {
      console.log(`  ${r.order_date}  ${r.web_id}  ${r.size}  x${r.qty}  $${r.unit_cost}  ${r.description}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
