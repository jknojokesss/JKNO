import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const fmtD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

const THEME = {
  sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222',
}

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'accounts',   label: 'Accounts',     href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',     href: '/ai' },
]

const cell  = (align = 'left', extra = {}) => ({
  padding: '8px 10px', borderBottom: '1px solid #1c1c1c',
  color: '#bbb', fontSize: '11px', fontFamily: 'DM Mono, monospace',
  textAlign: align, ...extra,
})
const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#4a4a4a',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #222',
  fontFamily: 'DM Mono, monospace', textAlign: align,
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

export default function Inventory() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('revenue')
  const [tab,     setTab]     = useState('items')

  useEffect(() => {
    supabase
      .from('clover_line_items')
      .select('item_name, revenue, quantity, date')
      .then(({ data }) => {
        if (!data) { setLoading(false); return }

        // Group by item
        const map = {}
        data.forEach(row => {
          const k = row.item_name || 'Unknown'
          if (!map[k]) map[k] = { name: k, orders: 0, revenue: 0, qty: 0, dates: [] }
          map[k].orders++
          map[k].revenue += Number(row.revenue)
          map[k].qty     += Number(row.quantity || 1)
          if (row.date) map[k].dates.push(row.date)
        })
        setItems(Object.values(map))

        setLoading(false)
      })
  }, [])

  // Monthly breakdown from raw clover data
  const [monthly, setMonthly] = useState([])
  useEffect(() => {
    supabase
      .from('clover_line_items')
      .select('date, revenue')
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(row => {
          const m = row.date?.slice(0, 7)
          if (!m) return
          if (!map[m]) map[m] = { month: m, revenue: 0, orders: 0 }
          map[m].revenue += Number(row.revenue)
          map[m].orders++
        })
        const monthNames = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }
        setMonthly(
          Object.values(map)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(r => ({ ...r, label: monthNames[r.month.slice(5)] + ' ' + r.month.slice(0, 4) }))
        )
      })
  }, [])

  const sorted = useMemo(() => {
    const filtered = search
      ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
      : items
    return [...filtered].sort((a, b) =>
      sort === 'revenue' ? b.revenue - a.revenue :
      sort === 'orders'  ? b.orders  - a.orders  :
      sort === 'avg'     ? (b.revenue / b.orders) - (a.revenue / a.orders) :
      b.qty - a.qty
    )
  }, [items, search, sort])

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0)
  const totalOrders  = items.reduce((s, i) => s + i.orders, 0)
  const totalItems   = items.length
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const maxRevenue   = sorted[0]?.revenue || 1

  const tabs = [
    { id: 'items',   label: 'Items Ranked' },
    { id: 'monthly', label: 'By Month' },
  ]

  return (
    <>
      <Head><title>Reydel Tire — Sales & Items</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#111' }}>
        <Sidebar active="inventory" />

        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#fff', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>SALES & ITEMS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace' }}>Clover POS · Live</div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#555', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'CLOVER REVENUE',  value: fmt(totalRevenue), sub: 'Jan – May 2026',          sc: '#22c55e' },
                    { label: 'TOTAL ORDERS',    value: totalOrders.toLocaleString(), sub: 'line items',   sc: '#888' },
                    { label: 'UNIQUE ITEMS',    value: totalItems.toString(), sub: 'products & services', sc: '#888' },
                    { label: 'AVG ORDER VALUE', value: fmtD(avgOrder), sub: 'per line item',              sc: THEME.accent },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#fff', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #2a2a2a', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'DM Mono, monospace',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: tab === t.id ? '#fff' : '#555',
                      borderBottom: tab === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Items Ranked Tab */}
                {tab === 'items' && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    {/* Search + sort */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                      <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search items..."
                        style={{
                          flex: 1, padding: '7px 12px', background: '#111', border: '1px solid #2a2a2a',
                          borderRadius: '4px', color: '#bbb', fontSize: '11px',
                          fontFamily: 'DM Mono, monospace', outline: 'none',
                        }}
                      />
                      {[
                        { key: 'revenue', label: 'REVENUE' },
                        { key: 'orders',  label: 'ORDERS' },
                        { key: 'avg',     label: 'AVG SALE' },
                      ].map(s => (
                        <button key={s.key} onClick={() => setSort(s.key)} style={{
                          padding: '6px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace',
                          letterSpacing: '0.08em', border: 'none', borderRadius: '4px', cursor: 'pointer',
                          background: sort === s.key ? THEME.accent : '#222',
                          color: sort === s.key ? '#fff' : '#666',
                        }}>{s.label}</button>
                      ))}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={hcell('left')}>#</th>
                          <th style={hcell('left')}>ITEM</th>
                          <th style={hcell('right')}>ORDERS</th>
                          <th style={hcell('right')}>REVENUE</th>
                          <th style={hcell('right')}>AVG SALE</th>
                          <th style={hcell('left')}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((item, i) => {
                          const barPct = Math.round((item.revenue / maxRevenue) * 100)
                          return (
                            <tr key={item.name}
                              onMouseEnter={e => e.currentTarget.style.background = '#1f1f1f'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={cell('left', { color: '#3a3a3a', width: '32px' })}>{i + 1}</td>
                              <td style={cell('left', { color: i < 3 ? '#fff' : '#bbb', fontWeight: i < 3 ? '600' : '400', maxWidth: '260px' })}>
                                {item.name}
                              </td>
                              <td style={cell('right', { color: '#666' })}>{item.orders}</td>
                              <td style={cell('right', { color: i < 3 ? '#22c55e' : '#bbb', fontWeight: i < 3 ? '600' : '400' })}>
                                {fmt(item.revenue)}
                              </td>
                              <td style={cell('right', { color: '#555' })}>{fmtD(item.revenue / item.orders)}</td>
                              <td style={{ ...cell('left'), width: '120px' }}>
                                <div style={{ height: '3px', background: '#222', borderRadius: '2px' }}>
                                  <div style={{ height: '3px', background: THEME.accent, borderRadius: '2px', width: `${barPct}%`, opacity: 0.7 }} />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {sorted.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>
                        No items match "{search}"
                      </div>
                    )}
                  </div>
                )}

                {/* By Month Tab */}
                {tab === 'monthly' && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'DM Mono, monospace' }}>
                      CLOVER SALES BY MONTH
                    </div>
                    {(() => {
                      const maxRev = Math.max(...monthly.map(m => m.revenue), 1)
                      return monthly.map((m, i) => (
                        <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < monthly.length - 1 ? '1px solid #1c1c1c' : 'none' }}>
                          <div style={{ width: '80px', fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>{m.label}</div>
                          <div style={{ flex: 1, height: '6px', background: '#222', borderRadius: '3px' }}>
                            <div style={{ height: '6px', background: THEME.accent, borderRadius: '3px', width: `${Math.round(m.revenue / maxRev * 100)}%` }} />
                          </div>
                          <div style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#22c55e', fontFamily: 'DM Mono, monospace', fontWeight: '600', flexShrink: 0 }}>
                            {fmt(m.revenue)}
                          </div>
                          <div style={{ width: '60px', textAlign: 'right', fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                            {m.orders} orders
                          </div>
                        </div>
                      ))
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #333', marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#4a4a4a', fontFamily: 'DM Mono, monospace' }}>TOTAL</div>
                      <div style={{ fontSize: '12px', color: '#22c55e', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                        {fmt(monthly.reduce((s, m) => s + m.revenue, 0))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
