import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__portal, { timeout: 15000 })

  const r = await page.evaluate(() => {
    const P = window.__portal
    const ab = P.rangeAB()
    const o = P.full(ab[0], ab[1])
    return {
      sales: o.sales,
      amzProfit: o.amzProfit,
      other: o.other,
      net: o.net,
      netMarginPct: Math.round(o.netMargin * 1000) / 10,
      inv: P.invValue(P.NDAYS - 1),
      cash: P.cashAt(P.NDAYS - 1).cash,
    }
  })

  const expect = {
    sales: 4291853,
    amzProfit: 1254540,
    other: 562001,
    net: 692539,
    netMarginPct: 16.1,
  }

  let ok = true
  for (const [k, v] of Object.entries(expect)) {
    if (r[k] !== v) {
      console.error(`FAIL ${k}: got ${r[k]}, expected ${v}`)
      ok = false
    } else console.log(`OK ${k}: ${r[k]}`)
  }
  console.log('Inventory value:', r.inv, 'Cash:', r.cash)
  await browser.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
