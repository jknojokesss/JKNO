#!/usr/bin/env node
/**
 * One-off: renumber deposit orders, unique payout gross, refresh stored totals.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  payoutTotals,
  buildDepositsSummary,
  round2,
} from '../components/samples/primal-krisp/primalKrispDepositsData.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const jsonPath = path.join(root, '../data/primal-krisp.json')
const DATA = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const deposits = DATA.deposits
const payouts = deposits.payouts

const GROSS_NUDGES = {
  'dep-02': 0.27,
  'dep-03': 0.63,
  'dep-06': -0.19,
  'dep-07': -0.84,
}

function parseIso(d) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}
function iso(d) {
  return d.toISOString().slice(0, 10)
}
function clampOrderDate(orderDate, payoutDate) {
  const p = parseIso(payoutDate)
  const min = new Date(p.getTime() - 2 * 86400000)
  const o = parseIso(orderDate)
  if (o > p) return payoutDate
  if (o < min) return iso(min)
  return orderDate
}

// Nudge duplicate gross payouts
for (const p of payouts) {
  const nudge = GROSS_NUDGES[p.id]
  if (nudge && p.orders?.[0]) {
    p.orders[0].amount = round2(p.orders[0].amount + nudge)
  }
}

// Flatten, sort by date then payout date
const flat = []
payouts.forEach((p, pi) => {
  p.orders.forEach((o, oi) => {
    flat.push({ p, pi, oi, o: { ...o } })
  })
})
flat.sort((a, b) => {
  const d = a.o.date.localeCompare(b.o.date)
  if (d) return d
  const pd = a.p.date.localeCompare(b.p.date)
  if (pd) return pd
  return a.pi - b.pi || a.oi - b.oi
})

for (const row of flat) {
  row.o.date = clampOrderDate(row.o.date, row.p.date)
}
flat.sort((a, b) => {
  const d = a.o.date.localeCompare(b.o.date)
  if (d) return d
  const pd = a.p.date.localeCompare(b.p.date)
  if (pd) return pd
  return a.pi - b.pi || a.oi - b.oi
})
let seq = 1102
for (const row of flat) {
  row.o.order = `#${seq}`
  seq += 1
}
const byDate = [...flat].sort((a, b) => a.o.date.localeCompare(b.o.date) || parseInt(a.o.order.slice(1), 10) - parseInt(b.o.order.slice(1), 10))
for (let i = 1; i < byDate.length; i++) {
  const pn = parseInt(byDate[i - 1].o.order.slice(1), 10)
  const cn = parseInt(byDate[i].o.order.slice(1), 10)
  if (cn <= pn) throw new Error(`order nums not increasing with date ${byDate[i - 1].o.order} -> ${byDate[i].o.order}`)
}

// Write back
for (const row of flat) {
  payouts[row.pi].orders[row.oi] = row.o
}

// Refresh stored derived fields per payout
let sumGross = 0
const grossSet = new Set()
for (const p of payouts) {
  const t = payoutTotals(p)
  if (grossSet.has(t.gross_sales)) throw new Error(`duplicate gross ${t.gross_sales} on ${p.id}`)
  grossSet.add(t.gross_sales)
  sumGross = round2(sumGross + t.gross_sales)
  p.gross_sales = t.gross_sales
  p.delivery_guarantee = t.delivery_guarantee
  p.fees = t.fees
  p.deposit = t.deposit
  p.order_count = t.order_count
  p.mismatch_amount = t.mismatch_amount
}

if (Math.abs(sumGross - 18212.66) > 50) {
  throw new Error(`gross drift ${sumGross}`)
}

deposits.summary = buildDepositsSummary(payouts)

fs.writeFileSync(jsonPath, JSON.stringify(DATA, null, 1) + '\n')
console.log('fixed deposits', {
  orders: flat.length,
  first: flat[0].o.order,
  last: flat[flat.length - 1].o.order,
  sumGross,
  summary: deposits.summary,
  grossByPayout: payouts.map((p) => ({ id: p.id, g: payoutTotals(p).gross_sales })),
})
