import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────
// Summit Ridge Roofing — management portal demo.
// Synthetic data seeded in Supabase (roof_* tables, AccuLynx-shaped).
// QuickBooks stays the book of record; AccuLynx stays the job subledger.
// This portal is the management layer that reads across both.
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Summit Ridge Roofing Co.'

// Palette sampled from the prospect's site. SIGNAL appears in exactly three
// places: the top bar, the active nav state, and the variance flag /
// over-under-billed totals. Everywhere else is stone and slate.
const SIGNAL = '#035CEB'
const SLATE = '#444C56'
const INK = '#1A1E24'
const STONE = '#C9C4B8'
const PAPER = '#F6F6F6'
const WHITE = '#FFFFFF'
const RULE = '#DEDAD1' // stone lightened for hairlines
const MUTED = '#7A828C' // slate lightened for secondary text

const serif = "'Charter','Bitstream Charter','Sitka Text','Iowan Old Style',Georgia,serif"
const sans = "'Inter',-apple-system,'Segoe UI',sans-serif"

// The demo dataset is pinned to this date so aging and the forecast are stable.
const AS_OF = new Date('2026-08-11T00:00:00Z')
const DAY = 86400000
const dt = (s) => new Date(s + 'T00:00:00Z')
const daysBetween = (a, b) => Math.round((b - a) / DAY)
const addDays = (d, n) => new Date(d.getTime() + n * DAY)

