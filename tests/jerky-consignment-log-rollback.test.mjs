import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  partnerPatchForDeletedLog,
  partnerStateAfterLogDelete,
  partnerStateAfterLogReplace,
  formatDropLogNote,
  formatPayLogNote,
  formatPickupLogNote,
  formatStartingCountLogNote,
  formatCountLogNote,
  countFieldsFromLog,
  recon,
  startingPieces,
  expectedOnShelf,
  consignStoreRenameError,
} from '../lib/consignmentRecon.js'

const basePartner = {
  price: 4.5,
  sent: 150,
  returned: 5,
  paid: 360,
  counted: 20,
  countedDate: '2026-12-10',
}

describe('partnerPatchForDeletedLog', () => {
  it('rolls back drop-off from sent', () => {
    const entry = { t: 'Dropped off 50 pieces on 2026-11-01 (drop-off)', atIso: '2026-11-01' }
    assert.deepEqual(partnerPatchForDeletedLog(basePartner, entry), { sent: 100 })
  })

  it('rolls back payment from paid', () => {
    const entry = { t: 'Paid 2026-12-03: $360.00 for 80 pieces', atIso: '2026-12-03' }
    assert.deepEqual(partnerPatchForDeletedLog(basePartner, entry), { paid: 0 })
  })

  it('rolls back pickup from returned', () => {
    const entry = { t: 'Picked up 5 bags on 2026-12-01', atIso: '2026-12-01' }
    assert.deepEqual(partnerPatchForDeletedLog(basePartner, entry), { returned: 0 })
  })

  it('starting count log does not change stored totals', () => {
    const entry = { t: 'Starting count 40 on 2026-11-01', atIso: '2026-11-01' }
    assert.deepEqual(partnerPatchForDeletedLog(basePartner, entry), {})
  })
})

describe('countFieldsFromLog', () => {
  it('clears counted when no count logs remain', () => {
    assert.deepEqual(countFieldsFromLog([]), { counted: null, countedDate: '' })
  })

  it('uses latest count log by date', () => {
    const log = [
      { t: 'Counted 15 on shelf (Nov 5)', atIso: '2026-11-05' },
      { t: 'Counted 20 on shelf (Dec 10)', atIso: '2026-12-10' },
    ]
    assert.deepEqual(countFieldsFromLog(log), { counted: 20, countedDate: '2026-12-10' })
  })
})

