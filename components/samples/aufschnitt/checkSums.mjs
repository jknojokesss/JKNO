import DATA from './aufschnittData.js'
import { AS_OF, BRANDS, CHANNELS, MONTHS, COGS_LINES, SHARED_OPEX, STORE_ACCOUNTS } from './aufschnittCatalog.js'

const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const daysBetween = (a, b) => {
  const da = new Date(`${a}T12:00:00.000Z`)
  const db = new Date(`${b}T12:00:00.000Z`)
  return Math.round((db - da) / 86400000)
}
const bucketFromDpd = (dpd) => {
  if (dpd === 0) return 'current'
  if (dpd <= 30) return 'd1_30'
  if (dpd <= 60) return 'd31_60'
  if (dpd <= 90) return 'd61_90'
  return 'd90p'
}

const roundCents = (n) => Math.round(n * 100) / 100
const sum = (arr, fn = (x) => x) => roundCents(arr.reduce((s, x) => s + fn(x), 0))

let errors = 0
const ok = (label, cond) => {
  if (!cond) {
    console.error('FAIL:', label)
    errors++
  } else {
    console.log('OK:', label)
  }
}

MONTHS.forEach((m) => {
  const combined = DATA.pnlViews['All brands'].find((p) => p.month === m.id)
  const brandSum = sum(BRANDS.map((b) => DATA.pnlViews[b].find((p) => p.month === m.id).revenue_total))
  ok(`P&L revenue ${m.id} brands=combined`, brandSum === combined.revenue_total)

  CHANNELS.forEach((ch) => {
    const chSum = sum(
      BRANDS.map((b) => DATA.pnlViews[b].find((p) => p.month === m.id).revenue[ch])
    )
    ok(`P&L ${m.id} ${ch}`, chSum === combined.revenue[ch])
  })

  const salesCh = sum(
    DATA.salesRows.filter((r) => r.month === m.id),
    (r) => r.revenue
  )
  ok(`Sales rows ${m.id}=combined revenue`, salesCh === combined.revenue_total)

  COGS_LINES.forEach((line) => {
    const bs = sum(
      BRANDS.map((b) => DATA.pnlViews[b].find((p) => p.month === m.id).cogs_entries.find((e) => e.l === line).n)
    )
    const c = combined.cogs_entries.find((e) => e.l === line).n
    ok(`COGS ${m.id} ${line}`, bs === c)
  })

  SHARED_OPEX.forEach((line) => {
    const bs = sum(
      BRANDS.map((b) => DATA.pnlViews[b].find((p) => p.month === m.id).operating_expenses_entries.find((e) => e.l === line).n)
    )
    const c = combined.operating_expenses_entries.find((e) => e.l === line).n
    ok(`Opex shared ${m.id} ${line}`, bs === c)
  })

  ok(
    `Gross ${m.id}`,
    combined.gross_profit === roundCents(combined.revenue_total - combined.cogs)
  )
  ok(
    `Net ${m.id}`,
    combined.net_profit === roundCents(combined.gross_profit - combined.operating_expenses_total)
  )
})

const sepBrandRev = {}
BRANDS.forEach((b) => {
  sepBrandRev[b] = DATA.pnlViews[b].find((x) => x.month === '2026-09').revenue_total
})
const seenSku = new Set()
DATA.salesRows
  .filter((r) => r.month === '2026-09')
  .forEach((r) => {
    const key = `${r.brand}:${r.productId}`
    if (seenSku.has(key)) return
    seenSku.add(key)
    const byProd = sum(
      DATA.salesRows.filter((x) => x.month === '2026-09' && x.brand === r.brand && x.productId === r.productId),
      (x) => x.revenue
    )
    ok(`SKU cap ${r.productId}`, byProd <= sepBrandRev[r.brand] * 0.1801 + 0.02)
  })

