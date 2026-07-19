import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const hcell = (align = 'left') => ({
  padding: '7px 12px', fontSize: '9px', color: '#888', background: '#FAF6EC',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E7DECB',
  fontFamily: 'Inter, sans-serif', textAlign: align,
})
const cell = (align = 'left', extra = {}) => ({
  padding: '9px 12px', borderBottom: '1px solid #F1EADB',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})

// Pull a canonical NNN/NN/NN size out of any Clover format.
function sizeOf(name) {
  if (!name) return null
  const m = name.match(/(?:LT|P|C)?\s*(\d{3})[\s/\\-]+(\d{2})[\s/\\-]*[A-Za-z]{0,3}(\d{2})/i)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null
}

// ───────────────────────────────────────────────────────────────────────────
// Dated cost layers — the Weldon stock-ups that hit Inventory Asset (4/15 from
// the actual invoice, 4/23 specialty, 4/28 + 5/18 restocks) and the 5/18
// returns. Fixed history. ON-HAND is recomputed live below from Clover sales
// via the same time-aware FIFO as the 5/31 book reconciliation, so the floor
// view and the books agree to the dollar ($17,174 / 199 tires at 5/31).
// ───────────────────────────────────────────────────────────────────────────
const LAYERS = [{"s":"205/55/16","l":"205/55/16 Cooper","q":4,"c":96,"d":"2026-04-15"},{"s":"205/55/16","l":"205/55/16","q":1,"c":50,"d":"2026-04-15"},{"s":"205/55/16","l":"205/55/16","q":16,"c":48,"d":"2026-04-15"},{"s":"205/65/16","l":"205/65/16 Cooper","q":4,"c":105,"d":"2026-04-15"},{"s":"205/65/16","l":"205/65/16","q":16,"c":53,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17 Cooper","q":4,"c":119,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17","q":16,"c":58,"d":"2026-04-15"},{"s":"215/55/17","l":"215/55/17","q":4,"c":67,"d":"2026-04-15"},{"s":"215/60/16","l":"215/60/16 Cooper","q":4,"c":98,"d":"2026-04-15"},{"s":"215/60/16","l":"215/60/16","q":16,"c":59,"d":"2026-04-15"},{"s":"215/65/16","l":"215/65/16 Cooper","q":4,"c":102,"d":"2026-04-15"},{"s":"215/65/16","l":"215/65/16","q":16,"c":61,"d":"2026-04-15"},{"s":"225/50/17","l":"225/50/17 Cooper","q":4,"c":128,"d":"2026-04-15"},{"s":"225/50/17","l":"225/50/17","q":16,"c":58,"d":"2026-04-15"},{"s":"225/65/17","l":"225/65/17 Cooper","q":4,"c":115,"d":"2026-04-15"},{"s":"225/65/17","l":"225/65/17","q":16,"c":69,"d":"2026-04-15"},{"s":"235/45/18","l":"235/45/18 Cooper","q":4,"c":142,"d":"2026-04-15"},{"s":"235/45/18","l":"235/45/18","q":15,"c":62,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19 Cooper","q":4,"c":160,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19","q":16,"c":76,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17","q":1,"c":76,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17 Cooper","q":4,"c":130,"d":"2026-04-15"},{"s":"235/60/17","l":"235/60/17","q":16,"c":65,"d":"2026-04-15"},{"s":"235/60/18","l":"235/60/18 Cooper","q":4,"c":145,"d":"2026-04-15"},{"s":"235/60/18","l":"235/60/18","q":16,"c":74,"d":"2026-04-15"},{"s":"235/65/16","l":"235/65/16 Kumho","q":4,"c":147,"d":"2026-04-15"},{"s":"235/65/16","l":"235/65/16 LT","q":16,"c":85,"d":"2026-04-15"},{"s":"235/65/17","l":"235/65/17 Cooper","q":4,"c":130,"d":"2026-04-15"},{"s":"235/65/17","l":"235/65/17","q":16,"c":72,"d":"2026-04-15"},{"s":"235/65/18","l":"235/65/18 Cooper","q":4,"c":143,"d":"2026-04-15"},{"s":"235/65/18","l":"235/65/18","q":16,"c":77,"d":"2026-04-15"},{"s":"245/50/20","l":"245/50/20 Cooper","q":4,"c":158,"d":"2026-04-15"},{"s":"245/50/20","l":"245/50/20","q":16,"c":85,"d":"2026-04-15"},{"s":"245/60/18","l":"245/60/18 Cooper","q":4,"c":164,"d":"2026-04-15"},{"s":"245/60/18","l":"245/60/18","q":16,"c":74,"d":"2026-04-15"},{"s":"255/40/20","l":"255/40/20 Falken","q":4,"c":200,"d":"2026-04-15"},{"s":"255/40/20","l":"255/40/20","q":16,"c":90,"d":"2026-04-15"},{"s":"255/45/19","l":"255/45/19 Cooper","q":4,"c":179,"d":"2026-04-15"},{"s":"255/45/19","l":"255/45/19","q":16,"c":85,"d":"2026-04-15"},{"s":"285/45/22","l":"285/45/22 Goodyear","q":4,"c":189,"d":"2026-04-15"},{"s":"285/45/22","l":"285/45/22","q":16,"c":105,"d":"2026-04-15"},{"s":"235/55/19","l":"235/55/19","q":8,"c":76,"d":"2026-04-28"},{"s":"235/60/18","l":"235/60/18","q":6,"c":74,"d":"2026-04-28"},{"s":"235/60/18","l":"235/60/18 Cooper","q":2,"c":145,"d":"2026-04-28"},{"s":"235/55/19","l":"235/55/19 Cooper","q":2,"c":160,"d":"2026-04-28"},{"s":"235/60/17","l":"235/60/17","q":10,"c":65,"d":"2026-04-28"},{"s":"275/35/21","l":"275/35/21","q":1,"c":372,"d":"2026-04-23"},{"s":"215/55/17","l":"215/55/17","q":20,"c":58,"d":"2026-05-18"},{"s":"235/60/17","l":"235/60/17","q":8,"c":65,"d":"2026-05-18"},{"s":"235/60/18","l":"235/60/18","q":10,"c":74,"d":"2026-05-18"},{"s":"205/65/16","l":"205/65/16","q":12,"c":53,"d":"2026-05-18"},{"s":"235/45/18","l":"235/45/18","q":6,"c":62,"d":"2026-05-18"},{"s":"275/60/20","l":"275/60/20","q":4,"c":101,"d":"2026-05-18"},{"s":"245/45/19","l":"245/45/19","q":2,"c":80,"d":"2026-05-18"},{"s":"235/40/19","l":"235/40/19","q":4,"c":70,"d":"2026-05-18"},{"s":"225/45/17","l":"225/45/17","q":4,"c":59,"d":"2026-05-18"},{"s":"225/40/18","l":"225/40/18","q":2,"c":59,"d":"2026-05-18"},{"s":"225/60/17","l":"225/60/17","q":2,"c":65,"d":"2026-05-18"},{"s":"245/75/16","l":"245/75/16","q":2,"c":92,"d":"2026-05-18"},{"s":"225/45/18","l":"225/45/18","q":2,"c":64,"d":"2026-05-18"}]