describe('partnerStateAfterLogDelete', () => {
  it('recomputes counted after deleting a count entry', () => {
    const log = [
      { t: 'Counted 15 on shelf (Nov 5)', atIso: '2026-11-05' },
      { t: 'Counted 20 on shelf (Dec 10)', atIso: '2026-12-10' },
    ]
    const deleted = log[1]
    const remaining = [log[0]]
    assert.deepEqual(partnerStateAfterLogDelete(basePartner, deleted, remaining), {
      counted: 15,
      countedDate: '2026-11-05',
    })
  })

  it('expected on shelf updates after drop delete (derived)', () => {
    const c = {
      price: 5,
      sent: 100,
      returned: 0,
      paid: 400,
      counted: null,
      log: [
        { t: 'Dropped off 100 pieces on 2026-11-01 (stocked shelf)', atIso: '2026-11-01' },
        { t: 'Paid 2026-12-03: $400.00 for 80 pieces', atIso: '2026-12-03' },
      ],
    }
    assert.equal(recon(c).expected, 20)
    const entry = c.log[0]
    const patch = partnerPatchForDeletedLog(c, entry)
    const after = { ...c, ...patch, log: [c.log[1]] }
    assert.equal(expectedOnShelf(after), 0)
    assert.equal(recon(after).expected, 0)
  })

  it('editing drop adjusts sent by the delta only', () => {
    const partner = { ...basePartner, sent: 150 }
    const oldEntry = { logId: 'a', t: formatDropLogNote(50, '2026-11-01'), atIso: '2026-11-01' }
    const newEntry = { logId: 'a', t: formatDropLogNote(42, '2026-11-02'), atIso: '2026-11-02' }
    const updatedLog = [newEntry]
    assert.deepEqual(partnerStateAfterLogReplace({ ...partner, log: [oldEntry] }, oldEntry, newEntry, updatedLog), { sent: 142 })
  })

  it('editing payment adjusts paid by the delta only', () => {
    const partner = { ...basePartner, paid: 360, price: 4.5 }
    const oldEntry = { logId: 'p', t: formatPayLogNote('2026-12-03', '$360', 80), atIso: '2026-12-03' }
    const newEntry = { logId: 'p', t: formatPayLogNote('2026-12-04', '$400', 89), atIso: '2026-12-04' }
    const updatedLog = [newEntry]
    assert.deepEqual(partnerStateAfterLogReplace({ ...partner, log: [oldEntry] }, oldEntry, newEntry, updatedLog), { paid: 400 })
  })

  it('editing pickup adjusts returned by the delta only', () => {
    const partner = { ...basePartner, returned: 5 }
    const oldEntry = { logId: 'u', t: formatPickupLogNote(5, '2026-12-01'), atIso: '2026-12-01' }
    const newEntry = { logId: 'u', t: formatPickupLogNote(3, '2026-12-02'), atIso: '2026-12-02' }
    const updatedLog = [newEntry]
    assert.deepEqual(partnerStateAfterLogReplace({ ...partner, log: [oldEntry] }, oldEntry, newEntry, updatedLog), { returned: 3 })
  })

  it('editing starting count leaves stored totals unchanged', () => {
    const partner = { price: 4.5, sent: 100, returned: 0, paid: 360, counted: null, log: [] }
    const oldEntry = { logId: 's', t: formatStartingCountLogNote(40, '2026-11-01'), atIso: '2026-11-01' }
    const newEntry = { logId: 's', t: formatStartingCountLogNote(35, '2026-11-01'), atIso: '2026-11-01' }
    const updatedLog = [newEntry]
    assert.deepEqual(partnerStateAfterLogReplace({ ...partner, log: [oldEntry] }, oldEntry, newEntry, updatedLog), {})
    assert.equal(startingPieces({ ...partner, log: updatedLog }), 35)
  })

  it('editing shelf count updates counted from the log', () => {
    const partner = { ...basePartner }
    const oldEntry = { logId: 'c', t: formatCountLogNote(20, 'Dec 10'), atIso: '2026-12-10' }
    const newEntry = { logId: 'c', t: formatCountLogNote(18, 'Dec 11'), atIso: '2026-12-11' }
    const updatedLog = [newEntry]
    assert.deepEqual(partnerStateAfterLogReplace({ ...partner, log: [oldEntry] }, oldEntry, newEntry, updatedLog), {
      counted: 18,
      countedDate: '2026-12-11',
    })
  })

  it('starting count delete changes derived baseline only', () => {
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
    const after = { ...c, log: c.log.slice(1) }
    assert.equal(startingPieces(after), 0)
    assert.equal(recon(after).expected, 20)
  })
})

describe('consignStoreRenameError', () => {
  const partners = [
    { id: 'a', store: 'Sunrise Natural' },
    { id: 'b', store: 'Exxon Madison' },
  ]

  it('rejects blank names', () => {
    assert.equal(consignStoreRenameError('   ', 'a', partners), 'Store name cannot be blank.')
  })

  it('rejects duplicate names case-insensitively', () => {
    assert.equal(consignStoreRenameError('exxon madison', 'a', partners), 'Another store already uses that name.')
    assert.equal(consignStoreRenameError('EXXON MADISON', 'a', partners), 'Another store already uses that name.')
  })

  it('allows keeping the same store name', () => {
    assert.equal(consignStoreRenameError('Sunrise Natural', 'a', partners), null)
    assert.equal(consignStoreRenameError('  sunrise natural  ', 'a', partners), null)
  })

  it('allows a new unique name', () => {
    assert.equal(consignStoreRenameError('New Corner Market', 'a', partners), null)
  })
})