const ar = DATA.receivables
ok('AR total 90-100k', ar.targetTotal >= 90_000 && ar.targetTotal <= 100_000)
ok('AR accounts=total', sum(ar.accounts, (a) => a.buckets.total) === ar.targetTotal)
const bucketSum = sum(ar.accounts, (a) => a.buckets.current + a.buckets.d1_30 + a.buckets.d31_60 + a.buckets.d61_90 + a.buckets.d90p)
ok('AR buckets=total', bucketSum === ar.targetTotal)
ar.accounts.forEach((a) => {
  const invSum = sum(ar.invoices.filter((i) => i.account === a.name), (i) => i.amount)
  ok(`Invoices ${a.name}`, invSum === a.buckets.total)
  ok(`AR size ${a.name}`, a.buckets.total >= 900 && a.buckets.total <= 14_200)
})
const fullyCurrent = ar.accounts.filter(
  (a) => a.buckets.d1_30 === 0 && a.buckets.d31_60 === 0 && a.buckets.d61_90 === 0 && a.buckets.d90p === 0
)
ok('AR 5 fully current', fullyCurrent.length === 5)
ok('AR 31-60 count', ar.accounts.filter((a) => a.buckets.d31_60 > 0).length === 6)
ok('AR 61-90 count', ar.accounts.filter((a) => a.buckets.d61_90 > 0).length === 2)
ok('AR 90+ only Salt Market', ar.accounts.filter((a) => a.buckets.d90p > 0).length === 1 && ar.accounts.find((a) => a.name === 'Salt Market - Deal').buckets.d90p > 0)
ok('AR Bingo large', ar.accounts.find((a) => a.name === 'Bingo Wholesale').buckets.total > 12_000)
ok('AR Gourmet Glatt Lakewood large', ar.accounts.find((a) => a.name === 'Gourmet Glatt - Lakewood').buckets.total > 11_000)
ok('AR Arons small', ar.accounts.find((a) => a.name === "Aron's Kissena Farms - Queens").buckets.total < 1_200)

const stockVal = sum(DATA.stock, (r) => r.valueAtCost)
ok('Stock value', stockVal === DATA.overview.stockValue)
ok('Stock value 190-230k', stockVal >= 190_000 && stockVal <= 230_000)
const weeks = DATA.stock.map((r) => r.weeksSupply)
ok('Stock weeks min', Math.min(...weeks) >= 1.4)
ok('Stock weeks max', Math.max(...weeks) <= 12.5)
DATA.stock.forEach((r) => {
  const loc = sum(r.locations, (l) => l.cases)
  ok(`Stock loc ${r.productId}`, loc === r.onHandCases)
  const dec = String(r.avgWeeklyCases).includes('.') ? String(r.avgWeeklyCases).split('.')[1].length : 0
  ok(`Stock avg decimals ${r.productId}`, dec <= 1)
  const monthUnits = DATA.salesRows.filter((x) => x.productId === r.productId && x.month === '2026-09').reduce((s, x) => s + x.units, 0)
  const meta = DATA.salesRows.length ? null : null
  const monthCases = monthUnits / (r.weeklyUnits[0] / (r.weeklyCases?.[0] || 1) || 12)
  const unitsPerCase = monthUnits > 0 && r.avgWeeklyCases > 0 ? monthUnits / (r.avgWeeklyCases * 4.33) : 12
  const impliedMonthCases = r.avgWeeklyCases * 4.33
  const actualMonthCases = monthUnits / (monthUnits / Math.max(impliedMonthCases, 1) || 12)
  const upc = r.weeklyUnits.reduce((a, b) => a + b, 0) / 8 / r.avgWeeklyCases
  const monthCasesFromSales = monthUnits / upc
  ok(
    `Stock weekly ${r.productId}`,
    Math.abs(impliedMonthCases - monthCasesFromSales) / Math.max(monthCasesFromSales, 1) < 0.11
  )
})

