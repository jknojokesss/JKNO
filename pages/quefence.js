import { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'

/* ─── QueFence job entry portal — demo scaffold ───────────────────────────
   UI only. The QuickBooks pane on the right is a simulation of what the
   push would produce; swap it for the live sandbox company at demo time.

   Two rules for the left side:
   1. Every screen lives inside a job. There is no path to an entry that
      does not begin with choosing a job.
   2. No accounting words. Ever. "Estimate" is "the price we quoted",
      "invoice" is "bill", "variance" is "over by $366". The accounting
      vocabulary lives on the right side, in QuickBooks. That is the pitch:
      plain English goes in, accounting comes out.
   ────────────────────────────────────────────────────────────────────── */

const BIZ = 'QueFence'

// neutral shell — brand colors drop in here once their site is sampled
const INK = '#16181C', BG = '#F4F5F7', CARD = '#FFFFFF', BORDER = '#E3E5E9'
const MUTED = '#6B7280', FAINT = '#9AA1AC', SOFT = '#F8F9FB'
// the one accent family: money flags only
const GREEN = '#1E7A3A', AMBER = '#C2761E', RED = '#C0392B'
// the other system — Intuit green, and QuickBooks' own charcoal nav
const QB = '#2CA01C', QBDARK = '#0D6B0D', QBINK = '#393A3D', QBLINE = '#D4D7DC'

const head = "'Charter','Bitstream Charter','Sitka Text','Iowan Old Style',Georgia,serif"
const ui = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

const LABOR_RATE = 42 // burdened crew hour

const fmt = (n) => '$' + Math.round(n).toLocaleString()
const fmt2 = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dshort = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + +d
}

/* ─── Assemblies: data, not code. Roofing is a new row. ───────────────── */

const ASSEMBLIES = [
  {
    id: 'cedar6', name: "6' cedar privacy fence", unit: 'LF', price: 48,
    lines: [
      { item: '4x4x8 cedar post', type: 'material', per: 0.125 },
      { item: "6'x8' cedar privacy panel", type: 'material', per: 0.125 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25 },
      { item: 'Cedar post cap', type: 'material', per: 0.125 },
      { item: 'Fence screws, 5 lb box', type: 'material', per: 0.02 },
      { item: 'Install labor', type: 'labor', per: 0.20 },
    ],
  },
  {
    id: 'vinyl6', name: "6' vinyl privacy fence, white", unit: 'LF', price: 62,
    lines: [
      { item: 'Vinyl line post, 5x5', type: 'material', per: 0.125 },
      { item: "6'x8' vinyl panel kit", type: 'material', per: 0.125 },
      { item: 'Vinyl post cap', type: 'material', per: 0.125 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25 },
      { item: 'Install labor', type: 'labor', per: 0.18 },
    ],
  },
  {
    id: 'chain4', name: "4' chain link, galvanized", unit: 'LF', price: 28,
    lines: [
      { item: '1-3/8" line post', type: 'material', per: 0.10 },
      { item: "Top rail, 10' stick", type: 'material', per: 0.10 },
      { item: "4' galvanized mesh", type: 'material', per: 1 },
      { item: 'Tension & brace kit', type: 'material', per: 0.02 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.20 },
      { item: 'Install labor', type: 'labor', per: 0.12 },
    ],
  },
  {
    id: 'alum4', name: "4' aluminum ornamental, black", unit: 'LF', price: 68,
    lines: [
      { item: 'Aluminum line post', type: 'material', per: 0.125 },
      { item: "4'x6' aluminum panel", type: 'material', per: 0.167 },
      { item: 'Bracket kit', type: 'material', per: 0.167 },
      { item: 'Concrete mix, 60 lb bag', type: 'material', per: 0.25 },
      { item: 'Install labor', type: 'labor', per: 0.16 },
    ],
  },
  {
    id: 'gate1', name: "Walk gate, 4' cedar", unit: 'EA', price: 625,
    lines: [
      { item: 'Gate frame kit', type: 'material', per: 1 },
      { item: 'Cedar pickets, gate', type: 'material', per: 1 },
      { item: 'Hinges & latch set', type: 'material', per: 1 },
      { item: '4x4 gate post', type: 'material', per: 2 },
      { item: 'Install labor', type: 'labor', per: 2.5 },
    ],
  },
  {
    id: 'gate2', name: "Drive gate, 10' double cedar", unit: 'EA', price: 1650,
    lines: [
      { item: 'Heavy gate frame kit', type: 'material', per: 1 },
      { item: 'Cedar pickets, drive gate', type: 'material', per: 1 },
      { item: 'Drop rod & cane bolt', type: 'material', per: 1 },
      { item: 'Heavy hinges & latch', type: 'material', per: 1 },
      { item: '6x6 gate post', type: 'material', per: 2 },
      { item: 'Install labor', type: 'labor', per: 6 },
    ],
  },
  {
    id: 'tearout', name: 'Tear out & haul away the old fence', unit: 'LF', price: 9,
    lines: [
      { item: 'Dump fees', type: 'fee', per: 1, cost: 1.20 },
      { item: 'Demo labor', type: 'labor', per: 0.08 },
    ],
  },
]

/* ─── What's in the yard. Assembly line items resolve against this. ───── */

// `sell` + `price` = also sold over the counter to other contractors.
const STOCK_SEED = [
  { name: '4x4x8 cedar post', unit: 'ea', onHand: 64, cost: 26, whole: true, sell: true, price: 36 },
  { name: "6'x8' cedar privacy panel", unit: 'ea', onHand: 12, cost: 92, whole: true, sell: true, price: 128 },
  { name: 'Cedar post cap', unit: 'ea', onHand: 96, cost: 5, whole: true, sell: true, price: 8 },
  { name: 'Fence screws, 5 lb box', unit: 'box', onHand: 14, cost: 47.50, whole: true, sell: true, price: 66 },
  { name: 'Concrete mix, 60 lb bag', unit: 'bag', onHand: 180, cost: 7, whole: true },
  { name: 'Vinyl line post, 5x5', unit: 'ea', onHand: 22, cost: 42, whole: true, sell: true, price: 58 },
  { name: "6'x8' vinyl panel kit", unit: 'ea', onHand: 9, cost: 155, whole: true, sell: true, price: 215 },
  { name: 'Vinyl post cap', unit: 'ea', onHand: 30, cost: 9, whole: true, sell: true, price: 14 },
  { name: '1-3/8" line post', unit: 'ea', onHand: 78, cost: 18, whole: true, sell: true, price: 26 },
  { name: "Top rail, 10' stick", unit: 'ea', onHand: 44, cost: 21, whole: true, sell: true, price: 30 },
  { name: "4' galvanized mesh", unit: 'LF', onHand: 320, cost: 4.60, sell: true, price: 6.40 },
  { name: 'Tension & brace kit', unit: 'kit', onHand: 6, cost: 42.50, whole: true, sell: true, price: 59 },
  { name: 'Aluminum line post', unit: 'ea', onHand: 18, cost: 62, whole: true, sell: true, price: 86 },
  { name: "4'x6' aluminum panel", unit: 'ea', onHand: 11, cost: 148, whole: true, sell: true, price: 205 },
  { name: 'Bracket kit', unit: 'kit', onHand: 24, cost: 12, whole: true, sell: true, price: 18 },
  { name: 'Gate frame kit', unit: 'ea', onHand: 4, cost: 95, whole: true, sell: true, price: 132 },
  { name: 'Cedar pickets, gate', unit: 'set', onHand: 6, cost: 70, whole: true, sell: true, price: 98 },
  { name: 'Hinges & latch set', unit: 'set', onHand: 7, cost: 58, whole: true, sell: true, price: 80 },
  { name: '4x4 gate post', unit: 'ea', onHand: 26, cost: 26, whole: true, sell: true, price: 36 },
  { name: 'Heavy gate frame kit', unit: 'ea', onHand: 3, cost: 260, whole: true, sell: true, price: 360 },
  { name: 'Cedar pickets, drive gate', unit: 'set', onHand: 4, cost: 165, whole: true, sell: true, price: 229 },
  { name: 'Drop rod & cane bolt', unit: 'set', onHand: 5, cost: 85, whole: true, sell: true, price: 118 },
  { name: 'Heavy hinges & latch', unit: 'set', onHand: 4, cost: 140, whole: true, sell: true, price: 194 },
  { name: '6x6 gate post', unit: 'ea', onHand: 8, cost: 68, whole: true, sell: true, price: 94 },
]

const stockOf = (list, name) => list.find((s) => s.name === name)

const CREW = ['Miguel R.', 'Danny T.', 'Junior P.', 'Wes K.', 'Tomás A.']
const VENDORS = ['Master Halco', 'Cedar Supply Co.', 'Ready-Mix Supply', 'Fastenal', 'Home Depot Pro', 'County Transfer Station']
const CUSTOMERS = ['Ana Delgado', 'Northview Townhomes HOA', 'Robert Callahan', 'Peter Marchetti', 'Grace Oyelaran', 'Sunrise Property Mgmt.']

/* ─── Seed jobs. Smith residence is created live in the demo. ─────────── */

const SEED_JOBS = [
  {
    id: 'j1', name: 'Delgado backyard', customer: 'Ana Delgado',
    address: '412 Ridgeway Ave', status: 'Working on it',
    assemblies: [
      { assemblyId: 'vinyl6', qty: 96, price: 62 },
      { assemblyId: 'gate2', qty: 1, price: 1650 },
    ],
    labor: [
      { id: 'l1', date: '2026-08-04', crew: ['Miguel R.', 'Danny T.'], hours: 8 },
      { id: 'l2', date: '2026-08-05', crew: ['Miguel R.', 'Danny T.'], hours: 7 },
    ],
    pulls: [
      {
        id: 'p1', date: '2026-07-30', lines: [
          { name: 'Vinyl line post, 5x5', qty: 12, cost: 42 },
          { name: "6'x8' vinyl panel kit", qty: 12, cost: 155 },
          { name: 'Vinyl post cap', qty: 12, cost: 9 },
          { name: 'Concrete mix, 60 lb bag', qty: 24, cost: 7 },
        ],
      },
    ],
    deliveries: [
      { id: 'd1', date: '2026-08-05', vendor: 'Cedar Supply Co.', desc: 'Drive gate frame, hardware and 6x6 posts', amount: 870, photo: null },
    ],
    changes: [],
    invoices: [{ id: 'i1', date: '2026-07-30', amount: 3000, memo: 'Deposit' }],
    payments: [{ id: 'y1', date: '2026-08-01', amount: 3000, method: 'Check 2214' }],
  },
  {
    id: 'j2', name: 'Northview Townhomes — phase 1', customer: 'Northview Townhomes HOA',
    address: '1900 Northview Dr', status: 'Working on it',
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
    pulls: [
      {
        id: 'p2', date: '2026-07-21', lines: [
          { name: '1-3/8" line post', qty: 42, cost: 18 },
          { name: "Top rail, 10' stick", qty: 42, cost: 21 },
          { name: "4' galvanized mesh", qty: 420, cost: 4.60 },
          { name: 'Tension & brace kit', qty: 9, cost: 42.50 },
          { name: 'Concrete mix, 60 lb bag', qty: 84, cost: 7 },
        ],
      },
    ],
    deliveries: [
      { id: 'd2', date: '2026-07-28', vendor: 'Master Halco', desc: 'Extra mesh and posts for the east line', amount: 1120, photo: null },
      { id: 'd3', date: '2026-08-06', vendor: 'County Transfer Station', desc: 'Dump fees, old fence haul away', amount: 582, photo: null },
    ],
    changes: [
      { id: 'c1', desc: 'Add 60 more feet along the east property line', amount: 2240, approved: true, billed: false },
    ],
    invoices: [{ id: 'i2', date: '2026-07-25', amount: 8000, memo: 'Progress billing' }],
    payments: [{ id: 'y2', date: '2026-08-03', amount: 5000, method: 'ACH' }],
  },
  {
    id: 'j3', name: 'Callahan property', customer: 'Robert Callahan',
    address: '77 Old Mill Rd', status: 'Done',
    assemblies: [
      { assemblyId: 'cedar6', qty: 210, price: 48 },
      { assemblyId: 'gate1', qty: 1, price: 625 },
    ],
    labor: [
      { id: 'l7', date: '2026-07-08', crew: ['Miguel R.', 'Danny T.', 'Junior P.'], hours: 8 },
      { id: 'l8', date: '2026-07-09', crew: ['Miguel R.', 'Danny T.'], hours: 9 },
    ],
    pulls: [
      {
        id: 'p3', date: '2026-07-08', lines: [
          { name: '4x4x8 cedar post', qty: 27, cost: 26 },
          { name: "6'x8' cedar privacy panel", qty: 27, cost: 92 },
          { name: 'Cedar post cap', qty: 27, cost: 5 },
          { name: 'Concrete mix, 60 lb bag', qty: 53, cost: 7 },
          { name: 'Fence screws, 5 lb box', qty: 5, cost: 47.50 },
        ],
      },
      {
        id: 'p4', date: '2026-07-09', lines: [
          { name: 'Gate frame kit', qty: 1, cost: 95 },
          { name: 'Cedar pickets, gate', qty: 1, cost: 70 },
          { name: 'Hinges & latch set', qty: 1, cost: 58 },
          { name: '4x4 gate post', qty: 2, cost: 26 },
        ],
      },
    ],
    deliveries: [],
    changes: [
      { id: 'c2', desc: 'Move the gate to the south side after the walkthrough', amount: 340, approved: true, billed: true },
    ],
    invoices: [
      { id: 'i3', date: '2026-07-06', amount: 4000, memo: 'Deposit' },
      { id: 'i4', date: '2026-07-15', amount: 7045, memo: 'Final bill' },
    ],
    payments: [
      { id: 'y3', date: '2026-07-07', amount: 4000, method: 'Check 1180' },
      { id: 'y4', date: '2026-07-24', amount: 4045, method: 'Check 1206' },
    ],
  },
  {
    id: 'j4', kind: 'wholesale', name: 'Marchetti Fencing — counter sale', customer: 'Peter Marchetti',
    address: 'Picked up at the yard', status: 'Picked up',
    assemblies: [],
    saleLines: [
      { name: "6'x8' cedar privacy panel", qty: 6, cost: 92, price: 128 },
      { name: '4x4x8 cedar post', qty: 12, cost: 26, price: 36 },
      { name: 'Hinges & latch set', qty: 2, cost: 58, price: 80 },
    ],
    labor: [],
    pulls: [{
      id: 'p5', date: '2026-08-10', lines: [
        { name: "6'x8' cedar privacy panel", qty: 6, cost: 92 },
        { name: '4x4x8 cedar post', qty: 12, cost: 26 },
        { name: 'Hinges & latch set', qty: 2, cost: 58 },
      ],
    }],
    deliveries: [],
    changes: [],
    invoices: [{ id: 'i5', date: '2026-08-10', amount: 1360, memo: 'Counter sale' }],
    payments: [],
  },
]

