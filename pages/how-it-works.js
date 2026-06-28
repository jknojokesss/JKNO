import Head from 'next/head'
import { useRouter } from 'next/router'

const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

export default function HowItWorks() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>How It Works — JK No Jokes Financials</title>
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
        nav a,nav button{background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:1px;color:#5A6070;text-decoration:none;transition:color .2s}
        nav a:hover,nav button:hover{color:#C9A84C}
        @media(max-width:768px){.hiw-grid{gap:12px !important}.hiw-panel{border-radius:12px !important}.split-btns{flex-direction:column !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(247,244,239,0.97)', borderBottom:'1px solid #DDD8CE', padding:'18px clamp(16px,5vw,48px)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily:'Playfair Display, serif', fontSize:'22px', fontWeight:700, letterSpacing:'-0.5px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'baseline', gap:'8px' }}>
          JK<span style={{ color:'#C9A84C' }}>.</span>
        </button>
        <div style={{ display:'flex', gap:'28px', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/how-it-works')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#C9A84C', background:'none', border:'none', cursor:'pointer' }}>How It Works</button>
          <button onClick={() => router.push('/what-we-do')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>What You Get</button>
          <button onClick={() => router.push('/about')} style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'1px', color:'#5A6070', background:'none', border:'none', cursor:'pointer' }}>Who We Are</button>
          <button onClick={() => router.push('/#contact')} className="cta-btn" style={{ padding:'10px 20px', fontSize:'11px' }}>Contact</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'clamp(64px,9vw,100px) clamp(16px,5vw,48px) clamp(48px,6vw,72px)', textAlign:'center', maxWidth:'800px', margin:'0 auto' }}>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', letterSpacing:'3px', color:'#C9A84C', marginBottom:'20px' }}>— HOW IT WORKS</div>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(36px,5vw,64px)', fontWeight:600, lineHeight:1.1, marginBottom:'20px' }}>
          From messy books to<br />clear numbers.
        </h1>
        <p style={{ fontSize:'17px', color:'#5A6070', lineHeight:1.7, maxWidth:'540px', margin:'0 auto' }}>
          Three steps. No bloated software. No learning curve. Just a system that works while you focus on running your business.
        </p>
      </section>

      {/* Steps */}
      <section style={{ padding:'0 clamp(16px,5vw,48px) clamp(64px,9vw,100px)', maxWidth:'1100px', margin:'0 auto' }}>
        <div className="hiw-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'2px' }}>
          {[
            { n:'01', title:'We learn your business', body:'One call. You tell us how your business works — how you get paid, what you sell, what you spend. We listen, ask the right questions, and figure out exactly what your dashboard needs to show.' },
            { n:'02', title:'We build your portal', body:'A custom dashboard built around your business — your brands, your income streams, your reports. Not a generic template. Not off-the-shelf software. Built for you, looks like you.' },
            { n:'03', title:'Your numbers stay current', body:'Every month your books are updated and your portal reflects where you actually stand. Log in any time, from any device. Ask AI a question about your numbers and get a plain-English answer.' },
          ].map((s, i) => (
            <div key={i} className="hiw-panel" style={{ background: i===1?'#1A2035':'#fff', padding:'clamp(28px,4vw,52px)', border:'1px solid #DDD8CE', borderRadius: i===0?'16px 0 0 16px':i===2?'0 16px 16px 0':'0', position:'relative' }}>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'72px', fontWeight:700, color: i===1?'rgba(201,168,76,0.12)':'#F0EBE2', lineHeight:1, marginBottom:'24px' }}>{s.n}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'26px', fontWeight:600, color: i===1?'#fff':'#1A1A2E', marginBottom:'16px', lineHeight:1.2 }}>{s.title}</div>
              <div style={{ fontSize:'15px', color: i===1?'#9AA3BD':'#5A6070', lineHeight:1.8 }}>{s.body}</div>
              {i===1 && <div style={{ position:'absolute', top:'20px', right:'20px', fontFamily:'DM Mono,monospace', fontSize:'9px', color:'#C9A84C', letterSpacing:'2px' }}>MOST POPULAR</div>}
            </div>
          ))}
        </div>

        {/* Timeline detail */}
        <div style={{ marginTop:'64px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'32px' }}>
          {[
            { label:'Day 1', title:'Kickoff call', desc:'30 minutes. We learn your business, your pain points, and what you actually want to see.' },
            { label:'Days 2–5', title:'Build phase', desc:'We build your custom portal. You don\'t lift a finger.' },
            { label:'Day 6', title:'Review & launch', desc:'You see your portal, we walk you through it together, make any tweaks, and go live.' },
            { label:'Ongoing', title:'Monthly updates', desc:'Books updated every month. Portal always current. You always know where you stand.' },
          ].map((item, i) => (
            <div key={i} style={{ borderLeft:'2px solid #C9A84C', paddingLeft:'20px' }}>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:'10px', letterSpacing:'1px', color:'#C9A84C', marginBottom:'6px' }}>{item.label}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'20px', fontWeight:600, marginBottom:'8px' }}>{item.title}</div>
              <div style={{ fontSize:'14px', color:'#5A6070', lineHeight:1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="split-btns" style={{ marginTop:'56px', display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          <button className="cta-btn" onClick={() => router.push('/#contact')}>Get started →</button>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">Book a free call</a>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid #DDD8CE', padding:'28px clamp(16px,5vw,48px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <button onClick={() => router.push('/')} style={{ fontFamily:'Playfair Display,serif', fontSize:'18px', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>JK<span style={{ color:'#C9A84C' }}>.</span></button>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', color:'#5A6070', letterSpacing:'1px' }}>© {new Date().getFullYear()} JK NO JOKES FINANCIALS</div>
      </footer>
    </>
  )
}
