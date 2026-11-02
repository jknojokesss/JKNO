import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  orderedAtFromOrderDateCell,
  nyLocalOrderedAtToTimestamptz,
  parseTime12To24,
} from '../lib/weldonOrderedAt.js'

describe('orderedAtFromOrderDateCell', () => {
  it('parses date and time with newline between', () => {
    assert.equal(orderedAtFromOrderDateCell('10/30/2026\n3:02:45 PM'), '2026-10-30T15:02:45')
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
})

describe('parseTime12To24', () => {
  it('handles AM/PM edge cases', () => {
    assert.equal(parseTime12To24('12', '05', '00', 'AM'), '00:05:00')
    assert.equal(parseTime12To24('12', '30', '00', 'PM'), '12:30:00')
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
})
