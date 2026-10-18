/**
 * Verify receivables / aging totals tie out on the six prospect samples.
 * Run: node scripts/check-samples-totals.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const round2 = (n) => Math.round(n * 100) / 100
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function daysBetween(a, b) {
  return Math.round((parseIso(b) - parseIso(a)) / 86400000)
}

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  return cond
}

// --- Primal Krisp ---
{
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/primal-krisp.json'), 'utf8'))
  const AS_OF = '2026-09-30'
  const aging = { '0-30': 0, '31-60': 0, '61-90': 0 }
  let owed = 0
  for (const st of data.stores.list) {
    let storeOpen = 0
    for (const inv of st.sample.invoices || []) {
      if (inv.status !== 'Open') continue
      storeOpen += inv.amount
      const days = daysBetween(inv.issued, AS_OF)
      if (days <= 30) aging['0-30'] += inv.amount
      else if (days <= 60) aging['31-60'] += inv.amount
      else aging['61-90'] += inv.amount
    }
    storeOpen = round2(storeOpen)
    ok(`PK ${st.name} open`, round2(st.sample.open_balance) === storeOpen)
    owed += storeOpen
  }
  owed = round2(owed)
  Object.keys(aging).forEach((k) => {
    aging[k] = round2(aging[k])
  })
  const agingSum = round2(aging['0-30'] + aging['31-60'] + aging['61-90'])
  ok('PK card vs stores', round2(data.overview.open_store_balance) === owed)
  ok('PK aging vs owed', agingSum === owed)
  ok('PK 61-90 zero', aging['61-90'] === 0)
  console.log('primal-krisp', { owed, aging, card: data.overview.open_store_balance })
}

// --- Popinsanity ---
{
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/popinsanity.json'), 'utf8'))
  const ws = data.channels.find((c) => c.id === 'wholesale')
  const asOf = ws.as_of_for_age
  let owed = 0
  const buckets = { b0: 0, b31: 0, b61: 0 }
  for (const st of ws.stores) {
    let sOwed = 0
    for (const inv of st.open_invoices || []) {
      sOwed += inv.amount
      const age = inv.age_days ?? daysBetween(inv.date, asOf)
      if (age <= 30) buckets.b0 += inv.amount
      else if (age <= 60) buckets.b31 += inv.amount
      else buckets.b61 += inv.amount
    }
    sOwed = round2(sOwed)
    ok(`POP ${st.name}`, round2(st.owed) === sOwed)
    owed += sOwed
  }
  owed = round2(owed)
  ok('POP bucket61 zero', round2(buckets.b61) === 0)
  console.log('popinsanity', { owed, buckets: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, round2(v)])) })
}

// --- Aufschnitt ---
{
  const { default: DATA } = await import('../components/samples/aufschnitt/aufschnittData.js')
  const ar = DATA.receivables
  const totals = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0, total: 0 }
  for (const a of ar.accounts) {
    const b = a.buckets
    const row = b.current + b.d1_30 + b.d31_60 + b.d61_90 + b.d90p
    ok(`AU ${a.name}`, round2(b.total) === round2(row))
    totals.current += b.current
    totals.d1_30 += b.d1_30
    totals.d31_60 += b.d31_60
    totals.d61_90 += b.d61_90
    totals.d90p += b.d90p
    totals.total += b.total
  }
  Object.keys(totals).forEach((k) => {
    totals[k] = round2(totals[k])
  })
  ok('AU overview owed', round2(DATA.overview.owedTotal) === totals.total)
  ok('AU 61-90+0', totals.d61_90 === 0 && totals.d90p === 0)
  console.log('aufschnitt', { owed: totals.total, buckets: totals })
}

// --- Mr. Dipz ---
{
  const { buildMrDipzModel } = await import('../components/samples/mrDipz/mrDipzUtils.js')
  const m = buildMrDipzModel()
  let owed = 0
  for (const s of m.stores) {
    const invSum = round2(sum(s.openInvoices, (i) => i.amount) / 100)
    const storeOwed = round2(s.owed / 100)
    ok(`MD ${s.name} invoices`, invSum === storeOwed)
    const bucketSum = round2((s.aging.b0 + s.aging.b1 + s.aging.b2 + s.aging.b3) / 100)
    ok(`MD ${s.name} buckets`, bucketSum === storeOwed)
    owed += storeOwed
  }
  owed = round2(owed)
  const credits = round2(m.totals.credits / 100)
  const sales = round2(m.totals.sales / 100)
  ok('MD net', round2(m.totals.net / 100) === round2(sales - credits))
  console.log('mr-dipz', { owed, sales, credits, pct: m.totals.pct })
}

// --- Closeout Explosion (inline — compute module needs Next bundler) ---
{
  const AS_OF = '2026-10-17'
  const lotsDir = path.join(root, 'components/samples/closeoutExplosion/lots')
  let buyersOwe = 0
  let over60 = 0
  for (const name of fs.readdirSync(lotsDir)) {
    if (!name.endsWith('.json')) continue
    const lot = JSON.parse(fs.readFileSync(path.join(lotsDir, name), 'utf8'))
    for (const sale of lot.sales) {
      if (sale.paid != null) continue
      buyersOwe += sale.amount
      const age = daysBetween(sale.date, AS_OF)
      if (age > 60) over60 += 1
    }
  }
  buyersOwe = round2(buyersOwe)
  ok('CE no open invoice >60d', over60 === 0)
  console.log('closeout-explosion', { buyersOwe, over60 })
}

// --- Riverside (no store AR; P&L only) ---
console.log('riverside-tires: no store-level AR aging in sample (skipped)')

if (failures.length) {
  console.error('FAILED:', failures)
  process.exit(1)
}
console.log('All sample total checks passed.')
