import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmtC = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const FALLBACK_RATIO = 0.412 // used when no Weldon match found

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'orders',     label: 'Orders',       href: '/orders' },
  { id: 'accounts',   label: 'Accounts',     href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',     href: '/ai' },
]

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

function Sidebar({ active }) {
  const router = useRouter()
  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: THEME.sidebarBg,
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0,
      borderRight: `1px solid ${THEME.sidebarBorder}`, zIndex: 100,
    }}>
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${THEME.sidebarBorder}` }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>REYDEL</div>
        <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>TIRE & AUTO</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => router.push(item.href)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 20px', textAlign: 'left',
            background: active === item.id ? '#2A2A2A' : 'transparent',
            color: active === item.id ? '#fff' : '#666',
            border: 'none', cursor: 'pointer', fontSize: '12px',
            fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
            borderLeft: active === item.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
          }}>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${THEME.sidebarBorder}`, fontSize: '10px', color: '#3a3a3a', fontFamily: 'DM Mono, monospace' }}>
        JAN – MAY 2026
      </div>
    </div>
  )
}

export default function Orders() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState('date')
  const [sortDir,    setSortDir]    = useState('desc')
  const [showEst,    setShowEst]    = useState(true) // show rows with estimated cost

  useEffect(() => {
    async function load() {
      const [{ data: lineItems }, { data: costs }] = await Promise.all([
        supabase.from('clover_line_items').select('date, item_name, revenue, quantity, order_id').order('date', { ascending: false }),
        supabase.from('weldon_costs').select('tire_size, cost'),
      ])

      // Build size → cost lookup
      const costMap = {}
      costs?.forEach(r => { costMap[r.tire_size] = Number(r.cost) })

      if (lineItems) {
        setRows(lineItems.map(r => {
          const sale = Number(r.revenue)
          const qty  = Number(r.quantity || 1)
          const normalized = normalizeSize(r.item_name)
          const weldonCost = normalized ? costMap[normalized] : null
          const costPerUnit = weldonCost ?? sale * FALLBACK_RATIO
          const isEstimated = !weldonCost
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
            normalizedSize: normalized,
            orderId: r.order_id,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

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
      if (sort === 'date')   return mul * a.date.localeCompare(b.date)
      if (sort === 'profit') return mul * (a.profit - b.profit)
      if (sort === 'margin') return mul * (a.margin - b.margin)
      if (sort === 'sale')   return mul * (a.sale - b.sale)
      return 0
    })
  }, [rows, search, sort, sortDir, showEst])

  const matched     = rows.filter(r => !r.isEstimated)
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)
  const totalRev    = filtered.reduce((s, r) => s + r.sale, 0)
  const avgProfit   = filtered.length > 0 ? totalProfit / filtered.length : 0
  const avgMargin   = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0

  // Best margin size (matched only, minimum 3 sales)
  const bySize = {}
  matched.forEach(r => {
    const k = r.normalizedSize
    if (!k) return
    if (!bySize[k]) bySize[k] = { size: k, totalProfit: 0, totalRev: 0, count: 0 }
    bySize[k].totalProfit += r.profit
    bySize[k].totalRev    += r.sale
    bySize[k].count++
  })
  const bestMarginSize = Object.values(bySize)
    .filter(s => s.count >= 3)
    .map(s => ({ ...s, margin: s.totalProfit / s.totalRev * 100 }))
    .sort((a, b) => b.margin - a.margin)[0]

  return (
    <>
      <Head><title>Reydel Tire — Orders</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="orders" />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>ORDERS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                {matched.length} / {rows.length} matched to Weldon costs
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Clover + Weldon</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
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
                      {filtered.length.toLocaleString()} rows &nbsp;·&nbsp; * = estimated cost (no Weldon match)
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      {fmt0(totalProfit)} est. profit shown
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
