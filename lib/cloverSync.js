import { supabaseAdmin } from './supabaseAdmin'

// Reydel's client_id in Supabase
const CLIENT_ID = 'dc442b88-5ed1-44be-a908-dcbc945827b3'
const CLOVER_BASE = 'https://api.clover.com/v3'

const cents = (n) => Math.round(Number(n || 0)) / 100
const toDate = (ms) => new Date(Number(ms)).toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

async function cloverGet(path, token, merchant) {
  const url = `${CLOVER_BASE}/merchants/${merchant}${path}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    // TEMP DIAGNOSTIC: fingerprint the live token (head…tail + length) so we can
    // see what Vercel is actually sending without exposing the full secret.
    const fp = token ? `${token.slice(0, 4)}…${token.slice(-4)} (len ${token.length})` : '(empty)'
    throw new Error(`Clover ${res.status} — token ${fp}, merchant "${merchant}", path ${path}: ${await res.text()}`)
  }
  return res.json()
}

// Page through a list endpoint (1000 cap per call) accumulating elements
async function cloverPaged(pathBase, token, merchant) {
  let all = [], offset = 0
  while (true) {
    const sep = pathBase.includes('?') ? '&' : '?'
    const page = await cloverGet(`${pathBase}${sep}limit=1000&offset=${offset}`, token, merchant)
    const els = page.elements || []
    all = all.concat(els)
    if (els.length < 1000) break
    offset += 1000
    if (offset > 50000) break // hard safety stop
  }
  return all
}

// Core sync: pull Clover orders + line items + payment type for a window and
// upsert into clover_line_items. Used by both the manual /api/clover-sync
// endpoint and the nightly /api/cron/clover-sync cron.
export async function runCloverSync({ start, end } = {}) {
  const token = process.env.CLOVER_API_TOKEN
  const merchant = process.env.CLOVER_MERCHANT_ID
  if (!token || !merchant) {
    throw new Error('Missing CLOVER_API_TOKEN or CLOVER_MERCHANT_ID env vars')
  }

  // Date window (YYYY-MM-DD). Defaults to last 7 days if not provided.
  const startMs = start ? new Date(start + 'T00:00:00Z').getTime() : Date.now() - 7 * 864e5
  const endMs   = end   ? new Date(end   + 'T23:59:59Z').getTime() : Date.now()

  // 1. Pull orders with line items in the window
  const orderFilter = `/orders?expand=lineItems&filter=createdTime%3E%3D${startMs}&filter=createdTime%3C%3D${endMs}`
  const orders = await cloverPaged(orderFilter, token, merchant)

  // 2. Pull payments in the window → map order id → tender label
  const payFilter = `/payments?expand=tender&filter=createdTime%3E%3D${startMs}&filter=createdTime%3C%3D${endMs}`
  const payments = await cloverPaged(payFilter, token, merchant)
  const tenderByOrder = {}
  payments.forEach(p => {
    const oid = p.order?.id
    const label = p.tender?.label || null
    if (oid && label && !tenderByOrder[oid]) tenderByOrder[oid] = label
  })

  // 3. Flatten line items → rows
  const rows = []
  for (const o of orders) {
    const created = o.createdTime
    const lis = o.lineItems?.elements || []
    for (const li of lis) {
      if (li.refunded) continue // skip refunded line items
      rows.push({
        client_id: CLIENT_ID,
        date: toDate(created),
        order_id: o.id,
        order_line_id: li.id,
        clover_item_id: li.item?.id || null,
        item_name: li.name || 'Unknown',
        revenue: cents(li.price),
        quantity: 1, // Clover logs one row per unit
        tender_type: tenderByOrder[o.id] || null,
        synced_at: new Date().toISOString(),
      })
    }
  }

  // 4. Upsert deduped on order_line_id (re-running never duplicates)
  let upserted = 0
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK)
    const { error } = await supabaseAdmin
      .from('clover_line_items')
      .upsert(slice, { onConflict: 'order_line_id', ignoreDuplicates: false })
    if (error) throw new Error(`Supabase upsert: ${error.message}`)
    upserted += slice.length
  }

  return {
    ok: true,
    window: { start: toDate(startMs), end: toDate(endMs) },
    ordersPulled: orders.length,
    paymentsPulled: payments.length,
    lineItemsUpserted: upserted,
  }
}
