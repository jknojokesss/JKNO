import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ── Theme ───────────────────────────────────────────────────────────────────
const INK = '#23262E', MUTED = '#8A8A93', CREAM = '#F4F1EA'
const PAD = '#2A4C9C'
const GRID = '#AEBFE3'
const REDNO = '#C8322B'
const ROSE = '#B14D6A', ROSE_DK = '#8E3B54', GREEN = '#2E7D46', AMBER = '#9C6B12'

const BIZ = 'LEW Imports'
const BIZ_ADDR = '1342 51st Street, Brooklyn NY 11219'
const BIZ_TEL = '718-851-1201'
const BIZ_FAX = '718-851-0847'
const BIZ_EMAIL = 'Info@lewimports.com'
// Never print a half-known number: anything with a blank (___) is dropped from
// letterheads until the real one is filled in above.
const known = (v) => (v && !v.includes('_') ? v : '')
// One letterhead for every customer-facing document (receipt, invoice, sales order).
const bizContactLine = () => [BIZ_ADDR, known(BIZ_TEL) && `Tel ${BIZ_TEL}`, known(BIZ_FAX) && `Fax ${BIZ_FAX}`, BIZ_EMAIL].filter(Boolean).join(' &middot; ')
const letterheadHtml = (opts = {}) => `
  <div style="text-align:center;padding-bottom:${opts.tight ? 8 : 12}px;border-bottom:2px solid ${opts.color || '#2A4C9C'};margin-bottom:${opts.tight ? 10 : 14}px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:${opts.tight ? 26 : 32}px;font-weight:800;letter-spacing:3px;color:${opts.color || '#2A4C9C'};line-height:1.1;">LEW <span style="font-weight:400;font-size:${opts.tight ? 16 : 19}px;letter-spacing:1px;">IMPORTS</span></div>
    <div style="font-size:10.5px;color:#777;margin-top:4px;">${bizContactLine()}</div>
  </div>`
const METHODS = ['Cash', 'Check', 'CC Card', 'On Acct.', 'Zelle']
const DEFAULT_TAX_RATE = 8.875   // NYC rate — editable per order

// Built-in items — always available. User-added items layer on top from localStorage.
const DEFAULT_ITEMS = [
  { no: 'ALT',  desc: 'Alterations', taxable: false, alteration: true },
]

const money = (n) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = (n) => '$' + Math.round(n || 0).toLocaleString()
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }) : ''
const fmtShort = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
// Colour/weight for a due date: red if overdue, amber if within 3 days, muted otherwise.
// What we paid for the item (owner-only info) — '' / invalid → null for the DB.
const costOrNull = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null }
// Videos are stored right alongside photos; tell them apart by file extension.
const isVideo = (url) => /\.(mp4|mov|m4v|webm|3gp|avi)(\?|$)/i.test(url || '')
// Safari reports a dropped connection as "TypeError: Load failed" — recognize it so
// saves can retry once automatically and speak human if it still fails.
const isNetErr = (e) => /load failed|failed to fetch|network/i.test(e?.message || '')
const NET_ERR_MSG = "Couldn't reach the server — looks like a connection hiccup. Check the internet and tap Save again. Nothing you typed was lost."
const retryOnNetErr = async (run) => {
  let res = await run()
  if (res.error && isNetErr(res.error)) {
    await new Promise(r => setTimeout(r, 1500))
    res = await run()
  }
  return res
}
const dueTone = (due, done) => {
  if (!due || done) return { color: '#8A8A93', weight: 400 }
  const today = new Date().toISOString().slice(0, 10)
  if (due < today) return { color: '#C0504C', weight: 700, overdue: true }
  const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + 3)
  if (due <= d.toISOString().slice(0, 10)) return { color: '#9C6B12', weight: 700, soon: true }
  return { color: '#8A8A93', weight: 400 }
}
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

