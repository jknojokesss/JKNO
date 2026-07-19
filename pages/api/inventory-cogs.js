import { createClient } from '@supabase/supabase-js'

// Server-side inventory-COGS report: runs the SAME cost/classification engine as
// pages/orders.js (the live tab) and totals the "inventory"-sourced cost of goods
// sold per month — i.e. the amount to relieve from Inventory Asset (Dr COGS / Cr
// Inventory). Uses the service-role key so it can read past RLS. Gated by token.
export const config = { maxDuration: 60 }

const FALLBACK_RATIO = 0.412, TYP_MARGIN = 0.40, BUDGET_RETAIL_X = 3.2, MIN_SAMEDAY_MARGIN = 0.18, MAX_SAMEDAY_MARGIN = 0.55
const STOCKUP_DATE = '2026-04-15', STOCKUP_END = '2026-04-17', PO_CONVENTION_DATE = '2026-04-27', RECLASS_FROM = '2026-06-01'

function normalizeSize(name) { if (!name) return null; const m = name.match(/(?:LT|P|C)?(\d{3})[\s\/\-](\d{2})[\s\/\-]?[A-Z]{0,3}(\d{2})/i); return m ? `${m[1]}/${m[2]}/${m[3]}` : null }
const SIZE_RE_G = /\d{3}[\/\s\\-]\d{2}[\/\s\\-]?[a-z]{0,3}\d{2}/gi
const MODEL_STOP = new Set(['lt','xl','sl','as','at','ht','rt','uhp','hp','tire','tires','new','used','set','the','and','for','brand','name','generic','misc','unknown','item','assorted','various'])
const modelWords = (s) => new Set((s || '').toLowerCase().replace(/good\s*year/g,'goodyear').replace(/bridge\s*stone/g,'bridgestone').replace(/fire\s*stone/g,'firestone').replace(SIZE_RE_G,' ').replace(/[^a-z\s]/g,' ').split(/\s+/).filter(w => w.length > 2 && !MODEL_STOP.has(w)))
const sharedModel = (itemWords, desc) => { const b = [...modelWords(desc)]; let n = 0; for (const w of itemWords) if (b.some(x => x === w || (w.length >= 4 && (x.includes(w) || w.includes(x))))) n++; return n }
const NON_STOCK_BRANDS = ['continental','michelin','pirelli','bridgestone','hankook','firestone','toyo']
const hasNonStockBrand = (name) => { const n = (name || '').toLowerCase().replace('bridge stone','bridgestone'); return NON_STOCK_BRANDS.some(b => n.includes(b)) }
const dayGap = (a, b) => Math.abs(Math.round((new Date(a) - new Date(b)) / 864e5))

