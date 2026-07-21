import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ── Theme ───────────────────────────────────────────────────────────────────
const INK = '#23262E', MUTED = '#8A8A93', CREAM = '#F4F1EA'
const PAD = '#2A4C9C'
const GRID = '#AEBFE3'
const REDNO = '#C8322B'
const ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#2E7D46', AMBER = '#9C6B12'

const BIZ = 'The Gown Studio'
const METHODS = ['Cash', 'Check', 'Card', 'On Acct.', 'Zelle']
const DEFAULT_TAX_RATE = 8.875   // NYC rate — editable per order

// Built-in items — always available. User-added items layer on top from localStorage.
const DEFAULT_ITEMS = [
  { no: 'GM92', desc: 'Green Gown' },
  { no: 'ALT',  desc: 'Alterations', taxable: false, alteration: true },
]

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = (n) => '$' + Math.round(n || 0).toLocaleString()
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }) : ''
const fmtShort = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
// Order ids are stored in a Postgres `uuid` column, so they must be valid UUIDs.
const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

const lineAmt = (it) => { const v = (parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0); return v || (parseFloat(it.amount) || 0) }
const sumItems = (items) => (items || []).reduce((s, i) => s + lineAmt(i), 0)
const sumPaid = (o) => (o.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
const calcTax = (items, rate) => (items || []).filter(it => it.taxable !== false).reduce((s, it) => s + lineAmt(it), 0) * ((parseFloat(rate) || 0) / 100)
const orderTotal = (o) => sumItems(o.items) + calcTax(o.items, o.taxRate)

// ── Input cleanup: tidy up how people type names, addresses, and phones ──
const titleCase = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
  .replace(/(^|[\s\-/.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
const cleanState = (s) => (s || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
const cleanEmail = (s) => (s || '').trim().toLowerCase()
const cleanZip = (s) => {
  const d = (s || '').replace(/\D/g, '')
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5, 9)}` : d
}
// Format a 10-digit US number as (888) 787-9876 (or 1 (888) 787-9876);
// anything that isn't a standard 10/11-digit number is left as typed.
const fmtPhone = (s) => {
  const raw = (s || '').trim()
  let d = raw.replace(/\D/g, ''), cc = ''
  if (d.length === 11 && d[0] === '1') { cc = '1 '; d = d.slice(1) }
  return d.length === 10 ? `${cc}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw
}
const balanceOf = (o) => orderTotal(o) - sumPaid(o)
const isOpen = (o) => balanceOf(o) > 0.005 || (o.alterations && !o.alterationsDone)

// backward-compat: old orders have a single `name` field
const fullName = (o) => o.firstName ? `${o.firstName} ${o.lastName || ''}`.trim() : (o.name || '')

// ── Supabase row converters ──────────────────────────────────────────────────
const toDB = (o, userId) => ({
  id: o.id, user_id: userId, order_no: o.orderNo || null,
  first_name: o.firstName || '', last_name: o.lastName || '',
  phone: o.phone || '', email: o.email || '', home_phone: o.home || '',
  address: o.address || '', city: o.city || '',
  state: o.state || 'NY', zip: o.zip || '',
  order_date: o.date || todayStr(),
  items: o.items || [], payments: o.payments || [],
  alterations: o.alterations || false, alterations_done: o.alterationsDone || false,
  alterations_note: o.alterationsNote || '',
  alterations_assignee: o.alterationsAssignee || '',
  alterations_due: o.alterationsDue || null,
  notes: o.notes || '', tax_rate: o.taxRate || DEFAULT_TAX_RATE,
  follow_up_date: o.followUpDate || null, todos: o.todos || [],
  saved_at: new Date().toISOString(),
})
const fromDB = (r) => ({
  id: r.id, orderNo: r.order_no,
  firstName: r.first_name, lastName: r.last_name,
  name: `${r.first_name} ${r.last_name}`.trim(),
  phone: r.phone, email: r.email || '', home: r.home_phone || '',
  address: r.address, city: r.city, state: r.state, zip: r.zip,
  date: r.order_date, items: r.items || [], payments: r.payments || [],
  alterations: r.alterations, alterationsDone: r.alterations_done,
  alterationsNote: r.alterations_note, alterationsAssignee: r.alterations_assignee || '',
  alterationsDue: r.alterations_due,
  notes: r.notes, taxRate: r.tax_rate,
  followUpDate: r.follow_up_date, todos: r.todos || [],
  savedAt: new Date(r.saved_at).getTime(),
})

const blankRow = () => ({ id: uid(), qty: '1', itemNo: '', desc: '', price: '', taxable: true })
const blankForm = () => ({
  id: uid(), orderNo: null,
  firstName: '', lastName: '',
  phone: '', email: '', home: '', address: '', city: '', state: 'NY', zip: '',
  date: todayStr(),
  items: [blankRow(), blankRow(), blankRow()],
  payments: [], alterations: false, alterationsDone: false,
  alterationsNote: '', alterationsAssignee: '', alterationsDue: '', notes: '',
  todos: [], taxRate: DEFAULT_TAX_RATE,
})

export default function Gowns() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  const [orders, setOrders] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ text: '', assignee: '', date: '', orderId: '' })
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('open')
  const [form, setForm] = useState(blankForm())
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [pay, setPay] = useState({ amount: '', method: '', date: todayStr() })
  const [suggest, setSuggest] = useState(null)
  const [catalog, setCatalog] = useState(DEFAULT_ITEMS)
  const [newItem, setNewItem] = useState(null)
  const [todoInput, setTodoInput] = useState({})
  const [formTodo, setFormTodo] = useState({ text: '', assignee: '', date: '' })
  const [todoView, setTodoView] = useState('person')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loaded, setLoaded] = useState(false)

  // ── auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setUser(data.session.user); loadData(data.session.user) }
      setAuthLoading(false)
    })
    const { data: l } = supabase.auth.onAuthStateChange((_, s) => {
      if (!s) { setUser(null); setOrders([]); setTasks([]); setCatalog(DEFAULT_ITEMS) }
    })
    return () => l.subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginErr(''); setLoginBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass })
    if (error) { setLoginErr(error.message); setLoginBusy(false); return }
    setUser(data.user)
    await loadData(data.user)
    setAuthLoading(false); setLoginBusy(false)
  }

  // ── data fetch + localStorage migration ─────────────────────────────────────
  const loadData = useCallback(async (u) => {
    // Auto-migrate localStorage data on first login
    try {
      const { data: existing } = await supabase.from('gown_orders').select('id').limit(1)
      if (!existing?.length) {
        const raw = localStorage.getItem('gown_orders')
        if (raw) {
          const local = JSON.parse(raw)
          if (local?.length) {
            await supabase.from('gown_orders').insert(local.map(o => toDB(o, u.id)))
            localStorage.removeItem('gown_orders')
          }
        }
      }
    } catch (e) {}

    const [{ data: orderRows }, { data: catRows }, { data: taskRows }] = await Promise.all([
      supabase.from('gown_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('gown_catalog').select('*'),
      supabase.from('gown_tasks').select('*').order('created_at', { ascending: false }),
    ])
    setOrders((orderRows || []).map(fromDB))
    setTasks(taskRows || [])
    const customItems = (catRows || []).map(r => ({ no: r.item_no, desc: r.description, taxable: r.taxable, alteration: r.alteration }))
    setCatalog([...DEFAULT_ITEMS, ...customItems.filter(c => !DEFAULT_ITEMS.find(d => d.no === c.no))])
    setLoaded(true)
  }, [])

  const subtotal = sumItems(form.items)
  const taxAmount = calcTax(form.items, form.taxRate)
  const total = subtotal + taxAmount
  const paid = sumPaid(form)
  const balance = total - paid

  const startNew = () => { setForm(blankForm()); setPay({ amount: '', method: '', date: todayStr() }); setFormTodo({ text: '', assignee: '', date: '' }); setEditing(false); setView('form'); window.scrollTo(0, 0) }
  const openOrder = (o) => {
    const items = (o.items && o.items.length ? o.items : [blankRow()]).map(it => ({ taxable: true, qty: '1', ...it, price: it.price || String(it.amount || '') }))
    // migrate old single `name` field to firstName/lastName
    const firstName = o.firstName || (o.name ? o.name.split(' ')[0] : '')
    const lastName = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
    setForm({ ...blankForm(), ...o, firstName, lastName, items, payments: o.payments || [], taxRate: o.taxRate ?? DEFAULT_TAX_RATE })
    setPay({ amount: '', method: '', date: todayStr() }); setFormTodo({ text: '', assignee: '', date: '' }); setEditing(true); setView('form'); window.scrollTo(0, 0)
  }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [k]: v } : it) }))
  const onItemNo = (id, val) => {
    setItem(id, 'itemNo', val)
    if (val.trim()) {
      const q = val.trim().toLowerCase()
      const matches = catalog.filter(it => it.no.toLowerCase().includes(q))
      setSuggest({ id, matches, query: val.trim() })
    } else {
      setSuggest(null)
    }
  }
  const pickItem = (rowId, item) => {
    setForm(f => ({ ...f, items: f.items.map(it => it.id === rowId ? { ...it, itemNo: item.no, desc: item.desc, taxable: item.taxable !== false } : it), ...(item.alteration ? { alterations: true } : {}) }))
    setSuggest(null)
  }
  const saveNewItem = async () => {
    if (!newItem || !newItem.no.trim() || !newItem.desc.trim()) return
    const item = { no: newItem.no.trim().toUpperCase(), desc: newItem.desc.trim(), taxable: newItem.taxable, alteration: newItem.alteration }
    await supabase.from('gown_catalog').upsert({ user_id: user.id, item_no: item.no, description: item.desc, taxable: item.taxable, alteration: item.alteration }, { onConflict: 'user_id,item_no' })
    setCatalog(prev => [...prev.filter(c => c.no !== item.no), item])
    pickItem(newItem.rowId, item)
    setNewItem(null)
  }

  const addRow = () => setForm(f => ({ ...f, items: [...f.items, blankRow()] }))
  const removeRow = (id) => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter(it => it.id !== id) : f.items }))

  const addPayment = (amt) => {
    const a = parseFloat(amt != null ? amt : pay.amount)
    if (!a || a <= 0) { alert('Enter a payment amount.'); return }
    if (!pay.method) { alert('Choose a payment type (Cash, Check, Card…).'); return }
    setForm(f => ({ ...f, payments: [...(f.payments || []), { id: uid(), amount: a, method: pay.method, date: pay.date || todayStr() }] }))
    setPay({ amount: '', method: '', date: todayStr() })
  }
  const setPaymentMethod = (id, method) => setForm(f => ({ ...f, payments: f.payments.map(p => p.id === id ? { ...p, method } : p) }))
  const removePayment = (id) => setForm(f => ({ ...f, payments: f.payments.filter(p => p.id !== id) }))

  const save = async () => {
    // Required: first name, last name, cell, and full address. Home phone + email optional.
    if (!form.firstName.trim()) { alert('Please enter a first name.'); return }
    if (!form.lastName.trim()) { alert('Please enter a last name.'); return }
    if (!form.phone.trim()) { alert('Please enter a cell number.'); return }
    if (!form.address.trim()) { alert('Please enter an address.'); return }
    if (!form.city.trim()) { alert('Please enter a city.'); return }
    if (!form.state.trim()) { alert('Please enter a state.'); return }
    if (!form.zip.trim()) { alert('Please enter a zip code.'); return }
    const typedNo = String(form.orderNo ?? '').trim()
    const orderNo = typedNo
      ? parseInt(typedNo, 10)
      : (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
    // Warn (but don't block) if this invoice number is already used by another order
    if (typedNo && orders.some(o => o.id !== form.id && o.orderNo === orderNo)) {
      if (!window.confirm(`Invoice No. ${orderNo} is already used by another order. Save anyway?`)) return
    }
    let items = form.items.filter(it => it.desc.trim() || it.price)
    if (!items.length) items = [blankRow()]
    // Normalize everything on save so stored data is clean regardless of how it was typed.
    const fn = titleCase(form.firstName), ln = titleCase(form.lastName)
    const clean = {
      ...form, orderNo, items,
      firstName: fn, lastName: ln, name: `${fn} ${ln}`.trim(),
      phone: fmtPhone(form.phone), home: fmtPhone(form.home), email: cleanEmail(form.email),
      address: titleCase(form.address), city: titleCase(form.city),
      state: cleanState(form.state), zip: cleanZip(form.zip),
    }
    const { data, error } = await supabase.from('gown_orders').upsert(toDB(clean, user.id)).select().single()
    if (error) { alert('Error saving: ' + error.message); return }
    const saved = fromDB(data)
    setOrders(prev => prev.some(o => o.id === clean.id) ? prev.map(o => o.id === clean.id ? saved : o) : [saved, ...prev])
    setView('list'); window.scrollTo(0, 0)
  }
  const del = async (id) => {
    if (window.confirm('Delete this order?')) {
      await supabase.from('gown_orders').delete().eq('id', id)
      setOrders(prev => prev.filter(o => o.id !== id)); setView('list')
    }
  }

  const printOrders = (ordersToPrint) => {
    const PAD_BLUE = '#2A4C9C', GRID_BLUE = '#AEBFE3', RED_NO = '#C8322B'
    const rows = ordersToPrint.map(o => {
      const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
      const addr = [o.address, o.city, o.state, o.zip].filter(Boolean).join(', ')
      const itemLines = o.items.filter(it => it.desc?.trim() || lineAmt(it)).map((it, i) => `
        <tr>
          <td style="width:36px;text-align:center;padding:12px 6px;border-right:1px solid ${GRID_BLUE};color:${PAD_BLUE};font-size:13px;font-weight:600;">${i+1}</td>
          <td style="width:90px;padding:12px 8px;border-right:1px solid ${GRID_BLUE};font-size:16px;font-weight:700;color:${PAD_BLUE};letter-spacing:0.03em;">${it.itemNo || ''}</td>
          <td style="width:54px;padding:12px 6px;border-right:1px solid ${GRID_BLUE};text-align:center;font-size:16px;">${(parseFloat(it.qty)||1) > 1 ? it.qty : '1'}</td>
          <td style="padding:12px 12px;border-right:1px solid ${GRID_BLUE};font-size:16px;">${it.desc || ''}</td>
          <td style="width:110px;padding:12px 12px;text-align:right;font-size:16px;font-weight:600;">${lineAmt(it) ? money(lineAmt(it)) : ''}</td>
        </tr>`).join('')
      // blank filler rows to make it look like the pad
      const fillerCount = Math.max(0, 6 - o.items.filter(it => it.desc?.trim() || lineAmt(it)).length)
      const fillerRows = Array(fillerCount).fill(`<tr><td style="border-right:1px solid ${GRID_BLUE};padding:12px 6px;"> </td><td style="border-right:1px solid ${GRID_BLUE};padding:12px 6px;"> </td><td style="border-right:1px solid ${GRID_BLUE};padding:12px 6px;"> </td><td style="border-right:1px solid ${GRID_BLUE};padding:12px 6px;"> </td><td style="padding:12px 6px;"> </td></tr>`).join('')
      const payLines = (o.payments||[]).map(pmt => `<div style="font-size:12px;color:#2E7D46;margin-top:3px;">✓ ${money(pmt.amount)}${pmt.method ? ' · '+pmt.method : ''}${pmt.date ? ' · '+fmtDate(pmt.date) : ''}</div>`).join('')
      return `
        <div style="page-break-after:always;padding:28px 32px;font-family:'Arial',sans-serif;width:100%;">
          <!-- Pad border -->
          <div style="border:2px solid ${PAD_BLUE};border-radius:4px;overflow:hidden;">

            <!-- Header: biz name left, order no right -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px 10px;border-bottom:1px solid ${GRID_BLUE};background:#F6F9FE;">
              <div style="font-size:26px;font-weight:700;color:${PAD_BLUE};">${BIZ}</div>
              <div style="font-size:32px;font-weight:800;color:${RED_NO};letter-spacing:0.02em;">No. ${o.orderNo || '—'}</div>
            </div>

            <!-- Date row -->
            <div style="display:flex;align-items:center;border-bottom:1px solid ${GRID_BLUE};padding:10px 18px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:70px;">Date</span>
              <span style="font-size:17px;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${fmtDate(o.date)}</span>
            </div>

            <!-- First / Last name row -->
            <div style="display:flex;border-bottom:1px solid ${GRID_BLUE};">
              <div style="flex:1;display:flex;align-items:center;padding:10px 18px;border-right:1px solid ${GRID_BLUE};">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:40px;">First</span>
                <span style="font-size:20px;font-weight:600;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${o.firstName || ''}</span>
              </div>
              <div style="flex:1;display:flex;align-items:center;padding:10px 18px;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:36px;">Last</span>
                <span style="font-size:20px;font-weight:600;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${o.lastName || ''}</span>
              </div>
            </div>

            <!-- Cell / Home row -->
            <div style="display:flex;border-bottom:1px solid ${GRID_BLUE};">
              <div style="flex:1;display:flex;align-items:center;padding:10px 18px;border-right:1px solid ${GRID_BLUE};">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:44px;">Cell</span>
                <span style="font-size:17px;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${o.phone || ''}</span>
              </div>
              <div style="flex:1;display:flex;align-items:center;padding:10px 18px;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:44px;">Home</span>
                <span style="font-size:17px;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${o.home || ''}</span>
              </div>
            </div>

            <!-- Email row -->
            <div style="display:flex;align-items:center;border-bottom:1px solid ${GRID_BLUE};padding:10px 18px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:70px;">Email</span>
              <span style="font-size:17px;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${o.email || ''}</span>
            </div>

            <!-- Address row -->
            <div style="display:flex;align-items:center;border-bottom:1px solid ${GRID_BLUE};padding:10px 18px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${PAD_BLUE};width:70px;">Address</span>
              <span style="font-size:17px;border-bottom:1px solid ${PAD_BLUE};flex:1;padding-bottom:3px;">${addr}</span>
            </div>

            <!-- Item table -->
            <table style="width:100%;border-collapse:collapse;border-bottom:2px solid ${PAD_BLUE};">
              <thead>
                <tr style="background:#EAF0FB;">
                  <th style="width:36px;padding:10px 6px;border-right:1px solid ${GRID_BLUE};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${PAD_BLUE};text-align:center;">#</th>
                  <th style="width:90px;padding:10px 8px;border-right:1px solid ${GRID_BLUE};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${PAD_BLUE};text-align:left;">Item #</th>
                  <th style="width:54px;padding:10px 6px;border-right:1px solid ${GRID_BLUE};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${PAD_BLUE};text-align:center;">Qty</th>
                  <th style="padding:10px 12px;border-right:1px solid ${GRID_BLUE};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${PAD_BLUE};text-align:left;">Description</th>
                  <th style="width:110px;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${PAD_BLUE};text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody style="border-bottom:1px solid ${GRID_BLUE};">
                ${itemLines}${fillerRows}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="padding:12px 18px;display:flex;flex-direction:column;align-items:flex-end;gap:5px;border-bottom:1px solid ${GRID_BLUE};">
              <div style="font-size:15px;color:#666;">Subtotal: <b>${money(sub)}</b></div>
              ${tax > 0 ? `<div style="font-size:15px;color:#666;">Tax (${o.taxRate||0}%): <b>${money(tax)}</b></div>` : ''}
              <div style="font-size:24px;font-weight:800;color:${PAD_BLUE};margin-top:4px;">Total: ${money(tot)}</div>
            </div>

            <!-- Payments + balance -->
            <div style="padding:12px 18px;border-bottom:${o.alterations||o.notes ? '1px solid '+GRID_BLUE : 'none'};">
              ${payLines}
              <div style="font-size:18px;font-weight:700;margin-top:8px;color:${bal > 0.005 ? '#9C6B12' : '#2E7D46'};">
                ${bal > 0.005 ? `Balance due: ${money(bal)}` : 'Paid in full ✓'}
              </div>
            </div>

            <!-- Alterations -->
            ${o.alterations ? `<div style="padding:12px 18px;background:#FBEAF0;border-bottom:${o.notes?'1px solid '+GRID_BLUE:'none'};font-size:15px;"><b style="color:#8E3B54;">✂ Alterations${o.alterationsDone?' — done ✓':' — in progress'}${o.alterationsDue?' · due '+fmtDate(o.alterationsDue):''}</b>${o.alterationsNote?'<br><span style="font-size:15px;">'+o.alterationsNote+'</span>':''}</div>` : ''}

            <!-- Notes -->
            ${o.notes ? `<div style="padding:12px 18px;font-size:15px;color:#555;"><b>Notes:</b> ${o.notes}</div>` : ''}

          </div>
        </div>`
    }).join('')
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Orders</title><style>*{box-sizing:border-box}@media print{body{margin:0}}</style></head><body>${rows}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }
  const patchOrder = async (id, patch) => {
    const updated = orders.find(o => o.id === id); if (!updated) return
    const newOrder = { ...updated, ...patch }
    setOrders(prev => prev.map(o => o.id === id ? newOrder : o))
    const { error } = await supabase.from('gown_orders').update(toDB(newOrder, user.id)).eq('id', id)
    if (error) {
      alert('Could not save change: ' + error.message)
      setOrders(prev => prev.map(o => o.id === id ? updated : o))  // roll back on failure
    }
  }
  const addTodo = (orderId) => {
    const inp = todoInput[orderId] || {}
    if (!inp.text?.trim()) return
    const todo = { id: uid(), text: inp.text.trim(), assignedTo: inp.assignee?.trim() || '', date: inp.date || todayStr(), done: false }
    patchOrder(orderId, { todos: [...(orders.find(o => o.id === orderId)?.todos || []), todo] })
    setTodoInput(p => ({ ...p, [orderId]: { text: '', assignee: inp.assignee || '', date: '' } }))
  }
  const toggleTodo = (orderId, todoId) => { const o = orders.find(x => x.id === orderId); if (!o) return; patchOrder(orderId, { todos: o.todos.map(t => t.id === todoId ? { ...t, done: !t.done } : t) }) }
  const removeTodo = (orderId, todoId) => { const o = orders.find(x => x.id === orderId); if (!o) return; patchOrder(orderId, { todos: o.todos.filter(t => t.id !== todoId) }) }
  // Tasks edited directly on the order form (saved with the order, so they work on brand-new orders too)
  const addFormTodo = () => {
    if (!formTodo.text.trim()) return
    const todo = { id: uid(), text: formTodo.text.trim(), assignedTo: formTodo.assignee.trim(), date: formTodo.date || '', done: false }
    setForm(f => ({ ...f, todos: [...(f.todos || []), todo] }))
    setFormTodo({ text: '', assignee: formTodo.assignee, date: '' })
  }
  const toggleFormTodo = (id) => setForm(f => ({ ...f, todos: (f.todos || []).map(t => t.id === id ? { ...t, done: !t.done } : t) }))
  const removeFormTodo = (id) => setForm(f => ({ ...f, todos: (f.todos || []).filter(t => t.id !== id) }))

  // Standalone tasks (Tasks page) — may be linked to an order via order_id, or free-standing.
  const addTask = async () => {
    if (!newTask.text.trim()) { alert('Enter a task.'); return }
    const row = { user_id: user.id, text: newTask.text.trim(), assignee: titleCase(newTask.assignee), due_date: newTask.date || null, done: false, order_id: newTask.orderId || null }
    const { data, error } = await supabase.from('gown_tasks').insert(row).select().single()
    if (error) { alert('Could not add task: ' + error.message); return }
    setTasks(prev => [data, ...prev])
    setNewTask({ text: '', assignee: '', date: '', orderId: '' })
  }
  const toggleTask = async (id) => {
    const tk = tasks.find(t => t.id === id); if (!tk) return
    const done = !tk.done
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    const { error } = await supabase.from('gown_tasks').update({ done }).eq('id', id)
    if (error) { alert('Could not update task: ' + error.message); setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t)) }
  }
  const removeTask = async (id) => {
    const prev = tasks
    setTasks(p => p.filter(t => t.id !== id))
    const { error } = await supabase.from('gown_tasks').delete().eq('id', id)
    if (error) { alert('Could not delete task: ' + error.message); setTasks(prev) }
  }

  const downloadCSV = () => {
    if (!orders.length) { alert('No orders to export yet.'); return }
    const esc = (s) => { const v = String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim(); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v }
    const headers = ['Order #', 'Date', 'First Name', 'Last Name', 'Cell', 'Home', 'Email', 'Address', 'City', 'State', 'Zip', 'Items', 'Subtotal', 'Tax Rate', 'Tax', 'Total', 'Amount Paid', 'Balance', 'Status', 'Payments', 'Alterations', 'Notes']
    const rows = orders.map(o => {
      const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
      const itemsSummary = o.items.filter(it => it.desc || lineAmt(it)).map(it => `${it.qty > 1 ? it.qty + 'x ' : ''}${it.desc || ''}${lineAmt(it) ? ' (' + money(lineAmt(it)) + (it.taxable === false ? ' no tax' : '') + ')' : ''}`).join('; ')
      const payHistory = (o.payments || []).map(p => `${money(p.amount)}${p.method ? ' ' + p.method : ''}${p.date ? ' ' + fmtDate(p.date) : ''}`).join('; ')
      const altNote = o.alterations ? `${o.alterationsDone ? 'Done' : 'Pending'}${o.alterationsDue ? ' (due ' + fmtDate(o.alterationsDue) + ')' : ''}${o.alterationsNote ? ': ' + o.alterationsNote : ''}` : ''
      const status = isOpen(o) ? 'Open' : 'Completed'
      const fn = o.firstName || (o.name ? o.name.split(' ')[0] : '')
      const ln = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
      return [o.orderNo || '', o.date || '', fn, ln, o.phone || '', o.home || '', o.email || '', o.address || '', o.city || '', o.state || '', o.zip || '', itemsSummary, sub.toFixed(2), (o.taxRate || 0) + '%', tax.toFixed(2), tot.toFixed(2), p.toFixed(2), bal.toFixed(2), status, payHistory, altNote, o.notes || ''].map(esc).join(',')
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
  // When searching, look across ALL orders (not just the current tab) so a name always finds its customer.
  const filtered = (search ? orders : base).filter(o => !search || fullName(o).toLowerCase().includes(search.toLowerCase()))

  // ── styles ──────────────────────────────────────────────────────────────────
  const lbl = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: PAD }
  const cellIn = { width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '16px', color: INK, padding: '12px 8px' }
  const th = { padding: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: PAD, background: '#EAF0FB' }
  const fieldIn = { width: '100%', padding: '13px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '11px', background: '#fff', color: INK, outline: 'none', fontFamily: 'inherit' }
  const primaryBtn = { padding: '15px 20px', fontSize: '17px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '13px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(177,77,106,0.3)' }
  const ghostBtn = { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px solid #E2D7D1`, borderRadius: '12px', cursor: 'pointer' }
  const tabBtn = (on) => ({ flex: 1, padding: '12px 8px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${on ? PAD : '#DDD5CE'}`, background: on ? PAD : '#fff', color: on ? '#fff' : '#6B6870', boxShadow: on ? '0 2px 8px rgba(42,76,156,0.2)' : 'none' })

  // ── login screen ─────────────────────────────────────────────────────────────
  if (authLoading) return null
  if (!user) return (
    <>
      <Head><title>{BIZ} — Sign in</title><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/></Head>
      <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: 700, color: '#1C1C2E' }}>{BIZ}</div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: ROSE, marginTop: '4px', fontWeight: 600 }}>Order Book</div>
          </div>
          <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: '16px', padding: '26px', border: '1px solid #EAE0D8', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoFocus style={{ width: '100%', padding: '12px 14px', fontSize: '16px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required style={{ width: '100%', padding: '12px 14px', fontSize: '16px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            {loginErr && <div style={{ color: REDNO, fontSize: '13px', marginBottom: '12px' }}>{loginErr}</div>}
            <button type="submit" disabled={loginBusy} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, color: '#fff', background: ROSE, border: 'none', borderRadius: '12px', cursor: loginBusy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {loginBusy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#B9ADA8' }}>
            Managed by <span style={{ color: ROSE_DK, fontWeight: 600 }}>JK No Jokes Financials</span>
          </div>
        </div>
      </div>
    </>
  )

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
        <div className="gw-header" onClick={() => { setView('list'); setTab('open'); setSelectedCustomer(null); setSearch(''); window.scrollTo(0, 0) }} style={{ cursor: 'pointer' }} title="Back to home">
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
              <button onClick={() => setTab('todos')} style={tabBtn(tab === 'todos')}>Tasks ({orders.reduce((s, o) => s + (o.todos || []).filter(t => !t.done).length + (o.alterations && !o.alterationsDone ? 1 : 0), 0) + tasks.filter(t => !t.done).length})</button>
              <button onClick={() => { setTab('customers'); setSelectedCustomer(null) }} style={tabBtn(tab === 'customers')}>Customers</button>
            </div>

            {orders.length > 0 && tab !== 'todos' && !(tab === 'customers' && selectedCustomer) && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ ...fieldIn, fontSize: '18px', marginBottom: '16px' }} />
            )}

            {tab !== 'todos' && tab !== 'customers' && filtered.length === 0 ? (
              <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪡</div>
                <div style={{ fontSize: '17px', color: INK, fontWeight: 600, marginBottom: '4px' }}>{orders.length ? `No ${tab === 'all' ? '' : tab + ' '}orders` : 'No orders yet'}</div>
                <div style={{ fontSize: '15px' }}>{orders.length ? (search ? 'Try a different name.' : 'Nothing here right now.') : 'Tap "+ New Order" to write your first one.'}</div>
              </div>
            ) : tab !== 'todos' && tab !== 'customers' ? (
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
                        {o.items.filter(it => it.desc?.trim() || it.price || it.itemNo).slice(0, 3).map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '2px 0' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(parseFloat(it.qty) || 1) > 1 ? `${it.qty}× ` : ''}{it.desc?.trim() || it.itemNo || '—'}</span>
                            <span style={{ color: MUTED, whiteSpace: 'nowrap' }}>{it.price ? `${money0(it.price)}${(parseFloat(it.qty) || 1) > 1 ? ' ea' : ''}` : ''}</span>
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
                            ✂ Alterations {needsAlt ? '— in progress' : '— done ✓'}{o.alterationsDue ? ` · due ${fmtShort(o.alterationsDue)}` : ''}{o.alterationsAssignee ? ` · ${o.alterationsAssignee}` : ''}
                          </div>
                          {o.alterationsNote && <div style={{ fontSize: '14px', color: INK, marginTop: '3px', lineHeight: 1.4 }}>{o.alterationsNote}</div>}
                        </div>
                      )}
                      {o.notes && (
                        <div style={{ marginTop: '10px', fontSize: '13px', color: MUTED, lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: INK }}>Note:</span> {o.notes}</div>
                      )}

                      {/* ── To-do section ── */}
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0E9E3' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: PAD, marginBottom: '8px' }}>Tasks</div>

                        {/* Existing todos */}
                        {(o.todos || []).length > 0 && (
                          <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {(o.todos || []).map(t => (
                              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: '6px', alignItems: 'center', padding: '5px 8px', background: t.done ? '#F8F6F3' : '#F0F4FF', borderRadius: '8px' }}>
                                <span style={{ fontSize: '12px', color: MUTED, fontWeight: 500 }}>{t.date ? fmtShort(t.date) : '—'}</span>
                                <span style={{ fontSize: '13px', color: t.done ? MUTED : INK, textDecoration: t.done ? 'line-through' : 'none', lineHeight: 1.3 }}>
                                  {t.text}
                                  {t.assignedTo ? <span style={{ display: 'block', fontSize: '11px', color: ROSE_DK, fontWeight: 600, marginTop: '1px' }}>{t.assignedTo}</span> : null}
                                </span>
                                <input type="checkbox" checked={t.done} onChange={() => toggleTodo(o.id, t.id)} style={{ width: '15px', height: '15px', accentColor: PAD, cursor: 'pointer' }} />
                                <button onClick={() => removeTodo(o.id, t.id)} style={{ background: 'none', border: 'none', color: '#D0C5BF', fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add todo row */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                            <input type="date" value={(todoInput[o.id] || {}).date || ''}
                              onChange={e => setTodoInput(p => ({ ...p, [o.id]: { ...(p[o.id] || {}), date: e.target.value } }))}
                              style={{ fontSize: '13px', border: '1.5px solid #E2D7D1', borderRadius: '8px', padding: '6px 8px', fontFamily: 'inherit', color: INK, outline: 'none', background: '#fff' }} />
                            <input value={(todoInput[o.id] || {}).assignee || ''}
                              onChange={e => setTodoInput(p => ({ ...p, [o.id]: { ...(p[o.id] || {}), assignee: e.target.value } }))}
                              placeholder="Assigned to…"
                              style={{ fontSize: '13px', border: '1.5px solid #E2D7D1', borderRadius: '8px', padding: '6px 8px', fontFamily: 'inherit', color: INK, outline: 'none', background: '#fff' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <input value={(todoInput[o.id] || {}).text || ''}
                              onChange={e => setTodoInput(p => ({ ...p, [o.id]: { ...(p[o.id] || {}), text: e.target.value } }))}
                              onKeyDown={e => { if (e.key === 'Enter') addTodo(o.id) }}
                              placeholder="Task…"
                              style={{ flex: 1, fontSize: '13px', border: '1.5px solid #E2D7D1', borderRadius: '8px', padding: '6px 8px', fontFamily: 'inherit', color: INK, outline: 'none', background: '#fff' }} />
                            <button onClick={() => addTodo(o.id)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, background: PAD, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        {isOpen(o)
                          ? <span style={{ fontSize: '12px', fontWeight: 700, color: AMBER, letterSpacing: '0.05em', textTransform: 'uppercase' }}>● Open</span>
                          : <span style={{ fontSize: '12px', fontWeight: 700, color: GREEN, letterSpacing: '0.05em', textTransform: 'uppercase' }}>● Completed</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* ===== TASKS TAB ===== */}
            {tab === 'todos' && (() => {
              // Alterations show up as tasks automatically (due date + note), alongside manual to-dos.
              const altTasks = orders.filter(o => o.alterations).map(o => ({
                id: 'alt-' + o.id, isAlteration: true,
                text: o.alterationsNote?.trim() ? `✂ Alterations — ${o.alterationsNote.trim()}` : '✂ Alterations',
                assignedTo: o.alterationsAssignee || '', date: o.alterationsDue || '', done: !!o.alterationsDone,
                orderId: o.id, orderNo: o.orderNo, customerName: fullName(o),
              }))
              // Standalone tasks from the Tasks page (may be linked to an order).
              const standalone = tasks.map(tk => {
                const o = tk.order_id ? orders.find(x => x.id === tk.order_id) : null
                return {
                  id: 'st-' + tk.id, taskId: tk.id, isStandalone: true,
                  text: tk.text, assignedTo: tk.assignee || '', date: tk.due_date || '', done: tk.done,
                  orderId: o ? o.id : null, orderNo: o ? o.orderNo : null, customerName: o ? fullName(o) : '',
                }
              })
              const allTodos = [
                ...altTasks,
                ...standalone,
                ...orders.flatMap(o => (o.todos || []).map(t => ({ ...t, orderId: o.id, orderNo: o.orderNo, customerName: fullName(o) }))),
              ]
              const open = allTodos.filter(t => !t.done)
              const byPerson = open.reduce((acc, t) => { const k = t.assignedTo || 'Unassigned'; if (!acc[k]) acc[k] = []; acc[k].push(t); return acc }, {})
              const byCustomer = open.reduce((acc, t) => { const k = t.customerName || 'General (no order)'; if (!acc[k]) acc[k] = []; acc[k].push(t); return acc }, {})
              const byDate = [...open].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
              const taskRow = (t) => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '10px', alignItems: 'center', padding: '11px 14px', borderBottom: `1px solid ${CREAM}` }}>
                  <span style={{ fontSize: '13px', color: MUTED, fontWeight: 500, whiteSpace: 'nowrap' }}>{t.date ? fmtShort(t.date) : '—'}</span>
                  <div>
                    <div style={{ fontSize: '14px', color: INK, fontWeight: 500 }}>{t.text}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                      {t.orderNo != null
                        ? <><span style={{ color: REDNO, fontWeight: 600, cursor: 'pointer' }} onClick={() => { const o = orders.find(x => x.id === t.orderId); if (o) openOrder(o) }}>No. {t.orderNo}</span>{t.customerName ? ` · ${t.customerName}` : ''}</>
                        : <span style={{ fontStyle: 'italic' }}>General task</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={false} onChange={() => t.isAlteration ? patchOrder(t.orderId, { alterationsDone: true }) : t.isStandalone ? toggleTask(t.taskId) : toggleTodo(t.orderId, t.id)} style={{ width: '17px', height: '17px', accentColor: PAD, cursor: 'pointer' }} />
                    {t.isStandalone && <button onClick={() => removeTask(t.taskId)} title="Delete task" style={{ border: 'none', background: 'none', color: '#D0C5BF', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>}
                  </div>
                </div>
              )
              return (
                <div>
                  {/* Add a standalone task (optionally linked to an order) */}
                  <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New task</div>
                    <input value={newTask.text} onChange={e => setNewTask(p => ({ ...p, text: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addTask() }} placeholder="What needs to get done?" style={{ ...fieldIn, marginBottom: '8px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Person</div>
                        <input value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} onBlur={e => setNewTask(p => ({ ...p, assignee: titleCase(e.target.value) }))} placeholder="Who's on it" style={fieldIn} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Due</div>
                        <input type="date" value={newTask.date} onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))} style={fieldIn} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Link to order (optional)</div>
                      <select value={newTask.orderId} onChange={e => setNewTask(p => ({ ...p, orderId: e.target.value }))} style={{ ...fieldIn, cursor: 'pointer' }}>
                        <option value="">— none (standalone task) —</option>
                        {orders.map(o => <option key={o.id} value={o.id}>No. {o.orderNo} — {fullName(o)}</option>)}
                      </select>
                    </div>
                    <button onClick={addTask} className="gw-press" style={{ ...primaryBtn, width: '100%', padding: '12px' }}>+ Add task</button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[['person', 'By Person'], ['customer', 'By Customer'], ['date', 'By Date']].map(([v, l]) => (
                      <button key={v} onClick={() => setTodoView(v)} style={{ ...tabBtn(todoView === v), flex: 'none', padding: '10px 20px' }}>{l}</button>
                    ))}
                    {open.length > 0 && <button onClick={() => {
                      const grouped = todoView === 'person'
                        ? Object.keys(byPerson).sort().map(p => `<div style="margin-bottom:20px;"><div style="font-size:15px;font-weight:700;color:#2A4C9C;border-bottom:2px solid #2A4C9C;padding-bottom:6px;margin-bottom:8px;">${p}</div>${byPerson[p].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(t=>`<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid #eee;font-size:13px;"><span style="width:70px;color:#888;flex-shrink:0;">${t.date?fmtShort(t.date):'—'}</span><span style="flex:1;">${t.text}</span><span style="color:#C8322B;font-weight:600;white-space:nowrap;">${t.orderNo != null ? 'No. ' + t.orderNo : 'General'}</span><span style="color:#666;margin-left:8px;">${t.customerName}</span></div>`).join('')}</div>`).join('')
                        : todoView === 'customer'
                        ? Object.keys(byCustomer).sort().map(c => `<div style="margin-bottom:20px;"><div style="font-size:15px;font-weight:700;color:#2A4C9C;border-bottom:2px solid #2A4C9C;padding-bottom:6px;margin-bottom:8px;">${c}</div>${byCustomer[c].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(t=>`<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid #eee;font-size:13px;"><span style="width:70px;color:#888;flex-shrink:0;">${t.date?fmtShort(t.date):'—'}</span><span style="flex:1;">${t.text}</span><span style="color:#8A8A93;">${t.assignedTo||'—'}</span><span style="color:#C8322B;font-weight:600;white-space:nowrap;">${t.orderNo != null ? 'No. ' + t.orderNo : 'General'}</span></div>`).join('')}</div>`).join('')
                        : (() => { const gd = byDate.reduce((acc,t)=>{const k=t.date||'No date';if(!acc[k])acc[k]=[];acc[k].push(t);return acc},{});return Object.keys(gd).map(d=>`<div style="margin-bottom:20px;"><div style="font-size:15px;font-weight:700;color:#2A4C9C;border-bottom:2px solid #2A4C9C;padding-bottom:6px;margin-bottom:8px;">${d==='No date'?'No date':fmtDate(d)}</div>${gd[d].map(t=>`<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid #eee;font-size:13px;"><span style="flex:1;">${t.text}</span><span style="color:#8A8A93;">${t.assignedTo||'—'}</span><span style="color:#C8322B;font-weight:600;white-space:nowrap;margin-left:8px;">${t.orderNo != null ? 'No. ' + t.orderNo : 'General'}</span><span style="color:#666;margin-left:8px;">${t.customerName}</span></div>`).join('')}</div>`).join('') })()
                      const viewLabel = todoView === 'person' ? 'By Person' : todoView === 'customer' ? 'By Customer' : 'By Date'
                      const win = window.open('', '_blank')
                      win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Tasks</title></head><body style="font-family:sans-serif;padding:32px;max-width:720px;margin:0 auto;"><div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #2A4C9C;padding-bottom:12px;margin-bottom:24px;"><div style="font-size:22px;font-weight:700;">${BIZ} — Task List</div><div style="font-size:13px;color:#888;">${new Date().toLocaleDateString()} · ${viewLabel}</div></div>${grouped}</body></html>`)
                      win.document.close(); win.focus(); setTimeout(()=>win.print(), 400)
                    }} style={{ flex: 'none', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: PAD, border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>🖨 Print</button>}
                  </div>

                  {open.length === 0 && (
                    <div className="gw-card" style={{ padding: '36px 24px', textAlign: 'center', color: MUTED }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: INK }}>All caught up</div>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>No open tasks across any orders.</div>
                    </div>
                  )}

                  {todoView === 'person' && Object.keys(byPerson).sort().map(person => (
                    <div key={person} className="gw-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 14px', background: '#F0F4FF', borderBottom: `1px solid ${GRID}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: PAD }}>{person}</span>
                        <span style={{ fontSize: '12px', color: MUTED }}>{byPerson[person].length} task{byPerson[person].length !== 1 ? 's' : ''}</span>
                      </div>
                      {byPerson[person].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(taskRow)}
                    </div>
                  ))}

                  {todoView === 'customer' && Object.keys(byCustomer).sort().map(cust => (
                    <div key={cust} className="gw-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 14px', background: '#F0F4FF', borderBottom: `1px solid ${GRID}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: PAD }}>{cust}</span>
                        <span style={{ fontSize: '12px', color: MUTED }}>{byCustomer[cust].length} task{byCustomer[cust].length !== 1 ? 's' : ''}</span>
                      </div>
                      {byCustomer[cust].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(taskRow)}
                    </div>
                  ))}

                  {todoView === 'date' && (() => {
                    const grouped = byDate.reduce((acc, t) => { const k = t.date || 'No date'; if (!acc[k]) acc[k] = []; acc[k].push(t); return acc }, {})
                    return Object.keys(grouped).map(date => (
                      <div key={date} className="gw-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 14px', background: '#F0F4FF', borderBottom: `1px solid ${GRID}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: PAD }}>{date === 'No date' ? 'No date' : fmtDate(date)}</span>
                          <span style={{ fontSize: '12px', color: MUTED }}>{grouped[date].length} task{grouped[date].length !== 1 ? 's' : ''}</span>
                        </div>
                        {grouped[date].map(taskRow)}
                      </div>
                    ))
                  })()}
                </div>
              )
            })()}

            {/* ===== CUSTOMERS TAB ===== */}
            {tab === 'customers' && (() => {
              const custMap = orders.reduce((acc, o) => {
                const key = o.phone || fullName(o)
                if (!key) return acc
                if (!acc[key]) acc[key] = { name: fullName(o), phone: o.phone || '', address: o.address || '', city: o.city || '', state: o.state || '', zip: o.zip || '', orders: [] }
                acc[key].orders.push(o)
                return acc
              }, {})
              const q = search.trim().toLowerCase()
              const customers = Object.entries(custMap)
                .filter(([, c]) => !q || c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
                .sort((a, b) => a[1].name.localeCompare(b[1].name))

              if (selectedCustomer && custMap[selectedCustomer]) {
                const cust = custMap[selectedCustomer]
                const custOrders = cust.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                const totalSpent = custOrders.reduce((s, o) => s + orderTotal(o), 0)
                return (
                  <div>
                    <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 14px' }}>← All customers</button>
                    <div className="gw-card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: INK }}>{cust.name}</div>
                      {cust.phone && <div style={{ fontSize: '14px', color: MUTED, marginTop: '4px' }}>{cust.phone}</div>}
                      {cust.address && <div style={{ fontSize: '14px', color: MUTED, marginTop: '2px' }}>{cust.address}{cust.city ? `, ${cust.city}` : ''}{cust.state ? `, ${cust.state}` : ''}{cust.zip ? ` ${cust.zip}` : ''}</div>}
                      <div style={{ display: 'flex', gap: '20px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F0E9E3' }}>
                        <div><div style={{ fontSize: '22px', fontWeight: 800, color: INK }}>{custOrders.length}</div><div style={{ fontSize: '11px', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Orders</div></div>
                        <div><div style={{ fontSize: '22px', fontWeight: 800, color: GREEN }}>{money(totalSpent)}</div><div style={{ fontSize: '11px', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total spent</div></div>
                        <div><div style={{ fontSize: '22px', fontWeight: 800, color: INK }}>{fmtDate(custOrders[0]?.date)}</div><div style={{ fontSize: '11px', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last order</div></div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Order history</div>
                    {custOrders.map(o => {
                      const tot = orderTotal(o), bal = balanceOf(o)
                      return (
                        <div key={o.id} className="gw-card gw-card-click gw-press" onClick={() => openOrder(o)} style={{ padding: '14px 16px', marginBottom: '10px', cursor: 'pointer', borderLeft: `4px solid ${isOpen(o) ? ROSE : GREEN}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '17px', fontWeight: 800, color: REDNO }}>No. {o.orderNo}</span>
                              <span style={{ fontSize: '13px', color: MUTED }}>{fmtDate(o.date)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{o.items.filter(it => it.desc).slice(0, 2).map(it => it.desc).join(', ')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800 }}>{money(tot)}</div>
                            {bal > 0.005
                              ? <div style={{ fontSize: '12px', fontWeight: 700, color: AMBER }}>Owes {money(bal)}</div>
                              : <div style={{ fontSize: '12px', fontWeight: 700, color: GREEN }}>Paid ✓</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              return (
                <div>
                  {customers.length === 0 ? (
                    <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👗</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: INK }}>{q ? 'No matching customers' : 'No customers yet'}</div>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>{q ? 'Try a different name.' : 'Customers are built from your orders automatically.'}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customers.map(([key, cust]) => {
                        const totalSpent = cust.orders.reduce((s, o) => s + orderTotal(o), 0)
                        const lastOrder = cust.orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
                        const openOrders = cust.orders.filter(isOpen).length
                        return (
                          <div key={key} className="gw-card gw-card-click gw-press" onClick={() => setSelectedCustomer(key)} style={{ padding: '15px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: 700, color: INK }}>{cust.name}</div>
                              <div style={{ fontSize: '13px', color: MUTED, marginTop: '3px' }}>
                                {cust.phone}{cust.city ? (cust.phone ? ` · ${cust.city}` : cust.city) : ''}
                              </div>
                              <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                                {cust.orders.length} order{cust.orders.length !== 1 ? 's' : ''} · Last: {fmtDate(lastOrder?.date)}
                                {openOrders > 0 && <span style={{ color: AMBER, fontWeight: 600, marginLeft: '8px' }}>● {openOrders} open</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '20px', fontWeight: 800, color: GREEN }}>{money(totalSpent)}</div>
                              <div style={{ fontSize: '11px', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total spent</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {orders.length > 0 && tab !== 'todos' && tab !== 'customers' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginTop: '26px' }}>
                  <button onClick={downloadCSV} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#fff', border: `1.5px solid ${GRID}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⬇ Export to Excel (.csv)
                  </button>
                  <button onClick={() => printOrders(filtered)} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, color: '#fff', background: PAD, border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🖨 Print orders
                  </button>
                </div>

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
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', padding: '6px 12px 0' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: REDNO, letterSpacing: '0.02em' }}>No.</span>
                <input
                  value={form.orderNo == null ? '' : form.orderNo}
                  onChange={e => setF('orderNo', e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  style={{ width: '90px', textAlign: 'right', fontSize: '22px', fontWeight: 800, color: REDNO, letterSpacing: '0.02em', border: 'none', borderBottom: `1.5px solid ${GRID}`, background: 'transparent', fontFamily: 'inherit', padding: '0 0 2px', outline: 'none' }}
                />
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
                  <input value={form.firstName} onChange={e => setF('firstName', e.target.value)} onBlur={e => setF('firstName', titleCase(e.target.value))} placeholder="First name" style={{ ...cellIn, fontSize: '18px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '4px 10px' }}>
                  <span style={{ ...lbl, width: '52px', flexShrink: 0 }}>Last</span>
                  <input value={form.lastName} onChange={e => setF('lastName', e.target.value)} onBlur={e => setF('lastName', titleCase(e.target.value))} placeholder="Last name" style={{ ...cellIn, fontSize: '18px', fontWeight: 600 }} />
                </div>
              </div>

              {/* cell (required) */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Cell</span>
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} onBlur={e => setF('phone', fmtPhone(e.target.value))} type="tel" placeholder="required" style={cellIn} />
              </div>

              {/* home phone (optional) */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Home</span>
                <input value={form.home} onChange={e => setF('home', e.target.value)} onBlur={e => setF('home', fmtPhone(e.target.value))} type="tel" placeholder="optional" style={cellIn} />
              </div>

              {/* email (optional) */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Email</span>
                <input value={form.email} onChange={e => setF('email', e.target.value)} onBlur={e => setF('email', cleanEmail(e.target.value))} type="email" placeholder="optional" style={cellIn} />
              </div>

              {/* address */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${GRID}`, padding: '4px 10px' }}>
                <span style={{ ...lbl, width: '62px', flexShrink: 0 }}>Address</span>
                <input value={form.address} onChange={e => setF('address', e.target.value)} onBlur={e => setF('address', titleCase(e.target.value))} placeholder="Street address" style={cellIn} />
              </div>

              {/* city / state / zip */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 2, padding: '4px 10px', borderRight: `1px solid ${GRID}` }}>
                  <span style={{ ...lbl, width: '32px', flexShrink: 0 }}>City</span>
                  <input value={form.city} onChange={e => setF('city', e.target.value)} onBlur={e => setF('city', titleCase(e.target.value))} placeholder="City" style={cellIn} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '70px', padding: '4px 8px', borderRight: `1px solid ${GRID}` }}>
                  <input value={form.state} onChange={e => setF('state', e.target.value)} onBlur={e => setF('state', cleanState(e.target.value))} placeholder="ST" maxLength={2} style={{ ...cellIn, textTransform: 'uppercase', padding: '12px 4px', textAlign: 'center' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100px', padding: '4px 8px' }}>
                  <input value={form.zip} onChange={e => setF('zip', e.target.value)} onBlur={e => setF('zip', cleanZip(e.target.value))} placeholder="Zip" maxLength={10} style={{ ...cellIn, padding: '12px 4px' }} />
                </div>
              </div>

              {/* table header */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}` }}>
                <div style={{ ...th, width: '26px', textAlign: 'center', padding: '8px 0' }} />
                <div style={{ ...th, width: '44px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }}>Qty</div>
                <div style={{ ...th, width: '72px', borderLeft: `1px solid ${GRID}` }}>Item #</div>
                <div style={{ ...th, flex: 1, borderLeft: `1px solid ${GRID}` }}>Description</div>
                <div style={{ ...th, width: '82px', textAlign: 'right', borderLeft: `1px solid ${GRID}` }}>Price</div>
                <div style={{ ...th, width: '82px', textAlign: 'right', borderLeft: `1px solid ${GRID}` }}>Amount</div>
                <div style={{ ...th, width: '38px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }} title="Check = taxable">Tax</div>
                <div style={{ ...th, width: '26px', padding: '8px 0' }} />
              </div>

              {/* rows */}
              {form.items.map((it, i) => {
                const showSuggest = suggest && suggest.id === it.id
                return (
                  <div key={it.id} style={{ display: 'flex', borderBottom: `1px solid ${GRID}`, alignItems: 'center', position: 'relative' }}>
                    <div style={{ width: '26px', textAlign: 'center', fontSize: '11px', color: PAD, fontWeight: 600 }}>{i + 1}</div>
                    <input value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} type="number" inputMode="numeric" style={{ ...cellIn, width: '44px', textAlign: 'center', padding: '12px 2px', borderLeft: `1px solid ${GRID}` }} />
                    {/* item # with typeahead */}
                    <div style={{ width: '72px', borderLeft: `1px solid ${GRID}`, position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                      <input
                        value={it.itemNo || ''}
                        onChange={e => onItemNo(it.id, e.target.value)}
                        onBlur={() => setTimeout(() => setSuggest(null), 150)}
                        placeholder="—"
                        style={{ ...cellIn, width: '100%', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}
                      />
                      {showSuggest && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99, background: '#fff', border: `2px solid ${PAD}`, borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.13)', minWidth: '220px', overflow: 'hidden' }}>
                          {suggest.matches.map(m => (
                            <div key={m.no} onMouseDown={() => pickItem(it.id, m)} style={{ padding: '12px 14px', cursor: 'pointer', fontSize: '15px', borderBottom: `1px solid ${GRID}` }}>
                              <span style={{ fontWeight: 700, color: PAD, marginRight: '8px' }}>{m.no}</span>
                              <span style={{ color: INK }}>{m.desc}</span>
                            </div>
                          ))}
                          <div onMouseDown={() => { setSuggest(null); setNewItem({ rowId: it.id, no: suggest.query, desc: '', taxable: true, alteration: false }) }}
                            style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: ROSE_DK, background: '#FDF5F7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '16px' }}>＋</span> Save &ldquo;{suggest.query}&rdquo; as new item
                          </div>
                        </div>
                      )}
                    </div>
                    <input value={it.desc} onChange={e => setItem(it.id, 'desc', e.target.value)} placeholder={i === 0 ? 'Style, color, details…' : ''} style={{ ...cellIn, flex: 1, borderLeft: `1px solid ${GRID}` }} />
                    <input value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} type="number" inputMode="decimal" step="0.01" placeholder="$" style={{ ...cellIn, width: '82px', textAlign: 'right', padding: '12px 8px', borderLeft: `1px solid ${GRID}`, fontWeight: 600 }} />
                    <div style={{ width: '82px', textAlign: 'right', padding: '0 8px', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '15px', fontWeight: 600, color: INK }}>{lineAmt(it) ? money(lineAmt(it)) : ''}</div>
                    <div style={{ width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch' }}>
                      <input type="checkbox" className="tax-check" checked={it.taxable !== false} onChange={e => setItem(it.id, 'taxable', e.target.checked)} title="Taxable" />
                    </div>
                    <button onClick={() => removeRow(it.id)} aria-label="remove" style={{ width: '26px', height: '40px', border: 'none', background: 'none', color: '#C7B7B1', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                )
              })}

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
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select value={pmt.method || ''} onChange={e => setPaymentMethod(pmt.id, e.target.value)}
                          style={{ fontSize: '14px', fontWeight: pmt.method ? 400 : 600, color: pmt.method ? INK : REDNO, border: `1.5px solid ${pmt.method ? '#D6E5DC' : REDNO}`, borderRadius: '8px', padding: '4px 8px', background: '#fff', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                          <option value="">— choose type —</option>
                          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <span style={{ fontSize: '14px', color: MUTED }}>{fmtShort(pmt.date)}</span>
                      </div>
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
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Alterations due</div>
                      <input type="date" value={form.alterationsDue} onChange={e => setF('alterationsDue', e.target.value)} style={fieldIn} />
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Done by</div>
                      <input value={form.alterationsAssignee} onChange={e => setF('alterationsAssignee', e.target.value)} onBlur={e => setF('alterationsAssignee', titleCase(e.target.value))} placeholder="Who's doing it" style={fieldIn} />
                    </div>
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

            {/* Tasks */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tasks</div>

              {(form.todos || []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {form.todos.map(t => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '78px 1fr auto auto', gap: '8px', alignItems: 'center', padding: '8px 10px', background: t.done ? '#F8F6F3' : '#F0F4FF', borderRadius: '10px' }}>
                      <span style={{ fontSize: '12px', color: MUTED, fontWeight: 500 }}>{t.date ? fmtShort(t.date) : '—'}</span>
                      <span style={{ fontSize: '14px', color: t.done ? MUTED : INK, textDecoration: t.done ? 'line-through' : 'none', lineHeight: 1.3 }}>
                        {t.text}{t.assignedTo ? <span style={{ display: 'block', fontSize: '11px', color: ROSE_DK, fontWeight: 600, marginTop: '1px' }}>{t.assignedTo}</span> : null}
                      </span>
                      <input type="checkbox" checked={t.done} onChange={() => toggleFormTodo(t.id)} style={{ width: '16px', height: '16px', accentColor: PAD, cursor: 'pointer' }} />
                      <button onClick={() => removeFormTodo(t.id)} style={{ background: 'none', border: 'none', color: '#D0C5BF', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  <input type="date" value={formTodo.date} onChange={e => setFormTodo(p => ({ ...p, date: e.target.value }))} style={fieldIn} />
                  <input value={formTodo.assignee} onChange={e => setFormTodo(p => ({ ...p, assignee: e.target.value }))} onBlur={e => setFormTodo(p => ({ ...p, assignee: titleCase(e.target.value) }))} placeholder="Assigned to…" style={fieldIn} />
                </div>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <input value={formTodo.text} onChange={e => setFormTodo(p => ({ ...p, text: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFormTodo() } }} placeholder="Add a task…" style={{ ...fieldIn, flex: 1 }} />
                  <button onClick={addFormTodo} className="gw-press" style={{ padding: '0 18px', fontSize: '14px', fontWeight: 600, background: PAD, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Add</button>
                </div>
              </div>
            </div>

            <button className="gw-press" onClick={save} style={{ ...primaryBtn, width: '100%' }}>{editing ? 'Save changes' : 'Save order'}</button>
            <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>Cancel</button>
          </div>
        )}
      </div>

      {/* ===== NEW ITEM MODAL ===== */}
      {newItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: INK, marginBottom: '18px' }}>Save new item to catalog</div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Item #</div>
              <input value={newItem.no} onChange={e => setNewItem(n => ({ ...n, no: e.target.value.toUpperCase() }))} style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 700, color: PAD, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</div>
              <input value={newItem.desc} onChange={e => setNewItem(n => ({ ...n, desc: e.target.value }))} placeholder="What is this item?" autoFocus style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', color: INK, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                <input type="checkbox" checked={newItem.taxable} onChange={e => setNewItem(n => ({ ...n, taxable: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: PAD }} />
                Taxable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                <input type="checkbox" checked={newItem.alteration} onChange={e => setNewItem(n => ({ ...n, alteration: e.target.checked, taxable: e.target.checked ? false : n.taxable }))} style={{ width: '18px', height: '18px', accentColor: ROSE }} />
                Alteration
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setNewItem(null)} style={{ flex: 1, padding: '13px', fontSize: '16px', fontWeight: 600, background: '#fff', border: '1.5px solid #E2D7D1', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', color: MUTED }}>Cancel</button>
              <button onClick={saveNewItem} style={{ flex: 2, padding: '13px', fontSize: '16px', fontWeight: 700, background: ROSE, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Save &amp; use</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
