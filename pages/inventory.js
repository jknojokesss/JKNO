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
  padding: '8px 10px', borderBottom: '1px solid #F1EADB',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})

export default function Inventory() {
  // Require sign-in: send anonymous visitors to /login before any data renders.
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [items,   setItems]   = useState([])
  const [monthly, setMonthly] = useState([])
  const [itemMonthly, setItemMonthly] = useState({}) // { 'YYYY-MM': { name: {qty, revenue, orders} } }
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('revenue')
  const [tab,     setTab]     = useState('items')
  const [period,  setPeriod]  = useState('all')
  const [compareOn,     setCompareOn]     = useState(false)
  const [comparePeriod, setComparePeriod] = useState(null)

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
        const imap = {}
        lineItems.forEach(row => {
          const m = row.date?.slice(0, 7)
          if (!m) return
          if (!mmap[m]) mmap[m] = { month: m, revenue: 0, orders: 0, qty: 0 }
          mmap[m].revenue += Number(row.revenue)
          mmap[m].orders++
          mmap[m].qty += Number(row.quantity || 1)
          const k = normalizeItemName(row.item_name)
          if (!imap[m]) imap[m] = {}
          if (!imap[m][k]) imap[m][k] = { name: k, orders: 0, revenue: 0, qty: 0 }
          imap[m][k].orders++
          imap[m][k].revenue += Number(row.revenue)
          imap[m][k].qty += Number(row.quantity || 1)
        })
        setItemMonthly(imap)
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

  const monthLabel = (k) => (monthly.find(m => m.month === k)?.label) || k

  const itemsForPeriod = (p) => (p === 'all' ? items : Object.values(itemMonthly[p] || {}))
  const periodItems = itemsForPeriod(period)
  const cmpActive = compareOn && comparePeriod && period !== 'all'
  const cmpItems = cmpActive ? itemsForPeriod(comparePeriod) : []

  const sorted = useMemo(() => {
    const filtered = search ? periodItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : periodItems
    return [...filtered].sort((a, b) =>
      sort === 'revenue' ? b.revenue - a.revenue :
      sort === 'units'   ? b.qty - a.qty :
      (b.revenue / b.orders) - (a.revenue / a.orders)
    )
  }, [periodItems, search, sort])

  // Compare: union of items across the two periods, with units + revenue for each.
  const cmpRows = useMemo(() => {
    if (!cmpActive) return []
    const map = {}
    periodItems.forEach(i => { map[i.name] = { name: i.name, aQty: i.qty, aRev: i.revenue, bQty: 0, bRev: 0 } })
    cmpItems.forEach(i => { if (!map[i.name]) map[i.name] = { name: i.name, aQty: 0, aRev: 0, bQty: 0, bRev: 0 }; map[i.name].bQty = i.qty; map[i.name].bRev = i.revenue })
    let arr = Object.values(map)
    if (search) arr = arr.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    return arr.sort((a, b) => (b.aRev + b.bRev) - (a.aRev + a.bRev))
  }, [cmpActive, periodItems, cmpItems, search])

  const totalRevenue = periodItems.reduce((s, i) => s + i.revenue, 0)
  const totalUnits   = periodItems.reduce((s, i) => s + i.qty, 0)
  const totalOrders  = periodItems.reduce((s, i) => s + i.orders, 0)
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const periodTitle  = period === 'all' ? 'All time' : monthLabel(period)

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

        <div style={{ padding: '26px 30px', maxWidth: '1160px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '23px', fontWeight: 700, color: '#211E17', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>Sales &amp; Items</div>
                  <div style={{ fontSize: '12px', color: '#a39a88', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>Reydel Tire &amp; Auto · items ranked by revenue</div>
                </div>
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'REVENUE',       value: fmt(totalRevenue),             sub: periodTitle,           sc: '#16a34a' },
                    { label: 'UNITS SOLD',    value: totalUnits.toLocaleString(),   sub: 'tires & items',       sc: '#888' },
                    { label: 'UNIQUE ITEMS',  value: periodItems.length.toString(), sub: 'products & services', sc: '#888' },
                    { label: 'AVG SALE',      value: fmtD(avgOrder),                sub: 'per line item',       sc: THEME.accent },
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
                {tab === 'items' && (() => {
                  const pill = (on) => ({ padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', border: `1px solid ${on ? '#1a1a1a' : '#E7DECB'}`, background: on ? '#1a1a1a' : '#fff', color: on ? '#fff' : '#8a8378' })
                  const shortLbl = (k) => monthLabel(k).split(' ')[0]
                  const dCol = d => d === 0 ? '#a39a88' : d > 0 ? '#16a34a' : '#b0483a'
                  const dStr = d => d === 0 ? '—' : (d > 0 ? '+' : '−') + Math.abs(d)
                  const LIMIT = 25
                  const shownSingle = search ? sorted : sorted.slice(0, LIMIT)
                  const shownCmp = search ? cmpRows : cmpRows.slice(0, LIMIT)
                  return (
                  <>
                    {/* Period selector + compare */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: compareOn ? '10px' : '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', marginRight: '2px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>PERIOD</span>
                      {[{ k: 'all', l: 'All time' }, ...monthly.map(m => ({ k: m.month, l: m.label.split(' ')[0] }))].map(o => (
                        <button key={o.k} onClick={() => setPeriod(o.k)} style={pill(period === o.k)}>{o.l}</button>
                      ))}
                      {monthly.length > 1 && (
                        <button onClick={() => {
                          const next = !compareOn
                          setCompareOn(next)
                          if (next) {
                            const keys = monthly.map(m => m.month)
                            let base = period
                            if (base === 'all') { base = keys[keys.length - 1]; setPeriod(base) }
                            if (!comparePeriod || comparePeriod === base) {
                              const idx = keys.indexOf(base)
                              setComparePeriod(keys[idx - 1] || keys.find(m => m !== base) || base)
                            }
                          }
                        }} style={{ ...pill(compareOn), marginLeft: '10px' }}>⇄ Compare</button>
                      )}
                    </div>
                    {compareOn && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', marginRight: '2px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>COMPARE&nbsp;TO</span>
                        {monthly.map(m => (
                          <button key={m.month} onClick={() => setComparePeriod(m.month)} style={pill(comparePeriod === m.month)}>{m.label.split(' ')[0]}</button>
                        ))}
                      </div>
                    )}

                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                      <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search items..."
                        style={{ flex: 1, padding: '7px 12px', background: '#fff', border: '1px solid #E7DECB',
                          borderRadius: '4px', color: '#1a1a1a', fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                      />
                      {!cmpActive && [{ key: 'revenue', label: 'REVENUE' }, { key: 'units', label: 'UNITS' }, { key: 'avg', label: 'AVG SALE' }].map(s => (
                        <button key={s.key} onClick={() => setSort(s.key)} style={{
                          padding: '6px 12px', fontSize: '9px', fontFamily: 'Inter, sans-serif',
                          letterSpacing: '0.08em', border: 'none', borderRadius: '4px', cursor: 'pointer',
                          background: sort === s.key ? THEME.accent : '#F1EADB',
                          color: sort === s.key ? '#fff' : '#888',
                        }}>{s.label}</button>
                      ))}
                    </div>

                    {cmpActive ? (
                      /* ── Compare table: units + revenue for two months ── */
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={hcell('left')}>ITEM</th>
                            <th style={hcell('right')}>{shortLbl(period)} units</th>
                            <th style={hcell('right')}>{shortLbl(comparePeriod)} units</th>
                            <th style={hcell('right')}>Δ units</th>
                            <th style={hcell('right')}>{shortLbl(period)} rev</th>
                            <th style={hcell('right')}>{shortLbl(comparePeriod)} rev</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shownCmp.map(r => (
                            <tr key={r.name} onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={cell('left', { color: '#1a1a1a', maxWidth: '240px' })}>{r.name}</td>
                              <td style={cell('right', { color: '#1a1a1a', fontWeight: '600' })}>{r.aQty}</td>
                              <td style={cell('right', { color: '#8a8378' })}>{r.bQty}</td>
                              <td style={cell('right', { color: dCol(r.aQty - r.bQty), fontWeight: '600' })}>{dStr(r.aQty - r.bQty)}</td>
                              <td style={cell('right', { color: '#16a34a' })}>{fmt(r.aRev)}</td>
                              <td style={cell('right', { color: '#8a8378' })}>{fmt(r.bRev)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={hcell('left')}>#</th>
                            <th style={hcell('left')}>ITEM</th>
                            <th style={hcell('right')}>UNITS</th>
                            <th style={hcell('right')}>REVENUE</th>
                            <th style={hcell('right')}>AVG SALE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shownSingle.map((item, i) => (
                            <tr key={item.name}
                              onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={cell('left', { color: '#888', width: '32px' })}>{i + 1}</td>
                              <td style={cell('left', { color: i < 3 ? '#1a1a1a' : '#333', fontWeight: i < 3 ? '600' : '400', maxWidth: '340px' })}>
                                {item.name}
                              </td>
                              <td style={cell('right', { color: '#1a1a1a', fontWeight: '600' })}>{item.qty.toLocaleString()}</td>
                              <td style={cell('right', { color: i < 3 ? '#16a34a' : '#333', fontWeight: i < 3 ? '600' : '400' })}>
                                {fmt(item.revenue)}
                              </td>
                              <td style={cell('right', { color: '#888' })}>{fmtD(item.revenue / item.orders)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {((cmpActive ? cmpRows.length : sorted.length) === 0) && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                        No items{search ? ` match "${search}"` : ' in this period'}
                      </div>
                    )}
                    {!search && (cmpActive ? cmpRows.length : sorted.length) > LIMIT && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '4px', borderTop: '1px solid #E7DECB' }}>
                        <span style={{ fontSize: '10px', color: '#a39a88', fontFamily: 'Inter, sans-serif' }}>
                          Showing top {LIMIT} of {(cmpActive ? cmpRows.length : sorted.length).toLocaleString()} items — type in search to find any item
                        </span>
                      </div>
                    )}
                  </div>
                  </>
                  )
                })()}

                {/* By Month */}
                {tab === 'monthly' && (
                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>
                      CLOVER SALES BY MONTH
                    </div>
                    {(() => {
                      const maxRev = Math.max(...monthly.map(m => m.revenue), 1)
                      return monthly.map((m, i) => (
                        <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < monthly.length - 1 ? '1px solid #F1EADB' : 'none' }}>
                          <div style={{ width: '80px', fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{m.label}</div>
                          <div style={{ flex: 1, height: '6px', background: '#E7DECB', borderRadius: '3px' }}>
                            <div style={{ height: '6px', background: THEME.accent, borderRadius: '3px', width: `${Math.round(m.revenue / maxRev * 100)}%` }} />
                          </div>
                          <div style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#16a34a', fontFamily: 'Inter, sans-serif', fontWeight: '600', flexShrink: 0 }}>
                            {fmt(m.revenue)}
                          </div>
                          <div style={{ width: '72px', textAlign: 'right', fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                            {(m.qty || 0).toLocaleString()} sold
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