/* Stock bought for the yard. Not a job cost — it sits in inventory until
   a job pulls it or somebody buys it over the counter. */
const SEED_RECEIPTS = [
  {
    id: 'r1', date: '2026-07-14', vendor: 'Master Halco', ref: 'PO-1841',
    lines: [
      { name: '1-3/8" line post', qty: 60, cost: 18 },
      { name: "4' galvanized mesh", qty: 500, cost: 4.60 },
      { name: "Top rail, 10' stick", qty: 60, cost: 21 },
    ],
  },
  {
    id: 'r2', date: '2026-07-27', vendor: 'Cedar Supply Co.', ref: 'PO-1858',
    lines: [
      { name: "6'x8' cedar privacy panel", qty: 40, cost: 92 },
      { name: '4x4x8 cedar post', qty: 80, cost: 26 },
      { name: 'Cedar post cap', qty: 120, cost: 5 },
    ],
  },
]

const receiptTotal = (r) => r.lines.reduce((s, l) => s + l.qty * l.cost, 0)

/* ─── Costing ─────────────────────────────────────────────────────────── */

const asmById = (id) => ASSEMBLIES.find((a) => a.id === id)

// What a quantity of an assembly needs, resolved against the stock list.
function explode(assemblyId, qty, stock) {
  const a = asmById(assemblyId)
  if (!a) return { materials: [], laborHours: 0, fees: 0 }
  const materials = []
  let laborHours = 0, fees = 0
  a.lines.forEach((l) => {
    const units = l.per * qty
    if (l.type === 'labor') { laborHours += units; return }
    if (l.type === 'fee') { fees += units * l.cost; return }
    const s = stockOf(stock, l.item)
    if (!s) return
    materials.push({ name: l.item, qty: units, unit: s.unit, cost: units * s.cost, whole: s.whole })
  })
  return { materials, laborHours, fees }
}

function jobBudget(job, stock) {
  // A counter sale has no crew and no assemblies — cost is what left the shelf.
  if (job.kind === 'wholesale') {
    const mat = job.saleLines.reduce((s, l) => s + l.qty * l.cost, 0)
    const contract = job.saleLines.reduce((s, l) => s + l.qty * l.price, 0)
    return { materials: mat, laborHours: 0, labor: 0, total: mat, contract, baseContract: contract, need: [] }
  }
  let mat = 0, laborHours = 0, contract = 0
  const need = []
  job.assemblies.forEach((ja) => {
    const e = explode(ja.assemblyId, ja.qty, stock)
    e.materials.forEach((m) => {
      mat += m.cost
      const f = need.find((x) => x.name === m.name)
      if (f) { f.qty += m.qty; f.cost += m.cost } else need.push({ ...m })
    })
    mat += e.fees
    laborHours += e.laborHours
    contract += ja.price * ja.qty
  })
  const changeContract = job.changes.filter((c) => c.approved).reduce((s, c) => s + c.amount, 0)
  return {
    materials: mat, laborHours, labor: laborHours * LABOR_RATE,
    total: mat + laborHours * LABOR_RATE,
    contract: contract + changeContract, baseContract: contract, need,
  }
}

const pullTotal = (p) => p.lines.reduce((s, l) => s + l.qty * l.cost, 0)

function jobActual(job) {
  const fromStock = job.pulls.reduce((s, p) => s + pullTotal(p), 0)
  const delivered = job.deliveries.reduce((s, d) => s + d.amount, 0)
  const laborHours = job.labor.reduce((s, l) => s + l.crew.length * l.hours, 0)
  return {
    fromStock, delivered, materials: fromStock + delivered,
    laborHours, labor: laborHours * LABOR_RATE,
    total: fromStock + delivered + laborHours * LABOR_RATE,
  }
}

function jobMoney(job, stock) {
  const b = jobBudget(job, stock)
  const billed = job.invoices.reduce((s, i) => s + i.amount, 0)
  const paid = job.payments.reduce((s, p) => s + p.amount, 0)
  return { contract: b.contract, billed, paid, owed: billed - paid, toBill: b.contract - billed }
}

function jobFlag(job, stock) {
  const b = jobBudget(job, stock), a = jobActual(job)
  if (job.changes.some((c) => c.approved && !c.billed)) return 'red'
  const over = b.total > 0 ? (a.total - b.total) / b.total : 0
  if (over > 0.10) return 'red'
  if (over > 0.02) return 'amber'
  return 'green'
}
const FLAG_COLOR = { green: GREEN, amber: AMBER, red: RED }

// Everything the open jobs need that the yard cannot cover. Drives the
// "stock came in" prefill, so buying closes the loop the crew opened.
function yardShortfall(jobs, stock) {
  const acc = {}
  jobs.filter((j) => j.kind !== 'wholesale' && j.status !== 'Done').forEach((j) => {
    stillNeeded(j, stock).forEach((n) => {
      if (n.short > 0) acc[n.name] = +((acc[n.name] || 0) + n.short).toFixed(1)
    })
  })
  return acc
}

// How much of each item this job still needs, for the stock-pull prefill.
function stillNeeded(job, stock) {
  const b = jobBudget(job, stock)
  const already = {}
  job.pulls.forEach((p) => p.lines.forEach((l) => { already[l.name] = (already[l.name] || 0) + l.qty }))
  return b.need.map((n) => {
    const want = n.whole ? Math.ceil(n.qty) : Math.round(n.qty * 10) / 10
    const left = Math.max(0, +(want - (already[n.name] || 0)).toFixed(1))
    const s = stockOf(stock, n.name)
    const onHand = s ? s.onHand : 0
    return {
      name: n.name, unit: n.unit, cost: s ? s.cost : 0, onHand, whole: n.whole,
      wanted: left,                          // what the job still calls for
      suggest: Math.min(left, onHand),       // never suggest more than is on the shelf
      short: Math.max(0, +(left - onHand).toFixed(1)),
    }
  }).sort((x, y) => y.wanted - x.wanted)
}

/* ─── QuickBooks mock ─────────────────────────────────────────────────── */

let QID = 100
const nextQid = () => String(++QID)

function seedQbo(jobs, stock) {
  const out = []
  const parents = {}
  const invIds = {}
  const vendorIds = {}
  VENDORS.forEach((v) => {
    const id = nextQid()
    vendorIds[v] = id
    out.push({
      key: 'vend-' + id, type: 'Vendor', qid: id, status: 'synced', date: '2026-06-30',
      title: v, sub: 'Supplier', amount: null,
      payload: { Vendor: { Id: id, DisplayName: v, Active: true, SyncToken: '0' } },
    })
  })
  SEED_RECEIPTS.forEach((r) => out.push({ ...billEntity(nextQid(), r), status: 'synced' }))
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
    const b = jobBudget(job, stock)
    const jid = nextQid()
    parents[job.name] = jid
    out.push({
      key: 'job-' + jid, type: 'Customer', qid: jid, status: 'synced', date: '2026-07-01', isJob: true,
      title: job.name, sub: 'Sub-customer of ' + job.customer, amount: null,
      payload: {
        Customer: {
          Id: jid, DisplayName: job.name, Job: true,
          ParentRef: { value: parents[job.customer], name: job.customer },
          BillAddr: { Line1: job.address }, SyncToken: '0',
        },
      },
    })
    if (job.kind === 'wholesale') {
      // Invoice with inventory items — no estimate, no journal entry.
      job.invoices.forEach((iv) => out.push({ ...wholesaleInvoiceEntity(nextQid(), iv, job, jid), status: 'synced' }))
      return
    }
    const eid = nextQid()
    out.push({
      key: 'est-' + eid, type: 'Estimate', qid: eid, status: 'synced', date: '2026-07-01',
      title: job.name, amount: b.baseContract,
      sub: job.assemblies.map((ja) => `${ja.qty} ${asmById(ja.assemblyId).unit} ${asmById(ja.assemblyId).name}`).join(' · '),
      payload: {
        Estimate: {
          Id: eid, SyncToken: '0', CustomerRef: { value: jid, name: job.name }, TotalAmt: b.baseContract,
          Line: job.assemblies.map((ja) => ({
            DetailType: 'SalesItemLineDetail', Amount: ja.qty * ja.price,
            SalesItemLineDetail: { ItemRef: { name: asmById(ja.assemblyId).name }, Qty: ja.qty, UnitPrice: ja.price },
          })),
        },
      },
    })
    job.changes.filter((c) => c.approved).forEach((c) => {
      const cid = nextQid()
      out.push({
        key: 'est-' + cid, type: 'Estimate', qid: cid, status: 'synced', date: '2026-07-20',
        title: job.name + ' — extra work', sub: c.desc, amount: c.amount,
        payload: {
          Estimate: {
            Id: cid, SyncToken: '0', CustomerRef: { value: jid, name: job.name }, TotalAmt: c.amount,
            Line: [{ DetailType: 'SalesItemLineDetail', Amount: c.amount, Description: c.desc,
              SalesItemLineDetail: { ItemRef: { name: 'Change order' }, Qty: 1, UnitPrice: c.amount } }],
          },
        },
      })
    })
    job.labor.forEach((l) => l.crew.forEach((person) => {
      const tid = nextQid()
      out.push({
        key: 'time-' + tid, type: 'TimeActivity', qid: tid, status: 'synced', date: l.date,
        title: person, sub: job.name, hours: l.hours, amount: null,
        payload: {
          TimeActivity: {
            Id: tid, SyncToken: '0', NameOf: 'Employee', TxnDate: l.date,
            EmployeeRef: { name: person }, CustomerRef: { value: jid, name: job.name },
            ItemRef: { name: 'Fence install labor' }, BillableStatus: 'Billable',
            Hours: Math.floor(l.hours), Minutes: Math.round((l.hours % 1) * 60),
          },
        },
      })
    }))
    job.pulls.forEach((p) => {
      const gid = nextQid()
      out.push({ ...jeEntity(gid, p, job.name, jid), status: 'synced' })
    })
    job.deliveries.forEach((d) => {
      const pid = nextQid()
      out.push({ ...purchaseEntity(pid, d, job.name, jid), status: 'synced' })
    })
    job.invoices.forEach((iv) => {
      const iid = nextQid()
      invIds[iv.id] = iid
      out.push({ ...invoiceEntity(iid, iv, job, jid), status: 'synced' })
    })
    job.payments.forEach((py) => {
      const yid = nextQid()
      out.push({ ...paymentEntity(yid, py, job.name, jid, invIds[job.invoices[0] && job.invoices[0].id]), status: 'synced' })
    })
  })
  return { entities: out, parents, vendorIds }
}

/* Buying stock for the yard uses ITEM based lines, not account based.
   Item lines put the material into Inventory Asset. Account lines would
   expense it on the spot and the yard would never exist in the books.
   No CustomerRef either — nobody owns this cost yet. */
function billEntity(bid, r) {
  const total = receiptTotal(r)
  return {
    key: 'bill-' + bid, type: 'Bill', qid: bid, date: r.date,
    title: r.vendor, sub: `${r.ref} · ${r.lines.length} items into the yard`, amount: total,
    payload: {
      Bill: {
        Id: bid, SyncToken: '0', TxnDate: r.date, DocNumber: r.ref,
        VendorRef: { name: r.vendor }, TotalAmt: total,
        PrivateNote: 'Stock received into inventory — not assigned to a job',
        Line: r.lines.map((l) => ({
          DetailType: 'ItemBasedExpenseLineDetail', Amount: l.qty * l.cost, Description: l.name,
          ItemBasedExpenseLineDetail: {
            ItemRef: { name: l.name, type: 'Inventory' },
            Qty: l.qty, UnitPrice: l.cost, BillableStatus: 'NotBillable',
          },
        })),
      },
    },
  }
}

/* Stock going out to a job is not a purchase — it is inventory relieved to
   job cost. A journal entry, with the job on the debit line. */
