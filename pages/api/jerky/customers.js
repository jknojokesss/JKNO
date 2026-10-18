// GET /api/jerky/customers — QuickBooks customers (read-only).
// Default: all customers [{ id, name, email }] for store Link / datalist.
// ?active=1: active only [{ id, name, email, balance, hasInvoice }] for Invoice Stores (~15 min cache per realm).
import { qboGet } from '../../../lib/qbo'
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs, fetchActiveCustomerRefs } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

const MINOR_VERSION = '75'
const QB_READ_TTL_MS = 15 * 60 * 1000
const invoicedCustomerCache = new Map()
const allCustomersCache = new Map()
const activeCustomersCache = new Map()

/** Customer ids that appear on at least one QBO Invoice (not sales receipts). */
async function fetchInvoicedCustomerIds(env, accessToken, realmId, { force = false } = {}) {
  const hit = invoicedCustomerCache.get(realmId)
  if (!force && hit && Date.now() - hit.at < QB_READ_TTL_MS) return hit.ids

  const ids = new Set()
  for (let start = 1; ; start += 1000) {
    const q = `select CustomerRef from Invoice startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
    const batch = (json.QueryResponse && json.QueryResponse.Invoice) || []
    for (const row of batch) {
      const ref = row.CustomerRef && row.CustomerRef.value
      if (ref != null && ref !== '') ids.add(String(ref))
    }
    if (batch.length < 1000) break
  }
  invoicedCustomerCache.set(realmId, { at: Date.now(), ids })
  return ids
}

export default async function handler(req, res) {
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })
  try {
    const { env, token, realmId } = await getLiveToken('jerky')
    const force = req.query.force === '1' || req.query.force === 'true'
    const activeOnly = req.query.active === '1' || req.query.active === 'true'
    if (!activeOnly) {
      const hit = allCustomersCache.get(realmId)
      if (!force && hit && Date.now() - hit.at < QB_READ_TTL_MS) {
        return res.status(200).json({ customers: hit.customers })
      }
      const customers = (await fetchCustomerRefs(env, token, realmId))
        .map((c) => ({ ...c, id: String(c.id) }))
        .sort((a, b) => a.name.localeCompare(b.name))
      allCustomersCache.set(realmId, { at: Date.now(), customers })
      return res.status(200).json({ customers })
    }

    const hit = activeCustomersCache.get(realmId)
    if (!force && hit && Date.now() - hit.at < QB_READ_TTL_MS) {
      return res.status(200).json({ customers: hit.customers })
    }
    const invoicedIds = await fetchInvoicedCustomerIds(env, token, realmId, { force })
    const customers = (await fetchActiveCustomerRefs(env, token, realmId))
      .map((c) => ({
        ...c,
        id: String(c.id),
        hasInvoice: invoicedIds.has(String(c.id)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    activeCustomersCache.set(realmId, { at: Date.now(), customers })
    return res.status(200).json({ customers })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}
