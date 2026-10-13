import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import DemoBooksPanel from '../components/DemoBooksPanel'
import { DEMO_EMBED_HIDE_LOBBY_CSS, getDemoEmbedServerProps, isDemoEmbedQuery } from '../lib/demoEmbed'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

// ─────────────────────────────────────────────────────────────────────────
// Buckle Up — fictitious retail store. Lease-heavy sales floor sample:
// funding tiers, open stips, thin lease gross, CIT in QuickBooks.
// Share clean: /buckle-up?embed=1
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Buckle Up'
const AS_OF = '2026-10-10'
const REP = 'Marcus Chen'

const SIGNAL = '#D71920'
const INK = '#14181C'
const SLATE = '#3D4650'
const MUTED = '#6B7580'
const FAINT = '#9AA3AD'
const PAPER = '#F4F5F7'
const WHITE = '#FFFFFF'
const RULE = '#DDE1E6'
const RED = '#C23B22'
const AMBER = '#B8860B'
const GREEN = '#1A7A4A'

const serif = DEMO_HEAD
const sans = DEMO_UI
const mono = DEMO_MONO

const dt = (s) => new Date(s + 'T12:00:00')
const fmtD = (s) => (s ? dt(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')
const money0 = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')

const NAV = [
  { id: 'funding', label: 'Funding & payday' },
  { id: 'desk', label: 'My desk' },
  { id: 'gross', label: 'Lease vs gross' },
  { id: 'books', label: 'Books' },
]

const NEXT = {
  funding: { id: 'desk', q: 'What is still on my desk before F&I?' },
  desk: { id: 'gross', q: 'Why do units look fine but gross does not?' },
  gross: { id: 'books', q: 'Where does this sit in QuickBooks?' },
  books: { id: 'funding', q: 'Start over — what is blocking payday?' },
}

/** @type {import('react').CSSProperties} */
const tabNums = { fontVariantNumeric: 'tabular-nums' }

const DEALS = [
  {
    id: 'D-44102',
    customer: 'Alvarez family',
    stock: 'STK 8841 · 2026 RAV4 LE',
    type: 'lease',
    sold: '2026-10-08',
    funded: null,
    front: 180,
    back: 420,
    mini: true,
    fundingDays: 2,
    tier: 100,
    stips: ['Proof of insurance — binder not uploaded'],
    stage: 'cit',
    delivery: '2026-10-11',
  },
  {
    id: 'D-44088',
    customer: 'James Okonkwo',
    stock: 'STK 9012 · 2025 Camry SE',
    type: 'finance',
    sold: '2026-10-06',
    funded: null,
    front: 1240,
    back: 980,
    mini: false,
    fundingDays: 4,
    tier: 100,
    stips: [],
    stage: 'cit',
    delivery: '2026-10-09',
  },
  {
    id: 'D-44071',
    customer: 'Priya & Dev Shah',
    stock: 'STK 8770 · 2026 CR-V EX',
    type: 'lease',
    sold: '2026-10-03',
    funded: null,
    front: 95,
    back: 310,
    mini: true,
    fundingDays: 7,
    tier: 75,
    stips: ['Paystub illegible', 'Co-buyer ID expired'],
    stage: 'cit',
    delivery: null,
  },
  {
    id: 'D-44055',
    customer: 'Mike Torres',
    stock: 'STK 8899 · 2024 Tacoma TRD',
    type: 'finance',
    sold: '2026-09-28',
    funded: null,
    front: 1580,
    back: 720,
    mini: false,
    fundingDays: 12,
    tier: 50,
    stips: ['Lender callback — verify employment'],
    stage: 'cit',
    delivery: null,
  },
  {
    id: 'D-44041',
    customer: 'Linda Wu',
    stock: 'STK 9104 · 2026 Civic Sport',
    type: 'lease',
    sold: '2026-09-25',
    funded: '2026-10-02',
    front: 120,
    back: 0,
    mini: true,
    fundingDays: 7,
    tier: 75,
    stips: [],
    stage: 'funded',
    delivery: '2026-09-27',
  },
  {
    id: 'D-44022',
    customer: 'Robert Klein',
    stock: 'STK 8655 · 2025 Accord LX',
    type: 'lease',
    sold: '2026-09-22',
    funded: '2026-09-30',
    front: 75,
    back: 180,
    mini: true,
    fundingDays: 8,
    tier: 75,
    stips: [],
    stage: 'funded',
    delivery: '2026-09-24',
  },
  {
    id: 'D-44010',
    customer: 'Sandra Miles',
    stock: 'STK 9022 · 2026 Highlander',
    type: 'finance',
    sold: '2026-09-20',
    funded: '2026-09-26',
    front: 1420,
    back: 1100,
    mini: false,
    fundingDays: 6,
    tier: 100,
    stips: [],
    stage: 'funded',
    delivery: '2026-09-22',
  },
  {
    id: 'D-43998',
    customer: 'Chris & Ana Bello',
    stock: 'STK 8811 · 2026 HR-V',
    type: 'lease',
    sold: '2026-10-09',
    funded: null,
    front: 210,
    back: 390,
    mini: true,
    fundingDays: 1,
    tier: 100,
    stips: [],
    stage: 'fi',
    delivery: null,
  },
  {
    id: 'D-43990',
    customer: 'Daniel Frost',
    stock: 'STK 8701 · 2025 Pilot',
    type: 'finance',
    sold: '2026-10-07',
    funded: null,
    front: 980,
    back: 640,
    mini: false,
    fundingDays: 3,
    tier: 100,
    stips: [],
    stage: 'fi',
    delivery: null,
  },
  {
    id: 'D-43981',
    customer: 'Up · walk-in',
    stock: 'STK 9200 · 2026 Corolla',
    type: 'lease',
    sold: '2026-10-10',
    funded: null,
    front: 0,
    back: 0,
    mini: true,
    fundingDays: 0,
    tier: 100,
    stips: [],
    stage: 'quote',
    delivery: null,
  },
  {
    id: 'D-43970',
    customer: 'Hannah Reed',
    stock: 'STK 8933 · 2026 Tucson',
    type: 'lease',
    sold: '2026-10-01',
    funded: '2026-10-08',
    front: 140,
    back: 260,
    mini: true,
    fundingDays: 7,
    tier: 75,
    stips: [],
    stage: 'funded',
    delivery: '2026-10-04',
  },
  {
    id: 'D-43955',
    customer: 'George Patel',
    stock: 'STK 8880 · 2025 Outback',
    type: 'finance',
    sold: '2026-09-18',
    funded: '2026-09-24',
    front: 1100,
    back: 890,
    mini: false,
    fundingDays: 6,
    tier: 100,
    stips: [],
    stage: 'funded',
    delivery: '2026-09-20',
  },
]

const GL_SNAPSHOT = {
  citBalance: 487200,
  citOver10: 142800,
  floorPlan: 3124000,
  mtdVehicleGross: 68400,
  mtdFiIncome: 22100,
  commissionAccrued: 42800,
  commissionPaid: 38100,
}

function commissionOnDeal(d) {
  const base = d.mini ? 125 : Math.round(d.front * 0.22 + d.back * 0.05)
  return Math.round(base * (d.tier / 100))
}

function buildModel() {
  const asOf = dt(AS_OF)
  const openCit = DEALS.filter((d) => d.stage === 'cit')
  const withStips = openCit.filter((d) => d.stips.length > 0)
  const tierRisk = openCit.filter((d) => d.fundingDays >= 6)
  const commissionAtRisk = tierRisk.reduce((s, d) => {
    const full = commissionOnDeal({ ...d, tier: 100 })
    const now = commissionOnDeal(d)
    return s + (full - now)
  }, 0)
  const mtd = DEALS.filter((d) => d.stage !== 'quote' && dt(d.sold) >= dt('2026-10-01'))
  const mtdLeases = mtd.filter((d) => d.type === 'lease')
  const mtdFinance = mtd.filter((d) => d.type === 'finance')
  const unitsMtd = mtd.length
  const frontMtd = mtd.reduce((s, d) => s + d.front, 0)
  const leaseFrontAvg = mtdLeases.length ? mtdLeases.reduce((s, d) => s + d.front, 0) / mtdLeases.length : 0
  const finFrontAvg = mtdFinance.length ? mtdFinance.reduce((s, d) => s + d.front, 0) / mtdFinance.length : 0
  const commissionMtd = mtd
    .filter((d) => d.stage === 'funded')
    .reduce((s, d) => s + commissionOnDeal(d), 0)
  const pendingCommission = openCit.reduce((s, d) => s + commissionOnDeal(d), 0)

  return {
    openCit,
    withStips,
    tierRisk,
    commissionAtRisk,
    pendingCommission,
    mtd,
    mtdLeases,
    mtdFinance,
    unitsMtd,
    frontMtd,
    leaseFrontAvg,
    finFrontAvg,
    commissionMtd,
    asOf,
  }
}

export default function BuckleUpPortal({ demoEmbed = false }) {
  const router = useRouter()
  const embedded =
    demoEmbed
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))

  const [tab, setTab] = useState('funding')
  const [intro, setIntro] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showAllCit, setShowAllCit] = useState(false)

  const M = useMemo(() => buildModel(), [])

  useEffect(() => {
    if (!embedded) return
    document.documentElement.classList.add('demo-embed')
    return () => document.documentElement.classList.remove('demo-embed')
  }, [embedded])

  useEffect(() => {
    if (embedded) return
    try {
      if (!window.localStorage.getItem('buckle-up-intro-seen')) setIntro(true)
    } catch (e) {
      setIntro(true)
    }
  }, [embedded])

  const closeIntro = (target) => {
    try {
      window.localStorage.setItem('buckle-up-intro-seen', '1')
    } catch (e) {}
    setIntro(false)
    if (target) setTab(target)
  }

  const citVisible = showAllCit ? M.openCit : M.openCit.filter((d) => d.stips.length > 0 || d.fundingDays >= 6)

  const lbl = { fontFamily: mono, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: FAINT }
  const card = { background: WHITE, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '18px 20px' }
  const th = { ...lbl, textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${RULE}` }
  const td = { fontSize: '13px', color: INK, padding: '10px', borderBottom: `1px solid ${PAPER}`, verticalAlign: 'top', ...tabNums }

  const Takeaway = ({ children, big, accent }) => (
    <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.55, color: SLATE, maxWidth: '52rem' }}>
      {children}
      {big != null && (
        <strong style={{ color: accent || SIGNAL, fontFamily: serif, fontWeight: 600, fontSize: '17px' }}> {big}</strong>
      )}
    </p>
  )

  return (
    <>
      <Head>
        <title>{BIZ} — Sales desk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Buckle Up sales desk — funding, stips, lease gross, and QuickBooks in one read-only view." />
        <meta property="og:title" content="Buckle Up — Sales desk" />
        <meta property="og:description" content="Which deals are holding your check? Funding tiers, open stips, and books — demo portal." />
        <DemoFontLinks />
        {embedded ? <style>{DEMO_EMBED_HIDE_LOBBY_CSS}</style> : null}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ${DEMO_RENDER_HINTS}
          body{background:${PAPER}}
          html.demo-embed .bu-topbar-sub{display:none}
          html.demo-embed .bu-jk-chip{display:none}
          html.demo-embed .bu-foot{display:none}
          .bl-shell{display:flex;min-height:calc(100vh - ${embedded ? 34 : 72}px);font-family:${sans}}
          .bl-side{width:220px;flex-shrink:0;background:${INK};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:${embedded ? 34 : 72}px;height:calc(100vh - ${embedded ? 34 : 72}px)}
          .bl-nav{width:100%;text-align:left;padding:10px 12px;border-radius:6px;border:none;background:transparent;color:#8A939C;font-size:13px;cursor:pointer;margin-bottom:2px;font-family:${sans}}
          .bl-nav:hover{background:rgba(255,255,255,.06);color:#e8eaed}
          .bl-nav.on{background:rgba(255,255,255,.08);color:#fff;box-shadow:inset 3px 0 0 ${SIGNAL}}
          .bl-main{flex:1;min-width:0;padding:28px 28px 72px}
          .bu-mark{letter-spacing:.22em;font-size:15px;line-height:1.05;font-weight:700}
          .bu-mark span{color:${SIGNAL}}
          .bl-mtabs{display:none;position:sticky;top:${embedded ? 34 : 72}px;z-index:20;background:${INK};padding:8px 10px;gap:6px;overflow-x:auto}
          .bl-mtab{flex-shrink:0;border:none;border-radius:20px;padding:8px 14px;font-size:12px;font-family:${mono};letter-spacing:.04em;cursor:pointer;background:#2a3038;color:#aab2bb}
          .bl-mtab.on{background:${SIGNAL};color:#fff}
          .bl-next{margin-top:24px;padding:14px 18px;background:#fff;border:1px solid ${RULE};border-radius:8px;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
          .bl-chev{transition:transform .15s;display:inline-block}
          .bl-chev.open{transform:rotate(90deg)}
          @media(max-width:820px){
            .bl-side{display:none}
            .bl-mtabs{display:flex}
            .bl-main{padding:16px 14px 64px}
          }
        `}</style>
      </Head>

      {!embedded && <DemoLobby />}

      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: embedded ? 0 : 38,
          zIndex: 30,
          background: SIGNAL,
          color: WHITE,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '.14em',
        }}
      >
        <span>{BIZ.toUpperCase()} — SALES DESK</span>
        <span className="bu-topbar-sub" style={{ fontWeight: 500, letterSpacing: '.1em', opacity: 0.92 }}>
          DEMO · SYNTHETIC DATA · AS OF {fmtD(AS_OF)}
        </span>
      </div>

      {intro && !embedded && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(20,24,28,.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ ...card, maxWidth: '520px', boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
            <div className="bu-mark" style={{ fontFamily: mono, color: INK, marginBottom: '12px' }}>
              BUCKLE <span>UP</span>
            </div>
            <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 600, color: INK, marginBottom: '10px' }}>Your deals, your funding, your books</div>
            <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>
              Read-only demo — nothing to type. It pulls from your DMS, F&amp;I log, and QuickBooks like a desk manager who actually has all three open.
            </p>
            <ul style={{ margin: '0 0 20px', paddingLeft: '18px', fontSize: '14px', color: SLATE, lineHeight: 1.7 }}>
              <li>Which of <strong>my</strong> deals are past the funding tier — and how much commission is at risk? <span style={{ color: SIGNAL }}>{money0(M.commissionAtRisk)}</span></li>
              <li>What stips are still open while the customer thinks they are done? <span style={{ color: SIGNAL }}>{M.withStips.length} deals</span></li>
              <li>Why does unit count look fine in a lease-heavy month? <span style={{ color: SIGNAL }}>{M.mtdLeases.length} leases</span> vs <span style={{ color: SIGNAL }}>{M.mtdFinance.length} finance</span> MTD</li>
              <li>How much cash is stuck in contracts in transit? <span style={{ color: SIGNAL }}>{money0(GL_SNAPSHOT.citOver10)}</span> over 10 days</li>
              <li>Does accrued commission in the portal match QuickBooks payroll / liability? </li>
            </ul>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => closeIntro('funding')}
                style={{
                  background: SIGNAL,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '11px 18px',
                  fontFamily: mono,
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                SHOW ME FUNDING →
              </button>
              <button
                type="button"
                onClick={() => closeIntro()}
                style={{
                  background: 'transparent',
                  color: MUTED,
                  border: `1px solid ${RULE}`,
                  borderRadius: '6px',
                  padding: '11px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Skip intro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bl-shell ${DEMO_PORTAL_ROOT_CLASS}`}>
        <div className="bl-mtabs" role="tablist">
          {NAV.map((n) => (
            <button key={n.id} type="button" role="tab" className={`bl-mtab${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>
              {n.label}
            </button>
          ))}
        </div>

        <aside className="bl-side">
          <div style={{ paddingBottom: '22px' }}>
            <div className="bu-mark" style={{ fontFamily: mono, color: '#fff' }}>
              BUCKLE <span>UP</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#8A939C', letterSpacing: '.14em', marginTop: '10px' }}>{REP}</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.id} type="button" className={`bl-nav${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid #2a3038', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#5c656e', lineHeight: 1.6 }}>
              READ-ONLY SAMPLE
              <br />
              AS OF {fmtD(AS_OF)}
            </div>
            <button
              type="button"
              onClick={() => setIntro(true)}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: `1px solid #3d4650`,
                color: '#aab2bb',
                borderRadius: '5px',
                padding: '6px 10px',
                fontFamily: mono,
                fontSize: '9px',
                cursor: 'pointer',
              }}
            >
              REOPEN INTRO
            </button>
          </div>
        </aside>

        <main className="bl-main">
          <header style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={lbl}>Pinned · {fmtD(AS_OF)}</div>
              <h1 style={{ fontFamily: serif, fontSize: '24px', fontWeight: 600, color: INK, marginTop: '4px' }}>
                {tab === 'funding' && 'Which deals are holding my check?'}
                {tab === 'desk' && 'What is on my desk right now?'}
                {tab === 'gross' && 'Why does the unit board feel better than my gross?'}
                {tab === 'books' && 'Where is the store in QuickBooks?'}
              </h1>
            </div>
            <span className="bu-jk-chip" style={{ fontFamily: mono, fontSize: '10px', color: MUTED, background: WHITE, border: `1px solid ${RULE}`, padding: '6px 12px', borderRadius: '20px' }}>
              Demo portal
            </span>
          </header>

          {tab === 'funding' && (
            <>
              <Takeaway big={money0(M.commissionAtRisk)} accent={RED}>
                Three contracts are into the next funding tier — commission on those deals is already haircut by
              </Takeaway>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { k: 'Open CIT (your deals)', v: M.openCit.length, sub: money0(M.pendingCommission) + ' pending' },
                  { k: 'Open stips', v: M.withStips.length, sub: 'Blocks delivery or funding', color: RED },
                  { k: 'Past 6 business days', v: M.tierRisk.length, sub: 'Tier penalty active', color: AMBER },
                  { k: 'Funded MTD', v: M.mtd.filter((d) => d.stage === 'funded').length, sub: money0(M.commissionMtd) + ' in pocket', color: GREEN },
                ].map((x) => (
                  <div key={x.k} style={{ ...card, flex: '1 1 140px', minWidth: '140px' }}>
                    <div style={lbl}>{x.k}</div>
                    <div style={{ fontFamily: serif, fontSize: '28px', fontWeight: 600, color: x.color || INK, marginTop: '4px', ...tabNums }}>{x.v}</div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 600, color: INK }}>Exceptions first</div>
                  <button
                    type="button"
                    onClick={() => setShowAllCit((s) => !s)}
                    style={{ fontFamily: mono, fontSize: '10px', color: SIGNAL, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showAllCit ? 'Show exceptions only' : `Show all ${M.openCit.length} in CIT`}
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                    <thead>
                      <tr>
                        {['', 'DEAL', 'DAYS', 'TIER', 'STIPS', 'COMM.'].map((h) => (
                          <th key={h || 'x'} style={{ ...th, textAlign: h === 'COMM.' || h === 'DAYS' ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {citVisible.map((d) => {
                        const open = expanded === d.id
                        return (
                          <React.Fragment key={d.id}>
                            <tr
                              style={{ cursor: 'pointer', background: open ? PAPER : undefined }}
                              onClick={() => setExpanded(open ? null : d.id)}
                            >
                              <td style={{ ...td, width: 28 }}>
                                <span className={`bl-chev${open ? ' open' : ''}`}>›</span>
                              </td>
                              <td style={td}>
                                <div style={{ fontWeight: 600 }}>{d.customer}</div>
                                <div style={{ fontSize: '11px', color: MUTED }}>{d.stock}</div>
                              </td>
                              <td style={{ ...td, textAlign: 'right', color: d.fundingDays >= 6 ? RED : INK }}>{d.fundingDays}</td>
                              <td style={{ ...td, textAlign: 'right', color: d.tier < 100 ? AMBER : INK }}>{d.tier}%</td>
                              <td style={{ ...td, color: d.stips.length ? RED : MUTED }}>{d.stips.length ? d.stips.length + ' open' : '—'}</td>
                              <td style={{ ...td, textAlign: 'right', fontFamily: mono }}>{money0(commissionOnDeal(d))}</td>
                            </tr>
                            {open && (
                              <tr>
                                <td colSpan={6} style={{ ...td, background: PAPER, borderBottom: `1px solid ${RULE}` }}>
                                  <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginBottom: '8px' }}>SOLD {fmtD(d.sold)} · {d.type.toUpperCase()} · {d.delivery ? `Delivery ${fmtD(d.delivery)}` : 'Not scheduled'}</div>
                                  {d.stips.length ? (
                                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: SLATE }}>
                                      {d.stips.map((s) => (
                                        <li key={s}>{s}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div style={{ fontSize: '13px', color: MUTED }}>Waiting on lender — no open stips on file. F&amp;I last touched {fmtD(d.sold)}.</div>
                                  )}
                                  <div style={{ marginTop: '10px', fontSize: '12px', color: MUTED }}>
                                    Front {money0(d.front)} · Back {money0(d.back)}
                                    {d.mini ? ' · Mini deal' : ''}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>
                  Store pay plan: 100% commission if funded within 5 business days, 75% by day 10, 50% by day 15, $0 after. F&amp;I runs the jacket — you still lose when the customer was promised a delivery date.
                </p>
              </div>
            </>
          )}

          {tab === 'desk' && (
            <>
              <Takeaway big={`${M.unitsMtd} units`}>
                October MTD you are at
              </Takeaway>
              <div style={{ display: 'grid', gap: '14px' }}>
                {['quote', 'fi', 'cit', 'funded'].map((stage) => {
                  const label = { quote: 'Working', fi: 'In F&I', cit: 'Sold · not funded', funded: 'Funded this month' }[stage]
                  const rows = DEALS.filter((d) => d.stage === stage && (stage === 'funded' ? dt(d.sold) >= dt('2026-10-01') : true))
                  if (stage === 'funded') {
                    const extra = DEALS.filter((d) => d.stage === 'funded' && dt(d.sold) < dt('2026-10-01'))
                    if (!rows.length && !extra.length) return null
                  } else if (!rows.length) return null
                  return (
                    <div key={stage} style={card}>
                      <div style={{ fontFamily: serif, fontSize: '17px', fontWeight: 600, color: INK, marginBottom: '10px' }}>{label}</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                          <thead>
                            <tr>
                              {['Customer', 'Vehicle', 'Type', 'Front', 'Status'].map((h, i) => (
                                <th key={h} style={{ ...th, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(stage === 'funded' ? [...rows, ...DEALS.filter((d) => d.stage === 'funded' && dt(d.sold) < dt('2026-10-01')).slice(0, 2)] : rows).map((d) => (
                              <tr key={d.id}>
                                <td style={{ ...td, fontWeight: 600 }}>{d.customer}</td>
                                <td style={{ ...td, fontSize: '12px', color: MUTED }}>{d.stock.replace(/^STK \d+ · /, '')}</td>
                                <td style={{ ...td, textTransform: 'capitalize' }}>{d.type}</td>
                                <td style={{ ...td, textAlign: 'right', fontFamily: mono, color: d.front < 200 ? AMBER : INK }}>{money0(d.front)}</td>
                                <td style={{ ...td, textAlign: 'right', fontSize: '11px', fontFamily: mono, color: MUTED }}>
                                  {d.stage === 'cit' ? `${d.fundingDays}d in CIT` : d.stage === 'fi' ? 'With F&I' : d.stage === 'quote' ? 'First pencil' : fmtD(d.funded)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p style={{ marginTop: '16px', fontSize: '12px', color: MUTED, maxWidth: '40rem', lineHeight: 1.55 }}>
                CRM shows leads; DMS shows inventory. Neither shows whether F&amp;I has your stips or whether accounting booked the CIT. This view is the handoff timeline — same deal ID from quote to GL.
              </p>
            </>
          )}

          {tab === 'gross' && (
            <>
              <Takeaway big={money0(M.frontMtd)}>
                Front gross MTD is only
              </Takeaway>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Lease front (avg)</div>
                  <div style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: AMBER, ...tabNums }}>{money0(M.leaseFrontAvg)}</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{M.mtdLeases.length} leases MTD · mostly minis</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Finance front (avg)</div>
                  <div style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: INK, ...tabNums }}>{money0(M.finFrontAvg)}</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{M.mtdFinance.length} finance MTD</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Quota pace</div>
                  <div style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: GREEN, ...tabNums }}>14 / 18</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>Units vs 18 goal · gross lags</div>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontFamily: serif, fontSize: '17px', fontWeight: 600, marginBottom: '12px' }}>October deals — front vs commission</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                    <thead>
                      <tr>
                        {['Deal', 'Type', 'Front', 'Back', 'Est. comm.', 'Note'].map((h, i) => (
                          <th key={h} style={{ ...th, textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {M.mtd.map((d) => (
                        <tr key={d.id} style={d.mini && d.front < 200 ? { background: '#FFF9F0' } : undefined}>
                          <td style={td}>{d.customer}</td>
                          <td style={{ ...td, textTransform: 'capitalize' }}>{d.type}</td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: mono }}>{money0(d.front)}</td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: mono }}>{money0(d.back)}</td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: mono, color: d.stage === 'funded' ? GREEN : MUTED }}>
                            {d.stage === 'funded' ? money0(commissionOnDeal(d)) : '—'}
                          </td>
                          <td style={{ ...td, fontSize: '12px', color: MUTED }}>{d.mini ? 'Mini / subvented' : d.stage !== 'funded' ? 'Not funded' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: '12px', color: MUTED, lineHeight: 1.55 }}>
                  On subvented leases the payment moves in $50 chunks while gross disappears in the background. The board counts the unit; your check reflects the mini unless you held gross — these rows show where the month went.
                </p>
              </div>
            </>
          )}

          {tab === 'books' && (
            <>
              <Takeaway big={money0(GL_SNAPSHOT.citBalance)}>
                QuickBooks shows
              </Takeaway>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { k: 'Contracts in transit', v: money0(GL_SNAPSHOT.citBalance), sub: `${money0(GL_SNAPSHOT.citOver10)} aged 10+ days` },
                  { k: 'Floor plan (note)', v: money0(GL_SNAPSHOT.floorPlan), sub: 'Lender statement reconciled' },
                  { k: 'Vehicle gross MTD', v: money0(GL_SNAPSHOT.mtdVehicleGross), sub: 'Desk + F&I recognized' },
                  { k: 'F&I income MTD', v: money0(GL_SNAPSHOT.mtdFiIncome), sub: 'Reserve & products' },
                ].map((x) => (
                  <div key={x.k} style={{ ...card, flex: '1 1 160px' }}>
                    <div style={lbl}>{x.k}</div>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 600, marginTop: '4px', ...tabNums }}>{x.v}</div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                  </div>
                ))}
              </div>
              <DemoBooksPanel
                headFont={serif}
                monoFont={mono}
                ink={INK}
                muted={MUTED}
                green={GREEN}
                border={RULE}
                title="Desk view vs QuickBooks"
                intro="Nightly QBO sync mirrors the GL. The portal does not post deals — it shows whether the cars you sold this month are already funded in the bank account or still sitting in contracts in transit."
                rows={[
                  { label: 'Open CIT (portal deals)', portal: money0(M.openCit.reduce((s, d) => s + d.front + d.back, 0)), qbo: money0(186400) },
                  { label: 'Commission accrued (payroll liab.)', portal: money0(M.commissionMtd + M.pendingCommission), qbo: money0(GL_SNAPSHOT.commissionAccrued) },
                  { label: 'Commission paid MTD', portal: money0(M.commissionMtd), qbo: money0(GL_SNAPSHOT.commissionPaid) },
                  { label: 'Vehicle gross MTD (P&L)', portal: money0(M.frontMtd + M.mtd.reduce((s, d) => s + d.back, 0)), qbo: money0(GL_SNAPSHOT.mtdVehicleGross + GL_SNAPSHOT.mtdFiIncome) },
                ]}
                footnote="Small drift on CIT is normal until the lender funds — large drift means a deal was delivered but never booked or a stip unwind hit the wrong account."
                bullets={[
                  'CIT clears to cash when the lender funds — your commission tier clock starts at sold date, accounting clock at fund date',
                  'Lease cap cost hits inventory / payoff accounts — not the same line as front gross on the board',
                  'One scoped login per store group — multi-rooftop rollups stay in the accountant shell',
                ]}
              />
            </>
          )}

          <div className="bl-next">
            <span style={{ fontFamily: mono, fontSize: '10px', color: FAINT }}>Next question</span>
            <span style={{ fontSize: '14px', color: SLATE, flex: 1 }}>{NEXT[tab].q}</span>
            <button
              type="button"
              onClick={() => setTab(NEXT[tab].id)}
              style={{
                background: SIGNAL,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 14px',
                fontFamily: mono,
                fontSize: '10px',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              GO →
            </button>
          </div>

          <p className="bu-foot" style={{ marginTop: '28px', fontSize: '11px', color: FAINT, maxWidth: '36rem', lineHeight: 1.5 }}>
            Buckle Up is a demo store with synthetic deals. Your CRM, DMS, and lender tools stay in place — this layer reads across them and QuickBooks.
          </p>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  return getDemoEmbedServerProps(query)
}
