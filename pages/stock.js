import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'orders',     label: 'Orders',       href: '/orders' },
  { id: 'stock',      label: 'Stock',        href: '/stock' },
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

function sizeOf(name) {
  if (!name) return null
  const m = name.match(/(\d{3})[\s/-](\d{2})[\s/-]?[A-Za-z]{0,3}(\d{2})/)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null
}

async function fetchAllSales() {
  let all = [], from = 0
  while (true) {
    const { data } = await supabase.from('clover_line_items').select('item_name, date').gte('date', '2026-04-15').range(from, from + 999)
    if (!data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < 1000) break
    from += 1000
  }
  return all
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

export default function Stock() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all') // all | onhand | reordered

  useEffect(() => {
    async function load() {
      const [{ data: purchases }, sales] = await Promise.all([
        supabase.from('stock_purchases').select('item_label, qty_purchased, unit_cost'),
        fetchAllSales(),
      ])

      // Roll purchases up by bare size (sum qty, weighted-avg cost)
      const bought = {}
      purchases?.forEach(p => {
        const s = sizeOf(p.item_label)
        if (!s) return
        if (!bought[s]) bought[s] = { size: s, qty: 0, costSum: 0 }
        bought[s].qty += p.qty_purchased
        bought[s].costSum += p.qty_purchased * Number(p.unit_cost)
      })

      // Count sales by bare size (4/15 onward)
      const sold = {}
      sales.forEach(r => {
        const s = sizeOf(r.item_name)
        if (!s) return
        sold[s] = (sold[s] || 0) + 1
      })

      const merged = Object.values(bought).map(b => {
        const soldQty = sold[b.size] || 0
        const onHand  = b.qty - soldQty
        const avgCost = b.qty > 0 ? b.costSum / b.qty : 0
        return {
          size: b.size,
          bought: b.qty,
          sold: soldQty,
          onHand,
          avgCost,
          value: Math.max(onHand, 0) * avgCost,
          reordered: onHand < 0,
        }
      }).sort((a, b) => a.onHand - b.onHand)

      setRows(merged)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let r = rows
    if (search) r = r.filter(x => x.size.includes(search))
    if (filter === 'onhand') r = r.filter(x => x.onHand > 0)
    if (filter === 'reordered') r = r.filter(x => x.reordered)
    return r
  }, [rows, search, filter])

  const totalOnHand   = rows.filter(r => r.onHand > 0).reduce((s, r) => s + r.onHand, 0)
  const totalValue    = rows.reduce((s, r) => s + r.value, 0)
  const reorderedCount = rows.filter(r => r.reordered).length

  return (
    <>
      <Head><title>Reydel Tire — Stock</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="stock" />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>STOCK — EXPECTED ON HAND</div>
            <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Opening stock: 4/15/2026 purchase</div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* Explainer */}
                <div style={{ background: '#FFF8E6', border: '1px solid #F0E0A0', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', fontSize: '11px', color: '#7a5c00', fontFamily: 'DM Mono, monospace', lineHeight: 1.6 }}>
                  Expected on hand = 4/15 stock purchase − tires sold since 4/15. Compare against a physical count.
                  A <strong>negative</strong> number means more sold than the opening stock — those were reordered from Weldon (purchases not yet logged), so that size's value isn't counted here.
                </div>

                {/* KPI cards */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'EXPECTED ON HAND', value: totalOnHand.toLocaleString() + ' tires', sub: 'positive balances only', sc: '#16a34a' },
                    { label: 'STOCK VALUE',      value: fmt(totalValue),                          sub: 'at wholesale cost',     sc: '#1a1a1a' },
                    { label: 'SIZES REORDERED',  value: reorderedCount.toString(),                sub: 'need Weldon purchases logged', sc: THEME.accent },
                    { label: 'SIZES TRACKED',    value: rows.length.toString(),                   sub: 'from 4/15 buy',         sc: '#888' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by size..."
                    style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                  {[{ k: 'all', l: 'ALL' }, { k: 'onhand', l: 'IN STOCK' }, { k: 'reordered', l: 'REORDERED' }].map(f => (
                    <button key={f.k} onClick={() => setFilter(f.k)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: filter === f.k ? THEME.accent : '#F0F0F0',
                      color: filter === f.k ? '#fff' : '#888',
                    }}>{f.l}</button>
                  ))}
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>SIZE</th>
                        <th style={hcell('right')}>BOUGHT (4/15)</th>
                        <th style={hcell('right')}>SOLD SINCE</th>
                        <th style={hcell('right')}>EXPECTED ON HAND</th>
                        <th style={hcell('right')}>UNIT COST</th>
                        <th style={hcell('right')}>STOCK VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={cell('left', { color: '#1a1a1a', fontWeight: '600' })}>{r.size}</td>
                          <td style={cell('right', { color: '#888' })}>{r.bought}</td>
                          <td style={cell('right', { color: '#888' })}>{r.sold}</td>
                          <td style={cell('right', { fontWeight: '700',
                            color: r.onHand < 0 ? THEME.accent : r.onHand === 0 ? '#888' : '#16a34a' })}>
                            {r.onHand < 0 ? r.onHand : r.onHand}
                            {r.reordered && <span style={{ marginLeft: '6px', fontSize: '8px', background: '#fee2e2', color: THEME.accent, padding: '1px 5px', borderRadius: '3px' }}>REORDERED</span>}
                          </td>
                          <td style={cell('right', { color: '#888' })}>{fmt(r.avgCost)}</td>
                          <td style={cell('right', { color: r.onHand > 0 ? '#1a1a1a' : '#ccc' })}>
                            {r.onHand > 0 ? fmt(r.value) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>No sizes match</div>
                  )}
                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {filtered.length} sizes shown
                    </div>
                    <div style={{ fontSize: '11px', color: '#1a1a1a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      Total stock value: {fmt(totalValue)}
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
