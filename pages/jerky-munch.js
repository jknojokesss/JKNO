import { useState, useRef, useEffect, Fragment } from 'react'
import Head from 'next/head'
import { jerkySupabase } from '../lib/supabaseJerky'
import { buildPnl, buildBalanceSheet, buildCashFlow, periodPnl, buildAdSpend } from '../lib/jerkyGL'
import { loadQboStatements, balanceSheetAsOf, monthLabel } from '../lib/qboStatements'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const CHAR = '#2B2018', SPICE = '#C8462C', KRAFT = '#A9763A', CREAM = '#F6F0E6'
const INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', AMBER = '#C98A2A', RED = '#C03A22'
const CARDBG = '#FFFDF9'
const BIZ = 'Jerky Munch'

const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(n).toLocaleString()
const sgn = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString()
const todayStr = new Date().toISOString().slice(0, 10)
const fmtD = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'
const daysSince = (s) => s ? Math.round((Date.now() - new Date(s + 'T00:00:00')) / 86400000) : null

// consignment reconciliation
const recon = (c) => {
  const paidUnits = c.price > 0 ? Math.round(c.paid / c.price) : 0
  const expected = c.sent - c.returned - paidUnits      // should still be on the shelf
  const variance = expected - c.counted                 // + = missing / shrinkage
  return { paidUnits, expected, variance, varVal: variance * c.price,
    status: c.counted == null ? 'uncounted' : variance === 0 ? 'reconciled' : variance > 0 ? 'short' : 'over' }
}

const DIRECT_SOURCES = ['Shopify / online', 'Farmers market', 'Pop-up event', 'Wholesale / bulk', 'Other']

const COGS_CATS = ['Ingredients', 'Packaging']
const EXP_CATS = ['Ingredients', 'Packaging', 'Marketing', 'Fees', 'Equipment', 'Travel', 'Other']
const DIAGNOSES = ['', 'Sold but not reported (store owes me)', 'Theft or loss', 'Damaged or expired', 'Free samples given out', 'Miscount — recount needed', 'Unknown — still checking']
const RESTOCK = [{ id: 'good', label: 'Stocked', color: GREEN }, { id: 'soon', label: 'Order soon', color: AMBER }, { id: 'now', label: 'Needs more now', color: RED }]
const RM = Object.fromEntries(RESTOCK.map(r => [r.id, r]))
const verdict = (roas) => roas >= 2 ? { c: GREEN, t: 'Scale' } : roas >= 1 ? { c: AMBER, t: 'Watch' } : { c: RED, t: 'Cut' }

const PAY = [{ id: 'business', label: 'Business acct', color: MUTED }, { id: 'personal', label: 'Personal CC', color: RED }]
const PAYM = Object.fromEntries(PAY.map(p => [p.id, p]))

const mLine = (mo) => {
  const boardRev = mo.boardRev || 0, campRev = mo.campRev || 0, boardCogs = mo.boardCogs || 0, campCogs = mo.campCogs || 0
  const bcRev = boardRev + campRev, bcCogs = boardCogs + campCogs
  const rev = mo.directRev + mo.consignRev + bcRev, cogs = mo.cogs + bcCogs
  const gross = rev - cogs, opex = mo.adSpend + mo.opexNonAd
  return { m: mo.m, directRev: mo.directRev, consignRev: mo.consignRev, boardRev, campRev, bcRev, rev, cogs, gross, ad: mo.adSpend, otherOpex: mo.opexNonAd, opex, net: gross - opex }
}
const PNL_ROWS = [
  { label: 'Direct sales', key: 'directRev', kind: 'line', cost: false },
  { label: 'Consignment collected', key: 'consignRev', kind: 'line', cost: false },
  { label: 'Boards & camp packages', key: 'bcRev', kind: 'line', cost: false },
  { label: 'Total revenue', key: 'rev', kind: 'subtotal', cost: false },
  { label: 'Cost of goods sold', key: 'cogs', kind: 'line', cost: true },
  { label: 'Gross profit', key: 'gross', kind: 'subtotal', cost: false },
  { label: 'Advertising', key: 'ad', kind: 'line', cost: true },
  { label: 'Other operating costs', key: 'otherOpex', kind: 'line', cost: true },
  { label: 'Total operating expenses', key: 'opex', kind: 'subtotal', cost: true },
  { label: 'Net profit / loss', key: 'net', kind: 'total', cost: false },
]

// per-period sales for the front-page leaderboards (week vs month)
const Bag = ({ color }) => (
  <svg width="58" height="58" viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto' }}>
    <rect x="13" y="8" width="38" height="9" rx="2" fill={color} opacity="0.5" />
    <rect x="14" y="14" width="36" height="44" rx="6" fill={color} />
    <rect x="14" y="14" width="36" height="11" rx="6" fill="#000" opacity="0.08" />
    <rect x="20" y="28" width="24" height="20" rx="3" fill="#FFFDF9" opacity="0.95" />
    <rect x="23" y="33" width="18" height="3" rx="1.5" fill={color} />
    <rect x="23" y="39" width="12" height="3" rx="1.5" fill={color} opacity="0.55" />
  </svg>
)

const MONO = "'IBM Plex Mono', monospace"

