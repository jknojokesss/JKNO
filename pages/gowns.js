import { useState, useEffect } from 'react'
import Head from 'next/head'

// ── Theme ───────────────────────────────────────────────────────────────────
const INK = '#23262E', MUTED = '#8A8A93', CREAM = '#F4F1EA'
const PAD = '#2A4C9C'        // Rediform blue (lines + labels)
const GRID = '#AEBFE3'       // lighter blue grid lines
const ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#2E7D46', AMBER = '#9C6B12'

const BIZ = 'The Gown Studio' // placeholder — swap to her real name
const METHODS = ['Cash', 'Check', 'Charge', 'On Acct.', 'Zelle']

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }) : ''
const uid = () => Math.random().toString(36).slice(2, 9)
const sumItems = (items) => items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

const blankRow = () => ({ id: uid(), qty: '', desc: '', price: '', amount: '' })
const blankForm = () => ({
  id: uid(), orderNo: null, name: '', phone: '', date: todayStr(),
  items: [blankRow(), blankRow(), blankRow()],
  method: '', paid: '', alterations: false, notes: '',
})

export default function Gowns() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('list')
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
  const openOrder = (o) => {
    const items = (o.items && o.items.length ? o.items : [blankRow()]).map(it => ({ qty: '', price: '', amount: '', ...it }))
    setForm({ ...blankForm(), ...o, items }); setEditing(true); setView('form'); window.scrollTo(0, 0)
  }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => setForm(f => ({
    ...f,
    items: f.items.map(it => {
      if (it.id !== id) return it
      const n = { ...it, [k]: v }
      if (k === 'qty' || k === 'price') {
        const p = parseFloat(n.price), q = parseFloat(n.qty)
        if (!isNaN(p)) n.amount = String(Math.round((((isNaN(q) || q === 0) ? 1 : q) * p) * 100) / 100)
      }
      return n
    }),
  }))
  const addRow = () => setForm(f => ({ ...f, items: [...f.items, blankRow()] }))
  const removeRow = (id) => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter(it => it.id !== id) : f.items }))

  const save = () => {
    if (!form.name.trim()) { alert('Please enter a customer name first.'); return }
    const orderNo = form.orderNo || (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
    let items = form.items.filter(it => it.desc.trim() || it.amount || it.price)
    if (!items.length) items = [blankRow()]
    const clean = { ...form, orderNo, name: form.name.trim(), items, savedAt: Date.now() }
    setOrders(prev => prev.some(o => o.id === form.id) ? prev.map(o => o.id === form.id ? clean : o) : [clean, ...prev])
    setView('list'); window.scrollTo(0, 0)
  }
  const del = (id) => { if (window.confirm('Delete this order?')) { setOrders(prev => prev.filter(o => o.id !== id)); setView('list') } }

  const filtered = orders.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()))

  // ── pad styles ──────────────────────────────────────────────────────────────
  const lbl = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: PAD }
  const cellIn = { width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '16px', color: INK, padding: '12px 8px' }
  const th = { padding: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: PAD, background: '#EAF0FB' }
  const primaryBtn = { width: '100%', padding: '18px', fontSize: '19px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '14px', cursor: 'pointer' }
  const ghostBtn = { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px solid #E2D7D1`, borderRadius: '12px', cursor: 'pointer' }

  return (
    <>
      <Head>
        <title>{`${BIZ} — Order Book`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${CREAM}; font-family: 'Inter', sans-serif; color: ${INK}; -webkit-font-smoothing: antialiased; }
          ::placeholder { color: #B7C2DC; }
          input:focus, textarea:focus { background: #FAFCFF; }
          .gw-wrap { max-width: 660px; margin: 0 auto; padding: 20px 14px 64px; }
          .gw-press:active { transform: scale(0.99); }
          .gw-card { background: #fff; border: 1px solid #E7DDD6; border-radius: 16px; }
        `}</style>
      </Head>

      <div className="gw-wrap">
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 700, lineHeight: 1.1 }}>{BIZ}</div>
          <div style={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: ROSE, marginTop: '3px', fontWeight: 600 }}>Order Book</div>
        </div>

        {/* ===== LIST ===== */}
        {view === 'list' && (
          <>
            <button className="gw-press" onClick={startNew} style={{ ...primaryBtn, marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>+</span> New Order
            </button>
            {orders.length > 0 && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ width: '100%', padding: '15px 16px', fontSize: '18px', border: '1.5px solid #E2D7D1', borderRadius: '12px', background: '#fff', color: INK, outline: 'none', marginBottom: '16px', fontFamily: 'inherit' }} />
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
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{o.name}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(t)}</div>
                      </div>
                      <div style={{ fontSize: '14px', color: MUTED, marginTop: '3px' }}>{o.orderNo ? `No. ${o.orderNo} · ` : ''}{fmtDate(o.date)}</div>
                      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '11px' }}>
                        {bal <= 0
                          ? <span style={{ fontSize: '13px', fontWeight: 600, color: GREEN, background: '#E7F4EC', padding: '4px 11px', borderRadius: '20px' }}>Paid in full ✓</span>
                          : <span style={{ fontSize: '13px', fontWeight: 600, color: AMBER, background: '#FBF1DD', padding: '4px 11px', borderRadius: '20px' }}>Owes {money(bal)}</span>}
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

        {/* ===== FORM (pad replica) ===== */}
        {view === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>← All orders</button>
              {editing && <button onClick={() => del(form.id)} style={{ background: 'none', border: 'none', color: '#C0504C', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
            </div>

            {/* The pad */}
            <div style={{ border: `2px solid ${PAD}`, borderRadius: '6px', background: '#fff', overflow: 'hidden' }}>
              {/* order no + date */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ flex: 1, padding: '8px 10px', borderRight: `1px solid ${GRID}` }}>
                  <div style={lbl}>Customer&apos;s Order No.</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: PAD, marginTop: '2px' }}>{form.orderNo || '—'}</div>
                </div>
                <div style={{ width: '150px', padding: '8px 10px' }}>
                  <div style={lbl}>Date</div>
                  <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={{ ...cellIn, padding: '4px 0', fontSize: '15px' }} />
                </div>
              </div>
              {/* name */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Name</span>
                <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Mrs. …" style={{ ...cellIn, fontSize: '18px', fontWeight: 600 }} />
              </div>
              {/* phone */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Phone</span>
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} type="tel" placeholder="(optional)" style={cellIn} />
              </div>
              {/* payment type */}
              <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${GRID}` }}>
                {METHODS.map((m, i) => {
                  const on = form.method === m
                  return (
                    <button key={m} onClick={() => setF('method', on ? '' : m)} style={{
                      flex: '1 0 20%', padding: '10px 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em',
                      textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
                      border: 'none', borderRight: i < METHODS.length - 1 ? `1px solid ${GRID}` : 'none',
                      background: on ? PAD : '#fff', color: on ? '#fff' : PAD,
                    }}>{m}</button>
                  )
                })}
              </div>
              {/* table header */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ ...th, width: '26px', textAlign: 'center', padding: '8px 0' }} />
                <div style={{ ...th, width: '40px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }}>Qty</div>
                <div style={{ ...th, flex: 1, borderLeft: `1px solid ${GRID}` }}>Description</div>
                <div style={{ ...th, width: '62px', textAlign: 'right', borderLeft: `1px solid ${GRID}` }}>Price</div>
                <div style={{ ...th, width: '74px', textAlign: 'right', borderLeft: `1px solid ${GRID}` }}>Amount</div>
                <div style={{ ...th, width: '26px', padding: '8px 0' }} />
              </div>
              {/* rows */}
              {form.items.map((it, i) => (
                <div key={it.id} style={{ display: 'flex', borderBottom: `1px solid ${GRID}`, alignItems: 'center' }}>
                  <div style={{ width: '26px', textAlign: 'center', fontSize: '11px', color: PAD, fontWeight: 600 }}>{i + 1}</div>
                  <input value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} type="number" inputMode="numeric" style={{ ...cellIn, width: '40px', textAlign: 'center', padding: '12px 2px', borderLeft: `1px solid ${GRID}` }} />
                  <input value={it.desc} onChange={e => setItem(it.id, 'desc', e.target.value)} placeholder={i === 0 ? 'Style, color, details…' : ''} style={{ ...cellIn, flex: 1, borderLeft: `1px solid ${GRID}` }} />
                  <input value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} type="number" inputMode="decimal" step="0.01" style={{ ...cellIn, width: '62px', textAlign: 'right', padding: '12px 6px', borderLeft: `1px solid ${GRID}` }} />
                  <input value={it.amount} onChange={e => setItem(it.id, 'amount', e.target.value)} type="number" inputMode="decimal" step="0.01" style={{ ...cellIn, width: '74px', textAlign: 'right', padding: '12px 6px', borderLeft: `1px solid ${GRID}`, fontWeight: 600 }} />
                  <button onClick={() => removeRow(it.id)} aria-label="remove" style={{ width: '26px', height: '40px', border: 'none', background: 'none', color: '#C7B7B1', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
              {/* add row */}
              <button onClick={addRow} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#F6F9FE', border: 'none', borderBottom: `2px solid ${PAD}`, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add line</button>
              {/* total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '14px', padding: '12px 14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: PAD }}>Total</span>
                <span style={{ fontSize: '26px', fontWeight: 800 }}>{money(total)}</span>
              </div>
            </div>

            {/* Paid / balance */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: MUTED, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount paid</div>
                  <input value={form.paid} onChange={e => setF('paid', e.target.value)} type="number" inputMode="decimal" step="0.01" placeholder="$0.00"
                    style={{ width: '100%', padding: '13px 14px', fontSize: '18px', border: '1.5px solid #E2D7D1', borderRadius: '11px', outline: 'none', fontFamily: 'inherit', color: INK }} />
                </div>
                <button className="gw-press" onClick={() => setF('paid', String(total.toFixed(2)))} style={{ ...ghostBtn, width: 'auto', padding: '13px 16px', whiteSpace: 'nowrap' }}>Paid in full</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #EEE5DF' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: MUTED }}>Balance</span>
                {balance <= 0
                  ? <span style={{ fontSize: '19px', fontWeight: 700, color: GREEN }}>Paid in full ✓</span>
                  : <span style={{ fontSize: '22px', fontWeight: 800, color: AMBER }}>{money(balance)}</span>}
              </div>
            </div>

            {/* Alterations + notes */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px', marginBottom: '20px' }}>
              <button onClick={() => setF('alterations', !form.alterations)} className="gw-press" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', marginBottom: '14px',
                border: `1.5px solid ${form.alterations ? ROSE : '#E2D7D1'}`, background: form.alterations ? '#FBEAF0' : '#fff',
                borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '7px', border: `2px solid ${form.alterations ? ROSE : '#CDBFBA'}`, background: form.alterations ? ROSE : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{form.alterations ? '✓' : ''}</span>
                <span style={{ fontSize: '17px', fontWeight: 600 }}>✂ Needs alterations</span>
              </button>
              <div style={{ fontSize: '13px', fontWeight: 600, color: MUTED, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</div>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3} placeholder="Hem 2 inches, pickup Thursday, owes for alterations…"
                style={{ width: '100%', padding: '13px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '11px', outline: 'none', fontFamily: 'inherit', color: INK, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <button className="gw-press" onClick={save} style={primaryBtn}>{editing ? 'Save changes' : 'Save order'}</button>
            <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>Cancel</button>
          </>
        )}
      </div>
    </>
  )
}