DATA.channels.forEach((ch) => {
  const prod = sum(ch.byProduct, (p) => p.revenue)
  ok(`Channel ${ch.channel} products`, prod === ch.curRev)
  if (ch.channel === 'Stores' && ch.extra.storeSplits) {
    const sepStores = ch.extra.storeSplits['2026-09']['All brands']
    const augStores = ch.extra.storeSplits['2026-08']['All brands']
    const augCh = DATA.salesRows.filter((r) => r.month === '2026-08' && r.channel === 'Stores').reduce((s, r) => s + r.revenue, 0)
    ok(`Stores accounts Sep sum`, sum(sepStores, (s) => s.revenue) === ch.curRev)
    ok(`Stores accounts Aug sum`, sum(augStores, (s) => s.revenue) === roundCents(augCh))
    sepStores.forEach((s) => {
      const pct = s.revenue / ch.curRev
      ok(`Store max 12% ${s.store}`, pct <= 0.1201)
    })
    BRANDS.forEach((b) => {
      const brandStores = ch.extra.storeSplits['2026-09'][b]
      const brandStoresRev = DATA.salesRows
        .filter((r) => r.month === '2026-09' && r.channel === 'Stores' && r.brand === b)
        .reduce((s, r) => s + r.revenue, 0)
      ok(`Stores ${b} accounts sum`, sum(brandStores, (x) => x.revenue) === roundCents(brandStoresRev))
    })
    const assertUnique = (rows, label) => {
      const vals = rows.map((s) => s.revenue.toFixed(2))
      ok(`Stores unique ${label}`, new Set(vals).size === vals.length)
    }
    assertUnique(sepStores, 'Sep all brands')
    assertUnique(augStores, 'Aug all brands')
    BRANDS.forEach((b) => {
      assertUnique(ch.extra.storeSplits['2026-09'][b], `Sep ${b}`)
      assertUnique(ch.extra.storeSplits['2026-08'][b], `Aug ${b}`)
    })
  }
})

CHANNELS.forEach((ch) => {
  ;['2026-09', '2026-08'].forEach((monthId) => {
    const grpRows = DATA.salesRows.filter((r) => r.month === monthId && r.channel === ch)
    const byBrandCh = new Map()
    grpRows.forEach((r) => {
      const k = `${r.brand}|${r.channel}`
      if (!byBrandCh.has(k)) byBrandCh.set(k, [])
      byBrandCh.get(k).push(r.revenue)
    })
    byBrandCh.forEach((revs, k) => {
      const uniq = new Set(revs.map((v) => v.toFixed(2)))
      ok(`No dup product rev ${monthId} ${k}`, uniq.size === revs.length)
    })
  })
})

ar.invoices.forEach((inv) => {
  ok(`Invoice net30 ${inv.invoiceNo}`, inv.dueDate === addDays(inv.date, 30))
  const dpd = Math.max(0, daysBetween(inv.dueDate, AS_OF))
  ok(`Invoice dpd ${inv.invoiceNo}`, inv.daysPastDue === dpd)
  const bucket = bucketFromDpd(dpd)
  ok(`Invoice bucket ${inv.invoiceNo}`, inv.bucket === bucket)
})

DATA.stock.forEach((r) => {
  if (!r.weeklyCases?.length) return
  ok(
    `Weekly cases integers ${r.productId}`,
    r.weeklyCases.every((c) => Number.isInteger(c) && c >= 1)
  )
  const avg = roundCents(r.weeklyCases.reduce((a, b) => a + b, 0) / r.weeklyCases.length)
  const avgOne = Math.round(avg * 10) / 10
  const rowAvg = Math.round(r.avgWeeklyCases * 10) / 10
  ok(`Weekly cases avg ${r.productId}`, avgOne === rowAvg)
  const wks = r.avgWeeklyCases > 0 ? r.onHandCases / r.avgWeeklyCases : 0
  ok(`Weeks supply ${r.productId}`, Math.abs(wks - r.weeksSupply) < 0.15)
})

const sep = DATA.pnlViews['All brands'].find((p) => p.month === '2026-09')
const aug = DATA.pnlViews['All brands'].find((p) => p.month === '2026-08')
BRANDS.forEach((b) => {
  const s = DATA.pnlViews[b].find((x) => x.month === '2026-09')
  const share = s.revenue_total / sep.revenue_total
  ok(`Brand share ${b}`, share > 0.12 && share < 0.58)
})
ok('Essiccata Sep net loss', DATA.pnlViews.Essiccata.find((x) => x.month === '2026-09').net_profit === -612.4)

