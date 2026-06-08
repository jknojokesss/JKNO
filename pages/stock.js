import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import TopNav from '../components/TopNav'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

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

// Pull a canonical NNN/NN/NN size out of any format Clover or the stock sheet
// uses: 235/60/17, 235/60R17, 235/60ZR17, P255/60R19, LT245/75R16, 235-60-17.
function sizeOf(name) {
  if (!name) return null
  const m = name.match(/(?:LT|P|C)?\s*(\d{3})[\s/\\-]+(\d{2})[\s/\\-]*[A-Za-z]{0,3}(\d{2})/i)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null
}

// Canonical label for matching a sale to a stock item: size + brand tag.
// Order matters — check the more specific brands before LT so
// "235/65/16 LT Kumho" resolves to Kumho, not LT.
const BRANDS = ['Cooper', 'Goodyear', 'Falken', 'Kumho', 'LT']
function labelOf(name) {
  if (!name) return null
  const size = sizeOf(name)
  if (!size) return null
  const lower = name.toLowerCase().replace(/good\s*year/g, 'goodyear')
  let brand = BRANDS.find(b => lower.includes(b.toLowerCase()))
  // Store convention: a bare "brand" / "Brand" / "brand name" tag means Cooper.
  // Without this, "235/60/17 brand" splits off from the "235/60/17 Cooper" stock.
  if (!brand && /\bbrand\b/.test(lower)) brand = 'Cooper'
  return brand ? `${size} ${brand}` : size
}

async function fetchAllSales() {
  let all = [], from = 0
  while (true) {
    const { data } = await supabase.from('clover_line_items').select('item_name').gte('date', '2026-04-15').lte('date', '2026-05-31').range(from, from + 999)
    if (!data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

export default function Stock() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('value') // value | qty | size

  useEffect(() => {
    async function load() {
      const [{ data }, sales] = await Promise.all([
        supabase.from('stock_purchases').select('item_label, qty_purchased, unit_cost, track_clover_sales'),
        fetchAllSales(),
      ])

      // Count tires sold by exact label (size + brand if Clover named it)
      const sold = {}
      sales.forEach(r => {
        const l = labelOf(r.item_name)
        if (l) sold[l] = (sold[l] || 0) + 1
      })

      if (data) {
        setRows(
          data
            // Our stock starts 4/15. Only tracked Weldon stock-ups (4/15 + the
            // 4/28 / 5/18 restocks, net of returns) — never the pre-2026 carryover.
            .filter(p => p.track_clover_sales)
            .map(p => {
              const label = labelOf(p.item_label) || p.item_label
              const qtySold = sold[label] || 0
              const onHand = Math.max(p.qty_purchased - qtySold, 0)
              const unitCost = Number(p.unit_cost)
              return { label, stocked: p.qty_purchased, sold: qtySold, onHand, unitCost, value: onHand * unitCost }
            })
            // Only what's actually on the rack — no zero-qty rows.
            .filter(r => r.onHand > 0)
        )
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
      <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
        <TopNav active="stock" right={
          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>live on-hand · 4/15 + restocks − Clover sales</div>
        } />

        <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'ON HAND',      value: totalOnHand.toLocaleString() + ' tires', sub: 'in stock now', sc: '#16a34a' },
                    { label: 'STOCK VALUE',  value: fmt(totalValue),                         sub: 'on-hand, at cost',  sc: '#1a1a1a' },
                    { label: 'SIZES',        value: lines.toString(),                        sub: 'in stock',    sc: '#888' },
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
    </>
  )
}
