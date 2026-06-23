import { useState, useEffect } from 'react'
import Head from 'next/head'

// ── Theme ───────────────────────────────────────────────────────────────────
const INK = '#23262E', MUTED = '#8A8A93', CREAM = '#F4F1EA'
const PAD = '#2A4C9C'
const GRID = '#AEBFE3'
const REDNO = '#C8322B'
const ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#2E7D46', AMBER = '#9C6B12'

const BIZ = 'The Gown Studio'
const METHODS = ['Cash', 'Check', 'Card', 'On Acct.', 'Zelle']
const DEFAULT_TAX_RATE = 8       // NY combined rate — editable per order

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = (n) => '$' + Math.round(n || 0).toLocaleString()
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }) : ''
const fmtShort = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
const uid = () => Math.random().toString(36).slice(2, 9)

const lineAmt = (it) => { const v = (parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0); return v || (parseFloat(it.amount) || 0) }
const sumItems = (items) => (items || []).reduce((s, i) => s + lineAmt(i), 0)
const sumPaid = (o) => (o.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
const calcTax = (items, rate) => (items || []).filter(it => it.taxable !== false).reduce((s, it) => s + lineAmt(it), 0) * ((parseFloat(rate) || 0) / 100)
const orderTotal = (o) => sumItems(o.items) + calcTax(o.items, o.taxRate)
const balanceOf = (o) => orderTotal(o) - sumPaid(o)
const isOpen = (o) => balanceOf(o) > 0.005 || (o.alterations && !o.alterationsDone)

// backward-compat: old orders have a single `name` field
const fullName = (o) => o.firstName ? `${o.firstName} ${o.lastName || ''}`.trim() : (o.name || '')

const blankRow = () => ({ id: uid(), qty: '1', desc: '', price: '', taxable: true })
const blankForm = () => ({
  id: uid(), orderNo: null,
  firstName: '', lastName: '',
  phone: '', address: '', city: '', state: 'NY', zip: '',
  date: todayStr(),
  items: [blankRow(), blankRow(), blankRow()],
  payments: [], alterations: false, alterationsDone: false,
  alterationsNote: '', alterationsDue: '', notes: '',
  taxRate: DEFAULT_TAX_RATE,
})

export default function Gowns() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('open')
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

  const subtotal = sumItems(form.items)
  const taxAmount = calcTax(form.items, form.taxRate)
  const total = subtotal + taxAmount
  const paid = sumPaid(form)
  const balance = total - paid

  const startNew = () => { setForm(blankForm()); setPay({ amount: '', method: '', date: todayStr() }); setEditing(false); setView('form'); window.scrollTo(0, 0) }
  const openOrder = (o) => {
    const items = (o.items && o.items.length ? o.items : [blankRow()]).map(it => ({ taxable: true, qty: '1', ...it, price: it.price || String(it.amount || '') }))
    // migrate old single `name` field to firstName/lastName
    const firstName = o.firstName || (o.name ? o.name.split(' ')[0] : '')
    const lastName = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
    setForm({ ...blankForm(), ...o, firstName, lastName, items, payments: o.payments || [], taxRate: o.taxRate ?? DEFAULT_TAX_RATE })
    setPay({ amount: '', method: '', date: todayStr() }); setEditing(true); setView('form'); window.scrollTo(0, 0)
  }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [k]: v } : it) }))
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
    if (!form.firstName.trim()) { alert('Please enter a first name.'); return }
    if (!form.lastName.trim()) { alert('Please enter a last name.'); return }
    if (!editing && !form.phone.trim()) { alert('Please enter a phone number.'); return }
    if (!form.address.trim()) { alert('Please enter an address.'); return }
    if (!form.city.trim()) { alert('Please enter a city.'); return }
    if (!form.state.trim()) { alert('Please enter a state.'); return }
    if (!form.zip.trim()) { alert('Please enter a zip code.'); return }
    const orderNo = form.orderNo || (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
    let items = form.items.filter(it => it.desc.trim() || it.price)
    if (!items.length) items = [blankRow()]
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`
    const clean = { ...form, orderNo, name, firstName: form.firstName.trim(), lastName: form.lastName.trim(), items, savedAt: Date.now() }
    setOrders(prev => prev.some(o => o.id === form.id) ? prev.map(o => o.id === form.id ? clean : o) : [clean, ...prev])
    setView('list'); window.scrollTo(0, 0)
  }
  const del = (id) => { if (window.confirm('Delete this order?')) { setOrders(prev => prev.filter(o => o.id !== id)); setView('list') } }

  const downloadCSV = () => {
    if (!orders.length) { alert('No orders to export yet.'); return }
    const esc = (s) => { const v = String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim(); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v }
    const headers = ['Order #', 'Date', 'First Name', 'Last Name', 'Phone', 'Address', 'City', 'State', 'Zip', 'Items', 'Subtotal', 'Tax Rate', 'Tax', 'Total', 'Amount Paid', 'Balance', 'Status', 'Payments', 'Alterations', 'Notes']
    const rows = orders.map(o => {
      const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
      const itemsSummary = o.items.filter(it => it.desc || lineAmt(it)).map(it => `${it.qty > 1 ? it.qty + 'x ' : ''}${it.desc || ''}${lineAmt(it) ? ' (' + money(lineAmt(it)) + (it.taxable === false ? ' no tax' : '') + ')' : ''}`).join('; ')
      const payHistory = (o.payments || []).map(p => `${money(p.amount)}${p.method ? ' ' + p.method : ''}${p.date ? ' ' + fmtDate(p.date) : ''}`).join('; ')
      const altNote = o.alterations ? `${o.alterationsDone ? 'Done' : 'Pending'}${o.alterationsDue ? ' (due ' + fmtDate(o.alterationsDue) + ')' : ''}${o.alterationsNote ? ': ' + o.alterationsNote : ''}` : ''
      const status = isOpen(o) ? 'Open' : 'Completed'
      const fn = o.firstName || (o.name ? o.name.split(' ')[0] : '')
      const ln = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
      return [o.orderNo || '', o.date || '', fn, ln, o.phone || '', o.address || '', o.city || '', o.state || '', o.zip || '', itemsSummary, sub.toFixed(2), (o.taxRate || 0) + '%', tax.toFixed(2), tot.toFixed(2), p.toFixed(2), bal.toFixed(2), status, payHistory, altNote, o.notes || ''].map(esc).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `gown-orders-${todayStr()}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const openList = orders.filter(isOpen)
  const doneList = orders.filter(o => !isOpen(o))
  const base = tab === 'open' ? openList : tab === 'completed' ? doneList : orders
  const filtered = base.filter(o => !search || fullName(o).toLowerCase().includes(search.toLowerCase()))

  // ── styles ──────────────────────────────────────────────────────────────────
  const lbl = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: PAD }
  const cellIn = { width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '16px', color: INK, padding: '12px 8px' }
  const th = { padding: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: PAD, background: '#EAF0FB' }
  const fieldIn = { width: '100%', padding: '13px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '11px', background: '#fff', color: INK, outline: 'none', fontFamily: 'inherit' }
  const primaryBtn = { padding: '15px 20px', fontSize: '17px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '13px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(177,77,106,0.3)' }
  const ghostBtn = { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px solid #E2D7D1`, borderRadius: '12px', cursor: 'pointer' }
  const tabBtn = (on) => ({ flex: 1, padding: '12px 8px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${on ? PAD : '#DDD5CE'}`, background: on ? PAD : '#fff', color: on ? '#fff' : '#6B6870', boxShadow: on ? '0 2px 8px rgba(42,76,156,0.2)' : 'none' })

  return (
    <>
      <Head>
        <title>{`${BIZ} — Order Book`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${CREAM}; font-family: 'Inter', sans-serif; color: ${INK}; -webkit-font-smoothing: antialiased; }
          ::placeholder { color: #C4BAB4; }
          input:focus, textarea:focus { background: #FAFCFF; border-color: ${PAD} !important; }
          input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          .gw-header { background: #1C1C2E; padding: 22px 20px 18px; text-align: center; margin: -20px -14px 24px; }
          .gw-wrap { max-width: 980px; margin: 0 auto; padding: 20px 14px 80px; }
          .gw-press:active { transform: scale(0.98); opacity: 0.92; }
          .gw-card { background: #fff; border: 1px solid #EAE0D8; border-radius: 18px; box-shadow: 0 2px 14px rgba(0,0,0,0.07); }
          .gw-card-click:hover { box-shadow: 0 4px 22px rgba(0,0,0,0.11); transform: translateY(-1px); transition: box-shadow 0.15s, transform 0.15s; }
          .gw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px; }
          .gw-new-btn { width: 100%; padding: 17px; font-size: 18px; font-weight: 700; color: #fff; background: ${ROSE}; border: none; border-radius: 14px; cursor: pointer; font-family: inherit; letter-spacing: 0.01em; box-shadow: 0 3px 12px rgba(177,77,106,0.35); }
          .gw-new-btn:active { transform: scale(0.98); box-shadow: none; }
          .gw-tabs { display: flex; gap: 8px; margin-top: 12px; }
          .tax-check { width: 18px; height: 18px; accent-color: ${PAD}; cursor: pointer; }
        `}</style>
      </Head>

      <div className="gw-wrap">
        <div className="gw-header">
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '0.01em' }}>{BIZ}</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: '5px', fontWeight: 600 }}>Order Book</div>
        </div>

        {/* ===== LIST ===== */}
        {view === 'list' && (
          <>
            <button className="gw-new-btn gw-press" onClick={startNew}>+ New Order</button>
            <div className="gw-tabs" style={{ marginBottom: '16px' }}>
              <button onClick={() => setTab('open')} style={tabBtn(tab === 'open')}>Open ({openList.length})</button>
              <button onClick={() => setTab('completed')} style={tabBtn(tab === 'completed')}>Completed ({doneList.length})</button>
              <button onClick={() => setTab('all')} style={tabBtn(tab === 'all')}>All ({orders.length})</button>
            </div>

            {orders.length > 0 && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ ...fieldIn, fontSize: '18px', marginBottom: '16px' }} />
            )}

            {filtered.length === 0 ? (
              <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪡</div>
                <div style={{ fontSize: '17px', color: INK, fontWeight: 600, marginBottom: '4px' }}>{orders.length ? `No ${tab === 'all' ? '' : tab + ' '}orders` : 'No orders yet'}</div>
                <div style={{ fontSize: '15px' }}>{orders.length ? (search ? 'Try a different name.' : 'Nothing here right now.') : 'Tap "+ New Order" to write your first one.'}</div>
              </div>
            ) : (
              <div className="gw-grid">
                {filtered.map(o => {
                  const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
                  const needsAlt = o.alterations && !o.alterationsDone
                  return (
                    <div key={o.id} className="gw-card gw-card-click gw-press" onClick={() => openOrder(o)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderLeft: `4px solid ${isOpen(o) ? ROSE : GREEN}`, borderRadius: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.15 }}>{fullName(o)}</div>
                          <div style={{ fontSize: '13px', color: MUTED, marginTop: '2px' }}>{fmtDate(o.date)}{o.phone ? ` · ${o.phone}` : ''}{o.city ? ` · ${o.city}` : ''}</div>
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: REDNO, whiteSpace: 'nowrap' }}>No. {o.orderNo}</div>
                      </div>

                      <div style={{ marginTop: '12px', fontSize: '14px', color: INK }}>
                        {o.items.filter(it => it.desc.trim() || it.price).slice(0, 3).map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '2px 0' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(parseFloat(it.qty) || 1) > 1 ? `${it.qty}× ` : ''}{it.desc || '—'}</span>
                            <span style={{ color: MUTED, whiteSpace: 'nowrap' }}>{money0(lineAmt(it))}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F0E9E3' }}>
                        {tax > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: MUTED, marginBottom: '4px' }}>
                            <span>Tax ({o.taxRate}%)</span><span>{money(tax)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
                          <span style={{ fontSize: '20px', fontWeight: 800 }}>{money(tot)}</span>
                        </div>
                      </div>

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

                      <div style={{ marginTop: '10px' }}>
                        {bal > 0.005
                          ? <span style={{ fontSize: '14px', fontWeight: 700, color: AMBER, background: '#FBF1DD', padding: '5px 12px', borderRadius: '20px' }}>Balance {money(bal)}</span>
                          : <span style={{ fontSize: '14px', fontWeight: 700, color: GREEN, background: '#E7F4EC', padding: '5px 12px', borderRadius: '20px' }}>Paid in full ✓</span>}
                      </div>

                      {o.alterations && (
                        <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: needsAlt ? '#FBEAF0' : '#EFEAF3', border: `1px solid ${needsAlt ? '#F1D5E0' : '#E2DAE8'}` }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: needsAlt ? ROSE_DK : MUTED }}>
                            ✂ Alterations {needsAlt ? '— in progress' : '— done ✓'}{o.alterationsDue ? ` · due ${fmtShort(o.alterationsDue)}` : ''}
                          </div>
                          {o.alterationsNote && <div style={{ fontSize: '14px', color: INK, marginTop: '3px', lineHeight: 1.4 }}>{o.alterationsNote}</div>}
                        </div>
                      )}
                      {o.notes && (
                        <div style={{ marginTop: '10px', fontSize: '13px', color: MUTED, lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: INK }}>Note:</span> {o.notes}</div>
                      )}

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
                <button onClick={downloadCSV} style={{ width: '100%', marginTop: '26px', padding: '14px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#fff', border: `1.5px solid ${GRID}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ⬇ Export to Excel (.csv)
                </button>
                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: '#B9ADA8' }}>for your bookkeeper</div>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: '#B9ADA8' }}>
              Built &amp; maintained by <span style={{ color: ROSE_DK, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </>
        )}

        {/* ===== FORM ===== */}
        {view === 'form' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>← All orders</button>
              {editing && <button onClick={() => del(form.id)} style={{ background: 'none', border: 'none', color: '#C0504C', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
            </div>

            {/* The pad */}
            <div style={{ border: `2px solid ${PAD}`, borderRadius: '6px', background: '#fff', overflow: 'hidden' }}>
              {/* order no */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 12px 0' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: REDNO, letterSpacing: '0.02em' }}>No. {form.orderNo || '—'}</span>
              </div>

              {/* date */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '2px 10px 6px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Date</span>
                <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={{ ...cellIn, padding: '6px 0', fontSize: '16px' }} />
              </div>

              {/* first + last name */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '4px 10px', borderRight: `1px solid ${GRID}` }}>
                  <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>First</span>
                  <input value={form.firstName} onChange={e => setF('firstName', e.target.value)} placeholder="First name" style={{ ...cellIn, fontSize: '18px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '4px 10px' }}>
                  <span style={{ ...lbl, width: '52px', flexShrink: 0 }}>Last</span>
                  <input value={form.lastName} onChange={e => setF('lastName', e.target.value)} placeholder="Last name" style={{ ...cellIn, fontSize: '18px', fontWeight: 600 }} />
                </div>
              </div>

              {/* phone */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Phone</span>
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} type="tel" placeholder="required" style={cellIn} />
              </div>

              {/* address */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Address</span>
                <input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Street address" style={cellIn} />
              </div>

              {/* city / state / zip */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 2, padding: '4px 10px', borderRight: `1px solid ${GRID}` }}>
                  <span style={{ ...lbl, width: '32px', flexShrink: 0 }}>City</span>
                  <input value={form.city} onChange={e => setF('city', e.target.value)} placeholder="City" style={cellIn} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '70px', padding: '4px 8px', borderRight: `1px solid ${GRID}` }}>
                  <input value={form.state} onChange={e => setF('state', e.target.value)} placeholder="ST" maxLength={2} style={{ ...cellIn, textTransform: 'uppercase', padding: '12px 4px', textAlign: 'center' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100px', padding: '4px 8px' }}>
                  <input value={form.zip} onChange={e => setF('zip', e.target.value)} placeholder="Zip" maxLength={10} style={{ ...cellIn, padding: '12px 4px' }} />
                </div>
              </div>

              {/* table header */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ ...th, width: '26px', textAlign: 'center', padding: '8px 0' }} />
                <div style={{ ...th, width: '44px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }}>Qty</div>
                <div style={{ ...th, flex: 1, borderLeft: `1px solid ${GRID}` }}>Description</div>
                <div style={{ ...th, width: '92px', textAlign: 'right', borderLeft: `1px solid ${GRID}` }}>Price</div>
                <div style={{ ...th, width: '38px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }} title="Check = taxable">Tax</div>
                <div style={{ ...th, width: '26px', padding: '8px 0' }} />
              </div>

              {/* rows */}
              {form.items.map((it, i) => (
                <div key={it.id} style={{ display: 'flex', borderBottom: `1px solid ${GRID}`, alignItems: 'center' }}>
                  <div style={{ width: '26px', textAlign: 'center', fontSize: '11px', color: PAD, fontWeight: 600 }}>{i + 1}</div>
                  <input value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} type="number" inputMode="numeric" style={{ ...cellIn, width: '44px', textAlign: 'center', padding: '12px 2px', borderLeft: `1px solid ${GRID}` }} />
                  <input value={it.desc} onChange={e => setItem(it.id, 'desc', e.target.value)} placeholder={i === 0 ? 'Style, color, details…' : ''} style={{ ...cellIn, flex: 1, borderLeft: `1px solid ${GRID}` }} />
                  <input value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} type="number" inputMode="decimal" step="0.01" placeholder="$" style={{ ...cellIn, width: '92px', textAlign: 'right', padding: '12px 8px', borderLeft: `1px solid ${GRID}`, fontWeight: 600 }} />
                  <div style={{ width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch' }}>
                    <input type="checkbox" className="tax-check" checked={it.taxable !== false} onChange={e => setItem(it.id, 'taxable', e.target.checked)} title="Taxable" />
                  </div>
                  <button onClick={() => removeRow(it.id)} aria-label="remove" style={{ width: '26px', height: '40px', border: 'none', background: 'none', color: '#C7B7B1', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}

              <button onClick={addRow} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#F6F9FE', border: 'none', borderBottom: `2px solid ${PAD}`, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add line</button>

              {/* totals */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: '13px', color: MUTED }}>Subtotal</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{money(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: MUTED }}>
                    Tax
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '13px', color: MUTED }}>
                      <input value={form.taxRate} onChange={e => setF('taxRate', e.target.value)} type="number" step="0.001" style={{ width: '56px', border: '1px solid #E2D7D1', borderRadius: '6px', padding: '2px 6px', fontSize: '13px', color: INK, background: '#fff', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />%
                    </span>
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: MUTED }}>{money(taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '14px', paddingTop: '8px', borderTop: `1px solid ${GRID}`, marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: PAD }}>Total</span>
                  <span style={{ fontSize: '26px', fontWeight: 800 }}>{money(total)}</span>
                </div>
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
                <div style={{ marginTop: '12px', padding: '14px', background: '#FBEAF0', border: '1px solid #F1D5E0', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>✂ Alterations — what&apos;s needed</div>
                  <textarea value={form.alterationsNote} onChange={e => setF('alterationsNote', e.target.value)} rows={2} placeholder="Hem, take in, add bustle…"
                    style={{ ...fieldIn, resize: 'vertical', lineHeight: 1.5 }} />
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Alterations due</div>
                    <input type="date" value={form.alterationsDue} onChange={e => setF('alterationsDue', e.target.value)} style={fieldIn} />
                  </div>
                  <button onClick={() => setF('alterationsDone', !form.alterationsDone)} className="gw-press" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', marginTop: '12px',
                    border: `1.5px solid ${form.alterationsDone ? GREEN : '#E2D7D1'}`, background: form.alterationsDone ? '#E7F4EC' : '#fff',
                    borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '7px', border: `2px solid ${form.alterationsDone ? GREEN : '#CDBFBA'}`, background: form.alterationsDone ? GREEN : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{form.alterationsDone ? '✓' : ''}</span>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: form.alterationsDone ? GREEN : INK }}>Alterations complete</span>
                  </button>
                </div>
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
