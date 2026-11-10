import { readFileSync } from 'node:fs'
import { buildConsignMetrics } from '../lib/consignmentRecon.js'

const fixtures = JSON.parse(
  readFileSync(new URL('../tests/fixtures/jerky-consign-stores.json', import.meta.url), 'utf8'),
)

console.log('| Store | On shelf | Sold, not paid | Paid | Dropped (cycle) |')
console.log('|-------|----------|----------------|------|-----------------|')
for (const c of Object.values(fixtures.stores)) {
  const m = buildConsignMetrics(c)
  console.log(
    `| ${c.store} | ${m.onShelf} | ${m.soldUnpaid} | ${m.paidPieces} | ${m.totalDropped} |`,
  )
}
