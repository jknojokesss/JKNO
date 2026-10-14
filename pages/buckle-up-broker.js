import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DemoBooksPanel from '../components/DemoBooksPanel'
import { DEMO_EMBED_HIDE_LOBBY_CSS, getDemoEmbedServerProps, isDemoEmbedQuery } from '../lib/demoEmbed'
import {
  DEMO_FONT_LINK,
  DEMO_HEAD,
  DEMO_MONO,
  DEMO_PORTAL_ROOT_CLASS,
  DEMO_RENDER_HINTS,
  DEMO_UI,
} from '../lib/demoFonts'

const UI = DEMO_UI
const HEAD = DEMO_HEAD
const MONO = DEMO_MONO

// ─────────────────────────────────────────────────────────────────────────
// Buckle Up Leasing — private broker pitch sample (not on jknojokes gallery).
// Share: /buckle-up-broker?embed=1
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Buckle Up Leasing'
const AS_OF = '2026-10-10'

const SIGNAL = '#2B5EA7'
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
  { id: 'funding', label: 'Getting paid' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'month', label: 'Your month' },
  { id: 'books', label: 'Cash & fees' },
]

const dealTypeLabel = (t) => (t === 'lease' ? 'Lease' : t === 'finance' ? 'Loan' : t)

const STAGE_LABEL = {
  intake: 'New application',
  quoted: 'Quote sent',
  submitted: 'With lender',
  funding: 'Approved — funding',
  paid: 'Funded · fee earned',
}

const WAITING_ON_LABEL = {
  customer: 'Customer',
  lender: 'Lender',
  dealer: 'Dealer',
  team: 'Your team',
}

function invoiceOpenAmount(d) {
  if (!d.openInvoice) return 0
  return d.openInvoice.amount ?? d.brokerFee
}

function payoutNote(d) {
  if (d.dealerFeePending) return 'Funded — dealer has not paid'
  if (d.stage === 'paid') return d.feePaid ? `Paid ${fmtD(d.feePaid)}` : 'Invoiced — not in bank'
  if (d.stage !== 'funding') return 'Fee not earned yet'
  if (d.stips.length) return 'Blocked on paperwork'
  return 'Waiting on lender fund'
}

/**
 * Broker file shape — lender + placing dealer, brokerage fee (not desk gross).
 * @type {Array<{
 *   id: string; customer: string; vehicle: string; lender: string; dealer: string;
 *   type: 'lease'|'finance'; opened: string; submitted: string|null; funded: string|null;
 *   brokerFee: number; feePaid: string|null; fundingDays: number; stips: string[];
 *   owner: string; nextAction: string; waitingOn: 'customer'|'lender'|'dealer'|'team';
 *   dealerFeePending?: boolean;
 *   openInvoice?: { bucket: 'dealer'|'lender_clearing'; amount?: number };
 *   stage: 'intake'|'quoted'|'submitted'|'funding'|'paid'; delivery: string|null;
 * }>}
 */
