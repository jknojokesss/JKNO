import { chromium, webkit, devices } from 'playwright'
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
      invCost: (() => {
        const snap = P.invCostSnapshot()
        const rows = P.invCostRows()
        const overlap = P.stuckClaimOverlap()
        const rowSum = rows.reduce(
          (o, r) => {
            o.units += r.available + r.inbound + r.reserved + r.stuck
            o.cents += r.atCost
            o.stuck += r.stuck
            o.stuckCents += r.stuck * r.cost
            o.inbound += r.inbound
            return o
          },
          { units: 0, cents: 0, stuck: 0, stuckCents: 0, inbound: 0 },
        )
        const bucketCents =
          snap.availableCents + snap.inboundCents + snap.reservedCents + snap.stuckCents
        const stuckParts =
          snap.stuckParts.unfulfillable +
          snap.stuckParts.researching +
          snap.stuckParts.stranded
        return {
          snap,
          rowSum,
          overlap,
          bucketCents,
          stuckParts,
          bsInventory: bs.assets.inventory,
        }
      })(),
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

  const ic = r.invCost
  const invChecks = [
    ['invCostTotal', ic.snap.totalCents, EXPECT.inventory],
    ['invCostBuckets', ic.bucketCents, EXPECT.inventory],
    ['invCostBs', ic.snap.totalCents, ic.bsInventory],
    ['invCostRowSum', ic.rowSum.cents, EXPECT.inventory],
    ['invInboundUnits', ic.snap.inbound, 1561],
    ['invStuckParts', ic.stuckParts, ic.snap.stuck],
    ['invStuckCents', ic.snap.stuckCents, ic.rowSum.stuckCents],
    ['invStuckOverlapUnits', ic.overlap.units, 26],
    ['invStuckOverlapCents', ic.overlap.cents, 16465],
  ]
  for (const [name, got, exp] of invChecks) {
    if (got !== exp) {
      console.error(`FAIL ${name}: got ${got}, expected ${exp}`)
      ok = false
    } else console.log(`OK ${name}: ${got}`)
  }
  console.log(
    'Inventory at cost buckets (units / cents):',
    `avail ${ic.snap.available}/${ic.snap.availableCents}`,
    `inbound ${ic.snap.inbound}/${ic.snap.inboundCents}`,
    `reserved ${ic.snap.reserved}/${ic.snap.reservedCents}`,
    `stuck ${ic.snap.stuck}/${ic.snap.stuckCents}`,
  )

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

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
  const scrapeKpis = async () => {
    await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.ov-kpi-grid', { timeout: 15000 })
    return page.evaluate(() => {
      const o = {}
      document.querySelectorAll('a.ov-box').forEach((b) => {
        const lbl = b.querySelector('.ov-box-lbl')?.textContent?.trim()
        const val = b.querySelector('.ov-box-val')?.textContent?.trim()
        if (lbl) o[lbl] = val
      })
      return o
    })
  }
  const statVal = async (route, label) => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    return page.evaluate((lbl) => {
      for (const dt of document.querySelectorAll('.stat-grid dt')) {
        if (dt.textContent.trim() === lbl) {
          const dd = dt.nextElementSibling
          if (!dd) return null
          const link = dd.querySelector('a.stat-dd-link') || dd.querySelector('a') || dd
          const clone = link.cloneNode(true)
          clone.querySelectorAll('small').forEach((s) => s.remove())
          return clone.textContent.replace(/\s+/g, ' ').trim()
        }
      }
      const inv = document.querySelector('.inv-total strong')
      if (lbl === 'Inventory at cost' && inv) return inv.textContent.trim()
      return null
    }, label)
  }

  const kpis = await scrapeKpis()
  const ovCount = Object.keys(kpis).length
  if (ovCount !== 4) {
    console.error(`FAIL overview KPI count: ${ovCount} boxes (expected 4)`)
    ok = false
  } else console.log('OK overview KPI count: 4')

  const cross = [
    ['True net', '#/report', null, moneyDisplay(r.net), null],
    ['Sales', '#/products', null, moneyDisplay(r.sales), null],
    ['Cash', '#/cash', 'Cash on hand', moneyDisplay(r.cash), moneyDisplay(r.cash)],
    ['Next payout', '#/payout', 'Next payout', moneyDisplay(r.payout), moneyDisplay(r.payout)],
  ]

  const pageOnly = [
    ['Total liabilities', '#/payables', 'Total liabilities', moneyDisplay(r.liabTotal)],
    ['Inventory at cost', '#/inventory', 'Inventory at cost', moneyDisplay(r.inventory, 1)],
    ['Claims potential', '#/shipments', 'Potential', moneyDisplay(r.claimPotential)],
  ]

  function moneyDisplay(cents, dec) {
    const neg = cents < 0
    const v = Math.abs(cents) / 100
    const s =
      dec === 1
        ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : Math.round(v).toLocaleString('en-US')
    return (neg ? '-$' : '$') + s
  }

  for (const [lbl, route, statLbl, ovExpected, pageExpected] of cross) {
    const ov = norm(kpis[lbl])
    if (ovExpected != null) {
      if (ov !== ovExpected) {
        console.error(`FAIL overview.${lbl}: got "${ov}", expected "${ovExpected}"`)
        ok = false
      } else console.log(`OK overview.${lbl}: ${ov}`)
    }
    if (statLbl && pageExpected != null) {
      const pg = norm(await statVal(route, statLbl))
      if (pg !== pageExpected) {
        console.error(`FAIL page${route} ${statLbl}: got "${pg}", expected "${pageExpected}"`)
        ok = false
      } else console.log(`OK page${route} ${statLbl}: ${pg}`)
      if (ovExpected != null && ov !== pg) {
        console.error(`FAIL crossPage ${lbl}: overview "${ov}" vs page "${pg}"`)
        ok = false
      } else console.log(`OK crossPage ${lbl}`)
    }
  }

  for (const [name, route, statLbl, expected] of pageOnly) {
    const pg = norm(await statVal(route, statLbl))
    if (pg !== expected) {
      console.error(`FAIL pageOnly ${name}: got "${pg}", expected "${expected}"`)
      ok = false
    } else console.log(`OK pageOnly ${name}: ${pg}`)
  }

  const layoutFails = await runLayoutAudits(page, BASE)
  if (layoutFails.length) {
    layoutFails.forEach((f) => console.error(`FAIL layout chromium: ${f}`))
    ok = false
  } else console.log('OK layout chromium: empty cards + overflow at 360/390/430/1280/1440/1920')

  await browser.close()

  const iPhone14 = devices['iPhone 14']
  const wb = await webkit.launch({ headless: true })
  const wctx = await wb.newContext({ ...iPhone14, locale: 'en-US' })
  const wp = await wctx.newPage()
  const wLayout = await runLayoutAudits(wp, BASE)
  if (wLayout.length) {
    wLayout.forEach((f) => console.error(`FAIL layout webkit: ${f}`))
    ok = false
  } else console.log('OK layout webkit iPhone14: empty cards + overflow')
  await wb.close()

  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
