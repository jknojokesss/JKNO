/**
 * One-off data normalization for the six prospect samples (aging + mr-dipz credits).
 * Run: node scripts/fix-samples-aging-data.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const AS_OF_PK = '2026-09-30'
const AS_OF_POP = '2026-10-31'
const AS_OF_CE = '2026-10-17'
const AS_OF_MD = '2026-09-30'

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(iso, days) {
  const d = parseIso(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(fromIso, toIso) {
  return Math.round((parseIso(toIso) - parseIso(fromIso)) / 86400000)
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function fixPrimalKrisp() {
  const file = path.join(root, 'data/primal-krisp.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  let past60 = 0
  for (const st of data.stores.list) {
    const sample = st.sample
    for (const inv of sample.invoices || []) {
      if (inv.status !== 'Open') continue
      let days = daysBetween(inv.issued, AS_OF_PK)
      if (days > 60) {
        const target = 12 + (Math.abs(hashCode(inv.invoice)) % 28)
        inv.issued = addDays(AS_OF_PK, -target)
        days = target
      } else if (days > 45) {
        inv.issued = addDays(AS_OF_PK, -(20 + (hashCode(inv.invoice) % 20)))
        days = daysBetween(inv.issued, AS_OF_PK)
      }
      inv.days_outstanding = days
      if (days > 60) past60 += inv.amount
    }
    sample.open_invoices = (sample.invoices || []).filter((i) => i.status === 'Open')
    sample.open_balance = round2(sample.open_invoices.reduce((s, i) => s + i.amount, 0))
  }
  data.overview.open_store_balance = round2(
    data.stores.list.reduce((s, st) => s + (st.sample.open_balance || 0), 0),
  )
  data.alerts = (data.alerts || []).filter((a) => !String(a.title || '').includes('past 60 days'))
  const ask = data.ask_samples?.find?.((x) => x.q) || data.ask
  if (data.ask_answers) {
    for (const row of data.ask_answers) {
      if (row.a && row.a.includes('past 60 days')) {
        row.a = row.a.replace(/\$[\d,]+\.\d{2} of it past 60 days\./, 'mostly current terms.')
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
  console.log('primal-krisp: open balance', data.overview.open_store_balance, 'past60 leftover', past60)
}

function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function fixPopinsanity() {
  const file = path.join(root, 'data/popinsanity.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const wholesale = data.channels.find((c) => c.id === 'wholesale')
  if (!wholesale) return
  const asOf = wholesale.as_of_for_age || AS_OF_POP
  for (const store of wholesale.stores) {
    let owed = 0
    for (const inv of store.open_invoices || []) {
      let age = inv.age_days
      if (age > 60 || daysBetween(inv.date, asOf) > 60) {
        const target = 10 + (hashCode(inv.invoice) % 35)
        inv.date = addDays(asOf, -target)
        age = target
      }
      inv.age_days = age
      owed = round2(owed + inv.amount)
    }
    store.owed = owed
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('popinsanity: wholesale stores fixed')
}

function targetCreditPct(storeId, name) {
  if (name === 'Glatt Mart') return 8.6
  const h = Math.abs(hashCode(storeId)) % 41
  return 7 + h / 10
}

async function fixMrDipz() {
  const { buildMrDipzModel } = await import('../components/samples/mrDipz/mrDipzUtils.js')
  const dataPath = path.join(root, 'components/samples/mrDipz/mrDipzData.js')
  let src = fs.readFileSync(dataPath, 'utf8')
  const soldMatch = src.match(/export const SOLD = (\{[\s\S]*?\});/)
  const expiredMatch = src.match(/export const EXPIRED = (\{[\s\S]*?\});/)
  const priorMatch = src.match(/export const PRIOR_MONTH = (\{[\s\S]*?\});/)
  const invMatch = src.match(/export const INVOICES = (\{[\s\S]*?\});/)
  if (!soldMatch || !expiredMatch) throw new Error('mrDipzData parse failed')
  const SOLD = JSON.parse(soldMatch[1])
  const EXPIRED = JSON.parse(expiredMatch[1])
  const PRIOR_MONTH = JSON.parse(priorMatch[1])
  const INVOICES = JSON.parse(invMatch[1])
  const { STORES, PRODUCTS, WEEKS } = await import('../components/samples/mrDipz/mrDipzData.js')

  const priceC = Object.fromEntries(PRODUCTS.map((p) => [p.id, Math.round(p.price * 100)]))

  for (const st of STORES) {
    const sold = SOLD[st.id] || {}
    const expired = EXPIRED[st.id] || {}
    let salesC = 0
    let creditsC = 0
    for (const pid of Object.keys(sold)) {
      const weeks = sold[pid] || []
      const exp = expired[pid] || [0, 0, 0, 0]
      for (let i = 0; i < 4; i++) {
        salesC += (weeks[i] || 0) * (priceC[pid] || 0)
        creditsC += (exp[i] || 0) * (priceC[pid] || 0)
      }
    }
    const targetPct = targetCreditPct(st.id, st.name)
    const targetCreditsC = Math.round(salesC * (targetPct / 100))
    if (creditsC > 0 && salesC > 0) {
      const factor = targetCreditsC / creditsC
      for (const pid of Object.keys(expired)) {
        const arr = expired[pid]
        if (!arr) continue
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.max(0, Math.round(arr[i] * factor))
        }
      }
    }
    // rebalance week invoice amounts from recomputed nets
    const weekNet = WEEKS.map((w, wi) => {
      let s = 0
      let c = 0
      for (const pid of Object.keys(sold)) {
        s += (sold[pid]?.[wi] || 0) * (priceC[pid] || 0)
        c += (expired[pid]?.[wi] || 0) * (priceC[pid] || 0)
      }
      return round2((s - c) / 100)
    })
    const invs = INVOICES[st.id] || []
    for (const inv of invs) {
      if (inv.week) {
        const wi = WEEKS.findIndex((w) => w.id === inv.week)
        if (wi >= 0) inv.amount = weekNet[wi]
      }
      if (inv.status === 'open' && daysBetween(inv.date, AS_OF_MD) > 60) {
        inv.date = addDays(AS_OF_MD, -(14 + (hashCode(inv.no) % 25)))
      }
    }
    // prior month credits to similar band
    const priorSalesC = Math.round((PRIOR_MONTH[st.id]?.sales || 0) * 100)
    const priorTarget = Math.round(priorSalesC * (targetPct / 100))
    if (PRIOR_MONTH[st.id]) PRIOR_MONTH[st.id].credits = round2(priorTarget / 100)
  }

  src = src.replace(/export const EXPIRED = \{[\s\S]*?\};/, `export const EXPIRED = ${JSON.stringify(EXPIRED)};`)
  src = src.replace(/export const PRIOR_MONTH = \{[\s\S]*?\};/, `export const PRIOR_MONTH = ${JSON.stringify(PRIOR_MONTH)};`)
  src = src.replace(/export const INVOICES = \{[\s\S]*?\};/, `export const INVOICES = ${JSON.stringify(INVOICES)};`)
  fs.writeFileSync(dataPath, src)

  const model = buildMrDipzModel()
  const pcts = model.stores.map((s) => ({ n: s.name, p: Math.round(s.pct * 10) / 10 }))
  pcts.sort((a, b) => b.p - a.p)
  console.log('mr-dipz credits % range', pcts[0], pcts[pcts.length - 1], 'glatt', pcts.find((x) => x.n === 'Glatt Mart'))
}

function fixCloseoutLots() {
  const lotsDir = path.join(root, 'components/samples/closeoutExplosion/lots')
  for (const name of fs.readdirSync(lotsDir)) {
    if (!name.endsWith('.json')) continue
    const file = path.join(lotsDir, name)
    const lot = JSON.parse(fs.readFileSync(file, 'utf8'))
    for (const sale of lot.sales) {
      if (sale.paid != null) continue
      const age = daysBetween(sale.date, AS_OF_CE)
      if (age > 60) {
        const newDate = addDays(AS_OF_CE, -(10 + (hashCode(sale.invoice) % 30)))
        sale.date = newDate
        const terms = daysBetween(sale.date, sale.due)
        if (terms > 0 && terms < 60) {
          // keep original term length
        } else {
          sale.due = addDays(newDate, 30)
        }
      }
      if (sale.paid == null && AS_OF_CE > sale.due) {
        sale.due = addDays(sale.date, 30)
      }
    }
    fs.writeFileSync(file, JSON.stringify(lot))
  }
  console.log('closeout lots: re-dated stale open invoices')
}

fixPrimalKrisp()
fixPopinsanity()
fixCloseoutLots()
await fixMrDipz()
console.log('done')
