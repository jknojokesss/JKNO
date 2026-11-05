import test from 'node:test'
import assert from 'node:assert/strict'
import { roasMultiplier, roasLabel } from '../lib/jerkyRoas.js'

test('roasMultiplier returns null when spend is zero', () => {
  assert.equal(roasMultiplier(0, 100), null)
  assert.equal(roasMultiplier('', 50), null)
})

test('roasMultiplier divides when spend is positive', () => {
  assert.equal(roasMultiplier(200, 480), 2.4)
})

test('roasLabel avoids NaN wording', () => {
  assert.equal(roasLabel(0, 0), 'enter spend to see return')
  assert.equal(roasLabel(100, 250), '2.5x overall')
})