// ── Stock on-hand FIFO (mirror of pages/stock.js) ───────────────────────────
const STOCK_START = '2026-04-15', STK_AS_OF = '2026-05-31'
const sizeOf = (name) => { if (!name) return null; const m = name.match(/(?:LT|P|C)?\s*(\d{3})[\s/\\-]+(\d{2})[\s/\\-]*[A-Za-z]{0,3}(\d{2})/i); return m ? `${m[1]}/${m[2]}/${m[3]}` : null }
const SAME_DAY_ITEMS = new Set(['255/45/19 brand'])
const LAYERS = [{"s":"205/55/16","l":"205/55/16 Cooper","q":4,"c":96,"d":"2026-04-15"},{"s":"205/55/16","l":"205/55/16","q":1,"c":50,"d":"2026-04-15"},{"s":"205/55/16","l":"205/55/16","q":16,"c":48,"d":"2026-04-15"},{"s":"205/65/16","l":"205/65/16 Cooper","q":4,"c":105,"d":"2026-04-15"},{"s":"205/65/16","l":"205/65/16","q":16,"c":53,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17 Cooper","q":4,"c":119,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17","q":16,"c":58,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17","q":4,"c":67,"d":"2026-04-15"},{"s":"215/60/16","l":"215/60/16 Cooper","q":4,"c":98,"d":"2026-04-15"},{"s":"215/60/16","l":"215/60/16","q":16,"c":59,"d":"2026-04-15"},{"s":"215/65/16","l":"215/65/16 Cooper","q":4,"c":102,"d":"2026-04-15"},{"s":"215/65/16","l":"215/65/16","q":16,"c":61,"d":"2026-04-15"},{"s":"225/50/17","l":"225/50/17 Cooper","q":4,"c":128,"d":"2026-04-15"},{"s":"225/50/17","l":"225/50/17","q":16,"c":58,"d":"2026-04-15"},{"s":"225/65/17","l":"225/65/17 Cooper","q":4,"c":115,"d":"2026-04-15"},{"s":"225/65/17","l":"225/65/17","q":16,"c":69,"d":"2026-04-15"},{"s":"235/45/18","l":"235/45/18 Cooper","q":4,"c":142,"d":"2026-04-15"},{"s":"235/45/18","l":"235/45/18","q":15,"c":62,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19 Cooper","q":4,"c":160,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19","q":16,"c":76,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17","q":1,"c":76,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17 Cooper","q":4,"c":130,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17","q":16,"c":65,"d":"2026-04-15"},{"s":"235/60/18","l":"235/60/18 Cooper","q":4,"c":145,"d":"2026-04-15"},{"s":"235/60/18","l":"235/60/18","q":16,"c":74,"d":"2026-04-15"},{"s":"235/65/16","l":"235/65/16 Kumho","q":4,"c":147,"d":"2026-04-15"},{"s":"235/65/16","l":"235/65/16 LT","q":16,"c":85,"d":"2026-04-15"},{"s":"235/65/17","l":"235/65/17 Cooper","q":4,"c":130,"d":"2026-04-15"},{"s":"235/65/17","l":"235/65/17","q":16,"c":72,"d":"2026-04-15"},{"s":"235/65/18","l":"235/65/18 Cooper","q":4,"c":143,"d":"2026-04-15"},{"s":"235/65/18","l":"235/65/18","q":16,"c":77,"d":"2026-04-15"},{"s":"245/50/20","l":"245/50/20 Cooper","q":4,"c":158,"d":"2026-04-15"},{"s":"245/50/20","l":"245/50/20","q":16,"c":85,"d":"2026-04-15"},{"s":"245/60/18","l":"245/60/18 Cooper","q":4,"c":164,"d":"2026-04-15"},{"s":"245/60/18","l":"245/60/18","q":16,"c":74,"d":"2026-04-15"},{"s":"255/40/20","l":"255/40/20 Falken","q":4,"c":200,"d":"2026-04-15"},{"s":"255/40/20","l":"255/40/20","q":16,"c":90,"d":"2026-04-15"},{"s":"255/45/19","l":"255/45/19 Cooper","q":4,"c":179,"d":"2026-04-15"},{"s":"255/45/19","l":"255/45/19","q":16,"c":85,"d":"2026-04-15"},{"s":"285/45/22","l":"285/45/22 Goodyear","q":4,"c":189,"d":"2026-04-15"},{"s":"285/45/22","l":"285/45/22","q":16,"c":105,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19","q":8,"c":76,"d":"2026-04-28"},{"s":"235/60/18","l":"235/60/18","q":6,"c":74,"d":"2026-04-28"},{"s":"235/60/18","l":"235/60/18 Cooper","q":2,"c":145,"d":"2026-04-28"},{"s":"235/55/19","l":"235/55/19 Cooper","q":2,"c":160,"d":"2026-04-28"},{"s":"235/60/17","l":"235/60/17","q":10,"c":65,"d":"2026-04-28"},{"s":"275/35/21","l":"275/35/21","q":1,"c":372,"d":"2026-04-23"},{"s":"215/55/17","l":"215/55/17","q":20,"c":58,"d":"2026-05-18"},{"s":"235/60/17","l":"235/60/17","q":8,"c":65,"d":"2026-05-18"},{"s":"235/60/18","l":"235/60/18","q":10,"c":74,"d":"2026-05-18"},{"s":"205/65/16","l":"205/65/16","q":12,"c":53,"d":"2026-05-18"},{"s":"235/45/18","l":"235/45/18","q":6,"c":62,"d":"2026-05-18"},{"s":"275/60/20","l":"275/60/20","q":4,"c":101,"d":"2026-05-18"},{"s":"245/45/19","l":"245/45/19","q":2,"c":80,"d":"2026-05-18"},{"s":"235/40/19","l":"235/40/19","q":4,"c":70,"d":"2026-05-18"},{"s":"225/45/17","l":"225/45/17","q":4,"c":59,"d":"2026-05-18"},{"s":"225/40/18","l":"225/40/18","q":2,"c":59,"d":"2026-05-18"},{"s":"225/60/17","l":"225/60/17","q":2,"c":65,"d":"2026-05-18"},{"s":"245/75/16","l":"245/75/16","q":2,"c":92,"d":"2026-05-18"},{"s":"225/45/18","l":"225/45/18","q":2,"c":64,"d":"2026-05-18"}]
const RETURNS = [{"s":"205/55/16","q":8,"c":48},{"s":"215/60/16","q":2,"c":98},{"s":"215/65/16","q":10,"c":61},{"s":"215/65/16","q":2,"c":102},{"s":"225/50/17","q":2,"c":128},{"s":"225/50/17","q":8,"c":58},{"s":"225/65/17","q":2,"c":115},{"s":"225/65/17","q":8,"c":69},{"s":"235/65/16","q":8,"c":85},{"s":"255/40/20","q":2,"c":200},{"s":"255/40/20","q":10,"c":90},{"s":"285/45/22","q":10,"c":105},{"s":"285/45/22","q":2,"c":105},{"s":"285/45/22","q":2,"c":189}]
function stockOnHandValue(sales, weldon, cutoff) {
  const layers = LAYERS.map(L => ({ ...L, remaining: L.q }))
  RETURNS.forEach(({ s, q, c }) => { let pool = layers.filter(L => L.s === s && L.c === c && L.remaining > 0); if (!pool.length) pool = layers.filter(L => L.s === s).sort((a, b) => a.c - b.c); let need = q; for (const L of pool) { if (need <= 0) break; const t = Math.min(L.remaining, need); L.remaining -= t; need -= t } })
  const bySize = {}; layers.forEach(L => { (bySize[L.s] = bySize[L.s] || []).push(L) }); Object.values(bySize).forEach(a => a.sort((x, y) => x.d.localeCompare(y.d) || x.c - y.c))
  const sdPool = {}; (weldon || []).forEach(o => { if (Number(o.qty) > 4) return; (sdPool[o.size] = sdPool[o.size] || []).push({ date: o.order_date, remaining: Number(o.qty) }) })
  const isSpecialOrder = (size, date) => { for (const o of sdPool[size] || []) { const gap = (new Date(date) - new Date(o.date)) / 864e5; if (o.remaining > 0 && gap >= -1 && gap <= 4) { o.remaining--; return true } } return false }
  const tireSales = sales.filter(r => r.date <= cutoff && sizeOf(r.item_name) && !/used/i.test(r.item_name) && !SAME_DAY_ITEMS.has((r.item_name || '').trim().toLowerCase())).map(r => ({ date: r.date, size: sizeOf(r.item_name) })).sort((a, b) => a.date.localeCompare(b.date))
  for (const sale of tireSales) { if (sale.date > STK_AS_OF && isSpecialOrder(sale.size, sale.date)) continue; const pool = bySize[sale.size] || []; for (const L of pool) { if (L.remaining > 0 && L.d <= sale.date) { L.remaining--; break } } }
  let value = 0, units = 0; layers.forEach(L => { if (L.remaining > 0) { value += L.remaining * L.c; units += L.remaining } })
  return { value, units }
}

export default async function handler(req, res) {
  const token = req.query.token || req.headers['x-token']
  if (!process.env.WELDON_IMPORT_TOKEN || token !== process.env.WELDON_IMPORT_TOKEN) return res.status(401).json({ error: 'unauthorized' })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    let clover = [], from = 0
    while (true) {
      const { data, error } = await supabase.from('clover_line_items').select('date, item_name, revenue, quantity').order('date', { ascending: false }).range(from, from + 999)
      if (error) throw error
      if (!data || !data.length) break
      clover = clover.concat(data); if (data.length < 1000) break; from += 1000
    }
    const { data: weldon, error: wErr } = await supabase.from('weldon_orders').select('order_date, size, qty, unit_cost, description, po_number')
    if (wErr) throw wErr

    const stockup = {}, bySize = {}
    ;(weldon || []).forEach(o => { (bySize[o.size] = bySize[o.size] || []).push(o); if (o.order_date >= STOCKUP_DATE && o.order_date <= STOCKUP_END) { const c = Number(o.unit_cost); if (c > 0) { const s = stockup[o.size] = stockup[o.size] || { budget: Infinity, max: 0, cooper: null }; s.budget = Math.min(s.budget, c); s.max = Math.max(s.max, c); if (/cooper/i.test(o.description || '')) s.cooper = c } } })
    const sameDayMatch = (size, date, itemWords, sale) => { let best = null, bestScore = -Infinity; for (const o of bySize[size] || []) { const cost = Number(o.unit_cost); if (!(cost > 0)) continue; const affordable = cost <= sale + 0.01 ? 1 : 0; const model = sharedModel(itemWords, o.description); const score = affordable * 1e6 + model * 1e4 - dayGap(o.order_date, date); if (score > bestScore) { bestScore = score; best = o } } return best }
    const customerSameDay = (size, date, itemWords, sale) => { let best = null, bg = 99; for (const o of bySize[size] || []) { if (o.order_date < PO_CONVENTION_DATE) continue; if ((o.po_number || '').toUpperCase() === 'STOCK') continue; if (o.po_number) continue; const cost = Number(o.unit_cost); if (!(cost > 0)) continue; if (cost > sale + 0.01) continue; if (cost > sale * (1 - MIN_SAMEDAY_MARGIN)) continue; if (cost < sale * (1 - MAX_SAMEDAY_MARGIN)) continue; const shared = sharedModel(itemWords, o.description); const g = dayGap(o.order_date, date); if (g > 3) continue; const score = g - (shared ? 10 : 0); if (score < bg) { bg = score; best = o } } return best }
    const brandedStockCost = (size, itemWords) => { if (!itemWords || itemWords.size === 0) return null; const pool = (bySize[size] || []).filter(o => Number(o.unit_cost) > 0 && sharedModel(itemWords, o.description) > 0); if (!pool.length) return null; const suPool = pool.filter(o => o.order_date >= STOCKUP_DATE && o.order_date <= STOCKUP_END); const src = suPool.length ? suPool : pool; return Math.min(...src.map(o => Number(o.unit_cost))) }

    const months = {} // 'YYYY-MM' -> { inventory_cogs, inventory_units, by_source }
    for (const r of clover) {
      const month = (r.date || '').slice(0, 7)
      if (!month) continue
      const sale = Number(r.revenue), qty = Number(r.quantity || 1)
      const isUsed = /used/i.test(r.item_name || ''); const normalized = normalizeSize(r.item_name); const isService = !normalized && !isUsed; const itemWords = modelWords(r.item_name); const isCooper = /cooper/i.test(r.item_name || '') || /\bbrand\b/i.test(r.item_name || '')
      const su = stockup[normalized]; const sizeCostList = normalized ? (bySize[normalized] || []).map(o => Number(o.unit_cost)).filter(c => c > 0) : []; const sizeBudget = su ? su.budget : (sizeCostList.length ? Math.min(...sizeCostList) : null)
      const m = (!isUsed && !isService && normalized) ? sameDayMatch(normalized, r.date, itemWords, sale) : null; const mGap = m ? Math.round((new Date(r.date) - new Date(m.order_date)) / 864e5) : null
      const specialOrder = !!m && mGap >= -7 && mGap <= 14 && Number(m.unit_cost) <= sale + 0.01 && sizeBudget != null && Number(m.unit_cost) > sizeBudget * 1.3 && (sharedModel(itemWords, m.description) > 0 || sale > sizeBudget * BUDGET_RETAIL_X)
      const cust = (!isUsed && !isService && normalized && r.date >= RECLASS_FROM) ? customerSameDay(normalized, r.date, itemWords, sale) : null
      const isInventory = !cust && !isService && !isUsed && r.date >= STOCKUP_DATE && sizeBudget != null && !hasNonStockBrand(r.item_name) && !specialOrder
      let costPerUnit, costSource
      if (isUsed) { costPerUnit = 18; costSource = 'used_tire_inventory' }
      else if (isService) { costPerUnit = 0; costSource = 'service' }
      else if (cust) { costPerUnit = Number(cust.unit_cost); costSource = 'weldon_same_day' }
      else if (isInventory) { const bc = r.date >= RECLASS_FROM ? brandedStockCost(normalized, itemWords) : null; costPerUnit = bc != null ? bc : ((isCooper && su && su.cooper) ? su.cooper : sizeBudget); costSource = 'inventory' }
      else { costPerUnit = m ? Number(m.unit_cost) : (sale * FALLBACK_RATIO); costSource = 'weldon_same_day' }
      const matchModelShared = cust ? sharedModel(itemWords, cust.description) : (m ? sharedModel(itemWords, m.description) : null)
      if (!isUsed && !isService && normalized && (itemWords.size === 0 || !matchModelShared)) { const sizeCosts = (bySize[normalized] || []).map(o => Number(o.unit_cost)).filter(c => c > 0); if (sizeCosts.length) { const minCost = Math.min(...sizeCosts); const budgetMax = Math.max(...sizeCosts.filter(c => c <= minCost * 1.4)); const expected = sale * (1 - TYP_MARGIN); const tierCost = sizeCosts.reduce((b, c) => Math.abs(c - expected) < Math.abs(b - expected) ? c : b); if (sale > budgetMax * BUDGET_RETAIL_X && tierCost > costPerUnit * 1.3) { costPerUnit = tierCost } } }
      const cost = costPerUnit * qty
      const mo = months[month] = months[month] || { inventory_cogs: 0, inventory_units: 0, by_source: {} }
      mo.by_source[costSource] = (mo.by_source[costSource] || 0) + cost
      if (costSource === 'inventory') { mo.inventory_cogs += cost; mo.inventory_units += qty }
    }
    const filter = req.query.month
    const out = {}
    Object.keys(months).sort().forEach(mm => { if (!filter || mm === filter) { out[mm] = { inventory_cogs: Math.round(months[mm].inventory_cogs * 100) / 100, inventory_units: months[mm].inventory_units, by_source: Object.fromEntries(Object.entries(months[mm].by_source).map(([k, v]) => [k, Math.round(v * 100) / 100])) } } })
    const onhand = {
      '2026-04-30': stockOnHandValue(clover, weldon, '2026-04-30'),
      '2026-05-31': stockOnHandValue(clover, weldon, '2026-05-31'),
      '2026-06-30': stockOnHandValue(clover, weldon, '2026-06-30'),
    }
    res.status(200).json({ clover_rows: clover.length, weldon_rows: (weldon || []).length, months: out, stock_onhand_value: onhand })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
