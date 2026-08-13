import { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'

/* ─── QueFence job entry portal — demo scaffold ───────────────────────────
   UI only. The QuickBooks pane on the right is a simulation of what the
   push would produce; swap it for the live sandbox company at demo time.
   Every screen lives inside a job. There is no path to an entry that
   does not begin with choosing a job.
   ────────────────────────────────────────────────────────────────────── */

const BIZ = 'QueFence'

// neutral shell — brand colors drop in here once their site is sampled
const INK = '#16181C', BG = '#F4F5F7', CARD = '#FFFFFF', BORDER = '#E3E5E9'
const MUTED = '#6B7280', FAINT = '#9AA1AC', SOFT = '#F8F9FB'
// the one accent family: variance only
const GREEN = '#1E7A3A', AMBER = '#C2761E', RED = '#C0392B'
// the other system
const QB = '#2CA01C', QBDARK = '#0D6B0D'

const head = "'Charter','Bitstream Charter','Sitka Text','Iowan Old Style',Georgia,serif"
const ui = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

const LABOR_RATE = 42 // burdened crew hour

const fmt = (n) => '$' + Math.round(n).toLocaleString()
const fmt2 = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hrs = (n) => Number(n).toFixed(1) + ' hr'
const pct = (n) => (n > 0 ? '+' : '') + n.toFixed(0) + '%'
const dshort = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + +d
}

/* ─── Reference data (assemblies are DATA, not code — roofing is a row) ── */

