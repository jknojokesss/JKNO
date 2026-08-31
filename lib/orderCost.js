// Clover × Weldon cost matcher — same engine as /orders live tab.
// Heuristic, not the books. Used on the dashboard for open-month tickets.

export const FALLBACK_RATIO = 0.412
export const TYP_MARGIN = 0.40
export const USED_UNIT_COST = 18
const PARTS_COST = [[/\bbrake/i, 0.45], [/\bbatter/i, 0.55], [/\bsensor/i, 0.40], [/\bwipers?|\blights?|\bvalve|\blug\b|\bbead/i, 0.30]]
export const partsRatio = (name) => { for (const [re, r] of PARTS_COST) if (re.test(name || '')) return r; return null }
const BUDGET_RETAIL_X = 3.2
const MIN_SAMEDAY_MARGIN = 0.18
const MAX_SAMEDAY_MARGIN = 0.55
const STOCKUP_DATE = '2026-04-15', STOCKUP_END = '2026-04-17'
const PO_CONVENTION_DATE = '2026-04-27'
const RECLASS_FROM = '2026-06-01'

export function normalizeSize(name) {
  if (!name) return null
  const m = name.match(/(?:LT|P|C)?(\d{3})[\s\/\\-](\d{2})[\s\/\\-]?[A-Z]{0,3}(\d{2})/i)
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  return null
}

const SIZE_RE_G = /\d{3}[\/\s\\-]\d{2}[\/\s\\-]?[a-z]{0,3}\d{2}/gi
const MODEL_STOP = new Set([
  'lt','xl','sl','as','at','ht','rt','uhp','hp','tire','tires','new','used','set','the','and','for',
  'brand','name','generic','misc','unknown','item','assorted','various',
])
export const modelWords = (s) => new Set(
  (s || '').toLowerCase()
    .replace(/good\s*year/g, 'goodyear').replace(/bridge\s*stone/g, 'bridgestone').replace(/fire\s*stone/g, 'firestone')
    .replace(SIZE_RE_G, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !MODEL_STOP.has(w))
)
export const sharedModel = (itemWords, desc) => {
  const b = [...modelWords(desc)]
  let n = 0
  for (const w of itemWords) if (b.some(x => x === w || (w.length >= 4 && (x.includes(w) || w.includes(x))))) n++
  return n
}

const NON_STOCK_BRANDS = ['continental','michelin','pirelli','bridgestone','hankook','firestone','toyo']
export function hasNonStockBrand(name) {
  const n = (name || '').toLowerCase().replace('bridge stone', 'bridgestone')
  return NON_STOCK_BRANDS.some(b => n.includes(b))
}

const dayGap = (a, b) => Math.abs(Math.round((new Date(a) - new Date(b)) / 864e5))

export function buildCostContext(weldon) {
  const stockup = {}
  const bySize = {}
  ;(weldon || []).forEach(o => {
    (bySize[o.size] = bySize[o.size] || []).push(o)
    if (o.order_date >= STOCKUP_DATE && o.order_date <= STOCKUP_END) {
      const c = Number(o.unit_cost)
      if (c > 0) {
        const s = stockup[o.size] = stockup[o.size] || { budget: Infinity, max: 0, cooper: null }
        s.budget = Math.min(s.budget, c); s.max = Math.max(s.max, c)
        if (/cooper/i.test(o.description || '')) s.cooper = c
      }
    }
  })

  const sameDayMatch = (size, date, itemWords, sale) => {
    let best = null, bestScore = -Infinity
    for (const o of bySize[size] || []) {
      const cost = Number(o.unit_cost)
      if (!(cost > 0)) continue
      const affordable = cost <= sale + 0.01 ? 1 : 0
      const model = sharedModel(itemWords, o.description)
      const score = affordable * 1e6 + model * 1e4 - dayGap(o.order_date, date)
      if (score > bestScore) { bestScore = score; best = o }
    }
    return best
  }
  const customerSameDay = (size, date, itemWords, sale) => {
    let best = null, bg = 99
    for (const o of bySize[size] || []) {
      if (o.order_date < PO_CONVENTION_DATE) continue
      if ((o.po_number || '').toUpperCase() === 'STOCK') continue
      if (o.po_number) continue
      const cost = Number(o.unit_cost); if (!(cost > 0)) continue
      if (cost > sale + 0.01) continue
      if (cost > sale * (1 - MIN_SAMEDAY_MARGIN)) continue
      if (cost < sale * (1 - MAX_SAMEDAY_MARGIN)) continue
      const shared = sharedModel(itemWords, o.description)
      const g = dayGap(o.order_date, date); if (g > 3) continue
      const score = g - (shared ? 10 : 0)
      if (score < bg) { bg = score; best = o }
    }
    return best
  }
  const brandedStockCost = (size, itemWords) => {
    if (!itemWords || itemWords.size === 0) return null
    const pool = (bySize[size] || []).filter(o => Number(o.unit_cost) > 0 && sharedModel(itemWords, o.description) > 0)
    if (!pool.length) return null
    const suPool = pool.filter(o => o.order_date >= STOCKUP_DATE && o.order_date <= STOCKUP_END)
    const src = suPool.length ? suPool : pool
    return Math.min(...src.map(o => Number(o.unit_cost)))
  }

  return { stockup, bySize, sameDayMatch, customerSameDay, brandedStockCost }
}