function jeEntity(gid, pull, jobName, jid) {
  const total = pullTotal(pull)
  return {
    key: 'je-' + gid, type: 'JournalEntry', qid: gid, date: pull.date,
    title: jobName, sub: pull.lines.map((l) => `${l.qty} ${l.name}`).join(' · '), amount: total,
    payload: {
      JournalEntry: {
        Id: gid, SyncToken: '0', TxnDate: pull.date, TotalAmt: total,
        PrivateNote: 'Materials pulled from stock to job',
        Line: [
          {
            DetailType: 'JournalEntryLineDetail', Amount: total, Description: 'Materials used on ' + jobName,
            JournalEntryLineDetail: {
              PostingType: 'Debit', AccountRef: { name: 'Job Materials (COGS)' },
              Entity: { Type: 'Customer', EntityRef: { value: jid, name: jobName } },
            },
          },
          {
            DetailType: 'JournalEntryLineDetail', Amount: total, Description: 'Relieve inventory',
            JournalEntryLineDetail: { PostingType: 'Credit', AccountRef: { name: 'Inventory Asset' } },
          },
        ],
      },
    },
  }
}

function purchaseEntity(pid, d, jobName, jid) {
  return {
    key: 'pur-' + pid, type: 'Purchase', qid: pid, date: d.date,
    title: d.vendor, sub: d.desc + ' — ' + jobName, amount: d.amount,
    payload: {
      Purchase: {
        Id: pid, SyncToken: '0', PaymentType: 'CreditCard', TxnDate: d.date,
        EntityRef: { name: d.vendor, type: 'Vendor' }, TotalAmt: d.amount,
        Line: [{
          DetailType: 'AccountBasedExpenseLineDetail', Amount: d.amount, Description: d.desc,
          AccountBasedExpenseLineDetail: {
            AccountRef: { name: 'Job Materials' },
            CustomerRef: { value: jid, name: jobName }, BillableStatus: 'Billable',
          },
        }],
        ...(d.photo ? { AttachableRef: [{ FileName: d.photo }] } : {}),
      },
    },
  }
}

function invoiceEntity(iid, iv, job, jid) {
  const paid = job.payments.reduce((s, p) => s + p.amount, 0)
  const bal = Math.max(0, iv.amount - Math.max(0, paid - (job.invoices
    .slice(0, job.invoices.findIndex((x) => x.id === iv.id))
    .reduce((s, x) => s + x.amount, 0))))
  return {
    key: 'inv-' + iid, type: 'Invoice', qid: iid, date: iv.date,
    title: job.name, sub: iv.memo + (bal > 0 ? ` · ${fmt(bal)} open` : ' · paid in full'), amount: iv.amount,
    payload: {
      Invoice: {
        Id: iid, SyncToken: '0', TxnDate: iv.date, CustomerRef: { value: jid, name: job.name },
        TotalAmt: iv.amount, Balance: bal,
        Line: [{
          DetailType: 'SalesItemLineDetail', Amount: iv.amount, Description: iv.memo,
          SalesItemLineDetail: { ItemRef: { name: 'Fence installation' }, Qty: 1, UnitPrice: iv.amount },
        }],
      },
    },
  }
}

/* A counter sale needs no journal entry — the invoice carries inventory
   items, so QuickBooks relieves stock and posts COGS on its own. */
function wholesaleInvoiceEntity(iid, iv, sale, sid) {
  return {
    key: 'inv-' + iid, type: 'Invoice', qid: iid, date: iv.date,
    title: sale.name, sub: `Counter sale · ${sale.saleLines.length} items · ${fmt(iv.amount)} open`, amount: iv.amount,
    payload: {
      Invoice: {
        Id: iid, SyncToken: '0', TxnDate: iv.date,
        CustomerRef: { value: sid, name: sale.name },
        TotalAmt: iv.amount, Balance: iv.amount,
        PrivateNote: 'Material sold over the counter — inventory items relieve COGS automatically',
        Line: sale.saleLines.map((l) => ({
          DetailType: 'SalesItemLineDetail', Amount: l.qty * l.price, Description: l.name,
          SalesItemLineDetail: {
            ItemRef: { name: l.name, type: 'Inventory' }, Qty: l.qty, UnitPrice: l.price,
          },
        })),
      },
    },
  }
}

function paymentEntity(yid, py, jobName, jid, linkedInvoiceId) {
  return {
    key: 'pay-' + yid, type: 'Payment', qid: yid, date: py.date,
    title: jobName, sub: 'Payment received · ' + py.method, amount: py.amount, isPayment: true,
    payload: {
      Payment: {
        Id: yid, SyncToken: '0', TxnDate: py.date, CustomerRef: { value: jid, name: jobName },
        TotalAmt: py.amount,
        Line: [{ Amount: py.amount, LinkedTxn: [{ TxnId: linkedInvoiceId || '—', TxnType: 'Invoice' }] }],
      },
    },
  }
}

/* QuickBooks Online chrome. Nav groups and page titles use Intuit's own
   wording so the split screen reads as one familiar product, not a mock. */
const QB_NAV = [
  { group: 'Sales', items: [
    { id: 'Customer', label: 'Customers', title: 'Customers', sub: 'Sub-customers are jobs' },
    { id: 'Estimate', label: 'Estimates', title: 'Estimates' },
    { id: 'money', label: 'Invoices', title: 'Invoices & payments' },
    { id: 'inventory', label: 'Products & services', title: 'Products and services', sub: 'Inventory quantity on hand' },
  ] },
  { group: 'Expenses', items: [
    { id: 'Vendor', label: 'Vendors', title: 'Vendors' },
    { id: 'Bill', label: 'Bills', title: 'Bills', sub: 'Stock bought into the yard' },
    { id: 'Purchase', label: 'Expenses', title: 'Expense transactions' },
  ] },
  { group: 'Payroll', items: [
    { id: 'TimeActivity', label: 'Time', title: 'Time activities' },
  ] },
  { group: 'Accounting', items: [
    { id: 'JournalEntry', label: 'Journal entries', title: 'Journal entries' },
  ] },
  { group: 'Reports', items: [
    { id: 'report', label: 'Reports', title: 'Job profitability by customer' },
  ] },
]
const QB_ITEMS = QB_NAV.flatMap((g) => g.items)
const qbItem = (id) => QB_ITEMS.find((i) => i.id === id) || QB_ITEMS[0]

// QBO shows a status, not a sync state. These are the real ones.
function qbStatus(r) {
  if (r.type === 'Invoice') return r.sub && r.sub.includes('paid in full') ? { t: 'Paid', c: QB } : { t: 'Open', c: '#6B6C72' }
  if (r.type === 'Payment') return { t: 'Deposited', c: QB }
  if (r.type === 'Estimate') return { t: 'Pending', c: '#8A6D1F' }
  if (r.type === 'Purchase') return { t: 'Paid', c: QB }
  if (r.type === 'Bill') return { t: 'Open', c: '#6B6C72' }
  if (r.type === 'TimeActivity') return { t: 'Billable', c: '#1B6AC9' }
  if (r.type === 'JournalEntry') return { t: 'Posted', c: QB }
  return { t: 'Active', c: QB }
}

/* ─── UI atoms ────────────────────────────────────────────────────────── */

const Btn = ({ children, onClick, kind = 'primary', full, disabled, small }) => {
  const kinds = {
    primary: { background: INK, color: '#fff' },
    ghost: { background: '#fff', color: INK, border: `1px solid ${BORDER}` },
    quiet: { background: 'transparent', color: MUTED, padding: small ? '6px 8px' : '10px 12px' },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        fontFamily: ui, fontWeight: 600, fontSize: small ? 13 : 16, cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 11, padding: small ? '8px 14px' : '17px 20px', width: full ? '100%' : 'auto',
        border: '1px solid transparent', opacity: disabled ? 0.35 : 1, ...kinds[kind],
      }}
    >{children}</button>
  )
}

const inputStyle = {
  width: '100%', fontFamily: ui, fontSize: 17, padding: '15px 14px', borderRadius: 11,
  border: `1px solid ${BORDER}`, background: '#fff', color: INK, outline: 'none',
}

const Ask = ({ children }) => (
  <div style={{ fontFamily: head, fontSize: 19, fontWeight: 600, marginBottom: 10, letterSpacing: '-.01em' }}>{children}</div>
)

const Chip = ({ on, children, onClick }) => (
  <button onClick={onClick} style={{
    fontFamily: ui, fontSize: 16, fontWeight: on ? 600 : 500, padding: '15px 16px', borderRadius: 11, cursor: 'pointer',
    border: `1.5px solid ${on ? INK : BORDER}`, background: on ? INK : '#fff', color: on ? '#fff' : INK, width: '100%',
  }}>{children}</button>
)

const Card = ({ children, style }) => (
  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: 16, ...style }}>{children}</div>
)

