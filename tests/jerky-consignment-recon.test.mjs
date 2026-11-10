import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  recon,
  activitySinceLastCount,
  missingSummary,
  STORE_OWES_DIAGNOSIS,
  buildActivityLedger,
  safeOnShelf,
  hasDropActivity,
  hasShelfBooks,
  startingPieces,
  paymentPiecesFromCheck,
  consignTotalsLine,
  formatDropLogNote,
  partnerDeliveryMode,
  consignVerbs,
} from '../lib/consignmentRecon.js'

describe('paymentPiecesFromCheck', () => {
  it('computes even and uneven piece counts from check and price', () => {
    assert.deepEqual(paymentPiecesFromCheck(360, 4.5), { exact: 80, rounded: 80, even: true })
    const uneven = paymentPiecesFromCheck(360, 4.52)
    assert.ok(Math.abs(uneven.exact - 79.646) < 0.01)
    assert.equal(uneven.rounded, 80)
    assert.equal(uneven.even, false)
    assert.equal(paymentPiecesFromCheck(0, 4.5), null)
    assert.equal(paymentPiecesFromCheck(100, 0), null)
  })
})

describe('safeOnShelf / hasDropActivity', () => {
  it('safeOnShelf coerces invalid numbers to zero', () => {
    assert.equal(safeOnShelf(NaN), 0)
    assert.equal(safeOnShelf(undefined), 0)
    assert.equal(safeOnShelf(-3), 0)
    assert.equal(safeOnShelf(20), 20)
  })

  it('hasDropActivity is false with empty store', () => {
    assert.equal(hasDropActivity({ sent: 0, log: [] }), false)
    assert.equal(hasDropActivity({ sent: 5, log: [] }), true)
  })
})

describe('recon', () => {
  it('without shelf count tracks expected on shelf, no variance', () => {
    const r = recon({ price: 5, sent: 100, returned: 0, paid: 400, counted: null, log: [
      { t: 'Dropped off 100 pieces on 2026-11-01 (stocked shelf)', atIso: '2026-11-01' },
      { t: 'Paid 2026-12-03: $400.00 for 80 pieces', atIso: '2026-12-03' },
    ] })
    assert.equal(r.status, 'tracking')
    assert.equal(r.expected, 20)
    assert.equal(r.variance, 0)
    assert.equal(r.asOfDate, '2026-12-03')
  })

  it('variance only when count is on or after latest activity', () => {
    const base = { price: 5, sent: 100, returned: 0, paid: 400, log: [
      { t: 'Dropped off 100 pieces on 2026-11-01 (stocked shelf)', atIso: '2026-11-01' },
      { t: 'Paid 2026-12-03: $400.00 for 80 pieces', atIso: '2026-12-03' },
    ] }
    assert.equal(recon({ ...base, counted: 15, countedDate: '2026-11-15' }).status, 'tracking')
    const r = recon({ ...base, counted: 15, countedDate: '2026-12-03' })
    assert.equal(r.status, 'short')
    assert.equal(r.variance, 5)
  })

  it('legacy row overpay surfaces as over count, not a negative shelf badge', () => {
    const r = recon({ price: 5, sent: 5, returned: 0, paid: 50, counted: 3, countedDate: '2026-12-01', log: [] })
    assert.equal(r.expected, 3)
    assert.equal(r.status, 'over')
    assert.equal(r.variance, -3)
  })
})

describe('starting count', () => {
  it('baseline then drop-off and payment yields on shelf without affecting sent/paid totals', () => {
    const c = {
      price: 4.5,
      sent: 100,
      returned: 0,
      paid: 360,
      counted: null,
      log: [
        { t: 'Starting count 40 on 2026-11-01', atIso: '2026-11-01' },
        { t: 'Dropped off 100 pieces on 2026-11-02 (stocked shelf)', atIso: '2026-11-02' },
        { t: 'Paid 2026-12-03: $360.00 for 80 pieces', atIso: '2026-12-03' },
      ],
    }
    assert.equal(startingPieces(c), 40)
    assert.equal(hasDropActivity(c), true)
    assert.equal(hasShelfBooks(c), true)
    const r = recon(c)
    assert.equal(r.status, 'tracking')
    assert.equal(r.expected, 60)
    assert.equal(r.variance, 0)
    const ledger = buildActivityLedger(c)
    assert.equal(ledger[0].label, 'Starting count 40')
    assert.equal(ledger[0].onShelf, 40)
    assert.equal(ledger[ledger.length - 1].onShelf, 60)
  })
})

