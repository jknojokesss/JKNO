import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import TopNav from '../components/TopNav'

const fmtC = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const FALLBACK_RATIO = 0.412 // used when no Weldon match found
const TYP_MARGIN = 0.40 // assumed typical tire margin, used to infer cost tier from sale price

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const hcell = (align = 'left') => ({
  padding: '7px 12px', fontSize: '9px', color: '#888', background: '#FAFAFA',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E5E5E5',
  fontFamily: 'DM Mono, monospace', textAlign: align,
})
const cell = (align = 'left', extra = {}) => ({
  padding: '9px 12px', borderBottom: '1px solid #F0F0F0',
  color: '#333', fontSize: '11px', fontFamily: 'DM Mono, monospace',
  textAlign: align, ...extra,
})

// Normalize tire size to "235/60/18" format for Weldon lookup
function normalizeSize(name) {
  if (!name) return null
  // Handle "235/60/18" (already correct), "235/60R18", "LT235/65R16", "P255/60R19", "235-60-18"
  const m = name.match(/(?:LT|P|C)?(\d{3})[\s\/\-](\d{2})[\s\/\-]?[A-Z]{0,3}(\d{2})/i)
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  return null
}

// Match a sale to the *same tire*, not just the same size: compare the
// meaningful brand/model words in the sale's item name against the Weldon order
// description. This generalizes beyond a hardcoded brand list — e.g. a
// "245/75/16LT General" sale matches the "General Grabber HD" purchase ($180)
// instead of a cheaper same-size "Arroyo Eco Pro HT" ($92) a day closer in date.
const SIZE_RE_G = /\d{3}[\/\s\\-]\d{2}[\/\s\\-]?[a-z]{0,3}\d{2}/gi
const MODEL_STOP = new Set([
  'lt','xl','sl','as','at','ht','rt','uhp','hp','tire','tires','new','used','set','the','and','for',
  // placeholder words shops type into Clover when they don't enter the real brand —
  // these must not count as a brand/model or they create false "mismatch" flags.
  'brand','name','generic','misc','unknown','item','assorted','various',
])
const modelWords = (s) => new Set(
  (s || '').toLowerCase()
    // collapse common two-word brand spellings so "Good year" == "Goodyear"
    .replace(/good\s*year/g, 'goodyear').replace(/bridge\s*stone/g, 'bridgestone').replace(/fire\s*stone/g, 'firestone')
    .replace(SIZE_RE_G, ' ')          // drop the size so only brand/model words remain
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !MODEL_STOP.has(w))
)
// Count brand/model words shared between a sale's item words and an order desc.
// Uses substring matching (≥4 chars) so partial spellings still match.
const sharedModel = (itemWords, desc) => {
  const b = [...modelWords(desc)]
  let n = 0
  for (const w of itemWords) if (b.some(x => x === w || (w.length >= 4 && (x.includes(w) || w.includes(x))))) n++
  return n
}

// Premium brands the 4/15 stock-up never carried. A sale naming one of these is
// a same-day Weldon order even if its SIZE matches a stocked size — e.g.
// "215/55/17 Michelin" ($186) is NOT the budget "215/55/17" shelf tire ($59.80).
// (Cooper / Goodyear / Falken / Kumho are excluded here — those ARE stocked for
// certain sizes, so they stay eligible for the inventory match.)
const NON_STOCK_BRANDS = ['continental','michelin','pirelli','bridgestone','hankook','firestone','toyo']
function hasNonStockBrand(name) {
  const n = (name || '').toLowerCase().replace('bridge stone', 'bridgestone')
  return NON_STOCK_BRANDS.some(b => n.includes(b))
}

