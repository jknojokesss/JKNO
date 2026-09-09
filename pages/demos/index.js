import Head from 'next/head'
import { ALL_DEMOS } from '../../lib/industryDemos'

const BOOK = 'https://calendly.com/jk-jknojokes/30min'

const C = {
  ink: '#12181E',
  paper: '#F2F4F6',
  line: '#D5DCE4',
  muted: '#5A6570',
  soft: '#8A949E',
  accent: '#0E7C66',
  accentDark: '#0A5C4B',
  wash: '#D7EFE8',
  panel: '#152028',
}

const FEATURED = [
  {
    href: '/ashford-trading',
    industry: 'Wholesale trading',
    biz: 'Ashford Trading',
    blurb: 'Import POs, landed cost, invoices, and P&L — books shaped like a trading desk.',
  },
  {
    href: '/riverside-tires',
    industry: 'Tire & auto service',
    biz: 'Riverside Tires',
    blurb: 'Clover tickets tied to cost. Profit per bay, not just sales.',
  },
  {
    href: '/riverfall-gowns',
    industry: 'Bridal retail',
    biz: 'Riverfall Gowns',
    blurb: 'Orders, deposits, alterations, and balances from fitting to pickup.',
  },
  {
    href: '/riverstone-roofing',
    industry: 'Trade contracting',
    biz: 'Riverstone Roofing',
    blurb: 'Job margin, WIP, and cash timing for a field crew business.',
  },
]

export default function DemoGallery() {
  const featuredHrefs = new Set(FEATURED.map((d) => d.href))
  const rest = ALL_DEMOS.filter((d) => !featuredHrefs.has(d.href))

  return (
    <>
      <Head>
        <title>Sample portals — JK No Jokes Financials</title>
        <meta name="description" content="Clickable sample portals shaped like live client work — wholesale trading, tire shops, bridal, contracting, and more. No login." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:${C.paper};color:${C.ink};font-family:'Figtree',sans-serif}
          .card{display:block;text-decoration:none;background:#fff;border:1px solid ${C.line};padding:22px;transition:border-color .2s,transform .2s}
          .card:hover{border-color:${C.accent};transform:translateY(-2px)}
          .feat{display:block;text-decoration:none;background:#fff;border:1px solid ${C.line};padding:26px;transition:border-color .2s,transform .2s}
          .feat:hover{border-color:${C.accent};transform:translateY(-2px)}
        `}</style>
      </Head>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: C.muted, letterSpacing: '1px', textDecoration: 'none' }}>← JKNOJOKES.COM</a>

        <div style={{ margin: '36px 0 12px', maxWidth: '640px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '2.5px', color: C.accentDark, marginBottom: '14px' }}>
            SAMPLE PORTALS
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(32px,5vw,48px)', fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.1 }}>
            Shaped like work we already run.
          </h1>
          <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.7, marginTop: '16px' }}>
            The four below are anonymized versions of live builds. Names and numbers are fictional. Farther down: more industry experiments you can click through.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginTop: '36px' }}>
          {FEATURED.map((d) => (
            <a key={d.href} href={d.href} className="feat">
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', letterSpacing: '1.5px', color: C.accentDark, marginBottom: '10px' }}>
                {d.industry.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 600, color: C.ink, marginBottom: '10px' }}>{d.biz}</div>
              <div style={{ fontSize: '14px', color: C.muted, lineHeight: 1.6, marginBottom: '16px' }}>{d.blurb}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '1px', color: C.accentDark }}>OPEN →</div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: '56px', marginBottom: '18px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '2px', color: C.soft }}>
          MORE INDUSTRY SKETCHES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {rest.map((d) => (
            <a key={d.href} href={d.href} className="card">
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '1.5px', color: C.soft, marginBottom: '6px' }}>{d.industry.toUpperCase()}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 600, color: C.ink, marginBottom: '8px' }}>{d.biz}</div>
              <div style={{ fontSize: '13px', color: C.muted, lineHeight: 1.55 }}>{d.blurb}</div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '56px', background: C.panel, padding: '48px 24px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: '#F2F4F6', marginBottom: '10px' }}>
            Don’t see your operation?
          </div>
          <p style={{ color: '#A8B2B9', fontSize: '14px', marginBottom: '24px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            We build around your stack. A short call is enough to know if it’s worth a custom portal.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: C.accent, color: '#fff', textDecoration: 'none', padding: '14px 28px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '1.5px', display: 'inline-block' }}>
            BOOK A CALL →
          </a>
        </div>
      </div>
    </>
  )
}
