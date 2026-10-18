/**
 * Part B rebalancing: aging, credits, AR account sizes.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const round2 = (n) => Math.round(n * 100) / 100

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function addDays(iso, days) {
  const d = parseIso(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
function daysBetween(a, b) {
  return Math.round((parseIso(b) - parseIso(a)) / 86400000)
}

// --- Primal Krisp: 80%+ in 0-30 ---
{
  const file = path.join(root, 'data/primal-krisp.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const AS_OF = '2026-09-30'
  const TARGET_030 = 0.82
  for (const st of data.stores.list) {
    for (const inv of st.sample.invoices || []) {
      if (inv.status !== 'Open') continue
      let days = daysBetween(inv.issued, AS_OF)
      if (days > 30) {
        inv.issued = addDays(AS_OF, -(8 + (inv.amount % 17)))
        inv.days_outstanding = daysBetween(inv.issued, AS_OF)
      }
    }
    st.sample.open_invoices = st.sample.invoices.filter((i) => i.status === 'Open')
    st.sample.open_balance = round2(st.sample.open_invoices.reduce((s, i) => s + i.amount, 0))
  }
  let owed = round2(data.stores.list.reduce((s, st) => s + st.sample.open_balance, 0))
  let aging = { a0: 0, a31: 0 }
  for (const st of data.stores.list) {
    for (const inv of st.sample.invoices || []) {
      if (inv.status !== 'Open') continue
      const d = daysBetween(inv.issued, AS_OF)
      if (d <= 30) aging.a0 += inv.amount
      else aging.a31 += inv.amount
    }
  }
  // nudge a few stores to keep small 31-60 spread (3+ stores)
  const stores31 = data.stores.list.filter((st) =>
    (st.sample.invoices || []).some((inv) => inv.status === 'Open' && daysBetween(inv.issued, AS_OF) > 30),
  )
  if (aging.a0 / owed < TARGET_030 && stores31.length < 3) {
    const candidates = data.stores.list.filter((st) => st.sample.open_balance > 400).slice(0, 4)
    candidates.forEach((st, i) => {
      const open = (st.sample.invoices || []).filter((inv) => inv.status === 'Open')
      if (!open.length) return
      const inv = open[i % open.length]
      inv.issued = addDays(AS_OF, -(35 + i * 4))
      inv.days_outstanding = daysBetween(inv.issued, AS_OF)
    })
  }
  data.overview.open_store_balance = round2(
    data.stores.list.reduce((s, st) => s + st.sample.open_balance, 0),
  )
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
  console.log('primal-krisp rebalanced open', data.overview.open_store_balance)
}

// --- Popinsanity ---
{
  const file = path.join(root, 'data/popinsanity.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const ws = data.channels.find((c) => c.id === 'wholesale')
  const asOf = ws.as_of_for_age
  for (const st of ws.stores) {
    for (const inv of st.open_invoices || []) {
      let age = inv.age_days
      if (age > 30) {
        inv.date = addDays(asOf, -(12 + (inv.amount % 20)))
        age = daysBetween(inv.date, asOf)
      }
      if (age > 45) {
        inv.date = addDays(asOf, -(10 + (inv.amount % 15)))
        age = daysBetween(inv.date, asOf)
      }
      inv.age_days = age
    }
    st.owed = round2((st.open_invoices || []).reduce((s, i) => s + i.amount, 0))
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('popinsanity rebalanced')
}

// --- Aufschnitt AR rebalance ---
{
  const file = path.join(root, 'components/samples/aufschnitt/aufschnittData.js')
  let src = fs.readFileSync(file, 'utf8')
  const m = src.match(/const AR_BUCKET_SPEC = (\{[\s\S]*?\n\})/)
  const spec = eval('(' + m[1] + ')')
  const names = Object.keys(spec)
  const totals = names.map((n) => {
    const b = spec[n]
    return { n, t: b.current + b.d1_30 + b.d31_60 }
  })
  totals.sort((a, b) => a.t - b.t)
  const median = totals[Math.floor(totals.length / 2)].t
  const cap = round2(median * 1.8)
  const donors = ['Meged Glatt - Lakewood', 'Keren Wholesale - Lakewood']
  let pool = 0
  donors.forEach((n) => {
    const b = spec[n]
    const t = b.current + b.d1_30 + b.d31_60
    if (t > cap) {
      const cut = round2(t - cap)
      pool += cut
      b.d1_30 = round2(Math.max(0, b.d1_30 - cut * 0.6))
      b.current = round2(Math.max(0, b.current - cut * 0.4))
    }
  })
  const receivers = totals.filter((x) => !donors.includes(x.n) && x.t < median * 0.85)
  receivers.slice(0, 6).forEach((r, i) => {
    const share = round2(pool / Math.min(6, receivers.length))
    spec[r.n].current = round2(spec[r.n].current + share)
  })
  const lines = names.map((name) => {
    const b = spec[name]
    return `  '${name.replace(/'/g, "\\'")}': { current: ${b.current}, d1_30: ${b.d1_30}, d31_60: ${b.d31_60}, d61_90: 0, d90p: 0 },`
  })
  const block = `const AR_BUCKET_SPEC = {\n${lines.join('\n')}\n}`
  src = src.replace(/\/\*\* Bucket amounts[\s\S]*?const AR_BUCKET_SPEC = \{[\s\S]*?\n\}/, `/** Bucket amounts per store — sums to ~94.8k; mostly current aging. */\n${block}`)
  fs.writeFileSync(file, src)
  console.log('aufschnitt AR rebalanced, cap ~', cap)
}

console.log('Run mr-dipz balance via separate import...')
