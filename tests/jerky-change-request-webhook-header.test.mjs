import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseJerkyChangeRequestWebhookHeader } from '../lib/jerkyChangeRequestWebhook.js'

describe('parseJerkyChangeRequestWebhookHeader', () => {
  it('defaults header name to Authorization', () => {
    const p = parseJerkyChangeRequestWebhookHeader('', 'sekret')
    assert.equal(p.headerName, 'Authorization')
    assert.equal(p.headerValue, 'sekret')
  })

  it('uses bare header name with separate secret', () => {
    const p = parseJerkyChangeRequestWebhookHeader('X-Hook-Secret', 'abc123')
    assert.equal(p.headerName, 'X-Hook-Secret')
    assert.equal(p.headerValue, 'abc123')
  })

  it('splits combined Authorization: Bearer xyz line', () => {
    const p = parseJerkyChangeRequestWebhookHeader('Authorization: Bearer tok_xyz', 'ignored')
    assert.equal(p.headerName, 'Authorization')
    assert.equal(p.headerValue, 'Bearer tok_xyz')
  })

  it('splits name when value only in secret env', () => {
    const p = parseJerkyChangeRequestWebhookHeader('Authorization:', 'plain-secret')
    assert.equal(p.headerName, 'Authorization')
    assert.equal(p.headerValue, 'plain-secret')
  })
})
