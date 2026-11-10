import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildActivityLedger, buildConsignMetrics } from '../lib/consignmentRecon.js'

describe('same calendar-day log ordering', () => {
  it('replays drop before sold when at matches but created_at is earlier', () => {
    const c = {
      price: 11.5,
      sent: 231,
      returned: 0,
      paid: 0,
      log: [
        {
          atIso: '2026-11-01',
          t: 'Dropped off 105 pieces on 2026-11-01 (stocked shelf)',
          createdAt: '2026-11-01T12:00:00.000Z',
        },
        {
          atIso: '2026-11-09',
          t: 'Dropped off 126 pieces on 2026-11-09 (drop-off)',
          createdAt: '2026-11-10T03:32:00.000Z',
        },
        {
          atIso: '2026-11-09',
          t: 'Sold 105 pieces on 2026-11-09',
          createdAt: '2026-11-10T19:05:00.000Z',
        },
      ],
    }
    const rows = buildActivityLedger(c)
    const nov9 = rows.filter((r) => r.dateIso === '2026-11-09')
    assert.equal(nov9.length, 2)
    assert.equal(nov9[0].label, 'Dropped off 126')
    assert.equal(nov9[0].onShelf, 231)
    assert.equal(nov9[1].label, 'Sold 105')
    assert.equal(nov9[1].onShelf, 126)
    assert.equal(nov9[1].soldUnpaid, 105)

    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 126)
    assert.equal(m.soldUnpaid, 105)
  })
})
