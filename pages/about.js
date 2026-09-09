import Head from 'next/head'
import { useRouter } from 'next/router'

const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

const C = {
  ink: '#12181E',
  paper: '#F2F4F6',
  line: '#D5DCE4',
  muted: '#5A6570',
  soft: '#8A949E',
  accent: '#0E7C66',
  accentDark: '#0A5C4B',
  wash: '#D7EFE8',
  panel: '#E8ECF0',
}

export default function About() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>About — JK No Jokes Financials</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.paper};color:${C.ink};font-family:'Figtree',sans-serif}
        .cta-btn{background:${C.accent};color:#fff;border:none;padding:15px 28px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-block}
        .cta-btn:hover{background:${C.accentDark}}
        .ghost-btn{background:transparent;color:${C.accentDark};border:1px solid ${C.accent};padding:14px 26px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-block}
        .ghost-btn:hover{background:${C.wash}}
        @media(max-width:768px){.split{grid-template-columns:1fr !important;gap:36px !important}.stats{grid-template-columns:1fr 1fr !important}}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(242,244,246,0.96)', borderBottom: `1px solid ${C.line}`, padding: '18px clamp(16px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', background: 'none', border: 'none', cursor: 'pointer' }}>
          JK<span style={{ color: C.accent }}>.</span>
        </button>
        <div style={{ display: 'flex', gap: '22px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/#demos')} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '0.6px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>Work</button>
          <button onClick={() => router.push('/about')} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '0.6px', color: C.accentDark, background: 'none', border: 'none', cursor: 'pointer' }}>About</button>
          <button onClick={() => router.push('/#contact')} className="cta-btn" style={{ padding: '10px 18px', fontSize: '11px' }}>Contact</button>
        </div>
      </nav>

      <section style={{ padding: 'clamp(56px,8vw,88px) clamp(16px,5vw,48px) clamp(40px,5vw,56px)', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '2.5px', color: C.accentDark, marginBottom: '18px' }}>ABOUT</div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(34px,5vw,52px)', fontWeight: 600, lineHeight: 1.1, marginBottom: '18px', letterSpacing: '-1px' }}>
          Books, software, and one person who owns both.
        </h1>
        <p style={{ fontSize: '17px', color: C.muted, lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          JK No Jokes builds custom portals wired into the systems you already run — then stays on the books so the screens stay true.
        </p>
      </section>

      <section style={{ padding: '0 clamp(16px,5vw,48px) clamp(64px,9vw,100px)', maxWidth: '1040px', margin: '0 auto' }}>
        <div className="split" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '64px', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <img src="/1779727210800.jpg" alt="Jonathan Katz" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}`, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 600, lineHeight: 1.2 }}>Jonathan (Chaim) Katz</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', letterSpacing: '1.4px', color: C.accentDark, marginTop: '5px' }}>FOUNDER</div>
              </div>
            </div>
            <p style={{ fontSize: '16px', color: C.muted, lineHeight: 1.8, marginBottom: '18px' }}>
              I started this because owners were drowning in QuickBooks reports that didn’t match how they thought about the business — and because off-the-shelf dashboards never quite fit.
            </p>
            <p style={{ fontSize: '16px', color: C.muted, lineHeight: 1.8, marginBottom: '18px' }}>
              So I build the portal: POs, tickets, inventory, partner payments, whatever the operation needs. Then I keep the ledger and the software tied together. You’re not hiring a SaaS seat. You’re hiring someone who will answer when a deposit doesn’t land.
            </p>
            <p style={{ fontSize: '16px', color: C.muted, lineHeight: 1.8, marginBottom: '28px' }}>
              If that sounds like what you need, we’ll look at your stack on a call and tell you straight whether it’s a fit.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="cta-btn" onClick={() => router.push('/#contact')}>Work with us →</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">Book a call</a>
            </div>
          </div>

          <div className="stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { number: '1', label: 'Point of contact' },
              { number: '24/7', label: 'Portal access' },
              { number: 'Custom', label: 'Every build' },
              { number: '$750+', label: 'Typical monthly' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: C.panel, padding: '32px 24px' }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '34px', fontWeight: 600, color: C.accentDark, lineHeight: 1, marginBottom: '8px' }}>{stat.number}</div>
                <div style={{ fontSize: '12px', color: C.muted, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '1px' }}>{stat.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '28px clamp(16px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>JK<span style={{ color: C.accent }}>.</span></button>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: C.soft, letterSpacing: '1px' }}>© {new Date().getFullYear()} JK NO JOKES FINANCIALS</div>
      </footer>
    </>
  )
}
