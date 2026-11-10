import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  buildConsignMetrics,
  buildDropReport,
  formatCalendarDate,
  isoDateOnly,
  CLOSE_CYCLE_NOTE,
} from '../lib/consignmentRecon.js'

const fixtures = JSON.parse(
  readFileSync(new URL('./fixtures/jerky-consign-stores.json', import.meta.url), 'utf8'),
)

describe('calendar dates', () => {
  it('isoDateOnly keeps YYYY-MM-DD from date column', () => {
    assert.equal(isoDateOnly('2026-11-09'), '2026-11-09')
    assert.equal(isoDateOnly('2026-11-09T03:32:00.000Z'), '2026-11-09')
  })

  it('formatCalendarDate does not shift calendar day', () => {
    assert.equal(formatCalendarDate('2026-11-01'), 'Nov 1')
    assert.equal(formatCalendarDate('2026-11-09'), 'Nov 9')
  })
})

describe('buildConsignMetrics — fixture stores', () => {
  it('Evergreen Lakewood: 231 on shelf, nothing sold or paid', () => {
    const c = fixtures.evergreen_lakewood
    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 231)
    assert.equal(m.soldUnpaid, 0)
    assert.equal(m.paidPieces, 0)
    assert.equal(m.totalDropped, 231)
    const drops = buildDropReport(c)
    assert.equal(drops.length, 2)
    assert.deepEqual(drops.map((d) => d.dateIso), ['2026-11-01', '2026-11-09'])
  })

  it('Evergreen Monsey: count implies sold unpaid, shelf matches count', () => {
    const c = fixtures.evergreen_monsey
    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 59)
    assert.equal(m.soldUnpaid, 116)
    assert.equal(m.paidPieces, 0)
    assert.equal(m.totalDropped, 175)
  })

  it('close cycle stops old drops from affecting shelf', () => {
    const c = fixtures.cycle_reset_store
    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 62, 'opening 12 after close plus 50 new drop')
    assert.equal(m.totalDropped, 50)
    assert.equal(m.soldUnpaid, 0)
    assert.match(c.log[0].t, CLOSE_CYCLE_NOTE)
  })

  it('payment beyond sold unpaid adds implied sold', () => {
    const c = {
      price: 5,
      sent: 100,
      returned: 0,
      paid: 400,
      counted: null,
      log: [
        { atIso: '2026-11-01', t: 'Dropped off 100 pieces on 2026-11-01 (drop-off)' },
        { atIso: '2026-12-03', t: 'Paid 2026-12-03: $400.00 for 80 pieces' },
      ],
    }
    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 20)
    assert.equal(m.soldUnpaid, 0)
    assert.equal(m.paidPieces, 80)
    assert.equal(m.sold, 80)
  })
})
