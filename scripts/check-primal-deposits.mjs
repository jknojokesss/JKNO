#!/usr/bin/env node
/**
 * Primal Krisp Deposits tab — payout math and card ties.
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
const DATA = JSON.parse(fs.readFileSync(path.join(root, '../data/primal-krisp.json'), 'utf8'))
const deposits = DATA.deposits

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  else console.log('ok', label)
}

if (!deposits?.payouts?.length) failures.push('missing deposits.payouts')

const payouts = deposits?.payouts || []
ok('payout count 10', payouts.length === 10)

let unmatched = 0
let sumDeposit = 0
let sumFees = 0
let ordersMatched = 0
let notMatchedOrders = 0
let notMatchedDollars = 0

for (const p of payouts) {
  const t = payoutTotals(p)
  ok(`gross sum ${p.id}`, round2(p.orders.reduce((s, o) => s + o.amount, 0)) === t.gross_sales)
  ok(`deposit formula ${p.id}`, t.deposit === round2(t.gross_sales + t.delivery_guarantee - t.fees - t.refunds - t.adjustments))
  if (p.deposit != null) ok(`stored deposit ${p.id}`, round2(p.deposit) === t.deposit)
  if (!p.matched) {
    unmatched += 1
    ok(`unmatched has adjustment ${p.id}`, (p.adjustments || []).length === 1 && t.mismatch_amount > 0)
    notMatchedOrders += t.order_count
    notMatchedDollars = round2(notMatchedDollars + t.mismatch_amount)
  } else {
    ordersMatched += t.order_count
    ok(`matched no adjustment ${p.id}`, t.adjustments === 0)
  }
  sumDeposit = round2(sumDeposit + t.deposit)
  sumFees = round2(sumFees + t.fees)

  for (const d of p.date ? [p.date] : []) {
    ok(`date in oct ${p.id}`, d >= '2026-10-01' && d <= '2026-10-17')
  }
}

ok('exactly 2 not matched', unmatched === 2)

const summary = buildDepositsSummary(payouts)
ok('card deposited', summary.deposited_this_month === sumDeposit)
ok('card fees', summary.fees === sumFees)
ok('card orders matched', summary.orders_matched === ordersMatched)
ok('card not matched count', summary.not_matched.order_count === notMatchedOrders)
ok('card not matched dollars', summary.not_matched.dollars === notMatchedDollars)
ok('stored summary deposited', round2(deposits.summary.deposited_this_month) === summary.deposited_this_month)

const sources = new Set(payouts.map((p) => p.source))
ok('has Shopify', sources.has('Shopify'))
ok('has PayPal', sources.has('PayPal'))
ok('has Amazon Pay', sources.has('Amazon Pay'))

const portalPath = path.join(root, '../components/samples/PrimalKrispPortal.js')
const portalSrc = fs.readFileSync(portalPath, 'utf8')
ok('deposits tab in nav', portalSrc.includes("['deposits', 'Deposits']"))
ok('after subscriptions', /subscriptions.*\n.*deposits/.test(portalSrc))

const glyph = /[×✓✔↓↑▲▼▶]/
for (const f of [
  path.join(root, '../components/samples/primal-krisp/PrimalKrispDepositsTab.js'),
  path.join(root, '../components/samples/primal-krisp/PrimalKrispDepositsDetail.js'),
]) {
  ok(`no banned glyphs ${path.basename(f)}`, !glyph.test(fs.readFileSync(f, 'utf8')))
}

if (failures.length) {
  console.error('check-primal-deposits FAILED:', failures)
  process.exit(1)
}
console.log('check-primal-deposits OK', { deposited: summary.deposited_this_month, fees: summary.fees, ordersMatched, notMatched: summary.not_matched })
