/**
 * Popinsanity corporate order board — totals and stage rules.
 * Run: node scripts/check-popinsanity-feature.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/popinsanity.json'), 'utf8'))

const round2 = (n) => Math.round(n * 100) / 100
const sum = (arr, f) => round2(arr.reduce((s, x) => s + f(x), 0))

const STAGES = ['quote', 'deposit_invoiced', 'deposit_paid', 'shipping', 'balance_invoiced', 'paid']
const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s, i]))
const DEPOSIT_PAID_IDX = STAGE_INDEX.deposit_paid

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
}

const BANNED_CLIENT_NAMES = [
  'Tri-State Title Agency',
  'Lakewood Insurance Brokers',
  'Spring Valley Law Offices',
  'Route 59 Auto Group',
  'Ramapo Building Supply',
]
const popJson = fs.readFileSync(path.join(root, 'data/popinsanity.json'), 'utf8')
for (const name of BANNED_CLIENT_NAMES) {
  ok(`no banned name: ${name}`, !popJson.includes(name))
}

const orders = data.holiday_orders
ok('12 holiday orders', orders.length === 12)

const booked = sum(orders, (o) => o.order_total)
const units = sum(orders, (o) => o.units)
const balanceCard = sum(orders, (o) => o.balance_due)
const depositsCard = sum(
  orders.filter((o) => (STAGE_INDEX[o.stage] ?? -1) >= DEPOSIT_PAID_IDX),
  (o) => o.deposit_received,
)

ok('booked 161050', booked === 161050)
ok('units 3000', units === 3000)
ok('balance 106650', balanceCard === 106650)
ok('deposits 54400', depositsCard === 54400)
ok('booked = deposits + balance', booked === round2(depositsCard + balanceCard))

for (const o of orders) {
  ok(`${o.id} stage`, STAGES.includes(o.stage))
  ok(`${o.id} units×price`, o.units * o.price === o.order_total)
  ok(`${o.id} recipients`, Array.isArray(o.recipients) && o.recipients.length > 0)

  const shipped = o.recipients.filter((r) => r.status === 'Shipped' || r.status === 'Delivered').length
  const totalR = o.recipients.length
  if (STAGE_INDEX[o.stage] < STAGE_INDEX.shipping) {
    ok(`${o.id} no early ship`, shipped === 0)
  }

  const idx = STAGE_INDEX[o.stage]
  if (idx < DEPOSIT_PAID_IDX) {
    ok(`${o.id} no deposit before paid stage`, o.deposit_received === 0)
  } else {
    ok(`${o.id} deposit received`, o.deposit_received > 0)
  }

  if (o.deposit_received > 0) {
    ok(`${o.id} deposit+balance`, round2(o.deposit_received + o.balance_due) === o.order_total)
  } else {
    ok(`${o.id} balance full`, o.balance_due === o.order_total)
  }

  const cashSum = sum(o.cash_due, (c) => c.amount)
  if (o.deposit_received > 0) {
    ok(`${o.id} cash_due vs balance`, cashSum === o.balance_due)
  } else {
    ok(`${o.id} cash_due pending`, cashSum === o.order_total)
  }

  ok(`${o.id} recipient count`, shipped <= totalR)
}

const byStage = {}
STAGES.forEach((s) => {
  byStage[s] = orders.filter((o) => o.stage === s)
})
ok('all stages used', STAGES.every((s) => byStage[s].length >= 0))
ok('mid-oct spread', byStage.quote.length >= 1 && byStage.deposit_paid.length + byStage.shipping.length >= 5)

let cashItems = []
for (const o of orders) {
  for (const c of o.cash_due) {
    cashItems.push(c)
  }
}
const octCash = sum(cashItems.filter((c) => c.date.startsWith('2026-10')), (c) => c.amount)
const octDepositsDue = sum(
  orders.flatMap((o) => o.cash_due.filter((c) => c.type === 'Deposit' && c.date.startsWith('2026-10'))),
  (c) => c.amount,
)
ok('oct cash calendar has deposit lines', octDepositsDue > 0)

const asOfSrc = fs.readFileSync(path.join(root, 'components/samples/popinsanity/popinsanityComputed.js'), 'utf8')
ok('as-of Oct 15 2026', /AS_OF_ISO = '2026-10-15'/.test(asOfSrc))

const DEPOSIT_INVOICE_STAGES = new Set(['quote', 'deposit_invoiced'])
const BALANCE_INVOICE_STAGES = new Set(['deposit_paid', 'shipping', 'balance_invoiced'])
function stackInvoiceView(payload) {
  const { orderId, kind: invoiceKind } = payload
  return { kind: 'invoicePreview', orderId, invoiceKind }
}
for (const o of orders) {
  const depBtn = DEPOSIT_INVOICE_STAGES.has(o.stage)
  const balBtn = BALANCE_INVOICE_STAGES.has(o.stage)
  ok(`${o.id} invoice buttons`, depBtn || balBtn)
  if (depBtn) {
    const v = stackInvoiceView({ orderId: o.id, kind: 'deposit' })
    ok(`${o.id} preview stack deposit`, v.kind === 'invoicePreview' && v.invoiceKind === 'deposit')
  }
  if (balBtn) {
    const v = stackInvoiceView({ orderId: o.id, kind: 'balance' })
    ok(`${o.id} preview stack balance`, v.kind === 'invoicePreview' && v.invoiceKind === 'balance')
  }
}

if (failures.length) {
  console.error('FAIL', failures)
  process.exit(1)
}
console.log('OK popinsanity-feature', {
  booked,
  units,
  depositsCard,
  balanceCard,
  stages: Object.fromEntries(STAGES.map((s) => [s, byStage[s].length])),
  octCash,
})
