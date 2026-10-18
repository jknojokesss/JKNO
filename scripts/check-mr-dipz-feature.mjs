/**
 * Asserts Mr. Dipz distributor-deductions feature ties to the rest of the sample.
 */
import { buildMrDipzModel } from '../components/samples/mrDipz/mrDipzUtils.js'
import { DISTRIBUTOR_DEDUCTIONS, DEDUCTION_AS_OF } from '../components/samples/mrDipz/mrDipzDeductionsData.js'

const failures = []
const ok = (label, cond, detail = '') => {
  if (!cond) failures.push(`${label}${detail ? `: ${detail}` : ''}`)
}

const m = buildMrDipzModel()
const d = m.deductions
const cents = (n) => Math.round(n * 100)

ok('row count 14-18', d.rows.length >= 14 && d.rows.length <= 18, String(d.rows.length))

const rowSum = d.rows.reduce((t, r) => t + r.amount, 0)
ok('rows sum to total deducted', rowSum === d.summary.total, `${rowSum} vs ${d.summary.total}`)

ok(
  'status buckets sum to total',
  d.summary.matched + d.summary.needsBackup + d.summary.dispute === d.summary.total,
)

ok('open review', d.openReview === d.summary.needsBackup + d.summary.dispute)

for (const r of d.rows) {
  ok(`${r.ref} invoice − paid`, r.invoiceAmount - r.paidAmount === r.amount)
  ok(`${r.ref} days left`, r.daysLeft >= 0 && r.daysLeft <= 90, String(r.daysLeft))
  const refMatch = r.ref.match(/^RD-(\d{6})-\d{2}$/)
  if (refMatch) {
    const yymmdd = refMatch[1]
    const iso = `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`
    ok(`${r.ref} remit date`, iso === r.remittanceDate, iso)
  } else {
    ok(`${r.ref} format`, false)
  }
}

const rawRows = DISTRIBUTOR_DEDUCTIONS.length
ok('data rows match model', rawRows === d.rows.length)

const sepExpired = d.rows
  .filter((r) => r.code === 'Expired' && r.invoiceDate.startsWith('2026-09'))
  .reduce((t, r) => t + r.amount, 0)
ok('September Expired deductions = September credits', sepExpired === m.totals.credits, `${sepExpired} vs ${m.totals.credits}`)

for (const row of m.expiredByFlavor) {
  const p = m.productAgg[row.productId]
  ok(`flavor ${row.name} sold`, row.sold === p.units)
  ok(`flavor ${row.name} expired`, row.expired === p.expUnits)
  ok(`flavor ${row.name} credits`, row.credits === p.credits)
}

const flavorSold = m.expiredByFlavor.reduce((t, r) => t + r.sold, 0)
const flavorExp = m.expiredByFlavor.reduce((t, r) => t + r.expired, 0)
ok('flavor sold sum', flavorSold === m.totals.units)
ok('flavor expired sum', flavorExp === m.totals.expUnits)

const minRemit = d.rows.reduce((a, r) => (r.remittanceDate < a ? r.remittanceDate : a), '9999')
const maxRemit = d.rows.reduce((a, r) => (r.remittanceDate > a ? r.remittanceDate : a), '')
ok('remit window ~90d', minRemit >= '2026-07-17' && maxRemit <= DEDUCTION_AS_OF)

for (const raw of DISTRIBUTOR_DEDUCTIONS) {
  const built = d.byId[raw.id]
  ok(`${raw.id} amount`, built.amount === cents(raw.invoiceAmount) - cents(raw.paidAmount))
}

if (failures.length) {
  console.error('check-mr-dipz-feature FAILED:\n', failures.join('\n'))
  process.exit(1)
}
console.log('check-mr-dipz-feature OK', {
  rows: d.rows.length,
  totalDeducted: d.summary.total / 100,
  sepExpired: sepExpired / 100,
  credits: m.totals.credits / 100,
  openReview: d.openReview / 100,
})
