import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'

const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

// Canonicalize tire-size format in item names so "235/60R17" and "235/60/17"
// group as one item. Preserves brand/other text (e.g. "235/60/17 Arroyo").
function normalizeItemName(name) {
  if (!name) return 'Unknown'
  return name
    .replace(/(\d{3})[\s\/\-]?(\d{2})[\s\/\-]?R(\d{2})/gi, '$1/$2/$3') // 235/60R17 → 235/60/17
    .replace(/(\d{3})\s(\d{2})\s(\d{2})/g, '$1/$2/$3')                 // 235 60 17 → 235/60/17
    .trim()
}

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#888', background: '#FAF6EC',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E7DECB',
  fontFamily: 'Inter, sans-serif', textAlign: align,
})
const cell = (align = 'left', extra = {}) => ({
  padding: '8px 10px', borderBottom: '1px solid #F0F0F0',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})

export default function Inventory() {
  // Require sign-in: send anonymous visitors to /login before any data renders.
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [items,   setItems]   = useState([])
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('revenue')
  const [tab,     setTab]     = useState('items')

  useEffect(() => {
    async function load() {
      let lineItems = [], from = 0
      while (true) {
        const { data } = await supabase.from('clover_line_items').select('item_name, revenue, quantity, date').range(from, from + 999)
        if (!data || data.length === 0) break
        lineItems = [...lineItems, ...data]
        if (data.length < 1000) break
        from += 1000
      }
      if (lineItems.length) {
        const map = {}
        lineItems.forEach(row => {
          const k = normalizeItemName(row.item_name)
          if (!map[k]) map[k] = { name: k, orders: 0, revenue: 0, qty: 0 }
          map[k].orders++
          map[k].revenue += Number(row.revenue)
          map[k].qty     += Number(row.quantity || 1)
        })
        setItems(Object.values(map))

        const mmap = {}
        lineItems.forEach(row => {
          const m = row.date?.slice(0, 7)
          if (!m) return
          if (!mmap[m]) mmap[m] = { month: m, revenue: 0, orders: 0 }
          mmap[m].revenue += Number(row.revenue)
          mmap[m].orders++
        })
        const MONTHS = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }
        setMonthly(
          Object.values(mmap)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(r => ({ ...r, label: MONTHS[r.month.slice(5)] + ' ' + r.month.slice(0, 4) }))
        )
      }
      setLoading(false)
    }
    load()
  }, [])

  const sorted = useMemo(() => {
    const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items
    return [...filtered].sort((a, b) =>
      sort === 'revenue' ? b.revenue - a.revenue :
      sort === 'orders'  ? b.orders  - a.orders  :
      (b.revenue / b.orders) - (a.revenue / a.orders)
    )
  }, [items, search, sort])

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0)
  const totalOrders  = items.reduce((s, i) => s + i.orders, 0)
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const maxRevenue   = sorted[0]?.revenue || 1

  const tabs = [
    { id: 'items',   label: 'Items Ranked' },
    { id: 'monthly', label: 'By Month' },
  ]

  return (
    <>
      <Head><title>Reydel Tire — Sales & Items</title></Head>
      <Shell active="inventory" right={
          <>
            <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
            <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif' }}>Clover POS · Live</div>
          </>
        }>

        <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'CLOVER REVENUE',  value: fmt(totalRevenue),              sub: 'Jan – May 2026',          sc: '#16a34a' },
                    { label: 'TOTAL ORDERS',    value: totalOrders.toLocaleString(),   sub: 'line items',              sc: '#888' },
                    { label: 'UNIQUE ITEMS',    value: items.length.toString(),         sub: 'products & services',     sc: '#888' },
                    { label: 'AVG ORDER VALUE', value: fmtD(avgOrder),                 sub: 'per line item',           sc: THEME.accent },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E7DECB', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: tab === t.id ? '#1a1a1a' : '#888',
                      borderBottom: tab === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Items Ranked */}
                {tab === 'items' && (
                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                      <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search items..."
                        style={{ flex: 1, padding: '7px 12px', background: '#fff', border: '1px solid #E7DECB',
                          borderRadius: '4px', color: '#1a1a1a', fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                      />
                      {[{ key: 'revenue', label: 'REVENUE' }, { key: 'orders', label: 'ORDERS' }, { key: 'avg', label: 'AVG SALE' }].map(s => (
                        <button key={s.key} onClick={() => setSort(s.key)} style={{
                          padding: '6px 12px', fontSize: '9px', fontFamily: 'Inter, sans-serif',
                          letterSpacing: '0.08em', border: 'none', borderRadius: '4px', cursor: 'pointer',
                          background: sort === s.key ? THEME.accent : '#F0F0F0',
                          color: sort === s.key ? '#fff' : '#888',
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
                        {sorted.map((item, i) => (
                          <tr key={item.name}
                            onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={cell('left', { color: '#888', width: '32px' })}>{i + 1}</td>
                            <td style={cell('left', { color: i < 3 ? '#1a1a1a' : '#333', fontWeight: i < 3 ? '600' : '400', maxWidth: '260px' })}>
                              {item.name}
                            </td>
                            <td style={cell('right', { color: '#888' })}>{item.orders}</td>
                            <td style={cell('right', { color: i < 3 ? '#16a34a' : '#333', fontWeight: i < 3 ? '600' : '400' })}>
                              {fmt(item.revenue)}
                            </td>
                            <td style={cell('right', { color: '#888' })}>{fmtD(item.revenue / item.orders)}</td>
                            <td style={{ ...cell('left'), width: '120px' }}>
                              <div style={{ height: '3px', background: '#E7DECB', borderRadius: '2px' }}>
                                <div style={{ height: '3px', background: THEME.accent, borderRadius: '2px', width: `${Math.round(item.revenue / maxRevenue * 100)}%`, opacity: 0.7 }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sorted.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                        No items match "{search}"
                      </div>
                    )}
                  </div>
                )}

                {/* By Month */}
                {tab === 'monthly' && (
                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>
                      CLOVER SALES BY MONTH
                    </div>
                    {(() => {
                      const maxRev = Math.max(...monthly.map(m => m.revenue), 1)
                      return monthly.map((m, i) => (
                        <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < monthly.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          <div style={{ width: '80px', fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{m.label}</div>
                          <div style={{ flex: 1, height: '6px', background: '#E7DECB', borderRadius: '3px' }}>
                            <div style={{ height: '6px', background: THEME.accent, borderRadius: '3px', width: `${Math.round(m.revenue / maxRev * 100)}%` }} />
                          </div>
                          <div style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#16a34a', fontFamily: 'Inter, sans-serif', fontWeight: '600', flexShrink: 0 }}>
                            {fmt(m.revenue)}
                          </div>
                          <div style={{ width: '60px', textAlign: 'right', fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                            {m.orders} orders
                          </div>
                        </div>
                      ))
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E7DECB', marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif' }}>TOTAL</div>
                      <div style={{ fontSize: '12px', color: '#16a34a', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>
                        {fmt(monthly.reduce((s, m) => s + m.revenue, 0))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
      </Shell>
    </>
  )
}
