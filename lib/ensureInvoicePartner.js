// Idempotent invoice-store row for a QuickBooks customer (server-only).
export async function ensureInvoicePartner(db, { qbCustomerId, displayName }) {
  const id = String(qbCustomerId || '').trim()
  const name = String(displayName || '').trim()
  if (!id || !name) throw new Error('QuickBooks customer id and name are required.')

  const { data: byQb } = await db.from('consignment_partners').select('id').eq('qb_customer_id', id).maybeSingle()
  if (byQb?.id) return byQb.id

  const { data: byNameRows } = await db.from('consignment_partners').select('id, store, qb_customer_id').ilike('store', name)
  const byName = (byNameRows || []).find((r) => String(r.store || '').trim().toLowerCase() === name.toLowerCase())
  if (byName?.id) {
    if (!byName.qb_customer_id) {
      await db.from('consignment_partners').update({ qb_customer_id: id }).eq('id', byName.id)
    }
    return byName.id
  }

  const row = {
    store: name,
    type: 'invoice',
    qb_customer_id: id,
    price: 0,
    sent: 0,
    returned: 0,
    paid: 0,
    counted: null,
    cycle: 1,
    restock: 'good',
  }
  const { data: inserted, error } = await db.from('consignment_partners').insert(row).select('id').maybeSingle()
  if (!error && inserted?.id) return inserted.id

  const { data: retry } = await db.from('consignment_partners').select('id').eq('qb_customer_id', id).maybeSingle()
  if (retry?.id) return retry.id
  const { data: retryName } = await db.from('consignment_partners').select('id, store').ilike('store', name)
  const again = (retryName || []).find((r) => String(r.store || '').trim().toLowerCase() === name.toLowerCase())
  if (again?.id) return again.id

  throw new Error(error?.message || 'Could not create the invoice store record.')
}
