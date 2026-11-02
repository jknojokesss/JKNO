import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { weldonCancelCandidate, WELDON_MIN_ORDER_DATE } from '../lib/weldonSyncBounds.js'

describe('weldonCancelCandidate', () => {
  const oldest = '2026-04-15'
  const newest = '2026-10-30'

  it('inside scrape window counts as candidate', () => {
    assert.equal(weldonCancelCandidate('2026-05-01', oldest, newest), true)
  })

  it('before scrape window is not a candidate', () => {
    assert.equal(weldonCancelCandidate('2026-04-01', oldest, newest), false)
    assert.equal(weldonCancelCandidate('2026-03-20', oldest, newest), false)
  })

  it('after scrape window is not a candidate', () => {
    assert.equal(weldonCancelCandidate('2026-11-15', oldest, newest), false)
  })

  it('before stocking min is never a candidate even if scrape window is wider', () => {
    assert.equal(weldonCancelCandidate('2026-03-20', '2026-01-01', newest), false)
    assert.equal(weldonCancelCandidate(WELDON_MIN_ORDER_DATE, '2026-01-01', newest), true)
  })
})
