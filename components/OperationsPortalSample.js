import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DemoLobby from './DemoLobby'
import { BOOKING_URL } from '../lib/marketing'
import { isDemoEmbedQuery } from '../lib/demoEmbed'
import { DEMO_PORTAL_ROOT_CLASS } from '../lib/demoFonts'
import OpsCenterDesk from './ops-center/OpsCenterDesk'

// adar-hf portal fonts: hub = Outfit; operations desk = Source Sans 3 + Source Serif 4 (millwork theme).
const ADAR_HUB_UI = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const ADAR_SANS = "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const ADAR_SERIF = "'Source Serif 4', 'Times New Roman', Georgia, serif"
const ADAR_MONO = "'IBM Plex Mono', ui-monospace, monospace"
const ADAR_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;600;700&display=swap'

const PORTAL_ROOT_CLASS = `${DEMO_PORTAL_ROOT_CLASS} op-portal-root`

/** Public sample — no real owner name on the hub. */
const BIZ = 'Owner portfolio'
const HUB_PAGE = '#f2f0ea'
const HUB_INK = '#0f1419'
const HUB_MUTED = '#64748b'
const HUB_CARD = '#ffffff'
const HUB_BTN = '#2a3344'
const NAVY = '#2a4478'
const OPS_BAR = '#3d5278'
const ACCENT = '#c9a84c'
const ACCENT_ACTION = '#e88858'
const BG = '#ebe8e0'
const SHEET = '#ffffff'
const BORDER = 'rgba(42, 51, 68, 0.14)'
const INK = '#0f1419'
const MUTED = '#64748b'
const OCT_BG = '#fdf6e3'
const OCT_INK = '#9a7b1a'
const NOV_BG = '#e8f0fa'
const NOV_INK = '#2e5f9e'
const WARN = '#b84a3a'

const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

const ART_GREY = '#B4BCC8'
const BADGE_BG = '#2a3344'

/** Illustrated desk icons — same idea as the real portal cards, sample-only artwork. */
function HubBadge({ x, y, text }) {
  return (
    <g>
      <circle cx={x} cy={y} r="14" fill={BADGE_BG} />
      <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600">{text}</text>
    </g>
  )
}

