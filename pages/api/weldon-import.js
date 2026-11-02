import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { sanitizeOrderedAtFromClient } from '../../lib/weldonOrderedAt'
import { WELDON_MIN_ORDER_DATE, weldonCancelCandidate } from '../../lib/weldonSyncBounds'

// Receives scraped Weldon orders from the browser bookmarklet (which runs on
// the user's real, Cloudflare-cleared Weldon session) and inserts only the new
// web_ids, backfills blank costs / PO#s, and drops orders missing inside this
// scrape's date span (cancels). Orders older than the oldest scraped date
// aged off Weldon's page — leave them. Protected by a shared token; CORS-enabled
// so the bookmarklet on weldontire.net can POST here.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-import-token',
}

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

// Weldon's invoiced view is months=N (see weldon-sync); we only keep stocking era onward.
const MIN_DATE = WELDON_MIN_ORDER_DATE

// Validate/sanitize the rows the bookmarklet sends — never trust them blindly.
function clean(rows) {
  const out = []
  for (const r of Array.isArray(rows) ? rows : []) {
    const web_id = String(r?.web_id || '').trim()
    if (!/^\d{6,}$/.test(web_id)) continue
    const order_date = isDate(r.order_date) ? r.order_date : null
    if (order_date && order_date < MIN_DATE) continue
    out.push({
      web_id,
      order_date,
      invoiced_date: isDate(r.invoiced_date) ? r.invoiced_date : null,
      size:          /^\d{3}\/\d{2}\/\d{2}$/.test(r.size || '') ? r.size : null,
      qty:           Number.isFinite(+r.qty) ? Math.round(+r.qty) : null,
      unit_cost:     Number.isFinite(+r.unit_cost) ? +r.unit_cost : null,
      description:   String(r.description || '').slice(0, 200),
      // Weldon "PO#" field off the order-detail cell: "STOCK" = shelf/inventory
      // buy, anything else (a customer name / PO#) = a customer/same-day order.
      po_number:     r.po_number ? String(r.po_number).trim().slice(0, 60) : null,
      ordered_at:    sanitizeOrderedAtFromClient(r.ordered_at),
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
  if (!rows.length) {
    return res.status(200).json({ ok: true, received: 0, inserted: 0, backfilled: 0, canceled: 0, ordered_at_filled: 0 })
  }

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

  // 4) Backfill po_number onto orders already in the DB without it. This is an
  //    UPDATE keyed by web_id (never an insert), so re-syncing never duplicates
  //    an order — it just fills the STOCK/customer flag the older sync missed.
  const { data: noPo } = await supabaseAdmin
    .from('weldon_orders')
    .select('web_id')
    .is('po_number', null)
  const noPoIds = new Set((noPo || []).map((b) => b.web_id))
  let po_tagged = 0
  for (const r of dbRows) {
    if (!r.po_number || !r.web_id || !noPoIds.has(r.web_id)) continue
    const { error: pErr } = await supabaseAdmin
      .from('weldon_orders')
      .update({ po_number: r.po_number })
      .eq('web_id', r.web_id)
    if (!pErr) po_tagged++
  }

  // 4b) Backfill ordered_at on rows we already had (upsert ignores duplicates).
  let ordered_at_filled = 0
  for (const r of dbRows) {
    if (!r.ordered_at || !r.web_id) continue
    const { data: filled, error: oErr } = await supabaseAdmin
      .from('weldon_orders')
      .update({ ordered_at: r.ordered_at })
      .eq('web_id', r.web_id)
      .is('ordered_at', null)
      .select('web_id')
    if (!oErr && filled?.length) ordered_at_filled += filled.length
  }

  // 5) Drop orders the bookmarklet did not see — only if order_date falls inside
  //    [oldestSeen, newestSeen] from this scrape (after MIN_DATE filter). Older
  //    than oldestSeen aged off Weldon's page; newer than newestSeen was outside
  //    what we pulled — neither is a cancel. If too many are missing inside the
  //    span, the scrape was incomplete: don't mass-delete.
  const seen = new Set(
    (Array.isArray(req.body?.seen) ? req.body.seen : dbRows.map((r) => r.web_id))
      .map((id) => String(id || '').trim())
      .filter((id) => /^\d{6,}$/.test(id))
  )
  let canceled = 0
  let cancel_skipped = 0
  let canceled_rows = []
  const seenDates = dbRows.map((r) => r.order_date).filter(Boolean).sort()
  const oldestSeen = seenDates[0]
  const newestSeen = seenDates[seenDates.length - 1]
  if (seen.size && oldestSeen && newestSeen) {
    const { data: inSpan } = await supabaseAdmin
      .from('weldon_orders')
      .select('web_id, order_date, size, qty, unit_cost, description, po_number')
      .gte('order_date', oldestSeen)
      .lte('order_date', newestSeen)
    const gone = (inSpan || []).filter(
      (r) => weldonCancelCandidate(r.order_date, oldestSeen, newestSeen) && !seen.has(r.web_id),
    )
    if (gone.length > 15) {
      cancel_skipped = gone.length
    } else if (gone.length) {
      const ids = gone.map((r) => r.web_id)
      console.log('weldon-import canceling', JSON.stringify(gone))
      const { error: cErr, data: dropped } = await supabaseAdmin
        .from('weldon_orders')
        .delete()
        .in('web_id', ids)
        .select('web_id, order_date, size, qty, unit_cost, description, po_number')
      if (!cErr) {
        canceled_rows = dropped || gone
        canceled = canceled_rows.length
      }
    }
  }

  return res.status(200).json({
    ok: true,
    received: dbRows.length,
    inserted: (insData || []).length,
    backfilled,
    po_tagged,
    ordered_at_filled,
    canceled,
    ...(canceled_rows.length ? { canceled_ids: canceled_rows.map((r) => r.web_id), canceled_rows } : {}),
    ...(cancel_skipped ? { cancel_skipped, cancel_note: 'Too many missing for a cancel — scrape looks incomplete, left them.' } : {}),
  })
}
