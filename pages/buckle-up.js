import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DemoLobby from '../components/DemoLobby'
import DemoBooksPanel from '../components/DemoBooksPanel'
import { DEMO_EMBED_HIDE_LOBBY_CSS, getDemoEmbedServerProps, isDemoEmbedQuery } from '../lib/demoEmbed'
import { DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS } from '../lib/demoFonts'

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
const sans = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

// ─────────────────────────────────────────────────────────────────────────
// Buckle Up — fictitious retail store. Lease-heavy sales floor sample:
// funding tiers, open stips, thin lease gross, CIT in QuickBooks.
// Share clean: /buckle-up?embed=1
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Buckle Up'
const AS_OF = '2026-10-10'

// Fictitious store — warm neutral desk UI (not a copy of any one dealer site)
const SIGNAL = '#C4923A'
const INK = '#1A1A1A'
const SLATE = '#3D3D3D'
const MUTED = '#6B6B6B'
const FAINT = '#9A9A9A'
const PAPER = '#F7F5F0'
const WHITE = '#FFFFFF'
const RULE = '#E6E2DA'
const RED = '#C44A32'
const AMBER = '#B07A12'
const GREEN = '#2D6A4A'
const SIDEBAR = '#FFFFFF'

const dt = (s) => new Date(s + 'T12:00:00')
const fmtD = (s) => (s ? dt(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')
const money0 = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')

const NAV = [
  { id: 'funding', label: 'Funding' },
  { id: 'desk', label: 'My desk' },
  { id: 'gross', label: 'Gross & units' },
  { id: 'books', label: 'QuickBooks' },
]

/** @type {import('react').CSSProperties} */
const tabNums = { fontVariantNumeric: 'tabular-nums' }

const DEALS = [
  {
    id: 'D-44102',
    customer: 'Weiss family',
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
    customer: 'David Kramer',
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
    customer: 'Rachel & Eli Goldberg',
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
    customer: 'Michael Rosen',
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
    customer: 'Sarah Feldman',
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
    customer: 'Deborah Levy',
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
    customer: 'Josh & Shira Friedman',
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
    customer: 'Aaron Stein',
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
    customer: 'Walk-in',
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
    customer: 'Miriam Cohen',
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
    customer: 'Jonathan Shapiro',
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
  const [expanded, setExpanded] = useState(null)
  const [showAllCit, setShowAllCit] = useState(false)

  const M = useMemo(() => buildModel(), [])

  useEffect(() => {
    if (!embedded) return
    document.documentElement.classList.add('demo-embed')
    return () => document.documentElement.classList.remove('demo-embed')
  }, [embedded])

  const citVisible = showAllCit ? M.openCit : M.openCit.filter((d) => d.stips.length > 0 || d.fundingDays >= 6)

  const lbl = { fontFamily: sans, fontSize: '12px', fontWeight: 600, color: MUTED }
  const card = { background: WHITE, border: `1px solid ${RULE}`, borderRadius: '10px', padding: '18px 20px', boxShadow: '0 1px 2px rgba(26,26,26,.04)' }
  const th = { fontFamily: sans, fontSize: '11px', fontWeight: 600, color: MUTED, textAlign: 'left', padding: '10px 10px', borderBottom: `1px solid ${RULE}` }
  const td = { fontSize: '14px', color: INK, padding: '11px 10px', borderBottom: `1px solid ${PAPER}`, verticalAlign: 'top', ...tabNums }

  return (
    <>
      <Head>
        <title>{BIZ} — Sales desk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Buckle Up sales desk — funding, stips, lease gross, and QuickBooks in one read-only view." />
        <meta property="og:title" content="Buckle Up — Sales desk" />
        <meta property="og:description" content="Which deals are holding your check? Funding tiers, open stips, and books." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={FONT_LINK} rel="stylesheet" />
        {embedded ? <style>{DEMO_EMBED_HIDE_LOBBY_CSS}</style> : null}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ${DEMO_RENDER_HINTS.replace(/font-family:[^;]+;/, `font-family:${sans};`)}
          body{background:${PAPER};font-family:${sans};color:${INK}}
          html.demo-embed .bu-foot{display:none}
          .bl-shell{display:flex;min-height:calc(100vh - ${embedded ? 0 : 72}px);font-family:${sans}}
          .bl-side{width:232px;flex-shrink:0;background:${SIDEBAR};border-right:1px solid ${RULE};display:flex;flex-direction:column;padding:24px 16px 20px;position:sticky;top:${embedded ? 0 : 72}px;height:calc(100vh - ${embedded ? 0 : 72}px)}
          .bl-nav{width:100%;text-align:left;padding:10px 12px;border-radius:8px;border:none;background:transparent;color:${MUTED};font-size:14px;font-weight:500;cursor:pointer;margin-bottom:4px;font-family:${sans}}
          .bl-nav:hover{background:${PAPER};color:${INK}}
          .bl-nav.on{background:#F5F0E6;color:${INK};font-weight:600;box-shadow:inset 3px 0 0 ${SIGNAL}}
          .bl-main{flex:1;min-width:0;padding:32px 32px 56px;max-width:1100px}
          .bl-mtabs{display:none;position:sticky;top:${embedded ? 0 : 72}px;z-index:20;background:${WHITE};border-bottom:1px solid ${RULE};padding:8px 12px;gap:8px;overflow-x:auto}
          .bl-mtab{flex-shrink:0;border:1px solid ${RULE};border-radius:999px;padding:8px 16px;font-size:13px;font-weight:500;font-family:${sans};cursor:pointer;background:${WHITE};color:${MUTED}}
          .bl-mtab.on{background:#F5F0E6;border-color:${SIGNAL};color:${INK};font-weight:600}
          .bl-chev{transition:transform .15s;display:inline-block;color:${FAINT}}
          .bl-chev.open{transform:rotate(90deg)}
          @media(max-width:820px){
            .bl-side{display:none}
            .bl-mtabs{display:flex}
            .bl-main{padding:20px 16px 48px}
          }
        `}</style>
      </Head>

      {!embedded && <DemoLobby />}

      <div className={`bl-shell ${DEMO_PORTAL_ROOT_CLASS}`}>
        <div className="bl-mtabs" role="tablist">
          {NAV.map((n) => (
            <button key={n.id} type="button" role="tab" className={`bl-mtab${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>
              {n.label}
            </button>
          ))}
        </div>

        <aside className="bl-side">
          <div style={{ paddingBottom: '20px' }}>
            <div style={{ fontSize: '21px', fontWeight: 700, letterSpacing: '-0.02em', color: INK }}>{BIZ}</div>
            <div style={{ fontSize: '13px', color: MUTED, marginTop: '6px' }}>Sales desk</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.id} type="button" className={`bl-nav${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '14px', fontSize: '12px', color: FAINT, lineHeight: 1.5 }}>
            As of {fmtD(AS_OF)}
          </div>
        </aside>

        <main className="bl-main">
          <header style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: INK, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {tab === 'funding' && 'Deals holding your check'}
              {tab === 'desk' && 'Your desk'}
              {tab === 'gross' && 'Units vs gross'}
              {tab === 'books' && 'QuickBooks'}
            </h1>
            {tab === 'funding' && (
              <p style={{ marginTop: '8px', fontSize: '15px', color: MUTED, maxWidth: '36rem' }}>
                <span style={{ color: SIGNAL, fontWeight: 700 }}>{money0(M.commissionAtRisk)}</span> commission haircut on deals past the funding tier.
              </p>
            )}
          </header>

          {tab === 'funding' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { k: 'Open CIT (your deals)', v: M.openCit.length, sub: money0(M.pendingCommission) + ' pending' },
                  { k: 'Open stips', v: M.withStips.length, sub: 'Blocks delivery or funding', color: RED },
                  { k: 'Past 6 business days', v: M.tierRisk.length, sub: 'Tier penalty active', color: AMBER },
                  { k: 'Funded MTD', v: M.mtd.filter((d) => d.stage === 'funded').length, sub: money0(M.commissionMtd) + ' in pocket', color: GREEN },
                ].map((x) => (
                  <div key={x.k} style={{ ...card, flex: '1 1 140px', minWidth: '140px' }}>
                    <div style={lbl}>{x.k}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: x.color || INK, marginTop: '4px', ...tabNums }}>{x.v}</div>
                    <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: INK }}>Needs attention</div>
                  <button
                    type="button"
                    onClick={() => setShowAllCit((s) => !s)}
                    style={{ fontSize: '13px', fontWeight: 600, color: SIGNAL, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
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
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money0(commissionOnDeal(d))}</td>
                            </tr>
                            {open && (
                              <tr>
                                <td colSpan={6} style={{ ...td, background: PAPER, borderBottom: `1px solid ${RULE}` }}>
                                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '8px' }}>Sold {fmtD(d.sold)} · {d.type} · {d.delivery ? `Delivery ${fmtD(d.delivery)}` : 'Not scheduled'}</div>
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
              <p style={{ margin: '0 0 16px', fontSize: '15px', color: MUTED }}>{M.unitsMtd} units sold MTD — quote through funded.</p>
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
                      <div style={{ fontSize: '16px', fontWeight: 700, color: INK, marginBottom: '10px' }}>{label}</div>
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
                                <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: d.front < 200 ? AMBER : INK }}>{money0(d.front)}</td>
                                <td style={{ ...td, textAlign: 'right', fontSize: '13px', color: MUTED }}>
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
              <p style={{ margin: '0 0 16px', fontSize: '15px', color: MUTED }}>
                Front gross MTD <strong style={{ color: INK }}>{money0(M.frontMtd)}</strong> — lease-heavy month.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Lease front (avg)</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: SIGNAL, ...tabNums }}>{money0(M.leaseFrontAvg)}</div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{M.mtdLeases.length} leases · mostly minis</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Finance front (avg)</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: INK, ...tabNums }}>{money0(M.finFrontAvg)}</div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{M.mtdFinance.length} finance deals</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Quota pace</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: GREEN, ...tabNums }}>14 / 18</div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>Units on track · gross behind</div>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>October — front vs commission</div>
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
                          <td style={{ ...td, textAlign: 'right' }}>{money0(d.front)}</td>
                          <td style={{ ...td, textAlign: 'right' }}>{money0(d.back)}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: d.stage === 'funded' ? GREEN : MUTED }}>
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
              <p style={{ margin: '0 0 16px', fontSize: '15px', color: MUTED }}>
                Contracts in transit in QuickBooks: <strong style={{ color: INK }}>{money0(GL_SNAPSHOT.citBalance)}</strong>
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { k: 'Contracts in transit', v: money0(GL_SNAPSHOT.citBalance), sub: `${money0(GL_SNAPSHOT.citOver10)} aged 10+ days` },
                  { k: 'Floor plan (note)', v: money0(GL_SNAPSHOT.floorPlan), sub: 'Lender statement reconciled' },
                  { k: 'Vehicle gross MTD', v: money0(GL_SNAPSHOT.mtdVehicleGross), sub: 'Desk + F&I recognized' },
                  { k: 'F&I income MTD', v: money0(GL_SNAPSHOT.mtdFiIncome), sub: 'Reserve & products' },
                ].map((x) => (
                  <div key={x.k} style={{ ...card, flex: '1 1 160px' }}>
                    <div style={lbl}>{x.k}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', ...tabNums }}>{x.v}</div>
                    <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                  </div>
                ))}
              </div>
              <DemoBooksPanel
                headFont={sans}
                monoFont={sans}
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

          <p className="bu-foot" style={{ marginTop: '32px', fontSize: '12px', color: FAINT, maxWidth: '36rem', lineHeight: 1.5 }}>
            Sample data for demonstration. Reads across DMS, F&amp;I, and QuickBooks — nothing posts from here.
          </p>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  return getDemoEmbedServerProps(query)
}