function HubArt({ type }) {
  if (type === 'ops') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="28" y="38" width="72" height="52" rx="4" fill={ART_GREY} opacity="0.35" />
        <path d="M36 38V28h20l8 10" fill={ART_GREY} opacity="0.5" />
        <rect x="44" y="52" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="64" y="52" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="44" y="68" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="64" y="68" width="14" height="10" rx="1" fill={ART_GREY} />
        <rect x="108" y="44" width="48" height="58" rx="3" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <path d="M118 58h28M118 68h28M118 78h18" stroke={ART_GREY} strokeWidth="2" strokeLinecap="round" />
        <HubBadge x={168} y={36} text="OPS" />
      </svg>
    )
  }
  if (type === 'house') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <path d="M100 28 52 58v42h96V58L100 28z" fill={ART_GREY} opacity="0.4" />
        <rect x="78" y="68" width="44" height="32" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <rect x="88" y="78" width="12" height="22" fill={ART_GREY} opacity="0.6" />
        <HubBadge x={148} y={40} text="RE" />
      </svg>
    )
  }
  if (type === 'barber') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="62" y="36" width="76" height="56" rx="8" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <path d="M78 52h44M78 64h32" stroke={ART_GREY} strokeWidth="2" strokeLinecap="round" />
        <path d="M118 44l14-10 8 8-14 12z" fill={ART_GREY} opacity="0.65" />
        <HubBadge x={48} y={44} text="CUT" />
      </svg>
    )
  }
  if (type === 'candy') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <rect x="70" y="52" width="60" height="44" rx="6" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <rect x="78" y="60" width="12" height="12" rx="2" fill="#E8B4B8" />
        <rect x="94" y="60" width="12" height="12" rx="2" fill="#C5D8EF" />
        <rect x="110" y="60" width="12" height="12" rx="2" fill="#F0D9A8" />
        <circle cx="100" cy="38" r="14" fill="none" stroke={ART_GREY} strokeWidth="2" />
        <HubBadge x={148} y={40} text="GO" />
      </svg>
    )
  }
  if (type === 'car') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <path
          d="M52 78h96c2 0 4-2 4-4V66c0-2-1-4-3-5l-14-10c-2-1-4-2-6-2H71c-2 0-4 1-6 2l-14 10c-2 1-3 3-3 5v8c0 2 2 4 4 4z"
          fill="#fff"
          stroke={ART_GREY}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M78 54h20l10 8H68l10-8z" fill={ART_GREY} opacity="0.45" />
        <rect x="86" y="58" width="18" height="10" rx="1" fill="#fff" stroke={ART_GREY} strokeWidth="1.5" opacity="0.9" />
        <circle cx="72" cy="78" r="11" fill="#fff" stroke={ART_GREY} strokeWidth="2.5" />
        <circle cx="72" cy="78" r="4" fill={ART_GREY} opacity="0.4" />
        <circle cx="128" cy="78" r="11" fill="#fff" stroke={ART_GREY} strokeWidth="2.5" />
        <circle cx="128" cy="78" r="4" fill={ART_GREY} opacity="0.4" />
        <HubBadge x={158} y={38} text="RT" />
      </svg>
    )
  }
  if (type === 'roof') {
    return (
      <svg viewBox="0 0 200 120" width="100%" height="120" aria-hidden>
        <path d="M48 68 100 36l52 32v36H48z" fill={ART_GREY} opacity="0.35" />
        <rect x="72" y="72" width="56" height="28" fill="#fff" stroke={ART_GREY} strokeWidth="2" />
        <path d="M88 72V60h24v12" fill="none" stroke={ART_GREY} strokeWidth="2" />
        <HubBadge x={152} y={42} text="WIP" />
      </svg>
    )
  }
  return null
}

function HubLogo() {
  return (
    <span className="op-hub__logo-mark" aria-hidden>
      <span className="op-hub__logo-jk">
        JK<span className="op-hub__logo-dot">.</span>
      </span>
    </span>
  )
}

/**
 * Adar-style hub: Operations Center (in this file) + three trade portals we already ship as samples.
 * Business cards navigate to those demos; Operations Center opens the cash workbook below.
 */
const PORTAL_DESKS = [
  {
    id: 'operations',
    kicker: 'All entities · banks & payables',
    title: 'Operations Center',
    live: true,
    art: 'ops',
    enterLabel: 'Open Operations Center',
  },
  {
    id: 'riverside',
    kicker: 'Sample · tires & auto',
    title: 'Riverside Tires',
    art: 'car',
    href: '/riverside-tires',
    enterLabel: 'Open sample',
  },
  {
    id: 'harborfield',
    kicker: 'Sample · rent roll',
    title: 'Harborfield Residential',
    art: 'house',
    href: '/harborfield-properties',
    enterLabel: 'Open sample',
  },
  {
    id: 'riverstone',
    kicker: 'Sample · commercial jobs',
    title: 'Riverstone Roofing',
    art: 'roof',
    href: '/riverstone-roofing',
    enterLabel: 'Open sample',
  },
]

