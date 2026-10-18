import DATA from './aufschnittData.js'
import { BRANDS, CHANNELS, MONTHS, COGS_LINES, SHARED_OPEX } from './aufschnittCatalog.js'

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

const ar = DATA.receivables
ok('AR accounts=total', sum(ar.accounts, (a) => a.buckets.total) === ar.targetTotal)
const bucketSum = sum(ar.accounts, (a) => a.buckets.current + a.buckets.d1_30 + a.buckets.d31_60 + a.buckets.d61_90 + a.buckets.d90p)
ok('AR buckets=total', bucketSum === ar.targetTotal)
ar.accounts.forEach((a) => {
  const invSum = sum(ar.invoices.filter((i) => i.account === a.name), (i) => i.amount)
  ok(`Invoices ${a.name}`, invSum === a.buckets.total)
})

const stockVal = sum(DATA.stock, (r) => r.valueAtCost)
ok('Stock value', stockVal === DATA.overview.stockValue)
DATA.stock.forEach((r) => {
  const loc = sum(r.locations, (l) => l.cases)
  ok(`Stock loc ${r.productId}`, loc === r.onHandCases)
})

DATA.channels.forEach((ch) => {
  const prod = sum(ch.byProduct, (p) => p.revenue)
  ok(`Channel ${ch.channel} products`, prod === ch.curRev)
  if (ch.channel === 'Stores' && ch.extra.stores) {
    ok(`Stores accounts`, sum(ch.extra.stores, (s) => s.revenue) === ch.curRev)
  }
})

console.log('\nSeptember combined P&L:')
const sep = DATA.pnlViews['All brands'].find((p) => p.month === '2026-09')
const aug = DATA.pnlViews['All brands'].find((p) => p.month === '2026-08')
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

if (errors) {
  console.error(`\n${errors} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
