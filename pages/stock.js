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
    const { data } = await supabase.from('clover_line_items').select('item_name').gte('date', '2026-04-15').range(from, from + 999)
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
  const [sort,    setSort]    = useState('value') // value | qty | size

  useEffect(() => {
    async function load() {
      const [{ data }, sales] = await Promise.all([
        supabase.from('stock_purchases').select('item_label, qty_purchased, unit_cost'),
        fetchAllSales(),
      ])

      // Count tires sold by bare size (since 4/15)
      const sold = {}
      sales.forEach(r => {
        const s = sizeOf(r.item_name)
        if (s) sold[s] = (sold[s] || 0) + 1
      })

      if (data) {
        setRows(data.map(p => {
          const size = sizeOf(p.item_label)
          const qtySold = size ? (sold[size] || 0) : 0
          const onHand = Math.max(p.qty_purchased - qtySold, 0)
          const unitCost = Number(p.unit_cost)
          return {
            label: p.item_label,
            stocked: p.qty_purchased,
            sold: qtySold,
            onHand,
            unitCost,
            value: onHand * unitCost,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let r = search ? rows.filter(x => x.label.toLowerCase().includes(search.toLowerCase())) : rows
    return [...r].sort((a, b) =>
      sort === 'value'  ? b.value - a.value :
      sort === 'onhand' ? b.onHand - a.onHand :
      a.label.localeCompare(b.label)
    )
  }, [rows, search, sort])

  const totalOnHand = rows.reduce((s, r) => s + r.onHand, 0)
  const totalValue  = rows.reduce((s, r) => s + r.value, 0)
  const lines       = rows.length

  return (
    <>
      <Head><title>Reydel Tire — Stock</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="stock" />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>STOCK — 4/15/2026 PURCHASE</div>
            <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Opening inventory</div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'ON HAND',      value: totalOnHand.toLocaleString() + ' tires', sub: 'stocked 4/15 − sold', sc: '#16a34a' },
                    { label: 'STOCK VALUE',  value: fmt(totalValue),                         sub: 'remaining, at cost',  sc: '#1a1a1a' },
                    { label: 'LINE ITEMS',   value: lines.toString(),                        sub: 'distinct entries',    sc: '#888' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by size / item..."
                    style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                  {[{ k: 'value', l: 'VALUE' }, { k: 'onhand', l: 'ON HAND' }, { k: 'size', l: 'SIZE' }].map(s => (
                    <button key={s.k} onClick={() => setSort(s.k)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: sort === s.k ? THEME.accent : '#F0F0F0',
                      color: sort === s.k ? '#fff' : '#888',
                    }}>{s.l}</button>
                  ))}
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>SIZE / ITEM</th>
                        <th style={hcell('right')}>STOCKED</th>
                        <th style={hcell('right')}>SOLD</th>
                        <th style={hcell('right')}>ON HAND</th>
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
                          <td style={cell('left', { color: '#1a1a1a', fontWeight: '600' })}>{r.label}</td>
                          <td style={cell('right', { color: '#888' })}>{r.stocked}</td>
                          <td style={cell('right', { color: '#888' })}>{r.sold}</td>
                          <td style={cell('right', { fontWeight: '700', color: r.onHand === 0 ? THEME.accent : '#16a34a' })}>{r.onHand}</td>
                          <td style={cell('right', { color: '#888' })}>{fmt(r.unitCost)}</td>
                          <td style={cell('right', { color: r.onHand > 0 ? '#1a1a1a' : '#ccc', fontWeight: '600' })}>{r.onHand > 0 ? fmt(r.value) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>No items match</div>
                  )}
                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{filtered.length} line items</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>Total: {fmt(totalValue)}</div>
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
