import { useState, useEffect } from 'react'
import Head from 'next/head'

// ── Theme ───────────────────────────────────────────────────────────────────
const INK = '#23262E', MUTED = '#8A8A93', CREAM = '#F4F1EA'
const PAD = '#2A4C9C'        // Rediform blue (lines + labels)
const GRID = '#AEBFE3'       // lighter blue grid lines
const REDNO = '#C8322B'      // the red pre-printed order number on the pad
const ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#2E7D46', AMBER = '#9C6B12'

const BIZ = 'The Gown Studio' // placeholder — swap to her real name
const METHODS = ['Cash', 'Check', 'Charge', 'On Acct.', 'Zelle']
// QuickBooks accounts for the .iif export — set to match the client's chart of accounts.
const QB_AR = 'Accounts Receivable'
const QB_INCOME = 'Gown Sales'

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = (n) => '$' + Math.round(n || 0).toLocaleString()
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }) : ''
const fmtShort = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
const uid = () => Math.random().toString(36).slice(2, 9)
const sumItems = (items) => (items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
const sumPaid = (o) => (o.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
const balanceOf = (o) => sumItems(o.items) - sumPaid(o)
// Open until fully paid AND (no alterations, or alterations finished).
const isOpen = (o) => balanceOf(o) > 0.005 || (o.alterations && !o.alterationsDone)

const blankRow = () => ({ id: uid(), qty: '', desc: '', price: '', amount: '' })
const blankForm = () => ({
  id: uid(), orderNo: null, name: '', phone: '', date: todayStr(),
  items: [blankRow(), blankRow(), blankRow()],
  payments: [], alterations: false, alterationsDone: false, alterationsNote: '', notes: '',
})

export default function Gowns() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('open')        // 'open' | 'completed'
  const [form, setForm] = useState(blankForm())
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [pay, setPay] = useState({ amount: '', method: '', date: todayStr() })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try { const raw = localStorage.getItem('gown_orders'); if (raw) setOrders(JSON.parse(raw)) } catch (e) {}
    setLoaded(true)
  }, [])
  useEffect(() => { if (loaded) { try { localStorage.setItem('gown_orders', JSON.stringify(orders)) } catch (e) {} } }, [orders, loaded])

  const total = sumItems(form.items)
  const paid = sumPaid(form)
  const balance = total - paid

  const startNew = () => { setForm(blankForm()); setPay({ amount: '', method: '', date: todayStr() }); setEditing(false); setView('form'); window.scrollTo(0, 0) }
  const openOrder = (o) => {
    const items = (o.items && o.items.length ? o.items : [blankRow()]).map(it => ({ qty: '', price: '', amount: '', ...it }))
    setForm({ ...blankForm(), ...o, items, payments: o.payments || [] }); setPay({ amount: '', method: '', date: todayStr() }); setEditing(true); setView('form'); window.scrollTo(0, 0)
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

  const addPayment = (amt) => {
    const a = parseFloat(amt != null ? amt : pay.amount)
    if (!a || a <= 0) { alert('Enter a payment amount.'); return }
    setForm(f => ({ ...f, payments: [...(f.payments || []), { id: uid(), amount: a, method: pay.method || '', date: pay.date || todayStr() }] }))
    setPay({ amount: '', method: '', date: todayStr() })
  }
  const removePayment = (id) => setForm(f => ({ ...f, payments: f.payments.filter(p => p.id !== id) }))

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

  const downloadIIF = () => {
    const valid = orders.filter(o => sumItems(o.items) !== 0)
    if (!valid.length) { alert('No orders with amounts to export yet.'); return }
    const dt = (s) => { const p = (s || todayStr()).split('-'); return `${parseInt(p[1], 10)}/${parseInt(p[2], 10)}/${p[0]}` }
    const esc = (s) => String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim()
    const out = [
      ['!TRNS', 'TRNSTYPE', 'DATE', 'ACCNT', 'NAME', 'AMOUNT', 'DOCNUM', 'MEMO'].join('\t'),
      ['!SPL', 'TRNSTYPE', 'DATE', 'ACCNT', 'NAME', 'AMOUNT', 'MEMO'].join('\t'),
      '!ENDTRNS',
    ]
    valid.forEach(o => {
      const t = sumItems(o.items), p = sumPaid(o), bal = t - p
      const payNote = p > 0 ? `Paid ${money(p)}${bal > 0.005 ? `, owes ${money(bal)}` : ' (paid in full)'}` : ''
      const memo = esc([o.notes, o.alterations ? `[Alterations${o.alterationsDone ? ' done' : ''}${o.alterationsNote ? ': ' + o.alterationsNote : ''}]` : '', payNote].filter(Boolean).join(' | '))
      out.push(['TRNS', 'INVOICE', dt(o.date), QB_AR, esc(o.name), t.toFixed(2), String(o.orderNo || ''), memo].join('\t'))
      o.items.filter(it => (parseFloat(it.amount) || 0) !== 0).forEach(it => {
        out.push(['SPL', 'INVOICE', dt(o.date), QB_INCOME, esc(o.name), (-(parseFloat(it.amount) || 0)).toFixed(2), esc(it.desc)].join('\t'))
      })
      out.push('ENDTRNS')
    })
    const blob = new Blob([out.join('\r\n') + '\r\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `gown-orders-${todayStr()}.iif`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const openList = orders.filter(isOpen)
  const doneList = orders.filter(o => !isOpen(o))
  const base = tab === 'open' ? openList : doneList
  const filtered = base.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()))

  // ── styles ──────────────────────────────────────────────────────────────────
  const lbl = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: PAD }
  const cellIn = { width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '16px', color: INK, padding: '12px 8px' }
  const th = { padding: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: PAD, background: '#EAF0FB' }
  const fieldIn = { width: '100%', padding: '13px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '11px', background: '#fff', color: INK, outline: 'none', fontFamily: 'inherit' }
  const primaryBtn = { padding: '15px 20px', fontSize: '17px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '13px', cursor: 'pointer' }
  const ghostBtn = { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px solid #E2D7D1`, borderRadius: '12px', cursor: 'pointer' }
  const tabBtn = (on) => ({ flex: 1, padding: '13px 10px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${on ? PAD : '#E2D7D1'}`, background: on ? PAD : '#fff', color: on ? '#fff' : INK })

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
          .gw-wrap { max-width: 980px; margin: 0 auto; padding: 20px 14px 64px; }
          .gw-press:active { transform: scale(0.99); }
          .gw-card { background: #fff; border: 1px solid #E7DDD6; border-radius: 16px; }
          .gw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button className="gw-press" onClick={startNew} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '22px', lineHeight: 1 }}>+</span> New Order
              </button>
              <button onClick={() => setTab('open')} style={tabBtn(tab === 'open')}>Open ({openList.length})</button>
              <button onClick={() => setTab('completed')} style={tabBtn(tab === 'completed')}>Completed ({doneList.length})</button>
            </div>

            {orders.length > 0 && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ ...fieldIn, fontSize: '18px', marginBottom: '16px' }} />
            )}

            {filtered.length === 0 ? (
              <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪡</div>
                <div style={{ fontSize: '17px', color: INK, fontWeight: 600, marginBottom: '4px' }}>{orders.length ? `No ${tab} orders` : 'No orders yet'}</div>
                <div style={{ fontSize: '15px' }}>{orders.length ? (search ? 'Try a different name.' : 'Nothing here right now.') : 'Tap “+ New Order” to write your first one.'}</div>
              </div>
            ) : (
              <div className="gw-grid">
                {filtered.map(o => {
                  const t = sumItems(o.items), p = sumPaid(o), bal = t - p
                  const needsAlt = o.alterations && !o.alterationsDone
                  return (
                    <div key={o.id} className="gw-card gw-press" onClick={() => openOrder(o)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      {/* top: name + red order no */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.15 }}>{o.name}</div>
                          <div style={{ fontSize: '13px', color: MUTED, marginTop: '2px' }}>{fmtDate(o.date)}</div>
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: REDNO, whiteSpace: 'nowrap' }}>No. {o.orderNo}</div>
                      </div>

                      {/* items */}
                      <div style={{ marginTop: '12px', fontSize: '14px', color: INK }}>
                        {o.items.filter(it => it.desc.trim() || it.amount).slice(0, 3).map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '2px 0' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.qty ? `${it.qty}× ` : ''}{it.desc || '—'}</span>
                            <span style={{ color: MUTED, whiteSpace: 'nowrap' }}>{money0(parseFloat(it.amount) || 0)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F0E9E3' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{money(t)}</span>
                      </div>

                      {/* payments so far */}
                      {(o.payments || []).length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: GREEN }}>
                          {o.payments.map(pmt => (
                            <div key={pmt.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span>✓ {money(pmt.amount)}{pmt.method ? ` · ${pmt.method}` : ''}</span>
                              <span style={{ color: MUTED }}>{fmtShort(pmt.date)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* balance / paid status */}
                      <div style={{ marginTop: '10px' }}>
                        {bal > 0.005
                          ? <span style={{ fontSize: '14px', fontWeight: 700, color: AMBER, background: '#FBF1DD', padding: '5px 12px', borderRadius: '20px' }}>Balance {money(bal)}</span>
                          : <span style={{ fontSize: '14px', fontWeight: 700, color: GREEN, background: '#E7F4EC', padding: '5px 12px', borderRadius: '20px' }}>Paid in full ✓</span>}
                      </div>

                      {/* alterations note on the card */}
                      {o.alterations && (
                        <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: needsAlt ? '#FBEAF0' : '#EFEAF3', border: `1px solid ${needsAlt ? '#F1D5E0' : '#E2DAE8'}` }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: needsAlt ? ROSE_DK : MUTED }}>
                            ✂ Alterations {needsAlt ? '— in progress' : '— done ✓'}
                          </div>
                          {o.alterationsNote && <div style={{ fontSize: '14px', color: INK, marginTop: '3px', lineHeight: 1.4 }}>{o.alterationsNote}</div>}
                        </div>
                      )}

                      {/* status footer */}
                      <div style={{ marginTop: '12px' }}>
                        {isOpen(o)
                          ? <span style={{ fontSize: '12px', fontWeight: 700, color: AMBER, letterSpacing: '0.05em', textTransform: 'uppercase' }}>● Open</span>
                          : <span style={{ fontSize: '12px', fontWeight: 700, color: GREEN, letterSpacing: '0.05em', textTransform: 'uppercase' }}>● Completed</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {orders.length > 0 && (
              <>
                <button onClick={downloadIIF} style={{ width: '100%', marginTop: '26px', padding: '14px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#fff', border: `1.5px solid ${GRID}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ⬇ Export for QuickBooks (.iif)
                </button>
                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: '#B9ADA8' }}>for your bookkeeper</div>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: '#B9ADA8' }}>
              Built &amp; maintained by <span style={{ color: ROSE_DK, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </>
        )}

        {/* ===== FORM (pad replica) ===== */}
        {view === 'form' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>← All orders</button>
              {editing && <button onClick={() => del(form.id)} style={{ background: 'none', border: 'none', color: '#C0504C', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
            </div>

            {/* The pad */}
            <div style={{ border: `2px solid ${PAD}`, borderRadius: '6px', background: '#fff', overflow: 'hidden' }}>
              {/* red order no, top-right like the paper */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 12px 0' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: REDNO, letterSpacing: '0.02em' }}>No. {form.orderNo || '—'}</span>
              </div>
              {/* date */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '2px 10px 6px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Date</span>
                <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={{ ...cellIn, padding: '6px 0', fontSize: '16px' }} />
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
              <button onClick={addRow} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#F6F9FE', border: 'none', borderBottom: `2px solid ${PAD}`, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add line</button>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '14px', padding: '12px 14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: PAD }}>Total</span>
                <span style={{ fontSize: '26px', fontWeight: 800 }}>{money(total)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payments</div>

              {(form.payments || []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                  {form.payments.map(pmt => (
                    <div key={pmt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', background: '#F2F8F4', borderRadius: '10px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: GREEN }}>{money(pmt.amount)}</span>
                      <span style={{ fontSize: '14px', color: MUTED, flex: 1 }}>{pmt.method || '—'} · {fmtShort(pmt.date)}</span>
                      <button onClick={() => removePayment(pmt.id)} style={{ border: 'none', background: 'none', color: '#C7B7B1', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* add a payment */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '5px' }}>Amount</div>
                  <input value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} type="number" inputMode="decimal" step="0.01" placeholder="$" style={fieldIn} />
                </div>
                <div style={{ flex: '1 1 130px' }}>
                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '5px' }}>Date</div>
                  <input value={pay.date} onChange={e => setPay(p => ({ ...p, date: e.target.value }))} type="date" style={fieldIn} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '10px' }}>
                {METHODS.map(m => {
                  const on = pay.method === m
                  return (
                    <button key={m} onClick={() => setPay(p => ({ ...p, method: on ? '' : m }))} className="gw-press" style={{
                      padding: '9px 14px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${on ? ROSE : '#E2D7D1'}`, background: on ? ROSE : '#fff', color: on ? '#fff' : INK,
                    }}>{m}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button className="gw-press" onClick={() => addPayment()} style={{ ...primaryBtn, flex: 1, padding: '13px' }}>+ Add payment</button>
                {balance > 0.005 && <button className="gw-press" onClick={() => addPayment(balance.toFixed(2))} style={{ ...ghostBtn, width: 'auto', padding: '13px 16px', whiteSpace: 'nowrap' }}>Pay balance {money(balance)}</button>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #EEE5DF' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: MUTED }}>Paid {money(paid)} · Balance</span>
                {balance <= 0.005
                  ? <span style={{ fontSize: '19px', fontWeight: 700, color: GREEN }}>Paid in full ✓</span>
                  : <span style={{ fontSize: '22px', fontWeight: 800, color: AMBER }}>{money(balance)}</span>}
              </div>
            </div>

            {/* Alterations + notes */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px', marginBottom: '20px' }}>
              <button onClick={() => setF('alterations', !form.alterations)} className="gw-press" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px',
                border: `1.5px solid ${form.alterations ? ROSE : '#E2D7D1'}`, background: form.alterations ? '#FBEAF0' : '#fff',
                borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '7px', border: `2px solid ${form.alterations ? ROSE : '#CDBFBA'}`, background: form.alterations ? ROSE : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{form.alterations ? '✓' : ''}</span>
                <span style={{ fontSize: '17px', fontWeight: 600 }}>✂ Needs alterations</span>
              </button>

              {form.alterations && (
                <>
                  <textarea value={form.alterationsNote} onChange={e => setF('alterationsNote', e.target.value)} rows={2} placeholder="What needs to be done — hem, take in, etc."
                    style={{ ...fieldIn, marginTop: '12px', resize: 'vertical', lineHeight: 1.5 }} />
                  <button onClick={() => setF('alterationsDone', !form.alterationsDone)} className="gw-press" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', marginTop: '10px',
                    border: `1.5px solid ${form.alterationsDone ? GREEN : '#E2D7D1'}`, background: form.alterationsDone ? '#E7F4EC' : '#fff',
                    borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '7px', border: `2px solid ${form.alterationsDone ? GREEN : '#CDBFBA'}`, background: form.alterationsDone ? GREEN : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{form.alterationsDone ? '✓' : ''}</span>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: form.alterationsDone ? GREEN : INK }}>Alterations complete</span>
                  </button>
                </>
              )}

              <div style={{ fontSize: '13px', fontWeight: 600, color: MUTED, margin: '16px 0 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</div>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2} placeholder="Pickup Thursday, etc."
                style={{ ...fieldIn, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <button className="gw-press" onClick={save} style={{ ...primaryBtn, width: '100%' }}>{editing ? 'Save changes' : 'Save order'}</button>
            <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>Cancel</button>
          </div>
        )}
      </div>
    </>
  )
}
