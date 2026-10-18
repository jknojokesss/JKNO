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

/** Per-store: ≤15% of balance in 31–60; nothing in 61+. */
function checkStoreAgingRules(prefix, rows) {
  for (const { name, total, b31, b61plus } of rows) {
    if (total <= 0) continue
    ok(`${prefix} ${name} 31-60<=15%`, b31 / total <= 0.15 + 1e-6)
    ok(`${prefix} ${name} no 61+`, round2(b61plus) === 0)
  }
}

// --- Primal Krisp ---
{
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/primal-krisp.json'), 'utf8'))
  const AS_OF = '2026-09-30'
  const aging = { '0-30': 0, '31-60': 0, '61-90': 0 }
  let owed = 0
  const pkAgingRows = []
  for (const st of data.stores.list) {
    let storeOpen = 0
    let b31 = 0
    let b61 = 0
    for (const inv of st.sample.invoices || []) {
      if (inv.status !== 'Open') continue
      storeOpen += inv.amount
      const days = daysBetween(inv.issued, AS_OF)
      if (days <= 30) aging['0-30'] += inv.amount
      else if (days <= 60) {
        aging['31-60'] += inv.amount
        b31 += inv.amount
      } else {
        aging['61-90'] += inv.amount
        b61 += inv.amount
      }
    }
    storeOpen = round2(storeOpen)
    pkAgingRows.push({ name: st.name, total: storeOpen, b31: round2(b31), b61plus: round2(b61) })
    ok(`PK ${st.name} open`, round2(st.sample.open_balance) === storeOpen)
    owed += storeOpen
  }
  checkStoreAgingRules('PK', pkAgingRows)
  owed = round2(owed)
  Object.keys(aging).forEach((k) => {
    aging[k] = round2(aging[k])
  })
  const agingSum = round2(aging['0-30'] + aging['31-60'] + aging['61-90'])
  ok('PK card vs stores', round2(data.overview.open_store_balance) === owed)
  ok('PK aging vs owed', agingSum === owed)
  ok('PK 61-90 zero', aging['61-90'] === 0)
  ok('PK 0-30 majority', owed > 0 && aging['0-30'] / owed >= 0.8)
  console.log('primal-krisp', { owed, aging, card: data.overview.open_store_balance })
}

// --- Popinsanity ---
{
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/popinsanity.json'), 'utf8'))
  const ws = data.channels.find((c) => c.id === 'wholesale')
  const asOf = ws.as_of_for_age
  let owed = 0
  const buckets = { b0: 0, b31: 0, b61: 0 }
  const popAgingRows = []
  for (const st of ws.stores) {
    let sOwed = 0
    let sb31 = 0
    let sb61 = 0
    for (const inv of st.open_invoices || []) {
      sOwed += inv.amount
      const age = inv.age_days ?? daysBetween(inv.date, asOf)
      if (age <= 30) buckets.b0 += inv.amount
      else if (age <= 60) {
        buckets.b31 += inv.amount
        sb31 += inv.amount
      } else {
        buckets.b61 += inv.amount
        sb61 += inv.amount
      }
    }
    sOwed = round2(sOwed)
    popAgingRows.push({ name: st.name, total: sOwed, b31: round2(sb31), b61plus: round2(sb61) })
    ok(`POP ${st.name}`, round2(st.owed) === sOwed)
    owed += sOwed
  }
  checkStoreAgingRules('POP', popAgingRows)
  owed = round2(owed)
  ok('POP bucket61 zero', round2(buckets.b61) === 0)
  ok('POP 31-60 under 12%', owed > 0 && buckets.b31 / owed < 0.12)
  console.log('popinsanity', { owed, buckets: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, round2(v)])) })
}

