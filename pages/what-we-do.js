import Head from 'next/head'
import { useRouter } from 'next/router'

const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

const features = [
  { icon: '◉', title: 'Integrations We Wrote Ourselves', desc: 'QuickBooks Online in both directions, Clover POS, your vendor portal, your bank. Real API work on a nightly schedule — not a $99/mo connector that drops half your line items.' },
  { icon: '▣', title: 'Custom-Built Dashboards', desc: 'Every client gets a portal built around their business — your income streams, your reports, your language. Not a template with your logo on it.' },
  { icon: '⬟', title: 'Profit Per Order', desc: 'Revenue, cost, and margin on every single ticket — matched back to what you actually paid your vendor for that exact item. Most POS systems will never tell you this.' },
  { icon: '◈', title: 'Inventory That Ties Out', desc: 'Dated purchase layers, FIFO relief, and a month-end COGS journal entry ready to post. The dollars reconcile to QuickBooks — that is the whole point.' },
  { icon: '◎', title: 'Real-Time, Drill-Down Numbers', desc: 'Log in any time, from any device. Click any line on your P&L and see every transaction behind it — the vendors, sales, and ad spend that make up the number.' },
  { icon: '⬡', title: 'Ideas From Other Clients', desc: 'An AR desk that emails every statement in one pass. A crew log that lands in QuickBooks coded to the job. A WIP schedule and buyer package. Built once, available to you.' },
]

export default function WhatWeDo() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>What You Get — JK No Jokes Financials</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#F7F4EF;color:#1A1A2E;font-family:'DM Sans',sans-serif}
        .cta-btn{background:#C9A84C;color:#080808;border:none;padding:16px 36px;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;display:inline-block;text-decoration:none}
        .cta-btn:hover{background:#E8D5A3;transform:translateY(-1px)}
        .ghost-btn{background:transparent;color:#B8943C;border:1px solid #B8943C;padding:14px 32px;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-block}
        .ghost-btn:hover{background:#C9A84C;color:#fff}
        .feature-card{background:#E8E4DC;border:1px solid #DDD8CE;padding:32px;transition:all .25s}
        .feature-card:hover{border-color:#C9A84C;transform:translateY(-2px)}
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#DDD8CE;border:1px solid #DDD8CE}
        @media(max-width:768px){.features-grid{grid-template-columns:1fr !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(247,244,239,0.97)', borderBottom:'1px solid #DDD8CE', padding:'18px clamp(16px,5vw,48px)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily:'Playfair Display,serif', fontSize:'22px', fontWeight:700, letterSpacing:'-0.5px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'baseline', gap:'2px' }}>
          JK<span style={{ color:'#C9A84C' }}>.</span>
        </button>
        <div style={{ display:'flex', gap:'28px', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/how-it-works')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>How It Works</button>
          <button onClick={() => router.push('/what-we-do')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#C9A84C', background:'none', border:'none', cursor:'pointer' }}>What You Get</button>
          <button onClick={() => router.push('/about')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>Who We Are</button>
          <button onClick={() => router.push('/#contact')} className="cta-btn" style={{ padding:'10px 20px', fontSize:'11px' }}>Contact</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'clamp(64px,9vw,100px) clamp(16px,5vw,48px) clamp(48px,6vw,72px)', textAlign:'center', maxWidth:'800px', margin:'0 auto' }}>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', letterSpacing:'3px', color:'#C9A84C', marginBottom:'20px' }}>— WHAT YOU GET</div>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(36px,5vw,64px)', fontWeight:600, lineHeight:1.1, marginBottom:'20px' }}>
          We build the software<br />behind your numbers.
        </h1>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(20px,2.8vw,30px)', color:'#C9A84C', fontWeight:600, marginBottom:'20px' }}>
          The JK Way™ — built around your business.
        </div>
        <p style={{ fontSize:'17px', color:'#5A6070', lineHeight:1.7, maxWidth:'520px', margin:'0 auto' }}>
          Every client gets a fully custom portal, wired into the systems you already run. Here's what's inside.
        </p>
      </section>

      {/* Feature grid */}
      <section style={{ padding:'0 clamp(16px,5vw,48px) clamp(64px,9vw,100px)', maxWidth:'1200px', margin:'0 auto' }}>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize:'28px', color:'#C9A84C', marginBottom:'20px' }}>{f.icon}</div>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'22px', fontWeight:600, marginBottom:'12px' }}>{f.title}</h3>
              <p style={{ fontSize:'14px', color:'#5A6070', lineHeight:1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div style={{ marginTop:'64px', background:'#1A2035', borderRadius:'16px', padding:'clamp(36px,5vw,56px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 0%, rgba(201,168,76,0.18), transparent 60%)', pointerEvents:'none' }} />
          <div style={{ position:'relative' }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', letterSpacing:'3px', color:'#C9A84C', marginBottom:'16px' }}>— READY?</div>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(28px,3.5vw,44px)', fontWeight:600, color:'#fff', marginBottom:'20px', lineHeight:1.1 }}>All of this. Built for your business.</h2>
            <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
              <button className="cta-btn" onClick={() => router.push('/#contact')}>Get started →</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">Book a free call</a>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid #DDD8CE', padding:'28px clamp(16px,5vw,48px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily:'Playfair Display,serif', fontSize:'18px', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>JK<span style={{ color:'#C9A84C' }}>.</span></button>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', color:'#5A6070', letterSpacing:'1px' }}>© {new Date().getFullYear()} JK NO JOKES FINANCIALS</div>
      </footer>
    </>
  )
}