const FILES = [
  {
    id: 'B-8821',
    customer: 'Weiss family',
    vehicle: '2026 RAV4 LE',
    lender: 'Toyota Financial',
    dealer: 'Metro Toyota · Edison',
    type: 'lease',
    opened: '2026-10-08',
    submitted: '2026-10-09',
    funded: null,
    brokerFee: 650,
    feePaid: null,
    fundingDays: 5,
    stips: ['Insurance binder — wrong lienholder'],
    owner: 'Maya',
    nextAction: 'Re-upload insurance with Toyota Financial as lienholder',
    waitingOn: 'customer',
    openInvoice: { bucket: 'dealer', amount: 225 },
    stage: 'funding',
    delivery: '2026-10-11',
  },
  {
    id: 'B-8810',
    customer: 'David Kramer',
    vehicle: '2025 Camry SE',
    lender: 'Honda Financial',
    dealer: 'Route 1 Honda · Woodbridge',
    type: 'finance',
    opened: '2026-10-06',
    submitted: '2026-10-07',
    funded: null,
    brokerFee: 720,
    feePaid: null,
    fundingDays: 4,
    stips: [],
    owner: 'Maya',
    nextAction: 'Ping Honda funding — file clear since Oct 7',
    waitingOn: 'lender',
    openInvoice: { bucket: 'lender_clearing' },
    stage: 'funding',
    delivery: '2026-10-09',
  },
  {
    id: 'B-8798',
    customer: 'Rachel & Eli Goldberg',
    vehicle: '2026 CR-V EX',
    lender: 'Honda Financial',
    dealer: 'Garden State Honda · Paramus',
    type: 'lease',
    opened: '2026-10-03',
    submitted: '2026-10-04',
    funded: null,
    brokerFee: 580,
    feePaid: null,
    fundingDays: 8,
    stips: ['Co-buyer ID expired', 'Paystub unreadable'],
    owner: 'Jay',
    nextAction: 'Text Goldberg co-buyer for clear ID photo',
    waitingOn: 'customer',
    openInvoice: { bucket: 'dealer' },
    stage: 'funding',
    delivery: null,
  },
  {
    id: 'B-8785',
    customer: 'Michael Rosen',
    vehicle: '2024 Tacoma TRD',
    lender: 'Chase Auto',
    dealer: 'Jersey City Toyota',
    type: 'finance',
    opened: '2026-09-28',
    submitted: '2026-09-29',
    funded: null,
    brokerFee: 890,
    feePaid: null,
    fundingDays: 12,
    stips: ['Lender callback — verify employment'],
    owner: 'Jay',
    nextAction: 'Call Chase funding desk — file 12 days',
    waitingOn: 'lender',
    openInvoice: { bucket: 'lender_clearing', amount: 200 },
    stage: 'funding',
    delivery: null,
  },
  {
    id: 'B-8772',
    customer: 'Sarah Feldman',
    vehicle: '2026 Civic Sport',
    lender: 'Honda Financial',
    dealer: 'Freehold Honda',
    type: 'lease',
    opened: '2026-09-25',
    submitted: '2026-09-26',
    funded: '2026-10-02',
    brokerFee: 520,
    feePaid: null,
    fundingDays: 7,
    stips: [],
    owner: 'Jay',
    nextAction: 'Call Freehold Honda AP — lender funded Oct 2, fee not remitted',
    waitingOn: 'dealer',
    openInvoice: { bucket: 'dealer' },
    stage: 'paid',
    delivery: '2026-09-27',
  },
  {
    id: 'B-8760',
    customer: 'Robert Klein',
    vehicle: '2025 Accord LX',
    lender: 'Honda Financial',
    dealer: 'Bridgewater Honda',
    type: 'lease',
    opened: '2026-09-22',
    submitted: '2026-09-23',
    funded: '2026-09-30',
    brokerFee: 495,
    feePaid: '2026-10-06',
    fundingDays: 8,
    stips: [],
    owner: 'Maya',
    nextAction: '—',
    waitingOn: 'team',
    stage: 'paid',
    delivery: '2026-09-24',
  },
  {
    id: 'B-8755',
    customer: 'Deborah Levy',
    vehicle: '2026 Highlander',
    lender: 'Toyota Financial',
    dealer: 'Metro Toyota · Edison',
    type: 'finance',
    opened: '2026-09-20',
    submitted: '2026-09-21',
    funded: '2026-09-26',
    brokerFee: 810,
    feePaid: '2026-10-03',
    fundingDays: 6,
    stips: [],
    owner: 'Maya',
    nextAction: '—',
    waitingOn: 'team',
    stage: 'paid',
    delivery: '2026-09-22',
  },
  {
    id: 'B-8840',
    customer: 'Josh & Shira Friedman',
    vehicle: '2026 HR-V',
    lender: 'Honda Financial',
    dealer: 'Garden State Honda · Paramus',
    type: 'lease',
    opened: '2026-10-09',
    submitted: '2026-10-10',
    funded: null,
    brokerFee: 540,
    feePaid: null,
    fundingDays: 1,
    stips: [],
    owner: 'Maya',
    nextAction: 'Confirm lender received full app package',
    waitingOn: 'lender',
    stage: 'submitted',
    delivery: null,
  },
  {
    id: 'B-8835',
    customer: 'Aaron Stein',
    vehicle: '2025 Pilot',
    lender: 'Honda Financial',
    dealer: 'Route 1 Honda · Woodbridge',
    type: 'finance',
    opened: '2026-10-07',
    submitted: null,
    funded: null,
    brokerFee: 760,
    feePaid: null,
    fundingDays: 0,
    stips: [],
    owner: 'Jay',
    nextAction: 'Send updated quote — customer comparing Pilot trims',
    waitingOn: 'customer',
    stage: 'quoted',
    delivery: null,
  },
  {
    id: 'B-8830',
    customer: 'New lead',
    vehicle: '2026 Corolla · TBD',
    lender: '—',
    dealer: 'Dealer TBD',
    type: 'lease',
    opened: '2026-10-10',
    submitted: null,
    funded: null,
    brokerFee: 0,
    feePaid: null,
    fundingDays: 0,
    stips: [],
    owner: 'Jay',
    nextAction: 'Call back — web lead, no dealer picked yet',
    waitingOn: 'team',
    stage: 'intake',
    delivery: null,
  },
  {
    id: 'B-8748',
    customer: 'Miriam Cohen',
    vehicle: '2026 Tucson',
    lender: 'Hyundai Capital',
    dealer: 'Central Jersey Hyundai',
    type: 'lease',
    opened: '2026-10-01',
    submitted: '2026-10-02',
    funded: '2026-10-08',
    brokerFee: 610,
    feePaid: '2026-10-10',
    fundingDays: 7,
    stips: [],
    owner: 'Maya',
    nextAction: '—',
    waitingOn: 'team',
    stage: 'paid',
    delivery: '2026-10-04',
  },
  {
    id: 'B-8735',
    customer: 'Jonathan Shapiro',
    vehicle: '2025 Outback',
    lender: 'Subaru Motors Finance',
    dealer: 'Morristown Subaru',
    type: 'finance',
    opened: '2026-09-18',
    submitted: '2026-09-19',
    funded: '2026-09-24',
    brokerFee: 680,
    feePaid: '2026-09-30',
    fundingDays: 6,
    stips: [],
    owner: 'Jay',
    nextAction: '—',
    waitingOn: 'team',
    stage: 'paid',
    delivery: '2026-09-20',
  },
  {
    id: 'B-8788',
    customer: 'Lisa & Mark Horowitz',
    vehicle: '2026 Pilot Touring',
    lender: 'Honda Financial',
    dealer: 'Route 1 Honda · Woodbridge',
    type: 'lease',
    opened: '2026-10-01',
    submitted: '2026-10-02',
    funded: '2026-10-07',
    brokerFee: 595,
    feePaid: null,
    fundingDays: 0,
    stips: [],
    owner: 'Maya',
    nextAction: 'Email Route 1 Honda controller — invoice #4481 past due',
    waitingOn: 'dealer',
    dealerFeePending: true,
    openInvoice: { bucket: 'dealer' },
    stage: 'paid',
    delivery: '2026-10-08',
  },
]

