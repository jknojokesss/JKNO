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
      // Transient hint (cc charge ÷ qty) — used only as a last resort, never a column.
      derived_cost:  Number.isFinite(+r.derived_cost) && +r.derived_cost > 0 ? +r.derived_cost : null,
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
  if (!rows.length) return res.status(200).json({ ok: true, received: 0, inserted: 0, backfilled: 0 })

  // derived_cost is a transient hint, not a DB column — split it off the rows
  // we insert and keep it keyed by web_id for the last-resort backfill below.
  const derivedByWebId = new Map()
  const dbRows = rows.map(({ derived_cost, ...r }) => {
    if (derived_cost != null) derivedByWebId.set(r.web_id, derived_cost)
    return r
  })

  // 1) Insert brand-new web_ids only (box price only). A blank order stays blank
  //    on first sight — the box price gets another sync to appear before we estimate.
  const { data: insData, error } = await supabaseAdmin
    .from('weldon_orders')
    .upsert(dbRows, { onConflict: 'web_id', ignoreDuplicates: true })
    .select('web_id')
  if (error) return res.status(500).json({ error: error.message })
  const justInserted = new Set((insData || []).map((d) => d.web_id))

  // 2) Which orders do we still have with a blank/zero cost?
  const { data: blanks } = await supabaseAdmin
    .from('weldon_orders')
    .select('web_id')
    .or('unit_cost.is.null,unit_cost.lte.0')
  const blankIds = new Set((blanks || []).map((b) => b.web_id))

  // 3) Backfill in priority order, never overwriting an existing positive cost:
  //    (a) the per-tire box price always wins;
  //    (b) the cc-charge ÷ qty estimate is a LAST resort — only for an order we
  //        already had blank from a prior sync (not one inserted just now), so a
  //        late-arriving box price still gets a chance first.
  let backfilled = 0
  for (const r of dbRows) {
    if (!r.web_id || !blankIds.has(r.web_id)) continue
    let fill = null
    if (Number.isFinite(r.unit_cost) && r.unit_cost > 0) fill = r.unit_cost                       // (a) box price
    else if (!justInserted.has(r.web_id) && derivedByWebId.has(r.web_id)) fill = derivedByWebId.get(r.web_id) // (b) last resort
    if (fill == null) continue
    const { error: uErr } = await supabaseAdmin
      .from('weldon_orders')
      .update({ unit_cost: fill })
      .eq('web_id', r.web_id)
    if (!uErr) backfilled++
  }

  return res.status(200).json({
    ok: true,
    received: dbRows.length,
    inserted: (insData || []).length,
    backfilled,
  })
}
