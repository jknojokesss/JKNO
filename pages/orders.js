import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import TopNav from '../components/TopNav'

const fmtC = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const FALLBACK_RATIO = 0.412 // used when no Weldon match found

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

// Detect premium brand in item name (matches weldon_brand_costs.brand values)
const BRANDS = ['continental','michelin','pirelli','bridgestone','goodyear','cooper','kumho','hankook','falken','firestone','toyo']
function detectBrand(name) {
  if (!name) return null
  const n = name.toLowerCase().replace('bridge stone', 'bridgestone')
  return BRANDS.find(b => n.includes(b)) || null
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
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState('date')
  const [sortDir,    setSortDir]    = useState('desc')
  const [showEst,    setShowEst]    = useState(true) // show rows with estimated cost
  const [view,       setView]       = useState('live') // 'live' | 'precomputed'
  const [opRows,     setOpRows]     = useState([])
  const [opLoading,  setOpLoading]  = useState(false)
  const [opLoaded,   setOpLoaded]   = useState(false)
  const [opSearch,   setOpSearch]   = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: lineItems }, { data: costs }, { data: brandCosts }, { data: itemCosts }, { data: stockRows }] = await Promise.all([
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
        // weldon fallback tables below
        supabase.from('weldon_costs').select('tire_size, cost'),
        supabase.from('weldon_brand_costs').select('brand, tire_size, cost'),
        supabase.from('clover_item_costs').select('item_label, cost'),
        // stock-up inventory (4/15 bulk buy) — drives inventory vs same-day classification
        supabase.from('stock_purchases').select('item_label, unit_cost, track_clover_sales'),
      ])

      // Build size → cost lookup (budget / no-brand)
      const costMap = {}
      costs?.forEach(r => { costMap[r.tire_size] = Number(r.cost) })

      // Build brand+size → cost lookup (premium brands)
      const brandCostMap = {}
      brandCosts?.forEach(r => { brandCostMap[`${r.brand}|${r.tire_size}`] = Number(r.cost) })

      // Build exact-label → cost lookup (authoritative, from 4/15 inventory spreadsheet)
      const exactMap = {}
      itemCosts?.forEach(r => { exactMap[r.item_label.trim().toLowerCase()] = Number(r.cost) })

      // Build stock-up size set + cost map for inventory vs same-day classification.
      // A sale is "Inventory" (sold from shelf stock) when its size was part of the
      // 4/15 stock-up AND the sale happened on/after that date. Otherwise it was a
      // same-day Weldon order placed for that customer.
      const STOCKUP_DATE = '2026-04-15'
      const stockSizes = new Set()
      const stockVariantCost = {}   // "size" or "size|cooper" → stocked unit cost
      const maxStockedForSize = {}  // size → priciest tire we actually stocked in it
      stockRows?.forEach(r => {
        if (!r.track_clover_sales) return
        const sz = normalizeSize(r.item_label)
        if (!sz) return
        stockSizes.add(sz)
        const lbl = r.item_label.toLowerCase()
        const b = ['cooper', 'falken', 'goodyear', 'kumho'].find(x => lbl.includes(x))
        const cost = Number(r.unit_cost)
        stockVariantCost[b ? `${sz}|${b}` : sz] = cost
        maxStockedForSize[sz] = Math.max(maxStockedForSize[sz] ?? 0, cost)
      })

      if (lineItems) {
        setRows(lineItems.map(r => {
          const sale = Number(r.revenue)
          const qty  = Number(r.quantity || 1)
          const normalized = normalizeSize(r.item_name)
          const brand = detectBrand(r.item_name)
          const isService  = !normalized
          const isUsed = /used/i.test(r.item_name || '')
          const isCooper = /cooper/i.test(r.item_name || '')

          // Cost lookup first — curated exact label wins, then brand+size, then size.
          const exactCost = exactMap[(r.item_name || '').trim().toLowerCase()]
          const brandCost = (brand && normalized) ? brandCostMap[`${brand}|${normalized}`] : null
          const sizeCost  = normalized ? costMap[normalized] : null
          const lookedUp  = exactCost ?? brandCost ?? sizeCost

          // Classify inventory vs same-day. A sale is off the 4/15 shelf only if its
          // size was stocked, on/after the stock-up, it's not a premium brand we never
          // carried, AND it doesn't cost more than the priciest tire we stocked in that
          // size (a "255/45/19 Brand" Pirelli at $253 isn't the $85/$179 shelf stock).
          const isStockSize = normalized != null && stockSizes.has(normalized)
          const maxStocked = normalized ? (maxStockedForSize[normalized] ?? 0) : 0
          const pricedAboveStock = lookedUp != null && maxStocked > 0 && lookedUp > maxStocked + 0.5
          const isInventory = !isService && !isUsed && r.date >= STOCKUP_DATE
            && isStockSize && !hasNonStockBrand(r.item_name) && !pricedAboveStock
          const costSource = isService ? 'service'
            : isUsed ? 'used_tire_inventory'
            : isInventory ? 'inventory'
            : 'weldon_same_day'

          // Inventory cost = the stocked variant (curated exact cost wins, then the
          // Cooper / budget shelf cost). Same-day cost = the looked-up Weldon cost.
          const invCost = isInventory
            ? (exactCost ?? (isCooper ? stockVariantCost[`${normalized}|cooper`] : null) ?? stockVariantCost[normalized])
            : null
          const costPerUnit = invCost != null ? invCost
            : exactCost != null ? exactCost
            : isService ? 0
            : (lookedUp ?? sale * FALLBACK_RATIO)
          const isEstimated = invCost == null && exactCost == null && !isService && lookedUp == null
          const isExact = invCost != null || exactCost != null
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

  const filtered = useMemo(() => {
    let r = rows
    if (search) r = r.filter(r => r.item.toLowerCase().includes(search.toLowerCase()))
    if (!showEst) r = r.filter(r => !r.isEstimated)
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
  }, [rows, search, sort, sortDir, showEst])

  const matched     = rows.filter(r => !r.isEstimated)
  const invCount     = filtered.filter(r => r.costSource === 'inventory').length
  const sameDayCount = filtered.filter(r => r.costSource === 'weldon_same_day').length
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)
  const totalRev    = filtered.reduce((s, r) => s + r.sale, 0)
  const avgProfit   = filtered.length > 0 ? totalProfit / filtered.length : 0
  const avgMargin   = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0

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
                    { label: 'AVG PROFIT / TIRE',  value: fmtC(avgProfit),                    sub: `${avgMargin.toFixed(1)}% avg margin`, sc: '#16a34a' },
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
                  <button onClick={() => setShowEst(e => !e)} style={{
                    padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                    border: '1px solid #E5E5E5', borderRadius: '4px', cursor: 'pointer',
                    background: showEst ? '#F0F0F0' : THEME.accent,
                    color: showEst ? '#888' : '#fff',
                  }}>
                    {showEst ? 'HIDE EST.' : 'SHOW EST.'}
                  </button>
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
                      {filtered.map((r, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={cell('left', { color: '#888', whiteSpace: 'nowrap' })}>{r.date}</td>
                          <td style={cell('left', { maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                            <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{r.item}</span>
                          </td>
                          <td style={cell('left')}>
                            {(() => {
                              const map = {
                                inventory:           ['#dbeafe', '#1d4ed8', 'Inventory'],
                                weldon_same_day:     ['#fef3c7', '#92400e', 'Same-Day'],
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
                      ))}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>
                      No items match
                    </div>
                  )}

                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {filtered.length.toLocaleString()} rows &nbsp;·&nbsp; {invCount.toLocaleString()} inventory &nbsp;·&nbsp; {sameDayCount.toLocaleString()} same-day &nbsp;·&nbsp; * = estimated cost (no Weldon match)
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
