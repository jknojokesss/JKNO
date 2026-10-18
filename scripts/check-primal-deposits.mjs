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
  notMatchedItems,
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

let unmatchedPayouts = 0
let sumDeposit = 0
let sumFees = 0
let sumGross = 0
let totalOrderRows = 0

for (const p of payouts) {
  const t = payoutTotals(p)
  ok(`gross sum ${p.id}`, round2(p.orders.reduce((s, o) => s + o.amount, 0)) === t.gross_sales)
  ok(`adjustments is array ${p.id}`, Array.isArray(p.adjustments))
  ok(`deposit formula ${p.id}`, t.deposit === round2(t.gross_sales + t.delivery_guarantee - t.fees - t.refunds - t.adjustmentsTotal))
  if (p.deposit != null) ok(`stored deposit ${p.id}`, round2(p.deposit) === t.deposit)
  if (!p.matched) {
    unmatchedPayouts += 1
    ok(`unmatched has adjustments ${p.id}`, Array.isArray(p.adjustments) && p.adjustments.length >= 1 && t.mismatch_amount > 0)
    if (p.id === 'dep-03') {
      ok('dep-03 earlier refund amount', p.adjustments.length === 1 && p.adjustments[0].amount === 38.4 && p.adjustments[0].order === '#1021')
      ok('dep-03 mismatch', t.mismatch_amount === 38.4)
    }
    if (p.id === 'dep-07') {
      ok('dep-07 chargeback rows', p.adjustments.length === 2)
      const cb = p.adjustments.find((a) => a.type === 'chargeback')
      const fee = p.adjustments.find((a) => a.type === 'chargeback_fee')
      ok('dep-07 chargeback amount', cb?.amount === 52.18 && cb?.order === '#1037')
      ok('dep-07 chargeback fee', fee?.amount === 15)
      ok('dep-07 mismatch', t.mismatch_amount === 67.18)
    }
  } else {
    ok(`matched no adjustment ${p.id}`, t.adjustmentsTotal === 0)
  }
  sumDeposit = round2(sumDeposit + t.deposit)
  sumFees = round2(sumFees + t.fees)
  sumGross = round2(sumGross + t.gross_sales)
  totalOrderRows += t.order_count

  for (const d of p.date ? [p.date] : []) {
    ok(`date in oct ${p.id}`, d >= '2026-10-01' && d <= '2026-10-17')
  }
}

ok('exactly 2 not matched payouts', unmatchedPayouts === 2)
ok('october gross ~18212', Math.abs(sumGross - 18212.66) < 0.02)

const summary = buildDepositsSummary(payouts)
const nmItems = notMatchedItems(payouts).filter(
  (x) => x.adjustment.type === 'earlier_refund' || x.adjustment.type === 'chargeback',
)
const notMatchedDollars = round2(
  payouts.filter((p) => !p.matched).reduce((s, p) => s + payoutTotals(p).mismatch_amount, 0),
)

ok('card deposited', summary.deposited_this_month === sumDeposit)
ok('card fees', summary.fees === sumFees)
ok('card orders matched', summary.orders_matched === totalOrderRows - 1)
ok('card not matched item count', summary.not_matched.order_count === 2)
ok('not matched items list', nmItems.length === 2)
ok('card not matched dollars', summary.not_matched.dollars === 105.58)
ok('card not matched dollars tie', summary.not_matched.dollars === notMatchedDollars)
ok('stored summary deposited', round2(deposits.summary.deposited_this_month) === summary.deposited_this_month)
ok('stored summary orders_matched', deposits.summary.orders_matched === summary.orders_matched)
ok('stored summary not_matched', deposits.summary.not_matched.order_count === 2 && deposits.summary.not_matched.dollars === 105.58)

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
console.log('check-primal-deposits OK', { deposited: summary.deposited_this_month, fees: summary.fees, ordersMatched: summary.orders_matched, notMatched: summary.not_matched })
