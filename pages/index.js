import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import DemoDashboard from '../components/DemoDashboard'

// Calendly booking link for the $25 gift-card offer.
const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const features = [
    {
      icon: '◈',
      title: 'AI-Powered Insights',
      desc: 'Your financials explained in plain English. No jargon, no confusion — just clear answers about how your business is doing and what to watch.',
    },
    {
      icon: '▣',
      title: 'Custom-Built Dashboards',
      desc: 'Every client gets a portal built around their business. See your revenue, expenses, and profit at a glance — tailored to what matters to you.',
    },
    {
      icon: '⬡',
      title: 'No QuickBooks Required',
      desc: 'We built our own system from the ground up. That means cleaner data, smarter reporting, and zero bloated software eating into your budget.',
    },
    {
      icon: '◎',
      title: 'Real-Time Financials',
      desc: 'Log in any time, from any device, and see exactly where your business stands. Your numbers are always up to date and always accessible.',
    },
    {
      icon: '⬟',
      title: 'Drill Into Every Number',
      desc: 'Click any line item and see every transaction behind it. Full transparency — from your P&L to your balance sheet to your cash flow.',
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
        <title>JK No Jokes Bookkeeping — Modern Bookkeeping for Small Business</title>
        <meta name="description" content="AI-powered bookkeeping with custom client portals. No QuickBooks. Real-time financials built for your business." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #F7F4EF; color: #1A1A2E; font-family: 'DM Sans', sans-serif; }

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

        .hero-title { animation: fadeUp 0.8s ease 0.1s both; }
        .hero-sub { animation: fadeUp 0.8s ease 0.25s both; }
        .hero-cta { animation: fadeUp 0.8s ease 0.4s both; }

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
          .hero-title-text { font-size: 48px !important; }
          .split-section { grid-template-columns: 1fr !important; }
          .offer-btn { padding: 20px 24px !important; font-size: 20px !important; }
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
        padding: '20px 48px',
        background: scrolled ? 'rgba(247,244,239,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #DDD8CE' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px',
          fontWeight: '700', letterSpacing: '2px' }}>
          JK<span style={{ color: '#C9A84C' }}>.</span>
        </div>
        {!isMobile && <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
          <button className="nav-link" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
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

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '120px 48px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(#DDD8CE 1px, transparent 1px), linear-gradient(90deg, #DDD8CE 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }} />
        {/* Gold glow */}
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '3px', color: '#C9A84C', marginBottom: '24px',
            animation: 'fadeIn 0.6s ease both' }}>
            — BOOKKEEPING. REIMAGINED.
          </div>

          <h1 className="hero-title" style={{ fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: '600', lineHeight: 1.05,
            letterSpacing: '-0.5px', marginBottom: '32px' }}>
            Your books.<br />
            <span style={{ color: '#C9A84C' }}>No jokes.</span><br />
            No QuickBooks.
          </h1>

          <p className="hero-sub" style={{ fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#5A6070', lineHeight: 1.7, maxWidth: '560px', marginBottom: '48px' }}>
            AI-powered bookkeeping with a custom client portal built for your business.
            Real-time financials, plain-English insights, and zero bloated software.
          </p>

          <div className="hero-cta" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="cta-btn"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started →
            </button>
            <button className="ghost-btn"
              onClick={() => router.push('/demo')}>
              See a Live Demo →
            </button>
          </div>
        </div>
      </section>

      {/* $25 GIFT CARD OFFER */}
      <section id="offer" style={{
        background: 'linear-gradient(160deg, #1A2035 0%, #242C4A 100%)',
        padding: 'clamp(52px, 8vw, 88px) clamp(20px, 5vw, 48px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(201,168,76,0.20), transparent 60%)',
          pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px',
            letterSpacing: '3px', color: '#C9A84C', marginBottom: '24px' }}>
            🎁 LIMITED-TIME OFFER FOR NEW CLIENTS
          </div>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="offer-btn">
            FREE $25 gift card + free consultation, sign up now!
          </a>
          <p style={{ maxWidth: '540px', margin: '24px auto 0', fontSize: '13px',
            lineHeight: 1.6, color: '#9AA3BD' }}>
            Must have a current small business and be willing to share details about your
            current financial setup.
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderTop: '1px solid #DDD8CE', borderBottom: '1px solid #DDD8CE',
        padding: '16px 0', background: '#EEEAE2', overflow: 'hidden' }}>
        <div className="ticker-inner" style={{ fontFamily: 'DM Mono, monospace',
          fontSize: '12px', letterSpacing: '2px', color: '#7A8090', whiteSpace: 'nowrap' }}>
          {Array(4).fill('AI-POWERED INSIGHTS · CUSTOM DASHBOARDS · REAL-TIME FINANCIALS · NO QUICKBOOKS · DRILL-DOWN REPORTING · POS INTEGRATION · PLAIN ENGLISH BOOKS · ').join('')}
        </div>
      </div>


      {/* DASHBOARD MOCKUP SECTION */}
      <section style={{ padding: 'clamp(56px, 9vw, 100px) clamp(14px, 5vw, 48px)', background: '#F7F4EF', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
              letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
              — LIVE SAMPLE · CLICK AROUND
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: '600',
              letterSpacing: '-0.3px', lineHeight: 1.15, color: '#1A1A2E',
              marginBottom: '16px' }}>
              Your numbers, clear at a glance.
            </h2>
            <p style={{ fontSize: '15px', color: '#5A6070', maxWidth: '480px',
              margin: '0 auto', lineHeight: 1.7 }}>
              This one's live — click through the tabs below. Every client gets
              their own branded portal with real-time charts and drill-down reports.
            </p>
          </div>

          {/* Browser mockup frame */}
          <div style={{
            background: '#1A2035',
            borderRadius: '12px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxWidth: '960px',
            margin: '0 auto',
          }}>
            {/* Browser chrome */}
            <div style={{ background: '#0D1120', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: '1px solid #2E3A5C' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <div style={{ flex: 1, margin: '0 12px', background: '#1E2540',
                borderRadius: '4px', padding: '4px 12px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
                  color: '#6B7A96' }}>jknojokes.com/dashboard</span>
              </div>
            </div>

            {/* Live, interactive demo — the same Riverside Bakery dashboard served at /demo */}
            <iframe
              src="/demo"
              title="Live dashboard demo"
              loading="lazy"
              style={{
                display: 'block',
                width: '100%',
                height: '660px',
                border: 'none',
                background: '#FBF4EC',
              }}
            />
          </div>

          {/* Caption below mockup */}
          <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex',
            justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {[
              '✓ Custom branded per client',
              '✓ Drill down into every number',
              '✓ Works on any device',
            ].map((item, i) => (
              <div key={i} style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
                letterSpacing: '1px', color: '#7A8090' }}>{item}</div>
            ))}
          </div>

          {/* Live demo CTA */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="cta-btn" onClick={() => router.push('/demo')}>
              Open full-screen demo →
            </button>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#7A8090',
              marginTop: '12px', letterSpacing: '1.5px' }}>
              CLICKABLE · SAMPLE DATA · NO LOGIN
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
            — WHAT YOU GET
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: '600', letterSpacing: '-1px', lineHeight: 1.1, color: '#1A1A2E' }}>
            Bookkeeping built for<br />the modern business.
          </h2>
        </div>

        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: '#DDD8CE',
          border: '1px solid #DDD8CE',
        }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: '24px', color: '#C9A84C', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
                fontWeight: '600', marginBottom: '12px', letterSpacing: '0' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#5A6070', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / SPLIT SECTION */}
      <section id="about" style={{ padding: '120px 48px', background: '#EEEAE2',
        borderTop: '1px solid #DDD8CE', borderBottom: '1px solid #DDD8CE' }}>
        <div className="split-section" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '80px', maxWidth: '1100px', margin: '0 auto', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
              letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
              — WHO WE ARE
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: '600', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '24px' }}>
              Not your average bookkeeper.
            </h2>
            <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8, marginBottom: '20px' }}>
              JK No Jokes is a boutique bookkeeping service that combines deep financial expertise with cutting-edge AI technology. We don't just record your numbers — we help you understand them.
            </p>
            <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8, marginBottom: '32px' }}>
              Every client gets their own custom-built financial portal — a clean, intuitive dashboard that shows exactly how their business is performing, updated in real time, accessible from any device.
            </p>
            <button className="cta-btn"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Work With Us
            </button>
          </div>

          {/* Stats panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
            background: '#DDD8CE', border: '1px solid #DDD8CE' }}>
            {[
              { number: 'AI', label: 'Powered Analysis' },
              { number: '24/7', label: 'Portal Access' },
              { number: '100%', label: 'Custom Built' },
              { number: '0', label: 'QuickBooks' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#E8E4DC', padding: '36px 28px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px',
                  fontWeight: '600', color: '#C9A84C', lineHeight: 1, marginBottom: '8px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '13px', color: '#5A6070', fontFamily: 'DM Mono, monospace',
                  letterSpacing: '1px' }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '120px 48px', maxWidth: '680px', margin: '0 auto' }}>
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
      <footer style={{ borderTop: '1px solid #DDD8CE', padding: '32px 48px',
        display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px',
            fontWeight: '700', letterSpacing: '2px' }}>
            JK<span style={{ color: '#C9A84C' }}>.</span>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            color: '#5A6070', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} JK NO JOKES BOOKKEEPING
          </div>
          <button className="ghost-btn" style={{ padding: '10px 20px', fontSize: '11px' }}
            onClick={() => router.push('/login')}>
            CLIENT LOGIN →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', paddingTop: '8px', borderTop: '1px solid #EEE9E0' }}>
          <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>PRIVACY POLICY</button>
          <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>TERMS OF SERVICE</button>
        </div>
      </footer>
    </>
  )
}