export default function JerkyMunch() {
  const [tab, setTab] = useState('overview')
  const [consign, setConsign] = useState([])
  const [direct, setDirect] = useState([])
  const [ads, setAds] = useState([])
  const [PRODUCTS, setPRODUCTS] = useState([])
  const [MONTH_SERIES, setMONTH_SERIES] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [draft, setDraft] = useState({})
  const [adding, setAdding] = useState(false)
  const [cf, setCf] = useState({ store: '', price: '', sent: '' })
  const [expenses, setExpenses] = useState([])
  const [storeInvoices, setStoreInvoices] = useState([])
  const [pricing, setPricing] = useState({})          // partnerId -> { loading, loaded, customer, last, items, matchError, error }
  const [invForm, setInvForm] = useState({})          // partnerId -> { txnDate, dueDate, memo, send, lines:[{itemId,item,unitPrice,qty,description}] }
  const [invBusy, setInvBusy] = useState({})          // partnerId -> submitting
  const [invResult, setInvResult] = useState({})      // partnerId -> { ok, msg } | { error }
  const [qbCustomers, setQbCustomers] = useState(null) // QB customer list for manual mapping
  const [linkPick, setLinkPick] = useState({})        // partnerId -> typed customer name in the mapping box
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [addingE, setAddingE] = useState(false)
  const [ef, setEf] = useState({ vendor: '', amt: '', cat: 'Other', pay: 'personal' })
  const [addingD, setAddingD] = useState(false)
  const [df, setDf] = useState({ who: '', source: 'Shopify / online', units: '', rev: '' })
  const [pnlMonths, setPnlMonths] = useState(2)
  const [pnlView, setPnlView] = useState('single')
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(99)
  // Financials tab (real books): which statement + P&L view mode + month pickers
  const [finView, setFinView] = useState('pnl')       // 'pnl' | 'bs' | 'cf'
  const [finFrom, setFinFrom] = useState(null)        // P&L range: first month index (null = last complete month)
  const [finTo, setFinTo] = useState(null)            // P&L range: last month index (null = last complete month)
  const [finCmpOn, setFinCmpOn] = useState(false)     // comparison on/off
  const [finCmpFrom, setFinCmpFrom] = useState(0)     // comparison range start
  const [finCmpTo, setFinCmpTo] = useState(99)        // comparison range end
  const [finExpand, setFinExpand] = useState({ income: true, cogs: true, expense: true })
  const [ovFrom, setOvFrom] = useState(null)          // Overview range (null = default to last complete month)
  const [ovTo, setOvTo] = useState(null)
  const [period, setPeriod] = useState('month')
  const [costPerBag, setCostPerBag] = useState(4.5)
  const [boardsProducts, setBoardsProducts] = useState([])
  const [campProducts, setCampProducts] = useState([])
  const [boardCost, setBoardCost] = useState(75)
  const [campCost, setCampCost] = useState(25)
  const [logoOk, setLogoOk] = useState(true)
  const [addingA, setAddingA] = useState(false)
  const [af, setAf] = useState({ channel: '', spend: '', rev: '', track: '' })
  const [glTx, setGlTx] = useState([])          // real QuickBooks GL rows from Supabase
  const [coaTx, setCoaTx] = useState([])        // real Chart of Accounts rows from Supabase
  const [qbo, setQbo] = useState(null)          // QuickBooks' own P&L + balance sheet
  const fileRef = useRef(null)

  // ── auth gate ──────────────────────────────────────────────────────
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [role, setRole] = useState(null)              // 'owner' | 'counter' (staff shelf-count-only)
  const [drill, setDrill] = useState(null)            // P&L drill-down: { title, rows, total }
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showChangePw, setShowChangePw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [changePwMsg, setChangePwMsg] = useState('')

  // ── data loaders (Supabase → the UI object shapes the page already uses) ──
  const loadConsign = async () => {
    try {
      const [{ data: partners }, { data: logs }] = await Promise.all([
        jerkySupabase.from('consignment_partners').select('*').order('store'),
        jerkySupabase.from('consignment_log').select('*').order('at', { ascending: false }),
      ])
      const byPartner = {}
      ;(logs || []).forEach(l => { (byPartner[l.partner_id] = byPartner[l.partner_id] || []).push(l) })
      setConsign((partners || []).map(p => ({
        id: p.id, store: p.store, price: p.price, sent: p.sent, returned: p.returned, paid: p.paid,
        counted: p.counted, countedDate: p.counted_date || '', diagnosis: p.diagnosis || '',
        cycle: p.cycle, lastContact: p.last_contact, restock: p.restock, notes: p.notes,
        type: p.type || 'consignment', region: p.region || '',
        log: (byPartner[p.id] || []).map(l => ({ at: fmtD(l.at), t: l.note })),
      })))
    } catch (e) { console.error('loadConsign failed', e) }
  }
  const loadDirect = async () => {
    try {
      const { data } = await jerkySupabase.from('direct_sales').select('*').order('sale_date', { ascending: false })
      setDirect((data || []).map(d => ({ id: d.id, who: d.who, source: d.source, units: d.units, rev: d.rev })))
    } catch (e) { console.error('loadDirect failed', e) }
  }
  const loadAds = async () => {
    try {
      const { data } = await jerkySupabase.from('ad_channels').select('*')
      setAds((data || []).map(a => ({ id: a.id, channel: a.channel, spend: a.spend, rev: a.rev, track: a.track, tracked: a.tracked })))
    } catch (e) { console.error('loadAds failed', e) }
  }
  const loadExpenses = async () => {
    try {
      const { data } = await jerkySupabase.from('expenses').select('*').order('exp_date', { ascending: false })
      setExpenses((data || []).map(e => ({ id: e.id, vendor: e.vendor, cat: e.cat, amt: e.amt, pay: e.pay })))
    } catch (e) { console.error('loadExpenses failed', e) }
  }
  const loadInvoices = async () => {
    try {
      const { data } = await jerkySupabase.from('store_invoices').select('*').order('inv_date', { ascending: false })
      setStoreInvoices((data || []).map(i => ({ id: i.id, partnerId: i.partner_id, date: i.inv_date, units: i.units, unitPrice: i.unit_price, amount: Number(i.amount) || 0, description: i.description || '', dueDate: i.due_date, status: i.status, paidDate: i.paid_date, qbInvoiceId: i.qb_invoice_id || null, qbDocNumber: i.qb_doc_number || null, sentAt: i.sent_at || null })))
    } catch (e) { console.error('loadInvoices failed', e); setStoreInvoices([]) }
  }

  // ── QuickBooks invoice pipe (server routes, authorized with the Jerky session) ──
  const todayISO = () => new Date().toISOString().slice(0, 10)
  const jerkyApi = async (path, opts = {}) => {
    const { data: sess } = await jerkySupabase.auth.getSession()
    const token = sess && sess.session ? sess.session.access_token : ''
    return fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  }
  // fetch the store's QB customer + last-invoice prices when its panel opens
  const ensurePricing = async (partnerId, storeName, force = false) => {
    if (!force && pricing[partnerId] && (pricing[partnerId].loading || pricing[partnerId].loaded)) return
    setPricing(p => ({ ...p, [partnerId]: { loading: true } }))
    const blank = [{ itemId: '', item: '', unitPrice: '', qty: '', description: '' }]
    try {
      const res = await jerkyApi(`/api/jerky/store-pricing?partner=${partnerId}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPricing(p => ({ ...p, [partnerId]: { loaded: true, error: j.error || 'Could not load pricing.' } }))
        setInvForm(f => f[partnerId] ? f : ({ ...f, [partnerId]: { txnDate: todayISO(), dueDate: '', memo: '', send: true, lines: blank } }))
        return
      }
      setPricing(p => ({ ...p, [partnerId]: { loaded: true, ...j } }))
      if (!j.customer) loadQbCustomers()   // offer the manual mapping picker
      // one line only — reuse the item + price from the store's last invoice, just enter qty
      const first = (j.last && j.last.lines && j.last.lines[0]) || null
      const lines = first
        ? [{ itemId: first.itemId || '', item: first.item || '', unitPrice: first.unitPrice != null ? first.unitPrice : '', qty: '', description: '' }]
        : blank
      setInvForm(f => ({ ...f, [partnerId]: { txnDate: todayISO(), dueDate: '', memo: '', send: true, lines } }))
    } catch (e) {
      setPricing(p => ({ ...p, [partnerId]: { loaded: true, error: String(e.message || e) } }))
      setInvForm(f => f[partnerId] ? f : ({ ...f, [partnerId]: { txnDate: todayISO(), dueDate: '', memo: '', send: true, lines: blank } }))
    }
  }
  const setLine = (partnerId, idx, patch) => setInvForm(f => {
    const cur = f[partnerId]; if (!cur) return f
    const lines = cur.lines.map((l, i) => i === idx ? { ...l, ...patch } : l)
    return { ...f, [partnerId]: { ...cur, lines } }
  })
  const setFormField = (partnerId, patch) => setInvForm(f => ({ ...f, [partnerId]: { ...(f[partnerId] || {}), ...patch } }))
  const submitInvoice = async (c) => {
    const form = invForm[c.id]; if (!form) return
    const lines = form.lines.filter(l => l.itemId && Number(l.qty) > 0).map(l => ({ itemId: l.itemId, item: l.item, unitPrice: Number(l.unitPrice) || 0, qty: Number(l.qty), description: l.description || undefined }))
    if (!lines.length) { setInvResult(r => ({ ...r, [c.id]: { error: 'Pick an item and enter a quantity.' } })); return }
    const pr = pricing[c.id] || {}
    if (form.send) {
      const to = form.email || (pr.customer && pr.customer.email) || "the store's QuickBooks email"
      if (!window.confirm(`This will EMAIL the invoice to ${to}.\n\nFor a test, put your own address in the "Send to" box, or uncheck the email box.\n\nSend it now?`)) return
    }
    setInvBusy(b => ({ ...b, [c.id]: true })); setInvResult(r => ({ ...r, [c.id]: null }))
    try {
      const res = await jerkyApi('/api/jerky/create-invoice', { method: 'POST', body: {
        partnerId: c.id, storeName: c.store, customerId: (pr.customer && pr.customer.id) || null,
        txnDate: form.txnDate || todayISO(), dueDate: form.dueDate || null, memo: form.memo || null,
        send: !!form.send, email: form.email || null, lines,
      } })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setInvResult(r => ({ ...r, [c.id]: { error: j.error || 'Could not create the invoice.' } })); return }
      setInvResult(r => ({ ...r, [c.id]: { ok: true, msg: `Invoice ${j.docNumber ? '#' + j.docNumber : ''} created in QuickBooks${j.sent ? ' & emailed to the store' : ''}.${j.sendError ? ' (but the email failed: ' + j.sendError + ')' : ''}` } }))
      await loadInvoices()
    } catch (e) { setInvResult(r => ({ ...r, [c.id]: { error: String(e.message || e) } })) }
    finally { setInvBusy(b => ({ ...b, [c.id]: false })) }
  }
  const openInvoicePdf = async (invId) => {
    const w = window.open('', '_blank')
    try {
      const res = await jerkyApi(`/api/jerky/invoice-pdf?id=${invId}`)
      if (!res.ok) { const j = await res.json().catch(() => ({})); if (w) w.close(); alert(j.error || 'Could not load the PDF.'); return }
      const url = URL.createObjectURL(await res.blob())
      if (w) w.location = url; else window.location = url
    } catch (e) { if (w) w.close(); alert('Could not load the PDF.') }
  }
  const emailInvoice = async (invId) => {
    const res = await jerkyApi('/api/jerky/invoice-send', { method: 'POST', body: { id: invId } })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { alert(j.error || 'Send failed.'); return }
    await loadInvoices(); alert('Emailed to the store.')
  }
  const voidInvoice = async (invId) => {
    if (!window.confirm('Void this invoice? It will be deleted from QuickBooks (and any payment reversed). This cannot be undone.')) return
    const res = await jerkyApi('/api/jerky/void-invoice', { method: 'POST', body: { id: invId } })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { alert(j.error || 'Void failed.'); return }
    await loadInvoices()
  }
  // pull the truth from QuickBooks: adds QB-made invoices, updates paid/amount, drops deleted ones
  const syncInvoices = async (silent) => {
    if (syncing) return
    setSyncing(true); if (!silent) setSyncMsg('Syncing with QuickBooks…')
    try {
      const res = await jerkyApi('/api/jerky/sync-invoices', { method: 'POST', body: {} })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setSyncMsg(j.error || 'Sync failed.'); return }
      await loadInvoices()
      setSyncMsg(`Up to date with QuickBooks${j.removed ? ` · ${j.removed} removed` : ''}${j.unmatched && j.unmatched.length ? ` · not matched: ${j.unmatched.join(', ')}` : ''}`)
    } catch (e) { setSyncMsg('Sync failed.') }
    finally { setSyncing(false) }
  }
  // load QB customers once, for mapping a store that didn't auto-match
  const loadQbCustomers = async () => {
    if (qbCustomers) return
    try {
      const res = await jerkyApi('/api/jerky/customers')
      const j = await res.json().catch(() => ({}))
      if (res.ok) setQbCustomers(j.customers || [])
    } catch (e) { /* leave null; the box shows a retry */ }
  }
  const linkCustomer = async (partnerId, storeName) => {
    const typed = (linkPick[partnerId] || '').trim()
    const match = (qbCustomers || []).find(c => c.name.toLowerCase() === typed.toLowerCase())
    if (!match) { alert('Pick a customer from the list.'); return }
    try {
      await jerkySupabase.from('consignment_partners').update({ qb_customer_id: match.id }).eq('id', partnerId)
      await ensurePricing(partnerId, storeName, true)  // re-pull with the mapping in place
    } catch (e) { alert('Could not save the mapping: ' + (e.message || e)) }
  }
  const loadProducts = async () => {
    try {
      const { data } = await jerkySupabase.from('products').select('*').order('sort')
      const rows = data || []
      const mapP = p => ({ name: p.name, color: p.color, week: p.week_units, month: p.month_units, price: p.price })
      setPRODUCTS(rows.filter(p => p.line === 'bags').map(mapP))       // flavor grid stays bags-only
      setBoardsProducts(rows.filter(p => p.line === 'boards').map(mapP))
      setCampProducts(rows.filter(p => p.line === 'camp').map(mapP))
    } catch (e) { console.error('loadProducts failed', e) }
  }
  const loadMonthSeries = async () => {
    try {
      const { data } = await jerkySupabase.from('monthly_financials').select('*').order('sort').order('period')
      setMONTH_SERIES((data || []).map(m => ({ m: m.label, directRev: m.direct_rev, consignRev: m.consign_rev, cogs: m.cogs, adSpend: m.ad_spend, opexNonAd: m.opex_non_ad, boardRev: m.board_rev || 0, campRev: m.camp_rev || 0, boardCogs: m.board_cogs || 0, campCogs: m.camp_cogs || 0 })))
    } catch (e) { console.error('loadMonthSeries failed', e) }
  }
  const loadSettings = async () => {
    try {
      const { data } = await jerkySupabase.from('settings').select('*')
      const rows = data || []
      const num = k => { const r = rows.find(x => x.key === k); return r != null && r.value != null ? Number(r.value) : null }
      const cpb = num('cost_per_bag'); if (cpb != null) setCostPerBag(cpb)
      const bc = num('board_cost'); if (bc != null) setBoardCost(bc)
      const cc = num('camp_cost'); if (cc != null) setCampCost(cc)
    } catch (e) { console.error('loadSettings failed', e) }
  }
  const loadGL = async () => {
    try {
      // Supabase caps a select at 1000 rows — page through until exhausted.
      const all = []
      const size = 1000
      for (let from = 0; ; from += size) {
        const { data, error } = await jerkySupabase
          .from('gl_transactions').select('*').order('txn_date').range(from, from + size - 1)
        if (error) throw error
        all.push(...(data || []))
        if (!data || data.length < size) break
      }
      setGlTx(all)
    } catch (e) { console.error('loadGL failed', e); setGlTx([]) }
  }
  const loadCoA = async () => {
    try {
      const { data } = await jerkySupabase.from('coa_accounts').select('*')
      setCoaTx(data || [])
    } catch (e) { console.error('loadCoA failed', e); setCoaTx([]) }
  }
  // QuickBooks' own statements, as the nightly sync pulled them. The derived
  // statements are reconciled against these — a silent drift in the ledger
  // shows as a mismatch instead of going unnoticed.
  const loadQbo = async () => {
    try {
      const res = await loadQboStatements(jerkySupabase, 'jerky')
      setQbo(res.error ? null : res)
    } catch (e) { console.error('loadQbo failed', e); setQbo(null) }
  }
  const loadRole = async () => {
    try {
      const email = (await jerkySupabase.auth.getUser()).data.user?.email
      if (!email) { setRole('owner'); return }
      const { data } = await jerkySupabase.from('user_roles').select('role').ilike('email', email).maybeSingle()
      setRole(data?.role === 'counter' ? 'counter' : 'owner')
    } catch (e) { console.error('loadRole failed', e); setRole('owner') }
  }
  const saveShelfCount = async (partnerId, count) => {
    try {
      await jerkySupabase.rpc('set_shelf_count', { p_partner: partnerId, p_count: Number(count) || 0 })
      await loadConsign()
    } catch (e) { console.error('saveShelfCount failed', e) }
  }
  const loadAll = async () => {
    await Promise.all([loadRole(), loadConsign(), loadDirect(), loadAds(), loadExpenses(), loadInvoices(), loadProducts(), loadMonthSeries(), loadSettings(), loadGL(), loadCoA(), loadQbo()])
    setDataLoaded(true)
  }

  useEffect(() => {
    jerkySupabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true) })
    const { data: sub } = jerkySupabase.auth.onAuthStateChange((_evt, s) => { setSession(s) })
    return () => { sub.subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/jerky-munch' }).catch(() => {})
    }
  }, [])
  useEffect(() => {
    if (session) loadAll()
    else setDataLoaded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  // reconcile the invoice list with QuickBooks once, when the owner opens the tab
  const invSyncedRef = useRef(false)
  useEffect(() => {
    if (tab === 'invoices' && session && role === 'owner' && !invSyncedRef.current) {
      invSyncedRef.current = true
      syncInvoices(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, session, role])

  const doLogin = async () => {
    setLoginError('')
    const { error } = await jerkySupabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword })
    if (error) setLoginError('Incorrect email or password.')
  }
  const doSignOut = async () => { try { await jerkySupabase.auth.signOut() } catch (e) { console.error('signOut failed', e) } }
  const doChangePw = async () => {
    setChangePwMsg('')
    if ((newPw || '').length < 6) { setChangePwMsg('Use at least 6 characters.'); return }
    if (newPw !== newPw2) { setChangePwMsg('Passwords do not match.'); return }
    try {
      const { error } = await jerkySupabase.auth.updateUser({ password: newPw })
      if (error) { setChangePwMsg(error.message); return }
      setChangePwMsg('Password updated ✓'); setNewPw(''); setNewPw2('')
      setTimeout(() => { setShowChangePw(false); setChangePwMsg('') }, 1800)
    } catch (e) { setChangePwMsg('Something went wrong — try again.') }
  }

  const dv = (k) => draft[k] || ''
  const setDv = (k, v) => setDraft({ ...draft, [k]: v })
  // core consignment mutation — optimistic setState, then persist to Supabase.
  // Column-name translation for the two camelCase UI keys; everything else maps 1:1.
  const upd = async (id, patch, logEntry) => {
    setConsign(prev => prev.map(c => c.id === id
      ? { ...c, ...patch, log: logEntry ? [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: logEntry }, ...(c.log || [])] : c.log } : c))
    try {
      const colMap = { countedDate: 'counted_date', lastContact: 'last_contact' }
      const dbPatch = {}
      Object.keys(patch || {}).forEach(k => { dbPatch[colMap[k] || k] = patch[k] })
      if (Object.keys(dbPatch).length) await jerkySupabase.from('consignment_partners').update(dbPatch).eq('id', id)
      if (logEntry) {
        await jerkySupabase.from('consignment_log').insert({ partner_id: id, note: logEntry })
        await loadConsign()   // refresh from source of truth (skipped for silent field edits so typing stays smooth)
      }
    } catch (e) { console.error('upd failed', e) }
  }

  const logCheck = (id) => { const a = Number(dv(id + '_chk')); if (a > 0) { const c = consign.find(x => x.id === id); upd(id, { paid: c.paid + a }, `Check received ${m0(a)}`); setDv(id + '_chk', '') } }
  const logCount = (id) => { const n = dv(id + '_cnt'); if (n !== '') { upd(id, { counted: Number(n), countedDate: todayStr }, `Counted ${n} on shelf`); setDv(id + '_cnt', '') } }
  const shipMore = (id) => { const n = Number(dv(id + '_shp')); if (n > 0) { const c = consign.find(x => x.id === id); upd(id, { sent: c.sent + n }, `Shipped ${n} more units`); setDv(id + '_shp', '') } }
  const addPartner = async () => {
    if (!cf.store.trim()) return
    const row = { store: cf.store.trim(), price: Number(cf.price) || 0, sent: Number(cf.sent) || 0, returned: 0, paid: 0, counted: null, cycle: 1, restock: 'good' }
    setCf({ store: '', price: '', sent: '' }); setAdding(false)
    try {
      const { data, error } = await jerkySupabase.from('consignment_partners').insert(row).select().single()
      if (error) throw error
      if (data) await jerkySupabase.from('consignment_log').insert({ partner_id: data.id, note: 'Added consignment partner' })
      await loadConsign()
    } catch (e) { console.error('addPartner failed', e) }
  }
  const closeOut = (id) => {
    const c = consign.find(x => x.id === id); if (!c) return
    const { variance, varVal } = recon(c)
    const shelf = c.counted == null ? 0 : c.counted
    let note
    if (variance > 0) note = c.diagnosis === 'Sold but not reported (store owes me)'
      ? `Closed cycle — invoiced ${money(varVal)} for ${variance} bags the store sold but didn't report. New cycle opens at ${shelf} on the shelf.`
      : `Closed cycle — wrote off ${variance} bags (${money(varVal)})${c.diagnosis ? ` as ${c.diagnosis.toLowerCase()}` : ''}. New cycle opens at ${shelf} on the shelf.`
    else note = `Closed cycle — counts matched. New cycle opens at ${shelf} on the shelf.`
    upd(id, { sent: shelf, paid: 0, returned: 0, counted: shelf, diagnosis: '', cycle: (c.cycle || 1) + 1 }, note)
    setExpanded(null)
  }
  const addExpense = async () => {
    if (!ef.vendor.trim()) return
    const row = { vendor: ef.vendor.trim(), cat: ef.cat || 'Other', amt: Number(ef.amt) || 0, pay: 'personal' }
    setEf({ vendor: '', amt: '', cat: 'Other', pay: 'personal' }); setAddingE(false)
    try { await jerkySupabase.from('expenses').insert(row); await loadExpenses() } catch (e) { console.error('addExpense failed', e) }
  }
  const removeExpense = async (id) => { try { await jerkySupabase.from('expenses').delete().eq('id', id); await loadExpenses() } catch (e) { console.error('removeExpense failed', e) } }
  const [payBusy, setPayBusy] = useState({})
  const markInvoicePaid = async (id, paid) => {
    setPayBusy(b => ({ ...b, [id]: true }))
    try {
      const res = await jerkyApi('/api/jerky/mark-paid', { method: 'POST', body: { id, paid } })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { alert(j.error || 'Could not update payment.'); return }
      await loadInvoices()
    } catch (e) { alert('Could not update payment: ' + (e.message || e)) }
    finally { setPayBusy(b => ({ ...b, [id]: false })) }
  }
  const exportPersonal = () => {
    const rows = [['Vendor', 'Category', 'Amount', 'Paid with']]
    expenses.filter(e => e.pay === 'personal').forEach(e => rows.push([e.vendor, e.cat, e.amt, 'Personal card']))
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'personal-card-expenses.csv'
    a.click()
  }
  const exportClose = () => {
    const rows = [['Account', 'Amount'],
      ['Consignment income', cashCollected],
      ['Direct income (non-Shopify)', offlineDirectRev],
      ['Cost of goods sold', -closeCogs],
      ['Invoice stores owe you (sold, not reported)', closeAR],
      ['(Shopify online — booked via Shopify, do NOT re-enter)', shopifyRev]]
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'monthly-close-to-quickbooks.csv'
    a.click()
  }
  const importCSV = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const rows = String(ev.target.result || '').split(/\r?\n/).map(r => r.trim()).filter(Boolean)
      const out = []
      rows.forEach((r, i) => {
        const cols = r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (i === 0 && /vendor|name|descr|item/i.test(cols[0] || '')) return
        const vendor = cols[0], amt = Number((cols[1] || '').replace(/[$,]/g, ''))
        if (!vendor || !amt) return
        out.push({ vendor, cat: cols[2] || 'Other', amt, pay: 'personal' })
      })
      if (out.length) { try { await jerkySupabase.from('expenses').insert(out); await loadExpenses() } catch (err) { console.error('importCSV failed', err) } }
      e.target.value = ''
    }
    reader.readAsText(file)
  }
  const importBook = (e, setter) => { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { const rows = String(ev.target.result || '').split(/\r?\n/).filter(r => r.trim()).length; setter({ name: file.name, rows: Math.max(rows - 1, 0) }) }; reader.readAsText(file); e.target.value = '' }
  const addDirect = async () => {
    if (!df.who.trim()) return
    const row = { who: df.who.trim(), source: df.source, units: Number(df.units) || 0, rev: Number(df.rev) || 0 }
    setDf({ who: '', source: 'Shopify / online', units: '', rev: '' }); setAddingD(false)
    try { await jerkySupabase.from('direct_sales').insert(row); await loadDirect() } catch (e) { console.error('addDirect failed', e) }
  }
  const removeDirect = async (id) => { try { await jerkySupabase.from('direct_sales').delete().eq('id', id); await loadDirect() } catch (e) { console.error('removeDirect failed', e) } }
  const addAd = async () => {
    if (!af.channel.trim()) return
    const tr = af.track.trim()
    const row = { channel: af.channel.trim(), spend: Number(af.spend) || 0, rev: Number(af.rev) || 0, track: tr || 'Estimated — needs a promo code', tracked: !!tr }
    setAf({ channel: '', spend: '', rev: '', track: '' }); setAddingA(false)
    try { await jerkySupabase.from('ad_channels').insert(row); await loadAds() } catch (e) { console.error('addAd failed', e) }
  }
  const removeAd = async (id) => { try { await jerkySupabase.from('ad_channels').delete().eq('id', id); await loadAds() } catch (e) { console.error('removeAd failed', e) } }
  const changeCostPerBag = async (v) => {
    const n = Number(v) || 0
    setCostPerBag(n)
    try { await jerkySupabase.from('settings').upsert({ key: 'cost_per_bag', value: n }, { onConflict: 'key' }) } catch (e) { console.error('changeCostPerBag failed', e) }
  }
  const changeBoardCost = async (v) => {
    const n = Number(v) || 0
    setBoardCost(n)
    try { await jerkySupabase.from('settings').upsert({ key: 'board_cost', value: n }, { onConflict: 'key' }) } catch (e) { console.error('changeBoardCost failed', e) }
  }
  const changeCampCost = async (v) => {
    const n = Number(v) || 0
    setCampCost(n)
    try { await jerkySupabase.from('settings').upsert({ key: 'camp_cost', value: n }, { onConflict: 'key' }) } catch (e) { console.error('changeCampCost failed', e) }
  }
  // optimistic field edit on keystroke — persist without a reload so the input keeps focus/caret
  const setAdField = async (id, f, v) => {
    setAds(prev => prev.map(a => a.id !== id ? a : (f === 'track' ? { ...a, track: v, tracked: v.trim().length > 0 } : { ...a, [f]: Number(v) || 0 })))
    try {
      const patch = f === 'track' ? { track: v, tracked: v.trim().length > 0 } : { [f]: Number(v) || 0 }
      await jerkySupabase.from('ad_channels').update(patch).eq('id', id)
    } catch (e) { console.error('setAdField failed', e) }
  }

  // aggregates
  const R = consign.filter(c => (c.type || 'consignment') === 'consignment').map(c => ({ ...c, ...recon(c) }))
    .sort((a, b) => (a.region || '').localeCompare(b.region || '') || (a.store || '').localeCompare(b.store || ''))
  const cashCollected = consign.reduce((s, c) => s + c.paid, 0)
  const invUnpaid = storeInvoices.filter(i => i.status === 'unpaid')
  const isOverdue = (i) => i.status === 'unpaid' && i.dueDate && i.dueDate < todayStr
  const totalAR = invUnpaid.reduce((s, i) => s + i.amount, 0)
  const overdueAR = storeInvoices.filter(isOverdue).reduce((s, i) => s + i.amount, 0)
  const collectedAR = storeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const onShelfVal = R.reduce((s, c) => s + Math.max(c.expected, 0) * c.price, 0)
  const missUnits = R.reduce((s, c) => s + (c.variance > 0 ? c.variance : 0), 0)
  const missVal = R.reduce((s, c) => s + (c.variance > 0 ? c.varVal : 0), 0)
  const worst = R.filter(c => c.variance > 0).sort((a, b) => b.variance - a.variance)[0]
  const directRev = direct.reduce((s, d) => s + d.rev, 0)
  const directUnits = direct.reduce((s, d) => s + d.units, 0)
  const adSpend = ads.reduce((s, a) => s + a.spend, 0)
  const adRev = ads.reduce((s, a) => s + a.rev, 0)
  const redAds = ads.filter(a => a.rev / a.spend < 1)
  const wastedSpend = redAds.reduce((s, a) => s + a.spend, 0)
  const wastedReturn = redAds.reduce((s, a) => s + a.rev, 0)
  const revenue = directRev + cashCollected
  const totalExp = expenses.reduce((s, e) => s + e.amt, 0)
  const personalExp = expenses.filter(e => e.pay === 'personal').reduce((s, e) => s + e.amt, 0)
  const personalItems = expenses.filter(e => e.pay === 'personal').length
  const businessExp = totalExp - personalExp

  // P&L
  const pct = (n) => revenue ? Math.round(n / revenue * 100) : 0
  const soldBags = directUnits + R.reduce((s, c) => s + c.paidUnits, 0)
  const cogs = soldBags * costPerBag
  const directProfit = directRev - directUnits * costPerBag
  const opexNonAd = expenses.filter(e => !COGS_CATS.includes(e.cat)).reduce((s, e) => s + e.amt, 0)
  const grossProfit = revenue - cogs
  const totalOpex = opexNonAd + adSpend
  const netProfit = grossProfit - totalOpex
  const bagsPeriod = PRODUCTS.reduce((s, p) => s + p[period], 0)
  const bagsOut = R.reduce((s, c) => s + Math.max(c.expected, 0), 0)

  // ── Boards & Camp product lines (live current-month figures) ──
  // Revenue = Σ(month_units × price); COGS = Σ(month_units × per-unit cost setting)
  const boardsUnitsM = boardsProducts.reduce((s, p) => s + (p.month || 0), 0)
  const campUnitsM = campProducts.reduce((s, p) => s + (p.month || 0), 0)
  const boardsRevM = boardsProducts.reduce((s, p) => s + (p.month || 0) * (p.price || 0), 0)
  const campRevM = campProducts.reduce((s, p) => s + (p.month || 0) * (p.price || 0), 0)
  const boardsCogsM = boardsUnitsM * boardCost
  const campCogsM = campUnitsM * campCost
  const bcRevM = boardsRevM + campRevM
  const bcCogsM = boardsCogsM + campCogsM
  // period-aware unit counts for the overview product grid header/cards
  const boardsUnitsP = boardsProducts.reduce((s, p) => s + (p[period] || 0), 0)
  const campUnitsP = campProducts.reduce((s, p) => s + (p[period] || 0), 0)

  // Revenue by product line: bags (live) + premium boards + camp packages
  const productMix = [
    { line: 'Jerky bags', units: bagsPeriod, unit: 'bags', rev: revenue, color: KRAFT, to: 'direct' },
    { line: 'Jerky boards', units: boardsUnitsM, unit: 'boards', rev: boardsRevM, color: SPICE, to: 'direct' },
    { line: 'Camp packages', units: campUnitsM, unit: 'packages', rev: campRevM, color: '#8A5A2B', to: 'direct' },
  ]
  const totalRevenue = productMix.reduce((s, p) => s + p.rev, 0)   // bags + boards + camp
  // P&L totals that include boards + camp (bag vars above stay bag-only for the
  // consignment/close tabs; board & camp per-unit cost are editable settings)
  const pnlCogs = cogs + bcCogsM
  const pnlGross = totalRevenue - pnlCogs
  const pnlNet = pnlGross - totalOpex
  const pnlPct = (n) => totalRevenue ? Math.round(n / totalRevenue * 100) : 0

  // monthly close → QB (Shopify online excluded — it books through Shopify, no double-count)
  const shopifyRev = direct.filter(d => d.source === 'Shopify / online').reduce((s, d) => s + d.rev, 0)
  const offlineDirectRev = direct.filter(d => d.source !== 'Shopify / online').reduce((s, d) => s + d.rev, 0)
  const offlineDirectUnits = direct.filter(d => d.source !== 'Shopify / online').reduce((s, d) => s + d.units, 0)
  const consignUnits = R.reduce((s, c) => s + c.paidUnits, 0)
  const closeIncome = cashCollected + offlineDirectRev
  const closeUnits = consignUnits + offlineDirectUnits
  const closeCogs = closeUnits * costPerBag
  const closeAR = R.filter(c => c.variance > 0 && c.diagnosis === 'Sold but not reported (store owes me)').reduce((s, c) => s + c.varVal, 0)

  // multi-month series — current month appended live so interactivity flows through
  const thisMonth = new Date().toLocaleString('en-US', { month: 'short' })
  const monthsAll = [...MONTH_SERIES, { m: thisMonth, directRev, consignRev: cashCollected, cogs, adSpend, opexNonAd, boardRev: boardsRevM, campRev: campRevM, boardCogs: boardsCogsM, campCogs: campCogsM }]
  const lines = monthsAll.slice(-pnlMonths).map(mLine)
  const lastL = lines[lines.length - 1]
  const baseL = lines[0]
  const tMovers = [
    { label: 'direct sales', key: 'directRev', cost: false },
    { label: 'consignment', key: 'consignRev', cost: false },
    { label: 'cost of goods', key: 'cogs', cost: true },
    { label: 'advertising', key: 'ad', cost: true },
    { label: 'other operating costs', key: 'otherOpex', cost: true },
  ].map(d => ({ ...d, delta: (d.cost ? -lastL[d.key] : lastL[d.key]) - (d.cost ? -baseL[d.key] : baseL[d.key]) }))
  const tBest = tMovers.slice().sort((a, b) => b.delta - a.delta)[0]
  const tWorst = tMovers.slice().sort((a, b) => a.delta - b.delta)[0]
  const tNetDelta = lastL.net - baseL.net
  const tRevDelta = lastL.rev - baseL.rev
  const rangeNet = lines.reduce((s, l) => s + l.net, 0)
  const rangeRev = lines.reduce((s, l) => s + l.rev, 0)

  // date-range aggregation — P&L summed across a chosen month span (e.g. Jan–Mar)
  const rngA = Math.min(rangeStart, monthsAll.length - 1)
  const rngB = Math.min(Math.max(rangeEnd, rngA), monthsAll.length - 1)
  const rngLines = monthsAll.slice(rngA, rngB + 1).map(mLine)
  const rngAgg = {}
  PNL_ROWS.forEach(r => { rngAgg[r.key] = rngLines.reduce((s, l) => s + (l[r.key] || 0), 0) })
  const rngLabel = monthsAll.length ? `${monthsAll[rngA].m}–${monthsAll[rngB].m}` : ''

  // real books, derived from the imported QuickBooks GL + Chart of Accounts
  const glPnl = glTx.length ? buildPnl(glTx, coaTx) : null
  const glBS = glTx.length ? buildBalanceSheet(glTx, coaTx) : null
  const qbBS = qbo ? balanceSheetAsOf(qbo.bs) : null
  const glCF = glTx.length ? buildCashFlow(glTx, coaTx) : null
  const glAds = glTx.length ? buildAdSpend(glTx, coaTx) : null
  const glAsOf = glPnl && glPnl.lastDate ? new Date(glPnl.lastDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  // Financials P&L: pick any month range, optionally compare to another range
  const finM = glPnl ? glPnl.months : []
  const finN = finM.length
  const finClamp = (i) => Math.min(Math.max(i, 0), Math.max(finN - 1, 0))
  // default period = the latest COMPLETE month (skip the current, still-filling month)
  const nowKey = new Date().toISOString().slice(0, 7)
  let lastCompleteIdx = Math.max(finN - 1, 0)
  for (let i = finN - 1; i >= 0; i--) { if (finM[i].key < nowKey) { lastCompleteIdx = i; break } }
  const lastCompleteLabel = finM[lastCompleteIdx] ? finM[lastCompleteIdx].label : ''
  const aFrom = finClamp(finFrom == null ? lastCompleteIdx : finFrom), aTo = finClamp(finTo == null ? lastCompleteIdx : finTo)
  const bFrom = finClamp(finCmpFrom), bTo = finClamp(finCmpTo)
  const finKeys = (i, j) => { const lo = Math.min(i, j), hi = Math.max(i, j); return [finM[lo] && finM[lo].key, finM[hi] && finM[hi].key] }
  const finRangeLabel = (i, j) => { if (!finN) return ''; const lo = Math.min(i, j), hi = Math.max(i, j); return lo === hi ? finM[lo].label : `${finM[lo].label} – ${finM[hi].label}` }
  const cmpOn = finCmpOn && finN > 0
  const stmtA = glPnl ? periodPnl(glTx, coaTx, ...finKeys(aFrom, aTo)) : null
  const stmtB = (glPnl && cmpOn) ? periodPnl(glTx, coaTx, ...finKeys(bFrom, bTo)) : null
  // Overview range — defaults to the latest complete month
  const ovDefault = lastCompleteIdx
  const ovF = finClamp(ovFrom == null ? ovDefault : ovFrom)
  const ovT = finClamp(ovTo == null ? ovDefault : ovTo)
  const ovStmt = glPnl ? periodPnl(glTx, coaTx, ...finKeys(ovF, ovT)) : null
  const rngPct = (n) => rngAgg.rev ? Math.round(n / rngAgg.rev * 100) : 0
  const rngMonthCount = rngB - rngA + 1

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '20px' }
  const lbl = { fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#96866C' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '2px', background: CREAM, color: INK, outline: 'none', fontFamily: 'inherit' }
  const big = { fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.1px', cursor: 'pointer' }

  // ── auth gate render paths ─────────────────────────────────────────
  const centered = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }
  const FontHead = (
    <Head>
      <title>{`${BIZ} — Dashboard`}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <link rel="manifest" href="/jerky-munch.webmanifest" />
      <meta name="theme-color" content="#2B2018" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Jerky Munch" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/jerky-icon-192.png" />
      <link rel="icon" href="/jerky-icon.svg" />
    </Head>
  )
  if (!authChecked) return (<>{FontHead}<div style={{ ...centered, background: CREAM, color: MUTED }}>Loading…</div></>)
  if (!session) return (
    <>
      {FontHead}
      <div style={{ ...centered, background: CHAR, padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '360px', background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '32px 28px' }}>
          <div style={{ ...big, fontSize: '28px', letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: SPICE }}>Jerky</span> <span style={{ color: '#E0863A' }}>Munch</span>
          </div>
          <div style={{ ...lbl, color: '#96866C', marginTop: '9px' }}>Sign in to your dashboard</div>
          <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doLogin() }} type="email" placeholder="Email" autoComplete="email" style={{ ...inp, width: '100%' }} />
            <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doLogin() }} type="password" placeholder="Password" autoComplete="current-password" style={{ ...inp, width: '100%' }} />
            {loginError && <div style={{ color: RED, fontSize: '13px' }}>{loginError}</div>}
            <button onClick={doLogin} style={{ background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '12px', ...btn, marginTop: '4px' }}>Sign in</button>
          </div>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: '#8A7A66', marginTop: '22px', lineHeight: 1.6 }}>Built &amp; maintained by <span style={{ color: SPICE, fontWeight: 600 }}>JK No Jokes Financials</span></div>
        </div>
      </div>
    </>
  )
  if (!dataLoaded) return (<>{FontHead}<div style={{ ...centered, background: CREAM, color: MUTED }}>Loading your data…</div></>)

  // ── count-only staff view: shelf counts, nothing else ──
  if (role === 'counter') {
    const stores = consign.filter(c => (c.type || 'consignment') === 'consignment')
      .sort((a, b) => (a.region || 'zz').localeCompare(b.region || 'zz') || a.store.localeCompare(b.store))
    return (
      <>
        {FontHead}
        <div style={{ minHeight: '100vh', background: CREAM, padding: '20px 16px 60px', maxWidth: '620px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ ...big, fontSize: '22px' }}><span style={{ color: SPICE }}>Jerky</span> <span style={{ color: '#E0863A' }}>Munch</span></div>
            <button onClick={doSignOut} style={{ background: 'none', border: 'none', color: MUTED, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
          </div>
          <div style={{ ...big, fontSize: '18px', color: INK }}>Shelf counts</div>
          <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5, margin: '4px 0 18px' }}>For each store, type how many bags are on the shelf right now and tap Save.</p>
          {stores.length === 0 && <div style={{ ...card, color: MUTED, fontSize: '13px' }}>No consignment stores yet.</div>}
          {stores.map((c, i) => {
            const showHeader = i === 0 || stores[i - 1].region !== c.region
            const key = 'ct_' + c.id
            const val = draft[key] !== undefined ? draft[key] : (c.counted == null ? '' : String(c.counted))
            const saved = draft[key + '_ok']
            return (
              <Fragment key={c.id}>
                {showHeader && <div style={{ ...lbl, color: SPICE, fontSize: '12px', margin: i === 0 ? '2px 0 8px' : '20px 0 8px' }}>{c.region || 'Other'}</div>}
                <div style={{ ...card, padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: INK, fontSize: '16px' }}>{c.store}</div>
                    <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '2px' }}>{c.countedDate ? `last counted ${fmtD(c.countedDate)}` : 'never counted'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input value={val} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value, [key + '_ok']: false }))} type="number" inputMode="numeric" placeholder="on shelf" style={{ ...inp, width: '92px', textAlign: 'center', fontSize: '16px' }} />
                    <button onClick={async () => { await saveShelfCount(c.id, val); setDraft(d => ({ ...d, [key + '_ok']: true })) }} style={{ background: saved ? GREEN : CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '11px 16px', ...btn }}>{saved ? 'Saved ✓' : 'Save'}</button>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>
      </>
    )
  }

  const KPI = ({ k, v, sub, accent, onClick }) => (
    <div onClick={onClick} className={onClick ? 'jm-click' : undefined} style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px', position: 'relative', ...(onClick ? { cursor: 'pointer' } : {}) }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: '#A2937A', marginTop: '3px' }}>{sub}</div>
      {onClick && <span style={{ position: 'absolute', top: '11px', right: '13px', color: '#C6B79A', fontSize: '15px', lineHeight: 1 }}>›</span>}
    </div>
  )
  const MiniToggle = ({ value, onChange }) => (
    <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
      {[['week', 'Week'], ['month', 'Month']].map(([p, l]) => (
        <button key={p} onClick={() => onChange(p)} style={{ padding: '4px 11px', border: 'none', background: value === p ? CHAR : 'transparent', color: value === p ? CREAM : MUTED, fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
      ))}
    </div>
  )
  const Row = ({ l, v, neg, bold, top }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: MONO, fontSize: '13px', color: neg ? RED : (bold ? INK : MUTED), fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )
  const Pill = ({ value, opts, map, onChange }) => (
    <select value={value} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 12px', borderRadius: '2px', border: 'none',
        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1px', color: '#fff',
        background: `${map[value].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {opts.map(o => <option key={o.id} value={o.id} style={{ color: INK, background: '#fff' }}>{o.label}</option>)}
    </select>
  )

  const TABS = [['overview', 'Overview'], ['consign', 'Consignment'], ['invoices', 'Invoice Stores'], ['ads', 'Advertising'], ['financials', 'Financials']]
  const EXTRA = [['expenses', 'Import expenses'], ['quickbooks', 'QuickBooks sync']]
  const currentLabel = ([...TABS, ...EXTRA].find(t => t[0] === tab) || ['', ''])[1]

  return (
    <>
      <Head>
        <title>{`${BIZ} — Dashboard`}</title>
        <meta name="description" content="Every consignment store, every sale, your real profit — one screen." />
        <meta property="og:title" content="Jerky Munch — Dashboard" />
        <meta property="og:description" content="Every consignment store, every sale, your real profit — one screen." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.jknojokes.com/jerky-munch" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Jerky Munch — Dashboard" />
        <meta name="twitter:description" content="Every consignment store, every sale, your real profit — one screen." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/jerky-munch.webmanifest" />
        <meta name="theme-color" content="#2B2018" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jerky Munch" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}body{background:${CREAM};font-family:'Inter',sans-serif;color:${INK}}::placeholder{color:#A99A82}
.jm-shell{display:flex;min-height:100vh;align-items:stretch}
.jm-side{width:236px;flex-shrink:0;background:${CHAR};color:${CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.jm-nav{display:flex;flex-direction:column;gap:3px;flex:1}
.jm-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s}
.jm-navbtn:hover{background:rgba(255,255,255,.08);color:${CREAM}}
.jm-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.jm-click{transition:box-shadow .12s}.jm-click:hover{box-shadow:inset 0 0 0 1.5px ${SPICE}}
@media(max-width:860px){.jm-shell{flex-direction:column}.jm-side{width:auto;height:auto;position:static;flex-direction:column;padding:14px 12px}.jm-nav{flex-direction:row;overflow-x:auto;gap:6px;padding-bottom:4px}.jm-navbtn{width:auto;padding:8px 15px;border-radius:2px;background:rgba(255,255,255,.07)}.jm-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}}`}</style>
      </Head>

      <div className="jm-shell">
        {/* Sidebar */}
        <aside className="jm-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ ...big, fontSize: '25px', letterSpacing: '-0.5px', lineHeight: 1 }}>
              <span style={{ color: SPICE }}>Jerky</span> <span style={{ color: '#E0863A' }}>Munch</span>
            </div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: '7px' }}>Dashboard</div>
          </div>
          <nav className="jm-nav">
            {TABS.map(([id, label]) => {
              const active = tab === id
              return (
                <button key={id} className="jm-navbtn" onClick={() => { setTab(id); setExpanded(null) }}
                  style={active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : undefined}>
                  {label}
                </button>
              )
            })}
            <div style={{ ...lbl, color: '#7A6A52', fontSize: '10px', margin: '16px 14px 6px' }}>Tools</div>
            {EXTRA.map(([id, label]) => {
              const active = tab === id
              return (
                <button key={id} className="jm-navbtn" onClick={() => { setTab(id); setExpanded(null) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', ...(active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : {}) }}>
                  <span>{label}</span>
                  {id === 'quickbooks'
                    ? <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4FbE6A', flexShrink: 0 }} />
                    : id === 'askai'
                      ? <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: SPICE, padding: '2px 6px', borderRadius: '2px', flexShrink: 0 }}>NEW</span>
                      : null}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: '#8A7A66', lineHeight: 1.6 }}>Built &amp; maintained by<br /><span style={{ color: SPICE, fontWeight: 600 }}>JK No Jokes Financials</span></div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: '#8A7A66', lineHeight: 1.5, marginTop: '10px' }}>
              <span style={{ wordBreak: 'break-all' }}>{session?.user?.email}</span>
              <button onClick={doSignOut} style={{ display: 'block', marginTop: '4px', background: 'none', border: 'none', color: SPICE, fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Sign out</button>
              <button onClick={() => { setShowChangePw(v => !v); setChangePwMsg(''); setNewPw(''); setNewPw2('') }} style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: '#8A7A66', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>{showChangePw ? 'Cancel' : 'Change password'}</button>
              {showChangePw && (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '2px', color: CREAM, padding: '6px 8px', fontSize: '11px', outline: 'none', fontFamily: 'inherit' }} />
                  <input type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doChangePw() }} placeholder="Confirm new password" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '2px', color: CREAM, padding: '6px 8px', fontSize: '11px', outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={doChangePw} style={{ background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '7px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Save new password</button>
                  {changePwMsg && <div style={{ fontSize: '10px', color: changePwMsg.includes('✓') ? '#7FB389' : '#E8927C', fontFamily: MONO, lineHeight: 1.4 }}>{changePwMsg}</div>}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="jm-main">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '22px' }}>
            <div>
              <div style={{ ...lbl, color: SPICE }}>Jerky Munch</div>
              <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1 }}>{currentLabel}</h1>
            </div>
          </div>

          {/* ===== OVERVIEW ===== */}
          {tab === 'overview' && (
            <>
              {glPnl ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ ...lbl }}>Showing</span>
                    <select value={ovF} onChange={e => setOvFrom(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                    <span style={{ color: MUTED, fontSize: '13px' }}>to</span>
                    <select value={ovT} onChange={e => setOvTo(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                    <span style={{ fontSize: '12px', color: MUTED }}>· from your books</span>
                  </div>

                  <div style={{ ...card, marginBottom: '16px' }}>
                    <div style={{ ...lbl }}>Net profit · {finRangeLabel(ovF, ovT)}</div>
                    <div style={{ ...big, fontSize: 'clamp(34px,5.5vw,50px)', color: ovStmt.net >= 0 ? GREEN : RED, lineHeight: 1, margin: '4px 0 8px' }}>{ovStmt.net < 0 ? `(${m0(Math.abs(ovStmt.net))})` : m0(ovStmt.net)}</div>
                    <div style={{ fontSize: '15px', color: MUTED, maxWidth: '640px', lineHeight: 1.5 }}>
                      On <b style={{ color: INK }}>{m0(ovStmt.income.total)}</b> of revenue you kept <b style={{ color: ovStmt.net >= 0 ? GREEN : RED }}>{ovStmt.net < 0 ? `(${m0(Math.abs(ovStmt.net))})` : m0(ovStmt.net)}</b>, at a <b style={{ color: INK }}>{ovStmt.income.total ? Math.round(ovStmt.gross / ovStmt.income.total * 100) : 0}%</b> gross margin.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <KPI k="Revenue" v={m0(ovStmt.income.total)} sub={finRangeLabel(ovF, ovT)} accent={GREEN} onClick={() => setTab('financials')} />
                    <KPI k="Gross profit" v={m0(ovStmt.gross)} sub={`${ovStmt.income.total ? Math.round(ovStmt.gross / ovStmt.income.total * 100) : 0}% margin`} accent={KRAFT} onClick={() => setTab('financials')} />
                    <KPI k="Net profit" v={m0(ovStmt.net)} sub="after all costs" accent={ovStmt.net >= 0 ? GREEN : RED} onClick={() => setTab('financials')} />
                    <KPI k="Out on consignment" v={m0(onShelfVal)} sub={`${bagsOut} bags in stores`} accent={KRAFT} onClick={() => setTab('consign')} />
                    <KPI k="Missing pieces" v={`${missUnits}`} sub={`${m0(missVal)} to investigate`} accent={missUnits ? RED : GREEN} onClick={() => setTab('consign')} />
                  </div>

                  <div style={{ ...card, marginBottom: '16px' }}>
                    <div style={{ ...lbl, marginBottom: '12px' }}>Revenue &amp; net profit by month</div>
                    <div style={{ width: '100%', height: '260px' }}>
                      <ResponsiveContainer>
                        <ComposedChart data={glPnl.months.map(mm => ({ name: mm.label.replace(/ \d{4}$/, ''), Revenue: mm.income, Net: mm.net }))} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
                          <CartesianGrid stroke={BORDER} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: MUTED }} axisLine={{ stroke: BORDER }} tickLine={false} />
                          <YAxis tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={44} />
                          <Tooltip formatter={(v) => m0(v)} contentStyle={{ fontSize: '12px', borderRadius: '2px', border: `1px solid ${BORDER}` }} />
                          <Bar dataKey="Revenue" fill={KRAFT} radius={[2, 2, 0, 0]} maxBarSize={40} />
                          <Line dataKey="Net" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GREEN }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ ...card, marginBottom: '16px' }}>
                    <div style={{ ...lbl, marginBottom: '10px' }}>Revenue by channel · {finRangeLabel(ovF, ovT)}</div>
                    <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ width: '180px', height: '180px', flexShrink: 0 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={[['Invoiced wholesale', ovStmt.income.channels.invoiced], ['Private / Zelle', ovStmt.income.channels.private], ['Shopify (online)', ovStmt.income.channels.shopify], ['Consignment stores', ovStmt.income.channels.consignment], ['Store deposits', ovStmt.income.channels.deposits]].filter(d => d[1] > 0).map(d => ({ name: d[0], value: d[1] }))} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                              {[SPICE, KRAFT, GREEN, AMBER, '#8A5A2B'].map((c, i) => <Cell key={i} fill={c} />)}
                            </Pie>
                            <Tooltip formatter={(v) => m0(v)} contentStyle={{ fontSize: '12px', borderRadius: '2px', border: `1px solid ${BORDER}` }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        {[['Invoiced wholesale', ovStmt.income.channels.invoiced, SPICE], ['Private / Zelle', ovStmt.income.channels.private, KRAFT], ['Shopify (online)', ovStmt.income.channels.shopify, GREEN], ['Consignment stores', ovStmt.income.channels.consignment, AMBER], ['Store deposits', ovStmt.income.channels.deposits, '#8A5A2B']].map(([label, val, col]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: INK }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: col, flexShrink: 0 }} />{label}</span>
                            <span style={{ fontFamily: MONO }}>{m0(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '8px' }}>Figures from your QuickBooks books · synced nightly, current through {glAsOf} (the current month is still filling in).</div>
                  </div>
                </>
              ) : (
                <div style={{ ...card, marginBottom: '16px', background: '#EAF3EC', borderColor: '#CFE4D6', fontSize: '13.5px', color: INK, lineHeight: 1.55 }}>
                  Import your books on the <b style={{ cursor: 'pointer', color: SPICE }} onClick={() => setTab('quickbooks')}>QuickBooks</b> tab and your numbers show up here.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top consignment stores · collected</div>
                  {(() => {
                    const rows = consign.filter(c => (c.type || 'consignment') === 'consignment').map(c => ({ store: c.store, rev: c.paid || 0, units: c.price ? Math.round((c.paid || 0) / c.price) : 0 })).filter(s => s.rev > 0).sort((a, b) => b.rev - a.rev)
                    if (!rows.length) return <div style={{ fontSize: '13px', color: MUTED, padding: '8px 0' }}>No consignment payments recorded yet.</div>
                    const max = rows[0].rev || 1
                    return rows.slice(0, 6).map((c, i) => (
                    <div key={c.store} className="jm-click" onClick={() => setTab('consign')} style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{c.store}</span>
                        <span style={{ ...big, fontSize: '15px', color: INK }}>{m0(c.rev)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(c.rev / max * 100)}%`, height: '100%', background: KRAFT }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{c.units} bags paid</span>
                      </div>
                    </div>
                  )) })()}
                </div>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top direct sales</div>
                  {(() => {
                    const rows = direct.map(d => ({ who: d.who, source: d.source, rev: d.rev || 0, units: d.units || 0 })).filter(d => d.rev > 0).sort((a, b) => b.rev - a.rev)
                    if (!rows.length) return <div style={{ fontSize: '13px', color: MUTED, padding: '8px 0' }}>No direct sales recorded yet.</div>
                    const max = rows[0].rev || 1
                    return rows.map((d, i) => (
                    <div key={d.who + i} className="jm-click" onClick={() => setTab('quickbooks')} style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{d.who}</span>
                        <span style={{ ...big, fontSize: '15px', color: GREEN }}>{m0(d.rev)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(d.rev / max * 100)}%`, height: '100%', background: GREEN }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{d.units} bags · {d.source}</span>
                      </div>
                    </div>
                  )) })()}
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ ...lbl }}>Sold this {period}, by product</div>
                  <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: INK }}>{bagsPeriod}</b> bags · <b style={{ color: INK }}>{boardsUnitsP + campUnitsP}</b> boards &amp; camp</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
                  {[
                    ...PRODUCTS.map(p => ({ ...p, unit: 'bags' })),
                    ...(boardsProducts.length ? [{ name: 'Jerky Boards', color: '#8A2E14', week: boardsProducts.reduce((s, p) => s + (p.week || 0), 0), month: boardsUnitsM, unit: 'boards' }] : []),
                    ...(campProducts.length ? [{ name: 'Camp Packages', color: '#8A5A2B', week: campProducts.reduce((s, p) => s + (p.week || 0), 0), month: campUnitsM, unit: 'orders' }] : []),
                  ].sort((a, b) => b[period] - a[period]).map(p => (
                    <div key={p.name} style={{ border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '16px 12px 14px', textAlign: 'center', background: CREAM }}>
                      <Bag color={p.color} />
                      <div style={{ fontWeight: 600, color: INK, marginTop: '8px', fontSize: '14px' }}>{p.name}</div>
                      <div style={{ ...big, fontSize: '26px', color: INK, marginTop: '4px' }}>{p[period]}</div>
                      <div style={{ fontSize: '11px', color: MUTED }}>{p.unit} this {period}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: MUTED, marginTop: '14px' }}>These are placeholder illustrations — drop in real product photos whenever you like.</p>
              </div>
            </>
          )}

          {/* ===== CONSIGNMENT ===== */}
          {tab === 'consign' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Partners" v={consign.length} sub="stores carrying you" />
                <KPI k="Out on shelves" v={R.reduce((s, c) => s + Math.max(c.expected, 0), 0)} sub={`${m0(onShelfVal)} of product`} accent={KRAFT} />
                <KPI k="Collected" v={m0(cashCollected)} sub="checks in the door" accent={GREEN} />
                <KPI k="Missing" v={missUnits} sub={`${m0(missVal)} to chase`} accent={missUnits ? RED : GREEN} />
              </div>

              {R.some(c => c.variance > 0) && (
                <div style={{ ...card, marginBottom: '16px', background: '#FBEDE9', borderColor: '#E7C3B8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ ...lbl, color: RED }}>Money to collect</div>
                    <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: RED }}>{m0(missVal)}</b> across {R.filter(c => c.variance > 0).length} stores</div>
                  </div>
                  {R.filter(c => c.variance > 0).sort((a, b) => b.varVal - a.varVal).map((c, i) => (
                    <div key={c.id} onClick={() => setExpanded(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i ? '1px solid #F2D2CB' : 'none', cursor: 'pointer', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{c.store}</span>
                        <span style={{ fontSize: '12px', color: MUTED }}> · {c.variance} bags · {c.diagnosis ? c.diagnosis : 'needs a diagnosis'}</span>
                      </div>
                      <span style={{ ...big, fontSize: '15px', color: RED }}>{money(c.varVal)}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '10px', lineHeight: 1.5 }}>Bags gone from shelves you haven't been paid for. Tap a store to find out why — then invoice the ones the store sold and didn't report, or write off the rest at close-out.</p>
                </div>
              )}

              {!adding ? (
                <button onClick={() => setAdding(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a consignment partner</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New consignment partner</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={cf.store} onChange={e => setCf({ ...cf, store: e.target.value })} placeholder="Store name *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} type="number" placeholder="$ / unit" style={{ ...inp, flex: 1, minWidth: '90px' }} />
                    <input value={cf.sent} onChange={e => setCf({ ...cf, sent: e.target.value })} type="number" placeholder="Units sent" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addPartner} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>+ Add partner</button>
                  </div>
                </div>
              )}

              {R.map((c, idx) => {
                const open = expanded === c.id
                const showHeader = idx === 0 || (R[idx - 1] && R[idx - 1].region !== c.region)
                const badge = c.status === 'reconciled' ? { c: GREEN, t: 'Matches' } : c.status === 'short' ? { c: RED, t: `${c.variance} missing` } : c.status === 'over' ? { c: AMBER, t: `${-c.variance} over` } : { c: MUTED, t: 'Not counted' }
                return (
                  <Fragment key={c.id}>
                  {showHeader && <div style={{ ...lbl, color: SPICE, fontSize: '12px', margin: idx === 0 ? '2px 0 10px' : '24px 0 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>{c.region || 'Other'}<span style={{ flex: 1, height: '1px', background: BORDER }} /></div>}
                  <div style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? CHAR : (c.status === 'short' ? '#E7C3B8' : BORDER) }}>
                    <div onClick={() => setExpanded(open ? null : c.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ ...big, fontSize: '20px', color: INK }}>{c.store}</div>
                          <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                            {money(c.price)}/unit · sent {c.sent} · paid for {c.paidUnits} · {money(c.paid)} collected · cycle {c.cycle || 1}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: badge.c, padding: '5px 11px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{badge.t}</span>
                          {c.restock && c.restock !== 'good' && <span style={{ fontSize: '11px', fontWeight: 600, color: RM[c.restock].color, background: RM[c.restock].color + '1A', padding: '3px 10px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{RM[c.restock].label}</span>}
                        </div>
                      </div>
                      {c.variance > 0 && c.diagnosis && (
                        <div style={{ marginTop: '10px', fontSize: '12.5px', color: c.diagnosis.includes('owes') ? RED : INK, background: c.diagnosis.includes('owes') ? '#FBEDE9' : CREAM, border: `1px solid ${c.diagnosis.includes('owes') ? '#E7C3B8' : BORDER}`, borderRadius: '2px', padding: '8px 11px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.diagnosis.includes('owes') ? RED : KRAFT, flexShrink: 0 }} />
                          <span>Diagnosed: <b>{c.diagnosis}</b></span>
                        </div>
                      )}
                    </div>

                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>Price per bag</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                          <span style={{ color: MUTED }}>$</span>
                          <input value={dv(`price_${c.id}`) !== '' ? dv(`price_${c.id}`) : String(c.price)} onChange={e => setDv(`price_${c.id}`, e.target.value)} type="number" inputMode="decimal" style={{ ...inp, width: '110px', fontSize: '16px' }} />
                          <button onClick={() => { const v = Number(dv(`price_${c.id}`)); if (v > 0 && v !== c.price) { upd(c.id, { price: v }, `Set price to ${money(v)}/bag`); } setDv(`price_${c.id}`, '') }} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '10px 16px', ...btn }}>Save</button>
                          <span style={{ fontSize: '11.5px', color: MUTED }}>drives what's owed per count</span>
                        </div>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>Where the bags went</div>
                        <div style={{ background: CREAM, borderRadius: '2px', padding: '14px 16px' }}>
                          <Row l="Units sent out" v={c.sent} />
                          <Row l={`− Paid by checks (${money(c.paid)} ÷ ${money(c.price)})`} v={`−${c.paidUnits}`} />
                          <Row l="− Returned to you" v={`−${c.returned}`} />
                          <Row l="Should still be on the shelf" v={Math.max(c.expected, 0)} bold top />
                          <Row l={`Actually counted (${fmtD(c.countedDate)})`} v={c.counted == null ? '— not counted' : c.counted} />
                          <Row
                            l={c.variance > 0 ? 'Missing — unaccounted for' : c.variance < 0 ? 'Overage — recount' : 'Matches perfectly'}
                            v={c.variance > 0 ? `${c.variance}  (${money(c.varVal)})` : c.variance < 0 ? `${-c.variance}` : '0'}
                            neg={c.variance > 0} bold top />
                        </div>

                        {c.variance > 0 && (
                          <div style={{ marginTop: '14px' }}>
                            <div style={{ ...lbl, marginBottom: '6px' }}>Why are {c.variance} missing?</div>
                            <select value={c.diagnosis} onChange={e => upd(c.id, { diagnosis: e.target.value }, `Diagnosed missing units: ${e.target.value || 'cleared'}`)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                              {DIAGNOSES.map(d => <option key={d} value={d}>{d || 'Pick a reason…'}</option>)}
                            </select>
                            {c.diagnosis === 'Sold but not reported (store owes me)' && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: RED, background: '#FBEDE9', borderRadius: '2px', padding: '9px 12px' }}>
                                Then <b>{c.store}</b> owes you <b>{money(c.varVal)}</b>. Send them an invoice for the {c.variance} units.
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ ...lbl, margin: '16px 0 8px' }}>Update this account</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_chk')} onChange={e => setDv(c.id + '_chk', e.target.value)} type="number" placeholder="Check $" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCheck(c.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_cnt')} onChange={e => setDv(c.id + '_cnt', e.target.value)} type="number" placeholder="Count on shelf" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCount(c.id)} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_shp')} onChange={e => setDv(c.id + '_shp', e.target.value)} type="number" placeholder="Ship more" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => shipMore(c.id)} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Ship</button>
                          </div>
                        </div>

                        <div style={{ ...lbl, margin: '18px 0 8px' }}>Store relationship</div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: MUTED }}>Last spoke: <b style={{ color: INK }}>{fmtD(c.lastContact)}</b>{c.lastContact ? ` · ${daysSince(c.lastContact)}d ago` : ''}</span>
                          <button onClick={() => upd(c.id, { lastContact: todayStr }, 'Spoke with the store')} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '2px', padding: '5px 13px', ...btn, fontSize: '11px' }}>Spoke today</button>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: MUTED }}>Do they need more?</span>
                          <select value={c.restock || 'good'} onChange={e => upd(c.id, { restock: e.target.value })} style={{ ...inp, cursor: 'pointer', maxWidth: '200px' }}>
                            {RESTOCK.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                          </select>
                        </div>
                        <textarea value={c.notes || ''} onChange={e => upd(c.id, { notes: e.target.value })} rows={2} placeholder="Notes — who you talk to, what they like, what they said…" style={{ ...inp, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />

                        <div style={{ ...lbl, margin: '18px 0 6px' }}>End of cycle</div>
                        <button onClick={() => { if (window.confirm(`Close out cycle ${c.cycle || 1} for ${c.store}? This settles the ${c.variance > 0 ? c.variance + ' missing bags' : 'count'} and starts a fresh cycle from the ${c.counted == null ? 0 : c.counted} bags on the shelf now.`)) closeOut(c.id) }} style={{ width: '100%', background: 'none', color: INK, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '12px', ...btn }}>Close out this cycle →</button>
                        <p style={{ fontSize: '12px', color: MUTED, marginTop: '7px', lineHeight: 1.5 }}>
                          {c.variance > 0
                            ? <>Settles the <b>{c.variance} missing</b> {c.diagnosis === 'Sold but not reported (store owes me)' ? <>by <b style={{ color: RED }}>invoicing the store {money(c.varVal)}</b></> : <>as a <b>write-off</b></>}, then resets the count clean for the next delivery — so old gaps never bleed into the new cycle.</>
                            : <>Reconciles clean and resets the count for the next delivery — so old numbers never bleed into the new cycle.</>}
                        </p>

                        {(c.log || []).length > 0 && (
                          <div style={{ marginTop: '16px', borderTop: `1px solid ${CREAM}`, paddingTop: '12px' }}>
                            <div style={{ ...lbl, marginBottom: '8px' }}>History</div>
                            {c.log.map((e, i) => (
                              <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '3px 0' }}>
                                <span style={{ color: '#BFB096', fontFamily: MONO, marginRight: '8px' }}>{e.at}</span>{e.t}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </Fragment>
                )
              })}
            </>
          )}

          {/* ===== INVOICE STORES (A/R ledger) ===== */}
          {tab === 'invoices' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Owed to you" v={m0(totalAR)} sub={`${invUnpaid.length} unpaid invoices`} accent={KRAFT} />
                <KPI k="Overdue" v={m0(overdueAR)} sub="past due date" accent={overdueAR > 0 ? RED : GREEN} />
                <KPI k="Collected" v={m0(collectedAR)} sub="invoices paid" accent={GREEN} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button disabled={syncing} onClick={() => syncInvoices(false)} style={{ background: 'none', color: CHAR, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '9px 15px', ...btn, fontSize: '13px', cursor: syncing ? 'default' : 'pointer' }}>{syncing ? 'Syncing…' : '↻ Sync with QuickBooks'}</button>
                {syncMsg && <span style={{ fontSize: '12px', color: MUTED }}>{syncMsg}</span>}
              </div>

              {(() => {
                const inv = consign.filter(c => c.type === 'invoice').slice().sort((a, b) => (a.region || '').localeCompare(b.region || '') || (a.store || '').localeCompare(b.store || ''))
                if (!inv.length) return <div style={{ ...card, color: MUTED, fontSize: '13px' }}>No invoice accounts yet.</div>
                return inv.map((c, idx) => {
                  const open = expanded === c.id
                  const showHeader = idx === 0 || inv[idx - 1].region !== c.region
                  const mine = storeInvoices.filter(i => i.partnerId === c.id).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  const balance = mine.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0)
                  const anyOverdue = mine.some(isOverdue)
                  return (
                    <Fragment key={c.id}>
                      {showHeader && <div style={{ ...lbl, color: SPICE, fontSize: '12px', margin: idx === 0 ? '2px 0 10px' : '24px 0 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>{c.region || 'Other'}<span style={{ flex: 1, height: '1px', background: BORDER }} /></div>}
                      <div style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? CHAR : (anyOverdue ? '#E7C3B8' : BORDER) }}>
                        <div onClick={() => { const willOpen = !open; setExpanded(willOpen ? c.id : null); if (willOpen) ensurePricing(c.id, c.store) }} style={{ padding: '15px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ ...big, fontSize: '20px', color: INK }}>{c.store}</div>
                            <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{mine.length} invoice{mine.length === 1 ? '' : 's'} · {mine.filter(i => i.status === 'unpaid').length} open</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <div style={{ ...big, fontSize: '20px', color: balance > 0 ? KRAFT : GREEN }}>{m0(balance)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: MUTED }}>outstanding</span>
                              {anyOverdue && <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', background: RED, padding: '3px 9px', borderRadius: '2px', whiteSpace: 'nowrap' }}>Overdue</span>}
                            </div>
                          </div>
                        </div>

                        {open && (
                          <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                            <div style={{ ...lbl, margin: '14px 0 8px' }}>Invoices</div>
                            {mine.length === 0
                              ? <div style={{ fontSize: '13px', color: MUTED, padding: '4px 0 6px' }}>No invoices yet.</div>
                              : mine.map((i, ii) => {
                                const od = isOverdue(i)
                                const pill = i.status === 'paid' ? { c: GREEN, t: 'Paid' } : od ? { c: RED, t: 'Overdue' } : { c: AMBER, t: 'Unpaid' }
                                return (
                                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 0', borderTop: ii ? `1px solid ${CREAM}` : 'none' }}>
                                    <div style={{ minWidth: '140px' }}>
                                      <div style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{m0(i.amount)}<span style={{ fontFamily: MONO, fontSize: '11px', color: '#BFB096', marginLeft: '8px' }}>{fmtD(i.date)}</span></div>
                                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{i.description || (i.units && i.unitPrice ? `${i.units} × ${money(i.unitPrice)}` : '—')}{i.dueDate ? ` · due ${fmtD(i.dueDate)}` : ''}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      {i.qbDocNumber && <span style={{ fontFamily: MONO, fontSize: '11px', color: '#BFB096' }}>#{i.qbDocNumber}</span>}
                                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#fff', background: pill.c, padding: '4px 10px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{pill.t}</span>
                                      {i.qbInvoiceId && <button onClick={() => openInvoicePdf(i.id)} style={{ background: 'none', color: CHAR, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '6px 10px', ...btn, fontSize: '12px' }}>PDF</button>}
                                      {i.qbInvoiceId && <button onClick={() => emailInvoice(i.id)} style={{ background: 'none', color: CHAR, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '6px 10px', ...btn, fontSize: '12px' }}>{i.sentAt ? 'Re-email' : 'Email'}</button>}
                                      <button disabled={payBusy[i.id]} onClick={() => markInvoicePaid(i.id, i.status !== 'paid')} style={{ background: i.status === 'paid' ? 'none' : GREEN, color: i.status === 'paid' ? MUTED : '#fff', border: i.status === 'paid' ? `1px solid ${BORDER}` : 'none', borderRadius: '2px', padding: '6px 12px', ...btn, fontSize: '12px', cursor: payBusy[i.id] ? 'default' : 'pointer' }}>{payBusy[i.id] ? '…' : (i.status === 'paid' ? 'Mark unpaid' : 'Mark paid')}</button>
                                      {i.qbInvoiceId && i.status !== 'paid' && <button onClick={() => voidInvoice(i.id)} style={{ background: 'none', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '6px 10px', ...btn, fontSize: '12px' }}>Void</button>}
                                    </div>
                                  </div>
                                )
                              })}

                            <div style={{ ...lbl, margin: '18px 0 8px' }}>New invoice</div>
                            <div style={{ background: CREAM, borderRadius: '2px', padding: '14px 16px' }}>
                              {(() => {
                                const pr = pricing[c.id] || {}
                                const form = invForm[c.id]
                                if (pr.loading || !form) return <div style={{ fontSize: '13px', color: MUTED }}>Loading this store's last invoice…</div>
                                const items = pr.items || []
                                const lineTotal = form.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0)
                                return (
                                  <>
                                    {pr.customer
                                      ? <div style={{ fontSize: '12px', color: MUTED, marginBottom: '10px', lineHeight: 1.5 }}>QuickBooks customer: <b style={{ color: INK }}>{pr.customer.name}</b>{pr.last ? <> · prices prefilled from invoice{pr.last.docNumber ? ` #${pr.last.docNumber}` : ''} — just set the qty</> : ' · no prior invoice, pick a product'}</div>
                                      : <div style={{ marginBottom: '12px' }}>
                                          <div style={{ fontSize: '12px', color: AMBER, marginBottom: '8px', lineHeight: 1.5 }}>{pr.error || pr.matchError || 'Not matched to a QuickBooks customer'} — link this store to its QuickBooks customer once:</div>
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <input list={`qbc_${c.id}`} value={linkPick[c.id] || ''} onChange={e => setLinkPick(v => ({ ...v, [c.id]: e.target.value }))} onFocus={loadQbCustomers} placeholder={qbCustomers ? 'Type a QuickBooks customer…' : 'Loading customers…'} style={{ ...inp, flex: '2 1 180px' }} />
                                            <datalist id={`qbc_${c.id}`}>{(qbCustomers || []).map(qc => <option key={qc.id} value={qc.name} />)}</datalist>
                                            <button onClick={() => linkCustomer(c.id, c.store)} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '10px 16px', ...btn }}>Link</button>
                                          </div>
                                        </div>}
                                    {(() => {
                                      const l = form.lines[0] || { itemId: '', item: '', unitPrice: '', qty: '' }
                                      const showLabel = l.item && (l.itemId || !items.length)
                                      return (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                                          {showLabel
                                            ? <div style={{ flex: '2 1 150px', fontWeight: 600, color: INK, fontSize: '14px' }}>{l.item}</div>
                                            : <select value={l.itemId} onChange={e => { const it = items.find(x => x.id === e.target.value); setLine(c.id, 0, { itemId: e.target.value, item: it ? it.name : '', unitPrice: (l.unitPrice !== '' && l.unitPrice != null) ? l.unitPrice : (it && it.unitPrice != null ? it.unitPrice : '') }) }} style={{ ...inp, flex: '2 1 150px' }}>
                                                <option value="">Choose product…</option>
                                                {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                              </select>}
                                          <input value={l.unitPrice} onChange={e => setLine(c.id, 0, { unitPrice: e.target.value })} type="number" inputMode="decimal" placeholder="$ / bag" style={{ ...inp, flex: '1 1 90px', minWidth: '80px' }} />
                                          <input value={l.qty} onChange={e => setLine(c.id, 0, { qty: e.target.value })} type="number" inputMode="numeric" placeholder="Qty" style={{ ...inp, flex: '1 1 80px', minWidth: '70px', fontWeight: 600, fontSize: '16px' }} autoFocus />
                                        </div>
                                      )
                                    })()}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <label style={{ flex: '1 1 130px' }}><span style={{ fontSize: '11px', color: MUTED }}>Invoice date</span><input value={form.txnDate} onChange={e => setFormField(c.id, { txnDate: e.target.value })} type="date" style={{ ...inp, width: '100%', marginTop: '2px' }} /></label>
                                      <label style={{ flex: '1 1 130px' }}><span style={{ fontSize: '11px', color: MUTED }}>Due date (optional)</span><input value={form.dueDate} onChange={e => setFormField(c.id, { dueDate: e.target.value })} type="date" style={{ ...inp, width: '100%', marginTop: '2px' }} /></label>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: INK, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={form.send} onChange={e => setFormField(c.id, { send: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                      Email it from accounting@jerkymunch.com{!form.email && pr.customer && pr.customer.email ? ` (to ${pr.customer.email})` : ''}
                                    </label>
                                    {form.send && (
                                      <input value={form.email || ''} onChange={e => setFormField(c.id, { email: e.target.value })} type="email" inputMode="email" placeholder="Send to (blank = the store's email) — put your address here to test" style={{ ...inp, width: '100%', marginTop: '8px' }} />
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                                      <span style={{ fontSize: '14px', color: INK }}>Total <b>{m0(lineTotal)}</b></span>
                                      <button disabled={invBusy[c.id]} onClick={() => submitInvoice(c)} style={{ marginLeft: 'auto', background: invBusy[c.id] ? MUTED : SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '13px 20px', ...btn, cursor: invBusy[c.id] ? 'default' : 'pointer' }}>{invBusy[c.id] ? 'Creating…' : (form.send ? 'Create in QuickBooks & email' : 'Create in QuickBooks')}</button>
                                    </div>
                                    {invResult[c.id] && (invResult[c.id].error
                                      ? <div style={{ fontSize: '12.5px', color: RED, marginTop: '10px', lineHeight: 1.5 }}>{invResult[c.id].error}</div>
                                      : <div style={{ fontSize: '12.5px', color: GREEN, marginTop: '10px', lineHeight: 1.5 }}>✓ {invResult[c.id].msg}</div>)}
                                    <p style={{ fontSize: '11px', color: '#A2937A', marginTop: '10px', lineHeight: 1.5 }}>Creates a real invoice in Efraim's QuickBooks and lists it here. “Mark paid” updates this view only — record the actual payment in QuickBooks.</p>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </Fragment>
                  )
                })
              })()}
            </>
          )}

          {/* ===== EXPENSES ===== */}
          {tab === 'expenses' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...big, fontSize: '18px', color: INK, marginBottom: '6px' }}>Personal-card expenses only</div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>Anything on a <b style={{ color: INK }}>business card</b> already flows in through <b style={{ color: INK }}>QuickBooks</b>. This is just for what you put on your <b style={{ color: INK }}>personal card</b> — import a statement or add them by hand. Each one <b style={{ color: INK }}>hits your P&L</b> here, and <b style={{ color: INK }}>I post them into QuickBooks for you at the monthly close</b> — you never touch QB.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="On your personal card" v={m0(personalExp)} sub="the business owes you this back" accent={RED} />
                <KPI k="Items this month" v={personalItems} sub="all flow into your P&L" accent={KRAFT} />
              </div>

              {!addingE ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <button onClick={() => fileRef.current && fileRef.current.click()} style={{ flex: 2, minWidth: '180px', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn }}>Import expenses (CSV)</button>
                    <button onClick={() => setAddingE(true)} style={{ flex: 1, minWidth: '150px', background: CARDBG, color: INK, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '13px', ...btn }}>Add one manually</button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: 'none' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px' }}>Drop in your personal-card statement (CSV: vendor, amount, category) and every line loads at once.</p>
                </>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New personal-card expense</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={ef.vendor} onChange={e => setEf({ ...ef, vendor: e.target.value })} placeholder="What was it? *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={ef.amt} onChange={e => setEf({ ...ef, amt: e.target.value })} type="number" placeholder="$ amount" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                    <select value={ef.cat} onChange={e => setEf({ ...ef, cat: e.target.value })} style={{ ...inp, flex: 1, minWidth: '140px', cursor: 'pointer' }}>
                      {EXP_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingE(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addExpense} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>Add expense</button>
                  </div>
                </div>
              )}
              {expenses.filter(e => e.pay === 'personal').map(e => (
                <div key={e.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ ...big, fontSize: '17px', color: INK }}>{e.vendor}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{e.cat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ ...big, fontSize: '19px', color: RED }}>{m0(e.amt)}</span>
                    <button onClick={() => removeExpense(e.id)} style={{ background: 'none', border: 'none', color: '#C9BBA0', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ))}
              {personalItems > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <button onClick={exportPersonal} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '9px 14px', ...btn, color: MUTED }}>⤓ Export for books (CSV)</button>
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '7px', lineHeight: 1.5 }}>The raw file, for your accountant if they want it — but you don't need this. I post these into QuickBooks for you at close.</p>
                </div>
              )}
            </>
          )}

          {/* ===== ADVERTISING ===== */}
          {tab === 'ads' && (
            <>
              {glAds && glAds.months && glAds.months.length > 1 && (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ ...big, fontSize: '16px', color: INK }}>What you paid each advertiser, by month</div>
                    <div style={{ fontSize: '11.5px', color: MUTED }}>Total <b style={{ color: INK, fontFamily: MONO }}>{m0(glAds.total)}</b> · tap any amount to see the transactions</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12.5px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '6px 8px', position: 'sticky', left: 0, background: CARDBG, ...lbl, color: KRAFT }}>Advertiser</th>
                          {glAds.months.map(m => <th key={m.key} style={{ textAlign: 'right', padding: '6px 8px', ...lbl, color: KRAFT, whiteSpace: 'nowrap' }}>{m.label}</th>)}
                          <th style={{ textAlign: 'right', padding: '6px 8px', ...lbl, color: INK, whiteSpace: 'nowrap' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {glAds.matrix.map(v => (
                          <tr key={v.name} style={{ borderTop: `1px solid ${BORDER}` }}>
                            <td style={{ padding: '6px 8px', position: 'sticky', left: 0, background: CARDBG, color: INK, whiteSpace: 'nowrap' }}>
                              {v.name}{v.steady && <span style={{ marginLeft: '6px', fontSize: '10px', color: GREEN, fontWeight: 600 }}>steady</span>}
                            </td>
                            {glAds.months.map(m => {
                              const c = v.byMonth[m.key]
                              return (
                                <td key={m.key} onClick={c ? () => setDrill({ title: `${v.name} — ${m.label}`, period: `${v.name} · ${m.label}`, rows: c.rows, total: c.amt }) : undefined}
                                  className={c ? 'jm-click' : undefined}
                                  style={{ padding: '6px 8px', textAlign: 'right', fontFamily: MONO, color: c ? INK : '#C9BEAD', cursor: c ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                                  {c ? m0(c.amt) : '—'}
                                </td>
                              )
                            })}
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: MONO, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{m0(v.total)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `2px solid ${BORDER}` }}>
                          <td style={{ padding: '6px 8px', position: 'sticky', left: 0, background: CARDBG, ...lbl, color: INK }}>Monthly total</td>
                          {glAds.months.map(m => <td key={m.key} style={{ padding: '6px 8px', textAlign: 'right', fontFamily: MONO, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{m0(glAds.monthTotals[m.key] || 0)}</td>)}
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: MONO, fontWeight: 700, color: INK }}>{m0(glAds.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '10px', lineHeight: 1.5 }}>“<span style={{ color: GREEN, fontWeight: 600 }}>steady</span>” = same amount every month it appears. A blank (—) means no payment that month. Scan a row across to spot a place whose amount jumps. Pulled from your General Ledger (Advertising/Marketing); “Other / uncategorized” are payments whose memo didn’t name a vendor.</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Ad spend / mo" v={m0(adSpend)} sub="all channels" />
                <KPI k="Return" v={m0(adRev)} sub={`${(adRev / adSpend).toFixed(1)}x overall`} accent={GREEN} />
                <KPI k="Wasted" v={m0(wastedSpend)} sub="on losing channels" accent={RED} />
              </div>
              <div style={{ ...card, marginBottom: '16px', fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
                <b style={{ color: INK }}>How each sale is traced to a channel:</b> a unique promo code per channel (IG10, NJFOODIE), the Meta/Google pixel on your Shopify store, or a “how’d you hear about us?” at checkout. Channels marked <b style={{ color: AMBER }}>“est.”</b> have no code yet — their ROI is a guess.
              </div>
              {!addingA ? (
                <button onClick={() => setAddingA(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a channel</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New ad channel</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={af.channel} onChange={e => setAf({ ...af, channel: e.target.value })} placeholder="Channel (e.g. TikTok Ads) *" style={{ ...inp, flex: 2, minWidth: '170px' }} />
                    <input value={af.track} onChange={e => setAf({ ...af, track: e.target.value })} placeholder="Promo code / how tracked" style={{ ...inp, flex: 1, minWidth: '150px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <input value={af.spend} onChange={e => setAf({ ...af, spend: e.target.value })} type="number" placeholder="$ spent / mo" style={{ ...inp, flex: 1, minWidth: '120px' }} />
                    <input value={af.rev} onChange={e => setAf({ ...af, rev: e.target.value })} type="number" placeholder="$ sales it drove" style={{ ...inp, flex: 1, minWidth: '120px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingA(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addAd} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>+ Add channel</button>
                  </div>
                </div>
              )}

              {ads.slice().sort((a, b) => (b.spend ? b.rev / b.spend : 0) - (a.spend ? a.rev / a.spend : 0)).map(a => {
                const roas = a.spend ? a.rev / a.spend : 0, vd = verdict(roas), open = expanded === a.id
                return (
                  <div key={a.id} style={{ ...card, marginBottom: '10px', padding: 0, overflow: 'hidden', borderColor: open ? CHAR : BORDER }}>
                    <div onClick={() => setExpanded(open ? null : a.id)} style={{ padding: '16px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ ...big, fontSize: '18px', color: INK }}>{a.channel}</div>
                          <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '3px' }}>{m0(a.spend)} spent → {m0(a.rev)} back · <b style={{ color: vd.c }}>{roas.toFixed(1)}x{a.tracked ? '' : ' est.'}</b></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: a.tracked ? KRAFT : AMBER, marginTop: '5px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.tracked ? KRAFT : AMBER, flexShrink: 0 }} />{a.track}</div>
                        </div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: vd.c, padding: '5px 12px', borderRadius: '2px' }}>{vd.t}</span>
                      </div>
                      <div style={{ marginTop: '12px', height: '8px', background: CREAM, borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${Math.min(roas / 4 * 100, 100)}%`, background: vd.c }} />
                      </div>
                    </div>
                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 8px' }}>Update this month</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '130px' }}>
                            <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>$ spent</div>
                            <input value={a.spend} onChange={e => setAdField(a.id, 'spend', e.target.value)} type="number" style={{ ...inp, width: '100%' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '130px' }}>
                            <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>$ sales driven</div>
                            <input value={a.rev} onChange={e => setAdField(a.id, 'rev', e.target.value)} type="number" style={{ ...inp, width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>How it's tracked</div>
                        <input value={a.track} onChange={e => setAdField(a.id, 'track', e.target.value)} placeholder="Promo code / pixel — leave blank if untracked" style={{ ...inp, width: '100%' }} />
                        <div style={{ display: 'flex', marginTop: '14px' }}>
                          <button onClick={() => removeAd(a.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C0392B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Delete channel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ===== QUICKBOOKS SYNC (drop in GL + COA) ===== */}
          {tab === 'quickbooks' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '2px', background: '#2CA01C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...big, fontSize: '19px' }}>qb</div>
                  <div>
                    <div style={{ ...big, fontSize: '18px', color: INK }}>Your books, from QuickBooks</div>
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>Read straight from QuickBooks — your statements live on the Financials tab.</div>
                  </div>
                  {glAsOf && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ ...lbl, color: MUTED }}>As of</div>
                      <div style={{ ...big, fontSize: '15px', color: INK, fontFamily: MONO }}>{glAsOf}</div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>Your <b style={{ color: INK }}>General Ledger</b> and <b style={{ color: INK }}>Chart of Accounts</b> are read directly from QuickBooks every night — nothing to export, nothing to upload. Whatever your bookkeeper posts shows up here the next morning.</p>
              </div>

              <div style={{ ...card, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: INK, fontSize: '16px' }}>QuickBooks Online</div>
                  <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>Connected — reads your ledger and chart of accounts every night</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: GREEN, marginTop: '9px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                    {glTx.length.toLocaleString()} transactions · {coaTx.length} accounts
                  </div>
                </div>
              </div>

              {glPnl ? (
                <>
                  <div style={{ ...card, background: '#FBF3E7', borderColor: '#EAD9BD', fontSize: '12.5px', color: INK, lineHeight: 1.5, marginBottom: '14px' }}>
                    Ledger synced nightly from QuickBooks · current through <b>{glAsOf}</b> · {glPnl.rowCount.toLocaleString()} transactions · {coaTx.length} accounts. The current month is still filling in{glPnl.usedCoA ? '' : ' — and no Chart of Accounts is loaded yet, so categorization is best-guess'}.
                  </div>
                  {glPnl.unclassified.length > 0 && (
                    <div style={{ ...card, marginBottom: '14px', background: '#FDECEA', borderColor: '#F5C6C0', fontSize: '12.5px', color: INK }}>
                      {glPnl.unclassified.length} account(s) not in the Chart of Accounts — import an updated CoA to categorize them: <span style={{ fontFamily: MONO }}>{glPnl.unclassified.map(u => u.account).join(', ')}</span>
                    </div>
                  )}
                  <button onClick={() => setTab('financials')} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px 20px', ...btn }}>View P&amp;L, Balance Sheet &amp; Cash Flow →</button>
                </>
              ) : (
                <div style={{ ...card, background: '#EAF3EC', borderColor: '#CFE4D6', fontSize: '13.5px', color: INK, lineHeight: 1.55 }}>
                  Drop your Chart of Accounts and General Ledger in above. Your P&amp;L, Balance Sheet, and Cash Flow then live on the <b>Financials</b> tab.
                </div>
              )}
            </>
          )}

          {/* ===== FINANCIALS (real statements from the GL) ===== */}
          {tab === 'financials' && (
            <>
              {!glPnl ? (
                <div style={{ ...card, background: '#EAF3EC', borderColor: '#CFE4D6', fontSize: '13.5px', color: INK, lineHeight: 1.55 }}>
                  No books loaded yet. Import your Chart of Accounts and General Ledger on the <b style={{ cursor: 'pointer', color: SPICE }} onClick={() => setTab('quickbooks')}>QuickBooks</b> tab, then your statements appear here.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {[['pnl', 'Profit & Loss'], ['bs', 'Balance Sheet'], ['cf', 'Cash Flow']].map(([id, label]) => (
                      <button key={id} onClick={() => setFinView(id)} style={{ background: finView === id ? CHAR : CARDBG, color: finView === id ? CREAM : INK, border: `1px solid ${finView === id ? CHAR : BORDER}`, borderRadius: '2px', padding: '9px 16px', ...btn }}>{label}</button>
                    ))}
                  </div>

                  <div style={{ ...card, background: '#FBF3E7', borderColor: '#EAD9BD', fontSize: '12px', color: INK, lineHeight: 1.5, marginBottom: '14px' }}>
                    As of <b>{glAsOf}</b> · synced nightly from QuickBooks (the current month is still filling in).
                  </div>

                  {/* ---- Profit & Loss ---- */}
                  {finView === 'pnl' && stmtA && (() => {
                    const B = stmtB
                    const cmp = !!B
                    // kind: 'income' (money in, dark), 'cost' (subtracts, shown negative in red), 'result' (green/red)
                    const fmtv = (v, kind) => (kind === 'cost' || v < 0) ? `(${m0(Math.abs(v))})` : m0(v)
                    const colv = (v, kind) => kind === 'cost' ? RED : kind === 'result' ? (v >= 0 ? GREEN : RED) : (v < 0 ? RED : INK)
                    const cells = (a, b, kind, strong) => (
                      <span style={{ display: 'flex', gap: '14px', fontFamily: MONO, fontSize: strong ? '14px' : '13px' }}>
                        <span style={{ width: '104px', textAlign: 'right', color: colv(a, kind), fontWeight: strong ? 700 : 400 }}>{fmtv(a, kind)}</span>
                        {cmp && <span style={{ width: '104px', textAlign: 'right', color: colv(b, kind), fontWeight: strong ? 700 : 400 }}>{fmtv(b, kind)}</span>}
                        {cmp && (() => { const chg = b - a; const good = kind === 'cost' ? chg <= 0 : chg >= 0; return <span style={{ width: '92px', textAlign: 'right', color: good ? GREEN : RED, fontWeight: 700 }}>{chg >= 0 ? '+' : '-'}{m0(Math.abs(chg))}</span> })()}
                      </span>
                    )
                    const [dFK, dTK] = finKeys(aFrom, aTo)
                    const consignAccts = (coaTx && coaTx.length)
                      ? coaTx.filter(c => /^Consignment Sales:/.test(c.account)).map(c => c.leaf || c.account.split(':').pop().trim())
                      : ['Aisle 9 Jackson', 'Aisle 9 Lakewood', 'Chick Chock', 'Evergreen Lakewood', 'Evergreen Monsey - 59', 'Evergreen Pomona', 'Gourmet Glatt Jackson', 'Gourmet Glatt South', "Khasky's - Snackify Deal", 'Nutmeg', 'The Cookie Corner', 'The Fishing Line', 'Vineyard North - Madison']
                    const openDrill = (title, accts) => {
                      const set = new Set(accts)
                      const rows = glTx.filter(r => r.txn_date && set.has(r.account) && r.txn_date.slice(0, 7) >= (dFK || '0') && r.txn_date.slice(0, 7) <= (dTK || '9'))
                        .sort((x, y) => x.txn_date < y.txn_date ? -1 : 1)
                      setDrill({ title, rows, total: rows.reduce((s, r) => s + (Number(r.amount) || 0), 0) })
                    }
                    const line = (label, a, b, opts = {}) => {
                      const drillable = opts.accounts && !cmp
                      return (
                        <div key={label} onClick={drillable ? () => openDrill(label, opts.accounts) : undefined} className={drillable ? 'jm-click' : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: opts.indent ? '4px 6px 4px 16px' : '6px', borderTop: opts.top ? `1px solid ${BORDER}` : 'none', borderRadius: '2px', cursor: drillable ? 'pointer' : 'default' }}>
                          <span style={{ fontSize: '13px', color: opts.indent ? MUTED : INK, fontWeight: opts.bold ? 700 : 400 }}>{label}{drillable && <span style={{ color: '#C9BBA0', fontSize: '11px' }}> ›</span>}</span>
                          {cells(a, b, opts.kind, opts.bold)}
                        </div>
                      )
                    }
                    const catHeader = (key, label, a, b, kind) => (
                      <div onClick={() => setFinExpand(s => ({ ...s, [key]: !s[key] }))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', cursor: 'pointer', borderTop: `2px solid ${BORDER}` }}>
                        <span style={{ ...lbl, color: KRAFT, display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '9px' }}>{finExpand[key] ? '▼' : '▶'}</span>{label}</span>
                        {cells(a, b, kind, true)}
                      </div>
                    )
                    const unionKeys = (ma, mb) => {
                      const s = new Set([...Object.keys(ma || {}), ...Object.keys(mb || {})])
                      return [...s].sort((x, y) => Math.abs(ma[y] || 0) - Math.abs(ma[x] || 0))
                    }
                    const chanLines = [
                      ['invoiced', 'Invoiced wholesale', ['Sales']],
                      ['private', 'Private / Zelle', ['Private Sales', 'Delivery Fee']],
                      ['shopify', 'Shopify (online)', ['Shopify Sales', 'Shopify Shipping Income', 'Shopify Discount']],
                      ['consignment', 'Consignment stores', consignAccts],
                      ['deposits', 'Store deposits', ['Sales of Product Income']],
                    ]
                    const cogsKeys = unionKeys(stmtA.cogs.map, B && B.cogs.map)
                    const expKeys = unionKeys(stmtA.expenses.map, B && B.expenses.map)
                    return (
                      <>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: MUTED }}>P&amp;L for</span>
                          <select value={aFrom} onChange={e => setFinFrom(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                          <span style={{ color: MUTED, fontSize: '13px' }}>to</span>
                          <select value={aTo} onChange={e => setFinTo(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                          <label style={{ fontSize: '13px', color: MUTED, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={finCmpOn} onChange={e => setFinCmpOn(e.target.checked)} /> compare to
                          </label>
                          {cmpOn && <>
                            <select value={bFrom} onChange={e => setFinCmpFrom(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                            <span style={{ color: MUTED, fontSize: '13px' }}>to</span>
                            <select value={bTo} onChange={e => setFinCmpTo(+e.target.value)} style={{ ...inp }}>{finM.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
                          </>}
                        </div>

                        <div style={{ ...card }}>
                          {cmp && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', fontSize: '11px', color: MUTED, paddingBottom: '2px' }}>
                              <span style={{ width: '104px', textAlign: 'right' }}>{finRangeLabel(aFrom, aTo)}</span>
                              <span style={{ width: '104px', textAlign: 'right' }}>{finRangeLabel(bFrom, bTo)}</span>
                              <span style={{ width: '92px', textAlign: 'right' }}>change</span>
                            </div>
                          )}

                          {catHeader('income', 'Income', stmtA.income.total, B && B.income.total, 'income')}
                          {finExpand.income && chanLines.map(([k, label, accts]) => line(label, stmtA.income.channels[k], B && B.income.channels[k], { indent: true, kind: 'income', accounts: accts }))}

                          {catHeader('cogs', 'Cost of goods sold', stmtA.cogs.total, B && B.cogs.total, 'cost')}
                          {finExpand.cogs && cogsKeys.map(a => line(a, stmtA.cogs.map[a] || 0, B && (B.cogs.map[a] || 0), { indent: true, kind: 'cost', accounts: [a] }))}
                          {line('Gross profit', stmtA.gross, B && B.gross, { bold: true, top: true, kind: 'result' })}

                          {catHeader('expense', 'Operating expenses', stmtA.expenses.total, B && B.expenses.total, 'cost')}
                          {finExpand.expense && expKeys.map(a => line(a, stmtA.expenses.map[a] || 0, B && (B.expenses.map[a] || 0), { indent: true, kind: 'cost', accounts: [a] }))}

                          <div style={{ marginTop: '12px', borderTop: `2px solid ${CHAR}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ ...big, fontSize: '15px', color: INK }}>Net income</span>
                            {cmp
                              ? cells(stmtA.net, B.net, 'result', true)
                              : <span style={{ ...big, fontSize: '17px', fontFamily: MONO, color: stmtA.net >= 0 ? GREEN : RED }}>{stmtA.net < 0 ? `(${m0(Math.abs(stmtA.net))})` : m0(stmtA.net)}</span>}
                          </div>
                          <div style={{ marginTop: '10px', fontSize: '11.5px', color: MUTED }}>Amounts in <span style={{ color: RED }}>(red parentheses)</span> reduce profit; income and gross/net profit are shown in the black/green.</div>
                        </div>
                      </>
                    )
                  })()}

                  {/* ---- Balance Sheet ---- */}
                  {finView === 'bs' && glBS && (
                    <div style={{ ...card }}>
                      {!glBS.balanced && <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#FDECEA', border: '1px solid #F5C6C0', borderRadius: '2px', fontSize: '12px', color: INK, lineHeight: 1.5 }}>This Balance Sheet is out of balance by <b style={{ fontFamily: MONO }}>{m0(glBS.check)}</b> — the nightly QuickBooks sync will re-pull; if it persists, the ledger needs a look.</div>}
                      {qbBS && (
                        <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                            <div style={{ ...lbl, color: KRAFT }}>QuickBooks balance sheet — as of {monthLabel(qbBS.month)}</div>
                            <div style={{ fontSize: '11px', color: MUTED }}>straight from QuickBooks</div>
                          </div>
                          {qbBS.sections.map(sec => (
                            <div key={sec.group} style={{ marginBottom: '10px' }}>
                              <div style={{ ...lbl, color: MUTED, margin: '8px 0 2px' }}>{sec.group}</div>
                              {sec.subgroups.map(sg => (
                                <Fragment key={sg.subgroup || 'x'}>
                                  {sg.subgroup && <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '6px' }}>{sg.subgroup}</div>}
                                  {sg.accounts.map(a => <Row key={a.account} l={a.account} v={m0(a.amount)} />)}
                                </Fragment>
                              ))}
                              <Row l={`Total ${sec.group.toLowerCase()}`} v={m0(sec.total)} bold top />
                            </div>
                          ))}
                          <div style={{ marginTop: '8px', fontSize: '12px', color: qbBS.balanced ? GREEN : RED }}>
                            {qbBS.balanced ? '✓ Balanced' : 'Out of balance in QuickBooks'}
                          </div>
                          <div style={{ marginTop: '10px', padding: '8px 10px', background: Math.abs(glBS.totalAssets - qbBS.totalAssets) < 1 ? '#F1F7F1' : '#FDECEA', border: `1px solid ${Math.abs(glBS.totalAssets - qbBS.totalAssets) < 1 ? '#CBE3CB' : '#F5C6C0'}`, borderRadius: '2px', fontSize: '12px', color: INK, lineHeight: 1.5 }}>
                            {Math.abs(glBS.totalAssets - qbBS.totalAssets) < 1
                              ? <>✓ This portal&rsquo;s ledger reconciles to QuickBooks exactly — total assets {m0(qbBS.totalAssets)} on both.</>
                              : <>Portal ledger shows {m0(glBS.totalAssets)} in assets vs {m0(qbBS.totalAssets)} in QuickBooks — a difference of <b style={{ fontFamily: MONO }}>{m0(glBS.totalAssets - qbBS.totalAssets)}</b>. The nightly sync will re-pull; if it persists, the ledger needs a look.</>}
                          </div>
                        </div>
                      )}

                      <div style={{ ...lbl, color: KRAFT, marginBottom: '4px' }}>Assets{qbBS ? ' — built from the ledger' : ''}</div>
                      {glBS.assets.map(a => <Row key={a.account} l={a.account} v={m0(a.amount)} />)}
                      <Row l="Total assets" v={m0(glBS.totalAssets)} bold top />

                      <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Liabilities</div>
                      {glBS.liabilities.length ? glBS.liabilities.map(a => <Row key={a.account} l={a.account} v={m0(a.amount)} />) : <div style={{ fontSize: '12.5px', color: MUTED }}>None</div>}
                      <Row l="Total liabilities" v={m0(glBS.totalLiab)} bold top />

                      <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Equity</div>
                      {glBS.equity.map(a => <Row key={a.account} l={a.account} v={m0(a.amount)} />)}
                      <Row l="Net income (current period)" v={m0(glBS.netIncome)} />
                      <Row l="Total equity" v={m0(glBS.totalEquity)} bold top />

                      <div style={{ marginTop: '14px', borderTop: `2px solid ${CHAR}`, paddingTop: '10px' }}>
                        <Row l="Total liabilities + equity" v={m0(glBS.totalLiabEquity)} bold />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: glBS.balanced ? GREEN : RED }}>
                          <span>{glBS.balanced ? '✓ Balanced (assets = liabilities + equity)' : 'Out of balance — check the ledger'}</span>
                          {!glBS.balanced && <span style={{ fontFamily: MONO }}>{m0(glBS.check)}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---- Cash Flow ---- */}
                  {finView === 'cf' && glCF && (
                    <div style={{ ...card }}>
                      {glBS && !glBS.balanced && <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#FDECEA', border: '1px solid #F5C6C0', borderRadius: '2px', fontSize: '12px', color: INK, lineHeight: 1.5 }}>The ledger is out of balance, so cash flow may be off — the nightly QuickBooks sync will re-pull.</div>}
                      <div style={{ ...lbl, color: KRAFT, marginBottom: '4px' }}>Cash flow{glAsOf ? ` — through ${glAsOf}` : ''}</div>
                      <Row l="Beginning cash" v={m0(glCF.beginningCash)} />
                      <Row l="Operating (sales, collections, expenses)" v={m0(glCF.operating)} />
                      {glCF.investing !== 0 && <Row l="Investing (equipment, assets)" v={m0(glCF.investing)} />}
                      <Row l="Financing (owner funds, card payments)" v={m0(glCF.financing)} />
                      {glCF.transfer !== 0 && <Row l="Transfers" v={m0(glCF.transfer)} />}
                      <Row l="Net change in cash" v={m0(glCF.netChange)} bold top />
                      <Row l="Ending cash" v={m0(glCF.endingCash)} bold top />
                      <div style={{ marginTop: '10px', fontSize: '11.5px', color: MUTED, lineHeight: 1.5 }}>Cash basis, from the bank account. Ending cash matches your bank balance in the books.</div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </main>
      </div>

      {drill && (
        <div onClick={() => setDrill(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(43,32,24,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 60, overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARDBG, borderRadius: '2px', maxWidth: '640px', width: '100%', padding: '20px', boxShadow: '0 12px 44px rgba(0,0,0,.28)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
              <div style={{ ...big, fontSize: '17px', color: INK }}>{drill.title}</div>
              <button onClick={() => setDrill(null)} style={{ background: 'none', border: 'none', fontSize: '22px', color: MUTED, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: '12px', color: MUTED, margin: '2px 0 12px' }}>{drill.rows.length} transaction{drill.rows.length === 1 ? '' : 's'} · {drill.period || finRangeLabel(aFrom, aTo)} · total <b style={{ color: INK, fontFamily: MONO }}>{m0(drill.total)}</b></div>
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {drill.rows.length === 0 && <div style={{ fontSize: '13px', color: MUTED }}>No transactions in this period.</div>}
              {drill.rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: INK }}>{r.name || r.txn_type || '—'}</div>
                    <div style={{ fontSize: '11px', color: MUTED, marginTop: '1px' }}>{r.txn_date}{r.description ? ' · ' + r.description : ''}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '13px', whiteSpace: 'nowrap', color: INK }}>{m0(r.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