// --- Aufschnitt (profit per order — no store receivables) ---
{
  const { default: DATA } = await import('../components/samples/aufschnitt/aufschnittData.js')
  const sep = DATA.pnlViews['All products'].find((m) => m.month === '2026-09')
  const pp = DATA.profitPerOrder
  const chProfit = round2(pp.channelSummary.reduce((s, r) => s + r.profit, 0))
  ok('AU profit ties contribution', chProfit === pp.contributionAfterFulfillment)
  ok('AU net profit Sep', round2(sep.net_profit) === 16720)
  ok('AU overview profit avg', round2(DATA.overview.profitPerOrderAvg) === round2(pp.blendedAvgProfitPerOrder))
  ok('AU channel rev sum', round2(pp.channelSummary.reduce((s, r) => s + r.revenue, 0)) === round2(sep.revenue_total))
  const amazon = pp.channelSummary.find((r) => r.channel === 'Amazon')
  const amazonAvgRev = amazon.revenue / amazon.orders
  ok('AU Amazon avg order 25-35', amazonAvgRev >= 25 && amazonAvgRev <= 35)
  console.log('aufschnitt', { profitContribution: chProfit, avgPerOrder: pp.blendedAvgProfitPerOrder, amazonOrders: amazon.orders, amazonAvgRev: round2(amazonAvgRev) })
}

// --- Mr. Dipz ---
{
  const { buildMrDipzModel } = await import('../components/samples/mrDipz/mrDipzUtils.js')
  const m = buildMrDipzModel()
  let owed = 0
  const mdAgingRows = []
  for (const s of m.stores) {
    const invSum = round2(sum(s.openInvoices, (i) => i.amount) / 100)
    const storeOwed = round2(s.owed / 100)
    mdAgingRows.push({
      name: s.name,
      total: storeOwed,
      b31: round2(s.aging.b1 / 100),
      b61plus: round2((s.aging.b2 + s.aging.b3) / 100),
    })
    ok(`MD ${s.name} invoices`, invSum === storeOwed)
    const bucketSum = round2((s.aging.b0 + s.aging.b1 + s.aging.b2 + s.aging.b3) / 100)
    ok(`MD ${s.name} buckets`, bucketSum === storeOwed)
    owed += storeOwed
  }
  checkStoreAgingRules('MD', mdAgingRows)
  owed = round2(owed)
  const credits = round2(m.totals.credits / 100)
  const sales = round2(m.totals.sales / 100)
  ok('MD net', round2(m.totals.net / 100) === round2(sales - credits))
  ok('MD owed total', owed === 53735.75 || owed === 53735.76)
  const storePcts = m.stores.map((s) => s.pct)
  ok('MD credits 7-11%', Math.min(...storePcts) >= 7 && Math.max(...storePcts) <= 11)
  const ateres = m.stores.find((s) => s.id === 'brooklyn-4')
  ok('MD Ateres credit mid', ateres.pct >= 8 && ateres.pct <= 9.1)
  let b1 = 0
  for (const s of m.stores) b1 += s.aging.b1
  ok('MD 31-60 under 4%', b1 / m.totals.owed < 0.04)
  ok('MD max store share', Math.max(...m.stores.map((s) => s.owed)) / m.totals.owed <= 0.11)
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
      if (!sale.invoice) continue
      buyersOwe += sale.amount
      const age = daysBetween(sale.date, AS_OF)
      if (age > 60) over60 += 1
    }
  }
  buyersOwe = round2(buyersOwe)
  ok('CE no open invoice >60d', over60 === 0)
  console.log('closeout-explosion', { buyersOwe, over60 })
}

// --- Riverside (no store AR; P&L / YTD ties) ---
{
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/riverside-tires.json'), 'utf8'))
  const months = data.monthly
  const ytd = round2(months.reduce((s, m) => s + m.revenue, 0))
  const profitTotal = round2(months.reduce((s, m) => s + m.profit, 0))
  ok('RT YTD revenue', ytd === round2(data.ytd_revenue))
  ok('RT has September 2026', months.some((m) => m.month === '2026-09'))
  const sep = months.find((m) => m.month === '2026-09')
  ok('RT Sep profit 13-14k', sep && sep.profit >= 13000 && sep.profit <= 14000)
  const mix = data.sales_mix_sep
  ok('RT Sep mix sums', round2(sum(mix, (x) => x.revenue)) === sep.revenue)
  const topSix = round2(sum(data.top_tire_sizes_sep, (x) => x.revenue))
  ok('RT Sep top six', topSix === data.sep_tire_sales.top_six_revenue)
  console.log('riverside-tires', { ytd, profitTotal, sepRev: sep.revenue, sepProfit: sep.profit })
}

if (failures.length) {
  console.error('FAILED:', failures)
  process.exit(1)
}
console.log('All sample total checks passed.')
