import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ALL_DEMOS } from '../lib/industryDemos'

// Calendly booking link for the $25 gift-card offer.
const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'

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

  // What we actually build, grouped the way a prospect asks about it: the
  // plumbing, the screen on top of it, and the things we already solved for
  // somebody else. Every row is tagged LIVE (running for a paying client) or
  // DEMO (built and clickable, not yet somebody's production books) — if you
  // add a row here, tag it honestly.
  const BUILD_STACK = [
    {
      icon: '◉',
      kicker: 'THE PIPES',
      title: 'Integrations we wrote ourselves',
      blurb: 'Not Zapier, not a $99/mo connector. Real API work against the systems you already run, on a nightly schedule that just works.',
      items: [
        { t: 'QuickBooks Online — both directions', d: 'Nightly pull of your P&L, balance sheet, and full general-ledger detail. Month-end journal entries pushed back in.', tag: 'LIVE' },
        { t: 'Clover POS', d: 'Every ticket and every line item synced each night — items, sizes, and mix your POS never sends to QuickBooks.', tag: 'LIVE' },
        { t: 'Vendor invoice import', d: 'One click on your supplier\u2019s own portal pulls unit cost and PO number into your books. No re-keying invoices.', tag: 'LIVE' },
        { t: 'Bank & card activity', d: 'Classified against your chart of accounts — operating vs. loans vs. owner\u2019s personal, so the P&L means something.', tag: 'LIVE' },
      ],
    },
    {
      icon: '▣',
      kicker: 'THE DASHBOARD',
      title: 'Built for one business: yours',
      blurb: 'No template, no settings screen you have to learn. We build the views your business is actually run on.',
      items: [
        { t: 'Profit per order', d: 'Revenue, cost, and margin on every single ticket — matched back to what you paid your vendor for that exact item.', tag: 'LIVE' },
        { t: 'Inventory that ties out', d: 'Dated purchase layers, FIFO relief, and a month-end COGS entry ready to post. The dollars reconcile to QuickBooks.', tag: 'LIVE' },
        { t: 'Your own login', d: 'Scoped on the server to exactly one company. A portal user can never name — or see — anybody else\u2019s books.', tag: 'LIVE' },
        { t: 'Ask it a question', d: 'Plain English in, a real answer out — computed from your own numbers, not guessed at by a chatbot.', tag: 'LIVE' },
      ],
    },
    {
      icon: '⬡',
      kicker: 'IDEAS FROM THE FIELD',
      title: 'Built for one client. Now available to any.',
      blurb: 'The best features here started as one owner\u2019s specific headache. Once it is built, everybody gets to use it.',
      items: [
        { t: 'AR desk', d: 'Reads your open invoices out of QuickBooks and sends every statement in one pass, from your own email address.', tag: 'LIVE', href: '/ar-desk' },
        { t: 'Ten-second crew log', d: 'The field logs a day from a phone — and it lands in QuickBooks already coded to the job.', tag: 'DEMO', href: '/quefence' },
        { t: 'WIP schedule & buyer package', d: 'Over/under billing, retainage, normalized EBITDA with add-backs — print-ready for a lender or a buyer.', tag: 'DEMO', href: '/srl' },
        { t: '13-week cash flow', d: 'What is actually landing in the bank, with slow-paying claims and retainage aged in their own column.', tag: 'DEMO', href: '/srl' },
      ],
    },
  ]

  return (
    <>
      <Head>
        <title>JK No Jokes Financials — Custom Dashboards Wired Into Your Systems</title>
        <meta name="description" content="We write the integrations ourselves — QuickBooks both directions, Clover POS, vendor invoices, bank activity — then build the dashboard your business is actually run on. Profit per order, inventory that ties out, month-end entries posted for you." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        /* The promo bar (44px) + nav are fixed, so anchored jumps need clearance. */
        #build, #demos, #demo-preview, #contact { scroll-margin-top: 124px; }
        body {
          background-color: #F5F1EA;
          background-image:
            linear-gradient(rgba(26,32,53,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,32,53,0.05) 1px, transparent 1px);
          background-size: 38px 38px, 38px 38px;
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
        .gold-shimmer { color: #B8943C; }
        .hero-pill-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fff; border: 1px solid #E2D9C5; border-radius: 999px;
          padding: 9px 18px; font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 1.5px; color: #1A2035; box-shadow: 0 8px 24px rgba(26,32,53,0.07);
        }
        .hero-pill { font-family: 'DM Mono', monospace; font-size: 13.5px; letter-spacing: 0.5px; color: #3D4456; font-weight: 500; }

        .build-item-link { display: block; }
        .build-item-link .build-item-title { transition: color 0.15s; }
        .build-item-link:hover .build-item-title { color: #B8943C; }

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
          background: #C9A84C;
          color: #1A1A2E; text-decoration: none;
          font-family: 'DM Mono', monospace; font-size: 13px; letter-spacing: 1px;
          white-space: nowrap; overflow: hidden; padding: 0 16px;
          border-bottom: 1px solid rgba(0,0,0,0.12);
        }
        .promo-bar:hover { background: #D4B65E; }
        .promo-bar b { font-weight: 700; }
        .promo-book {
          background: #1A2035; color: #F0DEAC; padding: 4px 12px; border-radius: 2px;
          font-size: 11px; letter-spacing: 1px; white-space: nowrap;
        }
        .promo-short { display: none; }
        @media (max-width: 600px) {
          .promo-full { display: none; }
          .promo-short { display: inline; }
          .promo-bar { font-size: 11px; letter-spacing: 0.4px; gap: 8px; padding: 0 10px; }
          .promo-book { padding: 4px 10px; font-size: 10px; }
        }

        @media (max-width: 980px) {
          .build-grid { grid-template-columns: 1fr !important; }
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
          border: 'none', color: '#1A1A2E', fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '108px', left: 0, right: 0, zIndex: 99,
          background: '#EEEAE2', borderBottom: '1px solid #DDD8CE', padding: '20px' }}>
          {[
            { label: 'What We Build', to: '#build' },
            { label: 'Demos', to: '/demos' },
            { label: 'How It Works', to: '/how-it-works' },
            { label: 'What You Get', to: '/what-we-do' },
            { label: 'Who We Are', to: '/about' },
            { label: 'Contact', to: '#contact' },
          ].map(item => (
            <button key={item.label} className="nav-link" style={{ display: 'block', padding: '12px 0',
              width: '100%', textAlign: 'left', fontSize: '14px', color: '#1A1A2E' }}
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

      {/* HERO — headline + dashboard */}
      <section style={{ padding: 'clamp(100px,11vw,140px) clamp(14px,5vw,48px) clamp(40px,5vw,64px)', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="hero-title hero-title-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(34px,5.4vw,66px)', lineHeight: 1.08, color: '#1A2035', letterSpacing: '-1.5px' }}>
            We build the <span className="gold-shimmer">software</span><br />behind your numbers.
          </h1>
          <div className="hero-sub" style={{ marginTop: '20px', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(12px,1.5vw,16px)', color: '#B8943C', fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase' }}>
            APIs · Custom Dashboards · Real Books
          </div>
          <p className="hero-sub" style={{ margin: '22px auto 0', maxWidth: '780px', fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, color: '#5A6070' }}>
            QuickBooks, your POS, your vendor portal, your bank — <strong style={{ color: '#1A2035', fontWeight: 600 }}>we write the integrations ourselves</strong>, then build the dashboard your business is actually run on.
          </p>
          <p className="hero-sub" style={{ margin: '16px auto 0', maxWidth: '700px', fontSize: 'clamp(17px,2vw,21px)', lineHeight: 1.4, color: '#1A2035', fontWeight: 500 }}>
            Every idea below started as one client&rsquo;s headache. Now any of them can be yours.
          </p>
          <div className="hero-cta" style={{ marginTop: '32px', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="cta-btn" onClick={() => document.getElementById('build')?.scrollIntoView({ behavior: 'smooth' })}>See What We Build ↓</button>
            <a className="ghost-btn" href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Get Yours Built</a>
          </div>
          <div className="hero-pills" style={{ marginTop: '26px', display: 'flex', gap: 'clamp(16px,3vw,32px)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Live API integrations', '✓ Built, not configured', '✓ Writes back to QuickBooks'].map((t, i) => (
              <span key={i} className="hero-pill">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE BUILD — the pipes, the dashboard, the ideas we already solved */}
      <section id="build" style={{ background: 'linear-gradient(180deg, #FBF9F4 0%, #F4F0E8 100%)', borderTop: '1px solid #EDE8DF', borderBottom: '1px solid #EDE8DF', padding: 'clamp(56px,8vw,96px) clamp(14px,5vw,48px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto clamp(36px,5vw,56px)' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>— WHAT WE BUILD</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(28px,4.2vw,48px)', color: '#1A2035', lineHeight: 1.14, marginBottom: '16px' }}>
              A bookkeeper hands you a report.<br /><span style={{ color: '#B8943C' }}>We hand you a system.</span>
            </h2>
            <p style={{ fontSize: 'clamp(14px,1.6vw,16.5px)', color: '#5A6070', lineHeight: 1.7 }}>
              Three layers, and we do all three: the integrations that move your data, the dashboard that makes sense of it, and the features we already built solving somebody else&rsquo;s version of your problem.
            </p>
          </div>

          <div className="build-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', alignItems: 'stretch' }}>
            {BUILD_STACK.map((col, ci) => (
              <div key={ci} style={{ background: '#fff', border: '1px solid #E6E0D4', padding: 'clamp(22px,2.4vw,30px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '24px', color: '#C9A84C', lineHeight: 1, marginBottom: '16px' }}>{col.icon}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#B8943C', marginBottom: '10px' }}>{col.kicker}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(21px,2.3vw,26px)', fontWeight: 600, color: '#1A2035', lineHeight: 1.24, marginBottom: '12px' }}>{col.title}</h3>
                <p style={{ fontSize: '13.5px', color: '#5A6070', lineHeight: 1.65, marginBottom: '22px' }}>{col.blurb}</p>

                <div style={{ borderTop: '1px solid #EDE8DF', paddingTop: '4px' }}>
                  {col.items.map((it, ii) => {
                    const body = (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flexWrap: 'wrap', marginBottom: '5px' }}>
                          <span className="build-item-title" style={{ fontSize: '14.5px', fontWeight: 600, color: '#1A2035' }}>
                            {it.t}{it.href && <span style={{ color: '#C9A84C', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}> →</span>}
                          </span>
                          <span style={{
                            fontFamily: 'DM Mono, monospace', fontSize: '8.5px', letterSpacing: '1.5px',
                            padding: '2px 7px', borderRadius: '2px', whiteSpace: 'nowrap',
                            color: it.tag === 'LIVE' ? '#1A2035' : '#7A8090',
                            background: it.tag === 'LIVE' ? '#FBF0D4' : '#F1EEE8',
                            border: it.tag === 'LIVE' ? '1px solid #E2CE96' : '1px solid #E2DDD3',
                          }}>{it.tag}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#5A6070', lineHeight: 1.62 }}>{it.d}</div>
                      </>
                    )
                    return (
                      <div key={ii} style={{ padding: '15px 0', borderBottom: ii === col.items.length - 1 ? 'none' : '1px solid #F1EDE5' }}>
                        {it.href
                          ? <a href={it.href} style={{ textDecoration: 'none', display: 'block' }} className="build-item-link">{body}</a>
                          : body}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 'clamp(26px,3vw,36px)', textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: '11.5px', letterSpacing: '1.5px', color: '#7A8090', lineHeight: 1.9 }}>
            <b style={{ color: '#1A2035' }}>LIVE</b> = running against a real client&rsquo;s books today. &nbsp;·&nbsp; <b style={{ color: '#1A2035' }}>DEMO</b> = built and clickable below.
            <br />Don&rsquo;t see the thing your business needs? That&rsquo;s usually the conversation.
          </p>
        </div>
      </section>

      {/* SEE IT RUNNING — demo picker + live preview */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(14px,5vw,48px) clamp(40px,5vw,64px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div id="demos">{(() => {
            const FEATURED = [
              { label: 'Riverside Bakery', sub: 'Products + Consignment', src: '/demo', icon: '🥐' },
              { label: 'Riverside Tires', sub: 'Items + Services', src: '/riverside-tires', icon: '🔩' },
              { label: 'Riverfall Gowns', sub: 'Order Tracking', src: '/riverfall-gowns', icon: '👗' },
              { label: 'Riverside Appliance', sub: 'Service-based', src: '/appliance-repair', icon: '🔧' },
              { label: 'Riverbank Funding', sub: 'Loan Dashboard', src: '/sba-lending', icon: '🏦' },
            ]
            const INDUSTRY = ALL_DEMOS.filter(d => d.href.startsWith('/demos/')).map(d => ({ label: d.biz, sub: d.industry, src: d.href, icon: d.emoji }))
            const DEMOS = [...FEATURED, ...INDUSTRY]
            const active = DEMOS[activeDemo] || DEMOS[0]
            const pick = (i) => { setActiveDemo(i); if (typeof document !== 'undefined') document.getElementById('demo-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
            return (
              <>
                {/* ALL DEMOS — one picker, right under the hero */}
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '10px' }}>— SEE IT RUNNING · {DEMOS.length} DASHBOARDS</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,42px)', color: '#1A2035', lineHeight: 1.15, marginBottom: '12px' }}>
                  Every one of these was built for a different business.
                </h2>
                <div style={{ fontSize: '14px', color: '#5A6070', lineHeight: 1.65, marginBottom: '20px', maxWidth: '760px' }}>Click any one and a working dashboard loads right in the window below — same integrations, same engine, different business underneath. Don&rsquo;t see your industry? We&rsquo;ll build it free.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
                  {DEMOS.map((d, idx) => {
                    const on = activeDemo === idx
                    return (
                      <button key={idx} onClick={() => pick(idx)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: on ? '#1A1A2E' : '#3A4150',
                        padding: '9px 15px', borderRadius: '2px',
                        border: on ? '2px solid #C9A84C' : '1px solid #DDD8CE',
                        background: on ? '#FFF8EC' : '#fff', transition: 'all 0.15s',
                      }}>
                        {idx < FEATURED.length ? d.label : d.sub}
                      </button>
                    )
                  })}
                </div>

                {/* LIVE PREVIEW */}
                <div id="demo-preview" style={{ background: '#1A2035', border: '1px solid #E2D9C5', overflow: 'hidden' }}>
                  {isMobile
                    ? <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#6B7A96', marginBottom: '16px', letterSpacing: '1px' }}>DEMO BEST VIEWED ON DESKTOP</div>
                        <a href={active.src} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', background: '#C9A84C', color: '#1A1A2E', textDecoration: 'none', padding: '14px 28px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px', borderRadius: '4px' }}>
                          OPEN {active.label.toUpperCase()} DEMO →
                        </a>
                      </div>
                    : <iframe key={activeDemo} src={active.src} title={`${active.label} demo`} loading="lazy"
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
            <div style={{ flex: '1 1 300px', maxWidth: '380px', background: '#fff', border: '1px solid #E6E0D4', padding: 'clamp(24px,3vw,34px)', textAlign: 'left' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#A39A86', marginBottom: '14px' }}>MOST REPORTS</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.3, color: '#8A8475' }}>
                Tell you <span style={{ color: '#1A2035', fontWeight: 600 }}>what</span> happened.
              </div>
            </div>

            <div className="jkway-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: '26px', flexShrink: 0 }}>→</div>

            <div style={{ flex: '1 1 300px', maxWidth: '380px', background: '#FBF5E6', border: '1.5px solid #C9A84C', padding: 'clamp(24px,3vw,34px)', textAlign: 'left' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#B8943C', marginBottom: '14px' }}>THE JK WAY™</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.3, color: '#1A2035' }}>
                Shows you <span style={{ color: '#B8943C', fontWeight: 700 }}>why</span> — and what to do next.
              </div>
            </div>
          </div>

          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(12px,1.5vw,15.5px)', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.7, color: '#B8943C', fontWeight: 500, marginTop: '44px' }}>
            Every business is different. Your financial insights should be too.
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderTop: '1px solid #DDD8CE', borderBottom: '1px solid #DDD8CE',
        padding: '16px 0', background: '#EEEAE2', overflow: 'hidden' }}>
        <div className="ticker-inner" style={{ fontFamily: 'DM Mono, monospace',
          fontSize: '12px', letterSpacing: '2px', color: '#7A8090', whiteSpace: 'nowrap' }}>
          {Array(4).fill('QUICKBOOKS API — BOTH DIRECTIONS · CLOVER POS SYNC · VENDOR INVOICE IMPORT · MONTH-END ENTRIES POSTED FOR YOU · PROFIT PER ORDER · FIFO INVENTORY THAT TIES OUT · SCOPED CLIENT PORTALS · PLAIN-ENGLISH ANSWERS ·').join('')}
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