const RETURNS = [{"s":"205/55/16","q":8,"c":48},{"s":"215/60/16","q":2,"c":98},{"s":"215/65/16","q":10,"c":61},{"s":"215/65/16","q":2,"c":102},{"s":"225/50/17","q":2,"c":128},{"s":"225/50/17","q":8,"c":58},{"s":"225/65/17","q":2,"c":115},{"s":"225/65/17","q":8,"c":69},{"s":"235/65/16","q":8,"c":85},{"s":"255/40/20","q":2,"c":200},{"s":"255/40/20","q":10,"c":90},{"s":"285/45/22","q":10,"c":105},{"s":"285/45/22","q":2,"c":105},{"s":"285/45/22","q":2,"c":189}]

const STOCK_START = '2026-04-15'
const AS_OF = '2026-05-31'
const AS_OF_JUNE = '2026-06-30'
const asOfLabel = (d) => { const [y, m, day] = d.split('-'); return `${+m}/${+day}/${y}` }

// Confirmed same-day special orders — premium tires Weldon ordered for a specific
// customer, never off our shelf, so they don't draw down stock. Verified against
// the Weldon order history (e.g. "255/45/19 Brand" = Pirelli Scorpion ordered
// 5/19 @ $253 for the 5/20 sale; the 4/15 stock-up held zero Pirellis).
const SAME_DAY_ITEMS = new Set(['255/45/19 brand'])

