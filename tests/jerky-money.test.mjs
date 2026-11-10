import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatJerkyMoney } from '../lib/jerkyMoney.js'

describe('formatJerkyMoney', () => {
  it('formats zero as $0', () => {
    assert.equal(formatJerkyMoney(0), '$0')
    assert.equal(formatJerkyMoney(-0), '$0')
  })
  it('always uses two decimals for nonzero amounts', () => {
    assert.equal(formatJerkyMoney(1207.5), '$1,207.50')
    assert.equal(formatJerkyMoney(11.5), '$11.50')
    assert.equal(formatJerkyMoney(400), '$400.00')
  })
})