function buildModel(files) {
  const asOf = dt(AS_OF)
  const openFunding = files.filter((d) => d.stage === 'funding')
  const withStips = openFunding.filter((d) => d.stips.length > 0)
  const aging = openFunding.filter((d) => d.fundingDays >= 7)
  const feesAtRisk = aging.reduce((s, d) => s + d.brokerFee, 0)
  const pendingFees = openFunding.reduce((s, d) => s + d.brokerFee, 0)
  const mtd = files.filter((d) => d.stage !== 'intake' && dt(d.opened) >= dt('2026-10-01'))
  const mtdLeases = mtd.filter((d) => d.type === 'lease')
  const mtdFinance = mtd.filter((d) => d.type === 'finance')
  /** Funded in October — by fund date (matches Pipeline “Funded” column), not app open date. */
  const fundedMtd = files.filter((d) => d.stage === 'paid' && d.funded && dt(d.funded) >= dt('2026-10-01'))
  const feesEarnedMtd = fundedMtd.reduce((s, d) => s + d.brokerFee, 0)
  const feesCollectedCash = fundedMtd.filter((d) => d.feePaid).reduce((s, d) => s + d.brokerFee, 0)
  const awaitingDealerFee = files.filter((d) => d.dealerFeePending || (d.openInvoice?.bucket === 'dealer' && !d.feePaid))
  const dealerFeeDue = awaitingDealerFee.reduce((s, d) => s + invoiceOpenAmount(d), 0)
  const arFromDealers = files.filter((d) => d.openInvoice?.bucket === 'dealer').reduce((s, d) => s + invoiceOpenAmount(d), 0)
  const lenderClearing = files.filter((d) => d.openInvoice?.bucket === 'lender_clearing').reduce((s, d) => s + invoiceOpenAmount(d), 0)
  const feesInvoicedPending = arFromDealers + lenderClearing
  const teamPayoutAccrued = Math.round(feesEarnedMtd * 0.55)
  const teamPayoutPaid = Math.round(feesCollectedCash * 0.55)
  const chaseQueue = files
    .filter(
      (d) => d.stage === 'funding' || d.dealerFeePending || (d.openInvoice && !d.feePaid && d.stage === 'paid'),
    )
    .sort((a, b) => {
      const rank = (x) => (x.dealerFeePending ? 0 : x.stage === 'funding' && x.fundingDays >= 7 ? 1 : 2)
      return rank(a) - rank(b)
    })

  return {
    openFunding,
    withStips,
    aging,
    feesAtRisk,
    pendingFees,
    awaitingDealerFee,
    dealerFeeDue,
    mtd,
    mtdLeases,
    mtdFinance,
    fundedMtd,
    feesEarnedMtd,
    feesCollectedCash,
    arFromDealers,
    lenderClearing,
    feesInvoicedPending,
    teamPayoutAccrued,
    teamPayoutPaid,
    chaseQueue,
    asOf,
  }
}

