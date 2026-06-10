import { supabaseAdmin } from '../../lib/supabaseAdmin'

// Receives scraped Weldon orders from the browser bookmarklet (which runs on
// the user's real, Cloudflare-cleared Weldon session) and inserts only the new
// web_ids. Protected by a shared token; CORS-enabled so the bookmarklet on
// weldontire.net can POST here.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-import-token',
}

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

// Weldon's invoiced view reaches back ~6 months, but we only track 2026 onward.
// Drop anything older so the bookmarklet never backfills pre-2026 orders.
const MIN_DATE = '2026-01-01'

// Validate/sanitize the rows the bookmarklet sends — never trust them blindly.
function clean(rows) {
  const out = []
  for (const r of Array.isArray(rows) ? rows : []) {
    const web_id = String(r?.web_id || '').trim()
    if (!/^\d{6,}$/.test(web_id)) continue
    const order_date = isDate(r.order_date) ? r.order_date : null
    if (order_date && order_date < MIN_DATE) continue // skip pre-2026 orders
    out.push({
      web_id,
      order_date,
      invoiced_date: isDate(r.invoiced_date) ? r.invoiced_date : null,
      size:          /^\d{3}\/\d{2}\/\d{2}$/.test(r.size || '') ? r.size : null,
      qty:           Number.isFinite(+r.qty) ? Math.round(+r.qty) : null,
      unit_cost:     Number.isFinite(+r.unit_cost) ? +r.unit_cost : null,
      description:   String(r.description || '').slice(0, 200),
    })
  }
  return out
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const token = req.headers['x-import-token']
  if (!process.env.WELDON_IMPORT_TOKEN || token !== process.env.WELDON_IMPORT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const rows = clean(req.body?.orders)
  if (!rows.length) return res.status(200).json({ ok: true, received: 0, inserted: 0 })

  // Insert new web_ids only. The unique constraint on web_id + ignoreDuplicates
  // means existing orders (and any manual cost corrections) are left untouched.
  const { data, error } = await supabaseAdmin
    .from('weldon_orders')
    .upsert(rows, { onConflict: 'web_id', ignoreDuplicates: true })
    .select('web_id')
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({
    ok: true,
    received: rows.length,
    inserted: (data || []).length,
  })
}