const money0 = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')
const moneyK = (n) => {
  const a = Math.abs(n)
  const s = a >= 995000 ? (a / 1e6).toFixed(a >= 9950000 ? 0 : 1) + 'M' : a >= 1000 ? Math.round(a / 1000) + 'K' : Math.round(a)
  return (n < 0 ? '−$' : '$') + s
}
const pct0 = (n) => Math.round(n * 100) + '%'
const pct1 = (n) => (n * 100).toFixed(1) + '%'
const fmtD = (s) => s ? dt(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' }) : '—'
const fmtM = (s) => dt(s).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const TYPE_LABEL = { commercial: 'Commercial', residential: 'Residential', coating: 'Coating' }
const CLASS_LABEL = { contract: 'Contract / planned', insurance: 'Storm & insurance', maintenance: 'Recurring maintenance' }

const NAV = [
  { id: 'jobs', label: 'Job Margin' },
  { id: 'wip', label: 'WIP Schedule' },
  { id: 'cash', label: 'Cash Flow' },
  { id: 'liab', label: 'Liabilities' },
]

const TABLES = ['roof_customers', 'roof_jobs', 'roof_worksheets', 'roof_change_orders', 'roof_supplements', 'roof_invoices', 'roof_payments', 'roof_ap_bills', 'roof_gl_summary', 'roof_addbacks']

const NEXT = {
  jobs: { id: 'wip', q: "What have we earned that we haven't billed?" },
  wip: { id: 'cash', q: 'When does the money actually land?' },
  cash: { id: 'liab', q: "What's committed, held, or owed that no report shows?" },
  liab: { id: 'buyer', q: "What does the buyer's first meeting look like?" },
}

export default function RoofingPortal() {
  const [tab, setTab] = useState('jobs')
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [groupBy, setGroupBy] = useState('none')
  const [jobFilter, setJobFilter] = useState('flagged')
  const [expanded, setExpanded] = useState(null)
  const [intro, setIntro] = useState(false)

  useEffect(() => {
    try { if (!window.localStorage.getItem('roof-intro-seen')) setIntro(true) } catch (e) { setIntro(true) }
  }, [])
  const closeIntro = (target) => {
    try { window.localStorage.setItem('roof-intro-seen', '1') } catch (e) {}
    setIntro(false)
    if (target) setTab(target)
  }

  useEffect(() => {
    let alive = true
    Promise.all(TABLES.map((t) => supabase.from(t).select('*').limit(2000)))
      .then((results) => {
        if (!alive) return
        const bad = results.find((r) => r.error)
        if (bad) { setErr(bad.error.message); return }
        const [customers, jobs, worksheets, changeOrders, supplements, invoices, payments, apBills, gl, addbacks] = results.map((r) => r.data)
        setRaw({ customers, jobs, worksheets, changeOrders, supplements, invoices, payments, apBills, gl, addbacks })
      })
      .catch((e) => alive && setErr(String(e)))
    return () => { alive = false }
  }, [])

  const M = useMemo(() => raw && buildModel(raw), [raw])

  // open the worst flagged job by default so the drill-in shows itself
  useEffect(() => {
    if (!M) return
    const worst = M.open.filter((j) => j.flagged).sort((a, b) => b.slipPts - a.slipPts)[0]
    if (worst) setExpanded((e) => (e === null ? worst.id : e))
  }, [M])

  return (
    <>
      <Head>
        <title>{BIZ} — Management Portal Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${PAPER}}
        body{font-family:${sans};color:${SLATE};font-size:13px;-webkit-font-smoothing:antialiased}
        table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
        h1,h2,h3{font-family:${serif};color:${INK};font-weight:600}
        button{font-family:${sans}}
        .shell{display:flex;min-height:calc(100vh - 34px)}
        .side{width:212px;flex-shrink:0;background:${INK};padding:26px 0 20px;position:sticky;top:34px;height:calc(100vh - 34px);display:flex;flex-direction:column}
        .main{flex:1;min-width:0;padding:30px 36px 20px;max-width:1280px}
        .nbtn{display:block;width:100%;text-align:left;padding:10px 24px;border:none;background:transparent;color:#9aa0a8;font-size:12.5px;font-weight:500;letter-spacing:.02em;cursor:pointer;border-left:3px solid transparent}
        .nbtn:hover{color:${STONE}}
        .nbtn.on{color:${WHITE};border-left-color:${SIGNAL};background:rgba(255,255,255,.04)}
        .card{background:${WHITE};border:1px solid ${RULE};border-radius:3px}
        .th{padding:6px 10px;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};font-weight:600;text-align:left;border-bottom:1px solid ${SLATE};white-space:nowrap}
        .th.r{text-align:right}
        .td{padding:7px 10px;border-bottom:1px solid ${RULE};color:${SLATE};font-size:12.5px;white-space:nowrap}
        .td.r{text-align:right}
        .td.ink{color:${INK}}
        .rowbtn{cursor:pointer}
        .rowbtn:hover td{background:#FBFAF7}
        .seg{display:inline-flex;border:1px solid ${STONE};border-radius:3px;overflow:hidden}
        .seg button{padding:6px 12px;border:none;background:${WHITE};color:${SLATE};font-size:11.5px;font-weight:500;cursor:pointer;border-right:1px solid ${RULE}}
        .seg button:last-child{border-right:none}
        .seg button.on{background:${SLATE};color:${WHITE}}
        .flag{display:inline-block;background:${SIGNAL};color:${WHITE};font-size:10px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:2px;white-space:nowrap}
        .ghost{border:1px solid ${STONE};background:${WHITE};color:${SLATE};font-size:10.5px;font-weight:600;letter-spacing:.06em;padding:4px 10px;border-radius:2px;cursor:pointer}
        .ghost:hover{border-color:${SLATE}}
        .clickable:hover{border-color:${SLATE}}
        .chev{display:inline-block;width:14px;color:${MUTED};font-size:10px}
        .bucket{cursor:pointer}
        .bucket:hover{background:#FBFAF7}
        .bucket.on{background:#EFECE4}
        .print-only{display:none}
        .mobilenav{display:none}
        @media(max-width:820px){
          .side{display:none}
          .main{padding:14px 14px 40px}
          .mobilenav{display:flex;position:sticky;top:34px;z-index:9;background:${INK};overflow-x:auto;gap:2px;padding:0 8px}
          .mobilenav button{flex-shrink:0;border:none;background:transparent;color:#9aa0a8;font-size:12px;font-weight:600;padding:11px 10px;cursor:pointer;border-bottom:3px solid transparent}
          .mobilenav button.on{color:${WHITE};border-bottom-color:${SIGNAL}}
        }
        @media print{
          .no-print{display:none!important}
          .print-only{display:block!important}
          .side{display:none!important}
          .shell{display:block}
          .main{padding:0;max-width:none}
          html,body{background:${WHITE}}
          .card{border:1px solid #bbb;break-inside:avoid}
        }
      `}</style>

      {/* SIGNAL use 1 of 3: the top bar, matching the prospect's site */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 10, background: SIGNAL, color: WHITE, height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '.12em' }}>
        <span>{BIZ.toUpperCase()} — MANAGEMENT PORTAL</span>
        <span style={{ fontWeight: 500, letterSpacing: '.08em' }}>DEMO · SYNTHETIC DATA · AS OF AUG 11, 2026</span>
      </div>

      <div className="mobilenav no-print">
        <button onClick={() => setIntro(true)} style={{ fontFamily: serif, fontStyle: 'italic' }}>The 4 questions</button>
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => { setTab(n.id); setExpanded(null) }}>{n.label}</button>
        ))}
        <button className={tab === 'buyer' ? 'on' : ''} onClick={() => setTab('buyer')}>Buyer Package</button>
      </div>

      <div className="shell">
        <aside className="side no-print">
          <div style={{ padding: '0 24px 18px', borderBottom: '1px solid rgba(201,196,184,.15)', marginBottom: '10px' }}>
            <div style={{ fontFamily: serif, fontSize: '19px', fontWeight: 700, color: WHITE, lineHeight: 1.25 }}>Summit Ridge<br />Roofing Co.</div>
            <div style={{ fontSize: '9.5px', color: STONE, letterSpacing: '.14em', marginTop: '7px' }}>NASHVILLE · TN / KY / AL / GA</div>
          </div>
          <button className="nbtn" onClick={() => setIntro(true)} style={{ fontFamily: serif, fontSize: '13.5px', fontStyle: 'italic' }}>The four questions ↺</button>
          <div style={{ margin: '8px 24px 10px', borderTop: '1px solid rgba(201,196,184,.15)' }} />
          {NAV.map((n) => (
            <button key={n.id} className={'nbtn' + (tab === n.id ? ' on' : '')} onClick={() => { setTab(n.id); setExpanded(null) }}>{n.label}</button>
          ))}
          <div style={{ margin: '16px 24px 6px', borderTop: '1px solid rgba(201,196,184,.15)', paddingTop: '16px', fontSize: '9px', color: '#6d747d', letterSpacing: '.12em' }}>FOR THE SALE</div>
          <button className={'nbtn' + (tab === 'buyer' ? ' on' : '')} onClick={() => setTab('buyer')} style={{ fontFamily: serif, fontSize: '14px' }}>Buyer Package</button>
          <div style={{ marginTop: 'auto', padding: '16px 24px 0', fontSize: '10px', lineHeight: 1.65, color: '#6d747d' }}>
            QuickBooks stays the book of record. AccuLynx stays the job subledger. This is the management layer that reads across both — nothing posts from here.
          </div>
        </aside>

        <main className="main">
          {intro && M && <Intro M={M} onClose={closeIntro} />}
          {err && <div className="card" style={{ padding: '28px', color: INK }}>Couldn&rsquo;t load demo data: {err}</div>}
          {!err && !M && <div style={{ padding: '60px 0', color: MUTED, fontSize: '13px' }}>Loading job data…</div>}
          {M && tab === 'jobs' && <JobMargin M={M} groupBy={groupBy} setGroupBy={setGroupBy} jobFilter={jobFilter} setJobFilter={setJobFilter} expanded={expanded} setExpanded={setExpanded} />}
          {M && tab === 'wip' && <Wip M={M} />}
          {M && tab === 'cash' && <Cash M={M} />}
          {M && tab === 'liab' && <Liabilities M={M} />}
          {M && tab === 'buyer' && <Buyer M={M} />}
          {M && NEXT[tab] && (
            <div className="no-print" onClick={() => setTab(NEXT[tab].id)} style={{ marginTop: '28px', border: `1px solid ${RULE}`, background: WHITE, borderRadius: '3px', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', cursor: 'pointer' }}>
              <span style={{ fontSize: '10px', letterSpacing: '.12em', color: MUTED, fontWeight: 700 }}>NEXT QUESTION</span>
              <span style={{ fontFamily: serif, fontSize: '16px', fontWeight: 600, color: INK }}>{NEXT[tab].q} →</span>
            </div>
          )}
          {M && <div className="no-print" style={{ marginTop: '20px', paddingTop: '14px', borderTop: `1px solid ${RULE}`, fontSize: '11px', color: MUTED, lineHeight: 1.7 }}>
            Nothing is typed into this portal and nothing posts from it. It reads AccuLynx (the job records) and QuickBooks (the books) and answers questions across both. That boundary is the point.
          </div>}
        </main>
      </div>
    </>
  )
}

// ── model ────────────────────────────────────────────────────────────────

function buildModel(raw) {
  const custById = Object.fromEntries(raw.customers.map((c) => [c.id, c]))
  const idx = (rows, key) => {
    const m = {}
    for (const r of rows) { (m[r[key]] = m[r[key]] || []).push(r) }
    return m
  }
  const wsByJob = idx(raw.worksheets, 'job_id')
  const cosByJob = idx(raw.changeOrders, 'job_id')
  const suppsByJob = idx(raw.supplements, 'job_id')
  const invByJob = idx(raw.invoices, 'job_id')
  const payByInv = idx(raw.payments, 'invoice_id')
  const apByJob = idx(raw.apBills, 'job_id')

  const jobs = raw.jobs.map((j) => {
    const ws = wsByJob[j.id] || []
    const estTotal = ws.reduce((s, w) => s + Number(w.estimated_cost), 0)
    const actTotal = ws.reduce((s, w) => s + Number(w.actual_cost), 0)
    const cos = (cosByJob[j.id] || []).filter((c) => c.approved_at)
    const coTotal = cos.reduce((s, c) => s + Number(c.amount), 0)
    const cwc = Number(j.contract_value) + coTotal
    const pct = Number(j.pct_complete)
    const invs = invByJob[j.id] || []
    const billed = invs.reduce((s, i) => s + Number(i.amount), 0)
    const collected = invs.reduce((s, i) => s + (payByInv[i.id] || []).reduce((x, p) => x + Number(p.amount), 0), 0)
    // Run-rate projection: what the job lands at if cost keeps pacing this way.
    // Maintenance retainers aren't run-rate jobs — remaining work assumed at estimate.
    const projFinal = j.status === 'completed' ? actTotal
      : j.revenue_class === 'maintenance' ? actTotal + estTotal * (1 - pct)
      : pct >= 0.15 ? actTotal / pct : estTotal
    const estMargin = cwc > 0 ? (Number(j.contract_value) - estTotal) / Number(j.contract_value) : 0
    const projMargin = cwc > 0 ? (cwc - projFinal) / cwc : 0
    const slipPts = (estMargin - projMargin) * 100
    const flagged = j.status !== 'not_started' && j.revenue_class !== 'maintenance' && pct >= 0.15 && slipPts > 5
    const earned = cwc * pct
    return { ...j, cust: custById[j.customer_id], estTotal, actTotal, cos, coTotal, cwc, pct, billed, collected, projFinal, estMargin, projMargin, slipPts, flagged, earned, ws, supps: suppsByJob[j.id] || [], invs, ap: apByJob[j.id] || [] }
  })

  const open = jobs.filter((j) => j.status === 'in_progress')
  const backlog = jobs.filter((j) => j.status === 'not_started')

  // WIP schedule (open contract jobs, percentage-of-completion —
  // maintenance retainers aren't POC jobs and stay off the schedule)
  const wip = open.filter((j) => j.revenue_class !== 'maintenance').map((j) => {
    const estToComplete = Math.max(0, j.projFinal - j.actTotal)
    const over = Math.max(0, j.billed - j.earned)
    const under = Math.max(0, j.earned - j.billed)
    return { ...j, estToComplete, over, under }
  }).sort((a, b) => b.under - a.under)
  const wipTotals = wip.reduce((t, j) => ({ cwc: t.cwc + j.cwc, cost: t.cost + j.actTotal, etc: t.etc + j.estToComplete, earned: t.earned + j.earned, billed: t.billed + j.billed, over: t.over + j.over, under: t.under + j.under }), { cwc: 0, cost: 0, etc: 0, earned: 0, billed: 0, over: 0, under: 0 })

  // AR
  const openInvoices = raw.invoices.filter((i) => i.status === 'open').map((i) => {
    const j = jobs.find((x) => x.id === i.job_id)
    const pastDue = daysBetween(dt(i.due_date), AS_OF)
    return { ...i, job: j, pastDue }
  }).sort((a, b) => b.pastDue - a.pastDue)
  const bucketOf = (d) => (d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4)
  const aging = { trade: [0, 0, 0, 0, 0], claims: [0, 0, 0, 0, 0] }
  for (const i of openInvoices) aging[i.is_insurance ? 'claims' : 'trade'][bucketOf(i.pastDue)] += Number(i.amount)
  const arTotal = openInvoices.reduce((s, i) => s + Number(i.amount), 0)
  const claimsTotal = openInvoices.filter((i) => i.is_insurance).reduce((s, i) => s + Number(i.amount), 0)
  const claimsInReview = openInvoices.filter((i) => i.claim_status === 'adjuster_review').reduce((s, i) => s + Number(i.amount), 0)

  // 13-week cash forecast
  const weeks = []
  const monday = addDays(AS_OF, -((AS_OF.getUTCDay() + 6) % 7))
  for (let k = 0; k < 13; k++) weeks.push({ start: addDays(monday, k * 7), coll: 0, ap: 0, payroll: 0, items: [] })
  const wkIdx = (d) => Math.floor(daysBetween(monday, d) / 7)
  // Deep past-due balances are a workout, not a forecast — excluded and disclosed.
  let excludedAR = 0
  openInvoices.forEach((i, n) => {
    if ((!i.is_insurance && i.pastDue > 90) || (i.is_insurance && i.pastDue > 120)) { excludedAR += Number(i.amount); return }
    let exp = dt(i.due_date)
    if (i.is_insurance) exp = addDays(exp, i.claim_status === 'adjuster_review' ? 45 : 21)
    else if (i.job && i.job.type !== 'residential') exp = addDays(exp, 14)
    if (exp < AS_OF) exp = addDays(AS_OF, 5 + (n % 4) * 7) // overdue: assume collected over the next month
    const k = wkIdx(exp)
    if (k >= 0 && k < 13) {
      weeks[k].coll += Number(i.amount)
      weeks[k].items.push({
        kind: 'in', amt: Number(i.amount),
        label: `${i.job && i.job.cust ? i.job.cust.name : 'Customer'} · ${i.invoice_no}`,
        why: i.claim_status === 'adjuster_review' ? 'claim in adjuster review — modeled at due + 45d'
          : i.is_insurance ? 'insurance draft — modeled at due + 21d'
          : i.pastDue > 0 ? `${i.pastDue}d past due — assumed collected` : `due ${fmtD(i.due_date)}`,
      })
    }
  })
  for (const b of raw.apBills.filter((b) => b.status === 'open')) {
    let d = dt(b.due_date)
    if (d < AS_OF) d = addDays(AS_OF, 3)
    const k = wkIdx(d)
    if (k >= 0 && k < 13) {
      weeks[k].ap += Number(b.amount)
      const bj = jobs.find((j) => j.id === b.job_id)
      weeks[k].items.push({ kind: 'out', amt: Number(b.amount), label: `${b.vendor} · ${bj ? bj.job_no : ''}`, why: `${b.category} · due ${fmtD(b.due_date)}` })
    }
  }
  const lastGlMonth = raw.gl.map((g) => g.month).sort().slice(-1)[0]
  const officeMonthly = -raw.gl.filter((g) => g.month === lastGlMonth && g.category === 'opex').reduce((s, g) => s + Number(g.amount), 0)
  const fieldWeekly = wip.reduce((s, j) => s + j.estToComplete * 0.3, 0) / 10 // labor ≈30% of cost to complete, ~10 wks
  for (const w of weeks) { w.payroll = officeMonthly * 12 / 52 + fieldWeekly; w.net = w.coll - w.ap - w.payroll }
  const STARTING_CASH = 185000
  let run = STARTING_CASH
  for (const w of weeks) { run += w.net; w.cum = run }

  // trailing 12 months: contracted / invoiced / collected
  const mkey = (s) => s.slice(0, 7)
  const last12 = []
  for (let k = 11; k >= 0; k--) {
    const d = new Date(Date.UTC(2026, 7 - k, 1))
    last12.push(d.toISOString().slice(0, 7))
  }
  const t12 = last12.map((m) => ({
    m,
    contracted: jobs.filter((j) => mkey(j.signed_date) === m).reduce((s, j) => s + Number(j.contract_value), 0),
    invoiced: raw.invoices.filter((i) => mkey(i.date) === m).reduce((s, i) => s + Number(i.amount), 0),
    collected: raw.payments.filter((p) => mkey(p.date) === m).reduce((s, p) => s + Number(p.amount), 0),
  }))

  // liabilities
  // retainage on long-closed jobs is assumed released; recent completions and
  // open jobs are what's actually still held
  const retainage = jobs.filter((j) => Number(j.retainage_pct) > 0 && j.billed > 0 && j.status !== 'not_started'
    && !(j.status === 'completed' && daysBetween(dt(j.completion_date), AS_OF) > 210)).map((j) => {
    const relDate = j.status === 'completed' ? addDays(dt(j.completion_date), 60) : null
    return {
      job: j, held: j.billed * Number(j.retainage_pct) / 100,
      release: relDate ? fmtD(relDate.toISOString().slice(0, 10)) : 'completion + 60d',
      releasable: relDate ? relDate < AS_OF : false,
    }
  }).sort((a, b) => (b.releasable - a.releasable) || (b.held - a.held))
  const openAp = raw.apBills.filter((b) => b.status === 'open').map((b) => ({ ...b, job: jobs.find((j) => j.id === b.job_id) })).sort((a, b) => Number(b.amount) - Number(a.amount))
  const deposits = openInvoicesAndPaid(raw, payByInv, jobs)
  const unbilledSupps = raw.supplements.filter((s) => s.status === 'approved').map((s) => ({ ...s, job: jobs.find((j) => j.id === s.job_id), age: s.approved_at ? daysBetween(dt(s.approved_at), AS_OF) : null })).sort((a, b) => Number(b.amount) - Number(a.amount))

  // buyer package
  const glT12 = raw.gl.filter((g) => last12.includes(mkey(g.month)))
  const sumCat = (cat) => glT12.filter((g) => g.category === cat).reduce((s, g) => s + Number(g.amount), 0)
  const revT12 = sumCat('revenue')
  const netIncome = glT12.reduce((s, g) => s + Number(g.amount), 0)
  const interest = -sumCat('interest'), depreciation = -sumCat('depreciation')
  const ebitda = netIncome + interest + depreciation
  const addbackTotal = raw.addbacks.reduce((s, a) => s + Number(a.annual_amount), 0)
  const adjEbitda = ebitda + addbackTotal

  const revByClass = {}
  const revByState = {}
  const revByCust = {}
  const custJobs = {}
  for (const i of raw.invoices.filter((i) => last12.includes(mkey(i.date)))) {
    const j = jobs.find((x) => x.id === i.job_id)
    if (!j) continue
    revByClass[j.revenue_class] = (revByClass[j.revenue_class] || 0) + Number(i.amount)
    revByState[j.state] = (revByState[j.state] || 0) + Number(i.amount)
    const cn = j.cust ? j.cust.name : '—'
    revByCust[cn] = (revByCust[cn] || 0) + Number(i.amount)
    if (!custJobs[cn]) custJobs[cn] = {}
    if (!custJobs[cn][j.job_no]) custJobs[cn][j.job_no] = { job: j, amt: 0 }
    custJobs[cn][j.job_no].amt += Number(i.amount)
  }
  const invoicedT12 = Object.values(revByCust).reduce((s, v) => s + v, 0)
  const topCust = Object.entries(revByCust).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // working capital proxy: month-end AR reconstruction
  const wcTrend = last12.map((m) => {
    const end = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 1))
    let ar = 0
    for (const i of raw.invoices) {
      if (dt(i.date) >= end) continue
      const paidBy = (payByInv[i.id] || []).filter((p) => dt(p.date) < end).reduce((s, p) => s + Number(p.amount), 0)
      ar += Math.max(0, Number(i.amount) - paidBy)
    }
    return { m, ar }
  })
  const depositTotal = deposits.reduce((s, d) => s + d.amount, 0)
  const apTotal = openAp.reduce((s, b) => s + Number(b.amount), 0)
  const retainageTotal = retainage.reduce((s, r) => s + r.held, 0)
  const suppTotal = unbilledSupps.reduce((s, x) => s + Number(x.amount), 0)

  return {
    raw, jobs, open, backlog, wip, wipTotals, openInvoices, aging, arTotal, claimsTotal, claimsInReview,
    weeks, STARTING_CASH, excludedAR, t12, retainage, retainageTotal, openAp, apTotal, deposits, depositTotal, unbilledSupps, suppTotal,
    revT12, netIncome, interest, depreciation, ebitda, addbackTotal, adjEbitda,
    revByClass, revByState, topCust, custJobs, invoicedT12, wcTrend,
  }
}

function openInvoicesAndPaid(raw, payByInv, jobs) {
  // deposits collected on jobs that haven't started = unearned revenue
  return raw.invoices
    .filter((i) => i.kind === 'deposit')
    .map((i) => {
      const j = jobs.find((x) => x.id === i.job_id)
      const paid = (payByInv[i.id] || []).reduce((s, p) => s + Number(p.amount), 0)
      return j && j.status === 'not_started' && paid > 0 ? { job: j, amount: paid, taken: i.date } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.amount - a.amount)
}

// ── shared bits ──────────────────────────────────────────────────────────

function Header({ q, lead, sub }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ fontSize: '27px', letterSpacing: '-0.01em' }}>{q}</h1>
      {lead && <div style={{ color: INK, fontSize: '15px', fontWeight: 600, marginTop: '8px', maxWidth: '640px', lineHeight: 1.5 }}>{lead}</div>}
      {sub && <div style={{ color: MUTED, fontSize: '13px', marginTop: '6px', maxWidth: '640px', lineHeight: 1.6 }}>{sub}</div>}
    </div>
  )
}

// First-visit framing. The demo may be viewed cold, with nobody narrating —
// this is the narration.
function Intro({ M, onClose }) {
  const liabTotal = M.retainageTotal + M.apTotal + M.depositTotal + M.suppTotal
  const flagged = M.open.filter((j) => j.flagged)
  const QS = [
    { id: 'jobs', q: 'Which jobs are losing money?', hook: `${flagged.length} open jobs are pacing below estimate right now — caught mid-job, not at closeout.` },
    { id: 'wip', q: "What have we earned that we haven't billed?", hook: `${money0(M.wipTotals.under)} of finished work has never been invoiced.` },
    { id: 'cash', q: 'When does the money actually land?', hook: `${moneyK(M.arTotal)} is owed to you. A 13-week view of when it arrives — claims treated like claims.` },
    { id: 'liab', q: "What's held, committed, or owed off the books?", hook: `${moneyK(liabTotal)} sits in retainage, committed AP, deposits, and approved-but-unbilled supplements.` },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,30,36,.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px', overflowY: 'auto' }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '30px 34px 26px', boxShadow: '0 24px 64px rgba(26,30,36,.35)' }}>
        <div style={{ fontSize: '10px', letterSpacing: '.16em', color: MUTED, fontWeight: 700, marginBottom: '12px' }}>SUMMIT RIDGE ROOFING CO. — A WORKING DEMO, SYNTHETIC DATA</div>
        <h1 style={{ fontSize: '25px', lineHeight: 1.25, marginBottom: '10px' }}>Four questions your software can&rsquo;t answer.</h1>
        <p style={{ fontSize: '13.5px', color: SLATE, lineHeight: 1.65, marginBottom: '18px', maxWidth: '560px' }}>
          AccuLynx runs your jobs. QuickBooks keeps your books. Both are doing their job — and neither one can answer the four questions below, because the answers live across both.
          This portal reads the two systems and answers them. <b style={{ color: INK }}>Nobody types anything in here.</b>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {QS.map((x, i) => (
            <div key={x.id} className="card clickable" onClick={() => onClose(x.id)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ fontFamily: serif, fontSize: '15.5px', fontWeight: 700, color: INK, marginBottom: '6px' }}>{i + 1}. {x.q}</div>
              <div style={{ fontSize: '12px', color: SLATE, lineHeight: 1.55 }}>{x.hook}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11.5px', color: MUTED }}>Then the fifth screen: the package you&rsquo;d hand a buyer. Click anything — it&rsquo;s all live.</div>
          <button className="ghost" style={{ background: INK, color: WHITE, border: 'none', padding: '9px 18px', fontSize: '11px' }} onClick={() => onClose('jobs')}>START WITH QUESTION 1 →</button>
        </div>
      </div>
    </div>
  )
}

function Kpi({ k, v, sub, big, onClick }) {
  return (
    <div className={'card' + (onClick ? ' clickable' : '')} onClick={onClick} style={{ padding: '14px 18px', flex: 1, minWidth: '150px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 600, marginBottom: '6px' }}>{k}</div>
      <div style={{ fontFamily: serif, fontSize: big ? '30px' : '25px', fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</div>
      {sub && <div style={{ fontSize: '11px', color: MUTED, marginTop: '5px' }}>{sub}</div>}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,30,36,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: '540px', width: '100%', boxShadow: '0 24px 64px rgba(26,30,36,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 20px', borderBottom: `1px solid ${RULE}` }}>
          <h2 style={{ fontSize: '17px' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '15px', cursor: 'pointer', color: MUTED }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Demo-only invoice draft. Nothing posts — the point is showing that the
// number is already computed and the invoice is one click, not one afternoon.
function DraftInvoice({ d, onClose }) {
  const [prepared, setPrepared] = useState(false)
  return (
    <Modal title="Draft invoice — prepared from job records" onClose={onClose}>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>BILL TO</div>
            <div style={{ color: INK, fontWeight: 600, fontSize: '13.5px', marginTop: '3px' }}>{d.billTo}</div>
            <div style={{ fontSize: '12px', color: SLATE }}>{d.jobLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>TERMS</div>
            <div style={{ fontSize: '12.5px', color: SLATE, marginTop: '3px' }}>Net 30 · due {fmtD(addDays(AS_OF, 30).toISOString().slice(0, 10))}</div>
          </div>
        </div>
        <table>
          <thead><tr><th className="th">Line</th><th className="th r">Amount</th></tr></thead>
          <tbody>
            <tr><td className="td" style={{ whiteSpace: 'normal' }}>{d.line}</td><td className="td r ink" style={{ fontWeight: 700 }}>{money0(d.amount)}</td></tr>
            <tr style={{ background: '#EFECE4' }}><td className="td ink" style={{ fontWeight: 700 }}>Total due</td><td className="td r ink" style={{ fontWeight: 700, fontFamily: serif, fontSize: '16px' }}>{money0(d.amount)}</td></tr>
          </tbody>
        </table>
        <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, margin: '12px 0 16px' }}>
          Demo — nothing posts from this screen. In production this draft lands in AccuLynx as the invoice record and syncs to QuickBooks, which stays the book of record.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="ghost" onClick={onClose}>CANCEL</button>
          <button className="ghost" style={{ background: INK, color: WHITE, border: 'none', padding: '7px 16px' }} onClick={() => setPrepared(true)} disabled={prepared}>
            {prepared ? '✓ PREPARED (DEMO)' : 'PREPARE INVOICE'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function SectionTitle({ t, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '13px 16px 11px' }}>
      <h2 style={{ fontSize: '16.5px' }}>{t}</h2>
      {right}
    </div>
  )
}

// ── screen: job margin ───────────────────────────────────────────────────

const GROUPS = [['none', 'All jobs'], ['crew', 'By crew'], ['pm', 'By PM'], ['type', 'By type'], ['state', 'By state']]

function JobMargin({ M, groupBy, setGroupBy, jobFilter, setJobFilter, expanded, setExpanded }) {
  const pool = M.jobs.filter((j) => jobFilter === 'open' ? j.status === 'in_progress' : jobFilter === 'flagged' ? (j.flagged && j.status === 'in_progress') : j.status !== 'not_started')
  const rows = [...pool].sort((a, b) => (b.flagged - a.flagged) || (b.slipPts - a.slipPts))
  const openFlagged = M.open.filter((j) => j.flagged)
  const marginAtRisk = openFlagged.reduce((s, j) => s + (j.estMargin - j.projMargin) * j.cwc, 0)

  const groups = groupBy === 'none' ? [{ key: null, rows }] :
    Object.entries(rows.reduce((m, j) => { const k = j[groupBy]; (m[k] = m[k] || []).push(j); return m }, {}))
      .map(([key, rows]) => ({ key, rows }))
      .sort((a, b) => b.rows.filter((j) => j.flagged).length - a.rows.filter((j) => j.flagged).length)

  return (
    <div>
      <Header q="Which jobs are losing money?"
        lead={`${openFlagged.length} of your ${M.open.length} open jobs are pacing below estimate — ${moneyK(marginAtRisk)} of margin, still catchable.`}
        sub="Estimated vs. actual cost, projected to completion at the current run rate — flagged while the job is still open, not three months after closeout." />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="OPEN JOBS" v={M.open.length} sub={money0(M.open.reduce((s, j) => s + j.cwc, 0)) + ' under contract'} onClick={() => setJobFilter('open')} />
        <Kpi k="FLAGGED OPEN JOBS" v={openFlagged.length} sub="pacing >5 pts under estimate" onClick={() => setJobFilter('flagged')} />
        <Kpi k="MARGIN AT RISK" v={moneyK(marginAtRisk)} sub="if flagged jobs keep pacing" onClick={() => setJobFilter('flagged')} />
        <Kpi k="AVG PROJECTED MARGIN" v={M.open.length ? pct1(M.open.reduce((s, j) => s + j.projMargin, 0) / M.open.length) : '—'} sub={M.open.length ? `estimated ${pct1(M.open.reduce((s, j) => s + j.estMargin, 0) / M.open.length)} at signing` : ''} />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <div className="seg">{GROUPS.map(([id, label]) => <button key={id} className={groupBy === id ? 'on' : ''} onClick={() => setGroupBy(id)}>{label}</button>)}</div>
        <div className="seg">{[['flagged', 'Flagged only'], ['open', 'All open'], ['all', 'Open + closed']].map(([id, label]) => <button key={id} className={jobFilter === id ? 'on' : ''} onClick={() => setJobFilter(id)}>{label}</button>)}</div>
        <div style={{ fontSize: '11px', color: MUTED }}>{rows.length} jobs · click a row for the cost breakdown</div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr>
            <th className="th">Job</th><th className="th">Customer</th><th className="th">St</th><th className="th">Type</th>
            <th className="th r">Contract</th><th className="th r">Est. cost</th><th className="th r">Actual to date</th>
            <th className="th r">% comp</th><th className="th r">Est → proj margin</th><th className="th" style={{ width: '110px' }}></th>
          </tr></thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.key || 'all'} g={g} groupBy={groupBy} expanded={expanded} setExpanded={setExpanded} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GroupRows({ g, groupBy, expanded, setExpanded }) {
  const flagged = g.rows.filter((j) => j.flagged).length
  return (
    <>
      {g.key != null && (
        <tr style={{ background: '#EFECE4' }}>
          <td className="td ink" colSpan={8} style={{ fontWeight: 700, fontSize: '11.5px', letterSpacing: '.05em', textTransform: groupBy === 'type' ? 'capitalize' : 'none' }}>
            {groupBy === 'type' ? TYPE_LABEL[g.key] || g.key : g.key} · {g.rows.length} jobs
          </td>
          <td className="td r" style={{ fontWeight: 700 }}>{pct1(g.rows.reduce((s, j) => s + j.projMargin * j.cwc, 0) / Math.max(1, g.rows.reduce((s, j) => s + j.cwc, 0)))}</td>
          <td className="td">{flagged > 0 && <span className="flag">{flagged} FLAGGED</span>}</td>
        </tr>
      )}
      {g.rows.map((j) => (
        <JobRow key={j.id} j={j} expanded={expanded} setExpanded={setExpanded} />
      ))}
    </>
  )
}

function JobRow({ j, expanded, setExpanded }) {
  const isOpen = expanded === j.id
  return (
    <>
      <tr className="rowbtn" onClick={() => setExpanded(isOpen ? null : j.id)}>
        <td className="td ink" style={{ fontWeight: 600 }}><span className="chev">{isOpen ? '▾' : '▸'}</span>{j.job_no}</td>
        <td className="td" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.name}</td>
        <td className="td">{j.state}</td>
        <td className="td">{TYPE_LABEL[j.type]}</td>
        <td className="td r ink">{money0(j.cwc)}</td>
        <td className="td r">{money0(j.estTotal)}</td>
        <td className="td r ink">{money0(j.actTotal)}</td>
        <td className="td r">{j.status === 'completed' ? 'done' : pct0(j.pct)}</td>
        <td className="td r" style={{ color: INK, fontWeight: j.flagged ? 700 : 400 }}>{pct1(j.estMargin)} → {pct1(j.projMargin)}</td>
        <td className="td r">{j.flagged && <span className="flag">−{j.slipPts.toFixed(1)} PTS</span>}</td>
      </tr>
      {isOpen && (
        <tr><td colSpan={10} style={{ padding: 0, borderBottom: `1px solid ${RULE}` }}><DrillIn j={j} /></td></tr>
      )}
    </>
  )
}

function DrillIn({ j }) {
  const cats = [['material', 'Material'], ['labor', 'Labor'], ['sub', 'Subcontract'], ['permit', 'Permits'], ['other', 'Other']]
  const maxV = Math.max(...j.ws.map((w) => Math.max(Number(w.estimated_cost), Number(w.actual_cost))), 1)
  return (
    <div style={{ background: '#FBFAF7', padding: '16px 22px 18px', display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '320px', flex: 1 }}>
        <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '10px' }}>COST — ESTIMATED VS. ACTUAL{j.status !== 'completed' && ` (AT ${pct0(j.pct)} COMPLETE)`}</div>
        {cats.map(([key, label]) => {
          const w = j.ws.find((x) => x.category === key)
          if (!w) return null
          const est = Number(w.estimated_cost), act = Number(w.actual_cost)
          const paceEst = j.status === 'completed' ? est : est * j.pct
          const hot = act > paceEst * 1.06
          return (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '86px 1fr 150px', gap: '10px', alignItems: 'center', marginBottom: '7px' }}>
              <div style={{ fontSize: '11.5px', color: SLATE }}>{label}</div>
              <div style={{ position: 'relative', height: '14px' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${(est / maxV) * 100}%`, background: STONE, opacity: .45, borderRadius: '1px' }} />
                <div style={{ position: 'absolute', top: '3px', bottom: '3px', width: `${(act / maxV) * 100}%`, background: hot ? INK : SLATE, borderRadius: '1px' }} />
              </div>
              <div style={{ fontSize: '11.5px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: hot ? INK : SLATE, fontWeight: hot ? 700 : 400 }}>
                {money0(act)} <span style={{ color: MUTED, fontWeight: 400 }}>/ {money0(est)} est</span>
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: '10.5px', color: MUTED, marginTop: '8px' }}>Solid bar = actual to date · pale bar = full-job estimate{j.status !== 'completed' && ' · bold line = category pacing over estimate'}</div>
      </div>
      <div style={{ minWidth: '260px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '10px' }}>WHAT MOVED THE NUMBER</div>
        {j.cos.length === 0 && j.supps.length === 0 && <div style={{ fontSize: '12px', color: MUTED }}>No change orders or supplements on this job.</div>}
        {j.cos.map((c) => (
          <div key={'co' + c.id} style={{ fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: INK, fontWeight: 600 }}>{money0(Number(c.amount))}</span> CO — {c.description} <span style={{ color: MUTED }}>({fmtD(c.approved_at)})</span>
          </div>
        ))}
        {j.supps.map((s) => (
          <div key={'s' + s.id} style={{ fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: INK, fontWeight: 600 }}>{money0(Number(s.amount))}</span> supplement — {s.description} <span style={{ color: MUTED }}>({s.status}{s.status === 'approved' ? ' · NOT YET BILLED' : ''})</span>
          </div>
        ))}
        <div style={{ marginTop: '12px', fontSize: '11.5px', color: SLATE }}>Crew: <b>{j.crew}</b> · PM: <b>{j.pm}</b> · {CLASS_LABEL[j.revenue_class]}</div>
      </div>
    </div>
  )
}

// ── screen: WIP ──────────────────────────────────────────────────────────

function Wip({ M }) {
  const t = M.wipTotals
  const actionable = M.wip.filter((j) => j.under > 5000)
  const [openRow, setOpenRow] = useState(null)
  const [draft, setDraft] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const draftFor = (j) => setDraft({
    billTo: j.cust ? j.cust.name : '', jobLabel: `${j.job_no} — ${j.name}`, amount: j.under,
    line: `Progress billing — ${pct0(j.pct)} complete: earned to date ${money0(j.earned)}, less previously billed ${money0(j.billed)}`,
  })
  return (
    <div>
      <Header q="What have we earned that we haven't billed?"
        lead={`${money0(t.under)} of completed work has never been invoiced. The list below is where it is.`}
        sub="Standard percentage-of-completion across every open job. The two totals below are the balance-sheet entries a buyer's diligence team asks about first." />
      {/* SIGNAL use 3 of 3 (shared with the variance flag): the over/under-billed totals */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div className="card" style={{ padding: '14px 18px', flex: 1, minWidth: '190px', borderTop: `3px solid ${SIGNAL}` }}>
          <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 600, marginBottom: '6px' }}>UNDER-BILLED — EARNED, NOT INVOICED</div>
          <div style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: SIGNAL, fontVariantNumeric: 'tabular-nums' }}>{money0(t.under)}</div>
          <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>an asset your P&L already counts — and your bank account doesn&rsquo;t have</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', flex: 1, minWidth: '190px', borderTop: `3px solid ${SIGNAL}` }}>
          <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 600, marginBottom: '6px' }}>OVER-BILLED — BILLED AHEAD OF WORK</div>
          <div style={{ fontFamily: serif, fontSize: '30px', fontWeight: 700, color: SIGNAL, fontVariantNumeric: 'tabular-nums' }}>{money0(t.over)}</div>
          <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>a liability — cash collected for work still to be done</div>
        </div>
        <Kpi k="OPEN CONTRACT VALUE" v={moneyK(t.cwc)} sub={`${M.wip.length} jobs in progress`} />
        <Kpi k="EST. COST TO COMPLETE" v={moneyK(t.etc)} sub="at current run rates" />
      </div>

      {actionable.length > 0 && (
        <div className="card" style={{ marginBottom: '18px' }}>
          <SectionTitle t={`${actionable.length} jobs have earned revenue you haven't invoiced`} right={<span style={{ fontSize: '11px', color: MUTED }}>worth {money0(actionable.reduce((s, j) => s + j.under, 0))}</span>} />
          {actionable.map((j) => (
            <div key={j.id} className="rowbtn" onClick={() => draftFor(j)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '9px 16px', borderTop: `1px solid ${RULE}`, cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: INK, fontWeight: 600, fontSize: '12.5px' }}>{j.job_no}</span>
                <span style={{ color: SLATE, fontSize: '12.5px' }}> — {j.name}</span>
                <span style={{ color: MUTED, fontSize: '11.5px' }}> · {pct0(j.pct)} complete, billed {pct0(j.billed / Math.max(1, j.earned))} of earned</span>
              </div>
              <div style={{ fontVariantNumeric: 'tabular-nums', color: INK, fontWeight: 700, fontSize: '13px' }}>{money0(j.under)}</div>
              <button className="ghost no-print" onClick={(e) => { e.stopPropagation(); draftFor(j) }}>DRAFT INVOICE</button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <SectionTitle t={`WIP schedule — ${M.wip.length} open jobs`} right={
          <button className="ghost no-print" onClick={() => setShowSchedule(!showSchedule)}>{showSchedule ? 'COLLAPSE' : 'SHOW THE FULL SCHEDULE'}</button>
        } />
        {!showSchedule && (
          <div style={{ padding: '0 16px 14px', fontSize: '12px', color: MUTED }}>
            The full percentage-of-completion schedule — contract, cost, earned, billed, over/under per job — is one click away. The accountant version, when you want it.
          </div>
        )}
        {showSchedule && <table>
          <thead><tr>
            <th className="th">Job</th><th className="th r">Contract + COs</th><th className="th r">Cost incurred</th><th className="th r">Est. to complete</th>
            <th className="th r">% comp</th><th className="th r">Earned</th><th className="th r">Billed</th><th className="th r">Over-billed</th><th className="th r">Under-billed</th>
          </tr></thead>
          <tbody>
            {M.wip.map((j) => (
              <WipRow key={j.id} j={j} isOpen={openRow === j.id} toggle={() => setOpenRow(openRow === j.id ? null : j.id)} />
            ))}
            <tr style={{ background: '#EFECE4' }}>
              <td className="td ink" style={{ fontWeight: 700 }}>Totals</td>
              <td className="td r" style={{ fontWeight: 700 }}>{money0(t.cwc)}</td>
              <td className="td r" style={{ fontWeight: 700 }}>{money0(t.cost)}</td>
              <td className="td r" style={{ fontWeight: 700 }}>{money0(t.etc)}</td>
              <td className="td r"></td>
              <td className="td r" style={{ fontWeight: 700 }}>{money0(t.earned)}</td>
              <td className="td r" style={{ fontWeight: 700 }}>{money0(t.billed)}</td>
              <td className="td r" style={{ fontWeight: 700, color: SIGNAL }}>{money0(t.over)}</td>
              <td className="td r" style={{ fontWeight: 700, color: SIGNAL }}>{money0(t.under)}</td>
            </tr>
          </tbody>
        </table>}
      </div>
      {draft && <DraftInvoice d={draft} onClose={() => setDraft(null)} />}
    </div>
  )
}

function WipRow({ j, isOpen, toggle }) {
  return (
    <>
      <tr className="rowbtn" onClick={toggle}>
        <td className="td ink" style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="chev">{isOpen ? '▾' : '▸'}</span>{j.job_no} · {j.name}</td>
        <td className="td r">{money0(j.cwc)}</td>
        <td className="td r">{money0(j.actTotal)}</td>
        <td className="td r">{money0(j.estToComplete)}</td>
        <td className="td r">{pct0(j.pct)}</td>
        <td className="td r ink">{money0(j.earned)}</td>
        <td className="td r">{money0(j.billed)}</td>
        <td className="td r">{j.over > 0 ? money0(j.over) : '—'}</td>
        <td className="td r" style={{ fontWeight: j.under > 5000 ? 700 : 400, color: INK }}>{j.under > 0 ? money0(j.under) : '—'}</td>
      </tr>
      {isOpen && <tr><td colSpan={9} style={{ padding: 0, borderBottom: `1px solid ${RULE}` }}><DrillIn j={j} /></td></tr>}
    </>
  )
}

// ── screen: cash ─────────────────────────────────────────────────────────

function Cash({ M }) {
  const buckets = ['Current', '1–30', '31–60', '61–90', '90+']
  const [wk, setWk] = useState(null)
  const [sel, setSel] = useState(null) // {row: 'trade'|'claims', b: 0..4}
  const bucketOf = (d) => (d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4)
  const listed = sel
    ? M.openInvoices.filter((i) => (sel.row === 'claims') === !!i.is_insurance && bucketOf(i.pastDue) === sel.b).sort((a, b) => Number(b.amount) - Number(a.amount))
    : M.openInvoices.filter((i) => !i.is_insurance && i.pastDue > 30).slice(0, 5)
  const wMax = Math.max(...M.weeks.map((w) => Math.max(w.coll, w.ap + w.payroll)), 1)
  const cumMin = Math.min(...M.weeks.map((w) => w.cum), M.STARTING_CASH)
  const cumMax = Math.max(...M.weeks.map((w) => w.cum), M.STARTING_CASH)
  const tMax = Math.max(...M.t12.flatMap((r) => [r.contracted, r.invoiced, r.collected]), 1)
  return (
    <div>
      <Header q="When does the money actually land?"
        lead={`${moneyK(M.arTotal)} is owed to you — and ${moneyK(M.claimsInReview)} of it is a claim sitting with an adjuster, not a customer ignoring you.`}
        sub="Commercial progress billing plus insurance claims means the P&L and the bank account tell different stories. This is the bank-account story, thirteen weeks out." />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="OPEN RECEIVABLES" v={moneyK(M.arTotal)} sub={`${M.openInvoices.length} open invoices`} />
        <Kpi k="OF WHICH INSURANCE CLAIMS" v={moneyK(M.claimsTotal)} sub={`${moneyK(M.claimsInReview)} still in adjuster review`} />
        <Kpi k="COMMITTED AP — OPEN JOBS" v={moneyK(M.apTotal)} sub="material + subs, unpaid" />
        <Kpi k="CASH POSITION, WK 13" v={moneyK(M.weeks[12].cum)} sub={`from ${moneyK(M.STARTING_CASH)} today, if collections pace`} />
      </div>

      <div className="card" style={{ marginBottom: '18px', overflowX: 'auto' }}>
        <SectionTitle t="Rolling 13-week forecast" right={<span style={{ fontSize: '11px', color: MUTED }}>expected collections vs. committed AP + payroll</span>} />
        <div style={{ padding: '4px 16px 14px' }}>
          <svg viewBox="0 0 780 190" style={{ width: '100%', minWidth: '640px', display: 'block' }}>
            {M.weeks.map((w, i) => {
              const x = 20 + i * 58
              const collH = (w.coll / wMax) * 92
              const outH = ((w.ap + w.payroll) / wMax) * 92
              const on = wk === i
              return (
                <g key={i} onClick={() => setWk(on ? null : i)} style={{ cursor: 'pointer' }}>
                  <rect x={x - 4} y={16} width={51} height={134} fill={on ? '#EFECE4' : 'transparent'} />
                  <rect x={x} y={118 - collH} width={20} height={collH} fill={on ? INK : SLATE} />
                  <rect x={x + 23} y={118 - outH} width={20} height={outH} fill={STONE} />
                  <text x={x + 21} y={132} textAnchor="middle" fontSize="9.5" fill={on ? INK : MUTED} fontWeight={on ? '700' : '400'} fontFamily={sans}>{w.start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', timeZone: 'UTC' })}</text>
                  <text x={x + 21} y={146} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={w.net < 0 ? INK : MUTED} fontFamily={sans}>{moneyK(w.net)}</text>
                </g>
              )
            })}
            <polyline fill="none" stroke={INK} strokeWidth="1.6"
              points={M.weeks.map((w, i) => `${41 + i * 58},${182 - ((w.cum - cumMin) / Math.max(1, cumMax - cumMin)) * 26}`).join(' ')} />
            {M.weeks.map((w, i) => (
              <circle key={i} cx={41 + i * 58} cy={182 - ((w.cum - cumMin) / Math.max(1, cumMax - cumMin)) * 26} r="2" fill={INK} />
            ))}
            <text x={20} y={170} fontSize="9.5" fill={MUTED} fontFamily={sans}>cash balance →</text>
          </svg>
          <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>
            Dark bars: expected collections (AR aging + claim timing). Stone bars: committed AP + payroll. Net printed under each week; line is the running balance. <b style={{ color: SLATE }}>Click a week to see what lands in it.</b> Insurance claims in adjuster review are modeled at due + 45 days — they do not behave like trade AR.{M.excludedAR > 0 && <> {moneyK(M.excludedAR)} of deep past-due balances is excluded — that&rsquo;s a workout, not a forecast.</>}
          </div>
          {wk != null && (() => {
            const w = M.weeks[wk]
            const ins = w.items.filter((x) => x.kind === 'in').sort((a, b) => b.amt - a.amt)
            const outs = w.items.filter((x) => x.kind === 'out').sort((a, b) => b.amt - a.amt)
            return (
              <div style={{ marginTop: '12px', borderTop: `1px solid ${RULE}`, paddingTop: '12px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>
                    WEEK OF {w.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()} — EXPECTED IN · {money0(w.coll)}
                  </div>
                  {ins.length === 0 && <div style={{ fontSize: '12px', color: MUTED }}>Nothing expected this week.</div>}
                  {ins.map((x, i2) => (
                    <div key={i2} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', padding: '4px 0', borderBottom: `1px solid ${RULE}` }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: INK, fontWeight: 600 }}>{x.label}</span> <span style={{ color: MUTED }}>· {x.why}</span></span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: INK, fontWeight: 600, whiteSpace: 'nowrap' }}>{money0(x.amt)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>
                    GOING OUT · {money0(w.ap + w.payroll)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: `1px solid ${RULE}` }}>
                    <span style={{ color: SLATE }}>Payroll — office + field run-rate</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: INK, fontWeight: 600 }}>{money0(w.payroll)}</span>
                  </div>
                  {outs.map((x, i2) => (
                    <div key={i2} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', padding: '4px 0', borderBottom: `1px solid ${RULE}` }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: INK, fontWeight: 600 }}>{x.label}</span> <span style={{ color: MUTED }}>· {x.why}</span></span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: INK, fontWeight: 600, whiteSpace: 'nowrap' }}>{money0(x.amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div className="card" style={{ flex: '1.4 1 420px', overflowX: 'auto' }}>
          <SectionTitle t="Contracted vs. invoiced vs. collected — trailing 12" />
          <div style={{ padding: '4px 16px 14px' }}>
            <svg viewBox="0 0 720 170" style={{ width: '100%', minWidth: '520px', display: 'block' }}>
              {M.t12.map((r, i) => {
                const x = 16 + i * 58
                return (
                  <g key={r.m}>
                    <rect x={x} y={130 - (r.contracted / tMax) * 118} width={13} height={(r.contracted / tMax) * 118} fill={STONE} />
                    <rect x={x + 15} y={130 - (r.invoiced / tMax) * 118} width={13} height={(r.invoiced / tMax) * 118} fill={MUTED} />
                    <rect x={x + 30} y={130 - (r.collected / tMax) * 118} width={13} height={(r.collected / tMax) * 118} fill={SLATE} />
                    <text x={x + 22} y={146} textAnchor="middle" fontSize="9.5" fill={MUTED} fontFamily={sans}>{fmtM(r.m + '-01')}</text>
                  </g>
                )
              })}
              <g fontFamily={sans} fontSize="10" fill={SLATE}>
                <rect x={16} y={158} width={10} height={10} fill={STONE} /><text x={31} y={166.5}>contracted (signings)</text>
                <rect x={160} y={158} width={10} height={10} fill={MUTED} /><text x={175} y={166.5}>invoiced</text>
                <rect x={250} y={158} width={10} height={10} fill={SLATE} /><text x={265} y={166.5}>collected</text>
              </g>
            </svg>
            <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>The gap between the middle and right bars is your float. When signings spike (the April hail event), collections lag by a quarter — that&rsquo;s the working-capital squeeze that growth causes.</div>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 340px' }}>
          <SectionTitle t="AR aging — claims aged separately" />
          <table>
            <thead><tr><th className="th"></th>{buckets.map((b) => <th key={b} className="th r">{b}</th>)}<th className="th r">Total</th></tr></thead>
            <tbody>
              <tr>
                <td className="td ink" style={{ fontWeight: 600 }}>Trade AR</td>
                {M.aging.trade.map((v, i) => {
                  const on = sel && sel.row === 'trade' && sel.b === i
                  return <td key={i} className={'td r' + (v > 0 ? ' bucket' : '') + (on ? ' on' : '')} onClick={() => v > 0 && setSel(on ? null : { row: 'trade', b: i })} style={{ fontWeight: (i >= 3 && v > 0) || on ? 700 : 400, color: i >= 3 && v > 0 ? INK : SLATE }}>{v > 0 ? moneyK(v) : '—'}</td>
                })}
                <td className="td r ink" style={{ fontWeight: 700 }}>{moneyK(M.aging.trade.reduce((a, b) => a + b, 0))}</td>
              </tr>
              <tr>
                <td className="td ink" style={{ fontWeight: 600 }}>Insurance claims</td>
                {M.aging.claims.map((v, i) => {
                  const on = sel && sel.row === 'claims' && sel.b === i
                  return <td key={i} className={'td r' + (v > 0 ? ' bucket' : '') + (on ? ' on' : '')} onClick={() => v > 0 && setSel(on ? null : { row: 'claims', b: i })} style={{ fontWeight: on ? 700 : 400 }}>{v > 0 ? moneyK(v) : '—'}</td>
                })}
                <td className="td r ink" style={{ fontWeight: 700 }}>{moneyK(M.aging.claims.reduce((a, b) => a + b, 0))}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED, lineHeight: 1.6 }}>
            A claim in adjuster review isn&rsquo;t &ldquo;past due&rdquo; the way an unpaid GC invoice is — chasing it like one wastes calls, and aging it like one overstates your problem. {moneyK(M.claimsInReview)} of the claim balance is in review right now.
          </div>
          <div style={{ borderTop: `1px solid ${RULE}` }}>
            {sel && <div style={{ padding: '8px 16px 0', fontSize: '10.5px', color: SLATE, fontWeight: 600 }}>
              {sel.row === 'claims' ? 'Insurance claims' : 'Trade AR'} · {buckets[sel.b]}{sel.b > 0 ? ' days past due' : ''} · {listed.length} invoices
            </div>}
            {listed.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 16px', borderBottom: `1px solid ${RULE}`, fontSize: '12px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.job ? i.job.name : ''}{i.claim_status === 'adjuster_review' && <span style={{ color: MUTED }}> · in review</span>}</span>
                <span style={{ color: INK, fontWeight: 600, whiteSpace: 'nowrap' }}>{money0(Number(i.amount))} · {i.pastDue > 0 ? `${i.pastDue}d past` : 'current'}</span>
              </div>
            ))}
            <div style={{ padding: '8px 16px', fontSize: '10.5px', color: MUTED }}>{sel ? 'Click the bucket again to clear the filter.' : 'Oldest trade balances — worth a phone call this week. Click any aging bucket above to drill in.'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── screen: liabilities ──────────────────────────────────────────────────

function Liabilities({ M }) {
  const block = { flex: '1 1 420px', minWidth: '360px' }
  const [draft, setDraft] = useState(null)
  return (
    <div>
      <Header q="What's committed, held, or owed that no report shows?"
        lead={`${moneyK(M.retainageTotal + M.apTotal + M.depositTotal + M.suppTotal)} is sitting in four places a P&L never mentions.`}
        sub="Every one of these four numbers is a diligence question. A buyer's quality-of-earnings team will find them — better that you see them first." />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="RETAINAGE HELD BY CUSTOMERS" v={moneyK(M.retainageTotal)} sub="your money, on their schedule" />
        <Kpi k="AP COMMITTED TO OPEN JOBS" v={moneyK(M.apTotal)} sub="material + subs, unpaid" />
        <Kpi k="DEPOSITS NOT YET EARNED" v={moneyK(M.depositTotal)} sub="unearned revenue on unstarted jobs" />
        <Kpi k="APPROVED SUPPLEMENTS UNBILLED" v={moneyK(M.suppTotal)} sub="approved by the carrier — never invoiced" />
      </div>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
        <div className="card" style={block}>
          <SectionTitle t="Retainage held, by customer" right={<b style={{ fontVariantNumeric: 'tabular-nums' }}>{money0(M.retainageTotal)}</b>} />
          <table>
            <thead><tr><th className="th">Customer / job</th><th className="th r">%</th><th className="th r">Held</th><th className="th">Expected release</th></tr></thead>
            <tbody>{M.retainage.slice(0, 9).map((r) => (
              <tr key={r.job.id}>
                <td className="td" style={{ maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: INK, fontWeight: 600 }}>{r.job.cust.name}</span> · {r.job.job_no}</td>
                <td className="td r">{Number(r.job.retainage_pct)}%</td>
                <td className="td r ink" style={{ fontWeight: 600 }}>{money0(r.held)}</td>
                <td className="td" style={r.releasable ? { color: INK, fontWeight: 700 } : {}}>{r.release}{r.releasable && ' — releasable now'}</td>
              </tr>
            ))}</tbody>
          </table>
          {M.retainage.length > 9 && <div style={{ padding: '8px 16px', fontSize: '11px', color: MUTED }}>+ {M.retainage.length - 9} more jobs holding {money0(M.retainage.slice(9).reduce((s, r) => s + r.held, 0))}</div>}
        </div>

        <div className="card" style={block}>
          <SectionTitle t="AP committed against open jobs" right={<b style={{ fontVariantNumeric: 'tabular-nums' }}>{money0(M.apTotal)}</b>} />
          <table>
            <thead><tr><th className="th">Vendor</th><th className="th">Job</th><th className="th">Kind</th><th className="th r">Amount</th><th className="th r">Due</th></tr></thead>
            <tbody>{M.openAp.slice(0, 12).map((b) => (
              <tr key={b.id}>
                <td className="td ink" style={{ fontWeight: 600 }}>{b.vendor}</td>
                <td className="td">{b.job ? b.job.job_no : ''}</td>
                <td className="td">{b.category}</td>
                <td className="td r ink" style={{ fontWeight: 600 }}>{money0(Number(b.amount))}</td>
                <td className="td r">{fmtD(b.due_date)}</td>
              </tr>
            ))}</tbody>
          </table>
          {M.openAp.length > 12 && <div style={{ padding: '8px 16px', fontSize: '11px', color: MUTED }}>+ {M.openAp.length - 12} more bills</div>}
        </div>

        <div className="card" style={block}>
          <SectionTitle t="Deposits taken on jobs not yet started" right={<b style={{ fontVariantNumeric: 'tabular-nums' }}>{money0(M.depositTotal)}</b>} />
          <table>
            <thead><tr><th className="th">Customer / job</th><th className="th r">Deposit held</th><th className="th r">Taken</th><th className="th r">Starts</th></tr></thead>
            <tbody>{M.deposits.map((d) => (
              <tr key={d.job.id}>
                <td className="td" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: INK, fontWeight: 600 }}>{d.job.cust.name}</span> · {d.job.name.split('—')[1]}</td>
                <td className="td r ink" style={{ fontWeight: 600 }}>{money0(d.amount)}</td>
                <td className="td r">{fmtD(d.taken)}</td>
                <td className="td r">{fmtD(d.job.start_date)}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED }}>This is revenue you can&rsquo;t recognize and cash you&rsquo;ve already got — the classic way a roofer&rsquo;s bank balance flatters him.</div>
        </div>

        <div className="card" style={block}>
          <SectionTitle t="Approved supplements never billed" right={<b style={{ fontVariantNumeric: 'tabular-nums' }}>{money0(M.suppTotal)}</b>} />
          <table>
            <thead><tr><th className="th">Job / description</th><th className="th r">Amount</th><th className="th r">Approved</th></tr></thead>
            <tbody>{M.unbilledSupps.map((s) => (
              <tr key={s.id} className="rowbtn" onClick={() => setDraft({
                billTo: s.job && s.job.cust ? s.job.cust.name : '', jobLabel: s.job ? `${s.job.job_no} — ${s.job.name}` : '',
                amount: Number(s.amount), line: `Approved supplement — ${s.description} (carrier approved ${s.age != null ? s.age + ' days ago' : ''})`,
              })}>
                <td className="td" style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: INK, fontWeight: 600 }}>{s.job ? s.job.job_no : ''}</span> — {s.description}</td>
                <td className="td r ink" style={{ fontWeight: 600 }}>{money0(Number(s.amount))}</td>
                <td className="td r">{s.age != null ? s.age + 'd ago' : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED }}>The carrier already said yes to every line on this list. It&rsquo;s not a collections problem — it&rsquo;s an invoicing problem, and it&rsquo;s free money. Click a line to draft the invoice.</div>
        </div>
      </div>
      {draft && <DraftInvoice d={draft} onClose={() => setDraft(null)} />}
    </div>
  )
}

// ── screen: buyer package ────────────────────────────────────────────────

function Buyer({ M }) {
  const classes = ['maintenance', 'contract', 'insurance']
  const classTotal = classes.reduce((s, c) => s + (M.revByClass[c] || 0), 0)
  const states = Object.entries(M.revByState).sort((a, b) => b[1] - a[1])
  const stateTotal = states.reduce((s, [, v]) => s + v, 0)
  const backlogTotal = M.backlog.reduce((s, j) => s + Number(j.contract_value), 0)
  const backlogMargin = M.backlog.reduce((s, j) => s + (Number(j.contract_value) - j.estTotal), 0)
  const wcMax = Math.max(...M.wcTrend.map((w) => w.ar), 1)
  const [custOpen, setCustOpen] = useState(null)
  let cum = 0
  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <Header q="What does the buyer's first meeting look like?"
          lead={`${moneyK(M.adjEbitda)} adjusted EBITDA on ${moneyK(M.revT12)} of revenue — documented line by line, ready to hand over.`}
          sub="The package a deal team actually reads: normalized earnings with every add-back justified, revenue quality, concentration, footprint, backlog, and working capital. Exportable — a package that only lives in a browser never reaches the deal team." />
        <button className="ghost" style={{ background: INK, color: WHITE, border: 'none', padding: '9px 18px', fontSize: '11px' }} onClick={() => window.print()}>EXPORT PDF</button>
      </div>
      <div className="print-only" style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '24px' }}>{BIZ} — Buyer Package</h1>
        <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>Prepared from job-level records · trailing twelve months through July 2026 · synthetic demo data</div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi big k="TRAILING-12 REVENUE" v={moneyK(M.revT12)} />
        <Kpi big k="ADJUSTED EBITDA (TTM)" v={moneyK(M.adjEbitda)} sub={pct1(M.adjEbitda / M.revT12) + ' of revenue'} />
        <Kpi big k="SIGNED BACKLOG" v={moneyK(backlogTotal)} sub={pct1(backlogMargin / Math.max(1, backlogTotal)) + ' expected margin'} />
        <Kpi big k="RECURRING REVENUE" v={pct1((M.revByClass.maintenance || 0) / Math.max(1, classTotal))} sub="maintenance contracts, TTM" />
      </div>

      <div className="card" style={{ marginBottom: '18px' }}>
        <SectionTitle t="Normalized EBITDA — every add-back with its justification" />
        <table>
          <tbody>
            <tr><td className="td">Net income, trailing 12 months (per QuickBooks)</td><td className="td r ink" style={{ fontWeight: 600 }}>{money0(M.netIncome)}</td></tr>
            <tr><td className="td">+ Interest — line of credit &amp; equipment notes</td><td className="td r">{money0(M.interest)}</td></tr>
            <tr><td className="td">+ Depreciation &amp; amortization</td><td className="td r">{money0(M.depreciation)}</td></tr>
            <tr style={{ background: '#F3F1EB' }}><td className="td ink" style={{ fontWeight: 700 }}>EBITDA, as reported</td><td className="td r ink" style={{ fontWeight: 700 }}>{money0(M.ebitda)}</td></tr>
            {M.raw.addbacks.map((a) => (
              <tr key={a.id}>
                <td className="td">+ {a.name}<div style={{ fontSize: '11px', color: MUTED, whiteSpace: 'normal', maxWidth: '620px', marginTop: '2px' }}>{a.justification}</div></td>
                <td className="td r" style={{ verticalAlign: 'top' }}>{money0(Number(a.annual_amount))}</td>
              </tr>
            ))}
            <tr style={{ background: '#EFECE4' }}>
              <td className="td ink" style={{ fontWeight: 700, fontSize: '14px' }}>Adjusted EBITDA</td>
              <td className="td r ink" style={{ fontWeight: 700, fontSize: '14px' }}>{money0(M.adjEbitda)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div className="card" style={{ flex: '1 1 340px' }}>
          <SectionTitle t="Revenue quality" right={<span style={{ fontSize: '11px', color: MUTED }}>TTM invoiced</span>} />
          {classes.map((c) => {
            const v = M.revByClass[c] || 0
            return (
              <div key={c} style={{ padding: '8px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span style={{ color: INK, fontWeight: 600 }}>{CLASS_LABEL[c]}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{moneyK(v)} · {pct0(v / Math.max(1, classTotal))}</span>
                </div>
                <div style={{ height: '8px', background: PAPER, borderRadius: '1px' }}><div style={{ height: '100%', width: pct0(v / Math.max(1, classTotal)), background: c === 'maintenance' ? INK : c === 'contract' ? SLATE : STONE, borderRadius: '1px' }} /></div>
              </div>
            )
          })}
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED, lineHeight: 1.6 }}>Buyers discount storm revenue and pay up for the maintenance base. The honest split is here, not blended into one top line.</div>
        </div>

        <div className="card" style={{ flex: '1 1 340px' }}>
          <SectionTitle t="Customer concentration — top 10" right={<span style={{ fontSize: '11px', color: MUTED }}>TTM invoiced</span>} />
          <table>
            <thead><tr><th className="th">Customer</th><th className="th r">Revenue</th><th className="th r">%</th><th className="th r">Cum.</th></tr></thead>
            <tbody>{M.topCust.map(([name, v]) => {
              cum += v
              const isOpen = custOpen === name
              const jobsFor = Object.values(M.custJobs[name] || {}).sort((a, b) => b.amt - a.amt)
              return (
                <React.Fragment key={name}>
                  <tr className="rowbtn" onClick={() => setCustOpen(isOpen ? null : name)}>
                    <td className="td ink" style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="chev">{isOpen ? '▾' : '▸'}</span>{name}</td>
                    <td className="td r">{moneyK(v)}</td>
                    <td className="td r">{pct1(v / Math.max(1, M.invoicedT12))}</td>
                    <td className="td r">{pct0(cum / Math.max(1, M.invoicedT12))}</td>
                  </tr>
                  {isOpen && (
                    <tr><td colSpan={4} style={{ padding: '4px 14px 10px 24px', borderBottom: `1px solid ${RULE}`, background: '#FBFAF7' }}>
                      {jobsFor.map((x) => (
                        <div key={x.job.job_no} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '11.5px', padding: '3px 0' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: SLATE }}>{x.job.job_no} · {x.job.name.split('—')[1] || x.job.name} <span style={{ color: MUTED }}>· {x.job.status.replace('_', ' ')}</span></span>
                          <span style={{ fontVariantNumeric: 'tabular-nums', color: INK, fontWeight: 600, whiteSpace: 'nowrap' }}>{moneyK(x.amt)}</span>
                        </div>
                      ))}
                    </td></tr>
                  )}
                </React.Fragment>
              )
            })}</tbody>
          </table>
        </div>

        <div className="card" style={{ flex: '0 1 260px' }}>
          <SectionTitle t="Revenue by state" />
          <table>
            <tbody>{states.map(([st, v]) => (
              <tr key={st}>
                <td className="td ink" style={{ fontWeight: 600 }}>{st}</td>
                <td className="td r">{moneyK(v)}</td>
                <td className="td r">{pct0(v / Math.max(1, stateTotal))}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED, lineHeight: 1.6 }}>Answers &ldquo;is the multi-state footprint real?&rdquo; before it&rsquo;s asked. It&rsquo;s real — and it&rsquo;s honestly weighted to Tennessee.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1.3 1 440px', overflowX: 'auto' }}>
          <SectionTitle t="Backlog — signed, not yet started" right={<b style={{ fontVariantNumeric: 'tabular-nums' }}>{money0(backlogTotal)}</b>} />
          <table>
            <thead><tr><th className="th">Job</th><th className="th">Type</th><th className="th r">Contract</th><th className="th r">Exp. margin</th><th className="th r">Starts</th></tr></thead>
            <tbody>{[...M.backlog].sort((a, b) => Number(b.contract_value) - Number(a.contract_value)).map((j) => (
              <tr key={j.id}>
                <td className="td" style={{ maxWidth: '270px', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: INK, fontWeight: 600 }}>{j.job_no}</span> — {j.name}</td>
                <td className="td">{TYPE_LABEL[j.type]}</td>
                <td className="td r ink" style={{ fontWeight: 600 }}>{money0(Number(j.contract_value))}</td>
                <td className="td r">{pct1(j.estMargin)}</td>
                <td className="td r">{fmtD(j.start_date)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="card" style={{ flex: '1 1 340px' }}>
          <SectionTitle t="Working capital tied up in receivables" right={<span style={{ fontSize: '11px', color: MUTED }}>month-end AR</span>} />
          <div style={{ padding: '4px 16px 8px' }}>
            <svg viewBox="0 0 400 120" style={{ width: '100%', display: 'block' }}>
              {M.wcTrend.map((w, i) => (
                <rect key={w.m} x={8 + i * 32} y={100 - (w.ar / wcMax) * 90} width={22} height={(w.ar / wcMax) * 90} fill={i === M.wcTrend.length - 1 ? SLATE : STONE} />
              ))}
              {M.wcTrend.map((w, i) => (
                i % 2 === 1 ? <text key={w.m} x={19 + i * 32} y={113} textAnchor="middle" fontSize="8.5" fill={MUTED} fontFamily={sans}>{fmtM(w.m + '-01')}</text> : null
              ))}
            </svg>
          </div>
          <table>
            <tbody>
              <tr><td className="td">Open receivables</td><td className="td r">{money0(M.arTotal)}</td></tr>
              <tr><td className="td">+ Under-billed WIP (earned, uninvoiced)</td><td className="td r">{money0(M.wipTotals.under)}</td></tr>
              <tr><td className="td">− Committed AP on open jobs</td><td className="td r">({money0(M.apTotal)})</td></tr>
              <tr><td className="td">− Customer deposits not yet earned</td><td className="td r">({money0(M.depositTotal)})</td></tr>
              <tr><td className="td">− Over-billed WIP</td><td className="td r">({money0(M.wipTotals.over)})</td></tr>
              <tr style={{ background: '#EFECE4' }}><td className="td ink" style={{ fontWeight: 700 }}>Net working capital in the jobs</td><td className="td r ink" style={{ fontWeight: 700 }}>{money0(M.arTotal + M.wipTotals.under - M.apTotal - M.depositTotal - M.wipTotals.over)}</td></tr>
            </tbody>
          </table>
          <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: MUTED, lineHeight: 1.6 }}>The AR climb since the April hail event isn&rsquo;t a collections failure — it&rsquo;s what insurance-driven growth does to working capital. A buyer will model it either way; this shows you saw it first.</div>
        </div>
      </div>
    </div>
  )
}
