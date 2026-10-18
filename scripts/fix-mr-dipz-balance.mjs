import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const AS_OF = '2026-09-30'
const OWED_TARGET = 53735.75
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
function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function targetCreditPct(storeId, name) {
  if (name === 'Ateres Glatt - Brooklyn') return 8.4
  const h = Math.abs(hashCode(storeId)) % 41
  return Math.min(11, Math.max(7, 7 + h / 10))
}

async function main() {
  const { buildMrDipzModel } = await import('../components/samples/mrDipz/mrDipzUtils.js')
  const dataPath = path.join(root, 'components/samples/mrDipz/mrDipzData.js')
  let src = fs.readFileSync(dataPath, 'utf8')
  const soldMatch = src.match(/export const SOLD = (\{[\s\S]*?\});/)
  const expiredMatch = src.match(/export const EXPIRED = (\{[\s\S]*?\});/)
  const priorMatch = src.match(/export const PRIOR_MONTH = (\{[\s\S]*?\});/)
  const invMatch = src.match(/export const INVOICES = (\{[\s\S]*?\});/)
  const SOLD = JSON.parse(soldMatch[1])
  const EXPIRED = JSON.parse(expiredMatch[1])
  const PRIOR_MONTH = JSON.parse(priorMatch[1])
  const INVOICES = JSON.parse(invMatch[1])
  const { STORES, PRODUCTS, WEEKS } = await import('../components/samples/mrDipz/mrDipzData.js')
  const priceC = Object.fromEntries(PRODUCTS.map((p) => [p.id, Math.round(p.price * 100)]))

  const salesD = {}
  let salesTotal = 0
  for (const st of STORES) {
    const sold = SOLD[st.id] || {}
    let salesC = 0
    for (const pid of Object.keys(sold)) {
      for (let i = 0; i < 4; i++) salesC += (sold[pid][i] || 0) * (priceC[pid] || 0)
    }
    salesD[st.id] = salesC / 100
    salesTotal += salesD[st.id]
  }

  for (const st of STORES) {
    const sold = SOLD[st.id] || {}
    const expired = EXPIRED[st.id] || {}
    const salesC = salesD[st.id] * 100
    for (let pass = 0; pass < 150; pass++) {
      let creditsC = 0
      for (const pid of Object.keys(expired)) {
        for (let i = 0; i < 4; i++) creditsC += (expired[pid]?.[i] || 0) * (priceC[pid] || 0)
      }
      const pct = salesC ? (creditsC / salesC) * 100 : 7
      const tgt = targetCreditPct(st.id, st.name)
      if (pct >= 7 && pct <= 11 && Math.abs(pct - tgt) < 0.4) break
      const pid = PRODUCTS[pass % PRODUCTS.length].id
      const wi = pass % 4
      if (!expired[pid]) expired[pid] = [0, 0, 0, 0]
      if (pct < 7 || pct < tgt - 0.2) expired[pid][wi] = (expired[pid][wi] || 0) + 1
      else if (pct > 11 || pct > tgt + 0.2) {
        if ((expired[pid][wi] || 0) > 0) expired[pid][wi] -= 1
      }
    }
    const tp = targetCreditPct(st.id, st.name)
    if (PRIOR_MONTH[st.id]) PRIOR_MONTH[st.id].credits = round2((PRIOR_MONTH[st.id].sales * tp) / 100)
    for (let guard = 0; guard < 40; guard++) {
      let creditsC = 0
      for (const pid of Object.keys(expired)) {
        for (let i = 0; i < 4; i++) creditsC += (expired[pid]?.[i] || 0) * (priceC[pid] || 0)
      }
      const pct = salesC ? (creditsC / salesC) * 100 : 7
      if (pct >= 7) break
      const pid = 'hummus'
      if (!expired[pid]) expired[pid] = [0, 0, 0, 0]
      expired[pid][guard % 4] = (expired[pid][guard % 4] || 0) + 1
    }
  }

  const storeOpen = (id) => (INVOICES[id] || []).filter((i) => i.status === 'open')
  const storeSum = (id) => round2(storeOpen(id).reduce((s, i) => s + i.amount, 0))

  let totalOpen = round2(STORES.reduce((s, st) => s + storeSum(st.id), 0))
  if (totalOpen > 0) {
    const g = OWED_TARGET / totalOpen
    for (const st of STORES) {
      for (const inv of storeOpen(st.id)) inv.amount = round2(inv.amount * g)
    }
  }

  const targetOwed = {}
  const maxOwed = round2(OWED_TARGET * 0.1)
  for (const st of STORES) targetOwed[st.id] = round2(OWED_TARGET * (salesD[st.id] / salesTotal))
  let excess = 0
  for (const st of STORES) {
    if (targetOwed[st.id] > maxOwed) {
      excess += round2(targetOwed[st.id] - maxOwed)
      targetOwed[st.id] = maxOwed
    }
  }
  if (excess > 0) {
    const under = STORES.filter((st) => targetOwed[st.id] < maxOwed)
    const share = round2(excess / under.length)
    under.forEach((st, i) => {
      const add = i === under.length - 1 ? round2(excess - share * (under.length - 1)) : share
      targetOwed[st.id] = round2(targetOwed[st.id] + add)
    })
  }
  let fix = round2(OWED_TARGET - Object.values(targetOwed).reduce((a, b) => a + b, 0))
  if (fix) targetOwed[STORES[0].id] = round2(targetOwed[STORES[0].id] + fix)

  for (let pass = 0; pass < 400; pass++) {
    let moved = 0
    const deltas = STORES.map((st) => ({
      id: st.id,
      d: round2(targetOwed[st.id] - storeSum(st.id)),
    }))
    const donors = deltas.filter((x) => x.d < -0.01).sort((a, b) => a.d - b.d)
    const receivers = deltas.filter((x) => x.d > 0.01).sort((a, b) => b.d - a.d)
    if (!donors.length || !receivers.length) break
    const dInv = storeOpen(donors[0].id).sort((a, b) => b.amount - a.amount)[0]
    const rInv = storeOpen(receivers[0].id).sort((a, b) => b.amount - a.amount)[0]
    if (!dInv || !rInv) break
    const amt = round2(Math.min(-donors[0].d, receivers[0].d, 250, dInv.amount))
    if (amt <= 0) break
    dInv.amount = round2(dInv.amount - amt)
    rInv.amount = round2(rInv.amount + amt)
    moved = amt
    if (moved < 0.01) break
  }

  totalOpen = round2(STORES.reduce((s, st) => s + storeSum(st.id), 0))
  const drift = round2(OWED_TARGET - totalOpen)
  if (Math.abs(drift) > 0.01) {
    const last = storeOpen(STORES[STORES.length - 1].id).slice(-1)[0]
    if (last) last.amount = round2(last.amount + drift)
  }

  for (const st of STORES) {
    const open = (INVOICES[st.id] || []).filter((i) => i.status === 'open')
    open.forEach((inv) => {
      inv.date = addDays(AS_OF, -(8 + (hashCode(inv.no) % 20)))
    })
  }
  const TARGET_B1 = round2(OWED_TARGET * 0.065)
  const spreadIds = ['monsey-5', 'brooklyn-4', 'queens-2', 'five-towns-1', 'five-towns-2', 'boca-3']
  let b1Total = 0
  for (const id of spreadIds) {
    if (b1Total >= TARGET_B1 - 0.01) break
    const open = storeOpen(id)
      .filter((i) => i.amount > 0.01)
      .sort((a, b) => a.amount - b.amount)
    if (!open.length) continue
    const inv = open[0]
    const storeBal = storeSum(id)
    const cap = round2(Math.min(storeBal * 0.12, TARGET_B1 - b1Total))
    let slice = round2(Math.min(inv.amount, cap))
    if (slice < 80) continue
    if (slice < inv.amount - 0.01) {
      const other = open.find((i) => i !== inv) || open[open.length - 1]
      other.amount = round2(other.amount + inv.amount - slice)
      inv.amount = slice
    }
    inv.date = addDays(AS_OF, -(33 + (Math.abs(hashCode(id)) % 10)))
    b1Total = round2(b1Total + slice)
  }

  totalOpen = round2(STORES.reduce((s, st) => s + storeSum(st.id), 0))
  if (totalOpen > 0 && Math.abs(totalOpen - OWED_TARGET) > 0.01) {
    const g = OWED_TARGET / totalOpen
    for (const st of STORES) {
      for (const inv of storeOpen(st.id)) inv.amount = round2(inv.amount * g)
    }
    const drift = round2(OWED_TARGET - round2(STORES.reduce((s, st) => s + storeSum(st.id), 0)))
    if (Math.abs(drift) > 0.01) {
      const fixInv = storeOpen(STORES[0].id).find((i) => i.amount > 0) || storeOpen(STORES[0].id)[0]
      if (fixInv) fixInv.amount = round2(fixInv.amount + drift)
    }
  }

  src = src.replace(/export const EXPIRED = \{[\s\S]*?\};/, `export const EXPIRED = ${JSON.stringify(EXPIRED)};`)
  src = src.replace(/export const PRIOR_MONTH = \{[\s\S]*?\};/, `export const PRIOR_MONTH = ${JSON.stringify(PRIOR_MONTH)};`)
  src = src.replace(/export const INVOICES = \{[\s\S]*?\};/, `export const INVOICES = ${JSON.stringify(INVOICES)};`)
  fs.writeFileSync(dataPath, src)

  const m = buildMrDipzModel()
  console.log(
    JSON.stringify({
      owed: round2(m.totals.owed / 100),
      credits: round2(m.totals.credits / 100),
      minPct: Math.min(...m.stores.map((s) => s.pct)),
      ateres: round2(m.stores.find((s) => s.id === 'brooklyn-4').owed / 100),
      maxShare: round2((Math.max(...m.stores.map((s) => s.owed)) / m.totals.owed) * 100),
    }),
  )
}

main()