export default function Orders() {
  // Require sign-in: send anonymous visitors to /login before any data renders.
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState('date')
  const [sortDir,    setSortDir]    = useState('desc')
  const [showEst,    setShowEst]    = useState(true) // show rows with estimated cost
  const [srcFilter,  setSrcFilter]  = useState('all') // filter by cost source / match status
  const [sizeFilter, setSizeFilter] = useState('all') // filter by tire size
  const [flaggedOnly, setFlaggedOnly] = useState(false) // show only suspicious-cost rows
  const [asOf,       setAsOf]       = useState('all') // 'all' | '2026-05-31' (book period)
  const [view,       setView]       = useState('live') // 'live' | 'precomputed'
  const [opRows,     setOpRows]     = useState([])
  const [opLoading,  setOpLoading]  = useState(false)
  const [opLoaded,   setOpLoaded]   = useState(false)
  const [opSearch,   setOpSearch]   = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: lineItems }, { data: weldon }] = await Promise.all([
        (async () => {
          let all = [], from = 0
          while (true) {
            const { data } = await supabase.from('clover_line_items').select('date, item_name, revenue, quantity, order_id').order('date', { ascending: false }).range(from, from + 999)
            if (!data || data.length === 0) break
            all = [...all, ...data]
            if (data.length < 1000) break
            from += 1000
          }
          return { data: all }
        })(),
        // Weldon order history = source of truth for cost + inventory/same-day.
        supabase.from('weldon_orders').select('order_date, size, qty, unit_cost, description'),
      ])

      // 4/15–17 stock-up profile per size (from the actual Weldon orders):
      // budget = cheapest unit, max = priciest stocked, cooper = the Cooper variant cost.
      const STOCKUP_DATE = '2026-04-15', STOCKUP_END = '2026-04-17'
      const stockup = {}
      const bySize = {}
      ;(weldon || []).forEach(o => {
        (bySize[o.size] = bySize[o.size] || []).push(o)
        if (o.order_date >= STOCKUP_DATE && o.order_date <= STOCKUP_END) {
          const c = Number(o.unit_cost)
          if (c > 0) { // ignore zero/blank-cost rows so they can't poison the budget
            const s = stockup[o.size] = stockup[o.size] || { budget: Infinity, max: 0, cooper: null }
            s.budget = Math.min(s.budget, c); s.max = Math.max(s.max, c)
            if (/cooper/i.test(o.description || '')) s.cooper = c
          }
        }
      })
      const dayGap = (a, b) => Math.abs(Math.round((new Date(a) - new Date(b)) / 864e5))
      // Tight same-day match: a small customer order (qty ≤ 4) within ±3 days, brand-preferred.
      // This is how we both flag a same-day special order and price it.
      const tightSameDay = (size, date, itemWords) => {
        let best = null, bg = 99
        for (const o of bySize[size] || []) {
          if (Number(o.qty) > 4) continue
          if (!(Number(o.unit_cost) > 0)) continue // a $0/blank Weldon order is not a real cost
          const g = dayGap(o.order_date, date); if (g > 3) continue
          const score = g - (sharedModel(itemWords, o.description) ? 10 : 0)
          if (score < bg) { bg = score; best = o }
        }
        return best ? Number(best.unit_cost) : null
      }
      // Same-day match: among Weldon orders of this size, prefer one that's
      // affordable (cost ≤ sale — a special order isn't placed at a loss), then a
      // brand match, then the order closest in date (the tire actually bought for
      // this customer). Returns the matched order so we can also show the date gap.
      const sameDayMatch = (size, date, itemWords, sale) => {
        let best = null, bestScore = -Infinity
        for (const o of bySize[size] || []) {
          const cost = Number(o.unit_cost)
          if (!(cost > 0)) continue // skip zero/blank-cost orders — never anchor cost to $0
          const affordable = cost <= sale + 0.01 ? 1 : 0
          const model = sharedModel(itemWords, o.description) // shared brand/model words
          const score = affordable * 1e6 + model * 1e4 - dayGap(o.order_date, date)
          if (score > bestScore) { bestScore = score; best = o }
        }
        return best
      }

      if (lineItems) {
        setRows(lineItems.map(r => {
          const sale = Number(r.revenue)
          const qty  = Number(r.quantity || 1)
          const isUsed = /used/i.test(r.item_name || '')
          const normalized = normalizeSize(r.item_name)
          const isService = !normalized && !isUsed
          const itemWords = modelWords(r.item_name)
          const isCooper = /cooper/i.test(r.item_name || '') || /\bbrand\b/i.test(r.item_name || '')

          // Cost + classification straight from the Weldon orders.
          const su = stockup[normalized]
          const tight = normalized ? tightSameDay(normalized, r.date, itemWords) : null
          const maxStocked = su ? su.max : 0
          // A tier that cost more than anything we stocked in that size can't be shelf stock.
          const pricedAbove = tight != null && maxStocked > 0 && tight > maxStocked + 0.5
          const isInventory = !isService && !isUsed && r.date >= STOCKUP_DATE
            && !!su && !hasNonStockBrand(r.item_name) && !pricedAbove

          let costPerUnit, costSource, estimated = false, matchGap = null, matchModelShared = null
          if (isUsed) { costPerUnit = 18; costSource = 'used_tire_inventory' }
          else if (isService) { costPerUnit = 0; costSource = 'service' }
          else if (isInventory) { costPerUnit = (isCooper && su.cooper) ? su.cooper : su.budget; costSource = 'inventory' }
          else {
            const m = sameDayMatch(normalized, r.date, itemWords, sale)
            costPerUnit = m ? Number(m.unit_cost) : ((su ? su.budget : null) ?? (sale * FALLBACK_RATIO))
            costSource = 'weldon_same_day'
            estimated = !m && !su
            // signed gap: positive = the tire was bought BEFORE the sale (a real special order)
            if (m) { matchGap = Math.round((new Date(r.date) - new Date(m.order_date)) / 864e5); matchModelShared = sharedModel(itemWords, m.description) }
          }

          // ── Price-tier inference ────────────────────────────────────────────
          // A generic Clover name ("235/45/18 Brand") can't be brand-matched, so the
          // date match can land on a cheap tier even though the SALE PRICE says it was
          // a premium tire. When the price implies a tier well above the cost we
          // matched, re-cost to the tier the price points at (flagged as an estimate).
          // Only fires when we did NOT match a brand/model, and only re-costs UP — a
          // low price (e.g. a premium tire sold near cost) keeps its real match.
          let priceInferred = false
          if (!isUsed && !isService && normalized && (itemWords.size === 0 || !matchModelShared)) {
            const sizeCosts = (bySize[normalized] || []).map(o => Number(o.unit_cost)).filter(c => c > 0)
            if (sizeCosts.length) {
              const expected = sale * (1 - TYP_MARGIN) // cost the sale price implies at a normal markup
              const tierCost = sizeCosts.reduce((b, c) => Math.abs(c - expected) < Math.abs(b - expected) ? c : b)
              if (tierCost > costPerUnit * 1.3) { costPerUnit = tierCost; estimated = true; priceInferred = true }
            }
          }

          const isEstimated = estimated
          const isExact = !estimated && !isService
          // "Matched" = cost anchored to a real purchase: a Weldon order from up to
          // 14 days before the sale, or up to 7 days after (deposit-then-order).
          // Beyond that window it's an estimate. matchGap = sale − order (days);
          // positive = bought before the sale.
          const matchedSameDay = costSource === 'weldon_same_day' && matchGap != null && matchGap >= -7 && matchGap <= 14
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
            isEstimated,
            isExact,
            isUsed,
            isInventory,
            costSource,
            matchGap,
            matchedSameDay,
            matchModelShared,
            priceInferred,
            hasModelWords: itemWords.size > 0,
            normalizedSize: normalized,
            orderId: r.order_id,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  // Lazily load the precomputed order_profit table the first time that tab opens.
  // 551 rows < the 1000-row cap, so one query (no append loop = no risk of doubling).
  useEffect(() => {
    if (view !== 'precomputed' || opLoaded) return
    setOpLoading(true)
    supabase
      .from('order_profit')
      .select('sale_date,item_name,tire_size,revenue,cost,profit,margin_pct,cost_source,tire_type')
      .order('sale_date', { ascending: false })
      .then(({ data }) => { setOpRows(data || []); setOpLoaded(true); setOpLoading(false) })
  }, [view, opLoaded])

  const toggleSort = (col) => {
    if (sort === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(col); setSortDir('desc') }
  }

  // Distinct tire sizes present (with row counts), for the size dropdown.
  const sizes = useMemo(() => {
    const counts = {}
    rows.forEach(r => { if (r.normalizedSize) counts[r.normalizedSize] = (counts[r.normalizedSize] || 0) + 1 })
    return Object.keys(counts)
      .sort((a, b) => { const pa = a.split('/').map(Number), pb = b.split('/').map(Number); return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2] })
      .map(size => ({ size, count: counts[size] }))
  }, [rows])

  // Per-size typical (median) margin, for outlier context in the flag tooltip.
  const sizeStats = useMemo(() => {
    const by = {}
    rows.forEach(r => {
      if (r.isExact && !r.isUsed && r.costSource !== 'service' && r.normalizedSize)
        (by[r.normalizedSize] = by[r.normalizedSize] || []).push(r.margin)
    })
    const out = {}
    for (const k in by) { const a = by[k].slice().sort((x, y) => x - y); out[k] = { median: a[Math.floor(a.length / 2)], n: a.length } }
    return out
  }, [rows])

  // Flag a row whose cost looks suspicious, so mismatches surface on their own:
  //  • mismatch — the sale names a brand/model but the matched purchase shares none
  //    of those words (cost was borrowed from a different tire of the same size);
  //  • high/low — a real (non-estimated) tire whose margin is outside the normal
  //    25–60% band, which usually means the cost is wrong.
  const rowFlag = (r) => {
    if (r.costSource === 'used_tire_inventory' || r.costSource === 'service') return null
    if (!r.isEstimated) {
      const st = sizeStats[r.normalizedSize]
      const typ = st && st.n >= 3 ? ` (≈${st.median.toFixed(0)}% typical for ${r.normalizedSize})` : ''
      if (r.margin >= 65) return { level: 'high', reason: `Margin ${r.margin.toFixed(0)}% looks high${typ} — cost may be too low. Verify.` }
      if (r.margin < 8)   return { level: 'low',  reason: `Margin ${r.margin.toFixed(0)}% looks low${typ} — cost may be too high. Verify.` }
    }
    return null
  }

  const filtered = useMemo(() => {
    let r = rows
    if (asOf !== 'all') r = r.filter(x => x.date <= asOf)
    if (search) r = r.filter(r => r.item.toLowerCase().includes(search.toLowerCase()))
    if (!showEst) r = r.filter(r => !r.isEstimated)
    if (flaggedOnly) r = r.filter(x => !!rowFlag(x))
    if (sizeFilter !== 'all') r = r.filter(x => x.normalizedSize === sizeFilter)
    if (srcFilter !== 'all') r = r.filter(x => {
      const sdMatched = x.matchedSameDay
      if (srcFilter === 'sameday_matched') return sdMatched
      if (srcFilter === 'sameday_est')     return x.costSource === 'weldon_same_day' && !sdMatched
      if (srcFilter === 'price_inferred')  return x.priceInferred
      if (srcFilter === 'inventory')       return x.costSource === 'inventory'
      if (srcFilter === 'used')            return x.costSource === 'used_tire_inventory'
      if (srcFilter === 'service')         return x.costSource === 'service'
      return true
    })
    return [...r].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sort === 'date') {
        const dateCmp = mul * a.date.localeCompare(b.date)
        if (dateCmp !== 0) return dateCmp
        return a.orderId.localeCompare(b.orderId) // group same-order rows together
      }
      if (sort === 'profit') return mul * (a.profit - b.profit)
      if (sort === 'margin') return mul * (a.margin - b.margin)
      if (sort === 'sale')   return mul * (a.sale - b.sale)
      return 0
    })
  }, [rows, search, sort, sortDir, showEst, asOf, srcFilter, sizeFilter, flaggedOnly])

  const matched     = rows.filter(r => !r.isEstimated)
  const invCount     = filtered.filter(r => r.costSource === 'inventory').length
  const sameDayCount = filtered.filter(r => r.costSource === 'weldon_same_day').length
  const sameDayMatched = filtered.filter(r => r.matchedSameDay).length
  const sameDayProxy   = sameDayCount - sameDayMatched
  const flaggedCount   = filtered.filter(r => rowFlag(r)).length
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)
  const totalRev    = filtered.reduce((s, r) => s + r.sale, 0)
  const avgMargin   = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0

  // Per-tire economics, split new vs used. Both exclude service lines (mounting/
  // labor: no tire, cost 0 — they'd inflate the $/tire and margin).
  const perTire = (arr) => {
    const units  = arr.reduce((s, r) => s + (Number(r.qty) || 1), 0)
    const profit = arr.reduce((s, r) => s + r.profit, 0)
    const rev    = arr.reduce((s, r) => s + r.sale, 0)
    return { units, avg: units > 0 ? profit / units : 0, margin: rev > 0 ? (profit / rev) * 100 : 0 }
  }
  const newT  = perTire(filtered.filter(r => r.costSource === 'inventory' || r.costSource === 'weldon_same_day'))
  const usedT = perTire(filtered.filter(r => r.costSource === 'used_tire_inventory'))

  // Export the shown orders (respects filter/sort/as-of) to CSV.
  const downloadCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`
    const srcLabel = (r) => {
      if (r.costSource === 'weldon_same_day')
        return r.matchGap == null ? 'Est' : (r.matchedSameDay ? `Same-Day (${Math.abs(r.matchGap)}d)` : `Est (${Math.abs(r.matchGap)}d)`)
      return { inventory: 'Inventory', used_tire_inventory: 'Used', service: 'Service' }[r.costSource] || r.costSource
    }
    const csv = [['Date', 'Item', 'Source', 'Qty', 'Sale', 'Cost', 'Profit', 'Margin %'].map(esc).join(',')]
    filtered.forEach(r => csv.push([r.date, r.item, srcLabel(r), r.qty, r.sale.toFixed(2), r.cost.toFixed(2), r.profit.toFixed(2), r.margin.toFixed(1)].map(esc).join(',')))
    csv.push(['TOTAL', '', '', '', totalRev.toFixed(2), (totalRev - totalProfit).toFixed(2), totalProfit.toFixed(2), avgMargin.toFixed(1)].map(esc).join(','))
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reydel-orders-${asOf === 'all' ? 'all' : asOf}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  // Best margin size — NEW tires only (exclude used), matched, minimum 3 sales
  const bySize = {}
  matched.forEach(r => {
    const k = r.normalizedSize
    if (!k || r.isUsed) return
    if (!bySize[k]) bySize[k] = { size: k, totalProfit: 0, totalRev: 0, count: 0 }
    bySize[k].totalProfit += r.profit
    bySize[k].totalRev    += r.sale
    bySize[k].count++
  })
  const bestMarginSize = Object.values(bySize)
    .filter(s => s.count >= 3)
    .map(s => ({ ...s, margin: s.totalProfit / s.totalRev * 100 }))
    .sort((a, b) => b.margin - a.margin)[0]

  // Precomputed (order_profit) view
  const opFiltered = opSearch
    ? opRows.filter(r => `${r.item_name || ''} ${r.tire_size || ''}`.toLowerCase().includes(opSearch.toLowerCase()))
    : opRows
  const opRev    = opFiltered.reduce((s, r) => s + Number(r.revenue || 0), 0)
  const opCost   = opFiltered.reduce((s, r) => s + Number(r.cost || 0), 0)
  const opProfit = opFiltered.reduce((s, r) => s + Number(r.profit || 0), 0)
  const opMargin = opRev > 0 ? (opProfit / opRev) * 100 : 0

  return (
    <>
      <Head><title>Reydel Tire — Orders</title></Head>
      <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
        <TopNav active="orders" right={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
              {matched.length} / {rows.length} matched to Weldon costs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Clover + Weldon</div>
            </div>
          </div>
        } />

        <div style={{ padding: '24px 28px' }}>
            {/* Tabs: live (Clover+Weldon) vs precomputed (order_profit) */}
            <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E5E5E5', marginBottom: '20px' }}>
              {[
                { id: 'live',        label: 'Orders — Live (Clover + Weldon)' },
                { id: 'precomputed', label: 'Orders — Precomputed (order_profit)' },
              ].map(t => (
                <button key={t.id} onClick={() => setView(t.id)} style={{
                  padding: '8px 16px', fontSize: '10px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: view === t.id ? '#1a1a1a' : '#888',
                  borderBottom: view === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                  marginBottom: '-1px',
                }}>{t.label}</button>
              ))}
            </div>

            {view === 'live' && (loading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'TOTAL ORDERS',      value: filtered.length.toLocaleString(),    sub: 'line items shown',           sc: '#888' },
                    { label: 'PROFIT / NEW TIRE',  value: fmtC(newT.avg),  sub: `${newT.margin.toFixed(1)}% · ${newT.units} sold`, sc: '#16a34a' },
                    { label: 'PROFIT / USED TIRE', value: fmtC(usedT.avg), sub: usedT.units ? `${usedT.margin.toFixed(1)}% · ${usedT.units} sold` : 'none sold', sc: '#16a34a' },
                    { label: 'BEST MARGIN SIZE',
                      value: bestMarginSize ? bestMarginSize.size : '—',
                      sub: bestMarginSize ? `${bestMarginSize.margin.toFixed(1)}% · ${bestMarginSize.count} sold` : 'need 3+ matched sales',
                      sc: THEME.accent },
                    { label: 'TOTAL PROFIT',       value: fmt0(totalProfit),                  sub: 'matched + est.',             sc: '#16a34a' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: k.label === 'BEST MARGIN SIZE' ? '14px' : '18px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace', lineHeight: 1.2 }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {[{ k: 'all', l: 'ALL' }, { k: '2026-05-31', l: 'THRU 5/31' }].map(o => (
                    <button key={o.k} onClick={() => setAsOf(o.k)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      border: '1px solid #E5E5E5', borderRadius: '4px', cursor: 'pointer',
                      background: asOf === o.k ? '#1a1a1a' : '#fff', color: asOf === o.k ? '#fff' : '#888',
                    }}>{o.l}</button>
                  ))}
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by tire size or item..."
                    style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                  {[{ key: 'date', label: 'DATE' }, { key: 'profit', label: 'PROFIT' }, { key: 'margin', label: 'MARGIN' }, { key: 'sale', label: 'SALE' }].map(s => (
                    <button key={s.key} onClick={() => toggleSort(s.key)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: sort === s.key ? THEME.accent : '#F0F0F0',
                      color: sort === s.key ? '#fff' : '#888',
                    }}>
                      {s.label} {sort === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  ))}
                  <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} style={{
                    padding: '7px 10px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
                    border: '1px solid #E5E5E5', borderRadius: '4px', cursor: 'pointer', maxWidth: '170px',
                    background: sizeFilter === 'all' ? '#F0F0F0' : '#dbeafe', color: '#555',
                  }}>
                    <option value="all">ALL SIZES ({sizes.length})</option>
                    {sizes.map(s => <option key={s.size} value={s.size}>{s.size} ({s.count})</option>)}
                  </select>
                  <select value={srcFilter} onChange={e => setSrcFilter(e.target.value)} style={{
                    padding: '7px 10px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
                    border: '1px solid #E5E5E5', borderRadius: '4px', cursor: 'pointer',
                    background: srcFilter === 'all' ? '#F0F0F0' : '#fef3c7', color: '#555',
                  }}>
                    <option value="all">ALL SOURCES</option>
                    <option value="inventory">INVENTORY</option>
                    <option value="sameday_matched">SAME-DAY · MATCHED</option>
                    <option value="sameday_est">SAME-DAY · EST.</option>
                    <option value="price_inferred">~ TIER EST (price)</option>
                    <option value="used">USED</option>
                    <option value="service">SERVICE</option>
                  </select>
                  <button onClick={() => setShowEst(e => !e)} style={{
                    padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                    border: '1px solid #E5E5E5', borderRadius: '4px', cursor: 'pointer',
                    background: showEst ? '#F0F0F0' : THEME.accent,
                    color: showEst ? '#888' : '#fff',
                  }}>
                    {showEst ? 'HIDE EST.' : 'SHOW EST.'}
                  </button>
                  <button onClick={() => setFlaggedOnly(f => !f)} title="Show only rows whose cost looks suspicious" style={{
                    padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    background: flaggedOnly ? '#f59e0b' : '#F0F0F0', color: flaggedOnly ? '#fff' : '#888',
                  }}>⚠ FLAGGED{flaggedCount ? ` (${flaggedCount})` : ''}</button>
                  <button onClick={downloadCSV} style={{
                    padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#16a34a', color: '#fff',
                  }}>↓ CSV</button>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>DATE</th>
                        <th style={hcell('left')}>TIRE / ITEM</th>
                        <th style={hcell('left')}>SOURCE</th>
                        <th style={hcell('right')}>QTY</th>
                        <th style={hcell('right')}>SALE</th>
                        <th style={hcell('right')}>COST</th>
                        <th style={hcell('right')}>PROFIT</th>
                        <th style={hcell('right')}>MARGIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => { const flag = rowFlag(r); return (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = flag ? '#FCEFC7' : '#F8F8F8'}
                          onMouseLeave={e => e.currentTarget.style.background = flag ? '#FEF9E7' : 'transparent'}
                          style={{ background: flag ? '#FEF9E7' : 'transparent' }}
                        >
                          <td style={cell('left', { color: '#888', whiteSpace: 'nowrap' })}>{r.date}</td>
                          <td style={cell('left', { maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                            <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{r.item}</span>
                          </td>
                          <td style={cell('left')}>
                            {flag && <span title={flag.reason} style={{ cursor: 'help', marginRight: '5px' }}>⚠️</span>}
                            {(() => {
                              if (r.priceInferred) return <span title="Cost estimated from the sale price — the Clover item had no brand to match exactly, and the price points to this tier" style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '10px', whiteSpace: 'nowrap', background: '#ede9fe', color: '#6d28d9' }}>~ Tier est</span>
                              if (r.costSource === 'weldon_same_day') {
                                const matched = r.matchedSameDay
                                const g = r.matchGap == null ? null : Math.abs(r.matchGap)
                                const bg = matched ? '#fef3c7' : '#f3f4f6'
                                const fg = matched ? '#92400e' : '#9ca3af'
                                const label = g == null ? '~ Est' : matched ? `Same-Day ${g}d` : `~ Est ${g}d`
                                const tip = g == null
                                  ? 'No Weldon purchase of this size — cost is an estimate'
                                  : matched
                                    ? `Matched a Weldon order ${g} day(s) ${r.matchGap >= 0 ? 'before' : 'after'} the sale`
                                    : `No same-day purchase — cost borrowed from a Weldon order ${g} days away`
                                return <span title={tip} style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '10px', whiteSpace: 'nowrap', background: bg, color: fg }}>{label}</span>
                              }
                              const map = {
                                inventory:           ['#dbeafe', '#1d4ed8', 'Inventory'],
                                used_tire_inventory: ['#f3f4f6', '#6b7280', 'Used'],
                                service:             ['#f3f4f6', '#9ca3af', 'Service'],
                              }
                              const [bg, fg, label] = map[r.costSource] || map.service
                              return <span style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '10px', whiteSpace: 'nowrap', background: bg, color: fg }}>{label}</span>
                            })()}
                          </td>
                          <td style={cell('right', { color: '#888' })}>{r.qty}</td>
                          <td style={cell('right', { color: '#1a1a1a' })}>{fmtC(r.sale)}</td>
                          <td style={cell('right')}>
                            <span style={{ color: r.isEstimated ? '#aaa' : '#888' }}>
                              {fmtC(r.cost)}{r.isEstimated ? '*' : ''}
                            </span>
                          </td>
                          <td style={cell('right', { color: '#16a34a', fontWeight: '600' })}>{fmtC(r.profit)}</td>
                          <td style={cell('right')}>
                            <span style={{
                              padding: '2px 7px', borderRadius: '3px', fontSize: '10px',
                              background: r.margin >= 60 ? '#dcfce7' : r.margin >= 45 ? '#fef3c7' : '#fee2e2',
                              color:      r.margin >= 60 ? '#16a34a' : r.margin >= 45 ? '#92400e' : THEME.accent,
                            }}>
                              {r.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>
                      No items match
                    </div>
                  )}

                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {filtered.length.toLocaleString()} rows &nbsp;·&nbsp; {invCount.toLocaleString()} inventory &nbsp;·&nbsp; {sameDayCount.toLocaleString()} same-day ({sameDayMatched} matched · {sameDayProxy} est.) &nbsp;·&nbsp; <span style={{ color: flaggedCount ? '#b45309' : '#888' }}>⚠ {flaggedCount} flagged</span> &nbsp;·&nbsp; * = estimated cost
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      {fmt0(totalProfit)} est. profit shown
                    </div>
                  </div>
                </div>
              </>
            ))}

            {view === 'precomputed' && (opLoading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'LINE ITEMS',    value: opFiltered.length.toLocaleString(), sub: 'from order_profit', sc: '#888' },
                    { label: 'TOTAL REVENUE', value: fmt0(opRev),    sub: 'shown',                       sc: '#16a34a' },
                    { label: 'TOTAL COST',    value: fmt0(opCost),   sub: 'shown',                       sc: THEME.accent },
                    { label: 'TOTAL PROFIT',  value: fmt0(opProfit), sub: `${opMargin.toFixed(1)}% margin`, sc: '#16a34a' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                  <input value={opSearch} onChange={e => setOpSearch(e.target.value)}
                    placeholder="Filter by tire size or item..."
                    style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>DATE</th>
                        <th style={hcell('left')}>TIRE / ITEM</th>
                        <th style={hcell('left')}>SIZE</th>
                        <th style={hcell('right')}>REVENUE</th>
                        <th style={hcell('right')}>COST</th>
                        <th style={hcell('right')}>PROFIT</th>
                        <th style={hcell('right')}>MARGIN</th>
                        <th style={hcell('left')}>COST SOURCE</th>
                        <th style={hcell('left')}>TYPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opFiltered.map((r, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={cell('left', { color: '#888', whiteSpace: 'nowrap' })}>{r.sale_date}</td>
                          <td style={cell('left', { color: '#1a1a1a', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{r.item_name}</td>
                          <td style={cell('left', { color: '#888' })}>{r.tire_size}</td>
                          <td style={cell('right', { color: '#1a1a1a' })}>{r.revenue != null ? fmtC(Number(r.revenue)) : '—'}</td>
                          <td style={cell('right', { color: '#888' })}>{r.cost != null ? fmtC(Number(r.cost)) : '—'}</td>
                          <td style={cell('right', { color: '#16a34a', fontWeight: '600' })}>{r.profit != null ? fmtC(Number(r.profit)) : '—'}</td>
                          <td style={cell('right')}>
                            {r.margin_pct != null ? (
                              <span style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '10px',
                                background: Number(r.margin_pct) >= 60 ? '#dcfce7' : Number(r.margin_pct) >= 45 ? '#fef3c7' : '#fee2e2',
                                color:      Number(r.margin_pct) >= 60 ? '#16a34a' : Number(r.margin_pct) >= 45 ? '#92400e' : THEME.accent }}>
                                {Number(r.margin_pct).toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td style={cell('left', { color: '#888' })}>{r.cost_source}</td>
                          <td style={cell('left', { color: '#888' })}>{r.tire_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {opFiltered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>
                      No items{opSearch ? ' match' : ''}
                    </div>
                  )}

                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {opFiltered.length.toLocaleString()} rows &nbsp;·&nbsp; source: order_profit table
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      {fmt0(opProfit)} profit shown
                    </div>
                  </div>
                </div>
              </>
            ))}
          </div>
      </div>
    </>
  )
}