export default function BuckleUpBrokerPortal({ demoEmbed = false }) {
  const router = useRouter()
  const embedded =
    demoEmbed
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))

  const [tab, setTab] = useState('funding')
  const [expanded, setExpanded] = useState(null)
  /** @type {'attention' | 'all' | 'missing' | 'slow' | 'dealer'} */
  const [fundingFilter, setFundingFilter] = useState('attention')
  const [files, setFiles] = useState(() => FILES.map((f) => ({ ...f, activity: f.activity || [] })))
  const [chasedIds, setChasedIds] = useState(() => new Set())
  const [noteDraft, setNoteDraft] = useState({})
  const [intake, setIntake] = useState({ customer: '', vehicle: '', dealer: '', type: 'lease' })

  const M = useMemo(() => buildModel(files), [files])
  const chaseVisible = useMemo(() => M.chaseQueue.filter((d) => !chasedIds.has(d.id)), [M.chaseQueue, chasedIds])

  const patchFile = (id, patch) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const receiveStip = (id, stip) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const stips = f.stips.filter((s) => s !== stip)
        const next = { stips }
        if (stips.length === 0 && f.stage === 'funding' && f.waitingOn === 'customer') {
          next.waitingOn = 'lender'
          next.nextAction = 'Ping lender — paperwork clear on file'
        }
        return { ...f, ...next }
      }),
    )
  }

  const logNote = (id) => {
    const text = (noteDraft[id] || '').trim()
    if (!text) return
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, activity: [...(f.activity || []), { at: new Date().toISOString(), text }] }
          : f,
      ),
    )
    setNoteDraft((d) => ({ ...d, [id]: '' }))
  }

  const addIntakeFile = () => {
    const customer = intake.customer.trim()
    const vehicle = intake.vehicle.trim()
    const dealer = intake.dealer.trim()
    if (!customer || !vehicle) return
    const id = `B-${8850 + files.length}`
    const row = {
      id,
      customer,
      vehicle,
      lender: '—',
      dealer: dealer || 'Dealer TBD',
      type: intake.type,
      opened: AS_OF,
      submitted: null,
      funded: null,
      brokerFee: 0,
      feePaid: null,
      fundingDays: 0,
      stips: [],
      owner: 'You',
      nextAction: 'First call — confirm dealer and pull credit app',
      waitingOn: 'team',
      stage: 'intake',
      delivery: null,
      activity: [{ at: new Date().toISOString(), text: 'Logged from sample intake form' }],
    }
    setFiles((prev) => [row, ...prev])
    setIntake({ customer: '', vehicle: '', dealer: '', type: 'lease' })
    setTab('pipeline')
  }

  useEffect(() => {
    if (!embedded) return
    document.documentElement.classList.add('demo-embed')
    return () => document.documentElement.classList.remove('demo-embed')
  }, [embedded])

  const fundingVisible = useMemo(() => {
    switch (fundingFilter) {
      case 'all':
        return M.openFunding
      case 'missing':
        return M.withStips
      case 'slow':
        return M.aging
      case 'dealer':
        return M.awaitingDealerFee
      default:
        return M.openFunding.filter((d) => d.stips.length > 0 || d.fundingDays >= 7)
    }
  }, [M, fundingFilter])

  const fundingTableTitle = {
    attention: 'Needs attention',
    all: 'Approved — not funded yet',
    missing: 'Lender still needs paperwork',
    slow: 'Stuck 7+ days in funding',
    dealer: 'Funded — dealer has not paid your fee',
  }[fundingFilter]

  const fundingUsesDealerCols = fundingFilter === 'dealer'

  const lbl = {
    fontFamily: MONO,
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: MUTED,
  }
  const card = { background: WHITE, border: `1px solid ${RULE}`, borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 2px rgba(26,26,26,.04)' }
  const th = {
    fontFamily: MONO,
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: MUTED,
    textAlign: 'left',
    padding: '10px 10px',
    borderBottom: `1px solid ${RULE}`,
  }
  const td = {
    fontFamily: UI,
    fontSize: '13px',
    color: INK,
    padding: '11px 10px',
    borderBottom: `1px solid ${PAPER}`,
    verticalAlign: 'top',
    fontVariantNumeric: 'tabular-nums',
  }
  const pageTitle = {
    fontFamily: HEAD,
    fontSize: '1.625rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: INK,
    lineHeight: 1.2,
  }
  const sectionTitle = { fontFamily: HEAD, fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '0.02em', color: INK }
  const kpiValue = { fontFamily: MONO, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }

  return (
    <>
      <Head>
        <title>{BIZ} — Broker desk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Private sample — which files are funded and which brokerage fees are still waiting." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={DEMO_FONT_LINK} rel="stylesheet" />
        {embedded ? <style>{DEMO_EMBED_HIDE_LOBBY_CSS}</style> : null}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ${DEMO_RENDER_HINTS}
          body{background:${PAPER};font-family:${UI};color:${INK};font-size:15px;line-height:1.5}
          html.demo-embed,html.demo-embed body{width:100%;max-width:100%;overflow-x:hidden}
          html.demo-embed .bu-foot{display:none}
          html.demo-embed .bl-side{display:none!important}
          html.demo-embed .bl-mtabs{display:flex!important}
          html.demo-embed .bl-shell{flex-direction:column;width:100%;max-width:100vw;min-height:100vh}
          html.demo-embed .bl-main{padding:16px 12px 40px;width:100%;max-width:100%}
          .bl-shell{display:flex;min-height:100vh;font-family:${UI};width:100%}
          .bl-brand{font-family:${HEAD};font-size:1.35rem;font-weight:600;letter-spacing:0.03em;color:${INK};line-height:1.15}
          .bl-brand-sub{font-family:${UI};font-size:13px;font-weight:500;color:${MUTED};margin-top:6px}
          .bl-side{width:232px;flex-shrink:0;background:${SIDEBAR};border-right:1px solid ${RULE};display:flex;flex-direction:column;padding:24px 16px 20px;position:sticky;top:0;height:100vh}
          .bl-nav{width:100%;text-align:left;padding:10px 12px;border-radius:6px;border:none;background:transparent;color:${MUTED};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:4px;font-family:${UI}}
          .bl-nav:hover{background:${PAPER};color:${INK}}
          .bl-nav.on{background:#EEF3FA;color:${INK};font-weight:600;box-shadow:inset 3px 0 0 ${SIGNAL}}
          .bl-main{flex:1;min-width:0;padding:32px 32px 56px;max-width:1100px}
          .bl-mtabs{display:none;position:sticky;top:0;z-index:20;background:${WHITE};border-bottom:1px solid ${RULE};padding:8px 12px;gap:8px;overflow-x:auto}
          .bl-mtab{flex-shrink:0;border:1px solid ${RULE};border-radius:6px;padding:8px 14px;font-size:12px;font-weight:500;font-family:${UI};cursor:pointer;background:${WHITE};color:${MUTED}}
          .bl-mtab.on{background:#EEF3FA;border-color:${SIGNAL};color:${INK};font-weight:600}
          .bl-chev{transition:transform .15s;display:inline-block;color:${FAINT}}
          .bl-chev.open{transform:rotate(90deg)}
          .bl-demo-hint{font-size:13px;font-weight:500;color:${SLATE};background:#f4f6f9;border:1px solid ${RULE};border-radius:8px;padding:12px 14px;line-height:1.55;margin-bottom:18px}
          .bl-input,.bl-textarea{width:100%;font-family:${UI};font-size:14px;border:1px solid ${RULE};border-radius:6px;padding:8px 10px;color:${INK};background:${WHITE}}
          .bl-input:focus,.bl-textarea:focus{outline:2px solid ${SIGNAL};outline-offset:1px;border-color:${SIGNAL}}
          .bl-btn-sm{font-family:${UI};font-size:12px;font-weight:600;border-radius:6px;padding:6px 12px;cursor:pointer;border:1px solid ${RULE};background:${WHITE};color:${INK}}
          .bl-btn-sm--primary{background:${SIGNAL};border-color:${SIGNAL};color:${WHITE}}
          .bl-stip{display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px;color:${SLATE}}
          .bl-stip input{margin-top:3px;accent-color:${SIGNAL}}
          .bl-activity{margin:10px 0 0;padding:0;list-style:none;font-size:12px;color:${MUTED}}
          .bl-activity li{padding:6px 0;border-top:1px solid ${RULE}}
          @media(max-width:820px){
            .bl-side{display:none}
            .bl-mtabs{display:flex}
            .bl-main{padding:20px 16px 48px}
          }
        `}</style>
      </Head>

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
            <div className="bl-brand">{BIZ}</div>
            <div className="bl-brand-sub">Lease &amp; finance broker</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.id} type="button" className={`bl-nav${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div
            style={{
              borderTop: `1px solid ${RULE}`,
              paddingTop: '16px',
              marginTop: '8px',
              fontSize: '12px',
              color: MUTED,
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, color: INK, fontSize: '13px', marginBottom: '8px' }}>Where does the data come from?</div>
            <p style={{ margin: '0 0 10px' }}>
              <strong style={{ color: SLATE }}>Live brokerage:</strong> Applications and stages from your broker CRM (LeasingStack, RouteOne inbox, etc.). Lender conditions from
              lender portals or your funding desk. Fees owed, paid, and still in the pipeline — tied to bank deposits when you wire that up. Read-only — no second place to type deals.
            </p>
            <p style={{ margin: 0, color: FAINT }}>
              <strong style={{ color: MUTED }}>This sample:</strong> Fictional starting data. Mark stips, edit next steps, log notes, add an intake — saved in this browser until you refresh.
            </p>
            <div style={{ marginTop: '12px', color: FAINT }}>As of {fmtD(AS_OF)}</div>
          </div>
        </aside>

        <main className="bl-main">
          <header style={{ marginBottom: '24px' }}>
            <h1 style={pageTitle}>
              {tab === 'funding' && 'When is your brokerage fee collected?'}
              {tab === 'pipeline' && 'Every file, one queue'}
              {tab === 'month' && 'Deals closed vs fees in the bank'}
              {tab === 'books' && 'Cash and fees — one roll-up'}
            </h1>
            {tab === 'funding' && (
              <p style={{ marginTop: '8px', fontSize: '15px', color: MUTED, maxWidth: '42rem', lineHeight: 1.5 }}>
                Credit can be approved while funding still waits on IDs, insurance, or the dealer invoice. Right now{' '}
                <span style={{ color: SIGNAL, fontWeight: 700 }}>{money0(M.pendingFees)}</span> in brokerage fees hang on{' '}
                {M.openFunding.length} open files
                {M.feesAtRisk > 0 ? (
                  <>
                    {' '}
                    — <span style={{ color: AMBER, fontWeight: 600 }}>{money0(M.feesAtRisk)}</span> on deals stuck a week or more.
                  </>
                ) : (
                  '.'
                )}
              </p>
            )}
            {tab === 'month' && (
              <p style={{ marginTop: '8px', fontSize: '15px', color: MUTED, maxWidth: '42rem', lineHeight: 1.5 }}>
                You earn on <strong style={{ color: INK, fontWeight: 600 }}>funded</strong> deals when the brokerage fee is collected — not when the customer says yes to the payment.
              </p>
            )}
          </header>

          {tab === 'funding' && (
            <>
              <div className="bl-demo-hint">
                <strong style={{ color: INK }}>Try the desk:</strong> expand a file, check off paperwork as it arrives, change the next step, log a call note. Counts update in this session. A live build pulls from your CRM and lenders — however you track fees today (spreadsheet, accountant, or nothing formal yet).
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: MUTED, maxWidth: '42rem' }}>
                Tap a number to filter the list.
              </p>
              <div style={{ ...card, marginBottom: '20px', borderLeft: `4px solid ${SIGNAL}` }}>
                <div style={{ ...sectionTitle, marginBottom: '10px' }}>Chase list — owner view</div>
                <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 12px', lineHeight: 1.5 }}>
                  Who owns the file, who you are waiting on, and the next step. Pulled from the same feed as Pipeline — not a second spreadsheet.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                    <thead>
                      <tr>
                        {['Customer', 'Owner', 'Waiting on', 'Next step', 'Fee', ''].map((h, i) => (
                          <th key={h || 'act'} style={{ ...th, textAlign: i >= 4 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chaseVisible.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ ...td, color: MUTED, textAlign: 'center', padding: '16px' }}>
                            Nothing left on today&apos;s chase list — expand files below or reset by refreshing.
                          </td>
                        </tr>
                      )}
                      {chaseVisible.map((d) => (
                        <tr key={d.id}>
                          <td style={{ ...td, fontWeight: 600 }}>
                            {d.customer}
                            <div style={{ fontSize: '11px', color: MUTED, fontWeight: 500 }}>{d.id}</div>
                          </td>
                          <td style={{ ...td, fontWeight: 600 }}>{d.owner}</td>
                          <td style={{ ...td, fontSize: '13px', color: d.waitingOn === 'dealer' ? RED : INK }}>
                            {WAITING_ON_LABEL[d.waitingOn] || '—'}
                          </td>
                          <td style={{ ...td, fontSize: '13px', color: SLATE, maxWidth: '280px' }}>{d.nextAction}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money0(d.brokerFee)}</td>
                          <td style={{ ...td, textAlign: 'right', width: 120 }}>
                            <button
                              type="button"
                              className="bl-btn-sm"
                              onClick={() => setChasedIds((s) => new Set(s).add(d.id))}
                            >
                              Chased today
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { id: 'all', k: 'In funding', v: M.openFunding.length, sub: money0(M.pendingFees) + ' fee pending' },
                  { id: 'missing', k: 'Paperwork open', v: M.withStips.length, sub: 'Stips blocking fund', color: RED },
                  { id: 'slow', k: 'Stuck 7+ days', v: M.aging.length, sub: 'Chase or escalate', color: AMBER },
                  {
                    id: 'dealer',
                    k: 'Dealer owes fee',
                    v: M.awaitingDealerFee.length,
                    sub: money0(M.dealerFeeDue) + ' invoiced',
                    color: RED,
                  },
                  {
                    id: 'paid',
                    k: 'Funded this month',
                    v: M.fundedMtd.length,
                    sub: money0(M.feesEarnedMtd) + ' fees on funded deals',
                    color: GREEN,
                  },
                ].map((x) => {
                  const active = x.id === 'paid' ? false : fundingFilter === x.id
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => {
                        if (x.id === 'paid') {
                          setTab('pipeline')
                          return
                        }
                        setFundingFilter(x.id)
                        setExpanded(null)
                      }}
                      style={{
                        ...card,
                        flex: '1 1 140px',
                        minWidth: '140px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: active ? `2px solid ${SIGNAL}` : `1px solid ${RULE}`,
                        background: active ? '#F4F8FD' : WHITE,
                        fontFamily: UI,
                      }}
                    >
                      <div style={lbl}>{x.k}</div>
                      <div style={{ ...kpiValue, fontSize: '1.65rem', color: x.color || INK, marginTop: '4px' }}>{x.v}</div>
                      <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                      {x.id !== 'paid' && (
                        <div style={{ fontSize: '11px', color: active ? SIGNAL : FAINT, marginTop: '8px', fontWeight: 600 }}>
                          {active ? 'Showing below' : 'Click to filter'}
                        </div>
                      )}
                      {x.id === 'paid' && (
                        <div style={{ fontSize: '11px', color: FAINT, marginTop: '8px', fontWeight: 600 }}>Click → Pipeline</div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={sectionTitle}>{fundingTableTitle}</div>
                  {fundingFilter !== 'attention' && (
                    <button
                      type="button"
                      onClick={() => setFundingFilter('attention')}
                      style={{ fontSize: '13px', fontWeight: 600, color: SIGNAL, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Back to needs attention
                    </button>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: fundingUsesDealerCols ? '520px' : '640px' }}>
                    <thead>
                      <tr>
                        {(fundingUsesDealerCols
                          ? ['', 'Customer', 'Owner', 'Waiting on', 'Next step', 'Your fee']
                          : ['', 'Customer', 'Owner', 'Waiting on', 'Next step', 'Your fee']
                        ).map((h) => (
                          <th
                            key={h || 'x'}
                            style={{
                              ...th,
                              textAlign: h === 'Your fee' ? 'right' : 'left',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fundingVisible.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ ...td, color: MUTED, textAlign: 'center', padding: '24px' }}>
                            No files in this filter.
                          </td>
                        </tr>
                      )}
                      {fundingVisible.map((d) => {
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
                                <div style={{ fontSize: '11px', color: MUTED }}>{d.vehicle}</div>
                              </td>
                              <td style={{ ...td, fontSize: '13px', fontWeight: 600 }}>{d.owner || '—'}</td>
                              <td style={{ ...td, fontSize: '13px', fontWeight: 600, color: d.waitingOn === 'dealer' ? RED : d.waitingOn === 'lender' ? AMBER : INK }}>
                                {d.waitingOn ? WAITING_ON_LABEL[d.waitingOn] : '—'}
                              </td>
                              <td style={{ ...td, fontSize: '13px', color: SLATE, maxWidth: '240px' }}>{d.nextAction || '—'}</td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money0(d.brokerFee)}</td>
                            </tr>
                            {open && (
                              <tr>
                                <td colSpan={7} style={{ ...td, background: PAPER, borderBottom: `1px solid ${RULE}` }} onClick={(e) => e.stopPropagation()}>
                                  <div style={{ fontSize: '12px', color: MUTED, marginBottom: '8px' }}>
                                    {fundingUsesDealerCols ? (
                                      <>
                                        Lender funded {d.funded ? fmtD(d.funded) : '—'} · {d.dealer} · Fee invoiced, not in bank yet
                                      </>
                                    ) : (
                                      <>
                                        Opened {fmtD(d.opened)} · Submitted {d.submitted ? fmtD(d.submitted) : '—'} · {dealTypeLabel(d.type)} ·{' '}
                                        {d.lender} · {d.dealer}
                                        {d.delivery ? ` · Delivery ${fmtD(d.delivery)}` : ''}
                                      </>
                                    )}
                                  </div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>
                                    Next step
                                  </label>
                                  <input
                                    className="bl-input"
                                    type="text"
                                    value={d.nextAction || ''}
                                    onChange={(e) => patchFile(d.id, { nextAction: e.target.value })}
                                    style={{ marginBottom: '12px', maxWidth: '520px' }}
                                  />
                                  {!fundingUsesDealerCols && d.stips.length ? (
                                    <div style={{ marginBottom: '10px' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '6px' }}>Paperwork — mark received</div>
                                      {d.stips.map((s) => (
                                        <label key={s} className="bl-stip">
                                          <input type="checkbox" onChange={() => receiveStip(d.id, s)} />
                                          <span>{s}</span>
                                        </label>
                                      ))}
                                    </div>
                                  ) : null}
                                  {!fundingUsesDealerCols && !d.stips.length ? (
                                    <div style={{ fontSize: '13px', color: MUTED, marginBottom: '10px' }}>No open stips on file — waiting on lender fund.</div>
                                  ) : null}
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', maxWidth: '520px' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>
                                        Log note (call, text, email)
                                      </label>
                                      <input
                                        className="bl-input"
                                        type="text"
                                        placeholder="Left VM with customer…"
                                        value={noteDraft[d.id] || ''}
                                        onChange={(e) => setNoteDraft((n) => ({ ...n, [d.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') logNote(d.id)
                                        }}
                                      />
                                    </div>
                                    <button type="button" className="bl-btn-sm bl-btn-sm--primary" onClick={() => logNote(d.id)}>
                                      Add note
                                    </button>
                                  </div>
                                  {(d.activity || []).length > 0 && (
                                    <ul className="bl-activity">
                                      {[...(d.activity || [])].reverse().map((a, i) => (
                                        <li key={i}>{a.text}</li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
                  Approval is not the same as funding. Most delay is missing IDs, insurance, or dealer paperwork — not credit.
                </p>
              </div>
            </>
          )}

          {tab === 'pipeline' && (
            <>
              <div style={{ ...card, marginBottom: '18px' }}>
                <div style={{ ...sectionTitle, marginBottom: '8px' }}>Log a new application</div>
                <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 12px', lineHeight: 1.5 }}>
                  Sample only — adds a row to Intake below. Production pulls from your CRM or application form.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', maxWidth: '720px' }}>
                  <input
                    className="bl-input"
                    placeholder="Customer name"
                    value={intake.customer}
                    onChange={(e) => setIntake({ ...intake, customer: e.target.value })}
                  />
                  <input
                    className="bl-input"
                    placeholder="Vehicle"
                    value={intake.vehicle}
                    onChange={(e) => setIntake({ ...intake, vehicle: e.target.value })}
                  />
                  <input
                    className="bl-input"
                    placeholder="Placing dealer"
                    value={intake.dealer}
                    onChange={(e) => setIntake({ ...intake, dealer: e.target.value })}
                  />
                  <select
                    className="bl-input"
                    value={intake.type}
                    onChange={(e) => setIntake({ ...intake, type: e.target.value })}
                  >
                    <option value="lease">Lease</option>
                    <option value="finance">Loan</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="bl-btn-sm bl-btn-sm--primary"
                  style={{ marginTop: '12px' }}
                  disabled={!intake.customer.trim() || !intake.vehicle.trim()}
                  onClick={addIntakeFile}
                >
                  Add to intake
                </button>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '15px', color: MUTED }}>{M.mtd.length} active files this month — intake through funded.</p>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: FAINT }}>Stages mirror your application queue — not a separate spreadsheet.</p>
              <div style={{ display: 'grid', gap: '14px' }}>
                {['intake', 'quoted', 'submitted', 'funding', 'paid'].map((stage) => {
                  const label = STAGE_LABEL[stage]
                  const rows =
                    stage === 'paid'
                      ? files.filter((d) => d.stage === 'paid' && d.funded && dt(d.funded) >= dt('2026-10-01'))
                      : files.filter((d) => d.stage === stage)
                  if (!rows.length && stage !== 'paid') return null
                  if (stage === 'paid' && !rows.length) return null
                  return (
                    <div key={stage} style={card}>
                      <div style={{ ...sectionTitle, marginBottom: '10px' }}>{label}</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                          <thead>
                            <tr>
                              {['Customer', 'Vehicle', 'Lender / dealer', 'Type', 'Fee', 'Status'].map((h, i) => (
                                <th key={h} style={{ ...th, textAlign: i >= 4 ? 'right' : 'left' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((d) => (
                              <tr key={d.id}>
                                <td style={{ ...td, fontWeight: 600 }}>{d.customer}</td>
                                <td style={{ ...td, fontSize: '12px', color: MUTED }}>{d.vehicle}</td>
                                <td style={{ ...td, fontSize: '12px', color: MUTED }}>
                                  <div>{d.lender}</div>
                                  <div>{d.dealer}</div>
                                </td>
                                <td style={td}>{dealTypeLabel(d.type)}</td>
                                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{d.brokerFee ? money0(d.brokerFee) : '—'}</td>
                                <td style={{ ...td, textAlign: 'right', fontSize: '13px', color: MUTED }}>
                                  {d.stage === 'funding'
                                    ? `${d.fundingDays}d in funding`
                                    : d.stage === 'paid'
                                      ? `Funded ${fmtD(d.funded)}`
                                      : d.stage === 'submitted'
                                        ? 'With lender'
                                        : d.stage === 'quoted'
                                          ? 'Quote out'
                                          : 'Intake'}
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
              <p style={{ marginTop: '16px', fontSize: '13px', color: MUTED, maxWidth: '42rem', lineHeight: 1.55 }}>
                One queue for the whole team — who owns the file, what the lender still needs, and whether the fee is earned yet.
              </p>
            </>
          )}

          {tab === 'month' && (
            <>
              <p style={{ margin: '0 0 8px', fontSize: '15px', color: MUTED }}>
                Funded in October: <strong style={{ color: INK }}>{M.fundedMtd.length}</strong> files ·{' '}
                <strong style={{ color: INK }}>{money0(M.feesEarnedMtd)}</strong> in brokerage fees on those deals.
              </p>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: FAINT }}>Same file feed as Pipeline — rolled up for the owner view.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Leases</div>
                  <div style={{ ...kpiValue, fontSize: '1.65rem', color: SIGNAL }}>{M.mtdLeases.length}</div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>Quotes &amp; apps this month</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Loans</div>
                  <div style={{ ...kpiValue, fontSize: '1.65rem', color: INK }}>{M.mtdFinance.length}</div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>Quotes &amp; apps this month</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: '200px' }}>
                  <div style={lbl}>Avg fee · funded</div>
                  <div style={{ ...kpiValue, fontSize: '1.65rem', color: GREEN }}>
                    {M.fundedMtd.length ? money0(M.feesEarnedMtd / M.fundedMtd.length) : '—'}
                  </div>
                  <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>October funded only</div>
                </div>
              </div>
              <div style={card}>
                <div style={{ ...sectionTitle, marginBottom: '4px' }}>October files</div>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '12px', lineHeight: 1.45 }}>
                  Brokerage fee is your revenue line — separate from the customer&apos;s payment and the dealer&apos;s invoice.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                    <thead>
                      <tr>
                        {['Customer', 'Lease or loan', 'Placed at', 'Your fee', 'Payout'].map((h, i) => (
                          <th key={h} style={{ ...th, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {M.mtd.map((d) => (
                        <tr key={d.id}>
                          <td style={td}>{d.customer}</td>
                          <td style={td}>{dealTypeLabel(d.type)}</td>
                          <td style={{ ...td, fontSize: '12px', color: MUTED }}>{d.dealer}</td>
                          <td style={{ ...td, textAlign: 'right' }}>{d.brokerFee ? money0(d.brokerFee) : '—'}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: d.feePaid ? GREEN : MUTED, fontSize: '13px' }}>
                            {payoutNote(d)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'books' && (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '15px', color: MUTED, maxWidth: '46rem', lineHeight: 1.55 }}>
                Fees you billed but have not been paid yet: <strong style={{ color: INK }}>{money0(M.feesInvoicedPending)}</strong>
                {' '}
                — <strong style={{ color: INK }}>{money0(M.arFromDealers)}</strong> dealers still owe you +{' '}
                <strong style={{ color: INK }}>{money0(M.lenderClearing)}</strong> approved by lender, not funded to your account yet.
              </p>
              <div style={{ ...card, marginBottom: '20px', fontSize: '13px', color: SLATE, lineHeight: 1.55 }}>
                <strong style={{ color: INK }}>Why the dealer piece is not the whole {money0(M.feesInvoicedPending)}:</strong> Some of it is dealers who have not sent your placement fee yet. Some is lender-approved deals where the fund has not hit yet (Kramer, Rosen). Weiss is only a partial bill so far ({money0(225)} of {money0(650)}).
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { k: 'Fees earned (funded)', v: money0(M.feesEarnedMtd), sub: 'October funded deals' },
                  { k: 'In your account (MTD)', v: money0(M.feesCollectedCash), sub: 'Deposits you marked paid' },
                  { k: 'Owed by dealers', v: money0(M.arFromDealers), sub: 'Billed, not paid yet' },
                  { k: 'Team payouts', v: money0(M.teamPayoutPaid), sub: `${money0(M.teamPayoutAccrued)} accrued` },
                ].map((x) => (
                  <div key={x.k} style={{ ...card, flex: '1 1 160px' }}>
                    <div style={lbl}>{x.k}</div>
                    <div style={{ ...kpiValue, fontSize: '1.35rem', marginTop: '4px' }}>{x.v}</div>
                    <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{x.sub}</div>
                  </div>
                ))}
              </div>
              <DemoBooksPanel
                headFont={HEAD}
                monoFont={MONO}
                ink={INK}
                muted={MUTED}
                green={GREEN}
                border={RULE}
                title="Pipeline vs your totals"
                statementColumnLabel="What you track"
                intro="Same files as Pipeline, rolled up. This screen does not move money — it shows earned fees, what is still owed, and whether your bank deposits match the funded deals."
                rows={[
                  {
                    label: 'Billed, not paid yet',
                    portal: money0(M.feesInvoicedPending),
                    qbo: money0(M.feesInvoicedPending),
                    inSync: true,
                  },
                  {
                    label: 'Owed by dealers',
                    portal: money0(M.arFromDealers),
                    qbo: money0(M.arFromDealers),
                    inSync: true,
                  },
                  {
                    label: 'Approved, not funded yet',
                    portal: money0(M.lenderClearing),
                    qbo: money0(M.lenderClearing),
                    inSync: true,
                  },
                  { label: 'Fees earned (funded) MTD', portal: money0(M.feesEarnedMtd), qbo: money0(M.feesEarnedMtd), inSync: true },
                  {
                    label: 'In your account (MTD)',
                    portal: money0(M.feesCollectedCash),
                    qbo: money0(M.feesCollectedCash),
                    inSync: true,
                  },
                  {
                    label: 'Team share accrued',
                    portal: money0(M.teamPayoutAccrued),
                    qbo: money0(M.teamPayoutAccrued),
                    inSync: true,
                  },
                ]}
                footnote="Review means the roll-up and what you track disagree — worth a look before you pay team or file taxes. Production flags these instead of showing a green check when numbers differ."
                bullets={[
                  'Customers can pick up the car while your fee still waits on lender fund + dealer remittance',
                  'This layer sits on top of your CRM — it does not replace LeasingStack or your application form',
                ]}
              />
            </>
          )}

          <p className="bu-foot" style={{ marginTop: '32px', fontSize: '12px', color: FAINT, maxWidth: '36rem', lineHeight: 1.5 }}>
            Private sample built for outreach. Fictional deals; a live build connects to your CRM, lenders, and however you track fees and payouts today. Not listed on the public JK No Jokes demo gallery.
          </p>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  return getDemoEmbedServerProps(query)
}
