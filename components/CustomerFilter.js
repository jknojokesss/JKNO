import { useState, useEffect, useRef } from 'react'

// ── Customer filter ──────────────────────────────────────────────────────
// Every customer starts ticked; the sender unticks the ones they don't want.
// State is the EXCLUDED set, so "nothing excluded" means "everything", which
// stays true as new customers appear in the books without anyone re-ticking.

const INK = '#1A1A1A', BORDER = '#E5E5E5', MUTED = '#777'
const RENDER_CAP = 200

export default function CustomerFilter({ customers, excluded, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const needle = q.trim().toLowerCase()
  const list = needle ? customers.filter((c) => c.name.toLowerCase().includes(needle)) : customers
  const kept = customers.length - excluded.size
  const label = excluded.size === 0
    ? `All ${customers.length} customers`
    : `${kept} of ${customers.length} customers`

  const toggle = (id) => {
    const next = new Set(excluded)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }
  const btn = {
    fontSize: '12px', fontWeight: 600, padding: '7px 12px', borderRadius: '4px',
    cursor: 'pointer', border: `1px solid ${BORDER}`, background: '#fff', color: INK,
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ ...btn, borderColor: excluded.size ? INK : BORDER }}>
        {label} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 30, top: 'calc(100% + 5px)', left: 0, width: '320px',
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '5px',
          boxShadow: '0 10px 30px rgba(0,0,0,.14)', padding: '10px',
        }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a customer"
            style={{ width: '100%', fontSize: '13px', padding: '7px 9px', border: `1px solid ${BORDER}`, borderRadius: '4px' }} />
          <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
            <button onClick={() => onChange(new Set())} style={{ ...btn, padding: '5px 10px' }}>Tick all</button>
            <button onClick={() => onChange(new Set(customers.map((c) => c.id)))} style={{ ...btn, padding: '5px 10px' }}>Untick all</button>
            {needle && <button onClick={() => {
              // "Only these" — keep what the search shows, drop the rest.
              const show = new Set(list.map((c) => c.id))
              onChange(new Set(customers.filter((c) => !show.has(c.id)).map((c) => c.id)))
            }} style={{ ...btn, padding: '5px 10px' }}>Only these</button>}
          </div>
          <div style={{ maxHeight: '270px', overflowY: 'auto' }}>
            {list.slice(0, RENDER_CAP).map((c) => (
              <label key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 2px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={!excluded.has(c.id)} onChange={() => toggle(c.id)} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ color: MUTED, fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>{c.count}</span>
              </label>
            ))}
            {list.length === 0 && <div style={{ fontSize: '12.5px', color: MUTED, padding: '8px 2px' }}>No customer matches that.</div>}
            {list.length > RENDER_CAP && (
              <div style={{ fontSize: '11.5px', color: MUTED, padding: '8px 2px' }}>
                Showing the first {RENDER_CAP} of {list.length} — type to narrow.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