const Line = ({ label, value, color, bold, sub }) => (
  <div style={{ padding: '7px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
      <span style={{ fontSize: 14.5, color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span className="num" style={{ fontSize: bold ? 17 : 15, fontWeight: bold ? 700 : 600, color: color || INK }}>{value}</span>
    </div>
    {sub && <div style={{ fontSize: 12.5, color: FAINT, marginTop: 2 }}>{sub}</div>}
  </div>
)

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function QueFenceDemo() {
  const [stock, setStock] = useState(STOCK_SEED)
  const [customers, setCustomers] = useState(CUSTOMERS)
  const [vendors, setVendors] = useState(VENDORS)
  const seed = useMemo(() => seedQbo(SEED_JOBS, STOCK_SEED), [])
  const [jobs, setJobs] = useState(SEED_JOBS)
  const [qbo, setQbo] = useState(seed.entities)
  const parents = useRef(seed.parents)
  const vendorIds = useRef(seed.vendorIds)
  const counter = useRef(0)
  const uid = (p) => `${p}${++counter.current}`

  // A name typed for the first time becomes a real record, not a string.
  const ensureVendor = (name) => {
    if (!name || vendorIds.current[name]) return []
    const id = nextQid()
    vendorIds.current[name] = id
    setVendors((prev) => (prev.includes(name) ? prev : [...prev, name]))
    return [{
      key: 'vend-' + id, type: 'Vendor', qid: id, date: today,
      title: name, sub: 'Supplier', amount: null,
      payload: { Vendor: { Id: id, DisplayName: name, Active: true, SyncToken: '0' } },
    }]
  }
  const rememberCustomer = (name) =>
    setCustomers((prev) => (prev.includes(name) ? prev : [...prev, name]))

  const [view, setView] = useState({ screen: 'list' })
  const [qtab, setQtab] = useState('Customer')
  const [pane, setPane] = useState('portal')
  const [today, setToday] = useState('2026-08-13')
  const [openPayload, setOpenPayload] = useState(null)
  const [toast, setToast] = useState(null)
  const [intro, setIntro] = useState(false)
  const [touched, setTouched] = useState([]) // stock rows that just moved, for the flash

  const markTouched = (names) => {
    setTouched(names)
    setTimeout(() => setTouched([]), 6000)
  }

  useEffect(() => {
    const d = new Date()
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    try { if (!localStorage.getItem('qf_intro2')) setIntro(true) } catch (e) { setIntro(true) }
  }, [])

  const closeIntro = () => { setIntro(false); try { localStorage.setItem('qf_intro2', '1') } catch (e) {} }
  const job = jobs.find((j) => j.id === view.jobId)
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800) }

  // Save locally first, then queue the push. Never block on Intuit.
  const push = (entities, landOn) => {
    const staged = entities.map((e) => ({ ...e, status: 'queued', fresh: true }))
    setQbo((prev) => [...staged, ...prev])
    if (landOn) setQtab(landOn)
    setTimeout(() => setQbo((prev) => prev.map((e) => (staged.find((s) => s.key === e.key) ? { ...e, status: 'synced' } : e))), 850)
    setTimeout(() => setQbo((prev) => prev.map((e) => (staged.find((s) => s.key === e.key) ? { ...e, fresh: false } : e))), 6000)
  }

  const updateJob = (id, fn) => setJobs((prev) => prev.map((j) => (j.id === id ? fn(j) : j)))
  const go = (screen) => setView((v) => ({ ...v, screen }))

  /* ── actions ── */

  const createJob = ({ customer, name, address, picked }) => {
    const id = uid('job')
    rememberCustomer(customer)
    setJobs((prev) => [{
      id, name, customer, address, status: 'Working on it', assemblies: picked,
      labor: [], pulls: [], deliveries: [], changes: [], invoices: [], payments: [],
    }, ...prev])

    let parentId = parents.current[customer]
    const out = []
    if (!parentId) {
      parentId = nextQid()
      parents.current[customer] = parentId
      out.push({
        key: 'cust-' + parentId, type: 'Customer', qid: parentId, date: today,
        title: customer, sub: 'Top-level customer', amount: null,
        payload: { Customer: { Id: parentId, DisplayName: customer, Job: false, SyncToken: '0' } },
      })
    }
    const jid = nextQid()
    parents.current[name] = jid
    out.push({
      key: 'job-' + jid, type: 'Customer', qid: jid, date: today, isJob: true,
      title: name, sub: 'Sub-customer of ' + customer, amount: null,
      payload: {
        Customer: {
          Id: jid, DisplayName: name, Job: true,
          ParentRef: { value: parentId, name: customer }, BillAddr: { Line1: address }, SyncToken: '0',
        },
      },
    })
    const contract = picked.reduce((s, p) => s + p.qty * p.price, 0)
    const eid = nextQid()
    out.push({
      key: 'est-' + eid, type: 'Estimate', qid: eid, date: today, title: name, amount: contract,
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
    flash('Job started. It is in QuickBooks already.')
  }

  const receiveStock = ({ vendor, ref, date, lines }) => {
    setStock((prev) => prev.map((s) => {
      const l = lines.find((x) => x.name === s.name)
      return l ? { ...s, onHand: +(s.onHand + l.qty).toFixed(1) } : s
    }))
    markTouched(lines.map((l) => l.name))
    push([...ensureVendor(vendor), billEntity(nextQid(), { id: uid('r'), date, vendor, ref, lines })], 'Bill')
    setView({ screen: 'list' })
    flash(`${fmt(lines.reduce((s, l) => s + l.qty * l.cost, 0))} on the shelf`)
  }

  const sellFromYard = ({ customer, lines }) => {
    const id = uid('job')
    rememberCustomer(customer)
    const label = `${customer.split(' ')[0]} — counter sale`
    const revenue = lines.reduce((s, l) => s + l.qty * l.price, 0)
    const sale = {
      id, kind: 'wholesale', name: label, customer, address: 'Picked up at the yard',
      status: 'Picked up', assemblies: [], saleLines: lines, labor: [],
      pulls: [{ id: uid('p'), date: today, lines: lines.map(({ name, qty, cost }) => ({ name, qty, cost })) }],
      deliveries: [], changes: [],
      invoices: [{ id: uid('i'), date: today, amount: revenue, memo: 'Counter sale' }], payments: [],
    }
    setJobs((prev) => [sale, ...prev])
    setStock((prev) => prev.map((s) => {
      const l = lines.find((x) => x.name === s.name)
      return l ? { ...s, onHand: +(s.onHand - l.qty).toFixed(1) } : s
    }))

    let parentId = parents.current[customer]
    const out = []
    if (!parentId) {
      parentId = nextQid()
      parents.current[customer] = parentId
      out.push({
        key: 'cust-' + parentId, type: 'Customer', qid: parentId, date: today,
        title: customer, sub: 'Top-level customer', amount: null,
        payload: { Customer: { Id: parentId, DisplayName: customer, Job: false, SyncToken: '0' } },
      })
    }
    const sid = nextQid()
    parents.current[label] = sid
    out.push({
      key: 'job-' + sid, type: 'Customer', qid: sid, date: today, isJob: true,
      title: label, sub: 'Sub-customer of ' + customer, amount: null,
      payload: {
        Customer: {
          Id: sid, DisplayName: label, Job: true,
          ParentRef: { value: parentId, name: customer }, SyncToken: '0',
        },
      },
    })
    out.push(wholesaleInvoiceEntity(nextQid(), sale.invoices[0], sale, sid))
    markTouched(lines.map((l) => l.name))
    push(out, 'money')
    setView({ screen: 'job', jobId: id })
    flash(`${fmt(revenue)} rung up. Stock came down.`)
  }

  const saveLabor = (entry) => {
    updateJob(job.id, (j) => ({ ...j, labor: [...j.labor, { ...entry, id: uid('l') }] }))
    const jid = parents.current[job.name]
    push(entry.crew.map((person) => {
      const tid = nextQid()
      return {
        key: 'time-' + tid, type: 'TimeActivity', qid: tid, date: entry.date,
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
    flash(`${entry.crew.length * entry.hours} hours on ${job.name}`)
    go('job')
  }

  const savePull = (lines) => {
    const pull = { id: uid('p'), date: today, lines }
    updateJob(job.id, (j) => ({ ...j, pulls: [...j.pulls, pull] }))
    setStock((prev) => prev.map((s) => {
      const l = lines.find((x) => x.name === s.name)
      return l ? { ...s, onHand: +(s.onHand - l.qty).toFixed(1) } : s
    }))
    markTouched(lines.map((l) => l.name))
    push([jeEntity(nextQid(), pull, job.name, parents.current[job.name])], 'JournalEntry')
    flash(`${fmt(pullTotal(pull))} of stock moved onto this job`)
    go('job')
  }

  const saveDelivery = (entry) => {
    const d = { ...entry, id: uid('d') }
    updateJob(job.id, (j) => ({ ...j, deliveries: [...j.deliveries, d] }))
    push([...ensureVendor(entry.vendor), purchaseEntity(nextQid(), d, job.name, parents.current[job.name])], 'Purchase')
    flash('Delivery logged against this job')
    go('job')
  }

  const saveChange = (entry) => {
    const c = { ...entry, id: uid('c'), billed: false }
    updateJob(job.id, (j) => ({ ...j, changes: [...j.changes, c] }))
    if (entry.approved) {
      const eid = nextQid()
      push([{
        key: 'est-' + eid, type: 'Estimate', qid: eid, date: today,
        title: job.name + ' — extra work', sub: entry.desc, amount: entry.amount,
        payload: {
          Estimate: {
            Id: eid, SyncToken: '0', CustomerRef: { value: parents.current[job.name], name: job.name }, TotalAmt: entry.amount,
            Line: [{ DetailType: 'SalesItemLineDetail', Amount: entry.amount, Description: entry.desc,
              SalesItemLineDetail: { ItemRef: { name: 'Change order' }, Qty: 1, UnitPrice: entry.amount } }],
          },
        },
      }], 'Estimate')
    }
    flash('Extra work saved. Now it cannot be forgotten.')
    go('job')
  }

  const saveInvoice = (amount, memo) => {
    const iv = { id: uid('i'), date: today, amount, memo }
    updateJob(job.id, (j) => ({
      ...j, invoices: [...j.invoices, iv],
      changes: j.changes.map((c) => (c.approved && !c.billed ? { ...c, billed: true } : c)),
    }))
    push([invoiceEntity(nextQid(), iv, job, parents.current[job.name])], 'money')
    flash(`Bill sent for ${fmt(amount)}`)
    go('job')
  }

  const savePayment = (amount, method) => {
    const py = { id: uid('y'), date: today, amount, method }
    updateJob(job.id, (j) => ({ ...j, payments: [...j.payments, py] }))
    push([paymentEntity(nextQid(), py, job.name, parents.current[job.name], null)], 'money')
    flash(`${fmt(amount)} recorded`)
    go('job')
  }

  const queued = qbo.filter((e) => e.status === 'queued').length
  const moneyRows = qbo.filter((e) => e.type === 'Invoice' || e.type === 'Payment')

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
        .split{display:flex;min-height:100vh}
        .paneL{flex:0 0 520px;border-right:1px solid ${BORDER};background:${BG};display:flex;flex-direction:column}
        .paneR{flex:1;background:#fff;display:flex;flex-direction:column;min-width:0}
        .switcher{display:none}
        .fresh{animation:pop 1.6s ease}
        @keyframes pop{0%{background:#DCF2D6}70%{background:#EAF7E6}100%{background:transparent}}
        .qbrow:hover{background:#F4F5F8}
        @media (max-width:940px){
          .split{display:block}
          .paneL,.paneR{flex:none;width:100%;border-right:none}
          .switcher{display:flex}
          .split.show-portal .paneR{display:none}
          .split.show-qbo .paneL{display:none}
        }
        @media (max-width:620px){ .qbnav{display:none} }
      `}</style>

      <div className={`split show-${pane}`}>
        <div className="paneL">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700, letterSpacing: '-.01em' }}>{BIZ}</div>
              <button onClick={() => setIntro(true)} style={{ border: 'none', background: 'none', padding: 0, color: FAINT, fontSize: 12.5, cursor: 'pointer' }}>Why this exists</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: queued ? AMBER : MUTED, fontWeight: 600 }}>{queued ? `${queued} sending…` : 'All sent'}</span>
              <div className="switcher">
                <button onClick={() => setPane('qbo')} style={{ fontSize: 12, fontWeight: 600, padding: '7px 11px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: INK, cursor: 'pointer' }}>QuickBooks →</button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 460, margin: '0 auto', padding: '20px 18px 70px' }}>
              {view.screen === 'list' && (
                <JobList jobs={jobs} stock={stock}
                  onOpen={(id) => setView({ screen: 'job', jobId: id })}
                  onNew={() => setView({ screen: 'new' })}
                  onReceive={() => setView({ screen: 'receive' })} />
              )}
              {view.screen === 'receive' && (
                <ReceiveStock stock={stock} vendors={vendors} shortfall={yardShortfall(jobs, stock)} today={today}
                  onBack={() => setView({ screen: 'list' })} onSave={receiveStock} />
              )}
              {view.screen === 'new' && <NewJob stock={stock} customers={customers} onCancel={() => setView({ screen: 'list' })} onSave={createJob} onSell={sellFromYard} />}
              {job && !['list', 'new', 'receive'].includes(view.screen) && (
                <JobShell job={job} stock={stock} screen={view.screen} go={go} onBack={() => setView({ screen: 'list' })}>
                  {view.screen === 'job' && <JobHome job={job} stock={stock} go={go} />}
                  {view.screen === 'labor' && <LaborScreen job={job} today={today} onSave={saveLabor} />}
                  {view.screen === 'materials' && <MaterialsScreen job={job} stock={stock} vendors={vendors} today={today} onPull={savePull} onDelivery={saveDelivery} />}
                  {view.screen === 'extra' && <ExtraWork job={job} onSave={saveChange} />}
                  {view.screen === 'billing' && <Billing job={job} stock={stock} onInvoice={saveInvoice} onPayment={savePayment} />}
                </JobShell>
              )}
            </div>
          </div>
        </div>

        <div className="paneR">
          {/* QBO top bar */}
          <div style={{ background: QBINK, color: '#fff', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>
                <span style={{ color: QB }}>quickbooks</span>
              </span>
              <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.22)' }} />
              <span style={{ fontSize: 13.5 }}>QueFence Inc.</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.35)', borderRadius: 4, padding: '2px 6px', opacity: .85 }}>Sandbox</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 15, opacity: .75 }}>⚙</span>
              <span style={{ fontSize: 15, opacity: .75 }}>?</span>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: QB, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>QF</div>
              <div className="switcher">
                <button onClick={() => setPane('portal')} style={{ fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>← Portal</button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* QBO left nav */}
            <nav className="qbnav" style={{ width: 176, flexShrink: 0, background: QBINK, padding: '14px 0 30px', overflowY: 'auto' }}>
              <div style={{ padding: '0 12px 14px' }}>
                <div style={{ background: QB, color: '#fff', fontWeight: 700, fontSize: 13.5, textAlign: 'center', padding: '9px 0', borderRadius: 4 }}>+ New</div>
              </div>
              {QB_NAV.map((g) => (
                <div key={g.group} style={{ marginBottom: 2 }}>
                  <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 12.5, padding: '9px 16px 5px', fontWeight: 500 }}>{g.group}</div>
                  {g.items.map((it) => {
                    const on = qtab === it.id
                    return (
                      <button key={it.id} onClick={() => setQtab(it.id)} style={{
                        display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                        padding: '8px 16px 8px 26px', fontSize: 13.5, fontWeight: on ? 700 : 400,
                        color: on ? '#fff' : 'rgba(255,255,255,.82)',
                        background: on ? 'rgba(255,255,255,.13)' : 'transparent',
                        boxShadow: on ? `inset 3px 0 0 ${QB}` : 'none',
                      }}>{it.label}</button>
                    )
                  })}
                </div>
              ))}
            </nav>

            {/* QBO content */}
            <div style={{ flex: 1, minWidth: 0, background: '#F4F5F8', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px 40px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <h1 style={{ fontSize: 25, fontWeight: 400, color: QBINK, letterSpacing: '-.01em' }}>{qbItem(qtab).title}</h1>
                    {qbItem(qtab).sub && <div style={{ fontSize: 13, color: '#6B6C72', marginTop: 2 }}>{qbItem(qtab).sub}</div>}
                  </div>
                  {qtab !== 'report' && (
                    <div style={{ background: QB, color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '9px 16px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      New {qtab === 'Customer' ? 'customer' : qtab === 'money' ? 'invoice' : 'transaction'}
                    </div>
                  )}
                </div>

                {qtab === 'report' ? <Profitability jobs={jobs} stock={stock} />
                  : qtab === 'inventory' ? <QboInventory stock={stock} touched={touched} />
                  : <QboList rows={qtab === 'money' ? moneyRows : qbo.filter((e) => e.type === qtab)} type={qtab} open={openPayload} setOpen={setOpenPayload} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {intro && <Intro jobs={jobs} stock={stock} onClose={closeIntro} />}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          background: INK, color: '#fff', padding: '13px 22px', borderRadius: 11, fontSize: 14.5, fontWeight: 500,
          boxShadow: '0 8px 28px rgba(0,0,0,.22)', maxWidth: '92vw', textAlign: 'center',
        }}>{toast}</div>
      )}
    </>
  )
}

/* ─── Intro ───────────────────────────────────────────────────────────── */

function Intro({ jobs, stock, onClose }) {
  const owed = jobs.reduce((s, j) => s + jobMoney(j, stock).owed, 0)
  const toBill = jobs.reduce((s, j) => s + jobMoney(j, stock).toBill, 0)
  const unbilled = jobs.flatMap((j) => j.changes).filter((c) => c.approved && !c.billed).reduce((s, c) => s + c.amount, 0)

  const Q = ({ q, a }) => (
    <div style={{ padding: '11px 0', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ fontFamily: head, fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{q}</div>
      <div className="num" style={{ fontSize: 14, color: MUTED }}>{a}</div>
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(16,24,40,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: CARD, borderRadius: 14, maxWidth: 580, width: '100%', padding: 28, boxShadow: '0 20px 60px rgba(16,24,40,.28)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>QueFence · job entry portal</div>
        <h2 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, lineHeight: 1.22, letterSpacing: '-.015em', marginBottom: 10 }}>
          QuickBooks has always been able to do job costing. Nothing has ever fed it correctly.
        </h2>
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.55, marginBottom: 16 }}>
          This is the funnel that makes correct data the only kind that gets in. There is no screen here
          that exists outside a job, so a cost cannot land on the wrong one — or on none at all.
        </p>
        <Q q="What did we take out of the yard for this job?" a="Materials come off the shelf, not off a receipt — stock drops and the job gets charged, same tap" />
        <Q q="What have we billed, and what came back?" a={`${fmt(toBill)} of sold work not billed yet · ${fmt(owed)} billed and still owed`} />
        <Q q="What did we do and never charge for?" a={`${fmt(unbilled)} in approved extra work sitting unbilled`} />
        <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.55, margin: '18px 0 16px', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          The left side has no accounting words in it anywhere — it is built for the guy in the truck.
          The right side is QuickBooks. Your reports, your CPA, your tax return, your bank feeds, unchanged.
          I'm not replacing your QuickBooks reports. I'm making them finally work.
        </p>
        <Btn full onClick={onClose}>Open the portal</Btn>
        <p style={{ fontSize: 12, color: FAINT, lineHeight: 1.5, marginTop: 14 }}>
          Sample jobs and numbers, built for this walkthrough. The QuickBooks panel is a simulation of the
          sandbox company, so you can click through it without logging in anywhere.
        </p>
      </div>
    </div>
  )
}

/* ─── Job list ────────────────────────────────────────────────────────── */

function JobList({ jobs, stock, onOpen, onNew, onReceive }) {
  const shortCount = Object.keys(yardShortfall(jobs, stock)).length
  return (
    <div>
      <h1 style={{ fontFamily: head, fontSize: 27, fontWeight: 700, letterSpacing: '-.015em', marginBottom: 4 }}>Your jobs</h1>
      <p style={{ color: MUTED, fontSize: 14.5, marginBottom: 20 }}>Tap the one you were working on.</p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {jobs.map((j) => {
          const b = jobBudget(j, stock), a = jobActual(j), m = jobMoney(j, stock)
          const flag = jobFlag(j, stock)
          const used = b.total ? Math.min((a.total / b.total) * 100, 100) : 0
          const unbilled = j.changes.some((c) => c.approved && !c.billed)
          return (
            <button key={j.id} onClick={() => onOpen(j.id)} style={{ textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: 16, cursor: 'pointer', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 600, marginBottom: 2 }}>
                    {j.name}
                    {j.kind === 'wholesale' && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '2px 6px', verticalAlign: 'middle' }}>
                        Off the shelf
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13.5, color: MUTED }}>{j.customer} · {j.status}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="num" style={{ fontSize: 15.5, fontWeight: 700 }}>{fmt(m.contract)}</div>
                  <div style={{ fontSize: 12, color: FAINT }}>{j.kind === 'wholesale' ? 'sale' : 'job price'}</div>
                </div>
              </div>
              <div style={{ marginTop: 13, height: 5, background: '#EDEFF2', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: used + '%', height: '100%', background: FLAG_COLOR[flag] }} />
              </div>
              <div className="num" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12.5, color: MUTED }}>
                <span>{fmt(a.total)} spent of {fmt(b.total)}</span>
                {m.owed > 0 && <span style={{ color: RED, fontWeight: 600 }}>{fmt(m.owed)} owed to you</span>}
                {unbilled && <span style={{ color: RED, fontWeight: 600 }}>extra work not billed</span>}
              </div>
            </button>
          )
        })}
      </div>
      <Btn full onClick={onNew}>Start something new</Btn>

      <div style={{ marginTop: 10 }}>
        <button onClick={onReceive} style={{
          width: '100%', textAlign: 'left', background: shortCount > 0 ? '#FDF1EF' : CARD,
          border: `1px solid ${shortCount > 0 ? '#F3CFC9' : BORDER}`, borderRadius: 13,
          padding: '15px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2, color: shortCount > 0 ? RED : INK }}>Stock came in</div>
            <div style={{ fontSize: 13, color: shortCount > 0 ? '#8C4438' : MUTED }}>
              {shortCount > 0
                ? `Jobs are waiting on ${shortCount} ${shortCount === 1 ? 'thing' : 'things'} you don't have`
                : 'Material you bought for the yard'}
            </div>
          </div>
          <span style={{ color: FAINT, fontSize: 20, lineHeight: 1 }}>›</span>
        </button>
      </div>
    </div>
  )
}

/* ─── New job ─────────────────────────────────────────────────────────── */

function NewJob({ stock, customers, onCancel, onSave, onSell }) {
  const [kind, setKind] = useState(null)
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [asmId, setAsmId] = useState(null)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [picked, setPicked] = useState([])
  const [showLines, setShowLines] = useState(false)

  const cust = customer === '__new' ? newCustomer.trim() : customer
  const asm = asmId ? asmById(asmId) : null
  const preview = useMemo(
    () => jobBudget({ assemblies: picked, labor: [], pulls: [], deliveries: [], changes: [], invoices: [], payments: [] }, stock),
    [picked, stock]
  )

  const pickAsm = (id) => { setAsmId(id); setPrice(String(asmById(id).price)); setQty('') }
  const add = () => {
    const q = parseFloat(qty), p = parseFloat(price)
    if (!q || q <= 0 || !p) return
    setPicked((prev) => [...prev, { assemblyId: asmId, qty: q, price: p }])
    setAsmId(null); setQty(''); setPrice('')
  }

  if (kind === null) {
    return (
      <div>
        <Btn kind="quiet" small onClick={onCancel}>← Back</Btn>
        <h1 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, letterSpacing: '-.015em', margin: '10px 0 4px' }}>What is this?</h1>
        <p style={{ color: MUTED, fontSize: 14.5, marginBottom: 18 }}>Two different things, two different screens.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={() => setKind('install')} style={bigChoice}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>We're building a fence</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>Crew goes out, materials get used, you bill the homeowner.</div>
          </button>
          <button onClick={() => setKind('wholesale')} style={bigChoice}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>Somebody's buying material from us</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>Another contractor picks it up at the yard. No crew, no install.</div>
          </button>
        </div>
      </div>
    )
  }

  if (kind === 'wholesale') {
    return <CounterSale stock={stock} customers={customers} onBack={() => setKind(null)} onSave={onSell} />
  }

  return (
    <div>
      <Btn kind="quiet" small onClick={step === 1 ? () => setKind(null) : () => setStep(step - 1)}>← Back</Btn>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: FAINT, margin: '10px 0 6px' }}>Step {step} of 2</div>

      {step === 1 && (
        <div>
          <h1 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, letterSpacing: '-.015em', marginBottom: 18 }}>Who is it for, and where?</h1>

          <Ask>Who is the customer?</Ask>
          <select style={{ ...inputStyle, marginBottom: 9 }} value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Tap to choose…</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__new">Somebody new</option>
          </select>
          {customer === '__new' && <input style={{ ...inputStyle, marginBottom: 9 }} placeholder="Their name" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />}

          <div style={{ height: 12 }} />
          <Ask>What do you call this job?</Ask>
          <input style={{ ...inputStyle, marginBottom: 16 }} placeholder="Smith residence" value={name} onChange={(e) => setName(e.target.value)} />

          <Ask>Where is it?</Ask>
          <input style={{ ...inputStyle, marginBottom: 20 }} placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />

          <Btn full disabled={!cust || !name.trim()} onClick={() => setStep(2)}>Next</Btn>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, letterSpacing: '-.015em', marginBottom: 4 }}>What are you building?</h1>
          <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>Pick the fence. We know what goes into it.</p>

          {!asm && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {ASSEMBLIES.map((a) => (
                <button key={a.id} onClick={() => pickAsm(a.id)} style={{ textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '15px 16px', cursor: 'pointer', width: '100%' }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>{a.name}</div>
                  <div className="num" style={{ fontSize: 13, color: MUTED }}>{fmt(a.price)} per {a.unit === 'LF' ? 'foot' : 'one'}</div>
                </button>
              ))}
            </div>
          )}

          {asm && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 12 }}>{asm.name}</div>
              <Ask>{asm.unit === 'LF' ? 'How many feet?' : 'How many?'}</Ask>
              <input className="num" style={{ ...inputStyle, fontSize: 24, fontWeight: 700, marginBottom: 14 }} inputMode="decimal" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
              <Ask>Price {asm.unit === 'LF' ? 'per foot' : 'each'}</Ask>
              <input className="num" style={{ ...inputStyle, marginBottom: 8 }} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              <p style={{ fontSize: 12.5, color: FAINT, marginBottom: 14 }}>Already filled in. Change it only if you quoted something else.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}><Btn kind="ghost" full onClick={() => setAsmId(null)}>Cancel</Btn></div>
                <div style={{ flex: 2 }}><Btn full disabled={!parseFloat(qty)} onClick={add}>Add it</Btn></div>
              </div>
            </Card>
          )}

          {picked.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              {picked.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14.5, borderBottom: i < picked.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <span className="num" style={{ fontWeight: 600 }}>{p.qty}{asmById(p.assemblyId).unit === 'LF' ? ' ft' : ''}</span> {asmById(p.assemblyId).name}
                  </div>
                  <span className="num" style={{ fontWeight: 600 }}>{fmt(p.qty * p.price)}</span>
                  <button onClick={() => setPicked((prev) => prev.filter((_, x) => x !== i))} style={{ border: 'none', background: 'none', color: FAINT, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
              {!asm && <div style={{ marginTop: 10 }}><Btn kind="ghost" full small onClick={() => setAsmId(ASSEMBLIES[0].id)}>Add something else</Btn></div>}
            </Card>
          )}

          {picked.length > 0 && (
            <Card style={{ marginBottom: 18 }}>
              <Line label="You're charging" value={fmt(preview.contract)} bold />
              <Line label="Materials it takes" value={fmt(preview.materials)} />
              <Line label="Crew time it takes" value={`${preview.laborHours.toFixed(0)} hours`} sub={fmt(preview.labor)} />
              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6 }}>
                <Line label="What you keep if it goes to plan" value={fmt(preview.contract - preview.total)} bold color={GREEN} />
              </div>
              <button onClick={() => setShowLines(!showLines)} style={{ marginTop: 10, border: 'none', background: 'none', padding: 0, color: MUTED, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                {showLines ? '▾' : '▸'} Everything this needs
              </button>
              {showLines && (
                <div style={{ marginTop: 9, borderTop: `1px solid ${BORDER}`, paddingTop: 9 }}>
                  {preview.need.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: MUTED, padding: '3px 0' }}>
                      <span><span className="num">{l.whole ? Math.ceil(l.qty) : l.qty.toFixed(1)} {l.unit}</span> · {l.name}</span>
                      <span className="num">{fmt(l.cost)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: MUTED, padding: '3px 0' }}>
                    <span><span className="num">{preview.laborHours.toFixed(0)} hr</span> · Crew time</span>
                    <span className="num">{fmt(preview.labor)}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Btn full disabled={!picked.length} onClick={() => onSave({ customer: cust, name: name.trim(), address: address.trim(), picked })}>
            Start the job
          </Btn>
        </div>
      )}
    </div>
  )
}

/* ─── Stock coming in from the supplier ───────────────────────────────── */

function ReceiveStock({ stock, vendors, shortfall, today, onBack, onSave }) {
  const [vendor, setVendor] = useState('')
  const [newVendor, setNewVendor] = useState('')
  const [ref, setRef] = useState('')
  const vend = vendor === '__new' ? newVendor.trim() : vendor
  const [qtys, setQtys] = useState(() => ({ ...shortfall }))
  const [costs, setCosts] = useState(() => Object.fromEntries(stock.map((s) => [s.name, String(s.cost)])))
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const bump = (s, d) => setQtys((q) => {
    const step = s.whole ? 1 : 10
    return { ...q, [s.name]: +Math.max(0, (q[s.name] || 0) + d * step).toFixed(1) }
  })

  const matches = (s) => !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())
  const visible = stock.filter((s) => matches(s) && (showAll || search.trim() || shortfall[s.name] > 0 || (qtys[s.name] || 0) > 0))

  const lines = stock.filter((s) => (qtys[s.name] || 0) > 0)
    .map((s) => ({ name: s.name, qty: qtys[s.name], cost: parseFloat(costs[s.name]) || s.cost }))
  const total = lines.reduce((s, l) => s + l.qty * l.cost, 0)
  const shortCount = Object.keys(shortfall).length

  return (
    <div>
      <Btn kind="quiet" small onClick={onBack}>← All jobs</Btn>
      <h1 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, letterSpacing: '-.015em', margin: '10px 0 4px' }}>Stock came in</h1>
      <p style={{ color: MUTED, fontSize: 14.5, marginBottom: 18 }}>
        Material you bought for the yard. This isn't charged to any job — it sits on the shelf until
        somebody uses it.
      </p>

      {shortCount > 0 && (
        <div style={{ background: '#FDF1EF', border: '1px solid #F3CFC9', borderRadius: 11, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: RED, marginBottom: 4 }}>
            Jobs are waiting on {shortCount === 1 ? 'one thing' : `${shortCount} things`}
          </div>
          <div style={{ fontSize: 13.5, color: '#8C4438' }}>Already filled in below. Change it if you bought more.</div>
        </div>
      )}

      <Ask>Who did you buy it from?</Ask>
      <select style={{ ...inputStyle, marginBottom: vendor === '__new' ? 9 : 16 }} value={vendor} onChange={(e) => setVendor(e.target.value)}>
        <option value="">Tap to choose…</option>
        {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
        <option value="__new">A new supplier</option>
      </select>
      {vendor === '__new' && (
        <input style={{ ...inputStyle, marginBottom: 16 }} placeholder="Supplier name" value={newVendor}
          onChange={(e) => setNewVendor(e.target.value)} />
      )}

      <Ask>Order or invoice number</Ask>
      <input style={{ ...inputStyle, marginBottom: 18 }} placeholder="PO-1862 (optional)" value={ref} onChange={(e) => setRef(e.target.value)} />

      <Ask>What came in?</Ask>
      <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Search the yard…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div style={{ display: 'grid', gap: 8, marginBottom: 12, maxHeight: 460, overflowY: 'auto' }}>
        {visible.map((s) => {
          const q = qtys[s.name] || 0
          const wanted = shortfall[s.name] || 0
          return (
            <Card key={s.name} style={{ padding: '12px 14px', borderColor: q > 0 ? INK : BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                  <div className="num" style={{ fontSize: 12.5, color: wanted > 0 ? RED : FAINT, fontWeight: wanted > 0 ? 600 : 400 }}>
                    {wanted > 0 ? `${s.onHand} on the shelf — jobs need ${wanted} more` : `${s.onHand} ${s.unit} on the shelf`}
                  </div>
                </div>
                <button onClick={() => bump(s, -1)} style={miniBtn}>−</button>
                <span className="num" style={{ minWidth: 46, textAlign: 'center', fontSize: 19, fontWeight: 700 }}>{q}</span>
                <button onClick={() => bump(s, 1)} style={miniBtn}>+</button>
              </div>
              {q > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 13, color: MUTED, flex: 1 }}>What you paid each</span>
                  <input className="num" inputMode="decimal" value={costs[s.name]} onChange={(e) => setCosts((c) => ({ ...c, [s.name]: e.target.value }))}
                    style={{ ...inputStyle, width: 110, fontSize: 15, padding: '9px 10px', textAlign: 'right' }} />
                </div>
              )}
            </Card>
          )
        })}
        {visible.length === 0 && (
          <div style={{ fontSize: 14, color: FAINT, padding: 20, textAlign: 'center' }}>
            {search.trim() ? 'Nothing matches that.' : 'Nothing is short right now.'}
          </div>
        )}
      </div>

      <button onClick={() => setShowAll(!showAll)} style={{ border: 'none', background: 'none', padding: 0, color: MUTED, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
        {showAll ? '▾ Just what jobs are waiting on' : '▸ Show everything in the yard'}
      </button>

      {lines.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          {lines.map((l) => (
            <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}>
              <span><span className="num" style={{ fontWeight: 600 }}>{l.qty}</span> · {l.name}</span>
              <span className="num" style={{ fontWeight: 600 }}>{fmt(l.qty * l.cost)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 4 }}>
            <Line label="The bill" value={fmt(total)} bold />
          </div>
        </Card>
      )}

      <Btn full disabled={!vend || !lines.length} onClick={() => onSave({ vendor: vend, ref: ref.trim() || 'No ref', date: today, lines })}>
        {lines.length ? `Put it on the shelf — ${fmt(total)}` : 'Pick what came in'}
      </Btn>
      <p style={{ fontSize: 12.5, color: FAINT, textAlign: 'center', marginTop: 10 }}>
        Goes to QuickBooks as a bill from the supplier and lands in inventory, not on a job.
      </p>
    </div>
  )
}

/* ─── Counter sale: sell off the shelf, only what's on the shelf ──────── */

function CounterSale({ stock, customers, onBack, onSave }) {
  const [customer, setCustomer] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [qtys, setQtys] = useState({})
  const [search, setSearch] = useState('')

  const cust = customer === '__new' ? newCustomer.trim() : customer
  // Only things that are actually sellable AND actually on the shelf.
  const sellable = stock.filter((s) => s.sell && s.onHand > 0)
  const shown = search.trim()
    ? sellable.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    : sellable

  const bump = (s, d) => setQtys((q) => {
    const step = s.whole ? 1 : 5
    return { ...q, [s.name]: +Math.min(s.onHand, Math.max(0, (q[s.name] || 0) + d * step)).toFixed(1) }
  })

  const lines = sellable.filter((s) => (qtys[s.name] || 0) > 0)
    .map((s) => ({ name: s.name, qty: qtys[s.name], cost: s.cost, price: s.price }))
  const revenue = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const cost = lines.reduce((s, l) => s + l.qty * l.cost, 0)

  return (
    <div>
      <Btn kind="quiet" small onClick={onBack}>← Back</Btn>
      <h1 style={{ fontFamily: head, fontSize: 25, fontWeight: 700, letterSpacing: '-.015em', margin: '10px 0 18px' }}>Selling off the shelf</h1>

      <Ask>Who's buying?</Ask>
      <select style={{ ...inputStyle, marginBottom: 9 }} value={customer} onChange={(e) => setCustomer(e.target.value)}>
        <option value="">Tap to choose…</option>
        {customers.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="__new">Somebody new</option>
      </select>
      {customer === '__new' && <input style={{ ...inputStyle, marginBottom: 9 }} placeholder="Their name" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />}

      <div style={{ height: 14 }} />
      <Ask>What are they taking?</Ask>
      <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 10 }}>
        Only what's on the shelf shows up here, and you can't go past what's there.
      </p>
      <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Search the yard…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div style={{ display: 'grid', gap: 8, marginBottom: 16, maxHeight: 420, overflowY: 'auto' }}>
        {shown.map((s) => {
          const q = qtys[s.name] || 0
          const maxed = q >= s.onHand
          return (
            <Card key={s.name} style={{ padding: '12px 14px', borderColor: q > 0 ? INK : BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                  <div className="num" style={{ fontSize: 12.5, color: FAINT }}>
                    {fmt2(s.price)} each · {s.onHand} {s.unit} on the shelf
                  </div>
                </div>
                <button onClick={() => bump(s, -1)} style={miniBtn}>−</button>
                <span className="num" style={{ minWidth: 42, textAlign: 'center', fontSize: 19, fontWeight: 700 }}>{q}</span>
                <button onClick={() => bump(s, 1)} disabled={maxed}
                  style={{ ...miniBtn, opacity: maxed ? 0.3 : 1, cursor: maxed ? 'not-allowed' : 'pointer' }}>+</button>
              </div>
              {maxed && <div style={{ fontSize: 12, color: AMBER, fontWeight: 600, marginTop: 6 }}>That's all of them</div>}
            </Card>
          )
        })}
        {shown.length === 0 && <div style={{ fontSize: 14, color: FAINT, padding: 20, textAlign: 'center' }}>Nothing on the shelf matches that.</div>}
      </div>

      {lines.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          {lines.map((l) => (
            <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}>
              <span><span className="num" style={{ fontWeight: 600 }}>{l.qty}</span> · {l.name}</span>
              <span className="num" style={{ fontWeight: 600 }}>{fmt(l.qty * l.price)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 4 }}>
            <Line label="They pay" value={fmt(revenue)} bold />
            <Line label="What you keep" value={fmt(revenue - cost)} color={GREEN} bold />
          </div>
        </Card>
      )}

      <Btn full disabled={!cust || !lines.length} onClick={() => onSave({ customer: cust, lines })}>
        {lines.length ? `Ring it up — ${fmt(revenue)}` : 'Pick what they’re taking'}
      </Btn>
      <p style={{ fontSize: 12.5, color: FAINT, textAlign: 'center', marginTop: 10 }}>
        Stock comes down and the bill goes out, same tap.
      </p>
    </div>
  )
}

/* ─── Job shell: the persistent header ────────────────────────────────── */

const SCREEN_TITLE = {
  labor: "Who worked today?", materials: 'Materials', extra: 'Extra work', billing: 'Billing',
}

function JobShell({ job, stock, screen, go, onBack, children }) {
  const b = jobBudget(job, stock), a = jobActual(job), m = jobMoney(job, stock)
  const flag = jobFlag(job, stock)
  const used = b.total ? Math.min((a.total / b.total) * 100, 100) : 0

  return (
    <div>
      <Btn kind="quiet" small onClick={screen === 'job' ? onBack : () => go('job')}>
        {screen === 'job' ? '← All jobs' : '← ' + job.name}
      </Btn>

      <div style={{ position: 'sticky', top: 0, zIndex: 5, marginTop: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: '14px 16px', boxShadow: '0 2px 10px rgba(16,24,40,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: head, fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>{job.name}</div>
            <div style={{ fontSize: 13, color: MUTED }}>{job.customer}{job.address ? ' · ' + job.address : ''}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="num" style={{ fontSize: 15.5, fontWeight: 700 }}>{fmt(m.contract)}</div>
            <div style={{ fontSize: 11.5, color: FAINT }}>{job.kind === 'wholesale' ? 'sale' : 'job price'}</div>
          </div>
        </div>
        <div style={{ marginTop: 11, height: 6, background: '#EDEFF2', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: used + '%', height: '100%', background: FLAG_COLOR[flag], transition: 'width .4s' }} />
        </div>
        <div className="num" style={{ marginTop: 7, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: MUTED }}>
            {job.kind === 'wholesale' ? `${fmt(a.total)} of stock went out` : `${fmt(a.total)} spent of ${fmt(b.total)}`}
          </span>
          <span style={{ color: m.owed > 0 ? RED : MUTED, fontWeight: m.owed > 0 ? 600 : 400 }}>
            {m.owed > 0 ? `${fmt(m.owed)} owed to you` : 'nothing owed'}
          </span>
        </div>
      </div>

      {screen !== 'job' && (
        <h2 style={{ fontFamily: head, fontSize: 22, fontWeight: 700, letterSpacing: '-.015em', margin: '18px 0 14px' }}>
          {SCREEN_TITLE[screen]}
        </h2>
      )}
      <div style={{ marginTop: screen === 'job' ? 14 : 0 }}>{children}</div>
    </div>
  )
}

/* ─── Job home: the money picture and four big buttons ────────────────── */

function JobHome({ job, stock, go }) {
  const b = jobBudget(job, stock), a = jobActual(job), m = jobMoney(job, stock)
  const over = a.total - b.total
  const unbilled = job.changes.filter((c) => c.approved && !c.billed)
  const keeping = m.contract - a.total

  const Action = ({ title, note, onClick }) => (
    <button onClick={onClick} style={{ textAlign: 'left', width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: '17px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16.5, fontWeight: 600, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: MUTED }}>{note}</div>
      </div>
      <span style={{ color: FAINT, fontSize: 20, lineHeight: 1 }}>›</span>
    </button>
  )

  if (job.kind === 'wholesale') {
    return (
      <div>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>What they took</div>
          {job.saleLines.map((l) => (
            <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, padding: '4px 0' }}>
              <span><span className="num" style={{ fontWeight: 600 }}>{l.qty}</span> · {l.name}</span>
              <span className="num" style={{ fontWeight: 600 }}>{fmt(l.qty * l.price)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 4 }}>
            <Line label="They pay" value={fmt(m.contract)} bold />
            <Line label="Cost off the shelf" value={fmt(a.fromStock)} />
            <Line label="What you keep" value={fmt(keeping)} bold color={GREEN} />
          </div>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Line label="Billed" value={fmt(m.billed)} />
          <Line label="They've paid" value={fmt(m.paid)} color={GREEN} />
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6 }}>
            <Line label="Still owes you" value={fmt(m.owed)} bold color={m.owed > 0 ? RED : GREEN} />
          </div>
        </Card>

        <Action title="Billing" note="Write down a payment when it comes in" onClick={() => go('billing')} />
      </div>
    )
  }

  return (
    <div>
      {unbilled.length > 0 && (
        <button onClick={() => go('billing')} style={{ width: '100%', textAlign: 'left', background: '#FDF1EF', border: '1px solid #F3CFC9', borderRadius: 13, padding: 15, marginBottom: 12, cursor: 'pointer' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: RED, marginBottom: 3 }}>You haven't charged for the extra work</div>
          <div className="num" style={{ fontSize: 13.5, color: '#8C4438' }}>
            {fmt(unbilled.reduce((s, c) => s + c.amount, 0))} the customer approved and nobody billed. Tap to bill it.
          </div>
        </button>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>The customer</div>
        <Line label="Job price" value={fmt(m.contract)} bold />
        <Line label="Billed so far" value={fmt(m.billed)} />
        <Line label="They've paid" value={fmt(m.paid)} color={GREEN} />
        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6 }}>
          <Line label="Still owes you" value={fmt(m.owed)} bold color={m.owed > 0 ? RED : GREEN} />
          <Line label="Not billed yet" value={fmt(m.toBill)} sub={m.toBill > 0 ? 'work you sold and can still bill for' : 'everything sold has been billed'} />
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>The job</div>
        <Line label="Should cost" value={fmt(b.total)} />
        <Line label="Spent so far" value={fmt(a.total)} bold
          color={over > b.total * 0.10 ? RED : over > b.total * 0.02 ? AMBER : GREEN}
          sub={over > 0 ? `over by ${fmt(over)}` : `under by ${fmt(-over)}`} />
        <div style={{ marginTop: 4, paddingLeft: 0 }}>
          <Line label="Materials off the shelf" value={fmt(a.fromStock)} />
          <Line label="Delivered to the job" value={fmt(a.delivered)} />
          <Line label={`Crew time · ${a.laborHours.toFixed(0)} hours`} value={fmt(a.labor)} />
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6 }}>
          <Line label="What you keep" value={fmt(keeping)} bold color={keeping > 0 ? GREEN : RED} />
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 9 }}>
        <Action title="Log today's work" note="Who was out there and for how long" onClick={() => go('labor')} />
        <Action title="Materials" note="Took it off the shelf, or it got delivered" onClick={() => go('materials')} />
        <Action title="Extra work" note="Customer asked for something not in the price" onClick={() => go('extra')} />
        <Action title="Billing" note="Send a bill, or write down a payment" onClick={() => go('billing')} />
      </div>
    </div>
  )
}

/* ─── Labor ───────────────────────────────────────────────────────────── */

function LaborScreen({ job, today, onSave }) {
  const last = job.labor[job.labor.length - 1]
  const [date, setDate] = useState(today)
  const [crew, setCrew] = useState(last ? last.crew : [])
  const [hours, setHours] = useState(8)

  useEffect(() => { setDate(today) }, [today])
  const toggle = (p) => setCrew((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  return (
    <div>
      {last && crew.length > 0 && (
        <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 14 }}>Same crew as last time is already picked. Change it if it's different.</p>
      )}

      <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        {CREW.map((p) => <Chip key={p} on={crew.includes(p)} onClick={() => toggle(p)}>{p}</Chip>)}
      </div>

      <Ask>How long were they out there?</Ask>
      <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
        <button onClick={() => setHours((h) => Math.max(0.5, +(h - 0.5).toFixed(1)))} style={stepBtn}>−</button>
        <div className="num" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}`, borderRadius: 11, background: '#fff', padding: '10px 0' }}>
          <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{hours}</span>
          <span style={{ fontSize: 12, color: FAINT }}>hours each</span>
        </div>
        <button onClick={() => setHours((h) => +(h + 0.5).toFixed(1))} style={stepBtn}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[4, 6, 8, 10].map((h) => (
          <button key={h} onClick={() => setHours(h)} style={{
            flex: 1, padding: '11px 0', borderRadius: 9, cursor: 'pointer', fontSize: 15, fontWeight: 600,
            border: `1px solid ${hours === h ? INK : BORDER}`, background: hours === h ? '#EDEFF2' : '#fff', color: INK,
          }}>{h}</button>
        ))}
      </div>

      <details style={{ marginBottom: 20 }}>
        <summary style={{ fontSize: 13.5, color: MUTED, cursor: 'pointer' }}>Not today? Pick the day</summary>
        <input type="date" style={{ ...inputStyle, marginTop: 9 }} value={date} onChange={(e) => setDate(e.target.value)} />
      </details>

      <Btn full disabled={!crew.length} onClick={() => onSave({ date, crew, hours })}>
        {crew.length ? `Save — ${crew.length} ${crew.length === 1 ? 'guy' : 'guys'}, ${crew.length * hours} hours` : 'Pick who worked'}
      </Btn>

      {job.labor.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>Already logged</div>
          {[...job.labor].reverse().map((l) => (
            <div key={l.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{dshort(l.date)}</div>
                <div style={{ fontSize: 13, color: MUTED }}>{l.crew.join(', ')}</div>
              </div>
              <div className="num" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{l.crew.length * l.hours} hr</div>
                <div style={{ fontSize: 12, color: FAINT }}>{fmt(l.crew.length * l.hours * LABOR_RATE)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const stepBtn = { width: 66, border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 11, fontSize: 28, color: INK, cursor: 'pointer', lineHeight: 1 }

/* ─── Materials: off the shelf, or delivered ──────────────────────────── */

function MaterialsScreen({ job, stock, vendors, today, onPull, onDelivery }) {
  const [mode, setMode] = useState(null)
  const needed = useMemo(() => stillNeeded(job, stock), [job, stock])
  const [qtys, setQtys] = useState(() => Object.fromEntries(needed.map((n) => [n.name, n.suggest])))
  const [showAll, setShowAll] = useState(false)

  const [vendor, setVendor] = useState('')
  const [newVendor, setNewVendor] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const vend = vendor === '__new' ? newVendor.trim() : vendor

  // You cannot take what isn't there. Every stepper stops at on-hand.
  const bump = (name, d, whole, onHand) => setQtys((q) => {
    const step = whole ? 1 : 5
    const next = (q[name] || 0) + d * step
    return { ...q, [name]: +Math.min(onHand, Math.max(0, next)).toFixed(1) }
  })

  const lines = needed.filter((n) => (qtys[n.name] || 0) > 0).map((n) => ({ name: n.name, qty: qtys[n.name], cost: n.cost }))
  const total = lines.reduce((s, l) => s + l.qty * l.cost, 0)
  const short = needed.filter((n) => n.short > 0)
  const visible = showAll ? needed : needed.filter((n) => n.wanted > 0 || (qtys[n.name] || 0) > 0)

  if (mode === null) {
    return (
      <div>
        <p style={{ fontSize: 14.5, color: MUTED, marginBottom: 16 }}>Which one was it?</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={() => setMode('stock')} style={bigChoice}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>We took it from the yard</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>Off our own shelf. We already know what this job needs.</div>
          </button>
          <button onClick={() => setMode('delivery')} style={bigChoice}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>A truck dropped it off</div>
            <div style={{ fontSize: 13.5, color: MUTED }}>Ordered straight to the job. Snap the ticket.</div>
          </button>
        </div>

        {(job.pulls.length > 0 || job.deliveries.length > 0) && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>Already on this job</div>
            {job.pulls.map((p) => (
              <div key={p.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>Taken from the yard</div>
                    <div style={{ fontSize: 12.5, color: MUTED }}>{p.lines.map((l) => `${l.qty} ${l.name}`).join(' · ')}</div>
                  </div>
                  <div className="num" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{fmt(pullTotal(p))}</div>
                    <div style={{ fontSize: 12, color: FAINT }}>{dshort(p.date)}</div>
                  </div>
                </div>
              </div>
            ))}
            {job.deliveries.map((d) => (
              <div key={d.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{d.vendor}</div>
                  <div style={{ fontSize: 12.5, color: MUTED }}>{d.desc}</div>
                </div>
                <div className="num" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{fmt2(d.amount)}</div>
                  <div style={{ fontSize: 12, color: FAINT }}>{dshort(d.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (mode === 'stock') {
    return (
      <div>
        <Btn kind="quiet" small onClick={() => setMode(null)}>← Not that</Btn>
        <p style={{ fontSize: 14.5, color: MUTED, margin: '8px 0 16px' }}>
          This is what the job still needs, already counted for you. Fix anything that's different.
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {visible.map((n) => {
            const q = qtys[n.name] || 0
            const maxed = q >= n.onHand
            return (
              <Card key={n.name} style={{ padding: '12px 14px', borderColor: n.short > 0 ? '#F3CFC9' : BORDER }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{n.name}</div>
                    <div className="num" style={{ fontSize: 12.5, color: n.short > 0 ? RED : FAINT, fontWeight: n.short > 0 ? 600 : 400 }}>
                      {n.short > 0
                        ? `job needs ${n.wanted} — only ${n.onHand} on the shelf`
                        : `${n.onHand} ${n.unit} on the shelf`}
                    </div>
                  </div>
                  <button onClick={() => bump(n.name, -1, n.whole, n.onHand)} style={miniBtn}>−</button>
                  <span className="num" style={{ minWidth: 42, textAlign: 'center', fontSize: 19, fontWeight: 700 }}>{q}</span>
                  <button onClick={() => bump(n.name, 1, n.whole, n.onHand)} disabled={maxed}
                    style={{ ...miniBtn, opacity: maxed ? 0.3 : 1, cursor: maxed ? 'not-allowed' : 'pointer' }}>+</button>
                </div>
              </Card>
            )
          })}
        </div>

        <button onClick={() => setShowAll(!showAll)} style={{ border: 'none', background: 'none', padding: 0, color: MUTED, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
          {showAll ? '▾ Just what this job needs' : '▸ Show everything on the shelf for this job'}
        </button>

        {short.length > 0 && (
          <div style={{ background: '#FDF1EF', border: '1px solid #F3CFC9', borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: RED, marginBottom: 4 }}>
              The yard is short on {short.length === 1 ? 'one thing' : `${short.length} things`}
            </div>
            {short.map((n) => (
              <div key={n.name} className="num" style={{ fontSize: 13.5, color: '#8C4438' }}>
                {n.name} — {n.short} more {n.unit} needed
              </div>
            ))}
            <div style={{ fontSize: 13.5, color: '#8C4438', marginTop: 5 }}>
              Take what's there. Log the rest as a delivery when it shows up.
            </div>
          </div>
        )}

        <Card style={{ marginBottom: 16 }}>
          <Line label="Coming off the shelf" value={fmt(total)} bold />
          <div style={{ fontSize: 12.5, color: FAINT, marginTop: 2 }}>Charged straight to this job.</div>
        </Card>

        <Btn full disabled={!lines.length} onClick={() => onPull(lines)}>Take it out of stock</Btn>
      </div>
    )
  }

  const ready = vend && desc.trim() && parseFloat(amount) > 0
  return (
    <div>
      <Btn kind="quiet" small onClick={() => setMode(null)}>← Not that</Btn>
      <div style={{ height: 14 }} />

      <Ask>Who delivered it?</Ask>
      <select style={{ ...inputStyle, marginBottom: vendor === '__new' ? 9 : 18 }} value={vendor} onChange={(e) => setVendor(e.target.value)}>
        <option value="">Tap to choose…</option>
        {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
        <option value="__new">A new supplier</option>
      </select>
      {vendor === '__new' && (
        <input style={{ ...inputStyle, marginBottom: 18 }} placeholder="Supplier name" value={newVendor}
          onChange={(e) => setNewVendor(e.target.value)} />
      )}

      <Ask>What came in?</Ask>
      <input style={{ ...inputStyle, marginBottom: 18 }} placeholder="Cedar panels and posts" value={desc} onChange={(e) => setDesc(e.target.value)} />

      <Ask>What's on the ticket?</Ask>
      <input className="num" style={{ ...inputStyle, fontSize: 26, fontWeight: 700, marginBottom: 18 }} inputMode="decimal" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <Ask>Snap the ticket</Ask>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', border: `1.5px dashed ${BORDER}`, borderRadius: 11, padding: photoUrl ? 10 : '24px 14px', background: '#fff', marginBottom: 20 }}>
        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files && e.target.files[0]
          if (!f) return
          setPhoto(f.name); setPhotoUrl(URL.createObjectURL(f))
        }} />
        {photoUrl
          ? <><img src={photoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /><span style={{ fontSize: 14, color: MUTED, flex: 1 }}>{photo}</span></>
          : <span style={{ fontSize: 15, color: MUTED, fontWeight: 500 }}>Take a picture</span>}
      </label>

      <Btn full disabled={!ready} onClick={() => onDelivery({ vendor: vend, date: today, desc: desc.trim(), amount: parseFloat(amount), photo })}>Save it</Btn>
    </div>
  )
}

const bigChoice = { textAlign: 'left', width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: '20px 18px', cursor: 'pointer' }
const miniBtn = { width: 44, height: 44, flexShrink: 0, border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 9, fontSize: 22, color: INK, cursor: 'pointer', lineHeight: 1 }

/* ─── Extra work ──────────────────────────────────────────────────────── */

function ExtraWork({ job, onSave }) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [approved, setApproved] = useState(true)
  const ready = desc.trim() && parseFloat(amount) > 0

  return (
    <div>
      <p style={{ fontSize: 14.5, color: MUTED, marginBottom: 18 }}>
        Anything the customer asked for that wasn't in the price. Write it here and it can't get forgotten.
      </p>

      <Ask>What did they ask for?</Ask>
      <input style={{ ...inputStyle, marginBottom: 18 }} placeholder="Add 40 more feet along the driveway" value={desc} onChange={(e) => setDesc(e.target.value)} />

      <Ask>What are you charging for it?</Ask>
      <input className="num" style={{ ...inputStyle, fontSize: 26, fontWeight: 700, marginBottom: 18 }} inputMode="decimal" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <Ask>Did they say yes?</Ask>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Chip on={approved} onClick={() => setApproved(true)}>Yes, they agreed</Chip>
        <Chip on={!approved} onClick={() => setApproved(false)}>Not yet</Chip>
      </div>

      <Btn full disabled={!ready} onClick={() => onSave({ desc: desc.trim(), amount: parseFloat(amount), approved })}>Save it</Btn>

      {job.changes.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>On this job already</div>
          {[...job.changes].reverse().map((c) => (
            <div key={c.id} style={{ background: CARD, borderRadius: 10, padding: '12px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${c.approved && !c.billed ? '#F3CFC9' : BORDER}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5 }}>{c.desc}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: c.billed ? GREEN : c.approved ? RED : FAINT }}>
                  {!c.approved ? 'Waiting on them' : c.billed ? 'Billed' : 'They said yes — not billed'}
                </div>
              </div>
              <span className="num" style={{ fontWeight: 600, fontSize: 14.5 }}>{fmt(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Billing: what we charged, what came back ────────────────────────── */

function Billing({ job, stock, onInvoice, onPayment }) {
  const m = jobMoney(job, stock)
  const unbilled = job.changes.filter((c) => c.approved && !c.billed)
  const [mode, setMode] = useState(null)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('Progress billing')
  const [method, setMethod] = useState('Check')

  const startBill = () => { setAmount(String(Math.round(m.toBill))); setMode('bill') }
  const startPay = () => { setAmount(String(Math.round(m.owed))); setMode('pay') }

  if (mode === null) {
    return (
      <div>
        <Card style={{ marginBottom: 14 }}>
          <Line label="Job price" value={fmt(m.contract)} bold />
          <Line label="Billed so far" value={fmt(m.billed)} />
          <Line label="They've paid" value={fmt(m.paid)} color={GREEN} />
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6 }}>
            <Line label="Still owes you" value={fmt(m.owed)} bold color={m.owed > 0 ? RED : GREEN} />
            <Line label="Not billed yet" value={fmt(m.toBill)} />
          </div>
        </Card>

        {unbilled.length > 0 && (
          <div style={{ background: '#FDF1EF', border: '1px solid #F3CFC9', borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: RED, marginBottom: 4 }}>Extra work in that number</div>
            {unbilled.map((c) => (
              <div key={c.id} className="num" style={{ fontSize: 13.5, color: '#8C4438', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>{c.desc}</span><span>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={startBill} disabled={m.toBill <= 0} style={{ ...bigChoice, opacity: m.toBill <= 0 ? 0.4 : 1, cursor: m.toBill <= 0 ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>Send them a bill</div>
            <div className="num" style={{ fontSize: 13.5, color: MUTED }}>{m.toBill > 0 ? `Up to ${fmt(m.toBill)} is billable right now` : 'Everything sold is already billed'}</div>
          </button>
          <button onClick={startPay} disabled={m.owed <= 0} style={{ ...bigChoice, opacity: m.owed <= 0 ? 0.4 : 1, cursor: m.owed <= 0 ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>They paid me</div>
            <div className="num" style={{ fontSize: 13.5, color: MUTED }}>{m.owed > 0 ? `${fmt(m.owed)} is still open` : 'Nothing is open'}</div>
          </button>
        </div>

        {(job.invoices.length > 0 || job.payments.length > 0) && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>History</div>
            {[...job.invoices.map((i) => ({ ...i, kind: 'bill' })), ...job.payments.map((p) => ({ ...p, kind: 'paid' }))]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((r) => (
                <div key={r.kind + r.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.kind === 'bill' ? 'You billed them' : 'They paid'}</div>
                    <div style={{ fontSize: 12.5, color: MUTED }}>{r.memo || r.method} · {dshort(r.date)}</div>
                  </div>
                  <span className="num" style={{ fontSize: 15, fontWeight: 600, color: r.kind === 'paid' ? GREEN : INK }}>
                    {r.kind === 'paid' ? '+' : ''}{fmt(r.amount)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  const val = parseFloat(amount)
  const ready = val > 0
  return (
    <div>
      <Btn kind="quiet" small onClick={() => setMode(null)}>← Back</Btn>
      <div style={{ height: 14 }} />
      <Ask>{mode === 'bill' ? 'How much are you billing them?' : 'How much did they pay?'}</Ask>
      <input className="num" style={{ ...inputStyle, fontSize: 30, fontWeight: 700, marginBottom: 8 }} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <p style={{ fontSize: 13, color: FAINT, marginBottom: 18 }}>
        {mode === 'bill' ? `Filled in with everything you can bill right now. Lower it for a partial bill.` : `Filled in with what's still open.`}
      </p>

      {mode === 'bill' ? (
        <>
          <Ask>What's it for?</Ask>
          <select style={{ ...inputStyle, marginBottom: 20 }} value={memo} onChange={(e) => setMemo(e.target.value)}>
            <option>Progress billing</option><option>Deposit</option><option>Final bill</option><option>Extra work</option>
          </select>
          <Btn full disabled={!ready} onClick={() => onInvoice(val, memo)}>Send the bill for {fmt(val || 0)}</Btn>
        </>
      ) : (
        <>
          <Ask>How did it come in?</Ask>
          <select style={{ ...inputStyle, marginBottom: 20 }} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Check</option><option>ACH</option><option>Credit card</option><option>Cash</option>
          </select>
          <Btn full disabled={!ready} onClick={() => onPayment(val, method)}>Write down {fmt(val || 0)}</Btn>
        </>
      )}
    </div>
  )
}