const ASSEMBLIES = [
  {
    id: 'cedar6', name: "6' cedar privacy fence", unit: 'LF', price: 48,
    lines: [
      { item: '4x4x8 cedar post', type: 'material', per: 0.125, u: 'ea', cost: 26 },
      { item: "6'x8' cedar privacy panel", type: 'material', per: 0.125, u: 'ea', cost: 92 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25, u: 'bag', cost: 7 },
      { item: 'Cedar post cap', type: 'material', per: 0.125, u: 'ea', cost: 5 },
      { item: 'Fence screws & hardware', type: 'material', per: 1, u: 'LF', cost: 0.95 },
      { item: 'Install labor', type: 'labor', per: 0.20, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'vinyl6', name: "6' vinyl privacy fence, white", unit: 'LF', price: 62,
    lines: [
      { item: 'Vinyl line post, 5x5', type: 'material', per: 0.125, u: 'ea', cost: 42 },
      { item: "6'x8' vinyl panel kit", type: 'material', per: 0.125, u: 'ea', cost: 155 },
      { item: 'Vinyl post cap', type: 'material', per: 0.125, u: 'ea', cost: 9 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25, u: 'bag', cost: 7 },
      { item: 'Install labor', type: 'labor', per: 0.18, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'chain4', name: "4' chain link, galvanized", unit: 'LF', price: 28,
    lines: [
      { item: '1-3/8" line post', type: 'material', per: 0.10, u: 'ea', cost: 18 },
      { item: 'Top rail', type: 'material', per: 1, u: 'LF', cost: 2.10 },
      { item: "4' galvanized mesh", type: 'material', per: 1, u: 'LF', cost: 4.60 },
      { item: 'Tension & brace hardware', type: 'material', per: 1, u: 'LF', cost: 0.85 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.20, u: 'bag', cost: 7 },
      { item: 'Install labor', type: 'labor', per: 0.12, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'alum4', name: "4' aluminum ornamental, black", unit: 'LF', price: 68,
    lines: [
      { item: 'Aluminum line post', type: 'material', per: 0.125, u: 'ea', cost: 62 },
      { item: "4'x6' aluminum panel", type: 'material', per: 0.167, u: 'ea', cost: 148 },
      { item: 'Bracket kit', type: 'material', per: 0.167, u: 'set', cost: 12 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25, u: 'bag', cost: 7 },
      { item: 'Install labor', type: 'labor', per: 0.16, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'gate1', name: "Walk gate, 4' cedar", unit: 'EA', price: 625,
    lines: [
      { item: 'Gate frame kit', type: 'material', per: 1, u: 'ea', cost: 95 },
      { item: 'Cedar pickets, gate', type: 'material', per: 1, u: 'set', cost: 70 },
      { item: 'Hinges & latch', type: 'material', per: 1, u: 'set', cost: 58 },
      { item: '4x4 gate posts', type: 'material', per: 2, u: 'ea', cost: 26 },
      { item: 'Install labor', type: 'labor', per: 2.5, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'gate2', name: "Drive gate, 10' double cedar", unit: 'EA', price: 1650,
    lines: [
      { item: 'Heavy gate frame kit', type: 'material', per: 1, u: 'ea', cost: 260 },
      { item: 'Cedar pickets, drive gate', type: 'material', per: 1, u: 'set', cost: 165 },
      { item: 'Drop rod & cane bolt', type: 'material', per: 1, u: 'set', cost: 85 },
      { item: 'Heavy hinges & latch', type: 'material', per: 1, u: 'set', cost: 140 },
      { item: '6x6 gate posts', type: 'material', per: 2, u: 'ea', cost: 68 },
      { item: 'Install labor', type: 'labor', per: 6, u: 'hr', cost: LABOR_RATE },
    ],
  },
  {
    id: 'tearout', name: 'Tear-out & haul away existing fence', unit: 'LF', price: 9,
    lines: [
      { item: 'Dump fees', type: 'material', per: 1, u: 'LF', cost: 1.20 },
      { item: 'Demo labor', type: 'labor', per: 0.08, u: 'hr', cost: LABOR_RATE },
    ],
  },
]

const CREW = ['Miguel R.', 'Danny T.', 'Junior P.', 'Wes K.', 'Tomás A.']

const VENDORS = ['Master Halco', 'Cedar Supply Co.', 'Ready-Mix Supply', 'Fastenal', 'Home Depot Pro', 'County Transfer Station']

const CUSTOMERS = [
  'Ana Delgado', 'Northview Townhomes HOA', 'Robert Callahan',
  'Peter Marchetti', 'Grace Oyelaran', 'Sunrise Property Mgmt.',
]

/* ─── Seed jobs (Smith residence is created live in the demo) ─────────── */

const SEED_JOBS = [
  {
    id: 'j1', name: 'Delgado backyard', customer: 'Ana Delgado',
    address: '412 Ridgeway Ave', status: 'In progress',
    assemblies: [
      { assemblyId: 'vinyl6', qty: 96, price: 62 },
      { assemblyId: 'gate2', qty: 1, price: 1650 },
    ],
    labor: [
      { id: 'l1', date: '2026-08-04', crew: ['Miguel R.', 'Danny T.'], hours: 8 },
      { id: 'l2', date: '2026-08-05', crew: ['Miguel R.', 'Danny T.'], hours: 7 },
    ],
    materials: [
      { id: 'm1', date: '2026-07-30', vendor: 'Master Halco', desc: 'Vinyl posts + panel kits, 96 LF', amount: 2890, photo: null },
      { id: 'm2', date: '2026-08-04', vendor: 'Ready-Mix Supply', desc: 'Concrete, 24 bags', amount: 168, photo: null },
      { id: 'm3', date: '2026-08-05', vendor: 'Cedar Supply Co.', desc: 'Drive gate hardware + 6x6 posts', amount: 452, photo: null },
    ],
    changes: [],
  },
  {
    id: 'j2', name: 'Northview Townhomes — phase 1', customer: 'Northview Townhomes HOA',
    address: '1900 Northview Dr', status: 'In progress',
    assemblies: [
      { assemblyId: 'chain4', qty: 420, price: 28 },
      { assemblyId: 'tearout', qty: 420, price: 9 },
    ],
    labor: [
      { id: 'l3', date: '2026-07-21', crew: ['Miguel R.', 'Danny T.', 'Wes K.'], hours: 9 },
      { id: 'l4', date: '2026-07-22', crew: ['Danny T.', 'Wes K.'], hours: 8 },
      { id: 'l5', date: '2026-07-28', crew: ['Miguel R.', 'Junior P.', 'Wes K.'], hours: 8 },
      { id: 'l6', date: '2026-08-06', crew: ['Tomás A.', 'Junior P.'], hours: 6 },
    ],
    materials: [
      { id: 'm4', date: '2026-07-21', vendor: 'Master Halco', desc: 'Chain link mesh 420 LF + line posts', amount: 4180, photo: null },
      { id: 'm5', date: '2026-07-22', vendor: 'Ready-Mix Supply', desc: 'Concrete, 84 bags', amount: 588, photo: null },
      { id: 'm6', date: '2026-07-28', vendor: 'Master Halco', desc: 'Top rail + tension hardware', amount: 890, photo: null },
      { id: 'm7', date: '2026-08-06', vendor: 'County Transfer Station', desc: 'Dump fees — old fence haul away', amount: 582, photo: null },
    ],
    changes: [
      { id: 'c1', desc: 'Add 60 LF along east property line — board request', amount: 2240, approved: true, billed: false },
    ],
  },
  {
    id: 'j3', name: 'Callahan property', customer: 'Robert Callahan',
    address: '77 Old Mill Rd', status: 'Complete',
    assemblies: [
      { assemblyId: 'cedar6', qty: 210, price: 48 },
      { assemblyId: 'gate1', qty: 1, price: 625 },
    ],
    labor: [
      { id: 'l7', date: '2026-07-08', crew: ['Miguel R.', 'Danny T.', 'Junior P.'], hours: 8 },
      { id: 'l8', date: '2026-07-09', crew: ['Miguel R.', 'Danny T.'], hours: 9 },
    ],
    materials: [
      { id: 'm8', date: '2026-07-08', vendor: 'Cedar Supply Co.', desc: 'Cedar panels + posts, 210 LF', amount: 3180, photo: null },
      { id: 'm9', date: '2026-07-09', vendor: 'Ready-Mix Supply', desc: 'Concrete, 53 bags', amount: 371, photo: null },
      { id: 'm10', date: '2026-07-14', vendor: 'Fastenal', desc: 'Fence screws, caps, gate hardware', amount: 389, photo: null },
    ],
    changes: [
      { id: 'c2', desc: 'Relocate gate to south side after walkthrough', amount: 340, approved: true, billed: true },
    ],
  },
]

/* ─── Costing helpers ─────────────────────────────────────────────────── */

const asmById = (id) => ASSEMBLIES.find((a) => a.id === id)

function explode(assemblyId, qty) {
  const a = asmById(assemblyId)
  if (!a) return { materials: [], laborHours: 0 }
  const materials = []
  let laborHours = 0
  a.lines.forEach((l) => {
    const units = l.per * qty
    if (l.type === 'labor') laborHours += units
    else materials.push({ name: l.item, qty: units, u: l.u, unitCost: l.cost, cost: units * l.cost })
  })
  return { materials, laborHours }
}

function jobBudget(job) {
  let mat = 0, laborHours = 0, contract = 0
  const lines = []
  job.assemblies.forEach((ja) => {
    const e = explode(ja.assemblyId, ja.qty)
    e.materials.forEach((m) => {
      mat += m.cost
      const found = lines.find((x) => x.name === m.name)
      if (found) { found.qty += m.qty; found.cost += m.cost }
      else lines.push({ ...m })
    })
    laborHours += e.laborHours
    contract += ja.price * ja.qty
  })
  const changeContract = job.changes.filter((c) => c.approved).reduce((s, c) => s + c.amount, 0)
  return {
    materials: mat,
    laborHours,
    labor: laborHours * LABOR_RATE,
    total: mat + laborHours * LABOR_RATE,
    contract: contract + changeContract,
    baseContract: contract,
    lines,
  }
}

function jobActual(job) {
  const materials = job.materials.reduce((s, m) => s + m.amount, 0)
  const laborHours = job.labor.reduce((s, l) => s + l.crew.length * l.hours, 0)
  return { materials, laborHours, labor: laborHours * LABOR_RATE, total: materials + laborHours * LABOR_RATE }
}

function jobFlag(job) {
  const b = jobBudget(job), a = jobActual(job)
  const unbilled = job.changes.some((c) => c.approved && !c.billed)
  const over = b.total > 0 ? (a.total - b.total) / b.total : 0
  if (unbilled || over > 0.10) return 'red'
  if (over > 0.02) return 'amber'
  return 'green'
}
const FLAG_COLOR = { green: GREEN, amber: AMBER, red: RED }
const FLAG_LABEL = { green: 'On budget', amber: 'Watch', red: 'Over' }

/* ─── QuickBooks mock ─────────────────────────────────────────────────── */

let QID = 100
const nextQid = () => String(++QID)

function seedQbo(jobs) {
  const out = []
  const parents = {}
  CUSTOMERS.forEach((c) => {
    const id = nextQid()
    parents[c] = id
    out.push({
      key: 'cust-' + id, type: 'Customer', qid: id, status: 'synced', date: '2026-06-30',
      title: c, sub: 'Top-level customer', amount: null,
      payload: { Customer: { Id: id, DisplayName: c, Job: false, SyncToken: '0' } },
    })
  })
  jobs.forEach((job) => {
    const b = jobBudget(job)
    const jid = nextQid()
    parents[job.name] = jid
    out.push({
      key: 'job-' + jid, type: 'Customer', qid: jid, status: 'synced', date: '2026-07-01',
      title: job.name, sub: 'Sub-customer of ' + job.customer, amount: null, isJob: true,
      payload: {
        Customer: {
          Id: jid, DisplayName: job.name, Job: true,
          ParentRef: { value: parents[job.customer], name: job.customer },
          BillAddr: { Line1: job.address }, SyncToken: '0',
        },
      },
    })
    const eid = nextQid()
    out.push({
      key: 'est-' + eid, type: 'Estimate', qid: eid, status: 'synced', date: '2026-07-01',
      title: job.name, sub: job.assemblies.map((ja) => `${ja.qty} ${asmById(ja.assemblyId).unit} ${asmById(ja.assemblyId).name}`).join(' · '),
      amount: b.baseContract,
      payload: {
        Estimate: {
          Id: eid, SyncToken: '0', CustomerRef: { value: jid, name: job.name },
          TotalAmt: b.baseContract,
          Line: job.assemblies.map((ja) => ({
            DetailType: 'SalesItemLineDetail', Amount: ja.qty * ja.price,
            SalesItemLineDetail: { ItemRef: { name: asmById(ja.assemblyId).name }, Qty: ja.qty, UnitPrice: ja.price },
          })),
        },
      },
    })
    job.labor.forEach((l) => {
      l.crew.forEach((person) => {
        const tid = nextQid()
        out.push({
          key: 'time-' + tid, type: 'TimeActivity', qid: tid, status: 'synced', date: l.date,
          title: person, sub: job.name, amount: null, hours: l.hours,
          payload: {
            TimeActivity: {
              Id: tid, SyncToken: '0', NameOf: 'Employee', TxnDate: l.date,
              EmployeeRef: { name: person }, CustomerRef: { value: jid, name: job.name },
              ItemRef: { name: 'Fence install labor' }, BillableStatus: 'Billable',
              Hours: Math.floor(l.hours), Minutes: Math.round((l.hours % 1) * 60),
            },
          },
        })
      })
    })
    job.materials.forEach((m) => {
      const pid = nextQid()
      out.push({
        key: 'pur-' + pid, type: 'Purchase', qid: pid, status: 'synced', date: m.date,
        title: m.vendor, sub: m.desc + ' — ' + job.name, amount: m.amount,
        payload: {
          Purchase: {
            Id: pid, SyncToken: '0', PaymentType: 'CreditCard', TxnDate: m.date,
            EntityRef: { name: m.vendor, type: 'Vendor' }, TotalAmt: m.amount,
            Line: [{
              DetailType: 'AccountBasedExpenseLineDetail', Amount: m.amount, Description: m.desc,
              AccountBasedExpenseLineDetail: {
                AccountRef: { name: 'Job Materials' },
                CustomerRef: { value: jid, name: job.name },
                BillableStatus: 'Billable',
              },
            }],
          },
        },
      })
    })
  })
  return { entities: out, parents }
}

const QBO_TABS = [
  { id: 'Customer', label: 'Customers' },
  { id: 'Estimate', label: 'Estimates' },
  { id: 'TimeActivity', label: 'Time' },
  { id: 'Purchase', label: 'Expenses' },
  { id: 'report', label: 'Job profitability' },
]

/* ─── UI atoms ────────────────────────────────────────────────────────── */

const Btn = ({ children, onClick, kind = 'primary', full, disabled, small }) => {
  const base = {
    fontFamily: ui, fontWeight: 600, fontSize: small ? 13 : 15, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 10, padding: small ? '8px 14px' : '15px 20px', width: full ? '100%' : 'auto',
    border: '1px solid transparent', transition: 'opacity .12s', opacity: disabled ? 0.4 : 1,
  }
  const kinds = {
    primary: { background: INK, color: '#fff' },
    ghost: { background: 'transparent', color: INK, border: `1px solid ${BORDER}` },
    quiet: { background: 'transparent', color: MUTED, padding: small ? '6px 8px' : '10px 12px' },
  }
  return <button style={{ ...base, ...kinds[kind] }} onClick={disabled ? undefined : onClick} disabled={disabled}>{children}</button>
}

const Field = ({ label, children }) => (
  <label style={{ display: 'block', marginBottom: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 7 }}>{label}</div>
    {children}
  </label>
)

const inputStyle = {
  width: '100%', fontFamily: ui, fontSize: 16, padding: '13px 14px', borderRadius: 10,
  border: `1px solid ${BORDER}`, background: '#fff', color: INK, outline: 'none',
}

const Chip = ({ on, children, onClick }) => (
  <button onClick={onClick} style={{
    fontFamily: ui, fontSize: 15, fontWeight: on ? 600 : 500, padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
    border: `1.5px solid ${on ? INK : BORDER}`, background: on ? INK : '#fff', color: on ? '#fff' : INK,
  }}>{children}</button>
)

const Dot = ({ flag }) => (
  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: FLAG_COLOR[flag] }} />
)

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function QueFenceDemo() {
  const seed = useMemo(() => seedQbo(SEED_JOBS), [])
  const [jobs, setJobs] = useState(SEED_JOBS)
  const [qbo, setQbo] = useState(seed.entities)
  const parents = useRef(seed.parents)
  const counter = useRef(0)
  const uid = (p) => `${p}${++counter.current}`

  const [view, setView] = useState({ screen: 'list' })
  const [tab, setTab] = useState('overview')
  const [qtab, setQtab] = useState('Customer')
  const [pane, setPane] = useState('portal')
  const [today, setToday] = useState('2026-08-13')
  const [openPayload, setOpenPayload] = useState(null)
  const [toast, setToast] = useState(null)
  const [intro, setIntro] = useState(false)

  useEffect(() => {
    const d = new Date()
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    try { if (!localStorage.getItem('qf_intro')) setIntro(true) } catch (e) { setIntro(true) }
  }, [])

  const closeIntro = () => {
    setIntro(false)
    try { localStorage.setItem('qf_intro', '1') } catch (e) {}
  }

  const job = jobs.find((j) => j.id === view.jobId)

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  // Write to the portal first, then queue the push. Never block on Intuit.
  const push = (entities, landOn) => {
    const staged = entities.map((e) => ({ ...e, status: 'queued', fresh: true }))
    setQbo((prev) => [...staged, ...prev])
    if (landOn) setQtab(landOn)
    setTimeout(() => {
      setQbo((prev) => prev.map((e) => (staged.find((s) => s.key === e.key) ? { ...e, status: 'synced' } : e)))
    }, 850)
    setTimeout(() => {
      setQbo((prev) => prev.map((e) => (staged.find((s) => s.key === e.key) ? { ...e, fresh: false } : e)))
    }, 6000)
  }

  const updateJob = (id, fn) => setJobs((prev) => prev.map((j) => (j.id === id ? fn(j) : j)))

  /* ── actions ── */

  const createJob = ({ customer, name, address, picked }) => {
    const id = uid('job')
    const newJob = { id, name, customer, address, status: 'In progress', assemblies: picked, labor: [], materials: [], changes: [] }
    setJobs((prev) => [newJob, ...prev])

    let parentId = parents.current[customer]
    const out = []
    if (!parentId) {
      parentId = nextQid()
      parents.current[customer] = parentId
      out.push({
        key: 'cust-' + parentId, type: 'Customer', qid: parentId, status: 'queued', date: today,
        title: customer, sub: 'Top-level customer', amount: null,
        payload: { Customer: { Id: parentId, DisplayName: customer, Job: false, SyncToken: '0' } },
      })
    }
    const jid = nextQid()
    parents.current[name] = jid
    out.push({
      key: 'job-' + jid, type: 'Customer', qid: jid, status: 'queued', date: today, isJob: true,
      title: name, sub: 'Sub-customer of ' + customer, amount: null,
      payload: {
        Customer: {
          Id: jid, DisplayName: name, Job: true,
          ParentRef: { value: parentId, name: customer },
          BillAddr: { Line1: address }, SyncToken: '0',
        },
      },
    })
    const contract = picked.reduce((s, p) => s + p.qty * p.price, 0)
    const eid = nextQid()
    out.push({
      key: 'est-' + eid, type: 'Estimate', qid: eid, status: 'queued', date: today,
      title: name, amount: contract,
      sub: picked.map((p) => `${p.qty} ${asmById(p.assemblyId).unit} ${asmById(p.assemblyId).name}`).join(' · '),
      payload: {
        Estimate: {
          Id: eid, SyncToken: '0', CustomerRef: { value: jid, name }, TotalAmt: contract,
          Line: picked.map((p) => ({
            DetailType: 'SalesItemLineDetail', Amount: p.qty * p.price,
            SalesItemLineDetail: { ItemRef: { name: asmById(p.assemblyId).name }, Qty: p.qty, UnitPrice: p.price },
          })),
        },
      },
    })
    push(out, 'Customer')
    setView({ screen: 'job', jobId: id })
    setTab('overview')
    flash('Job created · pushed to QuickBooks')
  }

  const saveLabor = (entry) => {
    updateJob(job.id, (j) => ({ ...j, labor: [...j.labor, { ...entry, id: uid('l') }] }))
    const jid = parents.current[job.name]
    push(entry.crew.map((person) => {
      const tid = nextQid()
      return {
        key: 'time-' + tid, type: 'TimeActivity', qid: tid, status: 'queued', date: entry.date,
        title: person, sub: job.name, hours: entry.hours, amount: null,
        payload: {
          TimeActivity: {
            Id: tid, SyncToken: '0', NameOf: 'Employee', TxnDate: entry.date,
            EmployeeRef: { name: person }, CustomerRef: { value: jid, name: job.name },
            ItemRef: { name: 'Fence install labor' }, BillableStatus: 'Billable',
            Hours: Math.floor(entry.hours), Minutes: Math.round((entry.hours % 1) * 60),
          },
        },
      }
    }), 'TimeActivity')
    flash(`${entry.crew.length * entry.hours} hours saved`)
  }

  const saveMaterial = (entry) => {
    updateJob(job.id, (j) => ({ ...j, materials: [...j.materials, { ...entry, id: uid('m') }] }))
    const jid = parents.current[job.name]
    const pid = nextQid()
    push([{
      key: 'pur-' + pid, type: 'Purchase', qid: pid, status: 'queued', date: entry.date,
      title: entry.vendor, sub: entry.desc + ' — ' + job.name, amount: entry.amount,
      payload: {
        Purchase: {
          Id: pid, SyncToken: '0', PaymentType: 'CreditCard', TxnDate: entry.date,
          EntityRef: { name: entry.vendor, type: 'Vendor' }, TotalAmt: entry.amount,
          Line: [{
            DetailType: 'AccountBasedExpenseLineDetail', Amount: entry.amount, Description: entry.desc,
            AccountBasedExpenseLineDetail: {
              AccountRef: { name: 'Job Materials' },
              CustomerRef: { value: jid, name: job.name },
              BillableStatus: 'Billable',
            },
          }],
          ...(entry.photo ? { AttachableRef: [{ FileName: entry.photo }] } : {}),
        },
      },
    }], 'Purchase')
    flash('Delivery saved · coded to ' + job.name)
  }

  const saveChange = (entry) => {
    updateJob(job.id, (j) => ({ ...j, changes: [...j.changes, { ...entry, id: uid('c'), billed: false }] }))
    if (entry.approved) {
      const jid = parents.current[job.name]
      const eid = nextQid()
      push([{
        key: 'est-' + eid, type: 'Estimate', qid: eid, status: 'queued', date: today,
        title: job.name + ' — change order', sub: entry.desc, amount: entry.amount,
        payload: {
          Estimate: {
            Id: eid, SyncToken: '0', CustomerRef: { value: jid, name: job.name }, TotalAmt: entry.amount,
            Line: [{
              DetailType: 'SalesItemLineDetail', Amount: entry.amount, Description: entry.desc,
              SalesItemLineDetail: { ItemRef: { name: 'Change order' }, Qty: 1, UnitPrice: entry.amount },
            }],
          },
        },
      }], 'Estimate')
    }
    flash('Change order saved')
  }

  const markBilled = (cid) => updateJob(job.id, (j) => ({ ...j, changes: j.changes.map((c) => (c.id === cid ? { ...c, billed: true } : c)) }))

  const queued = qbo.filter((e) => e.status === 'queued').length

  return (
    <>
      <Head>
        <title>{`${BIZ} — job entry portal`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${ui};background:${BG};color:${INK};-webkit-font-smoothing:antialiased}
        input,select,textarea,button{font-family:${ui}}
        input:focus,select:focus,textarea:focus{border-color:${INK}!important}
        .num{font-variant-numeric:tabular-nums}
        .split{display:flex;gap:0;min-height:100vh}
        .paneL{flex:0 0 520px;border-right:1px solid ${BORDER};background:${BG};display:flex;flex-direction:column}
        .paneR{flex:1;background:#fff;display:flex;flex-direction:column;min-width:0}
        .switcher{display:none}
        .fresh{animation:pop .5s ease}
        @keyframes pop{from{background:#EAF7E6}to{background:transparent}}
        @media (max-width:940px){
          .split{display:block}
          .paneL,.paneR{flex:none;width:100%;border-right:none}
          .switcher{display:flex}
          .split.show-portal .paneR{display:none}
          .split.show-qbo .paneL{display:none}
        }
      `}</style>

      <div className={`split show-${pane}`}>
        {/* ── LEFT: the portal ──────────────────────────────────────── */}
        <div className="paneL">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700, letterSpacing: '-.01em' }}>{BIZ}</div>
              <button onClick={() => setIntro(true)} style={{ border: 'none', background: 'none', padding: 0, color: FAINT, fontSize: 12.5, cursor: 'pointer' }}>
                Why this exists
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: queued ? AMBER : MUTED, fontWeight: 600 }}>
                {queued ? `${queued} syncing…` : 'All synced'}
              </span>
              <div className="switcher">
                <button onClick={() => setPane('qbo')} style={{ fontSize: 12, fontWeight: 600, padding: '7px 11px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: INK, cursor: 'pointer' }}>
                  QuickBooks →
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 460, margin: '0 auto', padding: '20px 18px 60px' }}>
              {view.screen === 'list' && (
                <JobList jobs={jobs} onOpen={(id) => { setView({ screen: 'job', jobId: id }); setTab('overview') }} onNew={() => setView({ screen: 'new' })} />
              )}
              {view.screen === 'new' && (
                <NewJob onCancel={() => setView({ screen: 'list' })} onSave={createJob} />
              )}
              {view.screen === 'job' && job && (
                <JobContainer
                  job={job} tab={tab} setTab={setTab}
                  onBack={() => setView({ screen: 'list' })}
                  today={today}
                  onLabor={saveLabor} onMaterial={saveMaterial} onChange={saveChange} onBill={markBilled}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: QuickBooks ─────────────────────────────────────── */}
        <div className="paneR">
          <div style={{ background: QB, color: '#fff', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', color: QB, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>qb</div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>QuickBooks Online</span>
              <span style={{ fontSize: 12, opacity: .8 }}>Sandbox company · QueFence Inc.</span>
            </div>
            <div className="switcher">
              <button onClick={() => setPane('portal')} style={{ fontSize: 12, fontWeight: 600, padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                ← Portal
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 2, padding: '0 20px', borderBottom: `1px solid ${BORDER}`, background: SOFT, overflowX: 'auto' }}>
            {QBO_TABS.map((t) => {
              const on = qtab === t.id
              const n = t.id === 'report' ? null : qbo.filter((e) => e.type === t.id).length
              return (
                <button key={t.id} onClick={() => setQtab(t.id)} style={{
                  padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? QBDARK : MUTED,
                  borderBottom: `2px solid ${on ? QB : 'transparent'}`,
                }}>
                  {t.label}{n !== null && <span className="num" style={{ marginLeft: 6, color: FAINT, fontWeight: 500 }}>{n}</span>}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {qtab === 'report'
              ? <Profitability jobs={jobs} />
              : <QboList rows={qbo.filter((e) => e.type === qtab)} type={qtab} open={openPayload} setOpen={setOpenPayload} />}
          </div>
        </div>
      </div>

      {intro && <Intro jobs={jobs} onClose={closeIntro} />}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          background: INK, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 28px rgba(0,0,0,.22)',
        }}>{toast}</div>
      )}
    </>
  )
}

/* ─── First-visit intro ───────────────────────────────────────────────── */

function Intro({ jobs, onClose }) {
  const worst = jobs
    .map((j) => ({ j, b: jobBudget(j), a: jobActual(j) }))
    .sort((x, y) => (y.a.total - y.b.total) - (x.a.total - x.b.total))[0]
  const hours = jobs.reduce((s, j) => s + jobActual(j).laborHours, 0)
  const unbilled = jobs.flatMap((j) => j.changes).filter((c) => c.approved && !c.billed)
    .reduce((s, c) => s + c.amount, 0)

  const Q = ({ q, a }) => (
    <div style={{ padding: '11px 0', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ fontFamily: head, fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{q}</div>
      <div className="num" style={{ fontSize: 14, color: MUTED }}>{a}</div>
    </div>
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(16,24,40,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: CARD, borderRadius: 14, maxWidth: 560, width: '100%', padding: 28,
        boxShadow: '0 20px 60px rgba(16,24,40,.28)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>
          QueFence · job entry portal
        </div>
        <h2 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, lineHeight: 1.22, letterSpacing: '-.015em', marginBottom: 10 }}>
          QuickBooks has always been able to do job costing. Nothing has ever fed it correctly.
        </h2>
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.55, marginBottom: 16 }}>
          This is the funnel that makes correct data the only kind that gets in. There is no screen
          here that exists outside a job — so a cost can't land on the wrong one, or on none at all.
        </p>

        <Q q="What is this job actually costing me?" a={`${worst.j.name} — ${fmt(worst.a.total)} spent against a ${fmt(worst.b.total)} budget`} />
        <Q q="How many hours went into the work?" a={`${hours.toFixed(0)} hours entered, every one attached to a job and a customer`} />
        <Q q="What did we do and never charge for?" a={`${fmt(unbilled)} in approved change orders still unbilled`} />

        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.55, margin: '18px 0 16px', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          The left side is the crew entering a day's work in ten seconds. The right side is
          QuickBooks. Your reports, your CPA, your tax return, your bank feeds — all unchanged.
          I'm not replacing your QuickBooks reports. I'm making them finally work.
        </p>

        <Btn full onClick={onClose}>Open the portal</Btn>

        <p style={{ fontSize: 12, color: FAINT, lineHeight: 1.5, marginTop: 14 }}>
          Sample jobs and numbers, built for this walkthrough. The QuickBooks panel is a simulation
          of the sandbox company, so you can click through it without logging in anywhere.
        </p>
      </div>
    </div>
  )
}

/* ─── 4.1 Job list ────────────────────────────────────────────────────── */

function JobList({ jobs, onOpen, onNew }) {
  return (
    <div>
      <h1 style={{ fontFamily: head, fontSize: 27, fontWeight: 700, letterSpacing: '-.015em', marginBottom: 4 }}>Jobs</h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>Pick a job to enter labor, materials, or a change order.</p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {jobs.map((j) => {
          const b = jobBudget(j), a = jobActual(j)
          const flag = jobFlag(j)
          const usedPct = b.total ? Math.min((a.total / b.total) * 100, 100) : 0
          const unbilled = j.changes.some((c) => c.approved && !c.billed)
          return (
            <button key={j.id} onClick={() => onOpen(j.id)} style={{
              textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 16, cursor: 'pointer', display: 'block', width: '100%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{j.name}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{j.customer}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>{fmt(b.contract)}</div>
                  <div style={{ fontSize: 12, color: FAINT }}>{j.status}</div>
                </div>
              </div>
              <div style={{ marginTop: 13, height: 5, background: '#EDEFF2', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: usedPct + '%', height: '100%', background: FLAG_COLOR[flag] }} />
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                <Dot flag={flag} />
                <span style={{ color: FLAG_COLOR[flag], fontWeight: 600 }}>{FLAG_LABEL[flag]}</span>
                <span className="num" style={{ color: MUTED }}>{fmt(a.total)} of {fmt(b.total)} cost</span>
                {unbilled && <span style={{ marginLeft: 'auto', color: RED, fontWeight: 600 }}>Unbilled change order</span>}
              </div>
            </button>
          )
        })}
      </div>

      <Btn full onClick={onNew}>New job</Btn>
    </div>
  )
}

/* ─── 4.2 New job ─────────────────────────────────────────────────────── */

function NewJob({ onCancel, onSave }) {
  const [customer, setCustomer] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [asmId, setAsmId] = useState(ASSEMBLIES[0].id)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState(String(ASSEMBLIES[0].price))
  const [picked, setPicked] = useState([])
  const [showLines, setShowLines] = useState(false)

  const asm = asmById(asmId)
  const cust = customer === '__new' ? newCustomer.trim() : customer

  const pickAsm = (id) => { setAsmId(id); setPrice(String(asmById(id).price)) }

  const add = () => {
    const q = parseFloat(qty)
    const p = parseFloat(price)
    if (!q || q <= 0 || !p) return
    setPicked((prev) => [...prev, { assemblyId: asmId, qty: q, price: p }])
    setQty('')
  }

  const preview = useMemo(() => jobBudget({ assemblies: picked, labor: [], materials: [], changes: [] }), [picked])
  const ready = cust && name.trim() && picked.length > 0

  return (
    <div>
      <Btn kind="quiet" small onClick={onCancel}>← Jobs</Btn>
      <h1 style={{ fontFamily: head, fontSize: 27, fontWeight: 700, letterSpacing: '-.015em', margin: '10px 0 20px' }}>New job</h1>

      <Field label="Customer">
        <select style={inputStyle} value={customer} onChange={(e) => setCustomer(e.target.value)}>
          <option value="">Select a customer…</option>
          {CUSTOMERS.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new">+ Add a new customer</option>
        </select>
        {customer === '__new' && (
          <input style={{ ...inputStyle, marginTop: 9 }} placeholder="Customer name" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
        )}
      </Field>

      <Field label="Job name">
        <input style={inputStyle} placeholder="e.g. Smith residence" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Address">
        <input style={inputStyle} placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 11 }}>What are you building</div>

        <select style={{ ...inputStyle, marginBottom: 9 }} value={asmId} onChange={(e) => pickAsm(e.target.value)}>
          {ASSEMBLIES.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: FAINT, marginBottom: 4 }}>Quantity ({asm.unit})</div>
            <input className="num" style={inputStyle} inputMode="decimal" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: FAINT, marginBottom: 4 }}>Price per {asm.unit}</div>
            <input className="num" style={inputStyle} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <Btn kind="ghost" full small onClick={add}>Add to job</Btn>

        {picked.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
            {picked.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 14 }}>
                <div style={{ flex: 1 }}>
                  <span className="num" style={{ fontWeight: 600 }}>{p.qty} {asmById(p.assemblyId).unit}</span>{' '}
                  {asmById(p.assemblyId).name}
                </div>
                <span className="num" style={{ fontWeight: 600 }}>{fmt(p.qty * p.price)}</span>
                <button onClick={() => setPicked((prev) => prev.filter((_, x) => x !== i))} style={{ border: 'none', background: 'none', color: FAINT, cursor: 'pointer', fontSize: 17, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {picked.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED }}>Budget</span>
            <span className="num" style={{ fontFamily: head, fontSize: 22, fontWeight: 700 }}>{fmt(preview.contract)}</span>
          </div>
          <Row label="Materials" value={fmt(preview.materials)} />
          <Row label="Labor" value={`${hrs(preview.laborHours)} · ${fmt(preview.labor)}`} />
          <Row label="Gross margin" value={pct(((preview.contract - preview.total) / preview.contract) * 100).replace('+', '')} bold />

          <button onClick={() => setShowLines(!showLines)} style={{ marginTop: 10, border: 'none', background: 'none', padding: 0, color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {showLines ? '▾' : '▸'} What this includes
          </button>
          {showLines && (
            <div style={{ marginTop: 9, borderTop: `1px solid ${BORDER}`, paddingTop: 9 }}>
              {preview.lines.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED, padding: '3px 0' }}>
                  <span><span className="num">{l.qty % 1 === 0 ? l.qty : l.qty.toFixed(1)} {l.u}</span> · {l.name}</span>
                  <span className="num">{fmt(l.cost)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUTED, padding: '3px 0' }}>
                <span><span className="num">{preview.laborHours.toFixed(1)} hr</span> · Install labor</span>
                <span className="num">{fmt(preview.labor)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <Btn full disabled={!ready} onClick={() => ready && onSave({ customer: cust, name: name.trim(), address: address.trim(), picked })}>
        Save job
      </Btn>
      <p style={{ fontSize: 12.5, color: FAINT, textAlign: 'center', marginTop: 10 }}>
        Creates the job in QuickBooks as a sub-customer with an estimate.
      </p>
    </div>
  )
}

const Row = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14 }}>
    <span style={{ color: MUTED }}>{label}</span>
    <span className="num" style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
  </div>
)

/* ─── The job container + persistent header ───────────────────────────── */

const JOB_TABS = [
  { id: 'overview', label: 'Job' },
  { id: 'labor', label: 'Labor' },
  { id: 'materials', label: 'Materials' },
  { id: 'changes', label: 'Changes' },
]

function JobContainer({ job, tab, setTab, onBack, today, onLabor, onMaterial, onChange, onBill }) {
  const b = jobBudget(job), a = jobActual(job)
  const flag = jobFlag(job)
  const usedPct = b.total ? Math.min((a.total / b.total) * 100, 100) : 0

  return (
    <div>
      <Btn kind="quiet" small onClick={onBack}>← Jobs</Btn>

      {/* persistent job header — visible on every screen inside the job */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, marginTop: 8,
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 2px 10px rgba(16,24,40,.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: head, fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>{job.name}</div>
            <div style={{ fontSize: 13, color: MUTED }}>{job.customer}{job.address ? ' · ' + job.address : ''}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{fmt(b.contract)}</div>
            <div style={{ fontSize: 11.5, color: FAINT }}>contract</div>
          </div>
        </div>
        <div style={{ marginTop: 11, height: 6, background: '#EDEFF2', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: usedPct + '%', height: '100%', background: FLAG_COLOR[flag], transition: 'width .4s' }} />
        </div>
        <div className="num" style={{ marginTop: 7, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Dot flag={flag} />
          <span style={{ color: MUTED }}>{fmt(a.total)} spent of {fmt(b.total)} budget</span>
          <span style={{ marginLeft: 'auto', color: FLAG_COLOR[flag], fontWeight: 600 }}>
            {b.total ? pct(((a.total - b.total) / b.total) * 100) : '—'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '14px 0 18px', background: '#EDEFF2', padding: 4, borderRadius: 10 }}>
        {JOB_TABS.map((t) => {
          const on = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 6px', border: 'none', borderRadius: 7, cursor: 'pointer',
              background: on ? '#fff' : 'transparent', color: on ? INK : MUTED, fontWeight: on ? 600 : 500, fontSize: 14,
              boxShadow: on ? '0 1px 3px rgba(16,24,40,.10)' : 'none',
            }}>{t.label}</button>
          )
        })}
      </div>

      {tab === 'overview' && <Overview job={job} b={b} a={a} onBill={onBill} onGoChanges={() => setTab('changes')} />}
      {tab === 'labor' && <LaborScreen job={job} today={today} onSave={onLabor} />}
      {tab === 'materials' && <MaterialScreen job={job} today={today} onSave={onMaterial} />}
      {tab === 'changes' && <ChangeScreen job={job} onSave={onChange} onBill={onBill} />}
    </div>
  )
}

/* ─── 4.6 Job view — the proof screen ─────────────────────────────────── */

function Overview({ job, b, a, onBill, onGoChanges }) {
  const rows = [
    { label: 'Materials', budget: b.materials, actual: a.materials },
    { label: 'Labor', budget: b.labor, actual: a.labor, sub: `${b.laborHours.toFixed(1)} hr budgeted · ${a.laborHours.toFixed(1)} hr worked` },
    { label: 'Total cost', budget: b.total, actual: a.total, bold: true },
  ]
  const unbilled = job.changes.filter((c) => c.approved && !c.billed)

  return (
    <div>
      {unbilled.length > 0 && (
        <button onClick={onGoChanges} style={{
          width: '100%', textAlign: 'left', background: '#FDF1EF', border: `1px solid #F3CFC9`, borderRadius: 12,
          padding: 14, marginBottom: 14, cursor: 'pointer',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 3 }}>
            {unbilled.length} approved change order{unbilled.length > 1 ? 's' : ''} not billed
          </div>
          <div className="num" style={{ fontSize: 13, color: '#8C4438' }}>
            {fmt(unbilled.reduce((s, c) => s + c.amount, 0))} of work you did and haven't charged for.
          </div>
        </button>
      )}

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr .9fr .8fr', padding: '11px 16px', background: SOFT, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED }}>
          <span></span><span style={{ textAlign: 'right' }}>Budget</span><span style={{ textAlign: 'right' }}>Actual</span><span style={{ textAlign: 'right' }}>Variance</span>
        </div>
        {rows.map((r) => {
          const v = r.actual - r.budget
          const p = r.budget ? (v / r.budget) * 100 : 0
          const c = v > r.budget * 0.10 ? RED : v > r.budget * 0.02 ? AMBER : GREEN
          return (
            <div key={r.label} style={{ borderBottom: `1px solid ${BORDER}`, padding: '12px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr .9fr .8fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: r.bold ? 700 : 500 }}>{r.label}</span>
                <span className="num" style={{ textAlign: 'right', fontSize: 14, color: MUTED }}>{fmt(r.budget)}</span>
                <span className="num" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{fmt(r.actual)}</span>
                <span className="num" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: c }}>{pct(p)}</span>
              </div>
              {r.sub && <div className="num" style={{ fontSize: 12, color: FAINT, marginTop: 3 }}>{r.sub}</div>}
            </div>
          )
        })}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.7fr .8fr', padding: '13px 16px', background: SOFT }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Gross profit</span>
          <span className="num" style={{ textAlign: 'right', fontSize: 14, color: MUTED }}>{fmt(b.contract)} contract</span>
          <span className="num" style={{ textAlign: 'right', fontSize: 15, fontWeight: 700 }}>{fmt(b.contract - a.total)}</span>
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Change orders</div>
        {job.changes.length === 0 && <div style={{ fontSize: 14, color: FAINT }}>None on this job.</div>}
        {job.changes.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>{c.desc}</div>
              <div style={{ fontSize: 12, color: c.billed ? GREEN : c.approved ? RED : FAINT, fontWeight: 600 }}>
                {!c.approved ? 'Not approved' : c.billed ? 'Billed' : 'Approved · not billed'}
              </div>
            </div>
            <span className="num" style={{ fontWeight: 600, fontSize: 14 }}>{fmt(c.amount)}</span>
            {c.approved && !c.billed && <Btn kind="ghost" small onClick={() => onBill(c.id)}>Bill it</Btn>}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12.5, color: FAINT, textAlign: 'center', marginTop: 14 }}>
        {job.labor.reduce((s, l) => s + l.crew.length, 0)} time entries · {job.materials.length} expenses · all coded to this job in QuickBooks
      </p>
    </div>
  )
}

/* ─── 4.3 Daily labor — the fast one ──────────────────────────────────── */

function LaborScreen({ job, today, onSave }) {
  const last = job.labor[job.labor.length - 1]
  const [date, setDate] = useState(today)
  const [crew, setCrew] = useState(last ? last.crew : [])
  const [hours, setHours] = useState(8)

  useEffect(() => { setDate(today) }, [today])

  const toggle = (p) => setCrew((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  const total = crew.length * hours

  const save = () => {
    if (!crew.length || !hours) return
    onSave({ date, crew, hours })
    setHours(8)
  }

  return (
    <div>
      <Field label="Date">
        <input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="Who worked">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CREW.map((p) => <Chip key={p} on={crew.includes(p)} onClick={() => toggle(p)}>{p}</Chip>)}
        </div>
      </Field>

      <Field label="Hours each">
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <button onClick={() => setHours((h) => Math.max(0.5, +(h - 0.5).toFixed(1)))} style={stepBtn}>−</button>
          <div className="num" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}`, borderRadius: 10, background: '#fff', fontSize: 24, fontWeight: 700 }}>
            {hours}
          </div>
          <button onClick={() => setHours((h) => +(h + 0.5).toFixed(1))} style={stepBtn}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[4, 6, 8, 10].map((h) => (
            <button key={h} onClick={() => setHours(h)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              border: `1px solid ${hours === h ? INK : BORDER}`, background: hours === h ? '#EDEFF2' : '#fff', color: INK,
            }}>{h}</button>
          ))}
        </div>
      </Field>

      <Btn full disabled={!crew.length} onClick={save}>
        Save labor{total ? ` · ${total} hours` : ''}
      </Btn>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>Entered so far</div>
        {job.labor.length === 0 && <div style={{ fontSize: 14, color: FAINT }}>Nothing yet. Pick the crew and hit save — it takes a few seconds.</div>}
        {[...job.labor].reverse().map((l) => (
          <div key={l.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{dshort(l.date)}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{l.crew.join(', ')}</div>
            </div>
            <div className="num" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{l.crew.length * l.hours} hr</div>
              <div style={{ fontSize: 12, color: FAINT }}>{fmt(l.crew.length * l.hours * LABOR_RATE)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const stepBtn = {
  width: 62, border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 10,
  fontSize: 26, color: INK, cursor: 'pointer', lineHeight: 1,
}

/* ─── 4.4 Materials ───────────────────────────────────────────────────── */

function MaterialScreen({ job, today, onSave }) {
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState(today)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => { setDate(today) }, [today])

  const pickPhoto = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setPhoto(f.name)
    setPhotoUrl(URL.createObjectURL(f))
  }

  const ready = vendor && desc.trim() && parseFloat(amount) > 0
  const save = () => {
    if (!ready) return
    onSave({ vendor, date, desc: desc.trim(), amount: parseFloat(amount), photo })
    setDesc(''); setAmount(''); setPhoto(null); setPhotoUrl(null)
  }

  return (
    <div>
      <Field label="Vendor">
        <select style={inputStyle} value={vendor} onChange={(e) => setVendor(e.target.value)}>
          <option value="">Select a vendor…</option>
          {VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>

      <Field label="Date">
        <input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="What came in">
        <input style={inputStyle} placeholder="e.g. Cedar panels + posts" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>

      <Field label="Amount">
        <input className="num" style={{ ...inputStyle, fontSize: 22, fontWeight: 700 }} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>

      <Field label="Delivery ticket">
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, cursor: 'pointer',
          border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: photoUrl ? 10 : '20px 14px', background: '#fff',
        }}>
          <input type="file" accept="image/*" capture="environment" onChange={pickPhoto} style={{ display: 'none' }} />
          {photoUrl
            ? <><img src={photoUrl} alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 7 }} /><span style={{ fontSize: 14, color: MUTED, flex: 1 }}>{photo}</span></>
            : <span style={{ fontSize: 14, color: MUTED, fontWeight: 500 }}>Take a photo of the ticket</span>}
        </label>
      </Field>

      <Btn full disabled={!ready} onClick={save}>Save delivery</Btn>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>On this job</div>
        {job.materials.length === 0 && <div style={{ fontSize: 14, color: FAINT }}>No deliveries logged yet.</div>}
        {[...job.materials].reverse().map((m) => (
          <div key={m.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.vendor}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{m.desc}</div>
            </div>
            <div className="num" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt2(m.amount)}</div>
              <div style={{ fontSize: 12, color: FAINT }}>{dshort(m.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 4.5 Change orders ───────────────────────────────────────────────── */

function ChangeScreen({ job, onSave, onBill }) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [approved, setApproved] = useState(true)

  const ready = desc.trim() && parseFloat(amount) > 0
  const save = () => {
    if (!ready) return
    onSave({ desc: desc.trim(), amount: parseFloat(amount), approved })
    setDesc(''); setAmount('')
  }

  return (
    <div>
      <Field label="What changed">
        <input style={inputStyle} placeholder="e.g. Add 40 LF along the driveway" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>

      <Field label="Amount">
        <input className="num" style={{ ...inputStyle, fontSize: 22, fontWeight: 700 }} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>

      <Field label="Did the customer approve it">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><Chip on={approved} onClick={() => setApproved(true)}>Yes</Chip></div>
          <div style={{ flex: 1 }}><Chip on={!approved} onClick={() => setApproved(false)}>Not yet</Chip></div>
        </div>
      </Field>

      <Btn full disabled={!ready} onClick={save}>Save change order</Btn>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>On this job</div>
        {job.changes.length === 0 && <div style={{ fontSize: 14, color: FAINT }}>None yet.</div>}
        {[...job.changes].reverse().map((c) => (
          <div key={c.id} style={{
            background: CARD, borderRadius: 10, padding: '12px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10,
            border: `1px solid ${c.approved && !c.billed ? '#F3CFC9' : BORDER}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>{c.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.billed ? GREEN : c.approved ? RED : FAINT }}>
                {!c.approved ? 'Waiting on approval' : c.billed ? 'Billed' : 'Approved · not billed'}
              </div>
            </div>
            <span className="num" style={{ fontWeight: 600, fontSize: 14 }}>{fmt(c.amount)}</span>
            {c.approved && !c.billed && <Btn kind="ghost" small onClick={() => onBill(c.id)}>Bill it</Btn>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── QuickBooks pane ─────────────────────────────────────────────────── */

function QboList({ rows, type, open, setOpen }) {
  if (rows.length === 0) {
    return <div style={{ color: FAINT, fontSize: 14, padding: 30, textAlign: 'center' }}>Nothing here yet.</div>
  }
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr 130px 96px 88px', gap: 10, padding: '10px 14px', background: SOFT, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED }}>
        <span>Id</span><span>{type === 'Customer' ? 'Name' : type === 'Purchase' ? 'Payee' : type === 'TimeActivity' ? 'Employee' : 'Customer'}</span>
        <span>Date</span><span style={{ textAlign: 'right' }}>{type === 'TimeActivity' ? 'Hours' : 'Amount'}</span><span style={{ textAlign: 'right' }}>Status</span>
      </div>
      {rows.map((r) => (
        <div key={r.key} className={r.fresh ? 'fresh' : ''} style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr 130px 96px 88px', gap: 10, padding: '11px 14px', alignItems: 'center' }}>
            <button onClick={() => setOpen(open === r.key ? null : r.key)} className="num" style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', color: QBDARK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {open === r.key ? '▾' : '▸'} {r.qid}
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: r.isJob ? 600 : 500, paddingLeft: r.isJob ? 14 : 0 }}>
                {r.isJob && <span style={{ color: FAINT, marginLeft: -14, marginRight: 4 }}>└</span>}{r.title}
              </div>
              {r.sub && <div style={{ fontSize: 12, color: FAINT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: r.isJob ? 14 : 0 }}>{r.sub}</div>}
            </div>
            <span className="num" style={{ fontSize: 13, color: MUTED }}>{dshort(r.date)}</span>
            <span className="num" style={{ fontSize: 13.5, textAlign: 'right', fontWeight: 600 }}>
              {r.type === 'TimeActivity' ? r.hours + ' hr' : r.amount != null ? fmt2(r.amount) : '—'}
            </span>
            <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: r.status === 'synced' ? QB : AMBER }}>
              {r.status === 'synced' ? '✓ synced' : 'queued…'}
            </span>
          </div>
          {open === r.key && (
            <pre style={{
              margin: 0, padding: '12px 16px 16px', background: '#0F1720', color: '#CFE9C4', fontSize: 11.5, lineHeight: 1.55,
              overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>{JSON.stringify(r.payload, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  )
}

function Profitability({ jobs }) {
  const totals = jobs.reduce((t, j) => {
    const b = jobBudget(j), a = jobActual(j)
    t.contract += b.contract; t.mat += a.materials; t.lab += a.labor; t.est += b.total
    return t
  }, { contract: 0, mat: 0, lab: 0, est: 0 })

  const cell = { padding: '11px 12px', fontSize: 13.5, textAlign: 'right' }
  const th = { ...cell, fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700 }}>Job profitability by customer</div>
        <div style={{ fontSize: 13, color: MUTED }}>QueFence Inc. · all dates · costs coded from the portal, nothing keyed by hand</div>
      </div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ background: SOFT, borderBottom: `1px solid ${BORDER}` }}>
              <th style={{ ...th, textAlign: 'left' }}>Customer : Job</th>
              <th style={th}>Contract</th>
              <th style={th}>Material cost</th>
              <th style={th}>Labor cost</th>
              <th style={th}>Total cost</th>
              <th style={th}>Gross profit</th>
              <th style={th}>Margin</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const b = jobBudget(j), a = jobActual(j)
              const gp = b.contract - a.total
              const m = b.contract ? (gp / b.contract) * 100 : 0
              return (
                <tr key={j.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ ...cell, textAlign: 'left' }}>
                    <div style={{ color: MUTED, fontSize: 12 }}>{j.customer}</div>
                    <div style={{ fontWeight: 600 }}>{j.name}</div>
                  </td>
                  <td className="num" style={cell}>{fmt(b.contract)}</td>
                  <td className="num" style={cell}>{fmt(a.materials)}</td>
                  <td className="num" style={cell}>{fmt(a.labor)}</td>
                  <td className="num" style={cell}>{fmt(a.total)}</td>
                  <td className="num" style={{ ...cell, fontWeight: 600 }}>{fmt(gp)}</td>
                  <td className="num" style={{ ...cell, fontWeight: 600, color: m < 25 ? RED : m < 35 ? AMBER : GREEN }}>{m.toFixed(0)}%</td>
                </tr>
              )
            })}
            <tr style={{ background: SOFT }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 700 }}>Total</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(totals.contract)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(totals.mat)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(totals.lab)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(totals.mat + totals.lab)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(totals.contract - totals.mat - totals.lab)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>
                {totals.contract ? (((totals.contract - totals.mat - totals.lab) / totals.contract) * 100).toFixed(0) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12.5, color: FAINT, marginTop: 12 }}>
        Every row here came from a QuickBooks object the portal created. No one in the office made a judgment call about which job a cost belonged to.
      </p>
    </div>
  )
}
