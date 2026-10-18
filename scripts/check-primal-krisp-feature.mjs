/**
 * Primal Krisp — Due to reorder feature totals.
 * Run: node scripts/check-primal-krisp-feature.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getDueToReorderStores,
  daysBetween,
  lineItemsTotal,
  salesSeptForStore,
  topStoreNames,
  septOrderAmountInHistory,
  storeWholesalePrice,
  reorderAsOf,
  round2,
} from '../components/samples/primal-krisp/primalKrispReorderData.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATA = JSON.parse(fs.readFileSync(path.join(root, 'data/primal-krisp.json'), 'utf8'))
const PK_REORDER_AS_OF = reorderAsOf(DATA)

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  return cond
}

const due = getDueToReorderStores(DATA)
ok('count 6-8', due.length >= 6 && due.length <= 8)
ok('overview card count', due.length === DATA.overview.due_to_reorder_count)

for (let i = 1; i < due.length; i++) {
  ok(`sort days_over ${due[i - 1].store_name}`, due[i - 1].days_over >= due[i].days_over)
}

const storeNames = new Set(DATA.stores.list.map((s) => s.name))
for (const st of due) {
  ok(`store exists ${st.store_name}`, storeNames.has(st.store_name))
  const ago = daysBetween(st.last_order_date, PK_REORDER_AS_OF)
  ok(`days ago ${st.store_name}`, ago === st.last_order_days_ago)
  ok(`past gap ${st.store_name}`, st.last_order_days_ago > st.usual_gap_days)
  ok(`days_over ${st.store_name}`, st.days_over === st.last_order_days_ago - st.usual_gap_days)

  const linesSum = lineItemsTotal(st.usual_order_lines)
  ok(`usual lines ${st.store_name}`, round2(linesSum) === round2(st.usual_order.amount))

  for (const ln of st.usual_order_lines) {
    const expected = round2(ln.bags * ln.unit_price)
    ok(`line math ${st.store_name} ${ln.flavor}`, round2(ln.line_total) === expected)
    const catalog = storeWholesalePrice(ln.flavor, DATA)
    const storeRow = DATA.stores.list.find((s) => s.name === st.store_name)
    const storeBag = storeRow?.sample?.price_per_bag
    if (catalog != null && Math.abs(ln.unit_price - catalog) > 0.02 && Math.abs(ln.unit_price - storeBag) > 0.02) {
      ok(`wholesale price ${st.store_name} ${ln.flavor}`, false)
    }
  }

  for (const o of st.order_history) {
    ok(
      `history bags ${st.store_name} ${o.date}`,
      o.bags > 0 && o.bags <= o.cases * DATA.due_to_reorder.bags_per_case,
    )
  }

  const top = topStoreNames(DATA)
  if (top.includes(st.store_name)) {
    const sales = salesSeptForStore(st.store_name, DATA)
    const septAmt = septOrderAmountInHistory(st)
    ok(`sept sales tie ${st.store_name}`, sales != null && round2(septAmt) === round2(sales))
  }
}

console.log('primal-krisp due to reorder', {
  as_of: PK_REORDER_AS_OF,
  count: due.length,
  stores: due.map((s) => s.store_name),
})

if (failures.length) {
  console.error('FAILURES:', failures)
  process.exit(1)
}
console.log('OK — all checks passed')