console.log('\nSeptember brand revenue / net:')
BRANDS.forEach((b) => {
  const s = DATA.pnlViews[b].find((x) => x.month === '2026-09')
  const p = DATA.pnlViews[b].find((x) => x.month === '2026-08')
  console.log(`  ${b}: rev ${s.revenue_total.toFixed(2)} (aug ${p.revenue_total.toFixed(2)}) net ${s.net_profit.toFixed(2)}`)
})
console.log('\nChannel totals Sep / Aug:')
CHANNELS.forEach((ch) => {
  console.log(`  ${ch}: ${sep.revenue[ch].toFixed(2)} / ${aug.revenue[ch].toFixed(2)}`)
})

console.log('\nSeptember combined P&L:')
const line = (label, cur, prior) => {
  const d = roundCents(cur - prior)
  console.log(`${label}: ${cur.toFixed(2)} | prior ${prior.toFixed(2)} | chg ${d.toFixed(2)}`)
}
CHANNELS.forEach((ch) => line(`  Revenue ${ch}`, sep.revenue[ch], aug.revenue[ch]))
line('  Total revenue', sep.revenue_total, aug.revenue_total)
sep.cogs_entries.forEach((e) => {
  const pe = aug.cogs_entries.find((x) => x.l === e.l)
  line(`  ${e.l}`, e.n, pe.n)
})
line('  Total COGS', sep.cogs, aug.cogs)
line('  Gross profit', sep.gross_profit, aug.gross_profit)
sep.operating_expenses_entries.forEach((e) => {
  const pe = aug.operating_expenses_entries.find((x) => x.l === e.l)
  line(`  ${e.l}`, e.n, pe.n)
})
line('  Total opex', sep.operating_expenses_total, aug.operating_expenses_total)
line('  Net profit', sep.net_profit, aug.net_profit)

console.log('\nBrand net profit Sep:')
BRANDS.forEach((b) => {
  const p = DATA.pnlViews[b].find((x) => x.month === '2026-09')
  console.log(`  ${b}: ${p.net_profit.toFixed(2)}`)
})

console.log(`\nReceivables total: ${ar.targetTotal.toFixed(2)}`)
console.log(
  `Aging: current ${sum(ar.accounts, (a) => a.buckets.current).toFixed(2)} | 1-30 ${sum(ar.accounts, (a) => a.buckets.d1_30).toFixed(2)} | 31-60 ${sum(ar.accounts, (a) => a.buckets.d31_60).toFixed(2)} | 61-90 ${sum(ar.accounts, (a) => a.buckets.d61_90).toFixed(2)} | 90+ ${sum(ar.accounts, (a) => a.buckets.d90p).toFixed(2)}`
)
console.log(`Stock at cost: ${DATA.overview.stockValue.toFixed(2)}`)

console.log('\nStock table (product, cases, avg/wk, weeks, value):')
DATA.stock.forEach((r) => {
  console.log(`  ${r.name} | ${r.onHandCases} | ${r.avgWeeklyCases} | ${r.weeksSupply} | ${r.valueAtCost.toFixed(2)}`)
})

const storesCh = DATA.channels.find((c) => c.channel === 'Stores')
if (storesCh?.extra?.storeSplits) {
  console.log('\nSeptember Stores by account:')
  storesCh.extra.storeSplits['2026-09']['All brands'].forEach((s) => {
    console.log(`  ${s.store} | ${s.revenue.toFixed(2)}`)
  })
}

console.log('\nOwed by stores:')
ar.accounts.forEach((a) => {
  console.log(
    `  ${a.name} | ${a.buckets.current.toFixed(2)} | ${a.buckets.d1_30.toFixed(2)} | ${a.buckets.d31_60.toFixed(2)} | ${a.buckets.d61_90.toFixed(2)} | ${a.buckets.d90p.toFixed(2)} | ${a.buckets.total.toFixed(2)}`
  )
})

if (errors) {
  console.error(`\n${errors} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
