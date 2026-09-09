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
  panel: '#152028',
}

export default function HowItWorks() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>How It Works — JK No Jokes Financials</title>
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
        @media(max-width:768px){.hiw-grid{gap:12px !important}.split-btns{flex-direction:column !important}}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(242,244,246,0.96)', borderBottom: `1px solid ${C.line}`, padding: '18px clamp(16px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', background: 'none', border: 'none', cursor: 'pointer' }}>
          JK<span style={{ color: C.accent }}>.</span>
        </button>
        <div style={{ display: 'flex', gap: '22px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/how-it-works')} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: C.accentDark, background: 'none', border: 'none', cursor: 'pointer' }}>How it works</button>
          <button onClick={() => router.push('/what-we-do')} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>What you get</button>
          <button onClick={() => router.push('/about')} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>About</button>
          <button onClick={() => router.push('/#contact')} className="cta-btn" style={{ padding: '10px 18px', fontSize: '11px' }}>Contact</button>
        </div>
      </nav>

      <section style={{ padding: 'clamp(56px,8vw,88px) clamp(16px,5vw,48px) clamp(40px,5vw,56px)', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '2.5px', color: C.accentDark, marginBottom: '18px' }}>HOW IT WORKS</div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(34px,5vw,52px)', fontWeight: 600, lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-1px' }}>
          Learn the business.<br />Build the portal.<br />Stay on the books.
        </h1>
        <p style={{ fontSize: '17px', color: C.muted, lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          Three steps. No bloated software to learn. A system you can open on Monday and trust.
        </p>
      </section>

      <section style={{ padding: '0 clamp(16px,5vw,48px) clamp(64px,9vw,100px)', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '12px' }}>
          {[
            { n: '01', title: 'We learn your business', body: 'One call. How you get paid, what you sell, what you spend. We figure out what the portal has to show — and which systems to wire.' },
            { n: '02', title: 'We build your portal', body: 'Custom screens around your operation. Integrations into QuickBooks, POS, bank, vendors — whatever you already run. Not a template with your logo stuck on.' },
            { n: '03', title: 'We stay on it', body: 'Books get updated. Exceptions get reviewed. You log in any time. When something looks off, you get a plain-English answer from someone who already knows the system.' },
          ].map((s, i) => (
            <div key={s.n} style={{ background: i === 1 ? C.panel : '#fff', padding: 'clamp(28px,4vw,40px)', border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '2px', color: i === 1 ? C.accent : C.soft, marginBottom: '18px' }}>{s.n}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 600, color: i === 1 ? '#fff' : C.ink, marginBottom: '12px', lineHeight: 1.25 }}>{s.title}</div>
              <div style={{ fontSize: '15px', color: i === 1 ? '#A8B2B9' : C.muted, lineHeight: 1.75 }}>{s.body}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '56px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '28px' }}>
          {[
            { label: 'Day 1', title: 'Kickoff call', desc: 'Thirty minutes on how the business actually runs.' },
            { label: 'Build', title: 'Portal + pipes', desc: 'We wire systems and shape the screens. You keep operating.' },
            { label: 'Launch', title: 'Walkthrough', desc: 'We go through it together, tweak what feels off, go live.' },
            { label: 'Ongoing', title: 'Books + support', desc: 'Monthly close, portal current, someone reachable when it matters.' },
          ].map((item) => (
            <div key={item.label} style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: '18px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', letterSpacing: '1px', color: C.accentDark, marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="split-btns" style={{ marginTop: '56px', display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="cta-btn" onClick={() => router.push('/#contact')}>Get started →</button>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">Book a call</a>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '28px clamp(16px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>JK<span style={{ color: C.accent }}>.</span></button>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: C.soft, letterSpacing: '1px' }}>© {new Date().getFullYear()} JK NO JOKES FINANCIALS</div>
      </footer>
    </>
  )
}
