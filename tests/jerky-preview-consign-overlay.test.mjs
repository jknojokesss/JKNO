import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { readFileSync } from 'node:fs'
import { buildConsignMetrics, buildActivityLedger } from '../lib/consignmentRecon.js'
import {
  mergeJerkyPreviewConsignOverlays,
  JERKY_PREVIEW_CONSIGN_LOG_OVERLAYS,
} from '../lib/jerkyPreviewConsignOverlay.js'

const FIXTURE = JSON.parse(
  readFileSync(new URL('./fixtures/jerky-consign-stores.json', import.meta.url), 'utf8'),
)
const EVERGREEN_ID = '9d5a29f5-b90d-4766-ab3f-4f0fed00d22e'

describe('jerky preview consign overlay', () => {
  let prev
  before(() => {
    prev = process.env.NEXT_PUBLIC_JERKY_CONSIGN_PREVIEW_OVERLAY
    process.env.NEXT_PUBLIC_JERKY_CONSIGN_PREVIEW_OVERLAY = '1'
  })
  after(() => {
    process.env.NEXT_PUBLIC_JERKY_CONSIGN_PREVIEW_OVERLAY = prev
  })

  it('Evergreen Lakewood with preview sold log shows 126 on shelf, 105 sold unpaid', () => {
    assert.ok(JERKY_PREVIEW_CONSIGN_LOG_OVERLAYS[EVERGREEN_ID])
    const base = { id: EVERGREEN_ID, ...FIXTURE.stores.evergreen_lakewood }
    const c = mergeJerkyPreviewConsignOverlays(base)
    const m = buildConsignMetrics(c)
    assert.equal(m.onShelf, 126)
    assert.equal(m.soldUnpaid, 105)
    assert.equal(m.paidPieces, 0)
    assert.equal(m.totalDropped, 231)
    const ledger = buildActivityLedger(c)
    const soldRow = ledger.find((r) => r.type === 'sold' && r.pieces === 105)
    assert.ok(soldRow)
    assert.equal(soldRow.label, 'Sold 105')
    assert.equal(soldRow.dateIso, '2026-11-09')
  })
})