// Branded HTML receipt emailed to the customer.
const buildReceiptHtml = (o) => {
  const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, paid = sumPaid(o), bal = tot - paid
  const cust = `${o.firstName || ''} ${o.lastName || ''}`.trim()
  const itemRows = (o.items || []).filter(it => it.desc?.trim() || lineAmt(it) || it.itemNo).map(it => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:14px;">${(parseFloat(it.qty) || 1) > 1 ? it.qty + '× ' : ''}${it.desc?.trim() || it.itemNo || ''}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">${lineAmt(it) ? money(lineAmt(it)) : ''}</td>
    </tr>`).join('')
  const payRows = (o.payments || []).map(p => `<div style="font-size:13px;color:#2E7D46;">✓ ${money(p.amount)}${p.method ? ' · ' + p.method : ''}${p.method === 'Check' && p.checkNo ? ' #' + p.checkNo : ''}${p.date ? ' · ' + fmtDate(p.date) : ''}</div>`).join('')
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#23262E;">
    ${letterheadHtml()}
    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:14px;">
      <div><b>Receipt</b><br>${cust}</div>
      <div style="text-align:right;color:#555;">No. ${o.orderNo || ''}<br>${fmtDate(o.date)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${itemRows}</table>
    <div style="border-top:1px solid #ddd;padding-top:10px;font-size:14px;">
      <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${money(sub)}</span></div>
      ${tax > 0 ? `<div style="display:flex;justify-content:space-between;color:#777;"><span>Tax (${o.taxRate || 0}%)</span><span>${money(tax)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:17px;margin-top:6px;"><span>Total</span><span>${money(tot)}</span></div>
    </div>
    ${payRows ? `<div style="margin-top:12px;">${payRows}</div>` : ''}
    <div style="margin-top:10px;font-size:15px;font-weight:700;color:${bal > 0.005 ? '#9C6B12' : '#2E7D46'};">
      ${bal > 0.005 ? 'Balance due: ' + money(bal) : 'Paid in full ✓'}
    </div>
    <div style="margin-top:22px;font-size:13px;color:#888;text-align:center;">Thank you! — ${BIZ}</div>
  </div>`
}

// Open-work list, shared by the Tasks print button and the daily owner email.
const buildTaskListHtml = (rows) => {
  if (!rows.length) return '<div style="font-size:15px;color:#2E7D46;">Nothing open — all caught up ✓</div>'
  const today = new Date().toISOString().slice(0, 10)
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <tr style="background:#F0F4FF;">
      <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Due</th>
      <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">What's needed</th>
      <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Who</th>
      <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Order</th>
    </tr>
    ${rows.map(t => {
      const late = t.date && t.date < today
      return `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:7px 8px;white-space:nowrap;color:${late ? '#C0504C' : '#666'};font-weight:${late ? 700 : 400};">${t.date ? (late ? '⚠ ' : '') + fmtShort(t.date) : '—'}</td>
        <td style="padding:7px 8px;">${t.garment ? `<b>${t.garment}</b> — ` : ''}${t.text}${t.hours ? ` <span style="color:#888;">(${t.hours}h)</span>` : ''}</td>
        <td style="padding:7px 8px;color:#666;">${t.assignedTo || 'unassigned'}</td>
        <td style="padding:7px 8px;white-space:nowrap;"><span style="color:#C8322B;font-weight:600;">${t.orderNo != null ? 'No. ' + t.orderNo : 'General'}</span>${t.customerName ? ` <span style="color:#666;">${t.customerName}</span>` : ''}</td>
      </tr>`
    }).join('')}
  </table>`
}

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
// An order with nothing billed yet (just a name) is still open — never "completed".
const isOpen = (o) => orderTotal(o) <= 0.005 || balanceOf(o) > 0.005 || (o.alterationsList || []).some(a => !a.done)

// backward-compat: old orders have a single `name` field
// Lists and search read "Augenbaum, Zlaty" — she looks people up by last name.
const fullName = (o) => {
  const f = (o.firstName || '').trim(), l = (o.lastName || '').trim()
  if (l && f) return `${l}, ${f}`
  return l || f || (o.name || '')
}
// Natural order, for receipts and letters addressed to the customer.
const fullNameNatural = (o) => (o.firstName ? `${o.firstName} ${o.lastName || ''}`.trim() : (o.name || ''))
const lastFirstKey = (o) => `${(o.lastName || '').trim()} ${(o.firstName || '').trim()}`.trim().toLowerCase()

// Role by login. Seamstress gets the workroom view; everyone else is owner/admin.
const roleOf = (u) => ((u?.email || '').toLowerCase() === 'seamstress@lewimports.com' ? 'seamstress' : 'owner')

// ── Supabase row converters ──────────────────────────────────────────────────
const toDB = (o, userId) => ({
  id: o.id, user_id: userId, order_no: o.orderNo || null,
  first_name: o.firstName || '', last_name: o.lastName || '',
  phone: o.phone || '', email: o.email || '', home_phone: o.home || '',
  address: o.address || '', city: o.city || '',
  state: o.state || 'NY', zip: o.zip || '',
  order_date: o.date || todayStr(),
  items: o.items || [], payments: o.payments || [],
  alterations: (o.alterationsList || []).length > 0,
  alterations_list: o.alterationsList || [],
  // legacy single columns kept in rough sync (first entry) for backward-compat
  alterations_done: (o.alterationsList || []).length ? (o.alterationsList || []).every(a => a.done) : false,
  alterations_note: (o.alterationsList || [])[0]?.note || '',
  alterations_assignee: (o.alterationsList || [])[0]?.assignee || '',
  alterations_due: (o.alterationsList || [])[0]?.due || null,
  notes: o.notes || '', tax_rate: o.taxRate || DEFAULT_TAX_RATE,
  follow_up_date: o.followUpDate || null, todos: o.todos || [],
  sales_order: o.salesOrder || {},
  photos: o.photos || [],
  order_kind: o.orderKind === 'stock' ? 'stock' : 'customer',
  saved_at: new Date().toISOString(),
})
const fromDB = (r) => ({
  id: r.id, orderNo: r.order_no,
  firstName: r.first_name, lastName: r.last_name,
  name: `${r.first_name} ${r.last_name}`.trim(),
  phone: r.phone, email: r.email || '', home: r.home_phone || '',
  address: r.address, city: r.city, state: r.state, zip: r.zip,
  date: r.order_date, items: r.items || [],
  // Older payments were saved with method 'Card' before the rename to 'CC Card'.
  payments: (r.payments || []).map(p => p.method === 'Card' ? { ...p, method: 'CC Card' } : p),
  alterations: r.alterations,
  alterationsList: (Array.isArray(r.alterations_list) && r.alterations_list.length)
    ? r.alterations_list
    : (r.alterations ? [{ id: uid(), garment: '', note: r.alterations_note || '', assignee: r.alterations_assignee || '', hours: '', due: r.alterations_due || '', done: !!r.alterations_done }] : []),
  notes: r.notes, taxRate: r.tax_rate,
  followUpDate: r.follow_up_date, todos: r.todos || [],
  salesOrder: r.sales_order || {},
  photos: r.photos || [],
  orderKind: r.order_kind === 'stock' ? 'stock' : 'customer',
  savedAt: new Date(r.saved_at).getTime(),
})

const blankRow = () => ({ id: uid(), qty: '1', itemNo: '', desc: '', price: '', taxable: true })
const blankForm = () => ({
  id: uid(), orderNo: null,
  firstName: '', lastName: '',
  phone: '', email: '', home: '', address: '', city: '', state: 'NY', zip: '',
  date: todayStr(),
  items: [blankRow(), blankRow(), blankRow()],
  payments: [], alterations: false, alterationsList: [], notes: '',
  todos: [], taxRate: DEFAULT_TAX_RATE, salesOrder: {}, photos: [],
  orderKind: 'customer',   // 'customer' = a sales order for a person; 'stock' = buying gowns for the shop
})

export default function Gowns() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  // /login already asked for the email; carry it over so it is typed once.
  const [loginEmail, setLoginEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('email') || ''
  })
  const [loginPass, setLoginPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  const [role, setRole] = useState('owner')
  const [workView, setWorkView] = useState('current')
  const [orders, setOrders] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ text: '', assignee: '', date: '', orderId: '' })
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('open')
  const [form, setForm] = useState(blankForm())
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [pay, setPay] = useState({ amount: '', method: '', date: todayStr(), checkNo: '' })
  const [suggest, setSuggest] = useState(null)
  const [catalog, setCatalog] = useState(DEFAULT_ITEMS)
  const [newItem, setNewItem] = useState(null)
  const [newCatalogItem, setNewCatalogItem] = useState({ no: '', desc: '', taxable: true, alteration: false, cost: '', company: '' })
  const [showSales, setShowSales] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const [todoInput, setTodoInput] = useState({})
  const [formTodo, setFormTodo] = useState({ text: '', assignee: '', date: '' })
  const [todoView, setTodoView] = useState('person')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loaded, setLoaded] = useState(false)

  // ── auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setUser(data.session.user); setRole(roleOf(data.session.user)); loadData(data.session.user) }
      setAuthLoading(false)
    })
    const { data: l } = supabase.auth.onAuthStateChange((_, s) => {
      if (!s) { setUser(null); setRole('owner'); setOrders([]); setTasks([]); setCatalog(DEFAULT_ITEMS) }
    })
    return () => l.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setRole('owner'); setOrders([]); setTasks([]); setCatalog(DEFAULT_ITEMS)
    setView('list'); setLoginEmail(''); setLoginPass('')
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginErr(''); setLoginBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass })
    if (error) { setLoginErr(error.message); setLoginBusy(false); return }
    setUser(data.user); setRole(roleOf(data.user))
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
    const customItems = (catRows || []).map(r => ({ no: r.item_no, desc: r.description, taxable: r.taxable, alteration: r.alteration, cost: r.cost ?? '', lastPrice: r.last_price ?? null, company: r.company || '' }))
    // Built-ins can still carry a saved cost/description from the DB — merge the DB row over the default.
    setCatalog([
      ...DEFAULT_ITEMS.map(d => { const r = customItems.find(c => c.no === d.no); return r ? { ...d, cost: r.cost, lastPrice: r.lastPrice, desc: r.desc || d.desc } : d }),
      ...customItems.filter(c => !DEFAULT_ITEMS.find(d => d.no === c.no)),
    ])
    setLoaded(true)
  }, [])

  const subtotal = sumItems(form.items)
  const taxAmount = calcTax(form.items, form.taxRate)
  const total = subtotal + taxAmount
  const paid = sumPaid(form)
  const balance = total - paid

  const startNew = () => {
    setForm(blankForm())
    setPay({ amount: '', method: '', date: todayStr() }); setFormTodo({ text: '', assignee: '', date: '' })
    setEditing(false); setView('form'); window.scrollTo(0, 0)
  }
  const openOrder = (o) => {
    const items = (o.items && o.items.length ? o.items : [blankRow()]).map(it => ({ taxable: true, qty: '1', ...it, price: it.price || String(it.amount || '') }))
    // migrate old single `name` field to firstName/lastName
    const firstName = o.firstName || (o.name ? o.name.split(' ')[0] : '')
    const lastName = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
    setForm({ ...blankForm(), ...o, firstName, lastName, items, payments: o.payments || [], taxRate: o.taxRate ?? DEFAULT_TAX_RATE })
    setPay({ amount: '', method: '', date: todayStr() }); setFormTodo({ text: '', assignee: '', date: '' }); setEditing(true); setView('form'); window.scrollTo(0, 0)
  }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSales = (k, v) => setForm(f => ({ ...f, salesOrder: { ...(f.salesOrder || {}), [k]: v } }))
  const soLbl = { fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '4px' }

  // ── Photo upload (Supabase Storage) ──
  // Thumbnail that handles both photos and videos (videos get a ▶ badge; tap opens the lightbox).
  const mediaThumb = (url, px, radius = 8) => isVideo(url)
    ? (
      <span onClick={(e) => { e.stopPropagation(); setLightbox(url) }} style={{ position: 'relative', width: px, height: px, flexShrink: 0, display: 'block', cursor: 'zoom-in' }}>
        <video src={url} preload="metadata" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius, border: `1px solid ${GRID}`, display: 'block', background: '#000' }} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: Math.max(14, Math.round(px / 3)), textShadow: '0 1px 4px rgba(0,0,0,0.65)', pointerEvents: 'none' }}>▶</span>
      </span>
    )
    : <img src={url} alt="" onClick={(e) => { e.stopPropagation(); setLightbox(url) }} style={{ width: px, height: px, objectFit: 'cover', borderRadius: radius, flexShrink: 0, border: `1px solid ${GRID}`, cursor: 'zoom-in', display: 'block' }} />
  const uploadPhoto = async (file) => {
    if (!file) return null
    if (file.size > 50 * 1024 * 1024) { alert('That file is too big (over 50MB). For videos, keep clips short — under a minute or so.'); return null }
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `${form.id || 'misc'}/${uid()}.${ext}`
      const { error } = await supabase.storage.from('gown-photos').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) { alert('Photo upload failed: ' + error.message); return null }
      const { data } = supabase.storage.from('gown-photos').getPublicUrl(path)
      return { path, url: data.publicUrl }
    } catch (e) { alert('Photo upload failed: ' + e.message); return null }
    finally { setUploading(false) }
  }
  // Reusable thumbnail strip + add-photo button. `onChange` receives the new photo array.
  const photoStrip = (photos, onChange) => (
    <div>
      {(photos || []).length > 0 && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {(photos || []).map(p => (
            <div key={p.path} style={{ position: 'relative', width: '72px' }}>
              {mediaThumb(p.url, 72)}
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange((photos || []).filter(x => x.path !== p.path)) }} title="Remove photo"
                style={{ position: 'absolute', top: '-9px', right: '-9px', width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff', background: '#C0504C', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', lineHeight: 1, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>×</button>
            </div>
          ))}
        </div>
      )}
      <label className="gw-press" style={{ display: 'inline-block', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: PAD, background: '#F6F9FE', border: `1.5px solid ${PAD}`, borderRadius: '10px', cursor: uploading ? 'wait' : 'pointer' }}>
        {uploading ? 'Uploading…' : '📷 Add photo / video'}
        <input type="file" accept="image/*,video/*" disabled={uploading} style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; const ph = await uploadPhoto(f); if (ph) onChange([...(photos || []), ph]) }} />
      </label>
    </div>
  )
  const setItem = (id, k, v) => setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [k]: v } : it) }))
  const onItemNo = (id, val) => {
    setItem(id, 'itemNo', val)
    // Keep the dropdown open even when empty — it doubles as a company → gown browser.
    setSuggest(s => ({ id, query: val.trim(), company: s && s.id === id ? s.company : null }))
  }
  const pickItem = (rowId, item) => {
    // Prefill the line's price with the last price charged, and the company from the catalog.
    setForm(f => ({ ...f, items: f.items.map(it => it.id === rowId ? { ...it, itemNo: item.no, desc: item.desc, taxable: item.taxable !== false, company: item.company || it.company || '', price: it.price || (item.lastPrice != null ? String(item.lastPrice) : '') } : it), ...(item.alteration ? { alterations: true, alterationsList: (f.alterationsList?.length ? f.alterationsList : [{ id: uid(), garment: '', note: '', assignee: '', hours: '', due: '', done: false }]) } : {}) }))
    setSuggest(null)
  }
  const saveNewItem = async () => {
    if (!newItem || !newItem.no.trim()) { alert('Enter an item #.'); return }
    const item = { no: newItem.no.trim().toUpperCase(), desc: newItem.desc.trim(), taxable: newItem.taxable, alteration: newItem.alteration, cost: newItem.cost, company: (newItem.company || '').trim() }
    const { error } = await supabase.from('gown_catalog').upsert({ user_id: user.id, item_no: item.no, description: item.desc, taxable: item.taxable, alteration: item.alteration, cost: costOrNull(item.cost), company: item.company || null }, { onConflict: 'user_id,item_no' })
    if (error) { alert('Could not save item: ' + error.message); return }
    setCatalog(prev => [...prev.filter(c => c.no !== item.no), item])
    pickItem(newItem.rowId, item)
    setNewItem(null)
  }

  // ── Catalog management (Catalog tab) ──
  const isBuiltIn = (no) => DEFAULT_ITEMS.some(d => d.no === no)
  const saveCatalogItem = async (item) => {
    const { error } = await supabase.from('gown_catalog').upsert({ user_id: user.id, item_no: item.no, description: item.desc, taxable: item.taxable !== false, alteration: !!item.alteration, cost: costOrNull(item.cost), company: (item.company || '').trim() || null }, { onConflict: 'user_id,item_no' })
    if (error) { alert('Could not save item: ' + error.message); return false }
    return true
  }
  const addCatalogItem = async () => {
    const no = (newCatalogItem.no || '').trim().toUpperCase()
    if (!no) { alert('Enter an item #.'); return }
    if (catalog.some(c => c.no === no)) { alert(`Item ${no} already exists.`); return }
    const item = { no, desc: newCatalogItem.desc.trim(), taxable: newCatalogItem.taxable, alteration: newCatalogItem.alteration, cost: newCatalogItem.cost, company: (newCatalogItem.company || '').trim() }
    if (!(await saveCatalogItem(item))) return
    setCatalog(prev => [...prev, item])
    setNewCatalogItem({ no: '', desc: '', taxable: true, alteration: false, cost: '', company: newCatalogItem.company })
  }
  const updateCatalogItem = async (no, patch) => {
    const current = catalog.find(c => c.no === no); if (!current) return
    const item = { ...current, ...patch }
    setCatalog(prev => prev.map(c => c.no === no ? item : c))
    await saveCatalogItem(item)
  }
  const deleteCatalogItem = async (no, desc) => {
    if (!window.confirm(`Delete "${no}${desc ? ' — ' + desc : ''}" from the catalog? This can't be undone.`)) return
    setCatalog(prev => prev.filter(c => c.no !== no))
    await supabase.from('gown_catalog').delete().eq('user_id', user.id).eq('item_no', no)
  }
  const renderCatalogRow = (item) => {
    const builtIn = isBuiltIn(item.no)
    return (
      <div key={item.no} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', borderBottom: `1px solid ${CREAM}` }}>
        <span style={{ width: '80px', flexShrink: 0, fontSize: '15px', fontWeight: 700, color: PAD, letterSpacing: '0.02em' }}>{item.no}</span>
        {builtIn
          ? <span style={{ flex: 1, fontSize: '14px', color: INK }}>{item.desc}</span>
          : <input value={item.desc} onChange={e => setCatalog(prev => prev.map(c => c.no === item.no ? { ...c, desc: e.target.value } : c))} onBlur={e => updateCatalogItem(item.no, { desc: e.target.value })} style={{ flex: 1, minWidth: '110px', fontSize: '14px', border: '1px solid #EDE6E0', borderRadius: '6px', padding: '5px 7px', fontFamily: 'inherit', color: INK, outline: 'none', background: '#FAF8F5' }} />}
        <input value={item.company || ''} title="Company (type to move this gown to another company)" list="gown-companies" placeholder="Company" onChange={e => setCatalog(prev => prev.map(c => c.no === item.no ? { ...c, company: e.target.value } : c))} onBlur={e => updateCatalogItem(item.no, { company: e.target.value })} style={{ width: '92px', flexShrink: 0, fontSize: '13px', border: '1px solid #EDE6E0', borderRadius: '6px', padding: '5px 7px', fontFamily: 'inherit', color: INK, outline: 'none', background: '#FAF8F5' }} />
        <input value={item.cost ?? ''} title="Cost (what you paid)" onChange={e => setCatalog(prev => prev.map(c => c.no === item.no ? { ...c, cost: e.target.value } : c))} onBlur={e => updateCatalogItem(item.no, { cost: e.target.value })} type="text" inputMode="decimal" placeholder="Cost $" style={{ width: '68px', flexShrink: 0, fontSize: '13px', textAlign: 'right', border: '1px solid #EDE6E0', borderRadius: '6px', padding: '5px 7px', fontFamily: 'inherit', fontWeight: 600, color: INK, outline: 'none', background: '#FAF8F5' }} />
        <span title="Last price charged to a customer (updates automatically from orders)" style={{ width: '58px', flexShrink: 0, fontSize: '11px', color: item.lastPrice != null ? GREEN : '#C9BFB9', textAlign: 'right', lineHeight: 1.2 }}>
          {item.lastPrice != null ? <>last<br /><b>{money(item.lastPrice)}</b></> : 'no sales'}
        </span>
        <label title="Taxable" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: MUTED, cursor: builtIn ? 'default' : 'pointer' }}>
          <input type="checkbox" disabled={builtIn} checked={item.taxable !== false} onChange={e => updateCatalogItem(item.no, { taxable: e.target.checked })} style={{ accentColor: PAD }} /> Tax
        </label>
        <label title="Alteration" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: MUTED, cursor: builtIn ? 'default' : 'pointer' }}>
          <input type="checkbox" disabled={builtIn} checked={!!item.alteration} onChange={e => updateCatalogItem(item.no, { alteration: e.target.checked, taxable: e.target.checked ? false : item.taxable })} style={{ accentColor: ROSE }} /> Alt
        </label>
        {builtIn
          ? <span style={{ width: '58px', flexShrink: 0, fontSize: '10px', color: MUTED, textAlign: 'center' }} title="Built-in item — can't be deleted">built-in</span>
          : <button onClick={() => deleteCatalogItem(item.no, item.desc)} className="gw-press" title="Delete item" style={{ width: '58px', flexShrink: 0, border: '1.5px solid #E3B7B7', background: '#FCF1F1', color: '#C0504C', fontSize: '12px', fontWeight: 700, padding: '5px 0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
      </div>
    )
  }

  const addRow = () => setForm(f => ({ ...f, items: [...f.items, blankRow()] }))
  const removeRow = (id) => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter(it => it.id !== id) : f.items }))

  const addPayment = (amt) => {
    const a = parseFloat(amt != null ? amt : pay.amount)
    if (!a || a <= 0) { alert('Enter a payment amount.'); return }
    if (!pay.method) { alert('Choose a payment type (Cash, Check, Card…).'); return }
    setForm(f => ({ ...f, payments: [...(f.payments || []), { id: uid(), amount: a, method: pay.method, date: pay.date || todayStr(), checkNo: pay.method === 'Check' ? (pay.checkNo || '').trim() : '' }] }))
    setPay({ amount: '', method: '', date: todayStr(), checkNo: '' })
  }
  // Clear the check # if the method is changed away from Check
  const setPaymentMethod = (id, method) => setForm(f => ({ ...f, payments: f.payments.map(p => p.id === id ? { ...p, method, checkNo: method === 'Check' ? (p.checkNo || '') : '' } : p) }))
  const setPaymentCheckNo = (id, checkNo) => setForm(f => ({ ...f, payments: f.payments.map(p => p.id === id ? { ...p, checkNo } : p) }))

  // Multiple alterations per order
  const addAlteration = () => setForm(f => ({ ...f, alterations: true, alterationsList: [...(f.alterationsList || []), { id: uid(), garment: '', note: '', assignee: '', hours: '', due: '', done: false }] }))
  const setAlterationField = (id, k, v) => setForm(f => ({ ...f, alterationsList: (f.alterationsList || []).map(a => a.id === id ? { ...a, [k]: v } : a) }))
  const removeAlteration = (id) => setForm(f => { const list = (f.alterationsList || []).filter(a => a.id !== id); return { ...f, alterationsList: list, alterations: list.length > 0 } })
  const removePayment = (id) => setForm(f => ({ ...f, payments: f.payments.filter(p => p.id !== id) }))

  const save = async (stay = false) => {
    // Required: first name, last name, cell. Everything else (address, email, home) is optional.
    if (!form.firstName.trim()) { alert('Please enter a first name.'); return null }
    if (!form.lastName.trim()) { alert('Please enter a last name.'); return null }
    if (!form.phone.trim()) { alert('Please enter a cell number.'); return null }
    const typedNo = String(form.orderNo ?? '').trim()
    const orderNo = typedNo
      ? parseInt(typedNo, 10)
      : (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
    // Warn (but don't block) if this invoice number is already used by another order
    if (typedNo && orders.some(o => o.id !== form.id && o.orderNo === orderNo)) {
      if (!window.confirm(`Invoice No. ${orderNo} is already used by another order. Save anyway?`)) return null
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
    const { data, error } = await retryOnNetErr(() => supabase.from('gown_orders').upsert(toDB(clean, user.id)).select().single())
    if (error) {
      alert(isNetErr(error) ? NET_ERR_MSG : 'Error saving: ' + error.message)
      return null
    }
    // The catalog "catches" any item # typed on the order that it doesn't know yet —
    // no need to tap the dropdown; just type the item and save. It also remembers
    // the last price charged for every item on the order (auto, nothing to type).
    const lastPriceOf = {}
    for (const it of items) {
      const no = (it.itemNo || '').trim().toUpperCase()
      const p = parseFloat(it.price)
      if (no && Number.isFinite(p) && p > 0) lastPriceOf[no] = p
    }
    const known = new Set(catalog.map(c => c.no.toUpperCase()))
    const caught = []
    for (const it of items) {
      const no = (it.itemNo || '').trim().toUpperCase()
      if (!no || known.has(no)) continue
      known.add(no)
      caught.push({ no, desc: (it.desc || '').trim(), taxable: it.taxable !== false, alteration: false, cost: '', lastPrice: lastPriceOf[no] ?? null })
    }
    if (caught.length) {
      supabase.from('gown_catalog')
        .upsert(caught.map(c => ({ user_id: user.id, item_no: c.no, description: c.desc, taxable: c.taxable, alteration: c.alteration, last_price: c.lastPrice })), { onConflict: 'user_id,item_no' })
        .then(({ error: catErr }) => { if (!catErr) setCatalog(prev => [...prev, ...caught.filter(c => !prev.some(p => p.no === c.no))]) })
    }
    const repriced = Object.keys(lastPriceOf).filter(no => !caught.some(c => c.no === no))
    if (repriced.length) {
      const rows = repriced.map(no => {
        const c = catalog.find(x => x.no.toUpperCase() === no)
        return { user_id: user.id, item_no: no, description: c?.desc || '', taxable: c ? c.taxable !== false : true, alteration: !!c?.alteration, cost: costOrNull(c?.cost), last_price: lastPriceOf[no] }
      })
      supabase.from('gown_catalog').upsert(rows, { onConflict: 'user_id,item_no' })
        .then(({ error: lpErr }) => { if (!lpErr) setCatalog(prev => prev.map(c => repriced.includes(c.no.toUpperCase()) ? { ...c, lastPrice: lastPriceOf[c.no.toUpperCase()] } : c)) })
    }
    const saved = fromDB(data)
    setOrders(prev => prev.some(o => o.id === clean.id) ? prev.map(o => o.id === clean.id ? saved : o) : [saved, ...prev])
    if (stay) {
      // Keep her on the form; reflect the assigned order # and switch to edit mode.
      setForm(f => ({ ...f, id: saved.id, orderNo: saved.orderNo }))
      setEditing(true)
      setJustSaved(true); setTimeout(() => setJustSaved(false), 1800)
    } else {
      setView('list'); window.scrollTo(0, 0)
    }
    return saved
  }
  const printReceipt = (o) => {
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Receipt${o.orderNo ? ' No. ' + o.orderNo : ''}</title><style>*{box-sizing:border-box}@media print{body{margin:0}}</style></head><body style="padding:24px;">${buildReceiptHtml(o)}</body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 400)
  }
  // copyToOwner: also send the shop its own copy (BIZ_EMAIL).
  const emailReceipt = async (copyToOwner = false) => {
    if (!copyToOwner && !form.email?.trim()) { alert("Add the customer's email to the order first (the Email field), then try again."); return }
    const saved = await save(true)   // persist + get assigned order #
    if (!saved) return
    const to = [saved.email?.trim(), copyToOwner ? BIZ_EMAIL : null].filter(Boolean).join(', ')
    if (!to) { alert('No email address to send to.'); return }
    setEmailing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ to, subject: `Your receipt — ${BIZ} · No. ${saved.orderNo}`, html: buildReceiptHtml(saved) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { alert('Could not send receipt: ' + (j.error || res.status)); return }
      alert('Receipt emailed to ' + to + ' ✓')
    } catch (e) {
      alert('Could not send receipt: ' + e.message)
    } finally {
      setEmailing(false)
    }
  }
  // Seamstress save: create a new order (customer + alterations, no pricing) or
  // just persist alteration edits on an existing order. Flows to the owner either way.
  const saveSeamstressOrder = async () => {
    if (!editing) {
      if (!form.firstName.trim()) { alert('Please enter a first name.'); return }
      if (!form.phone.trim()) { alert('Please enter a cell number.'); return }
      const orderNo = form.orderNo || (orders.reduce((m, o) => Math.max(m, o.orderNo || 0), 1000) + 1)
      const fn = titleCase(form.firstName), ln = titleCase(form.lastName)
      const clean = {
        ...form, orderNo,
        firstName: fn, lastName: ln, name: `${fn} ${ln}`.trim(),
        phone: fmtPhone(form.phone), home: fmtPhone(form.home), email: cleanEmail(form.email),
        address: titleCase(form.address), city: titleCase(form.city), state: cleanState(form.state), zip: cleanZip(form.zip),
      }
      const { data, error } = await retryOnNetErr(() => supabase.from('gown_orders').upsert(toDB(clean, user.id)).select().single())
      if (error) { alert(isNetErr(error) ? NET_ERR_MSG : 'Error saving: ' + error.message); return }
      const saved = fromDB(data)
      setOrders(prev => [saved, ...prev.filter(o => o.id !== saved.id)])
      setForm(f => ({ ...f, id: saved.id, orderNo: saved.orderNo })); setEditing(true)
    } else {
      await patchOrder(form.id, { alterationsList: form.alterationsList, photos: form.photos })
    }
    setJustSaved(true); setTimeout(() => setJustSaved(false), 1800)
  }
  const del = async (id) => {
    if (window.confirm('Delete this order?')) {
      await supabase.from('gown_orders').delete().eq('id', id)
      setOrders(prev => prev.filter(o => o.id !== id)); setView('list')
    }
  }

  // Printed invoice = the on-screen order pad, one per page, for the binder.
  const printOrders = (ordersToPrint) => {
    const PAD_BLUE = '#2A4C9C', GRID_BLUE = '#AEBFE3', RED_NO = '#C8322B'
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const L = `font-size:9px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${PAD_BLUE};`
    const rows = ordersToPrint.map(o => {
      const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
      const isStock = o.orderKind === 'stock'
      const live = (o.items || []).filter(it => it.desc?.trim() || lineAmt(it) || it.itemNo)
      const itemLines = live.map((it, i) => {
        const extra = [it.company ? esc(it.company) : '', it.source === 'Stock' ? 'In stock' : it.source === 'Order' ? 'To order' : '']
          .filter(Boolean).join(' &middot; ')
        return `
        <tr>
          <td style="width:26px;text-align:center;padding:9px 4px;border-right:1px solid ${GRID_BLUE};color:${PAD_BLUE};font-size:11px;font-weight:600;">${i + 1}</td>
          <td style="width:40px;padding:9px 4px;border-right:1px solid ${GRID_BLUE};text-align:center;font-size:15px;">${(parseFloat(it.qty) || 1)}</td>
          <td style="width:72px;padding:9px 8px;border-right:1px solid ${GRID_BLUE};font-size:15px;font-weight:700;color:${PAD_BLUE};letter-spacing:0.03em;">${esc(it.itemNo || '')}</td>
          <td style="padding:9px 10px;border-right:1px solid ${GRID_BLUE};font-size:15px;">${esc(it.desc || '')}${extra ? `<div style="font-size:11px;color:#777;margin-top:2px;">${extra}</div>` : ''}</td>
          <td style="width:78px;padding:9px 8px;border-right:1px solid ${GRID_BLUE};text-align:right;font-size:15px;font-weight:600;">${it.price ? money(parseFloat(it.price)) : ''}</td>
          <td style="width:78px;padding:9px 8px;border-right:1px solid ${GRID_BLUE};text-align:right;font-size:15px;font-weight:600;">${lineAmt(it) ? money(lineAmt(it)) : ''}</td>
          <td style="width:34px;padding:9px 4px;text-align:center;font-size:13px;color:#666;">${it.taxable === false ? '' : '&#10003;'}</td>
        </tr>`
      }).join('')
      // blank filler rows so a short order still looks like the pad
      const fillerCount = Math.max(0, 6 - live.length)
      const fillerRows = Array(fillerCount).fill(
        `<tr>${Array(6).fill(`<td style="border-right:1px solid ${GRID_BLUE};padding:9px 6px;">&nbsp;</td>`).join('')}<td style="padding:9px 6px;">&nbsp;</td></tr>`
      ).join('')
      const payLines = (o.payments || []).map(pmt => `<div style="font-size:12px;color:#2E7D46;margin-top:3px;">&#10003; ${money(pmt.amount)}${pmt.method ? ' &middot; ' + esc(pmt.method) : ''}${pmt.method === 'Check' && pmt.checkNo ? ' #' + esc(pmt.checkNo) : ''}${pmt.date ? ' &middot; ' + fmtDate(pmt.date) : ''}</div>`).join('')
      // alterations grouped by garment, exactly like the screen
      const groups = {}
      ;(o.alterationsList || []).forEach(a => { const g = (a.garment || '').trim() || 'Gown'; (groups[g] = groups[g] || []).push(a) })
      const altBlock = Object.keys(groups).length ? `
        <div style="padding:10px 14px;background:#FBEAF0;border-bottom:1px solid ${GRID_BLUE};">
          <div style="${L}color:#8E3B54;margin-bottom:6px;">Alterations</div>
          ${Object.entries(groups).map(([garment, alts]) => `
            <div style="margin-bottom:7px;">
              <div style="font-size:13px;font-weight:800;color:#1B1815;">${esc(garment)}</div>
              ${alts.map(a => {
                const meta = [a.assignee ? esc(a.assignee) : '', a.hours ? esc(a.hours) + 'h' : '', a.due ? 'due ' + fmtDate(a.due) : ''].filter(Boolean).join(' &middot; ')
                return `<div style="font-size:13px;margin-top:2px;padding-left:10px;"><span style="color:#8E3B54;font-weight:600;">${a.done ? '&#10003; ' : '&#9744; '}${esc(a.note || 'Alteration')}</span>${meta ? `<span style="color:#777;"> &mdash; ${meta}</span>` : ''}</div>`
              }).join('')}
            </div>`).join('')}
        </div>` : ''
      const openTodos = (o.todos || []).filter(t => !t.done)
      const todoBlock = openTodos.length ? `
        <div style="padding:10px 14px;border-bottom:1px solid ${GRID_BLUE};">
          <div style="${L}margin-bottom:5px;">To do</div>
          ${openTodos.map(t => `<div style="font-size:13px;margin-top:2px;">&#9744; ${esc(t.text)}${t.assignedTo ? ` <span style="color:#777;">&mdash; ${esc(t.assignedTo)}</span>` : ''}${t.date ? ` <span style="color:#777;">&middot; ${fmtDate(t.date)}</span>` : ''}</div>`).join('')}
        </div>` : ''
      const row = (label, value, width) => `
        <div style="display:flex;align-items:center;padding:5px 12px;">
          <span style="${L}width:${width || 58}px;flex-shrink:0;">${label}</span>
          <span style="font-size:15px;flex:1;">${esc(value || '')}</span>
        </div>`
      return `
        <div style="page-break-after:always;padding:22px 26px;font-family:Arial,Helvetica,sans-serif;width:100%;">
          <div style="border:2px solid ${PAD_BLUE};border-radius:6px;overflow:hidden;">

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid ${GRID_BLUE};background:#F6F9FE;">
              <div>
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:800;letter-spacing:2px;color:${PAD_BLUE};line-height:1.1;">LEW <span style="font-weight:400;font-size:15px;letter-spacing:1px;">IMPORTS</span></div>
                <div style="font-size:9.5px;color:#888;margin-top:3px;">${bizContactLine()}</div>
              </div>
              <div style="text-align:right;">
                ${isStock ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${PAD_BLUE};border:1px solid ${PAD_BLUE};border-radius:3px;padding:1px 6px;display:inline-block;margin-bottom:3px;">Stock order</div>` : ''}
                <div style="font-size:26px;font-weight:800;color:${RED_NO};">No. ${o.orderNo || '&mdash;'}</div>
              </div>
            </div>

            <div style="border-bottom:1px solid ${GRID_BLUE};">${row('Date', fmtDate(o.date))}</div>

            <div style="display:flex;border-bottom:1px solid ${GRID_BLUE};">
              <div style="flex:1;border-right:1px solid ${GRID_BLUE};">${row('First', o.firstName)}</div>
              <div style="flex:1;">${row('Last', o.lastName, 48)}</div>
            </div>

            <div style="border-bottom:1px solid ${GRID_BLUE};">${row('Cell', o.phone)}</div>
            <div style="border-bottom:1px solid ${GRID_BLUE};">${row('Home', o.home)}</div>
            <div style="border-bottom:1px solid ${GRID_BLUE};">${row('Email', o.email)}</div>
            <div style="border-bottom:1px solid ${GRID_BLUE};">${row('Address', o.address)}</div>
            <div style="display:flex;border-bottom:2px solid ${PAD_BLUE};">
              <div style="flex:2;border-right:1px solid ${GRID_BLUE};">${row('City', o.city, 30)}</div>
              <div style="flex:1;border-right:1px solid ${GRID_BLUE};">${row('State', o.state, 36)}</div>
              <div style="flex:1;">${row('Zip', o.zip, 26)}</div>
            </div>

            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#EAF0FB;">
                  <th style="width:26px;padding:7px 4px;border-right:1px solid ${GRID_BLUE};${L}text-align:center;"></th>
                  <th style="width:40px;padding:7px 4px;border-right:1px solid ${GRID_BLUE};${L}text-align:center;">Qty</th>
                  <th style="width:72px;padding:7px 8px;border-right:1px solid ${GRID_BLUE};${L}text-align:left;">Item #</th>
                  <th style="padding:7px 10px;border-right:1px solid ${GRID_BLUE};${L}text-align:left;">Description</th>
                  <th style="width:78px;padding:7px 8px;border-right:1px solid ${GRID_BLUE};${L}text-align:right;">Price</th>
                  <th style="width:78px;padding:7px 8px;border-right:1px solid ${GRID_BLUE};${L}text-align:right;">Amount</th>
                  <th style="width:34px;padding:7px 4px;${L}text-align:center;">Tax</th>
                </tr>
              </thead>
              <tbody style="border-bottom:1px solid ${GRID_BLUE};">${itemLines}${fillerRows}</tbody>
            </table>

            <div style="padding:9px 14px;display:flex;flex-direction:column;align-items:flex-end;gap:3px;border-bottom:1px solid ${GRID_BLUE};border-top:1px solid ${GRID_BLUE};">
              <div style="font-size:13px;color:#666;">Subtotal: <b style="color:#1B1815;">${money(sub)}</b></div>
              ${tax > 0 ? `<div style="font-size:13px;color:#666;">Tax (${o.taxRate || 0}%): <b style="color:#1B1815;">${money(tax)}</b></div>` : ''}
              <div style="font-size:21px;font-weight:800;color:${PAD_BLUE};margin-top:3px;">Total: ${money(tot)}</div>
            </div>

            <div style="padding:10px 14px;border-bottom:${(altBlock || todoBlock || o.notes) ? '1px solid ' + GRID_BLUE : 'none'};">
              ${payLines}
              <div style="font-size:16px;font-weight:700;margin-top:${payLines ? '7' : '0'}px;color:${bal > 0.005 ? '#9C6B12' : '#2E7D46'};">
                ${bal > 0.005 ? `Balance due: ${money(bal)}` : 'Paid in full &#10003;'}
              </div>
            </div>

            ${altBlock}${todoBlock}
            ${o.notes ? `<div style="padding:10px 14px;font-size:13px;color:#555;"><b>Notes:</b> ${esc(o.notes)}</div>` : ''}

          </div>
        </div>`
    }).join('')
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Orders</title><style>*{box-sizing:border-box}@media print{body{margin:0}}</style></head><body>${rows}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  const printSalesOrder = (o) => {
    const s = o.salesOrder || {}
    const custName = `${o.firstName || ''} ${o.lastName || ''}`.trim()
    const today = s.todayDate ? fmtDate(s.todayDate) : fmtDate(todayStr())
    const LINE = '#222'
    const fld = (label, val, opts = {}) => `<div style="display:flex;align-items:flex-end;${opts.wrap ? '' : 'flex:' + (opts.flex || 1) + ';'}${opts.style || ''}"><span style="font-size:12px;color:#000;white-space:nowrap;margin-right:5px;padding-bottom:2px;">${label}</span><span style="flex:1;border-bottom:1px solid ${LINE};min-height:19px;font-size:15px;font-weight:600;padding:0 4px 2px;">${val || ''}</span></div>`
    const box = `
      <div style="border:2px solid #000;padding:22px 26px;font-family:'Georgia',serif;max-width:760px;margin:0 auto;">
        <div style="text-align:center;font-size:34px;font-weight:800;letter-spacing:3px;font-family:'Georgia',serif;">LEW <span style="font-weight:400;font-size:20px;letter-spacing:1px;">IMPORTS</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-style:italic;color:#333;margin-top:2px;">
          <div>1342 51st Street<br>Brooklyn NY 11219</div>
          <div style="text-align:right;">${known(BIZ_TEL) ? `Telephone: ${BIZ_TEL}<br>` : ''}Fax: ${BIZ_FAX}<br>${BIZ_EMAIL}</div>
        </div>
        <div style="text-align:center;font-size:20px;font-weight:700;text-decoration:underline;margin:14px 0 16px;">Sales Order</div>

        <div style="display:flex;gap:24px;margin-bottom:6px;">
          <div style="flex:1;">${fld("Today's Date:", today)}</div>
          <div style="flex:1;">${fld('Receipt book No.:', s.receiptBookNo)}</div>
        </div>
        <div style="display:flex;gap:24px;margin-bottom:10px;">
          <div style="flex:1;">${fld('Date Requested:', s.dateRequested ? fmtDate(s.dateRequested) : '')}</div>
          <div style="flex:1;display:flex;align-items:center;font-size:13px;">Fitting: &nbsp;<span style="font-size:15px;">${s.fitting === 'yes' ? '☑' : '☐'} Yes &nbsp; ${s.fitting === 'no' ? '☑' : '☐'} No</span></div>
        </div>

        <div style="display:flex;gap:20px;margin-bottom:6px;">${fld("Customer's Name:", custName, { flex: 2 })}${fld('Tel:', o.phone, { flex: 1 })}</div>
        <div style="margin-bottom:6px;">${fld('Model Name:', s.modelName)}</div>
        <div style="display:flex;gap:20px;margin-bottom:6px;">${fld('Designer/Vendor:', s.designerVendor, { flex: 1 })}${fld('Vendor Model #:', s.vendorModelNo, { flex: 1 })}</div>
        <div style="display:flex;gap:20px;margin-bottom:6px;">${fld('Fabric:', s.fabric, { flex: 1 })}${fld('Color:', s.color, { flex: 1 })}</div>
        <div style="margin-bottom:6px;">${fld('Description:', s.description)}</div>
        <div style="margin-bottom:10px;">${fld('Note:', s.note)}</div>

        <div style="font-size:13px;font-weight:700;font-style:italic;text-decoration:underline;margin:8px 0 4px;">Size/Measurements:</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Standard:</div>
        <div style="display:flex;gap:16px;margin-bottom:10px;">${fld('Jacket Size:', s.jacketSize)}${fld('Skirt Size:', s.skirtSize)}${fld('Dress Size:', s.dressSize)}</div>

        <div style="display:flex;gap:20px;">
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Custom:</div>
            ${['Bust:|bust', 'Bust to Bust:|bustToBust', 'Waist:|waist', 'Hip- higher:|hipHigher', 'lower:|hipLower', 'Shoulder to shoulder:|shoulderToShoulder', 'Shoulder to Bust:|shoulderToBust', 'Neck to Waist:|neckToWaist', 'Length of sleeves:|sleeves', 'Muscle:|muscle', 'Length of jacket:|lengthJacket', 'Length of skirt:|lengthSkirt', 'Length of dress:|lengthDress'].map(p => { const [lab, key] = p.split('|'); return `<div style="margin-bottom:5px;">${fld(lab, s[key])}</div>` }).join('')}
          </div>
          <div style="width:230px;flex-shrink:0;align-self:flex-end;">
            <div style="border:1px solid #000;padding:12px 14px;">
              ${[['Standard Price:', s.standardPrice], ['Fabric Cost:', s.fabricCost], ['Additional:', s.additional], ['Total:', s.total]].map(([lab, val]) => `<div style="margin-bottom:10px;">${fld(lab, val)}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>`
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Sales Order</title><style>*{box-sizing:border-box}@media print{body{margin:0}}</style></head><body style="padding:24px;">${box}</body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 400)
  }
  const patchOrder = async (id, patch) => {
    const updated = orders.find(o => o.id === id); if (!updated) return
    const newOrder = { ...updated, ...patch }
    setOrders(prev => prev.map(o => o.id === id ? newOrder : o))
    const { error } = await retryOnNetErr(() => supabase.from('gown_orders').update(toDB(newOrder, user.id)).eq('id', id))
    if (error) {
      alert(isNetErr(error) ? NET_ERR_MSG : 'Could not save change: ' + error.message)
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

  // One row per line item so Excel can sort/pivot: company, item #, qty, price
  // and amount are each their own column. Order totals sit on the first row of
  // each order only, so summing a column doesn't double-count.
  const downloadCSV = (which) => {
    const list = which && which.length ? which : orders
    if (!list.length) { alert('No orders to export yet.'); return }
    const esc = (s) => { const v = String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim(); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v }
    const headers = [
      'Order #', 'Date', 'Last Name', 'First Name', 'Cell', 'Home', 'Email', 'Address', 'City', 'State', 'Zip',
      'Company', 'Item #', 'Type', 'Qty', 'Description', 'Price Each', 'Amount', 'Taxable',
      'Subtotal', 'Tax Rate', 'Tax', 'Total', 'Amount Paid', 'Balance', 'Status', 'Payments', 'Alterations', 'Notes',
    ]
    const rows = []
    for (const o of list) {
      const sub = sumItems(o.items), tax = calcTax(o.items, o.taxRate), tot = sub + tax, p = sumPaid(o), bal = tot - p
      const payHistory = (o.payments || []).map(pm => `${money(pm.amount)}${pm.method ? ' ' + pm.method : ''}${pm.method === 'Check' && pm.checkNo ? ' #' + pm.checkNo : ''}${pm.date ? ' ' + fmtDate(pm.date) : ''}`).join('; ')
      const altNote = (o.alterationsList || []).map(a => `${a.done ? 'Done' : 'Pending'}${a.garment ? ' [' + a.garment + ']' : ''}${a.note ? ': ' + a.note : ''}${a.assignee ? ' (' + a.assignee + ')' : ''}${a.hours ? ' ' + a.hours + 'h' : ''}${a.due ? ' due ' + fmtDate(a.due) : ''}`).join(' | ')
      const status = isOpen(o) ? 'Open' : 'Completed'
      const fn = o.firstName || (o.name ? o.name.split(' ')[0] : '')
      const ln = o.lastName || (o.name ? o.name.split(' ').slice(1).join(' ') : '')
      const lines = (o.items || []).filter(it => it.desc?.trim() || lineAmt(it) || it.itemNo)
      const printable = lines.length ? lines : [null]
      printable.forEach((it, idx) => {
        const first = idx === 0
        rows.push([
          o.orderNo || '', o.date || '', ln, fn, o.phone || '', o.home || '', o.email || '', o.address || '', o.city || '', o.state || '', o.zip || '',
          it ? (it.company || '') : '', it ? (it.itemNo || '') : '', it ? (it.source || '') : '',
          it ? (it.qty || '1') : '', it ? (it.desc || '') : '',
          it && it.price ? (parseFloat(it.price) || 0).toFixed(2) : '',
          it && lineAmt(it) ? lineAmt(it).toFixed(2) : '',
          it ? (it.taxable === false ? 'No' : 'Yes') : '',
          // order-level values on the first row of the order only
          first ? sub.toFixed(2) : '', first ? (o.taxRate || 0) + '%' : '', first ? tax.toFixed(2) : '',
          first ? tot.toFixed(2) : '', first ? p.toFixed(2) : '', first ? bal.toFixed(2) : '',
          first ? status : '', first ? payHistory : '', first ? altNote : '', first ? (o.notes || '') : '',
        ].map(esc).join(','))
      })
    }
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
  const filtered = (search ? orders : base)
    .filter(o => {
      if (!search) return true
      const q = search.toLowerCase()
      return fullName(o).toLowerCase().includes(q) || fullNameNatural(o).toLowerCase().includes(q)
    })
    .sort((a, b) => lastFirstKey(a).localeCompare(lastFirstKey(b)))

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
          /* Item grid keeps every column; on a phone she swipes it sideways
             rather than having Description crushed to nothing. */
          .gw-itemscroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
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
        <div className="gw-header" onClick={() => { setView('list'); setTab('open'); setSelectedCustomer(null); setSearch(''); window.scrollTo(0, 0) }} style={{ cursor: 'pointer', position: 'relative' }} title="Back to home">
          <div style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{role === 'seamstress' ? '✂ Seamstress' : 'Owner'}</div>
          <button onClick={e => { e.stopPropagation(); signOut() }} style={{ position: 'absolute', top: '11px', right: '12px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 11px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '0.01em' }}>{BIZ}</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: '5px', fontWeight: 600 }}>{role === 'seamstress' ? 'Workroom' : 'Order Book'}</div>
        </div>

        {/* ===== LIST ===== */}
        {role !== 'seamstress' && view === 'list' && (
          <>
            <button className="gw-new-btn gw-press" onClick={() => startNew()}>+ New Order</button>
            <div className="gw-tabs" style={{ marginBottom: '16px' }}>
              <button onClick={() => setTab('open')} style={tabBtn(tab === 'open')}>Open ({openList.length})</button>
              <button onClick={() => setTab('completed')} style={tabBtn(tab === 'completed')}>Completed ({doneList.length})</button>
              <button onClick={() => setTab('all')} style={tabBtn(tab === 'all')}>All ({orders.length})</button>
              <button onClick={() => setTab('todos')} style={tabBtn(tab === 'todos')}>Alterations ({orders.reduce((s, o) => s + (o.alterationsList || []).filter(a => !a.done).length, 0)})</button>
              <button onClick={() => { setTab('customers'); setSelectedCustomer(null) }} style={tabBtn(tab === 'customers')}>Customers</button>
              <button onClick={() => setTab('catalog')} style={tabBtn(tab === 'catalog')}>Catalog</button>
            </div>

            {orders.length > 0 && tab !== 'todos' && tab !== 'catalog' && !(tab === 'customers' && selectedCustomer) && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
                style={{ ...fieldIn, fontSize: '18px', marginBottom: '16px' }} />
            )}

            {tab !== 'todos' && tab !== 'customers' && tab !== 'catalog' && filtered.length === 0 ? (
              <div className="gw-card" style={{ padding: '44px 24px', textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪡</div>
                <div style={{ fontSize: '17px', color: INK, fontWeight: 600, marginBottom: '4px' }}>{orders.length ? `No ${tab === 'all' ? '' : tab + ' '}orders` : 'No orders yet'}</div>
                <div style={{ fontSize: '15px' }}>{orders.length ? (search ? 'Try a different name.' : 'Nothing here right now.') : 'Tap "+ New Order" to write your first one.'}</div>
              </div>
            ) : tab !== 'todos' && tab !== 'customers' && tab !== 'catalog' ? (
              // Phone-first: one thin line per order. Alteration details live inside the order.
              <div className="gw-card" style={{ overflow: 'hidden', padding: 0 }}>
                {filtered.map(o => {
                  const tot = orderTotal(o), bal = balanceOf(o)
                  const needsAlt = (o.alterationsList || []).some(a => !a.done)
                  return (
                    <div key={o.id} className="gw-press" onClick={() => openOrder(o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', cursor: 'pointer', borderLeft: `4px solid ${isOpen(o) ? ROSE : GREEN}`, borderBottom: `1px solid ${CREAM}`, background: '#fff' }}>
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: '7px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName(o) || '—'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: REDNO, flexShrink: 0 }}>No. {o.orderNo}</span>
                        <span style={{ fontSize: '11px', color: MUTED, flexShrink: 0 }}>{fmtShort(o.date)}</span>
                        {needsAlt && <span title="Alterations to do" style={{ fontSize: '12px', color: ROSE_DK, flexShrink: 0 }}>✂</span>}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {bal > 0.005
                          ? <span style={{ fontSize: '13px', fontWeight: 700, color: AMBER }}>Owes {money(bal)}</span>
                          : <span style={{ fontSize: '13px', fontWeight: 700, color: GREEN }}>{tot > 0 ? `${money(tot)} ✓` : 'Paid ✓'}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* ===== TASKS TAB — alterations only, editable right here ===== */}
            {tab === 'todos' && (() => {
              // Every unfinished alteration across all orders. No sales-order or
              // vendor clutter: she works the list without opening an invoice.
              const alts = orders.flatMap(o => (o.alterationsList || []).map(a => ({
                ...a, orderId: o.id, orderNo: o.orderNo, customer: fullName(o),
              })))
              const openAlts = alts.filter(a => !a.done)
                .sort((x, y) => (x.due || '9999-99-99').localeCompare(y.due || '9999-99-99'))
              // Anyone already assigned work becomes a choice in the dropdown.
              const workers = [...new Set(alts.map(a => (a.assignee || '').trim()).filter(Boolean))].sort()

              // Edit an alteration in place, straight from this list.
              const editAlt = (orderId, altId, patch) => {
                const o = orders.find(x => x.id === orderId); if (!o) return
                patchOrder(orderId, { alterationsList: (o.alterationsList || []).map(a => a.id === altId ? { ...a, ...patch } : a) })
              }

              return (
                <div>
                  <datalist id="gown-workers">{workers.map(w => <option key={w} value={w} />)}</datalist>

                  {openAlts.length === 0 ? (
                    <div className="gw-card" style={{ padding: '36px 24px', textAlign: 'center', color: MUTED }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: INK }}>All caught up</div>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>No alterations waiting.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                        <button onClick={() => {
                          const win = window.open('', '_blank')
                          const rows = openAlts.map(a => ({ date: a.due, garment: a.garment, text: a.note || 'Alteration', hours: a.hours, assignedTo: a.assignee, orderNo: a.orderNo, customerName: a.customer }))
                          win.document.write(`<!DOCTYPE html><html><head><title>${BIZ} — Alterations</title></head><body style="font-family:sans-serif;padding:32px;max-width:720px;margin:0 auto;"><div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #2A4C9C;padding-bottom:12px;margin-bottom:24px;"><div style="font-size:22px;font-weight:700;">${BIZ} — Alterations</div><div style="font-size:13px;color:#888;">${new Date().toLocaleDateString()}</div></div>${buildTaskListHtml(rows)}</body></html>`)
                          win.document.close(); win.focus(); setTimeout(() => win.print(), 400)
                        }} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: 600, color: '#fff', background: PAD, border: 'none', borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>🖨 Print list</button>
                      </div>

                      <div className="gw-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '11px 14px', background: '#F0F4FF', borderBottom: `1px solid ${GRID}`, fontSize: '13px', fontWeight: 700, color: PAD }}>
                          {openAlts.length} alteration{openAlts.length === 1 ? '' : 's'} to do · soonest first
                        </div>
                        {openAlts.map(a => {
                          const dt = dueTone(a.due, false)
                          return (
                            <div key={a.orderId + a.id} style={{ padding: '11px 13px', borderBottom: `1px solid ${CREAM}`, borderLeft: dt.overdue ? '4px solid #C0504C' : (dt.soon ? '4px solid #9C6B12' : '4px solid transparent') }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                {a.photos?.length > 0 && mediaThumb(a.photos[0].url, 42, 7)}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '14px' }}>
                                    {a.garment?.trim() && <span style={{ fontWeight: 800, color: INK }}>👗 {a.garment.trim()} — </span>}
                                    <span style={{ fontWeight: 600, color: ROSE_DK }}>{a.note || 'Alteration'}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                                    <span onClick={() => { const o = orders.find(x => x.id === a.orderId); if (o) openOrder(o) }} style={{ color: REDNO, fontWeight: 600, cursor: 'pointer' }}>No. {a.orderNo}</span>
                                    {a.customer ? ` · ${a.customer}` : ''}
                                  </div>
                                </div>
                                <input type="checkbox" checked={false} onChange={() => editAlt(a.orderId, a.id, { done: true })} title="Mark done" style={{ width: '18px', height: '18px', accentColor: PAD, cursor: 'pointer', flexShrink: 0, marginTop: '2px' }} />
                              </div>

                              {/* assign · hours · due — all editable without leaving this list */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                                <input value={a.assignee || ''} list="gown-workers" placeholder="assign to…"
                                  onChange={e => editAlt(a.orderId, a.id, { assignee: e.target.value })}
                                  onBlur={e => editAlt(a.orderId, a.id, { assignee: titleCase(e.target.value) })}
                                  style={{ width: '116px', fontSize: '13px', fontWeight: 600, color: a.assignee ? INK : MUTED, border: `1px solid ${a.assignee ? '#E2D7D1' : REDNO}`, borderRadius: '7px', padding: '5px 8px', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
                                <input value={a.hours || ''} type="text" inputMode="decimal" placeholder="hrs"
                                  onChange={e => editAlt(a.orderId, a.id, { hours: e.target.value })}
                                  style={{ width: '54px', fontSize: '13px', textAlign: 'center', border: '1px solid #E2D7D1', borderRadius: '7px', padding: '5px 6px', background: '#fff', fontFamily: 'inherit', color: INK, outline: 'none' }} />
                                <input value={a.due || ''} type="date"
                                  onChange={e => editAlt(a.orderId, a.id, { due: e.target.value })}
                                  style={{ fontSize: '13px', border: '1px solid #E2D7D1', borderRadius: '7px', padding: '5px 7px', background: '#fff', fontFamily: 'inherit', color: dt.color, fontWeight: dt.weight, outline: 'none' }} />
                                {dt.overdue && <span style={{ fontSize: '11px', fontWeight: 700, color: '#C0504C' }}>⚠ overdue</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
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

            {/* ===== CATALOG TAB ===== */}
            {tab === 'catalog' && (
              <div>
                {/* Add item */}
                <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Add item</div>
                  <datalist id="gown-companies">
                    {[...new Set(catalog.map(c => (c.company || '').trim()).filter(Boolean))].sort().map(co => <option key={co} value={co} />)}
                  </datalist>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 130px' }}>
                      <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Company</div>
                      <input value={newCatalogItem.company} onChange={e => setNewCatalogItem(p => ({ ...p, company: e.target.value }))} list="gown-companies" placeholder="e.g. Morilee" style={fieldIn} />
                    </div>
                    <div style={{ flex: '0 0 110px' }}>
                      <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Item #</div>
                      <input value={newCatalogItem.no} onChange={e => setNewCatalogItem(p => ({ ...p, no: e.target.value.toUpperCase() }))} placeholder="e.g. DRF" style={{ ...fieldIn, fontWeight: 700, color: PAD }} />
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                      <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Description <span style={{ color: '#B3A8A2' }}>· optional</span></div>
                      <input value={newCatalogItem.desc} onChange={e => setNewCatalogItem(p => ({ ...p, desc: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addCatalogItem() }} placeholder="What is this item?" style={fieldIn} />
                    </div>
                    <div style={{ flex: '0 0 96px' }}>
                      <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>Cost <span style={{ color: '#B3A8A2' }}>· optional</span></div>
                      <input value={newCatalogItem.cost} onChange={e => setNewCatalogItem(p => ({ ...p, cost: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addCatalogItem() }} type="text" inputMode="decimal" placeholder="$" style={{ ...fieldIn, textAlign: 'right', fontWeight: 600 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', margin: '12px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="checkbox" checked={newCatalogItem.taxable} onChange={e => setNewCatalogItem(p => ({ ...p, taxable: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: PAD }} /> Taxable
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="checkbox" checked={newCatalogItem.alteration} onChange={e => setNewCatalogItem(p => ({ ...p, alteration: e.target.checked, taxable: e.target.checked ? false : p.taxable }))} style={{ width: '18px', height: '18px', accentColor: ROSE }} /> Alteration
                    </label>
                  </div>
                  <button onClick={addCatalogItem} className="gw-press" style={{ ...primaryBtn, width: '100%', padding: '12px' }}>+ Add item</button>
                </div>

                {/* Item list */}
                <div className="gw-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#F0F4FF', borderBottom: `1px solid ${GRID}`, fontSize: '13px', fontWeight: 700, color: PAD }}>
                    {catalog.length} item{catalog.length !== 1 ? 's' : ''}
                  </div>
                  {(() => {
                    const byCompany = {}
                    ;[...catalog].sort((a, b) => a.no.localeCompare(b.no)).forEach(item => {
                      const co = (item.company || '').trim() || '(no company yet)'
                      ;(byCompany[co] = byCompany[co] || []).push(item)
                    })
                    return Object.keys(byCompany).sort((a, b) => (a === '(no company yet)') - (b === '(no company yet)') || a.localeCompare(b)).map(co => (
                      <div key={co}>
                        <div style={{ padding: '9px 14px', background: '#FBF7F3', borderBottom: `1px solid ${CREAM}`, fontSize: '13px', fontWeight: 800, color: INK }}>
                          🏷 {co} <span style={{ fontWeight: 500, color: MUTED }}>· {byCompany[co].length}</span>
                        </div>
                        {byCompany[co].map(item => renderCatalogRow(item))}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {orders.length > 0 && tab !== 'todos' && tab !== 'customers' && tab !== 'catalog' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginTop: '26px' }}>
                  <button onClick={() => downloadCSV(filtered)} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, color: PAD, background: '#fff', border: `1.5px solid ${GRID}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⬇ Excel ({filtered.length})
                  </button>
                  <button onClick={() => printOrders(filtered)} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, color: '#fff', background: PAD, border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🖨 Print {filtered.length} invoice{filtered.length === 1 ? '' : 's'}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: '#B9ADA8' }}>
                  {tab === 'all' ? 'every order' : `${tab} orders`} — one full invoice per page, for the binder
                </div>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: '#B9ADA8' }}>
              Built &amp; maintained by <span style={{ color: ROSE_DK, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </>
        )}

        {/* ===== FORM ===== */}
        {role !== 'seamstress' && view === 'form' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>← All orders</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {editing && <button onClick={() => del(form.id)} style={{ background: 'none', border: 'none', color: '#C0504C', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
                <button className="gw-press" onClick={() => save(true)} style={{ ...primaryBtn, padding: '10px 28px' }}>{justSaved ? 'Saved ✓' : 'Save'}</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <button className="gw-press" onClick={() => printOrders([form])} title="Full order sheet for the binder" style={{ ...primaryBtn, flex: 1, padding: '10px', background: PAD, boxShadow: 'none' }}>🖨 Print order</button>
              <button className="gw-press" onClick={() => printReceipt(form)} title="Short customer receipt" style={{ ...primaryBtn, flex: 1, padding: '10px', background: '#fff', color: PAD, border: `1.5px solid ${PAD}` }}>🖨 Receipt</button>
              <button className="gw-press" onClick={() => emailReceipt(false)} disabled={emailing} style={{ ...primaryBtn, flex: 1, padding: '10px', background: emailing ? '#B9A9C6' : '#6D4C8E' }}>{emailing ? 'Sending…' : '✉ Email receipt'}</button>
              <button className="gw-press" onClick={() => emailReceipt(true)} disabled={emailing} title={`Send to the customer and to ${BIZ_EMAIL}`} style={{ ...primaryBtn, flex: '0 0 auto', padding: '10px 12px', fontSize: '13px', background: '#fff', color: '#6D4C8E', border: '1.5px solid #6D4C8E', boxShadow: 'none' }}>+ me</button>
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

              <datalist id="gown-companies">
                {[...new Set([...catalog.map(c => (c.company || '').trim()), ...form.items.map(i => (i.company || '').trim())].filter(Boolean))].sort().map(co => <option key={co} value={co} />)}
              </datalist>

              {/* table header */}
              <div className="gw-itemscroll">
              <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}`, minWidth: '486px' }}>
                <div style={{ ...th, width: '26px', textAlign: 'center', padding: '8px 0' }} />
                <div style={{ ...th, width: '44px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }}>Qty</div>
                <div style={{ ...th, width: '76px', textAlign: 'center', borderLeft: `1px solid ${GRID}` }} title="Stock or custom order">Type</div>
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
                  <div key={it.id} style={{ minWidth: '486px' }}>
                    <div style={{ display: 'flex', borderBottom: `1px solid ${GRID}`, alignItems: 'center', position: 'relative' }}>
                    <div style={{ width: '26px', textAlign: 'center', fontSize: '11px', color: PAD, fontWeight: 600 }}>{i + 1}</div>
                    <input value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} type="text" inputMode="numeric" style={{ ...cellIn, width: '44px', textAlign: 'center', padding: '12px 2px', borderLeft: `1px solid ${GRID}` }} />
                    <select value={it.source || ''} onChange={e => setItem(it.id, 'source', e.target.value)} title="Stock or custom order"
                      style={{ width: '76px', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch', border: 'none', borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: GRID, background: 'transparent', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, textAlign: 'center', color: it.source === 'Stock' ? GREEN : it.source === 'Custom' ? AMBER : '#C7B7B1', outline: 'none', cursor: 'pointer' }}>
                      <option value="">—</option>
                      <option value="Stock">Stock</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {/* item # with typeahead */}
                    <div style={{ width: '72px', borderLeft: `1px solid ${GRID}`, position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                      <input
                        value={it.itemNo || ''}
                        onChange={e => onItemNo(it.id, e.target.value)}
                        onFocus={() => setSuggest({ id: it.id, query: (it.itemNo || '').trim(), company: null })}
                        onBlur={() => setTimeout(() => setSuggest(null), 150)}
                        placeholder="—"
                        style={{ ...cellIn, width: '100%', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}
                      />
                      {showSuggest && (() => {
                        const companies = [...new Set(catalog.map(c => (c.company || '').trim()).filter(Boolean))].sort()
                        const q = (suggest.query || '').toLowerCase()
                        let matches = catalog.filter(c => !suggest.company || (c.company || '').trim() === suggest.company)
                        if (q) matches = matches.filter(c => c.no.toLowerCase().includes(q) || (c.desc || '').toLowerCase().includes(q))
                        const isNew = !!q && !catalog.some(c => c.no.toLowerCase() === q)
                        return (
                          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99, background: '#fff', border: `2px solid ${PAD}`, borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.13)', minWidth: '260px', maxHeight: '320px', overflowY: 'auto' }}>
                            {companies.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px 10px', borderBottom: `1px solid ${GRID}`, background: '#F8F6FB', position: 'sticky', top: 0 }}>
                                {[null, ...companies].map(co => (
                                  <button key={co || 'all'} onMouseDown={e => { e.preventDefault(); setSuggest(s => s && ({ ...s, company: co })) }}
                                    style={{ padding: '5px 11px', fontSize: '12px', fontWeight: 700, borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${suggest.company === co ? PAD : GRID}`, background: suggest.company === co ? PAD : '#fff', color: suggest.company === co ? '#fff' : INK }}>
                                    {co || 'All'}
                                  </button>
                                ))}
                              </div>
                            )}
                            {matches.slice(0, 30).map(m => (
                              <div key={m.no} onMouseDown={() => pickItem(it.id, m)} style={{ padding: '12px 14px', cursor: 'pointer', fontSize: '15px', borderBottom: `1px solid ${GRID}` }}>
                                <span style={{ fontWeight: 700, color: PAD, marginRight: '8px' }}>{m.no}</span>
                                <span style={{ color: INK }}>{m.desc}</span>
                                {(m.company || '').trim() && <span style={{ float: 'right', fontSize: '11px', color: MUTED, marginLeft: '10px' }}>{m.company}</span>}
                              </div>
                            ))}
                            {matches.length === 0 && !isNew && (
                              <div style={{ padding: '12px 14px', fontSize: '13px', color: MUTED }}>No gowns{suggest.company ? ` from ${suggest.company}` : ' yet'}.</div>
                            )}
                            {isNew && (
                              <div onMouseDown={() => { setSuggest(null); setNewItem({ rowId: it.id, no: suggest.query, desc: '', taxable: true, alteration: false, cost: '', company: suggest.company || '' }) }}
                                style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: ROSE_DK, background: '#FDF5F7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '16px' }}>＋</span>
                                <span>&ldquo;{suggest.query}&rdquo; is new — saves to catalog automatically <span style={{ fontWeight: 500, color: MUTED }}>(tap to add details)</span></span>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <input value={it.desc} onChange={e => setItem(it.id, 'desc', e.target.value)} placeholder={i === 0 ? 'Style, color, details…' : ''} style={{ ...cellIn, flex: 1, borderLeft: `1px solid ${GRID}` }} />
                    <input value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} type="text" inputMode="decimal" placeholder="$" style={{ ...cellIn, width: '82px', textAlign: 'right', padding: '12px 8px', borderLeft: `1px solid ${GRID}`, fontWeight: 600 }} />
                    <div style={{ width: '82px', textAlign: 'right', padding: '0 8px', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '15px', fontWeight: 600, color: INK }}>{lineAmt(it) ? money(lineAmt(it)) : ''}</div>
                    <div style={{ width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${GRID}`, alignSelf: 'stretch' }}>
                      <input type="checkbox" className="tax-check" checked={it.taxable !== false} onChange={e => setItem(it.id, 'taxable', e.target.checked)} title="Taxable" />
                    </div>
                    <button onClick={() => removeRow(it.id)} aria-label="remove" style={{ width: '26px', height: '40px', border: 'none', background: 'none', color: '#C7B7B1', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                    {/* company → item: type a new company or pick one you've used */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px 7px 32px', background: '#FBFAF7', borderBottom: `1px solid ${GRID}`, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, flexShrink: 0 }}>Company</span>
                      <input value={it.company || ''} list="gown-companies" placeholder="type or pick…"
                        onChange={e => setItem(it.id, 'company', e.target.value)}
                        onBlur={e => setItem(it.id, 'company', titleCase(e.target.value))}
                        style={{ fontSize: '13px', fontWeight: 600, color: INK, border: '1px solid #E2D7D1', borderRadius: '7px', padding: '5px 8px', background: '#fff', fontFamily: 'inherit', outline: 'none', width: '150px' }} />
                      {it.company && catalog.some(c => (c.company || '').trim().toLowerCase() === it.company.trim().toLowerCase()) && (
                        <select value={(it.itemNo || '').trim().toUpperCase()} onChange={e => {
                          const picked = catalog.find(c => c.no === e.target.value)
                          if (picked) pickItem(it.id, picked); else setItem(it.id, 'itemNo', '')
                        }}
                          style={{ fontSize: '13px', fontWeight: 600, color: it.itemNo ? PAD : MUTED, border: '1px solid #E2D7D1', borderRadius: '7px', padding: '5px 8px', background: '#fff', fontFamily: 'inherit', outline: 'none', maxWidth: '190px', cursor: 'pointer' }}>
                          <option value="">Their gowns…</option>
                          {catalog.filter(c => (c.company || '').trim().toLowerCase() === it.company.trim().toLowerCase()).sort((a, b) => a.no.localeCompare(b.no))
                            .map(c => <option key={c.no} value={c.no}>{c.no}{c.desc ? ` — ${c.desc}` : ''}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )
              })}

              </div>
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
                      <input value={form.taxRate} onChange={e => setF('taxRate', e.target.value)} type="text" inputMode="decimal" style={{ width: '56px', border: '1px solid #E2D7D1', borderRadius: '6px', padding: '2px 6px', fontSize: '13px', color: INK, background: '#fff', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />%
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
                        {pmt.method === 'Check' && (
                          <input value={pmt.checkNo || ''} onChange={e => setPaymentCheckNo(pmt.id, e.target.value)} inputMode="numeric" placeholder="Check #"
                            style={{ width: '90px', fontSize: '14px', border: '1.5px solid #D6E5DC', borderRadius: '8px', padding: '4px 8px', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
                        )}
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
                  <input value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} type="text" inputMode="decimal" placeholder="$" style={fieldIn} />
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
              {pay.method === 'Check' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '5px' }}>Check #</div>
                  <input value={pay.checkNo} onChange={e => setPay(p => ({ ...p, checkNo: e.target.value }))} inputMode="numeric" placeholder="Check number" style={fieldIn} />
                </div>
              )}
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
              <button onClick={() => { if (form.alterations) { setForm(f => ({ ...f, alterations: false })) } else { setForm(f => ({ ...f, alterations: true, alterationsList: f.alterationsList?.length ? f.alterationsList : [{ id: uid(), garment: '', note: '', assignee: '', hours: '', due: '', done: false }] })) } }} className="gw-press" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px',
                border: `1.5px solid ${form.alterations ? ROSE : '#E2D7D1'}`, background: form.alterations ? '#FBEAF0' : '#fff',
                borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '7px', border: `2px solid ${form.alterations ? ROSE : '#CDBFBA'}`, background: form.alterations ? ROSE : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{form.alterations ? '✓' : ''}</span>
                <span style={{ fontSize: '17px', fontWeight: 600 }}>✂ Needs alterations</span>
              </button>

              {form.alterations && (
                <div style={{ marginTop: '12px' }}>
                  <datalist id="gown-opts">{[...new Set((form.items || []).map(it => it.desc?.trim()).filter(Boolean))].map(g => <option key={g} value={g} />)}</datalist>
                  {(form.alterationsList || []).map((a, idx) => {
                    const multiGown = [...new Set((form.items || []).map(it => it.desc?.trim()).filter(Boolean))].length > 1
                    return (
                    <div key={a.id} style={{ marginBottom: '10px', padding: '14px', background: '#FBEAF0', border: '1px solid #F1D5E0', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>✂ Alteration {idx + 1}</span>
                        <button onClick={() => removeAlteration(a.id)} title="Remove" style={{ border: 'none', background: 'none', color: '#B07C90', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                      </div>
                      {(multiGown || a.garment) && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Which garment</div>
                          <input value={a.garment || ''} onChange={e => setAlterationField(a.id, 'garment', e.target.value)} list="gown-opts" placeholder="Which gown" style={fieldIn} />
                        </div>
                      )}
                      <textarea value={a.note} onChange={e => setAlterationField(a.id, 'note', e.target.value)} rows={2} placeholder="What's needed — hem, take in, add bustle…"
                        style={{ ...fieldIn, resize: 'vertical', lineHeight: 1.5 }} />
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Due</div>
                        <input type="date" value={a.due || ''} onChange={e => setAlterationField(a.id, 'due', e.target.value)} style={fieldIn} />
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Photos</div>
                        {photoStrip(a.photos, (p) => setAlterationField(a.id, 'photos', p))}
                      </div>
                      {(a.assignee || a.hours) && (
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '8px' }}>
                          {a.assignee ? `Worker: ${a.assignee}` : ''}{a.assignee && a.hours ? ' · ' : ''}{a.hours ? `${a.hours} hrs` : ''}
                        </div>
                      )}
                      <button onClick={() => setAlterationField(a.id, 'done', !a.done)} className="gw-press" style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', marginTop: '10px',
                        border: `1.5px solid ${a.done ? GREEN : '#E2D7D1'}`, background: a.done ? '#E7F4EC' : '#fff', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '7px', border: `2px solid ${a.done ? GREEN : '#CDBFBA'}`, background: a.done ? GREEN : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{a.done ? '✓' : ''}</span>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: a.done ? GREEN : INK }}>Done</span>
                      </button>
                    </div>
                  )})}
                  <button onClick={addAlteration} className="gw-press" style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px dashed ${ROSE}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add another alteration</button>
                </div>
              )}

              <div style={{ fontSize: '13px', fontWeight: 600, color: MUTED, margin: '16px 0 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</div>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2} placeholder="Pickup Thursday, etc."
                style={{ ...fieldIn, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Photos */}
            <div className="gw-card" style={{ padding: '16px 18px', marginTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Photos</div>
              {photoStrip(form.photos, (p) => setF('photos', p))}
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

            {/* Sales Order — to vendor */}
            <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '20px' }}>
              <button onClick={() => setShowSales(v => !v)} className="gw-press" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1.5px solid ${PAD}`, background: '#F6F9FE', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: PAD }}>📋 Sales Order — to vendor</span>
                <span style={{ fontSize: '14px', color: PAD }}>{showSales ? '▲' : '▼'}</span>
              </button>

              {showSales && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '12px' }}>Customer: <b style={{ color: INK }}>{fullName(form) || '—'}</b>{form.phone ? ` · ${form.phone}` : ''} <span style={{ color: '#B3A8A2' }}>(from the order)</span></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><div style={soLbl}>Date requested</div><input type="date" value={form.salesOrder?.dateRequested || ''} onChange={e => setSales('dateRequested', e.target.value)} style={fieldIn} /></div>
                    <div><div style={soLbl}>Receipt book No.</div><input value={form.salesOrder?.receiptBookNo || ''} onChange={e => setSales('receiptBookNo', e.target.value)} style={fieldIn} /></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                    <span style={{ ...soLbl, marginBottom: 0 }}>Fitting:</span>
                    {['yes', 'no'].map(v => (
                      <button key={v} onClick={() => setSales('fitting', form.salesOrder?.fitting === v ? '' : v)} className="gw-press" style={{ padding: '6px 16px', borderRadius: '8px', border: `1.5px solid ${form.salesOrder?.fitting === v ? ROSE : '#E2D7D1'}`, background: form.salesOrder?.fitting === v ? ROSE : '#fff', color: form.salesOrder?.fitting === v ? '#fff' : INK, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{v}</button>
                    ))}
                  </div>

                  {[['Model name', 'modelName'], ['Designer / Vendor', 'designerVendor'], ['Vendor Model #', 'vendorModelNo'], ['Fabric', 'fabric'], ['Color', 'color'], ['Description', 'description'], ['Note', 'note']].map(([lab, key]) => (
                    <div key={key} style={{ marginBottom: '8px' }}>
                      <div style={soLbl}>{lab}</div>
                      <input value={form.salesOrder?.[key] || ''} onChange={e => setSales(key, e.target.value)} style={fieldIn} />
                    </div>
                  ))}

                  <div style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px' }}>Standard sizes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[['Jacket', 'jacketSize'], ['Skirt', 'skirtSize'], ['Dress', 'dressSize']].map(([lab, key]) => (
                      <div key={key}><div style={soLbl}>{lab}</div><input value={form.salesOrder?.[key] || ''} onChange={e => setSales(key, e.target.value)} style={fieldIn} /></div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px' }}>Custom measurements</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[['Bust', 'bust'], ['Bust to bust', 'bustToBust'], ['Waist', 'waist'], ['Hip — higher', 'hipHigher'], ['Hip — lower', 'hipLower'], ['Shoulder to shoulder', 'shoulderToShoulder'], ['Shoulder to bust', 'shoulderToBust'], ['Neck to waist', 'neckToWaist'], ['Length of sleeves', 'sleeves'], ['Muscle', 'muscle'], ['Length of jacket', 'lengthJacket'], ['Length of skirt', 'lengthSkirt'], ['Length of dress', 'lengthDress']].map(([lab, key]) => (
                      <div key={key}><div style={soLbl}>{lab}</div><input value={form.salesOrder?.[key] || ''} onChange={e => setSales(key, e.target.value)} style={fieldIn} /></div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px' }}>Pricing</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[['Standard price', 'standardPrice'], ['Fabric cost', 'fabricCost'], ['Additional', 'additional'], ['Total', 'total']].map(([lab, key]) => (
                      <div key={key}><div style={soLbl}>{lab}</div><input value={form.salesOrder?.[key] || ''} onChange={e => setSales(key, e.target.value)} inputMode="decimal" style={fieldIn} /></div>
                    ))}
                  </div>

                  <button onClick={() => printSalesOrder(form)} className="gw-press" style={{ ...primaryBtn, width: '100%', marginTop: '14px' }}>🖨 Print sales order</button>
                  <div style={{ fontSize: '12px', color: MUTED, textAlign: 'center', marginTop: '6px' }}>Tip: save the order so these entries are stored.</div>
                </div>
              )}
            </div>

            <button className="gw-press" onClick={() => save(true)} style={{ ...primaryBtn, width: '100%' }}>{justSaved ? 'Saved ✓' : 'Save'}</button>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="gw-press" onClick={() => printOrders([form])} title="Full order sheet for the binder" style={{ ...primaryBtn, flex: 1, background: PAD, boxShadow: 'none' }}>🖨 Print order</button>
              <button className="gw-press" onClick={() => printReceipt(form)} title="Short customer receipt" style={{ ...primaryBtn, flex: 1, background: '#fff', color: PAD, border: `1.5px solid ${PAD}` }}>🖨 Receipt</button>
              <button className="gw-press" onClick={() => emailReceipt(false)} disabled={emailing} style={{ ...primaryBtn, flex: 1, background: emailing ? '#B9A9C6' : '#6D4C8E' }}>{emailing ? 'Sending…' : '✉ Email receipt'}</button>
              <button className="gw-press" onClick={() => emailReceipt(true)} disabled={emailing} title={`Send to the customer and to ${BIZ_EMAIL}`} style={{ ...primaryBtn, flex: '0 0 auto', padding: '14px 14px', fontSize: '14px', background: '#fff', color: '#6D4C8E', border: '1.5px solid #6D4C8E', boxShadow: 'none' }}>+ me</button>
            </div>
            <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>← Back to all orders</button>
          </div>
        )}

        {/* ===== SEAMSTRESS: DASHBOARD ===== */}
        {role === 'seamstress' && view === 'list' && (() => {
          const q = search.trim().toLowerCase()
          const matchC = (o) => !q || fullName(o).toLowerCase().includes(q)
          const orderList = orders
            .filter(matchC)
            .map(o => ({ o, pending: (o.alterationsList || []).filter(a => !a.done).length, total: (o.alterationsList || []).length }))
            .sort((a, b) => b.pending - a.pending || (b.o.savedAt || 0) - (a.o.savedAt || 0))
          const pendingAlts = orders.filter(matchC).flatMap(o => (o.alterationsList || []).filter(a => !a.done).map(a => ({ ...a, orderId: o.id, orderNo: o.orderNo, customer: fullName(o) })))
          const byWorker = pendingAlts.reduce((acc, a) => { const k = a.assignee || 'Unassigned'; (acc[k] = acc[k] || []).push(a); return acc }, {})
          const byDate = [...pendingAlts].sort((x, y) => (x.due || '9999').localeCompare(y.due || '9999')).reduce((acc, a) => { const k = a.due || 'No date'; (acc[k] = acc[k] || []).push(a); return acc }, {})
          const markDone = (orderId, altId) => { const o = orders.find(x => x.id === orderId); if (o) patchOrder(orderId, { alterationsList: (o.alterationsList || []).map(a => a.id === altId ? { ...a, done: true } : a) }) }
          const altRow = (a, showWorker) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: `1px solid ${CREAM}` }}>
              {a.photos?.length > 0 && mediaThumb(a.photos[0].url, 44, 7)}
              <div onClick={() => { const o = orders.find(x => x.id === a.orderId); if (o) openOrder(o) }} style={{ cursor: 'pointer', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '14px' }}>{a.garment ? <span style={{ fontWeight: 800, color: INK }}>{a.garment} — </span> : ''}<span style={{ fontWeight: 600, color: ROSE_DK }}>{a.note || 'Alteration'}</span></div>
                <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}><span style={{ color: REDNO, fontWeight: 600 }}>No. {a.orderNo}</span> · {a.customer}{showWorker && a.assignee ? ` · ${a.assignee}` : ''}{!showWorker && a.due ? <span style={{ color: dueTone(a.due, false).color, fontWeight: dueTone(a.due, false).weight }}> · {dueTone(a.due, false).overdue ? '⚠ ' : ''}due {fmtShort(a.due)}</span> : ''}</div>
              </div>
              <input type="checkbox" checked={false} onChange={() => markDone(a.orderId, a.id)} title="Mark done" style={{ width: '17px', height: '17px', accentColor: PAD, cursor: 'pointer' }} />
            </div>
          )
          return (
            <>
              <div style={{ fontSize: '20px', fontWeight: 700, color: INK, marginBottom: '3px' }}>Workroom</div>
              <div style={{ fontSize: '13px', color: MUTED, marginBottom: '12px' }}>{pendingAlts.length} alteration{pendingAlts.length !== 1 ? 's' : ''} to do.</div>
              <button className="gw-new-btn gw-press" onClick={startNew} style={{ marginBottom: '14px' }}>+ New Order</button>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[['current', 'Current'], ['history', 'History'], ['worker', 'By Worker'], ['date', 'By Date']].map(([v, l]) => (
                  <button key={v} onClick={() => setWorkView(v)} style={{ ...tabBtn(workView === v), flex: 'none', padding: '10px 16px' }}>{l}</button>
                ))}
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…" style={{ ...fieldIn, fontSize: '18px', marginBottom: '16px' }} />

              {(workView === 'current' || workView === 'history') && (() => {
                const shown = orderList.filter(({ pending, total }) => workView === 'history' ? (total > 0 && pending === 0) : !(total > 0 && pending === 0))
                if (shown.length === 0) return (
                  <div className="gw-card" style={{ padding: '40px 24px', textAlign: 'center', color: MUTED }}>{workView === 'history' ? 'No completed orders yet.' : (orders.length ? 'Nothing in progress.' : 'No orders yet.')}</div>
                )
                return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shown.map(({ o, pending, total }) => (
                    <div key={o.id} className="gw-card" style={{ padding: '14px 16px', borderLeft: `4px solid ${pending > 0 ? ROSE : (total > 0 ? GREEN : '#D9CFC8')}` }}>
                      <div className="gw-press" onClick={() => openOrder(o)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                        {o.photos?.length > 0 && mediaThumb(o.photos[0].url, 48)}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: INK }}>{fullName(o) || '—'} <span style={{ fontSize: '12px', fontWeight: 800, color: REDNO }}>No. {o.orderNo}</span></div>
                          <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{fmtDate(o.date)}{o.phone ? ` · ${o.phone}` : ''}</div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: pending > 0 ? AMBER : GREEN, whiteSpace: 'nowrap', flexShrink: 0 }}>{pending > 0 ? `${pending} to do` : (total > 0 ? 'All done ✓' : '—')}</span>
                      </div>
                      {total > 0 && (() => {
                        const groups = {}
                        ;(o.alterationsList || []).forEach(a => { const g = a.garment?.trim() || 'Gown'; (groups[g] = groups[g] || []).push(a) })
                        return (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(groups).map(([garment, alts]) => (
                              <div key={garment}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: INK, marginBottom: '5px' }}>👗 {garment}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {alts.map(a => {
                                    const dt = dueTone(a.due, a.done)
                                    return (
                                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: a.done ? '#F5F2EF' : '#FBEAF0', borderRadius: '8px', borderLeft: dt.overdue ? '3px solid #C0504C' : (dt.soon ? '3px solid #9C6B12' : '3px solid transparent') }}>
                                        {a.photos?.length > 0 && mediaThumb(a.photos[0].url, 40, 6)}
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div style={{ fontSize: '13px', fontWeight: 600, color: a.done ? MUTED : ROSE_DK, textDecoration: a.done ? 'line-through' : 'none' }}>{a.note || 'Alteration'}</div>
                                          <div style={{ fontSize: '11px', marginTop: '1px' }}>
                                            <span style={{ color: MUTED }}>{[a.assignee, a.hours ? `${a.hours}h` : ''].filter(Boolean).join(' · ') || 'unassigned'}</span>
                                            {a.due && <span style={{ color: dt.color, fontWeight: dt.weight, marginLeft: '6px' }}>{dt.overdue ? '⚠ ' : ''}due {fmtShort(a.due)}</span>}
                                          </div>
                                        </div>
                                        {a.done
                                          ? <span style={{ fontSize: '12px', color: GREEN, fontWeight: 700 }}>✓</span>
                                          : <input type="checkbox" checked={false} onChange={() => markDone(o.id, a.id)} title="Mark done" style={{ width: '16px', height: '16px', accentColor: PAD, cursor: 'pointer' }} />}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
                )
              })()}

              {(workView === 'worker' || workView === 'date') && pendingAlts.length === 0 && (
                <div className="gw-card" style={{ padding: '36px 24px', textAlign: 'center', color: MUTED }}><div style={{ fontSize: '30px', marginBottom: '6px' }}>✓</div>All caught up — nothing to do.</div>
              )}

              {workView === 'worker' && Object.keys(byWorker).sort().map(worker => (
                <div key={worker} className="gw-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#FBEAF0', borderBottom: `1px solid ${GRID}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: ROSE_DK }}>{worker}</span>
                    <span style={{ fontSize: '12px', color: MUTED }}>{byWorker[worker].length} to do</span>
                  </div>
                  {byWorker[worker].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).map(a => altRow(a, false))}
                </div>
              ))}

              {workView === 'date' && Object.keys(byDate).map(date => (
                <div key={date} className="gw-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#FBEAF0', borderBottom: `1px solid ${GRID}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: ROSE_DK }}>{date === 'No date' ? 'No date' : fmtDate(date)}</span>
                    <span style={{ fontSize: '12px', color: MUTED }}>{byDate[date].length}</span>
                  </div>
                  {byDate[date].map(a => altRow(a, true))}
                </div>
              ))}
            </>
          )
        })()}

        {/* ===== SEAMSTRESS: ORDER DETAIL ===== */}
        {role === 'seamstress' && view === 'form' && (() => {
          const sub = sumItems(form.items), tax = calcTax(form.items, form.taxRate), tot = sub + tax
          const gownOpts = [...new Set((form.items || []).map(it => it.desc?.trim()).filter(Boolean))]
          const workerOpts = [...new Set(orders.flatMap(o => (o.alterationsList || []).map(a => a.assignee).filter(Boolean)))]
          return (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <datalist id="s-gown-opts">{gownOpts.map(g => <option key={g} value={g} />)}</datalist>
              <datalist id="s-worker-opts">{workerOpts.map(w => <option key={w} value={w} />)}</datalist>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', color: ROSE_DK, fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', marginBottom: '12px' }}>← All orders</button>

              {!editing ? (
                /* New order — Medina enters the customer; Pessi adds pricing later */
                <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New order</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div style={{ flex: '1 1 140px' }}><div style={soLbl}>First name</div><input value={form.firstName} onChange={e => setF('firstName', e.target.value)} onBlur={e => setF('firstName', titleCase(e.target.value))} placeholder="First" style={fieldIn} /></div>
                    <div style={{ flex: '1 1 140px' }}><div style={soLbl}>Last name</div><input value={form.lastName} onChange={e => setF('lastName', e.target.value)} onBlur={e => setF('lastName', titleCase(e.target.value))} placeholder="Last" style={fieldIn} /></div>
                  </div>
                  <div style={{ marginBottom: '8px' }}><div style={soLbl}>Cell</div><input value={form.phone} onChange={e => setF('phone', e.target.value)} onBlur={e => setF('phone', fmtPhone(e.target.value))} type="tel" placeholder="required" style={fieldIn} /></div>
                  <div><div style={soLbl}>Address <span style={{ color: '#B3A8A2' }}>· optional</span></div><input value={form.address} onChange={e => setF('address', e.target.value)} onBlur={e => setF('address', titleCase(e.target.value))} placeholder="Street, city…" style={fieldIn} /></div>
                  <div style={{ fontSize: '11px', color: MUTED, marginTop: '8px' }}>Pricing is added by the office. Log the garments and alterations below.</div>
                </div>
              ) : (
                /* Existing order — read-only customer + garments (no prices for Medina) */
                <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{fullName(form) || '—'}</div>
                      <div style={{ fontSize: '13px', color: MUTED, marginTop: '2px' }}>{fmtDate(form.date)}{form.phone ? ` · ${form.phone}` : ''}</div>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: REDNO }}>No. {form.orderNo || '—'}</div>
                  </div>
                  {(form.items || []).filter(it => it.desc?.trim() || it.itemNo).length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${CREAM}` }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Gowns / items</div>
                      {(form.items || []).filter(it => it.desc?.trim() || it.itemNo).map(it => (
                        <div key={it.id} style={{ fontSize: '14px', padding: '2px 0' }}>{(parseFloat(it.qty) || 1) > 1 ? `${it.qty}× ` : ''}{it.desc?.trim() || it.itemNo}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Photos</div>
                {photoStrip(form.photos, (p) => setF('photos', p))}
              </div>

              <div className="gw-card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>✂ Alterations</div>
                {(form.alterationsList || []).length === 0 && <div style={{ fontSize: '13px', color: MUTED, marginBottom: '10px' }}>None yet. Add one below — including for garments the customer brought in.</div>}
                {(form.alterationsList || []).map((a, idx) => (
                  <div key={a.id} style={{ marginBottom: '10px', padding: '14px', background: '#FBEAF0', border: '1px solid #F1D5E0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: ROSE_DK, textTransform: 'uppercase' }}>✂ Alteration {idx + 1}</span>
                      <button onClick={() => removeAlteration(a.id)} style={{ border: 'none', background: 'none', color: '#B07C90', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Garment</div>
                      <input value={a.garment || ''} onChange={e => setAlterationField(a.id, 'garment', e.target.value)} list="s-gown-opts" placeholder="Gown, or customer's own item" style={fieldIn} />
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>What&apos;s needed</div>
                      <textarea value={a.note || ''} onChange={e => setAlterationField(a.id, 'note', e.target.value)} rows={2} placeholder="Hem, take in…" style={{ ...fieldIn, resize: 'vertical', lineHeight: 1.5 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Worker</div>
                        <input value={a.assignee || ''} onChange={e => setAlterationField(a.id, 'assignee', e.target.value)} onBlur={e => setAlterationField(a.id, 'assignee', titleCase(e.target.value))} list="s-worker-opts" placeholder="Assign to…" style={fieldIn} />
                      </div>
                      <div style={{ flex: '1 1 70px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Hours</div>
                        <input value={a.hours || ''} onChange={e => setAlterationField(a.id, 'hours', e.target.value)} inputMode="decimal" placeholder="0" style={fieldIn} />
                      </div>
                      <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Due</div>
                        <input type="date" value={a.due || ''} onChange={e => setAlterationField(a.id, 'due', e.target.value)} style={fieldIn} />
                      </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ROSE_DK, marginBottom: '5px' }}>Photos</div>
                      {photoStrip(a.photos, (p) => setAlterationField(a.id, 'photos', p))}
                    </div>
                    <button onClick={() => setAlterationField(a.id, 'done', !a.done)} className="gw-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', marginTop: '10px', border: `1.5px solid ${a.done ? GREEN : '#E2D7D1'}`, background: a.done ? '#E7F4EC' : '#fff', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '7px', border: `2px solid ${a.done ? GREEN : '#CDBFBA'}`, background: a.done ? GREEN : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{a.done ? '✓' : ''}</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: a.done ? GREEN : INK }}>Done</span>
                    </button>
                  </div>
                ))}
                <button onClick={addAlteration} className="gw-press" style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: ROSE_DK, background: '#fff', border: `1.5px dashed ${ROSE}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add alteration</button>
              </div>

              <button className="gw-press" onClick={saveSeamstressOrder} style={{ ...primaryBtn, width: '100%' }}>{justSaved ? 'Saved ✓' : 'Save'}</button>
              <button onClick={() => { setView('list'); window.scrollTo(0, 0) }} style={{ ...ghostBtn, marginTop: '10px', border: 'none', color: MUTED }}>← Back</button>
            </div>
          )
        })()}
      </div>

      {/* ===== PHOTO LIGHTBOX ===== */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out' }}>
          {isVideo(lightbox)
            ? <video src={lightbox} controls autoPlay playsInline onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', background: '#000' }} />
            : <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />}
          <button onClick={() => setLightbox(null)} aria-label="Close" style={{ position: 'absolute', top: '16px', right: '18px', width: '42px', height: '42px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ===== NEW ITEM MODAL ===== */}
      {newItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: INK, marginBottom: '18px' }}>Save new item to catalog</div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Item #</div>
              <input value={newItem.no} onChange={e => setNewItem(n => ({ ...n, no: e.target.value.toUpperCase() }))} style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 700, color: PAD, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Company <span style={{ color: '#B3A8A2', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>· optional</span></div>
              <datalist id="gown-companies-modal">
                {[...new Set(catalog.map(c => (c.company || '').trim()).filter(Boolean))].sort().map(co => <option key={co} value={co} />)}
              </datalist>
              <input value={newItem.company || ''} onChange={e => setNewItem(n => ({ ...n, company: e.target.value }))} list="gown-companies-modal" placeholder="e.g. Morilee" style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', color: INK, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description <span style={{ color: '#B3A8A2', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>· optional</span></div>
              <input value={newItem.desc} onChange={e => setNewItem(n => ({ ...n, desc: e.target.value }))} placeholder="What is this item?" autoFocus style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', color: INK, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cost <span style={{ color: '#B3A8A2', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>· what you paid, optional</span></div>
              <input value={newItem.cost || ''} onChange={e => setNewItem(n => ({ ...n, cost: e.target.value }))} type="text" inputMode="decimal" placeholder="$" style={{ width: '100%', padding: '12px 14px', fontSize: '17px', border: '1.5px solid #E2D7D1', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 600, color: INK, outline: 'none' }} />
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
