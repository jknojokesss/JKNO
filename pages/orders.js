import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmtC = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// COGS ratio: $71,389 total COGS / $173,172 Clover revenue = 41.2%
const COGS_RATIO = 0.412

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
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clover_line_items')
        .select('date, item_name, revenue, quantity, order_id')
        .order('date', { ascending: false })

      if (data) {
        setRows(data.map(r => {
          const sale   = Number(r.revenue)
          const cost   = sale * COGS_RATIO
          const profit = sale - cost
          const margin = sale > 0 ? (profit / sale) * 100 : 0
          return {
            date:     r.date,
            item:     r.item_name || 'Unknown',
            qty:      Number(r.quantity || 1),
            sale,
            cost,
            profit,
            margin,
            orderId:  r.order_id,
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
    let r = search
      ? rows.filter(r => r.item.toLowerCase().includes(search.toLowerCase()))
      : rows
    return [...r].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sort === 'date')   return mul * a.date.localeCompare(b.date)
      if (sort === 'profit') return mul * (a.profit - b.profit)
      if (sort === 'margin') return mul * (a.margin - b.margin)
      if (sort === 'sale')   return mul * (a.sale   - b.sale)
      return 0
    })
  }, [rows, search, sort, sortDir])

  const totalProfit   = rows.reduce((s, r) => s + r.profit, 0)
  const totalRevenue  = rows.reduce((s, r) => s + r.sale, 0)
  const avgProfit     = rows.length > 0 ? totalProfit / rows.length : 0
  const avgMargin     = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Best margin size = item with highest avg sale price (proxy until real COGS data)
  const byItem = {}
  rows.forEach(r => {
    if (!byItem[r.item]) byItem[r.item] = { count: 0, revenue: 0 }
    byItem[r.item].count++
    byItem[r.item].revenue += r.sale
  })
  const topItem = Object.entries(byItem).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || '—'

  const SortBtn = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ ...hcell('right'), cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sort === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <>
      <Head><title>Reydel Tire — Orders</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="orders" />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>ORDERS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Clover POS · Live</div>
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
                    { label: 'TOTAL ORDERS',       value: rows.length.toLocaleString(),  sub: 'line items',           sc: '#888' },
                    { label: 'AVG PROFIT / TIRE',  value: fmtC(avgProfit),               sub: `${avgMargin.toFixed(1)}% avg margin`, sc: '#16a34a' },
                    { label: 'TOP ITEM',           value: topItem,                        sub: 'by total revenue',     sc: THEME.accent },
                    { label: 'TOTAL EST. PROFIT',  value: fmt0(totalProfit),             sub: 'est. from COGS ratio', sc: '#16a34a' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: k.label === 'TOP ITEM' ? '13px' : '18px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace', lineHeight: 1.2 }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Search + sort bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by tire size or item..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                  {[{ key: 'date', label: 'DATE' }, { key: 'profit', label: 'PROFIT' }, { key: 'margin', label: 'MARGIN' }, { key: 'sale', label: 'SALE PRICE' }].map(s => (
                    <button key={s.key} onClick={() => toggleSort(s.key)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: sort === s.key ? THEME.accent : '#F0F0F0',
                      color: sort === s.key ? '#fff' : '#888',
                    }}>
                      {s.label} {sort === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>DATE</th>
                        <th style={hcell('left')}>TIRE / ITEM</th>
                        <th style={hcell('right')}>QTY</th>
                        <th style={hcell('right')}>SALE PRICE</th>
                        <th style={hcell('right')}>EST. COST</th>
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
                          <td style={cell('left', { color: '#1a1a1a', fontWeight: '500', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{r.item}</td>
                          <td style={cell('right', { color: '#888' })}>{r.qty}</td>
                          <td style={cell('right', { color: '#1a1a1a' })}>{fmtC(r.sale)}</td>
                          <td style={cell('right', { color: '#888' })}>{fmtC(r.cost)}</td>
                          <td style={cell('right', { color: '#16a34a', fontWeight: '600' })}>{fmtC(r.profit)}</td>
                          <td style={cell('right')}>
                            <span style={{
                              padding: '2px 7px', borderRadius: '3px', fontSize: '10px',
                              background: r.margin >= 65 ? '#dcfce7' : r.margin >= 50 ? '#fef3c7' : '#fee2e2',
                              color:      r.margin >= 65 ? '#16a34a' : r.margin >= 50 ? '#92400e' : THEME.accent,
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
                      No items match "{search}"
                    </div>
                  )}

                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {filtered.length.toLocaleString()} rows &nbsp;·&nbsp; est. COGS based on {(COGS_RATIO * 100).toFixed(1)}% ratio from pl_totals
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      {fmt0(filtered.reduce((s, r) => s + r.profit, 0))} est. profit shown
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
