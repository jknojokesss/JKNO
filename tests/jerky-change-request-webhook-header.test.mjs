import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeWebhookHeaderValue,
  parseJerkyChangeRequestWebhookHeader,
} from '../lib/jerkyChangeRequestWebhook.js'

describe('normalizeWebhookHeaderValue', () => {
  it('prepends Bearer for raw Authorization key', () => {
    assert.equal(normalizeWebhookHeaderValue('Authorization', 'raw-key'), 'Bearer raw-key')
  })

  it('keeps existing Bearer prefix', () => {
    assert.equal(normalizeWebhookHeaderValue('authorization', 'Bearer key'), 'Bearer key')
  })

  it('strips Authorization: prefix pasted into secret', () => {
    assert.equal(
      normalizeWebhookHeaderValue('Authorization', 'Authorization: Bearer key'),
      'Bearer key',
    )
  })

  it('strips surrounding quotes', () => {
    assert.equal(normalizeWebhookHeaderValue('Authorization', '"quoted-token"'), 'Bearer quoted-token')
  })

  it('collapses Bearer followed by multiple spaces', () => {
    assert.equal(normalizeWebhookHeaderValue('Authorization', 'Bearer    spaced'), 'Bearer spaced')
  })

  it('leaves non-Authorization header values untouched', () => {
    assert.equal(normalizeWebhookHeaderValue('X-Hook-Secret', 'abc123'), 'abc123')
    assert.equal(normalizeWebhookHeaderValue('X-Hook-Secret', '"abc123"'), 'abc123')
  })
})

describe('parseJerkyChangeRequestWebhookHeader', () => {
  it('defaults header name to Authorization and normalizes secret', () => {
    const p = parseJerkyChangeRequestWebhookHeader('', 'sekret')
    assert.equal(p.headerName, 'Authorization')
    assert.equal(p.headerValue, 'Bearer sekret')
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
    assert.equal(p.headerValue, 'Bearer plain-secret')
  })
})
