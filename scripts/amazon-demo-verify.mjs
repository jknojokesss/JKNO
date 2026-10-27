import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'

const EXPECT = {
  sales: 4291853,
  amzProfit: 1254540,
  other: 562001,
  net: 692539,
  netMarginPct: 16.1,
  claimPending: 35379,
  claimNotfiled: 9895,
  claimReimbursed: 84243,
  cash: 11958961,
  inventory: 7595540,
  payout: 4061517,
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome',
  })
  const page = await browser.newPage()
  await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__portal, { timeout: 15000 })

  const r = await page.evaluate(() => {
    const P = window.__portal
    const ab = P.rangeAB()
    const o = P.full(ab[0], ab[1])
    const ct = P.claimTotals()
    const bd = P.breakdownSum(o)
    const sec = P.liabSections()
    const due = P.liabDueIn30()
    const bs = P.balanceSheetSnap()
    const ap = window.PORTAL_DATA.liabilities.accountsPayable
    const agingSum =
      ap.aging.current + ap.aging.d1_30 + ap.aging.d31_60 + ap.aging.d60plus
    const sectionSum = sec.ap + sec.cc + sec.loans + sec.tax + sec.payroll
    const last = P.NDAYS - 1
    return {
      sales: o.sales,
      amzProfit: o.amzProfit,
      other: o.other,
      net: o.net,
      netMarginPct: Math.round(o.netMargin * 1000) / 10,
      breakdownSum: bd,
      inventory: P.invValue(P.NDAYS - 1),
      cash: P.cashAt(P.NDAYS - 1).cash,
      payout: window.PORTAL_DATA.settlements.at(-1).amount,
      claimPending: ct.pending,
      claimNotfiled: ct.notfiled,
      claimReimbursed: ct.reimbursed,
      claimPotential: ct.potential,
      shipCount: P.SHIPS.length,
      liabTotal: sec.total,
      liabSectionSum: sectionSum,
      apAgingSum: agingSum,
      apTotal: sec.ap,
      dueIn30: due.total,
      duePartsSum: due.ap + due.cc + due.loans + due.tax + due.payroll,
      bsAssets: bs.assets.total,
      bsLiab: bs.liabilities,
      bsEquity: bs.equity,
      bsBalanced: bs.assets.total === bs.liabilities + bs.equity,
      amexCash: P.cashAt(last).amex,
      amexBs: bs.amex,
    }
  })

  let ok = true
  for (const [k, v] of Object.entries(EXPECT)) {
    if (r[k] !== v) {
      console.error(`FAIL ${k}: got ${r[k]}, expected ${v}`)
      ok = false
    } else console.log(`OK ${k}: ${r[k]}`)
  }

  if (r.breakdownSum !== r.sales) {
    console.error(`FAIL breakdownSum: got ${r.breakdownSum}, expected sales ${r.sales}`)
    ok = false
  } else console.log(`OK breakdownSum: ${r.breakdownSum} (= sales)`)

  if (r.claimPotential !== r.claimPending + r.claimNotfiled) {
    console.error(
      `FAIL claimPotential: got ${r.claimPotential}, expected ${r.claimPending + r.claimNotfiled}`,
    )
    ok = false
  } else console.log(`OK claimPotential: ${r.claimPotential}`)

  const checks = [
    ['apAgingSum', r.apAgingSum, r.apTotal],
    ['liabSections', r.liabSectionSum, r.liabTotal],
    ['dueIn30', r.dueIn30, r.duePartsSum],
    ['balanceSheet', r.bsAssets, r.bsLiab + r.bsEquity],
    ['amexTie', r.amexCash, r.amexBs],
  ]
  for (const [name, got, exp] of checks) {
    if (got !== exp) {
      console.error(`FAIL ${name}: got ${got}, expected ${exp}`)
      ok = false
    } else console.log(`OK ${name}: ${got}`)
  }

  if (!r.bsBalanced) {
    console.error('FAIL bsBalanced: assets != liabilities + equity')
    ok = false
  } else console.log('OK bsBalanced')

  console.log(
    'Inventory value:',
    r.inventory,
    'Cash:',
    r.cash,
    'Liabilities:',
    r.liabTotal,
    'Shipments:',
    r.shipCount,
  )
  await browser.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