export default function OperationsPortalSample() {
  const router = useRouter()
  const [hubOpen, setHubOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const embedded = router.isReady && isDemoEmbedQuery(router.query)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.desk === 'operations') setHubOpen(false)
    else if (!router.query.desk) setHubOpen(true)
  }, [router.isReady, router.query.desk])

  const [toast, setToast] = useState('')

  const ping = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const openDesk = () => {
    setHubOpen(false)
    router.replace({ pathname: '/operations-portal', query: { desk: 'operations' } }, undefined, { shallow: true })
  }

  const hubPick = (desk) => {
    if (desk.id === 'operations') {
      openDesk()
      return
    }
    if (desk.href) {
      router.push(desk.href)
      return
    }
    ping('That desk is not wired in this sample.')
  }

  const renderHints =
    'html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}' +
    `.op-portal-root{font-family:${ADAR_SANS};font-variant-numeric:tabular-nums lining-nums}` +
    `.op-portal-root .op-num{font-family:${ADAR_SANS};font-variant-numeric:tabular-nums lining-nums}` +
    `.op-portal-root .op-lbl,.op-portal-root .op-eyebrow{font-family:${ADAR_SANS};font-size:11px;font-weight:600;letter-spacing:.025em;text-transform:uppercase}`

  if (!mounted) {
    return (
      <div className="op-sample-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HUB_PAGE, color: HUB_MUTED, fontFamily: ADAR_HUB_UI }}>
        Loading…
      </div>
    )
  }

  return (
    <div className={`op-sample-root${!hubOpen ? ' op-desk-open' : ''}${embedded ? ' op-embed' : ''}`}>
      <Head>
        <title>{BIZ} — owner hub (sample)</title>
        <meta name="description" content="Sample multi-business hub — Operations Center plus Riverside Tires, Harborfield, Riverstone demos. Fictitious owner." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={ADAR_FONT_LINK} rel="stylesheet" />
      </Head>
        <style>{`
          .op-sample-root{--jk-gold:#c9a84c;--jk-ink:#0f1419;--op-lobby-h:46px;--op-desk-h:58px;min-height:100vh;background:${hubOpen ? HUB_PAGE : BG}}
          .op-sample-root.op-embed{--op-lobby-h:0px}
          *{box-sizing:border-box;margin:0;padding:0}
          ${renderHints}
          .op-portal-root{background:${hubOpen ? HUB_PAGE : BG};color:${INK};min-height:calc(100vh - 52px);position:relative;z-index:1}
          .op-hub{min-height:calc(100vh - 48px);background:linear-gradient(180deg,#F4F5F8 0%,${HUB_PAGE} 120px,${HUB_PAGE} 100%);color:${HUB_INK}}
          .op-hub__bar{background:${HUB_CARD};border-bottom:1px solid #DDE2EA;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
          .op-hub__brand{display:flex;align-items:center;gap:12px}
          .op-hub__logo-mark{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:#fff;border:1px solid rgba(42,51,68,.15);flex-shrink:0}
          .op-hub__logo-jk{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:${HUB_INK};line-height:1;letter-spacing:-.02em}
          .op-hub__logo-dot{color:${ACCENT}}
          .op-hub__brand-name{font-family:${ADAR_HUB_UI};font-size:16px;font-weight:600;letter-spacing:-.01em;color:${HUB_INK}}
          .op-hub__sample{font-family:${ADAR_HUB_UI};font-size:11px;font-weight:600;letter-spacing:.025em;text-transform:uppercase;color:${HUB_MUTED};background:#F0F2F6;border:1px solid #E0E4EC;border-radius:20px;padding:6px 12px}
          .op-hub__intro{text-align:left;padding:20px 24px 0;max-width:1100px;margin:0 auto}
          .op-hub__intro h1{font-family:${ADAR_HUB_UI};font-size:clamp(1.35rem,2.5vw,1.65rem);font-weight:600;color:${HUB_INK};letter-spacing:-.02em;line-height:1.15;margin:0 0 6px}
          .op-hub__intro p{font-family:${ADAR_HUB_UI};font-size:14px;font-weight:500;color:#4b5563;line-height:1.45;margin:0;max-width:52ch}
          .op-hub__grid{display:grid;grid-template-columns:1fr;gap:16px;width:100%;max-width:1100px;margin:18px auto 40px;padding:0 24px}
          .op-hub__card-wrap{width:100%;min-width:0}
          @media(min-width:640px){.op-hub__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;max-width:920px}}
          .op-hub__card{background:${HUB_CARD};border:1px solid #E4E8EF;border-radius:14px;padding:0 0 16px;display:flex;flex-direction:column;text-align:left;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;box-shadow:0 2px 8px rgba(35,45,60,.05),0 10px 28px rgba(35,45,60,.05);overflow:hidden;min-height:240px;height:100%}
          .op-hub__card--ops{background:linear-gradient(180deg,#faf8f3 0%,#fff 55%);border-color:rgba(42,68,120,.35)}
          .op-hub__card--live{border-color:rgba(201,168,76,.55);box-shadow:0 2px 8px rgba(201,168,76,.12),0 12px 32px rgba(35,45,60,.06)}
          .op-hub__card:hover{transform:translateY(-3px);border-color:#C8D0DC;box-shadow:0 6px 16px rgba(35,45,60,.08),0 20px 40px rgba(35,45,60,.08)}
          .op-hub__live-tag{align-self:flex-start;margin:12px 20px 0;font-family:${ADAR_HUB_UI};font-size:11px;font-weight:600;letter-spacing:.02em;color:#4a3d18;background:#fdf6e3;border:1px solid rgba(201,168,76,.45);border-radius:20px;padding:4px 10px}
          .op-hub__card:focus-visible{outline:2px solid ${ACCENT};outline-offset:3px}
          .op-hub__art{padding:4px 12px 0;min-height:100px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#FAFBFC 0%,#fff 100%)}
          .op-hub__body{padding:2px 20px 0;flex:1;display:flex;flex-direction:column;justify-content:flex-end}
          .op-hub__kicker{font-family:${ADAR_HUB_UI};font-size:11px;font-weight:600;letter-spacing:.02em;color:#6b7280;margin-top:6px;line-height:1.35}
          .op-hub__title{font-family:${ADAR_HUB_UI};font-size:20px;font-weight:600;color:${HUB_INK};margin-top:4px;line-height:1.12;letter-spacing:-.02em}
          .op-hub__enter{margin:12px 20px 0;width:calc(100% - 40px);background:${HUB_BTN};color:#fff;border:none;border-radius:9px;padding:11px 14px;font-family:${ADAR_HUB_UI};font-size:13px;font-weight:600;letter-spacing:-.01em;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s}
          .op-hub__card--ops .op-hub__enter{background:${NAVY}}
          .op-hub__card:hover .op-hub__enter{background:#2f3844}
          .op-hub__foot{text-align:center;padding-bottom:32px;font-family:${ADAR_HUB_UI};font-size:11px}
          .op-hub__foot a{color:${NAVY};text-decoration:none;font-weight:600}
          .op-desk-header{background:${OPS_BAR};color:#fff;padding:14px 22px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:var(--op-lobby-h);z-index:24;box-shadow:0 1px 0 rgba(0,0,0,.08)}
          .op-desk-rail-wrap{background:${SHEET};border-bottom:1px solid ${BORDER};position:sticky;top:calc(var(--op-lobby-h) + var(--op-desk-h));z-index:23}
          .op-desk-rail{padding:6px 16px;display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:1100px;margin:0 auto;width:100%}
          .op-desk-back{background:transparent;border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:8px;padding:7px 11px;font-family:${ADAR_SANS};font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;transition:border-color .15s,background .15s}
          .op-desk-back:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.4)}
          .op-desk-title{font-family:${ADAR_SANS};font-size:clamp(1.35rem,2.5vw,1.75rem);font-weight:700;line-height:1.12;letter-spacing:-.02em}
          .op-desk-kicker{font-family:${ADAR_SANS};font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;opacity:.92;margin-top:4px}
          .op-upload-btn{display:inline-flex;align-items:center;gap:8px;background:${ACCENT_ACTION};color:#fff;border:none;border-radius:9px;padding:9px 14px;font-family:${ADAR_SANS};font-size:12px;font-weight:600;letter-spacing:-.01em;cursor:pointer;box-shadow:0 1px 0 rgba(0,0,0,.12);transition:filter .15s,transform .12s}
          .op-upload-btn:hover{filter:brightness(1.05)}
          .op-upload-btn:active{transform:translateY(1px)}
          .op-desk-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:16px;padding:0 2px}
          .op-desk-meta p{margin:0;font-family:${ADAR_SANS};font-size:13px;font-weight:500;color:${MUTED}}
          .op-desk-meta time{font-family:${ADAR_SANS};font-size:11px;font-weight:600;color:#4b5563}
          .op-desk-meta .op-sample-tag{font-family:${ADAR_SANS};font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};background:#F3F4F6;border:1px solid #E5E7EB;border-radius:20px;padding:5px 10px}
          .op-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
          .op-summary-item{background:${SHEET};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;box-shadow:0 1px 0 rgba(21,34,56,.03)}
          .op-summary-item strong{display:block;font-family:${ADAR_SANS};font-size:clamp(1.5rem,2.5vw,1.85rem);font-weight:700;letter-spacing:-.03em;margin-top:6px;font-variant-numeric:tabular-nums lining-nums;line-height:1.05}
          .op-summary-item label,.op-summary-item span.op-lbl{font-size:11px;font-weight:600;letter-spacing:.02em;color:${MUTED}}
          .op-summary-item--wide{grid-column:span 2}
          @media(max-width:640px){.op-summary-item--wide{grid-column:span 1}}
          .op-summary-meta{font-family:${ADAR_SANS};font-size:12px;color:${MUTED};margin-top:6px;line-height:1.35}
          .op-section-title{font-family:${ADAR_SANS};font-size:1.35rem;font-weight:700;letter-spacing:-.02em;color:${INK}}
          .op-panels{display:flex;flex-direction:column;gap:22px}
          .op-panel-card{background:${SHEET};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(21,34,56,.04)}
          .op-panel-hd{background:${NAVY};color:#fff;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px}
          .op-panel-hd__left{display:flex;align-items:flex-start;gap:12px}
          .op-panel-hd__icon{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(201,168,76,.35)}
          .op-panel-hd__kicker{font-family:${ADAR_SANS};font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.85}
          .op-panel-hd__title{font-family:${ADAR_SANS};font-size:clamp(1.1rem,2vw,1.45rem);font-weight:700;margin:4px 0 0;line-height:1.15;letter-spacing:-.02em}
          .op-panel-hd__right{text-align:right}
          .op-panel-hd__secondary{font-family:${ADAR_SANS};font-size:12px;opacity:.9;margin-bottom:6px}
          .op-panel-hd__total-lbl{font-family:${ADAR_SANS};font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;opacity:.85}
          .op-panel-hd__total{font-family:${ADAR_SANS};font-size:clamp(1.5rem,2.8vw,2rem);font-weight:700;color:${ACCENT};font-variant-numeric:tabular-nums;line-height:1.05;margin-top:2px}
          .op-panel-body{padding:18px 20px 20px}
          .op-bank-amt{font-family:${ADAR_SANS};font-weight:600;letter-spacing:-.025em;font-variant-numeric:tabular-nums lining-nums;line-height:1.05}
          .op-month-strip{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px}
          .op-month-chip{flex:1;min-width:140px;border-radius:10px;border:1px solid ${BORDER};padding:12px 14px;background:#fff;cursor:pointer;text-align:left;border-left-width:4px;transition:border-color .15s,box-shadow .15s}
          .op-month-chip.on{box-shadow:0 0 0 1px rgba(42,68,120,.25)}
          .op-month-chip__lbl{font-family:${ADAR_SANS};font-size:11px;font-weight:600;color:${MUTED}}
          .op-month-chip__amt{font-family:${ADAR_SANS};font-size:1.35rem;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}
          .op-month-chip__cnt{font-family:${ADAR_SANS};font-size:11px;color:${MUTED};margin-top:2px}
          .op-vendor-sub{font-size:11px;color:${MUTED};margin-top:3px;line-height:1.35}
          .op-status-tag{display:inline-block;font-size:11px;font-weight:600;padding:2px 7px;border-radius:4px;background:#F3F4F6;color:#4b5563;margin-left:6px}
          .op-status-tag--soon{background:#fdf6e3;color:#7a5c12}
          .op-status-tag--review{background:#fce8e6;color:#9b3d32}
          .op-group-hd{font-family:${ADAR_SANS};font-size:12px;font-weight:700;padding:10px 12px;background:#F7F9FC;border-bottom:1px solid ${BORDER}}
          .op-loan-foot td{font-weight:700;background:#F7F9FC}
          .op-queue-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
          .op-queue-col h3{font-family:${ADAR_SANS};font-size:12px;font-weight:700;color:${NAVY};margin:0 0 10px;letter-spacing:.02em}
          .op-queue-item{width:100%;text-align:left;border:1px solid ${BORDER};border-radius:10px;padding:12px 14px;background:#FAFBFD;cursor:pointer;font:inherit;transition:border-color .15s,background .15s}
          .op-queue-item:hover{border-color:#C5D4EA;background:#fff}
          .op-queue-item strong{display:block;font-size:13px;font-weight:600;color:${INK};line-height:1.35}
          .op-queue-item span{font-size:11px;color:${MUTED};display:block;margin-top:6px}
          .op-outflow-split{display:grid;grid-template-columns:1fr 1fr;gap:18px}
          @media(max-width:900px){.op-outflow-split{grid-template-columns:1fr}}
          .op-scope-note{font-family:${ADAR_SANS};font-size:12px;color:${MUTED};margin:0 0 12px;line-height:1.45;max-width:70ch}
          .op-cc-totals{display:flex;flex-wrap:wrap;gap:16px 28px;margin-bottom:14px;padding:12px 14px;background:#F7F9FC;border:1px solid #E8ECF2;border-radius:8px;font-family:${ADAR_SANS};font-size:11px;color:${MUTED}}
          .op-cc-totals b{color:${INK};font-size:13px;margin-left:6px;font-family:${ADAR_SANS};font-weight:600;font-variant-numeric:tabular-nums}
          .op-row-oct{background:${OCT_BG}!important}
          .op-row-nov{background:${NOV_BG}!important}
          .op-rail-btn{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:58px;padding:6px 8px;border-radius:8px;border:1px solid transparent;background:transparent;cursor:pointer;font-family:${ADAR_SANS};color:${MUTED}}
          .op-rail-btn.on{background:#eef3fb;border-color:rgba(42,68,120,.25);color:${NAVY}}
          .op-rail-btn.on svg{stroke:${ACCENT}}
          .op-rail-btn span{font-size:10px;font-weight:600;letter-spacing:.01em}
          .op-desk-header,.op-desk-header *{letter-spacing:-.01em}
          .op-main{padding:20px 16px 56px;max-width:1100px;margin:0 auto;background:${BG}}
          .op-banks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
          @media(max-width:720px){.op-banks{grid-template-columns:1fr}}
          .op-bank{background:#FAFBFD;border:1px solid #E2E7EF;border-radius:10px;padding:14px 16px}
          .op-summary-item--warn{border-color:rgba(184,74,58,.35);background:#FDF8F7}
          .op-summary-item--ok{border-color:rgba(30,122,74,.28);background:#F4FAF6}
          .op-panel{scroll-margin-top:calc(var(--op-lobby-h) + var(--op-desk-h) + 48px)}
          .op-section-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:14px}
          .op-seg{display:inline-flex;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;background:#F7F8FB}
          .op-seg button{border:none;background:transparent;padding:8px 16px;font-family:${ADAR_SANS};font-size:12px;font-weight:600;color:${MUTED};cursor:pointer}
          .op-seg button.on{background:${NAVY};color:#fff}
          .op-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 14px}
          .op-toolbar select,.op-linkbtn{font-family:${ADAR_SANS};font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid ${BORDER};background:#fff;color:${INK}}
          .op-linkbtn{cursor:pointer}
          .op-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid ${BORDER};border-radius:8px}
          .op-scroll table{width:100%;border-collapse:collapse;min-width:560px}
          .op-due-pill{display:inline-block;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600;font-family:${ADAR_SANS}}
          .op-legend{display:flex;flex-wrap:wrap;gap:12px;font-family:${ADAR_SANS};font-size:10px;color:${MUTED};margin-bottom:12px}
          .op-legend span{display:inline-flex;align-items:center;gap:6px}
          .op-legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
          .op-cal-wrap{border:1px solid ${BORDER};border-radius:8px;padding:14px;background:#FAFBFD}
          .op-cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}
          .op-cal-head div{font-family:${ADAR_SANS};font-size:9px;color:${MUTED};text-align:center}
          .op-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
          .op-cal-grid button{aspect-ratio:1;border:1px solid transparent;background:#fff;border-radius:6px;font-family:${ADAR_SANS};font-size:12px;cursor:pointer;min-height:42px;position:relative}
          .op-cal-grid button.has-due{background:${OCT_BG};border-color:#E8D9A8}
          .op-cal-grid button.sel{outline:2px solid ${ACCENT};font-weight:700}
          .op-cal-grid button .dot{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:${ACCENT}}
          .op-row-2{display:grid;grid-template-columns:1fr 300px;gap:18px}
          @media(max-width:900px){
            .op-hub__grid{max-width:min(100%,400px)}
            .op-main{padding:16px 14px 48px}
            .op-row-2{grid-template-columns:1fr}
            .op-sample-root.op-desk-open{--op-desk-h:72px}
            #section-calendar.op-cal-layout{grid-template-columns:1fr!important}
          }
        `}</style>

      <DemoLobby />

      {toast && (
        <div style={{ background: NAVY, color: '#fff', textAlign: 'center', padding: '10px 16px', fontFamily: ADAR_SANS, fontSize: 13, zIndex: 30, position: 'relative' }}>
          {toast}
        </div>
      )}

      <div className={PORTAL_ROOT_CLASS}>
        {hubOpen ? (
          <div className="op-hub">
            <header className="op-hub__bar">
              <div className="op-hub__brand">
                <HubLogo />
                <span className="op-hub__brand-name">{BIZ}</span>
              </div>
              <span className="op-hub__sample">Public sample · fictitious data</span>
            </header>
            <div className="op-hub__intro">
              <h1>Portal desks</h1>
              <p>
                Fictitious owner portfolio — open a sample trade portal or the consolidated Operations Center workbook
                (banks, payables, loans, coverage).
              </p>
            </div>
            <div className="op-hub__grid" role="navigation" aria-label="Portal desks">
              {PORTAL_DESKS.map((d) => (
                <div key={d.id} className="op-hub__card-wrap">
                  <button
                    type="button"
                    className={`op-hub__card${d.live ? ' op-hub__card--live op-hub__card--ops' : ''}`}
                    onClick={() => hubPick(d)}
                    style={{ font: 'inherit', width: '100%' }}
                  >
                    {d.live ? <span className="op-hub__live-tag">Live sample desk</span> : null}
                    <div className="op-hub__art">
                      <HubArt type={d.art} />
                    </div>
                    <div className="op-hub__body">
                      <div className="op-hub__kicker">{d.kicker}</div>
                      <div className="op-hub__title">{d.title}</div>
                    </div>
                    <span className="op-hub__enter">{d.enterLabel || 'Enter'} <span aria-hidden="true">›</span></span>
                  </button>
                </div>
              ))}
            </div>
            <div className="op-hub__foot">
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Built by JK No Jokes Financials →</a>
            </div>
          </div>
        ) : (
          <OpsCenterDesk />
        )}
      </div>
    </div>
  )
}
