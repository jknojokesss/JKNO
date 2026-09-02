import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ALL_DEMOS } from '../lib/industryDemos'
import { BUILD_STACK } from '../lib/buildStack'

// Calendly booking link behind every "book a call" CTA.
const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

// One mono face for every label, number and code-ish flourish on the page.
// JetBrains Mono over a styled mono on purpose: it is what the software was
// actually written in, and it reads as a terminal rather than as a font.
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDemo, setActiveDemo] = useState(0)
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


  return (
    <>
      <Head>
        <title>JK No Jokes Financials — Custom Dashboards Wired Into Your Systems</title>
        <meta name="description" content="We write the integrations ourselves — QuickBooks both directions, Clover POS, vendor invoices, bank activity — then build the dashboard your business is actually run on. Profit per order, inventory that ties out, month-end entries posted for you." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        /* The nav is fixed, so anchored jumps need clearance underneath it. */
        #build, #demos, #demo-preview, #contact { scroll-margin-top: 88px; }
        body {
          background-color: #0B0E14;
          background-image:
            linear-gradient(rgba(120,140,180,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(120,140,180,0.055) 1px, transparent 1px);
          background-size: 38px 38px, 38px 38px;
          background-attachment: fixed;
          color: #E6EDF3; font-family: 'DM Sans', sans-serif;
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
        .gold-shimmer { color: #B8943C; }
        .hero-pill-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fff; border: 1px solid #E2D9C5; border-radius: 999px;
          padding: 9px 18px; font-family: mono; font-size: 11px;
          letter-spacing: 1.5px; color: #E6EDF3; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .caret {
          display: inline-block; width: 7px; height: 1em; background: #C9A84C;
          vertical-align: text-bottom; margin-left: 4px; animation: blink 1.1s steps(1) infinite;
        }
        @keyframes blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }
        .hero-pill { font-family: mono; font-size: 13.5px; letter-spacing: 0.5px; color: #3D4456; font-weight: 500; }


        .feature-card {
          background: #111621;
          border: 1px solid #232B36;
          padding: 32px;
          transition: all 0.25s ease;
          cursor: default;
        }
        .feature-card:hover {
          background: #111621;
          border-color: #C9A84C;
          transform: translateY(-2px);
        }

        .cta-btn {
          background: #C9A84C;
          color: #080808;
          border: none;
          padding: 16px 36px;
          font-family: mono;
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
          font-family: mono;
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
          background: #111621;
          border: 1px solid #232B36;
          color: #E6EDF3;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 0;
        }
        input:focus, textarea:focus { border-color: #C9A84C; }
        input::placeholder, textarea::placeholder { color: #6E7681; }

        .nav-link {
          color: #8B949E;
          text-decoration: none;
          font-size: 13px;
          font-family: mono;
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
          color: #E6EDF3;
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

        @media (max-width: 980px) {
          .build-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .jkway-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title-text { font-size: 34px !important; }
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

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '20px 32px',
        background: scrolled ? 'rgba(11,14,20,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #232B36' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', color: '#E6EDF3' }}>
            JK<span style={{ color: '#C9A84C' }}>.</span>
          </span>
          <span className="nav-tagline" style={{ fontFamily: mono, fontSize: '14px', fontWeight: '500', letterSpacing: '6px', color: '#E6EDF3' }}>
            NO&nbsp;JOKES&nbsp;FINANCIALS
          </span>
        </div>
        {!isMobile && <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          <button className="nav-link" onClick={() => document.getElementById('build')?.scrollIntoView({ behavior: 'smooth' })}>What We Build</button>
          <button className="nav-link" onClick={() => router.push('/demos')}>Demos</button>
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
          border: 'none', color: '#E6EDF3', fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
          background: '#111621', borderBottom: '1px solid #232B36', padding: '20px' }}>
          {[
            { label: 'What We Build', to: '#build' },
            { label: 'Demos', to: '/demos' },
            { label: 'How It Works', to: '/how-it-works' },
            { label: 'What You Get', to: '/what-we-do' },
            { label: 'Who We Are', to: '/about' },
            { label: 'Contact', to: '#contact' },
          ].map(item => (
            <button key={item.label} className="nav-link" style={{ display: 'block', padding: '12px 0',
              width: '100%', textAlign: 'left', fontSize: '14px', color: '#E6EDF3' }}
              onClick={() => {
                if (item.to.startsWith('#')) { document.getElementById(item.to.slice(1))?.scrollIntoView({ behavior: 'smooth' }) }
                else { router.push(item.to) }
                setMenuOpen(false)
              }}>
              {item.label}
            </button>
          ))}
          <button className="cta-btn" style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
            onClick={() => router.push('/login')}>
            Client Login
          </button>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: 'clamp(96px,9vw,124px) clamp(16px,5vw,48px) clamp(30px,3.5vw,44px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h1 className="hero-title hero-title-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(34px,5.4vw,64px)', lineHeight: 1.08, color: '#E6EDF3', letterSpacing: '-1.5px' }}>
            We build the <span className="gold-shimmer">software</span><br />behind your numbers.
          </h1>
          <p className="hero-sub" style={{ margin: '24px auto 0', maxWidth: '620px', fontSize: 'clamp(16px,1.9vw,20px)', lineHeight: 1.6, color: '#A9B4C4' }}>
            We connect your QuickBooks and your register, then build you one screen that shows what you&rsquo;re actually making.
          </p>
          <div className="hero-cta" style={{ marginTop: '34px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button className="cta-btn" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>See a real one ↓</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#B8943C', fontSize: '14px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>or book a call</a>
          </div>
        </div>
      </section>

      {/* PROOF — a working dashboard, right here */}
      <section style={{ padding: '0 clamp(14px,5vw,48px) clamp(40px,5vw,60px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div id="demos">{(() => {
            // Six here; the rest are at /demos. This used to be all 23 in one
            // wall of buttons, which is the first thing a visitor saw.
            const DEMOS = [
              { label: 'Roofing', src: '/srl' },
              { label: 'Fencing', src: '/quefence' },
              { label: 'Tire shop', src: '/riverside-tires' },
              { label: 'Bakery', src: '/demo' },
              { label: 'Bridal shop', src: '/riverfall-gowns' },
              { label: 'Collections', src: '/ar-desk' },
            ]
            const active = DEMOS[activeDemo] || DEMOS[0]
            const pick = (i) => { setActiveDemo(i); if (typeof document !== 'undefined') document.getElementById('demo-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
            return (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px', justifyContent: 'center' }}>
                  {DEMOS.map((d, idx) => {
                    const on = activeDemo === idx
                    return (
                      <button key={idx} onClick={() => pick(idx)} style={{
                        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px',
                        color: on ? '#F0DEAC' : '#8B949E', padding: '9px 18px', borderRadius: '2px',
                        border: on ? '1px solid #C9A84C' : '1px solid #232B36',
                        background: on ? 'rgba(201,168,76,0.12)' : '#111621', transition: 'all 0.15s',
                      }}>{d.label}</button>
                    )
                  })}
                </div>

                <div id="demo-preview" style={{ background: '#0D1117', border: '1px solid #232B36', overflow: 'hidden' }}>
                  {isMobile
                    ? <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontFamily: mono, fontSize: '11px', color: '#6B7A96', marginBottom: '16px', letterSpacing: '1px' }}>BEST VIEWED ON DESKTOP</div>
                        <a href={active.src} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', background: '#C9A84C', color: '#E6EDF3', textDecoration: 'none', padding: '14px 28px', fontFamily: mono, fontSize: '12px', letterSpacing: '2px', borderRadius: '4px' }}>
                          OPEN THE {active.label.toUpperCase()} DASHBOARD →
                        </a>
                      </div>
                    : <iframe key={activeDemo} src={active.src} title={`${active.label} dashboard`} loading="lazy"
                        style={{ display: 'block', width: '100%', height: '640px', border: 'none', background: '#FBF4EC' }} />
                  }
                </div>

                <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '13.5px', color: '#8B949E' }}>
                  Real screens, not pictures of screens. <button onClick={() => router.push('/demos')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#B8943C', fontSize: '13.5px', textDecoration: 'underline', textUnderlineOffset: '3px', fontFamily: 'inherit' }}>See the rest</button>
                </div>
              </>
            )
          })()}</div>
        </div>
      </section>

      {/* WHO YOU ARE ACTUALLY HIRING — the trust block. A prospect is handing
          over their books; the rest of the page is machinery and says nothing
          about who is behind it. */}
      <section style={{ background: 'transparent', padding: 'clamp(20px,3vw,36px) clamp(16px,5vw,48px) clamp(44px,5vw,64px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#0D1117', border: '1px solid #232B36', borderBottom: 'none', borderRadius: '6px 6px 0 0' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#30363D' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#30363D' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#30363D' }} />
            <span style={{ marginLeft: '10px', fontFamily: mono, fontSize: '11.5px', color: '#6E7681' }}>nightly-close.log</span>
          </div>
          <div style={{ background: '#0D1117', border: '1px solid #232B36', borderRadius: '0 0 6px 6px', padding: 'clamp(24px,3vw,36px)', fontFamily: mono, fontSize: 'clamp(11.5px,1.35vw,14px)', lineHeight: 2.1 }}>
            {[
              ['quickbooks', 'pulled P&L, balance sheet, general ledger'],
              ['clover', '1,184 tickets · every line item'],
              ['vendor invoices', 'unit cost + PO number matched'],
              ['inventory', 'FIFO relief computed'],
              ['reconcile', 'ties to QuickBooks'],
              ['journal entry', 'posted'],
            ].map(([step, detail], i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span style={{ color: '#3FB950' }}>✓</span>
                <span style={{ color: '#E6EDF3', minWidth: '128px' }}>{step}</span>
                <span style={{ color: '#6E7681' }}>{detail}</span>
              </div>
            ))}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #232B36', color: '#8B949E' }}>
              <span style={{ color: '#C9A84C' }}>{'>'}</span> your books close themselves overnight<span className="caret" />
            </div>
          </div>
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '15px', color: '#8B949E', lineHeight: 1.75, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Nothing goes live until it ties out to QuickBooks. That is the whole product.
          </p>
        </div>
      </section>

      {/* WHAT WE BUILD — three lines, the detail lives on /what-we-do */}
      <section id="build" style={{ padding: 'clamp(20px,3vw,36px) clamp(16px,5vw,48px) clamp(56px,6vw,80px)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div className="build-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {BUILD_STACK.map((col, ci) => (
              <div key={ci} style={{ background: '#111621', border: '1px solid #232B36', padding: 'clamp(24px,2.6vw,32px)' }}>
                <div style={{ fontSize: '22px', color: '#C9A84C', lineHeight: 1, marginBottom: '16px' }}>{col.icon}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px,2.2vw,25px)', fontWeight: 600, color: '#E6EDF3', lineHeight: 1.25, marginBottom: '10px' }}>{col.title}</h3>
                <p style={{ fontSize: '14px', color: '#8B949E', lineHeight: 1.7 }}>{col.blurb}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button className="ghost-btn" onClick={() => router.push('/what-we-do')}>Everything we build →</button>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-pad" style={{ padding: 'clamp(56px,7vw,88px) 48px', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px', textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: '11px',
            letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
            — GET IN TOUCH
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '600', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '16px' }}>
            What would you want built first?
          </h2>
          <p style={{ color: '#8B949E', fontSize: '15px', lineHeight: 1.7 }}>
            Tell us how your business actually runs and we'll show you the dashboard we'd build for it — and the integrations underneath it.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '64px 32px',
            border: '1px solid #C9A84C', background: '#111621' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>◈</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px',
              fontWeight: '700', marginBottom: '12px' }}>We'll be in touch.</div>
            <div style={{ color: '#8B949E', fontSize: '14px' }}>
              Thanks for reaching out. Expect to hear from us within 24 hours.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: mono,
                fontSize: '10px', letterSpacing: '2px', color: '#8B949E',
                marginBottom: '8px' }}>YOUR NAME</label>
              <input type="text" placeholder="John Smith"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: mono,
                fontSize: '10px', letterSpacing: '2px', color: '#8B949E',
                marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <input type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontFamily: mono,
                fontSize: '10px', letterSpacing: '2px', color: '#8B949E',
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
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#8B949E',
              fontFamily: mono, marginTop: '8px' }}>
              Or email directly: jk@jknojokes.com
            </p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer-pad" style={{ borderTop: '1px solid #232B36', padding: '32px 48px',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid #1B2230' }}>
          <div style={{ fontFamily: mono, fontSize: '11px', color: '#8B949E', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} JK NO JOKES FINANCIALS
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '10px', color: '#8B949E', letterSpacing: '1px' }}>PRIVACY POLICY</button>
            <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '10px', color: '#8B949E', letterSpacing: '1px' }}>TERMS OF SERVICE</button>
          </div>
        </div>
      </footer>
    </>
  )
}