describe('delivery mode copy', () => {
  it('formats ship log notes and ledger labels', () => {
    assert.match(formatDropLogNote(97, '2026-11-03', 'ship'), /^Shipped 97/)
    const rows = buildActivityLedger({
      deliveryMode: 'ship',
      sent: 97,
      returned: 0,
      paid: 0,
      price: 4.5,
      log: [
        { t: 'Starting count 10 on 2026-11-01', atIso: '2026-11-01' },
        { t: 'Shipped 97 pieces on 2026-11-03 (shipment)', atIso: '2026-11-03' },
      ],
    })
    assert.equal(rows[1].label, 'Shipped 97')
    assert.equal(partnerDeliveryMode({ deliveryMode: 'ship' }), 'ship')
    assert.equal(consignVerbs('ship').emptySent, 'No shipments yet')
  })

  it('consignTotalsLine shows starting count with shipped total', () => {
    const c = {
      deliveryMode: 'ship',
      sent: 97,
      returned: 0,
      paid: 0,
      log: [
        { t: 'Starting count 10 on 2026-11-01', atIso: '2026-11-01' },
        { t: 'Shipped 97 pieces on 2026-11-03 (shipment)', atIso: '2026-11-03' },
      ],
    }
    const line = consignTotalsLine(c, 0, '$0')
    assert.match(line, /starting 10/)
    assert.match(line, /shipped 97/)
  })
})

describe('buildActivityLedger', () => {
  it('runs on-shelf balance for drop then pay', () => {
    const rows = buildActivityLedger({
      sent: 100,
      returned: 0,
      paid: 400,
      price: 5,
      log: [
        { t: 'Dropped off 100 pieces on 2026-11-01 (stocked shelf)', atIso: '2026-11-01' },
        { t: 'Paid 2026-12-03: $400.00 for 80 pieces', atIso: '2026-12-03' },
      ],
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[0].onShelf, 100)
    assert.equal(rows[1].onShelf, 20)
  })
})

describe('missingSummary', () => {
  it('sums bags and splits confirmed owed from other gaps', () => {
    const rows = [
      { ...recon({ price: 5, sent: 18, returned: 0, paid: 25, counted: 8, countedDate: '2026-12-03', log: [] }), diagnosis: STORE_OWES_DIAGNOSIS, store: 'A' },
      { ...recon({ price: 5, sent: 10, returned: 0, paid: 0, counted: 7, countedDate: '2026-12-03', log: [] }), diagnosis: '', store: 'B' },
    ]
    const m = missingSummary(rows)
    assert.equal(m.bags, 8)
    assert.equal(m.unaccountedVal, 40)
    assert.equal(m.stores, 2)
    assert.equal(m.owedBags, 5)
    assert.equal(m.owedVal, 25)
  })

  it('ignores tracking-only stores', () => {
    const rows = [{ ...recon({ price: 5, sent: 20, returned: 0, paid: 0, counted: null }), store: 'X' }]
    const m = missingSummary(rows)
    assert.equal(m.bags, 0)
  })
})

describe('activitySinceLastCount', () => {
  it('parses exact check amounts from money() notes', () => {
    const log = [
      { t: 'Paid 2026-12-01: $12.50 for 3 pieces' },
      { t: 'Counted 8 on shelf (Nov 1)' },
    ]
    const { paidUnits } = activitySinceLastCount(log, 5)
    assert.equal(paidUnits, 3)
  })

  it('still parses legacy rounded check notes', () => {
    const log = [
      { t: 'Check received $13' },
      { t: 'Counted 5 on shelf' },
    ]
    const { paidUnits } = activitySinceLastCount(log, 5)
    assert.equal(paidUnits, 3)
  })
})