async function fetchSales() {
  let all = [], from = 0
  while (true) {
    const { data } = await supabase.from('clover_line_items')
      .select('item_name, date').gte('date', STOCK_START).range(from, from + 999)
    if (!data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

// Time-aware FIFO: returns + chronological sales consumed from the size's
// layers (only layers that have arrived by the sale date), cheapest/oldest
// first. Whatever remains is on-hand.
function computeOnHand(sales, weldon = []) {
  const layers = LAYERS.map(L => ({ ...L, remaining: L.q }))

  RETURNS.forEach(({ s, q, c }) => {
    let pool = layers.filter(L => L.s === s && L.c === c && L.remaining > 0)
    if (!pool.length) pool = layers.filter(L => L.s === s).sort((a, b) => a.c - b.c)
    let need = q
    for (const L of pool) { if (need <= 0) break; const t = Math.min(L.remaining, need); L.remaining -= t; need -= t }
  })

  const bySize = {}
  layers.forEach(L => { (bySize[L.s] = bySize[L.s] || []).push(L) })
  Object.values(bySize).forEach(a => a.sort((x, y) => x.d.localeCompare(y.d) || x.c - y.c))

  // HYBRID — special-order matching, applied to sales AFTER 5/31 only (5/31 stays on
  // the books method). A small Weldon order (qty <= 4) of a size, within ±3 days of the
  // sale, means that tire was special-ordered for a customer — it never sat on our shelf,
  // so it shouldn't deplete stock. Restocks are entered manually in LAYERS (any size),
  // so they're the shelf source; they are NOT treated as special-orders here.
  const sdPool = {}
  ;(weldon || []).forEach(o => {
    if (Number(o.qty) > 4) return
    ;(sdPool[o.size] = sdPool[o.size] || []).push({ date: o.order_date, remaining: Number(o.qty) })
  })
  const isSpecialOrder = (size, date) => {
    for (const o of sdPool[size] || []) {
      // The Weldon order is placed on/before the sale (you order, it arrives, it sells) —
      // allow 4 days before to 1 day after (timing slop), never a sale matched to a later order.
      const gap = (new Date(date) - new Date(o.date)) / 864e5
      if (o.remaining > 0 && gap >= -1 && gap <= 4) { o.remaining--; return true }
    }
    return false
  }

  const tireSales = sales
    .filter(r => sizeOf(r.item_name) && !/used/i.test(r.item_name)
      && !SAME_DAY_ITEMS.has((r.item_name || '').trim().toLowerCase()))
    .map(r => ({ date: r.date, size: sizeOf(r.item_name) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  for (const sale of tireSales) {
    if (sale.date > AS_OF && isSpecialOrder(sale.size, sale.date)) continue // post-5/31 special-order → shelf untouched
    const pool = bySize[sale.size] || []
    for (const L of pool) { if (L.remaining > 0 && L.d <= sale.date) { L.remaining--; break } }
  }

  const agg = {}
  layers.forEach(L => {
    if (L.remaining <= 0) return
    const k = L.l + '|' + L.c
    agg[k] = agg[k] || { label: L.l, unitCost: L.c, qty: 0 }
    agg[k].qty += L.remaining
  })
  return Object.values(agg).map(r => ({ ...r, value: r.qty * r.unitCost }))
}

export default function Stock() {
  // Require sign-in: send anonymous visitors to /login before any data renders.
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [allSales, setAllSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('value') // value | qty | size
  const [asOf,    setAsOf]    = useState(AS_OF)   // AS_OF (5/31, ties to books) | 'live'
  const [weldon,  setWeldon]  = useState([])

  useEffect(() => {
    Promise.all([
      fetchSales(),
      supabase.from('weldon_orders').select('order_date, size, qty'),
    ]).then(([sales, w]) => { setAllSales(sales); setWeldon(w.data || []); setLoading(false) })
  }, [])

  // On-hand = layers minus returns minus sales through the selected cutoff.
  // LIVE additionally skips post-5/31 special-orders (matched to small Weldon orders).
  const rows = useMemo(() => {
    const cutoff = asOf === 'live' ? '9999-12-31' : asOf
    return computeOnHand(allSales.filter(r => r.date <= cutoff), weldon)
  }, [allSales, weldon, asOf])

  const filtered = useMemo(() => {
    let r = search ? rows.filter(x => x.label.toLowerCase().includes(search.toLowerCase())) : rows
    return [...r].sort((a, b) =>
      sort === 'value' ? b.value - a.value :
      sort === 'qty'   ? b.qty - a.qty :
      a.label.localeCompare(b.label)
    )
  }, [rows, search, sort])

  const totalOnHand = rows.reduce((s, r) => s + r.qty, 0)
  const totalValue  = rows.reduce((s, r) => s + r.value, 0)
  const lines       = rows.length

  // Export the on-hand snapshot (respects the current filter/sort) to a CSV.
  const downloadCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`
    const csv = [['Size / Item', 'On Hand', 'Unit Cost', 'Stock Value'].map(esc).join(',')]
    filtered.forEach(r => csv.push([r.label, r.qty, r.unitCost.toFixed(2), r.value.toFixed(2)].map(esc).join(',')))
    csv.push(['TOTAL', totalOnHand, '', totalValue.toFixed(2)].map(esc).join(','))
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reydel-stock-on-hand-${asOf === 'live' ? 'current' : asOf}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Head><title>Reydel Tire — Stock</title></Head>
      <Shell active="stock" right={
          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{asOf === 'live' ? 'live on-hand · current' : `on-hand · as of ${asOfLabel(asOf)}${asOf === AS_OF ? ' (books)' : ''}`} · FIFO</div>
        }>

        <div style={{ padding: '26px 30px', maxWidth: '1160px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '23px', fontWeight: 700, color: '#211E17', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>Stock on Hand</div>
                  <div style={{ fontSize: '12px', color: '#a39a88', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>Reydel Tire &amp; Auto · live tire inventory, FIFO cost</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'ON HAND',     value: totalOnHand.toLocaleString() + ' tires', sub: asOf === 'live' ? 'in stock now' : `in stock at ${asOfLabel(asOf).slice(0, -5)}`, sc: '#16a34a' },
                    { label: 'STOCK VALUE', value: fmt(totalValue),                          sub: 'on-hand, at cost',   sc: '#1a1a1a' },
                    { label: 'SIZES',       value: lines.toString(),                         sub: 'on the rack',        sc: '#888' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {[{ k: AS_OF, l: 'AS OF 5/31' }, { k: AS_OF_JUNE, l: 'AS OF 6/30' }, { k: 'live', l: 'LIVE' }].map(o => (
                    <button key={o.k} onClick={() => setAsOf(o.k)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
                      border: '1px solid #E7DECB', borderRadius: '4px', cursor: 'pointer',
                      background: asOf === o.k ? '#1a1a1a' : '#fff', color: asOf === o.k ? '#fff' : '#888',
                    }}>{o.l}</button>
                  ))}
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by size / item..."
                    style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #E7DECB', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fff', color: '#1a1a1a' }}
                  />
                  {[{ k: 'value', l: 'VALUE' }, { k: 'qty', l: 'ON HAND' }, { k: 'size', l: 'SIZE' }].map(s => (
                    <button key={s.k} onClick={() => setSort(s.k)} style={{
                      padding: '7px 12px', fontSize: '9px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: sort === s.k ? THEME.accent : '#F1EADB',
                      color: sort === s.k ? '#fff' : '#888',
                    }}>{s.l}</button>
                  ))}
                  <button onClick={downloadCSV} style={{
                    padding: '7px 12px', fontSize: '9px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#16a34a', color: '#fff',
                  }}>↓ CSV</button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                    <thead>
                      <tr>
                        <th style={hcell('left')}>SIZE / ITEM</th>
                        <th style={hcell('right')}>ON HAND</th>
                        <th style={hcell('right')}>UNIT COST</th>
                        <th style={hcell('right')}>STOCK VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={cell('left', { color: '#1a1a1a', fontWeight: '600' })}>{r.label}</td>
                          <td style={cell('right', { fontWeight: '700', color: '#16a34a' })}>{r.qty}</td>
                          <td style={cell('right', { color: '#888' })}>{fmt(r.unitCost)}</td>
                          <td style={cell('right', { color: '#1a1a1a', fontWeight: '600' })}>{fmt(r.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>No items match</div>
                  )}
                  <div style={{ padding: '10px 16px', borderTop: '2px solid #E7DECB', background: '#FAF6EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{filtered.length} sizes in stock</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>Total: {fmt(totalValue)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
      </Shell>
    </>
  )
}
