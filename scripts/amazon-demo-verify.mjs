import { chromium } from 'playwright'
import { runLayoutAudits } from './amazon-demo-layout-audit.mjs'

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

const EXPECT_AGING = {
  current: 3938000,
  d1_30: 770000,
  d31_60: 150000,
  d60plus: 0,
}

const EXPECT_FIN = {
  amex: 41200,
  ink: 47800,
  amazonLoan: 105600,
  loc: 31700,
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
    const aging = P.apAgingFromBills()
    const fin = P.liabFinanceCharges()
    const apBills = window.PORTAL_DATA.liabilities.accountsPayable.bills
    const asOf = P.liabApAsOf()
    const last = P.NDAYS - 1
    const perBill = apBills.map((b) => {
      const di = Math.round(
        (Date.parse(b.dueDate) - Date.parse(window.PORTAL_DATA.start)) / 86400000,
      )
      const dp = asOf - di
      return { vendor: b.vendor, amount: b.amount, daysPast: dp, bucket: P.apBillBucket(dp) }
    })
    const fromBills = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 }
    perBill.forEach((b) => {
      fromBills[b.bucket] += b.amount
    })
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
      payoutBreakdownNet: P.settlementBreakdown().net,
      claimPending: ct.pending,
      claimNotfiled: ct.notfiled,
      claimReimbursed: ct.reimbursed,
      claimPotential: ct.potential,
      shipCount: P.SHIPS.length,
      liabTotal: sec.total,
      liabSectionSum: sec.ap + sec.cc + sec.loans + sec.tax + sec.payroll,
      apBillTotal: P.liabApBillTotal(),
      apTotal: sec.ap,
      dueIn30: due.total,
      duePartsSum: due.ap + due.cc + due.loans + due.tax + due.payroll,
      bsAssets: bs.assets.total,
      bsLiab: bs.liabilities,
      bsEquity: bs.equity,
      bsReserve: bs.assets.reserve,
      bsBalanced: bs.assets.total === bs.liabilities + bs.equity,
      amexCash: P.cashAt(last).amex,
      amexBs: bs.amex,
      amexLiabCard: P.liabSections().cc,
      aging,
      fromBills,
      perBill,
      fin,
      expFinTotal: P.EXP.filter((e) => e.cat === 'Interest & finance charges').reduce(
        (t, e) => t + e.amt,
        0,
      ),
    }
  })

  let ok = true
  for (const [k, v] of Object.entries(EXPECT)) {
    if (r[k] !== v) {
      console.error(`FAIL ${k}: got ${r[k]}, expected ${v}`)
      ok = false
    } else console.log(`OK ${k}: ${v}`)
  }

  for (const [k, v] of Object.entries(EXPECT_AGING)) {
    if (r.aging[k] !== v) {
      console.error(`FAIL aging.${k}: got ${r.aging[k]}, expected ${v}`)
      ok = false
    } else console.log(`OK aging.${k}: ${v}`)
  }

  for (const [k, v] of Object.entries(EXPECT_FIN)) {
    if (r.fin[k] !== v) {
      console.error(`FAIL fin.${k}: got ${r.fin[k]}, expected ${v}`)
      ok = false
    } else console.log(`OK fin.${k}: ${v}`)
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
    ['apBillTotal', r.apBillTotal, r.apTotal],
    ['liabSections', r.liabSectionSum, r.liabTotal],
    ['dueIn30', r.dueIn30, r.duePartsSum],
    ['balanceSheet', r.bsAssets, r.bsLiab + r.bsEquity],
    ['amexTie', r.amexCash, r.amexBs],
    ['amexCcSection', r.amexCash, r.amexLiabCard - 156780],
    ['agingSum', r.aging.current + r.aging.d1_30 + r.aging.d31_60 + r.aging.d60plus, r.apTotal],
    ['agingFromBills', JSON.stringify(r.fromBills), JSON.stringify(r.aging)],
    ['finTotal', r.fin.total, r.expFinTotal],
    ['payoutTie', r.payoutBreakdownNet, r.payout],
    ['bsReserve', r.bsReserve, r.payout],
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

  console.log(`OK billBuckets: ${r.perBill.length} bills`)
  r.perBill.forEach((b) => console.log(`  ${b.vendor}: ${b.amount} (${b.daysPast}d → ${b.bucket})`))

  console.log(
    'Inventory:',
    r.inventory,
    'Cash:',
    r.cash,
    'Liabilities:',
    r.liabTotal,
    'Due30:',
    r.dueIn30,
  )

  const layoutFails = await runLayoutAudits(page, BASE)
  if (layoutFails.length) {
    layoutFails.forEach((f) => console.error(`FAIL layout: ${f}`))
    ok = false
  } else console.log('OK layout: empty cards + overflow at 390/1280/1440/1920')

  await browser.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