export function priceLine(r, ctx) {
  const { stockup, bySize, sameDayMatch, customerSameDay, brandedStockCost } = ctx
  const sale = Number(r.revenue)
  const qty  = Number(r.quantity || 1)
  const isUsed = /used/i.test(r.item_name || '')
  const normalized = normalizeSize(r.item_name)
  const noSizeService = !normalized && !isUsed
  const pRatio = noSizeService ? partsRatio(r.item_name) : null
  const isParts = pRatio != null
  const isService = noSizeService && !isParts
  const itemWords = modelWords(r.item_name)
  const isCooper = /cooper/i.test(r.item_name || '') || /\bbrand\b/i.test(r.item_name || '')

  const su = stockup[normalized]
  const sizeCostList = normalized ? (bySize[normalized] || []).map(o => Number(o.unit_cost)).filter(c => c > 0) : []
  const sizeBudget = su ? su.budget : (sizeCostList.length ? Math.min(...sizeCostList) : null)

  const m = (!isUsed && !isService && normalized) ? sameDayMatch(normalized, r.date, itemWords, sale) : null
  const mGap = m ? Math.round((new Date(r.date) - new Date(m.order_date)) / 864e5) : null
  const specialOrder = !!m && mGap >= -7 && mGap <= 14
    && Number(m.unit_cost) <= sale + 0.01 && sizeBudget != null && Number(m.unit_cost) > sizeBudget * 1.3
    && (sharedModel(itemWords, m.description) > 0 || sale > sizeBudget * BUDGET_RETAIL_X)

  const cust = (!isUsed && !isService && normalized && r.date >= RECLASS_FROM)
    ? customerSameDay(normalized, r.date, itemWords, sale) : null

  const isInventory = !cust && !isService && !isUsed && r.date >= STOCKUP_DATE
    && sizeBudget != null && !hasNonStockBrand(r.item_name) && !specialOrder

  let costPerUnit, costSource, estimated = false, matchGap = null, matchModelShared = null
  if (isUsed) { costPerUnit = USED_UNIT_COST; costSource = 'used_tire_inventory' }
  else if (isService) { costPerUnit = 0; costSource = 'service' }
  else if (isParts) { costPerUnit = sale * pRatio; costSource = 'parts'; estimated = true }
  else if (cust) {
    costPerUnit = Number(cust.unit_cost)
    costSource = 'weldon_same_day'
    matchGap = Math.round((new Date(r.date) - new Date(cust.order_date)) / 864e5)
    matchModelShared = sharedModel(itemWords, cust.description)
  }
  else if (isInventory) {
    const bc = r.date >= RECLASS_FROM ? brandedStockCost(normalized, itemWords) : null
    costPerUnit = bc != null ? bc : ((isCooper && su && su.cooper) ? su.cooper : sizeBudget)
    costSource = 'inventory'
  }
  else {
    costPerUnit = m ? Number(m.unit_cost) : (sale * FALLBACK_RATIO)
    costSource = 'weldon_same_day'
    estimated = !m
    if (m) { matchGap = mGap; matchModelShared = sharedModel(itemWords, m.description) }
  }

  let priceInferred = false
  if (!isUsed && !isService && normalized && (itemWords.size === 0 || !matchModelShared)) {
    const sizeCosts = (bySize[normalized] || []).map(o => Number(o.unit_cost)).filter(c => c > 0)
    if (sizeCosts.length) {
      const minCost = Math.min(...sizeCosts)
      const budgetMax = Math.max(...sizeCosts.filter(c => c <= minCost * 1.4))
      const expected = sale * (1 - TYP_MARGIN)
      const tierCost = sizeCosts.reduce((b, c) => Math.abs(c - expected) < Math.abs(b - expected) ? c : b)
      if (sale > budgetMax * BUDGET_RETAIL_X && tierCost > costPerUnit * 1.3) {
        costPerUnit = tierCost; estimated = true; priceInferred = true
      }
    }
  }

  const cost   = costPerUnit * qty
  const profit = sale - cost
  const margin = sale > 0 ? (profit / sale) * 100 : 0
  return {
    date: r.date,
    item: r.item_name || 'Unknown',
    qty,
    sale,
    cost,
    costPerUnit,
    profit,
    margin,
    isEstimated: estimated,
    isExact: !estimated && !isService,
    isUsed,
    isInventory,
    costSource,
    matchGap,
    matchedSameDay: costSource === 'weldon_same_day' && matchGap != null && matchGap >= -7 && matchGap <= 14,
    matchModelShared,
    priceInferred,
    hasModelWords: itemWords.size > 0,
    normalizedSize: normalized,
    orderId: r.order_id,
  }
}

export function priceLines(lineItems, weldon) {
  const ctx = buildCostContext(weldon)
  return (lineItems || []).map(r => priceLine(r, ctx))
}
