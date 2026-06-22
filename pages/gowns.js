import { useState, useEffect } from 'react'
import Head from 'next/head'

// ── Theme (soft, elegant, easy on older eyes) ───────────────────────────────
const INK = '#2E2530', MUTED = '#8A7E84', LINE = '#EADFD9', CREAM = '#FBF7F4'
const CARD = '#FFFFFF', ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#3E7C4F', AMBER = '#B07A1E'

// Placeholder business name — JK can swap to her real one.
const BIZ = 'The Gown Studio'
const METHODS = ['Cash', 'Check', 'Zelle', 'Card']

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : ''
const uid = () => Math.random().toString(36).slice(2, 9)
const sumItems = (items) => items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)

const blankForm = () => ({
  id: uid(),
  name: '', phone: '', date: todayStr(),
  items: [{ id: uid(), desc: '', price: '' }],
  paid: '', method: '', alterations: false, notes: '',
})

export default function Gowns() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('list')      // 'list' | 'form'
  const [form, setForm] = useState(blankForm())
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try { const raw = localStorage.getItem('gown_orders'); if (raw) setOrders(JSON.parse(raw)) } catch (e) {}
    setLoaded(true)
  }, [])
  useEffect(() => { if (loaded) { try { localStorage.setItem('gown_orders', JSON.stringify(orders)) } catch (e) {} } }, [orders, loaded])

  const total = sumItems(form.items)
  const paidNum = parseFloat(form.paid) || 0
  const balance = total - paidNum

  const startNew = () => { setForm(blankForm()); setEditing(false); setView('form'); window.scrollTo(0, 0) }
  const openOrder = (o) => { setForm({ ...o, items: o.items.length ? o.items : [{ id: uid(), desc: '', price: '' }] }); setEditing(true); setView('form'); window.scrollTo(0, 0) }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [k]: v } : it) }))
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { id: uid(), desc: '', price: '' }] }))
  const removeItem = (id) => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter(it => it.id !== id) : f.items }))

  const save = () => {
    if (!form.name.trim()) { alert('Please enter a customer name first.'); return }
    const orderNo = form.orderNo || (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
    const clean = { ...form, orderNo, name: form.name.trim(), items: form.items.filter(it => it.desc.trim() || it.price), savedAt: Date.now() }
    if (!clean.items.length) clean.items = [{ id: uid(), desc: '', price: '' }]
    setOrders(prev => prev.some(o => o.id === form.id) ? prev.map(o => o.id === form.id ? clean : o) : [clean, ...prev])
    setView('list'); window.scrollTo(0, 0)
  }
  const del = (id) => { if (window.confirm('Delete this order?')) { setOrders(prev => prev.filter(o => o.id !== id)); setView('list') } }

  const filtered = orders.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()))

  // ── shared styles ─────────────────────────────────────────────────────────
  const label = { display: 'block', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, marginBottom: '7px' }
  const input = { width: '100%', padding: '15px 16px', fontSize: '18px', border: `1.5px solid ${LINE}`, borderRadius: '12px', background: '#fff', color: INK, outline: 'none', fontFamily: 'inherit' }
  const primaryBtn = { width: '100%', padding: '18px', fontSize: '19px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '14px', cursor: 'pointer', letterSpacing: '0.02em' }
  const ghostBtn = { width: '100%', padding: '15px', fontSize: '16px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: '12px', cursor: 'pointer' }

  return (
    <>
      <Head>
        <title>{`${BIZ} — Order Book`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${CREAM}; font-family: 'Inter', sans-serif; color: ${INK}; -webkit-font-smoothing: antialiased; }
          ::placeholder { color: #B9ADA8; }
          input:focus, textarea:focus { border-color: ${ROSE} !important; }
          .gw-wrap { max-width: 640px; margin: 0 auto; padding: 22px 16px 64px; }
          .gw-press { transition: transform .08s ease, box-shadow .15s ease; }
          .gw-press:active { transform: scale(0.99); }
          .gw-card { background: ${CARD}; border: 1px solid ${LINE}; border-radius: 16px; }
        `}</style>
      </Head>

      <div className="gw-wrap">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: INK, lineHeight: 1.1 }}>{BIZ}</div>
          <div style={{ fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', color: ROSE, marginTop: '4px', fontWeight: 600 }}>Order Book</div>
        </div>

        {/* ===== LIST VIEW ===== */}
        {view === 'list' && (
          <>
            <button className="gw-press" onClick={startNew} style={{ ...primaryBtn, marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>+</span> New Order
            </button>

            {orders.length > 0 && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ ...input, marginBottom: '16px' }} />
            )}

            {filtered.length === 0 ? (
              <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪡</div>
                <div style={{ fontSize: '17px', color: INK, fontWeight: 600, marginBottom: '4px' }}>{orders.length ? 'No match' : 'No orders yet'}</div>
                <div style={{ fontSize: '15px' }}>{orders.length ? 'Try a different name.' : 'Tap “+ New Order” to write your first one.'}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map(o => {
                  const t = sumItems(o.items), bal = t - (parseFloat(o.paid) || 0)
                  return (
                    <div key={o.id} className="gw-card gw-press" onClick={() => openOrder(o)} style={{ padding: '16px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: INK }}>{o.name}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{money(t)}</div>
                      </div>
                      <div style={{ fontSize: '14px', color: MUTED, marginTop: '3px' }}>{o.orderNo ? `No. ${o.orderNo} · ` : ''}{fmtDate(o.date)}</div>
                      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '11px' }}>
                        {bal <= 0
                          ? <span style={{ fontSize: '13px', fontWeight: 600, color: GREEN, background: '#EAF3EC', padding: '4px 11px', borderRadius: '20px' }}>Paid in full ✓</span>
                          : <span style={{ fontSize: '13px', fontWeight: 600, color: AMBER, background: '#FBF1DD', padding: '4px 11px', borderRadius: '20px' }}>Balance {money(bal)}</span>}
                        {o.alterations && <span style={{ fontSize: '13px', fontWeight: 600, color: ROSE_DK, background: '#FBEAF0', padding: '4px 11px', borderRadius: '20px' }}>✂ Alterations</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '34px', fontSize: '12px', color: '#B9ADA8' }}>
              Built &amp; maintained by <span style={{ color: ROSE_DK, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </>
        )}

        {/* ===== FORM VIEW ===== */}
        {view === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>← All orders</button>
              {editing && <button onClick={() => del(form.id)} style={{ background: 'none', border: 'none', color: '#C0504C', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 700 }}>{editing ? 'Edit Order' : 'New Order'}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: ROSE }}>{form.orderNo ? `No. ${form.orderNo}` : 'No. —'}</div>
            </div>

            {/* Customer */}
            <div className="gw-card" style={{ padding: '18px', marginBottom: '14px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={label}>Customer name</label>
                <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Mrs. …" style={input} />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={label}>Phone</label>
                  <input value={form.phone} onChange={e => setF('phone', e.target.value)} type="tel" placeholder="(optional)" style={input} />
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={label}>Date</label>
                  <input value={form.date} onChange={e => setF('date', e.target.value)} type="date" style={input} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="gw-card" style={{ padding: '18px', marginBottom: '14px' }}>
              <label style={label}>Items</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {form.items.map((it, i) => (
                  <div key={it.id} style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                    <input value={it.desc} onChange={e => setItem(it.id, 'desc', e.target.value)} placeholder={i === 0 ? 'Style, color, details…' : 'Description'} style={{ ...input, flex: 1 }} />
                    <input value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} type="number" inputMode="decimal" step="0.01" placeholder="Amount" style={{ ...input, width: '108px', textAlign: 'right' }} />
                    <button onClick={() => removeItem(it.id)} aria-label="remove" style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px', border: `1.5px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
              <button className="gw-press" onClick={addItem} style={{ ...ghostBtn, marginTop: '12px' }}>+ Add another item</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${LINE}` }}>
                <span style={{ fontSize: '17px', fontWeight: 600, color: MUTED }}>Total</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: INK }}>{money(total)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="gw-card" style={{ padding: '18px', marginBottom: '14px' }}>
              <label style={label}>Payment</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <div style={{ fontSize: '14px', color: MUTED, marginBottom: '6px' }}>Amount paid</div>
                  <input value={form.paid} onChange={e => setF('paid', e.target.value)} type="number" inputMode="decimal" step="0.01" placeholder="$0.00" style={input} />
                </div>
                <button className="gw-press" onClick={() => setF('paid', String(total.toFixed(2)))} style={{ ...ghostBtn, width: 'auto', padding: '15px 18px', whiteSpace: 'nowrap' }}>Paid in full</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                {METHODS.map(m => (
                  <button key={m} onClick={() => setF('method', form.method === m ? '' : m)} className="gw-press" style={{
                    padding: '11px 16px', fontSize: '15px', fontWeight: 600, borderRadius: '11px', cursor: 'pointer',
                    border: `1.5px solid ${form.method === m ? ROSE : LINE}`,
                    background: form.method === m ? ROSE : '#fff', color: form.method === m ? '#fff' : INK,
                  }}>{m}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${LINE}` }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: MUTED }}>Balance due</span>
                {balance <= 0
                  ? <span style={{ fontSize: '20px', fontWeight: 700, color: GREEN }}>Paid in full ✓</span>
                  : <span style={{ fontSize: '24px', fontWeight: 800, color: AMBER }}>{money(balance)}</span>}
              </div>
            </div>

            {/* Notes / Alterations */}
            <div className="gw-card" style={{ padding: '18px', marginBottom: '20px' }}>
              <button onClick={() => setF('alterations', !form.alterations)} className="gw-press" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '14px',
                border: `1.5px solid ${form.alterations ? ROSE : LINE}`, background: form.alterations ? '#FBEAF0' : '#fff',
                borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '7px', border: `2px solid ${form.alterations ? ROSE : '#CDBFBA'}`, background: form.alterations ? ROSE : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{form.alterations ? '✓' : ''}</span>
                <span style={{ fontSize: '17px', fontWeight: 600, color: INK }}>✂ Needs alterations</span>
              </button>
              <label style={label}>Notes</label>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3} placeholder="Hem 2 inches, pickup Thursday, etc." style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <button className="gw-press" onClick={save} style={primaryBtn}>{editing ? 'Save changes' : 'Save order'}</button>
            <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>Cancel</button>
          </>
        )}
      </div>
    </>
  )
}
