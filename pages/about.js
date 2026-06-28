import Head from 'next/head'
import { useRouter } from 'next/router'

const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

export default function About() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Who We Are — JK No Jokes Financials</title>
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
        @media(max-width:768px){.split{grid-template-columns:1fr !important;gap:40px !important}.stats{grid-template-columns:1fr 1fr !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(247,244,239,0.97)', borderBottom:'1px solid #DDD8CE', padding:'18px clamp(16px,5vw,48px)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily:'Playfair Display,serif', fontSize:'22px', fontWeight:700, letterSpacing:'-0.5px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'baseline', gap:'2px' }}>
          JK<span style={{ color:'#C9A84C' }}>.</span>
        </button>
        <div style={{ display:'flex', gap:'28px', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/how-it-works')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>How It Works</button>
          <button onClick={() => router.push('/what-we-do')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>What You Get</button>
          <button onClick={() => router.push('/about')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#C9A84C', background:'none', border:'none', cursor:'pointer' }}>Who We Are</button>
          <button onClick={() => router.push('/#contact')} className="cta-btn" style={{ padding:'10px 20px', fontSize:'11px' }}>Contact</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'clamp(64px,9vw,100px) clamp(16px,5vw,48px) clamp(48px,6vw,72px)', textAlign:'center', maxWidth:'800px', margin:'0 auto' }}>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', letterSpacing:'3px', color:'#C9A84C', marginBottom:'20px' }}>— WHO WE ARE</div>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(36px,5vw,64px)', fontWeight:600, lineHeight:1.1, marginBottom:'20px' }}>
          Beyond bookkeeping.
        </h1>
        <p style={{ fontSize:'17px', color:'#5A6070', lineHeight:1.7, maxWidth:'520px', margin:'0 auto' }}>
          JK No Jokes Financials is a boutique finance firm that pairs deep financial expertise with cutting-edge AI.
        </p>
      </section>

      {/* Split section */}
      <section style={{ padding:'0 clamp(16px,5vw,48px) clamp(64px,9vw,100px)', maxWidth:'1100px', margin:'0 auto' }}>
        <div className="split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>
          <div>
            {/* Portrait */}
            <div style={{ marginBottom:'36px', display:'flex', alignItems:'center', gap:'20px' }}>
              <img src="/1779727210800.jpg" alt="Jonathan Katz" style={{ width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', border:'3px solid #C9A84C', flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'22px', fontWeight:600, lineHeight:1.2 }}>Jonathan (Chaim) Katz</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:'10px', letterSpacing:'1.5px', color:'#C9A84C', marginTop:'4px' }}>FOUNDER · JK NO JOKES FINANCIALS</div>
              </div>
            </div>
            <p style={{ fontSize:'16px', color:'#5A6070', lineHeight:1.8, marginBottom:'24px' }}>
              We don't just record your numbers — we build the system that turns them into decisions. Every client gets their own custom-built financial portal, updated in real time, accessible from any device.
            </p>
            <p style={{ fontSize:'16px', color:'#5A6070', lineHeight:1.8, marginBottom:'24px' }}>
              We work with small business owners who are tired of flying blind — who know something is off but can't see it in a pile of spreadsheets or a QuickBooks report that makes no sense.
            </p>
            <p style={{ fontSize:'16px', color:'#5A6070', lineHeight:1.8, marginBottom:'36px' }}>
              Our job is to make your numbers clear, your reporting automatic, and your books something you actually look at.
            </p>
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
              <button className="cta-btn" onClick={() => router.push('/#contact')}>Work with us →</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">Book a free call</a>
            </div>
          </div>

          {/* Stats */}
          <div className="stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#DDD8CE', border:'1px solid #DDD8CE' }}>
            {[
              { number:'AI', label:'Powered Analysis' },
              { number:'24/7', label:'Portal Access' },
              { number:'100%', label:'Custom Built' },
              { number:'0', label:'Guesswork' },
            ].map((stat, i) => (
              <div key={i} style={{ background:'#E8E4DC', padding:'36px 28px' }}>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'44px', fontWeight:600, color:'#C9A84C', lineHeight:1, marginBottom:'8px' }}>{stat.number}</div>
                <div style={{ fontSize:'13px', color:'#5A6070', fontFamily:'DM Mono,monospace', letterSpacing:'1px' }}>{stat.label.toUpperCase()}</div>
              </div>
            ))}
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
