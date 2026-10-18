import DATA from './aufschnittData.js'
import { BRANDS, CHANNELS, MONTHS, COGS_LINES, SHARED_OPEX, STORE_ACCOUNTS } from './aufschnittCatalog.js'

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
  (a) => a.buckets.d31_60 === 0 && a.buckets.d61_90 === 0 && a.buckets.d90p === 0
)
ok('AR ~1/3 fully current', fullyCurrent.length >= 6 && fullyCurrent.length <= 10)
ok('AR 31-60 count', ar.accounts.filter((a) => a.buckets.d31_60 > 0).length === 6)
ok('AR 61-90 count', ar.accounts.filter((a) => a.buckets.d61_90 > 0).length === 2)
ok('AR 90+ only Passaic', ar.accounts.filter((a) => a.buckets.d90p > 0).length === 1 && ar.accounts.find((a) => a.name === 'Passaic store 1').buckets.d90p > 0)
ok('AR Distributor NJ large', ar.accounts.find((a) => a.name === 'Distributor NJ 1').buckets.total > 12_000)
ok('AR Lakewood large', ar.accounts.find((a) => a.name === 'Lakewood store 1').buckets.total > 11_000)
ok('AR Staten small', ar.accounts.find((a) => a.name === 'Staten Island store 1').buckets.total < 1_200)

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
  if (ch.channel === 'Stores' && ch.extra.stores) {
    ok(`Stores accounts`, sum(ch.extra.stores, (s) => s.revenue) === ch.curRev)
  }
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
