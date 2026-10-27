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

  const stock = await page.evaluate(() => {
    const P = window.__portal
    const rows = P.stockLeftRows()
    let avail = 0
    let inbound = 0
    const per = rows.map((r) => {
      const pace = P.dailyPace4w(r.k)
      const expDays =
        pace > 0 ? Math.round(r.available / pace) : r.available > 0 ? 9999 : 0
      const expStatus = P.stockStatus(expDays, r.available, pace)
      avail += r.available
      inbound += r.inbound
      return {
        sku: r.sku,
        available: r.available,
        inbound: r.inbound,
        pace: Math.round(pace * 100) / 100,
        daysLeft: r.daysLeft,
        expDays,
        status: r.status,
        expStatus,
      }
    })
    const snap = P.invCostSnapshot()
    return {
      totalAvailable: avail,
      totalInbound: inbound,
      snapAvail: snap.available,
      snapInbound: snap.inbound,
      per,
    }
  })

  if (stock.totalAvailable !== 10808) {
    console.error(`FAIL stockTotal.available: got ${stock.totalAvailable}, expected 10808`)
    ok = false
  } else console.log('OK stockTotal.available: 10808')
  if (stock.totalInbound !== 1561) {
    console.error(`FAIL stockTotal.inbound: got ${stock.totalInbound}, expected 1561`)
    ok = false
  } else console.log('OK stockTotal.inbound: 1561')
  if (stock.snapAvail !== stock.totalAvailable) {
    console.error(
      `FAIL stockSnapAvail: sum ${stock.totalAvailable} vs snap ${stock.snapAvail}`,
    )
    ok = false
  } else console.log(`OK stockSnapAvail: ${stock.totalAvailable}`)
  if (stock.snapInbound !== stock.totalInbound) {
    console.error(
      `FAIL stockSnapInbound: sum ${stock.totalInbound} vs snap ${stock.snapInbound}`,
    )
    ok = false
  } else console.log(`OK stockSnapInbound: ${stock.totalInbound}`)

  console.log('Stock left by SKU (available / inbound / pace / days / status):')
  let stockMathOk = true
  for (const row of stock.per) {
    if (row.daysLeft !== row.expDays) {
      console.error(
        `FAIL stockDays.${row.sku}: got ${row.daysLeft}, expected ${row.expDays} (pace ${row.pace})`,
      )
      ok = false
      stockMathOk = false
    }
    if (row.status !== row.expStatus) {
      console.error(`FAIL stockStatus.${row.sku}: got ${row.status}, expected ${row.expStatus}`)
      ok = false
      stockMathOk = false
    }
    console.log(
      `  ${row.sku}: ${row.available} / ${row.inbound} / ~${row.pace}/d / ${row.daysLeft}d / ${row.status}`,
    )
  }
  if (stockMathOk) console.log('OK stockDays math: all SKUs')

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
  function moneyDisplay(cents, dec) {
    const neg = cents < 0
    const v = Math.abs(cents) / 100
    const s =
      dec === 1
        ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : Math.round(v).toLocaleString('en-US')
    return (neg ? '-$' : '$') + s
  }

  const scrapeOverview = async () => {
    await page.goto(`${BASE}#/overview`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.ov-kpi-grid', { timeout: 15000 })
    return page.evaluate(() => {
      const o = { boxes: {}, line: {}, due30: null }
      document.querySelectorAll('a.ov-box').forEach((b) => {
        const lbl = b.querySelector('.ov-box-lbl')?.textContent?.trim()
        const val = b.querySelector('.ov-box-val')?.textContent?.trim()
        if (lbl) o.boxes[lbl] = val
        const meta = b.querySelector('.ov-box-meta')?.textContent || ''
        const m = meta.match(/Due 30d\s+\$[\d,]+/)
        if (m && lbl === 'What you owe') o.due30 = m[0].replace('Due 30d ', '').trim()
      })
      document.querySelectorAll('a.ov-sec-item').forEach((b) => {
        const lbl = b.querySelector('.ov-sec-lbl')?.textContent?.trim()
        const val = b.querySelector('.ov-sec-val')?.textContent?.trim()
        if (lbl) o.line[lbl] = val
      })
      return o
    })
  }
  const pageFigure = async (route, kind) => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    return page.evaluate((k) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
      for (const dt of document.querySelectorAll('.stat-grid dt')) {
        if (dt.textContent.trim() === k.statLbl) {
          const dd = dt.nextElementSibling
          if (!dd) return null
          const link = dd.querySelector('a.stat-dd-link') || dd.querySelector('a') || dd
          const clone = link.cloneNode(true)
          clone.querySelectorAll('small').forEach((s) => s.remove())
          return norm(clone.textContent)
        }
      }
      if (k.kind === 'trueNet') {
        for (const div of document.querySelectorAll('.rep-kpis div')) {
          const sp = div.querySelector('span')
          if (sp?.textContent?.trim() === 'True net profit') {
            return norm(div.querySelector('strong')?.textContent)
          }
        }
      }
      if (k.kind === 'sales') {
        const P = window.__portal
        const ab = P.rangeAB()
        const o = P.full(ab[0], ab[1])
        const v = Math.abs(o.sales) / 100
        const s = Math.round(v).toLocaleString('en-US')
        return (o.sales < 0 ? '-$' : '$') + s
      }
      if (k.kind === 'inventory') {
        const inv = document.querySelector('.inv-total strong')
        if (inv) return norm(inv.textContent)
      }
      return null
    }, kind)
  }

  const ov = await scrapeOverview()
  const boxCount = Object.keys(ov.boxes).length
  const lineCount = Object.keys(ov.line).length
  if (boxCount !== 4) {
    console.error(`FAIL overview KPI count: ${boxCount} boxes (expected 4)`)
    ok = false
  } else console.log('OK overview KPI count: 4')
  if (lineCount !== 3) {
    console.error(`FAIL overview secondary count: ${lineCount} items (expected 3)`)
    ok = false
  } else console.log('OK overview secondary count: 3')

  const due30Expected = moneyDisplay(r.dueIn30)
  if (norm(ov.due30) !== due30Expected) {
    console.error(`FAIL overview Due 30d subline: got "${ov.due30}", expected "${due30Expected}"`)
    ok = false
  } else console.log(`OK overview Due 30d subline: ${due30Expected}`)

  const crossSeven = [
    {
      name: 'True net',
      ovKey: 'boxes',
      lbl: 'True net',
      route: '#/report',
      dataCents: r.net,
      page: { kind: 'trueNet', statLbl: '' },
      pageWhole: true,
    },
    {
      name: 'Sales',
      ovKey: 'boxes',
      lbl: 'Sales',
      route: '#/products',
      dataCents: r.sales,
      page: { kind: 'sales', statLbl: '' },
      pageWhole: true,
    },
    {
      name: 'Cash',
      ovKey: 'boxes',
      lbl: 'Cash',
      route: '#/cash',
      dataCents: r.cash,
      page: { kind: 'stat', statLbl: 'Cash on hand' },
      pageWhole: true,
    },
    {
      name: 'What you owe',
      ovKey: 'boxes',
      lbl: 'What you owe',
      route: '#/payables',
      dataCents: r.liabTotal,
      page: { kind: 'stat', statLbl: 'Total liabilities' },
      pageWhole: true,
    },
    {
      name: 'Next payout',
      ovKey: 'line',
      lbl: 'Next payout',
      route: '#/payout',
      dataCents: r.payout,
      page: { kind: 'stat', statLbl: 'Next payout' },
      pageWhole: true,
    },
    {
      name: 'Inventory at cost',
      ovKey: 'line',
      lbl: 'Inventory at cost',
      route: '#/inventory',
      dataCents: r.inventory,
      page: { kind: 'inventory', statLbl: 'Inventory at cost' },
      pageWhole: false,
    },
    {
      name: 'Claims',
      ovKey: 'line',
      lbl: 'Claims',
      route: '#/shipments',
      dataCents: r.claimPotential,
      page: { kind: 'stat', statLbl: 'Potential claims' },
      pageWhole: true,
    },
  ]

  for (const item of crossSeven) {
    const src = item.ovKey === 'boxes' ? ov.boxes : ov.line
    const ovVal = norm(src[item.lbl])
    const dataExp = moneyDisplay(item.dataCents)
    if (ovVal !== dataExp) {
      console.error(`FAIL overview.${item.name}: got "${ovVal}", expected "${dataExp}"`)
      ok = false
    } else console.log(`OK overview.${item.name}: ${ovVal}`)

    const pg = norm(await pageFigure(item.route, item.page))
    const pageExp = item.pageWhole
      ? moneyDisplay(item.dataCents)
      : moneyDisplay(item.dataCents, 1)
    if (pg !== pageExp) {
      console.error(`FAIL page${item.route} ${item.name}: got "${pg}", expected "${pageExp}"`)
      ok = false
    } else console.log(`OK page${item.route} ${item.name}: ${pg}`)

    const ovCompare = item.pageWhole ? ovVal : moneyDisplay(item.dataCents)
    const pgCompare = item.pageWhole ? pg : moneyDisplay(item.dataCents)
    if (ovCompare !== pgCompare) {
      console.error(`FAIL crossPage ${item.name}: overview "${ovCompare}" vs page "${pgCompare}"`)
      ok = false
    } else console.log(`OK crossPage ${item.name}`)
  }

  const PROSE_ROUTES = [
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
  for (const route of PROSE_ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#main', { timeout: 15000 })
    const proseFails = await page.evaluate(() => {
      const fails = []
      const body = document.body.innerText || ''
      if (/About even/i.test(body)) fails.push('About even')
      const sel = '#main .fin-note, #main .conn .meta, #main .rep-notes li, #main .ov-low-empty, #main .inv-bs-tie'
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('table')) return
        if (el.closest('.sum-hero, .ov-low-sec, .stat-grid, .blist')) return
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
        if (!t || t.length < 20) return
        t.split(/(?<=[.!?])\s+/).forEach((sentence) => {
          const s = sentence.trim()
          if (!s) return
          const words = s.split(/\s+/).filter(Boolean)
          if (words.length > 12) fails.push(`${location.hash}: ${words.length}w — ${s.slice(0, 72)}`)
        })
      })
      return fails
    })
    if (proseFails.length) {
      proseFails.forEach((f) => console.error(`FAIL prose ${f}`))
      ok = false
    }
  }
  if (ok) console.log('OK prose: no About even; no >12-word sentences outside tables')

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
