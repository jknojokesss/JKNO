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
    res.status(200).json({ clover_rows: clover.length, weldon_rows: (weldon || []).length, months: out })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
