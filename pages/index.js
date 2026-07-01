import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import DemoDashboard from '../components/DemoDashboard'

// Calendly booking link for the $25 gift-card offer.
const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

function TypingText({ onDone }) {
  const [displayed, setDisplayed] = useState('')
  const full = "Closing another month and you have no idea how your business is doing?"
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setDisplayed(full.slice(0, i))
      if (i >= full.length) { clearInterval(t); setTimeout(onDone, 400) }
    }, 22)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ fontSize: 'clamp(18px,2.4vw,26px)', fontWeight: 500, color: '#fff', lineHeight: 1.5, fontFamily: 'Cormorant Garamond, serif' }}>
      {displayed}
      <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#C9A84C', verticalAlign: 'text-bottom', marginLeft: '3px', animation: 'blink .7s infinite' }} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}

export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDemo, setActiveDemo] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [crossedDays, setCrossedDays] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    let day = 0
    const total = 27
    const t = setInterval(() => {
      day++
      setCrossedDays(day)
      if (day >= total) clearInterval(t)
    }, 60)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.business) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        alert('Something went wrong. Please email jk@jknojokes.com directly.')
      }
    } catch (err) {
      alert('Something went wrong. Please email jk@jknojokes.com directly.')
    }
    setSubmitting(false)
  }

  const features = [
    {
      icon: '◈',
      title: 'Clear Financial Insights',
      desc: 'Your financials explained in plain English. No jargon, no confusion — just clear answers about how your business is doing and what to watch.',
    },
    {
      icon: '▣',
      title: 'Custom-Built Dashboards',
      desc: 'Every client gets a portal built around their business. See your revenue, expenses, and profit at a glance — tailored to what matters to you.',
    },
    {
      icon: '⬡',
      title: 'QuickBooks Optional',
      desc: 'Keep QuickBooks or skip it — your call. We can plug into the books you already have, or run everything on our own system. Either way: cleaner data, smarter reporting, no bloat.',
    },
    {
      icon: '◎',
      title: 'Real-Time Financials',
      desc: 'Log in any time, from any device, and see exactly where your business stands. Your numbers are always up to date and always accessible.',
    },
    {
      icon: '⬟',
      title: 'Drill Into Every Number',
      desc: 'Click any line on your P&L and see every transaction behind it — the vendors, sales, and ad spend that make up the number. Full transparency, no black boxes.',
    },
    {
      icon: '◉',
      title: 'POS & Bank Integration',
      desc: 'Using Clover, Square, or another POS? We connect directly to your systems so your sales data flows in automatically. No manual exports.',
    },
  ]

  return (
    <>
      <Head>
        <title>JK No Jokes Financials — Real-Time Financials for Your Business</title>
        <meta name="description" content="Custom financials with a client portal. Real-time numbers, plain-English insights, and dashboards built for your business — with or without QuickBooks." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background-color: #F5F1EA;
          background-image:
            linear-gradient(rgba(26,32,53,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,32,53,0.055) 1px, transparent 1px),
            radial-gradient(circle at 12% 8%, rgba(201,168,76,0.16), transparent 45%),
            radial-gradient(circle at 88% 92%, rgba(201,168,76,0.12), transparent 45%);
          background-size: 38px 38px, 38px 38px, 100% 100%, 100% 100%;
          background-attachment: fixed;
          color: #1A1A2E; font-family: 'DM Sans', sans-serif;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .hero-badge { animation: fadeUp 0.8s ease 0s both; }
        .hero-title { animation: fadeUp 0.8s ease 0.1s both; }
        .hero-sub { animation: fadeUp 0.8s ease 0.25s both; }
        .hero-cta { animation: fadeUp 0.8s ease 0.4s both; }
        .hero-pills { animation: fadeUp 0.8s ease 0.55s both; }

        @keyframes shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .gold-shimmer {
          background: linear-gradient(100deg,#B8943C,#E8D5A3,#C9A84C,#E8D5A3,#B8943C);
          background-size: 200% auto; background-clip: text; -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: shimmer 5s linear infinite;
        }
        .hero-pill-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fff; border: 1px solid #E2D9C5; border-radius: 999px;
          padding: 9px 18px; font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 1.5px; color: #1A2035; box-shadow: 0 8px 24px rgba(26,32,53,0.07);
        }
        .hero-pill { font-family: 'DM Mono', monospace; font-size: 13.5px; letter-spacing: 0.5px; color: #3D4456; font-weight: 500; }

        .feature-card {
          background: #E8E4DC;
          border: 1px solid #DDD8CE;
          padding: 32px;
          transition: all 0.25s ease;
          cursor: default;
        }
        .feature-card:hover {
          background: #E8E4DC;
          border-color: #C9A84C;
          transform: translateY(-2px);
        }

        .cta-btn {
          background: #C9A84C;
          color: #080808;
          border: none;
          padding: 16px 36px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-block;
          text-decoration: none;
        }
        .cta-btn:hover { background: #E8D5A3; transform: translateY(-1px); }

        .ghost-btn {
          background: transparent;
          color: #B8943C;
          border: 1px solid #B8943C;
          padding: 14px 32px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        .ghost-btn:hover { background: #C9A84C; color: #fff; }

        input, textarea {
          width: 100%;
          background: #E8E4DC;
          border: 1px solid #DDD8CE;
          color: #1A1A2E;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 0;
        }
        input:focus, textarea:focus { border-color: #C9A84C; }
        input::placeholder, textarea::placeholder { color: #5A6070; }

        .nav-link {
          color: #5A6070;
          text-decoration: none;
          font-size: 13px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1px;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
        }
        .nav-link:hover { color: #C9A84C; }

        .ticker-wrap { overflow: hidden; white-space: nowrap; }
        .ticker-inner { display: inline-block; animation: ticker 20s linear infinite; }

        .offer-btn {
          display: inline-block;
          background: linear-gradient(135deg, #F0DEAC 0%, #C9A84C 55%, #B8943C 100%);
          color: #1A1A2E;
          text-decoration: none;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: clamp(22px, 3.4vw, 36px);
          line-height: 1.2;
          padding: 26px 44px;
          border-radius: 12px;
          box-shadow: 0 14px 44px rgba(201,168,76,0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
          max-width: 100%;
        }
        .offer-btn:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 20px 60px rgba(201,168,76,0.55); }
        .offer-btn::after {
          content: '';
          position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          transform: skewX(-20deg);
          animation: shine 3.4s ease-in-out infinite;
        }
        @keyframes shine { 0% { left: -60%; } 55%, 100% { left: 140%; } }

        .promo-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 44px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(90deg, #C9A84C 0%, #F0DEAC 50%, #C9A84C 100%);
          color: #1A1A2E; text-decoration: none;
          font-family: 'DM Mono', monospace; font-size: 13px; letter-spacing: 1px;
          white-space: nowrap; overflow: hidden; padding: 0 16px;
          border-bottom: 1px solid rgba(0,0,0,0.12);
        }
        .promo-bar:hover { background: linear-gradient(90deg, #D4B65E 0%, #F6E7BD 50%, #D4B65E 100%); }
        .promo-bar b { font-weight: 700; }
        .promo-book {
          background: #1A2035; color: #F0DEAC; padding: 4px 12px; border-radius: 20px;
          font-size: 11px; letter-spacing: 1px; white-space: nowrap;
        }
        .promo-short { display: none; }
        @media (max-width: 600px) {
          .promo-full { display: none; }
          .promo-short { display: inline; }
          .promo-bar { font-size: 11px; letter-spacing: 0.4px; gap: 8px; padding: 0 10px; }
          .promo-book { padding: 4px 10px; font-size: 10px; }
        }

        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title-text { font-size: 34px !important; }
          .jkway-arrow { transform: rotate(90deg); }
          .split-section { grid-template-columns: 1fr !important; gap: 32px !important; }
          .offer-btn { padding: 20px 24px !important; font-size: 20px !important; }
          .section-pad { padding: clamp(48px,8vw,120px) clamp(16px,5vw,48px) !important; }
          .hiw-panel { border-radius: 12px !important; }
          .hiw-grid { gap: 12px !important; }
          .nav-tagline { display: none; }
          .footer-pad { padding: 24px 16px !important; }
          .cta-btn, .ghost-btn { padding: 14px 20px !important; font-size: 11px !important; }
        }
        @media (max-width: 480px) {
          .nav-tagline { display: none; }
        }
      `}</style>

      {/* PERSISTENT PROMO BAR — always visible at the very top */}
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="promo-bar">
        <span aria-hidden="true">🎁</span>
        <span className="promo-full"><b>FREE $25 gift card</b> + free consultation for new clients</span>
        <span className="promo-short"><b>FREE $25 gift card</b> + free consult</span>
        <span className="promo-book">BOOK NOW →</span>
      </a>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: '44px', left: 0, right: 0, zIndex: 100,
        padding: '20px 32px',
        background: scrolled ? 'rgba(247,244,239,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #DDD8CE' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', color: '#1A1A2E' }}>
            JK<span style={{ color: '#C9A84C' }}>.</span>
          </span>
          <span className="nav-tagline" style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: '500', letterSpacing: '6px', color: '#1A1A2E' }}>
            NO&nbsp;JOKES&nbsp;FINANCIALS
          </span>
        </div>
        {!isMobile && <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          <button className="nav-link" onClick={() => router.push('/how-it-works')}>How It Works</button>
          <button className="nav-link" onClick={() => router.push('/what-we-do')}>What You Get</button>
          <button className="nav-link" onClick={() => router.push('/about')}>Who We Are</button>
          <button className="nav-link" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
          <button className="cta-btn" style={{ padding: '10px 24px', fontSize: '11px' }}
            onClick={() => router.push('/login')}>
            Client Login
          </button>
        </div>}
        {isMobile && <button style={{ background: 'none',
          border: 'none', color: '#1A1A2E', fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '108px', left: 0, right: 0, zIndex: 99,
          background: '#EEEAE2', borderBottom: '1px solid #DDD8CE', padding: '20px' }}>
          {['Features', 'About', 'Contact'].map(item => (
            <button key={item} className="nav-link" style={{ display: 'block', padding: '12px 0',
              width: '100%', textAlign: 'left', fontSize: '14px', color: '#1A1A2E' }}
              onClick={() => { document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }}>
              {item}
            </button>
          ))}
          <button className="cta-btn" style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
            onClick={() => router.push('/login')}>
            Client Login
          </button>
        </div>
      )}

      {/* HERO — headline + dashboard */}
      <section style={{ padding: 'clamp(100px,11vw,140px) clamp(14px,5vw,48px) clamp(40px,5vw,64px)', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
        {/* gold glow over the page grid */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 22% -10%, rgba(201,168,76,0.22), transparent 55%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto 0 clamp(0px,3vw,72px)', textAlign: 'left' }}>
          <h1 className="hero-title hero-title-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(33px,6.3vw,78px)', lineHeight: 1.07, color: '#1A2035', letterSpacing: '-2px' }}>
            Understand the <span className="gold-shimmer">Story</span><br />Behind Your Numbers.
          </h1>
          <div className="hero-sub" style={{ marginTop: '20px', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(13px,1.7vw,17px)', color: '#B8943C', fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
            Financial Clarity — The JK Way™
          </div>
          <p className="hero-sub" style={{ margin: '20px 0 0', maxWidth: '640px', fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, color: '#5A6070' }}>
            Built by finance pros, designed for business owners — every dashboard is <strong style={{ color: '#1A2035', fontWeight: 600 }}>tailored to the way your business actually operates.</strong>
          </p>
          <p className="hero-sub" style={{ margin: '16px 0 0', maxWidth: '600px', fontSize: 'clamp(17px,2vw,21px)', lineHeight: 1.4, color: '#1A2035', fontWeight: 500 }}>
            Know where your business stands before making your next decision.
          </p>
          <div className="hero-cta" style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <button className="cta-btn" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>See It in Action ↓</button>
            <a className="ghost-btn" href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Book a Demo</a>
          </div>
          <div className="hero-pills" style={{ marginTop: '26px', display: 'flex', gap: 'clamp(16px,3vw,32px)', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            {['✓ Real-time numbers', '✓ Plain English', '✓ No QuickBooks required'].map((t, i) => (
              <span key={i} className="hero-pill">{t}</span>
            ))}
          </div>
        </div>

        {/* Large dashboard, immediately below */}
        <div style={{ maxWidth: '1200px', margin: 'clamp(22px,3vw,38px) auto 0 clamp(0px,3vw,72px)' }}>
          <div id="demos">{(() => {
            const DEMOS = [
              { label: 'Riverside Bakery', sub: 'Products + Consignment', src: '/demo', icon: '🥐' },
              { label: 'Riverside Tires', sub: 'Items + Services', src: '/riverside-tires', icon: '🔩' },
              { label: 'Riverfall Gowns', sub: 'Order Tracking', src: '/riverfall-gowns', icon: '👗' },
              { label: 'Riverside Appliance', sub: 'Service-based', src: '/appliance-repair', icon: '🔧' },
              { label: 'Riverbank Funding', sub: 'Loan Dashboard', src: '/sba-lending', icon: '🏦' },
            ]
            return (
              <>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>— LIVE DEMOS · CLICK AROUND</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '20px' }}>
                  {DEMOS.map((d, i) => (
                    <button key={i} onClick={() => setActiveDemo(i)} style={{
                      fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                      padding: '16px', borderRadius: '12px',
                      border: activeDemo === i ? '2px solid #C9A84C' : '1px solid #DDD8CE',
                      background: activeDemo === i ? '#FFF8EC' : '#fff',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px', color: activeDemo === i ? '#C9A84C' : '#5A6070' }}>{d.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '3px' }}>{d.label}</div>
                      <div style={{ fontSize: '11px', color: '#5A6070' }}>{d.sub}</div>
                    </button>
                  ))}
                </div>
                <div style={{ background: '#1A2035', borderRadius: '12px', boxShadow: '0 40px 100px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                  <div style={{ background: '#0D1120', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #2E3A5C' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                    <div style={{ flex: 1, margin: '0 12px', background: '#1E2540', borderRadius: '4px', padding: '4px 12px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#6B7A96' }}>jknojokes.com{DEMOS[activeDemo].src}</span>
                    </div>
                  </div>
                  {isMobile
                    ? <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#6B7A96', marginBottom: '16px', letterSpacing: '1px' }}>DEMO BEST VIEWED ON DESKTOP</div>
                        <a href={DEMOS[activeDemo].src} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', background: '#C9A84C', color: '#1A1A2E', textDecoration: 'none', padding: '14px 28px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px', borderRadius: '4px' }}>
                          OPEN {DEMOS[activeDemo].label.toUpperCase()} DEMO →
                        </a>
                      </div>
                    : <iframe key={activeDemo} src={DEMOS[activeDemo].src} title={`${DEMOS[activeDemo].label} demo`} loading="lazy"
                        style={{ display: 'block', width: '100%', height: '660px', border: 'none', background: '#FBF4EC' }} />
                  }
                </div>
              </>
            )
          })()}</div>
        </div>
      </section>

      {/* WHY THE JK WAY */}
      <section style={{ background: 'linear-gradient(180deg, #FBF9F4 0%, #F4F0E8 100%)', padding: 'clamp(64px,9vw,104px) clamp(20px,5vw,48px)', position: 'relative', overflow: 'hidden', borderTop: '1px solid #EDE8DF' }}>
        <div style={{ position: 'relative', maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '18px' }}>— THE JK WAY™</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(30px,4.4vw,52px)', color: '#1A2035', lineHeight: 1.12, marginBottom: '12px' }}>
            Numbers are easy.<br /><span style={{ color: '#B8943C' }}>The story</span> is everything.
          </h2>
          <div style={{ width: '54px', height: '2px', background: '#C9A84C', margin: '26px auto 44px', opacity: 0.8 }} />

          {/* What vs Why cards */}
          <div className="jkway-cards" style={{ display: 'flex', gap: '18px', alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', maxWidth: '380px', background: '#fff', border: '1px solid #E6E0D4', borderRadius: '14px', padding: 'clamp(24px,3vw,34px)', textAlign: 'left', boxShadow: '0 10px 30px rgba(26,32,53,0.05)' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#A39A86', marginBottom: '14px' }}>MOST REPORTS</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.3, color: '#8A8475' }}>
                Tell you <span style={{ color: '#1A2035', fontWeight: 600 }}>what</span> happened.
              </div>
            </div>

            <div className="jkway-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: '26px', flexShrink: 0 }}>→</div>

            <div style={{ flex: '1 1 300px', maxWidth: '380px', background: 'linear-gradient(165deg, #FFFDF8 0%, #FBF3DF 100%)', border: '1.5px solid #C9A84C', borderRadius: '14px', padding: 'clamp(24px,3vw,34px)', textAlign: 'left', boxShadow: '0 14px 40px rgba(201,168,76,0.18)' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#B8943C', marginBottom: '14px' }}>THE JK WAY™</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.3, color: '#1A2035' }}>
                Shows you <span style={{ color: '#B8943C', fontWeight: 700 }}>why</span> — and what to do next.
              </div>
            </div>
          </div>

          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'clamp(18px,2.1vw,23px)', lineHeight: 1.55, color: '#B8943C', fontWeight: 600, marginTop: '44px' }}>
            Every business is different. Your financial insights should be too.
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderTop: '1px solid #DDD8CE', borderBottom: '1px solid #DDD8CE',
        padding: '16px 0', background: '#EEEAE2', overflow: 'hidden' }}>
        <div className="ticker-inner" style={{ fontFamily: 'DM Mono, monospace',
          fontSize: '12px', letterSpacing: '2px', color: '#7A8090', whiteSpace: 'nowrap' }}>
          {Array(4).fill('CUSTOM DASHBOARDS · REAL-TIME FINANCIALS · NO QUICKBOOKS · DRILL-DOWN REPORTING · POS INTEGRATION · PLAIN ENGLISH BOOKS · BUILT FOR YOUR BUSINESS ·').join('')}
        </div>
      </div>


      {/* CONTACT */}
      <section id="contact" className="section-pad" style={{ padding: '120px 48px', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
            — GET IN TOUCH
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '600', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '16px' }}>
            Ready to see your books differently?
          </h2>
          <p style={{ color: '#5A6070', fontSize: '15px', lineHeight: 1.7 }}>
            Leave your info and we'll reach out to show you what a custom portal looks like for your business.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '64px 32px',
            border: '1px solid #C9A84C', background: '#E8E4DC' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>◈</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px',
              fontWeight: '700', marginBottom: '12px' }}>We'll be in touch.</div>
            <div style={{ color: '#5A6070', fontSize: '14px' }}>
              Thanks for reaching out. Expect to hear from us within 24 hours.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
                fontSize: '10px', letterSpacing: '2px', color: '#5A6070',
                marginBottom: '8px' }}>YOUR NAME</label>
              <input type="text" placeholder="John Smith"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
                fontSize: '10px', letterSpacing: '2px', color: '#5A6070',
                marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <input type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
                fontSize: '10px', letterSpacing: '2px', color: '#5A6070',
                marginBottom: '8px' }}>BUSINESS NAME</label>
              <input type="text" placeholder="Acme Corp"
                value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} />
            </div>
            <button className="cta-btn"
              style={{ width: '100%', textAlign: 'center', padding: '18px',
                opacity: (!form.name || !form.email || !form.business) ? 0.5 : 1 }}
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.email || !form.business}>
              {submitting ? 'SENDING...' : 'SEND MESSAGE →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#5A6070',
              fontFamily: 'DM Mono, monospace', marginTop: '8px' }}>
              Or email directly: jk@jknojokes.com
            </p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer-pad" style={{ borderTop: '1px solid #DDD8CE', padding: '32px 48px',
        display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px',
            fontWeight: '700', letterSpacing: '2px' }}>
            JK<span style={{ color: '#C9A84C' }}>.</span>
          </div>
          <button className="ghost-btn" style={{ padding: '10px 20px', fontSize: '11px' }}
            onClick={() => router.push('/login')}>
            CLIENT LOGIN →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid #EEE9E0' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#5A6070', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} JK NO JOKES FINANCIALS
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>PRIVACY POLICY</button>
            <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>TERMS OF SERVICE</button>
          </div>
        </div>
      </footer>
    </>
  )
}
