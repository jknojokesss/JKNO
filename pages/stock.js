import { useState, useMemo } from 'react'
import Head from 'next/head'
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

// ───────────────────────────────────────────────────────────────────────────
// LOCKED inventory snapshot — on-hand new-tire stock as of 5/31/2026.
// Reconciled tie-out: 4/15 + 4/28 + 5/18 Weldon stock-ups, less sales (FIFO at
// actual invoice cost) and Weldon returns. Static on purpose so it cannot drift
// as Clover keeps syncing. Zero-qty sizes are excluded — only what's on the rack.
// ───────────────────────────────────────────────────────────────────────────
const SNAPSHOT = [
  { label: "215/55/17", qty: 19, unitCost: 58 },
  { label: "235/60/17", qty: 13, unitCost: 65 },
  { label: "235/65/18", qty: 10, unitCost: 77 },
  { label: "205/65/16", qty: 14, unitCost: 53 },
  { label: "235/60/18", qty: 10, unitCost: 74 },
  { label: "235/65/17", qty: 10, unitCost: 72 },
  { label: "255/45/19 Cooper", qty: 4, unitCost: 179 },
  { label: "245/60/18 Cooper", qty: 4, unitCost: 164 },
  { label: "215/60/16", qty: 11, unitCost: 59 },
  { label: "245/50/20 Cooper", qty: 4, unitCost: 158 },
  { label: "235/65/16 Kumho", qty: 4, unitCost: 147 },
  { label: "235/65/18 Cooper", qty: 4, unitCost: 143 },
  { label: "235/45/18 Cooper", qty: 4, unitCost: 142 },
  { label: "235/65/17 Cooper", qty: 4, unitCost: 130 },
  { label: "225/65/17", qty: 7, unitCost: 69 },
  { label: "235/45/18", qty: 7, unitCost: 62 },
  { label: "255/45/19", qty: 5, unitCost: 85 },
  { label: "205/65/16 Cooper", qty: 4, unitCost: 105 },
  { label: "285/45/22", qty: 4, unitCost: 105 },
  { label: "275/60/20", qty: 4, unitCost: 101 },
  { label: "255/40/20 Falken", qty: 2, unitCost: 200 },
  { label: "285/45/22 Goodyear", qty: 2, unitCost: 189 },
  { label: "225/50/17", qty: 6, unitCost: 58 },
  { label: "235/55/19 Cooper", qty: 2, unitCost: 160 },
  { label: "235/55/19", qty: 4, unitCost: 76 },
  { label: "245/60/18", qty: 4, unitCost: 74 },
  { label: "205/55/16 Cooper", qty: 3, unitCost: 96 },
  { label: "235/40/19", qty: 4, unitCost: 70 },
  { label: "225/50/17 Cooper", qty: 2, unitCost: 128 },
  { label: "245/50/20", qty: 3, unitCost: 85 },
  { label: "225/45/17", qty: 4, unitCost: 59 },
  { label: "225/65/17 Cooper", qty: 2, unitCost: 115 },
  { label: "215/65/16 Cooper", qty: 2, unitCost: 102 },
  { label: "215/60/16 Cooper", qty: 2, unitCost: 98 },
  { label: "255/40/20", qty: 2, unitCost: 90 },
  { label: "245/45/19", qty: 2, unitCost: 80 },
  { label: "225/60/17", qty: 2, unitCost: 65 },
  { label: "225/45/18", qty: 2, unitCost: 64 },
  { label: "225/40/18", qty: 2, unitCost: 59 },
  { label: "215/65/16", qty: 1, unitCost: 61 },
].map(r => ({ ...r, value: r.qty * r.unitCost })).filter(r => r.qty > 0)

const SNAPSHOT_DATE = '5/31/2026'

export default function Stock() {
  const [search, setSearch] = useState('')
  const [sort,   setSort]   = useState('value') // value | qty | size

  const filtered = useMemo(() => {
    let r = search ? SNAPSHOT.filter(x => x.label.toLowerCase().includes(search.toLowerCase())) : SNAPSHOT
    return [...r].sort((a, b) =>
      sort === 'value' ? b.value - a.value :
      sort === 'qty'   ? b.qty - a.qty :
      a.label.localeCompare(b.label)
    )
  }, [search, sort])

  const totalOnHand = SNAPSHOT.reduce((s, r) => s + r.qty, 0)
  const totalValue  = SNAPSHOT.reduce((s, r) => s + r.value, 0)
  const lines       = SNAPSHOT.length

  return (
    <>
      <Head><title>Reydel Tire — Stock</title></Head>
      <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
        <TopNav active="stock" right={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '9px', color: '#fff', background: THEME.accent, padding: '2px 8px', borderRadius: '3px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>LOCKED</span>
            <span style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>on-hand snapshot · as of {SNAPSHOT_DATE}</span>
          </div>
        } />

        <div style={{ padding: '24px 28px' }}>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'ON HAND',     value: totalOnHand.toLocaleString() + ' tires', sub: 'in stock as of ' + SNAPSHOT_DATE, sc: '#16a34a' },
              { label: 'STOCK VALUE', value: fmt(totalValue),                          sub: 'at cost',                        sc: '#1a1a1a' },
              { label: 'SIZES',       value: lines.toString(),                         sub: 'distinct items on the rack',     sc: '#888' },
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
            {[{ k: 'value', l: 'VALUE' }, { k: 'qty', l: 'ON HAND' }, { k: 'size', l: 'SIZE' }].map(s => (
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
                    <td style={cell('right', { fontWeight: '700', color: '#16a34a' })}>{r.qty}</td>
                    <td style={cell('right', { color: '#888' })}>{fmt(r.unitCost)}</td>
                    <td style={cell('right', { color: '#1a1a1a', fontWeight: '600' })}>{fmt(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>No items match</div>
            )}
            <div style={{ padding: '10px 16px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{filtered.length} sizes in stock</div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>Total: {fmt(totalValue)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
