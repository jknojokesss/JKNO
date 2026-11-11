import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { jerkyAdminAuthFromRequest } from '../lib/jerkyAdminAuth.js'

describe('jerkyAdminAuthFromRequest', () => {
  let prev

  beforeEach(() => {
    prev = process.env.JERKY_ADMIN_TOKEN
    process.env.JERKY_ADMIN_TOKEN = 'test-admin-token-9f3a'
  })

  afterEach(() => {
    process.env.JERKY_ADMIN_TOKEN = prev
  })

  it('rejects missing bearer', () => {
    const r = jerkyAdminAuthFromRequest({ headers: {} })
    assert.equal(r.ok, false)
  })

  it('rejects wrong bearer', () => {
    const r = jerkyAdminAuthFromRequest({ headers: { authorization: 'Bearer wrong' } })
    assert.equal(r.ok, false)
  })

  it('accepts matching bearer', () => {
    const r = jerkyAdminAuthFromRequest({ headers: { authorization: 'Bearer test-admin-token-9f3a' } })
    assert.equal(r.ok, true)
  })

  it('rejects when admin token env is unset', () => {
    delete process.env.JERKY_ADMIN_TOKEN
    const r = jerkyAdminAuthFromRequest({ headers: { authorization: 'Bearer anything' } })
    assert.equal(r.ok, false)
  })
})