/* ─── QuickBooks pane ─────────────────────────────────────────────────── */

const COLS = '78px 96px 1fr 106px 96px 56px'
const TYPE_LABEL = {
  Customer: 'Customer', Estimate: 'Estimate', Invoice: 'Invoice', Payment: 'Payment',
  Purchase: 'Expense', TimeActivity: 'Time', JournalEntry: 'Journal', Bill: 'Bill', Vendor: 'Vendor',
}

function QboList({ rows, type, open, setOpen }) {
  if (rows.length === 0) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${QBLINE}`, borderRadius: 3, padding: 40, textAlign: 'center', color: '#6B6C72', fontSize: 14 }}>
        No transactions yet.
      </div>
    )
  }
  const nameCol = type === 'Vendor' ? 'Vendor' : type === 'Purchase' || type === 'Bill' ? 'Payee'
    : type === 'TimeActivity' ? 'Employee' : 'Customer'
  const idCol = type === 'Customer' || type === 'Vendor'
  const th = { fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B6C72' }

  return (
    <div style={{ background: '#fff', border: `1px solid ${QBLINE}`, borderRadius: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${QBLINE}` }}>
        <div style={{ flex: 1, border: `1px solid ${QBLINE}`, borderRadius: 3, padding: '6px 10px', fontSize: 13, color: '#9096A0', maxWidth: 240 }}>Search…</div>
        <span className="num" style={{ fontSize: 12.5, color: '#6B6C72' }}>{rows.length} of {rows.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 10, padding: '9px 16px', borderBottom: `1px solid ${QBLINE}`, background: '#FAFAFB' }}>
        <span style={th}>{idCol ? 'Id' : 'Date'}</span>
        <span style={th}>Type</span>
        <span style={th}>{nameCol}</span>
        <span style={{ ...th, textAlign: 'right' }}>{type === 'TimeActivity' ? 'Hours' : 'Amount'}</span>
        <span style={{ ...th, textAlign: 'right' }}>Status</span>
        <span style={{ ...th, textAlign: 'right' }}>Action</span>
      </div>

      {rows.map((r) => {
        const st = qbStatus(r)
        return (
          <div key={r.key} className={r.fresh ? 'fresh qbrow' : 'qbrow'} style={{ borderBottom: `1px solid #EDEEF1` }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 10, padding: '12px 16px', alignItems: 'center' }}>
              <span className="num" style={{ fontSize: 13, color: '#393A3D' }}>
                {idCol ? r.qid : dshort(r.date)}
              </span>
              <span style={{ fontSize: 13, color: '#6B6C72' }}>{TYPE_LABEL[r.type]}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: '#0077C5', fontWeight: r.isJob ? 600 : 400, paddingLeft: r.isJob ? 16 : 0 }}>
                  {r.isJob && <span style={{ color: '#9096A0', marginLeft: -16, marginRight: 5 }}>└</span>}{r.title}
                </div>
                {r.sub && <div style={{ fontSize: 12, color: '#6B6C72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: r.isJob ? 16 : 0 }}>{r.sub}</div>}
              </div>
              <span className="num" style={{ fontSize: 13.5, textAlign: 'right', color: '#393A3D' }}>
                {r.type === 'TimeActivity' ? r.hours + ':00' : r.amount != null ? fmt2(r.amount) : ''}
              </span>
              <span style={{ textAlign: 'right' }}>
                {r.status === 'queued'
                  ? <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8A6D1F' }}>Saving…</span>
                  : <span style={{ fontSize: 11.5, fontWeight: 700, color: st.c }}>{st.t}</span>}
              </span>
              <button onClick={() => setOpen(open === r.key ? null : r.key)} title="Show the API payload"
                style={{ justifySelf: 'end', border: `1px solid ${QBLINE}`, background: open === r.key ? '#EDEEF1' : '#fff', borderRadius: 3, padding: '3px 7px', fontSize: 11, color: '#6B6C72', cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}>
                {'{ }'}
              </button>
            </div>
            {open === r.key && (
              <div style={{ borderTop: `1px solid ${QBLINE}` }}>
                <div style={{ padding: '7px 16px', background: '#FAFAFB', fontSize: 11.5, color: '#6B6C72' }}>
                  What the portal sent to the QuickBooks API
                </div>
                <pre style={{ margin: 0, padding: '12px 16px 16px', background: '#0F1720', color: '#CFE9C4', fontSize: 11.5, lineHeight: 1.55, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {JSON.stringify(r.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* The other half of the stock story: QuickBooks' own Products and services
   list. Pull stock onto a job or ring up a counter sale and these counts
   come down here too — that is what the journal entry and the inventory
   invoice are actually doing. */
function QboInventory({ stock, touched }) {
  const th = { fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B6C72', padding: '9px 12px' }
  const td = { fontSize: 13, color: QBINK, padding: '11px 12px' }
  const value = stock.reduce((s, i) => s + i.onHand * i.cost, 0)

  return (
    <div>
      <div style={{ background: '#fff', border: `1px solid ${QBLINE}`, borderRadius: 3, marginBottom: 14, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#FAFAFB', borderBottom: `1px solid ${QBLINE}` }}>
              <th style={{ ...th, textAlign: 'left' }}>Name</th>
              <th style={{ ...th, textAlign: 'left' }}>Type</th>
              <th style={{ ...th, textAlign: 'right' }}>Qty on hand</th>
              <th style={{ ...th, textAlign: 'right' }}>Cost</th>
              <th style={{ ...th, textAlign: 'right' }}>Price</th>
              <th style={{ ...th, textAlign: 'right' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((i) => (
              <tr key={i.name} className={touched.includes(i.name) ? 'fresh qbrow' : 'qbrow'} style={{ borderBottom: '1px solid #EDEEF1' }}>
                <td style={{ ...td, color: '#0077C5' }}>{i.name}</td>
                <td style={{ ...td, color: '#6B6C72' }}>Inventory</td>
                <td className="num" style={{ ...td, textAlign: 'right', fontWeight: touched.includes(i.name) ? 700 : 400 }}>
                  {i.onHand} <span style={{ color: '#9096A0', fontSize: 11.5 }}>{i.unit}</span>
                </td>
                <td className="num" style={{ ...td, textAlign: 'right' }}>{fmt2(i.cost)}</td>
                <td className="num" style={{ ...td, textAlign: 'right', color: i.sell ? QBINK : '#B0B4BB' }}>{i.sell ? fmt2(i.price) : '—'}</td>
                <td className="num" style={{ ...td, textAlign: 'right' }}>{fmt2(i.onHand * i.cost)}</td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${QBINK}` }}>
              <td style={{ ...td, fontWeight: 700 }} colSpan={5}>Inventory Asset</td>
              <td className="num" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{fmt2(value)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#6B6C72' }}>
        Quantities come down here when the crew pulls stock onto a job (the journal entry credits this
        account) or when material is sold over the counter (the invoice carries these items, so
        QuickBooks relieves them itself). Inventory tracking requires QuickBooks Online Plus or Advanced.
      </p>
    </div>
  )
}

function Profitability({ jobs, stock }) {
  const cell = { padding: '10px 12px', fontSize: 13, textAlign: 'right', color: QBINK }
  const th = { ...cell, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B6C72' }
  const t = jobs.reduce((s, j) => {
    const a = jobActual(j), m = jobMoney(j, stock)
    s.contract += m.contract; s.billed += m.billed; s.paid += m.paid
    s.mat += a.materials; s.lab += a.labor
    return s
  }, { contract: 0, billed: 0, paid: 0, mat: 0, lab: 0 })

  return (
    <div style={{ background: '#fff', border: `1px solid ${QBLINE}`, borderRadius: 3, padding: '22px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: QBINK }}>QueFence Inc.</div>
        <div style={{ fontSize: 15, color: QBINK }}>Job Profitability Summary</div>
        <div style={{ fontSize: 12.5, color: '#6B6C72' }}>All Dates</div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${QBINK}` }}>
              <th style={{ ...th, textAlign: 'left' }}>Customer : Job</th>
              <th style={th}>Contract</th><th style={th}>Invoiced</th><th style={th}>Received</th>
              <th style={th}>Materials</th><th style={th}>Labor</th><th style={th}>Gross profit</th><th style={th}>Margin</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const a = jobActual(j), m = jobMoney(j, stock)
              const gp = m.contract - a.total
              const mg = m.contract ? (gp / m.contract) * 100 : 0
              return (
                <tr key={j.id} style={{ borderBottom: `1px solid #EDEEF1` }}>
                  <td style={{ ...cell, textAlign: 'left' }}>
                    <div style={{ color: '#6B6C72', fontSize: 12 }}>{j.customer}</div>
                    <div style={{ fontWeight: 600 }}>{j.name}</div>
                  </td>
                  <td className="num" style={cell}>{fmt(m.contract)}</td>
                  <td className="num" style={cell}>{fmt(m.billed)}</td>
                  <td className="num" style={{ ...cell, color: m.owed > 0 ? RED : INK }}>{fmt(m.paid)}</td>
                  <td className="num" style={cell}>{fmt(a.materials)}</td>
                  <td className="num" style={cell}>{fmt(a.labor)}</td>
                  <td className="num" style={{ ...cell, fontWeight: 600 }}>{fmt(gp)}</td>
                  <td className="num" style={{ ...cell, fontWeight: 600, color: mg < 25 ? RED : mg < 35 ? AMBER : GREEN }}>{mg.toFixed(0)}%</td>
                </tr>
              )
            })}
            <tr style={{ borderTop: `2px solid ${QBINK}` }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 700 }}>Total</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.contract)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.billed)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.paid)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.mat)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.lab)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>{fmt(t.contract - t.mat - t.lab)}</td>
              <td className="num" style={{ ...cell, fontWeight: 700 }}>
                {t.contract ? (((t.contract - t.mat - t.lab) / t.contract) * 100).toFixed(0) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#6B6C72', marginTop: 14, textAlign: 'center' }}>
        Materials are inventory relieved to the job plus what was delivered to it.
        Nobody in the office decided which job a cost belonged to.
      </p>
    </div>
  )
}
