import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isNyLocalOrderedAt,
  orderedAtFromOrderDateCell,
  nyLocalOrderedAtToTimestamptz,
  parseTime12To24,
} from '../lib/weldonOrderedAt.js'

describe('orderedAtFromOrderDateCell', () => {
  it('parses date and time with newline between', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026\n3:02:45 PM'), '2026-10-30T15:02:45')
  })

  it('parses DOMParser glued date+time (no separator)', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/20263:02:45 PM'), '2026-10-30T15:02:45')
    assert.equal(orderedAtFromOrderDateCell('10/30/20261:23:31 PM'), '2026-10-30T13:23:31')
    assert.equal(orderedAtFromOrderDateCell('10/30/202610:05:00 AM'), '2026-10-30T10:05:00')
  })

  it('parses spaced and short date forms', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026 3:02:45 PM'), '2026-10-30T15:02:45')
    assert.equal(orderedAtFromOrderDateCell('4/2/2026\n9:00:00 AM'), '2026-04-02T09:00:00')
    assert.equal(orderedAtFromOrderDateCell('4/2/2026 9:00:00 AM'), '2026-04-02T09:00:00')
  })

  it('parses midnight', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026 12:05:00 AM'), '2026-10-30T00:05:00')
  })

  it('parses noon', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026 12:30:00 PM'), '2026-10-30T12:30:00')
  })

  it('returns null when time missing', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026'), null)
  })

  it('returns null for invalid 12h clock tail', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026 0:05:00 AM'), null)
    assert.equal(orderedAtFromOrderDateCell('10/30/2026 13:00:00 PM'), null)
  })
})

describe('parseTime12To24', () => {
  it('handles AM/PM edge cases', () => {
    assert.equal(parseTime12To24('12', '05', '00', 'AM'), '00:05:00')
    assert.equal(parseTime12To24('12', '30', '00', 'PM'), '12:30:00')
  })
})

describe('isNyLocalOrderedAt', () => {
  it('accepts valid 24h local strings', () => {
    assert.equal(isNyLocalOrderedAt('2026-10-30T15:02:45'), true)
    assert.equal(isNyLocalOrderedAt('2026-10-30T00:05:00'), true)
  })

  it('rejects out-of-range clock fields', () => {
    assert.equal(isNyLocalOrderedAt('2026-10-30T25:00:00'), false)
    assert.equal(isNyLocalOrderedAt('2026-10-30T12:60:00'), false)
    assert.equal(isNyLocalOrderedAt('2026-10-30T12:00:60'), false)
  })
})

describe('nyLocalOrderedAtToTimestamptz', () => {
  it('EDT (October)', () => {
    assert.equal(
      nyLocalOrderedAtToTimestamptz('2026-10-30T15:02:45'),
      '2026-10-30T19:02:45.000Z',
    )
  })

  it('EST (January)', () => {
    assert.equal(
      nyLocalOrderedAtToTimestamptz('2026-01-15T12:00:00'),
      '2026-01-15T17:00:00.000Z',
    )
  })

  it('rejects invalid local strings', () => {
    assert.equal(nyLocalOrderedAtToTimestamptz('2026-10-30T75:02:45'), null)
  })
})
