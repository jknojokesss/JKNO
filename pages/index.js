import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const BOOKING_URL = 'https://calendly.com/jk-jknojokes/30min'
const mono = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

// Cool paper + pine — technical without the cream/gold brochure look.
const C = {
  ink: '#12181E',
  paper: '#F2F4F6',
  paper2: '#E8ECF0',
  line: '#D5DCE4',
  muted: '#5A6570',
  soft: '#8A949E',
  accent: '#0E7C66',
  accentDark: '#0A5C4B',
  accentWash: '#D7EFE8',
  panel: '#152028',
  panelLine: '#2A3640',
  white: '#FFFFFF',
}

const FEATURED = [
  {
    label: 'Wholesale trading',
    src: '/ashford-trading',
    name: 'Ashford Trading',
    blurb: 'Import POs, landed cost, invoices, bank, and P&L on one screen.',
  },
  {
    label: 'Tire shop',
    src: '/riverside-tires',
    name: 'Riverside Tires',
    blurb: 'Clover tickets tied to cost — profit per bay, not just sales.',
  },
  {
    label: 'Bridal retail',
    src: '/riverfall-gowns',
    name: 'Riverfall Gowns',
    blurb: 'Orders, deposits, alterations, and balances from fitting to pickup.',
  },
  {
    label: 'Trade contractor',
    src: '/riverstone-roofing',
    name: 'Riverstone Roofing',
    blurb: 'Job margin, WIP, and cash timing built the way the field actually works.',
  },
]

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
      if (res.ok) setSubmitted(true)
      else alert('Something went wrong. Please email jk@jknojokes.com directly.')
    } catch {
      alert('Something went wrong. Please email jk@jknojokes.com directly.')
    }
    setSubmitting(false)
  }

  const active = FEATURED[activeDemo] || FEATURED[0]

  return (
    <>
      <Head>
        <title>JK No Jokes Financials — Custom portals + books that stay honest</title>
        <meta
          name="description"
          content="We build the software your business runs on — QuickBooks, POS, bank, inventory — and stay on it with you. Custom portals, real integrations, plain-English books."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        #work, #demos, #demo-preview, #operator, #contact { scroll-margin-top: 88px; }
        body {
          background-color: ${C.paper};
          background-image:
            radial-gradient(ellipse 90% 55% at 10% -10%, rgba(14,124,102,0.10), transparent 55%),
            radial-gradient(ellipse 70% 45% at 95% 5%, rgba(21,32,40,0.06), transparent 50%),
            linear-gradient(rgba(18,24,30,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(18,24,30,0.035) 1px, transparent 1px);
          background-size: auto, auto, 40px 40px, 40px 40px;
          background-attachment: fixed;
          color: ${C.ink};
          font-family: 'Figtree', system-ui, sans-serif;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hero-brand { animation: fadeUp 0.7s ease 0s both; }
        .hero-title { animation: fadeUp 0.7s ease 0.08s both; }
        .hero-sub { animation: fadeUp 0.7s ease 0.18s both; }
        .hero-cta { animation: fadeUp 0.7s ease 0.3s both; }
        .demo-frame { animation: riseIn 0.55s ease both; }

        .caret {
          display: inline-block; width: 7px; height: 1em; background: ${C.accent};
          vertical-align: text-bottom; margin-left: 4px; animation: blink 1.1s steps(1) infinite;
        }

        .cta-btn {
          background: ${C.accent};
          color: #fff;
          border: none;
          padding: 15px 28px;
          font-family: ${mono};
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          display: inline-block;
          text-decoration: none;
        }
        .cta-btn:hover { background: ${C.accentDark}; transform: translateY(-1px); }

        .ghost-btn {
          background: transparent;
          color: ${C.accentDark};
          border: 1px solid ${C.accent};
          padding: 14px 26px;
          font-family: ${mono};
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        .ghost-btn:hover { background: ${C.accentWash}; }

        input, textarea {
          width: 100%;
          background: ${C.white};
          border: 1px solid ${C.line};
          color: ${C.ink};
          padding: 14px 16px;
          font-family: 'Figtree', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, textarea:focus { border-color: ${C.accent}; }
        input::placeholder, textarea::placeholder { color: ${C.soft}; }

        .nav-link {
          color: ${C.muted};
          text-decoration: none;
          font-size: 13px;
          font-family: ${mono};
          letter-spacing: 0.6px;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
        }
        .nav-link:hover { color: ${C.accentDark}; }

        .pill {
          cursor: pointer;
          font-family: 'Figtree', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          padding: 9px 16px;
          border: 1px solid ${C.line};
          background: ${C.white};
          color: ${C.muted};
          transition: all 0.15s;
        }
        .pill.on {
          border-color: ${C.accent};
          background: ${C.accentWash};
          color: ${C.accentDark};
        }

        .feature {
          background: ${C.white};
          border: 1px solid ${C.line};
          padding: clamp(24px, 2.6vw, 30px);
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature:hover { border-color: ${C.accent}; transform: translateY(-2px); }

        @media (max-width: 900px) {
          .split-2 { grid-template-columns: 1fr !important; gap: 28px !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hero-title-text { font-size: 34px !important; }
          .nav-tagline { display: none; }
          .cta-btn, .ghost-btn { padding: 13px 18px !important; font-size: 11px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '18px 28px',
        background: scrolled ? 'rgba(242,244,246,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.line}` : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, letterSpacing: '-0.6px', color: C.ink }}>
            JK<span style={{ color: C.accent }}>.</span>
          </span>
          <span className="nav-tagline" style={{ fontFamily: mono, fontSize: '12px', fontWeight: 500, letterSpacing: '3px', color: C.ink }}>
            NO&nbsp;JOKES&nbsp;FINANCIALS
          </span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button className="nav-link" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>Work</button>
            <button className="nav-link" onClick={() => document.getElementById('operator')?.scrollIntoView({ behavior: 'smooth' })}>How we work</button>
            <button className="nav-link" onClick={() => router.push('/about')}>About</button>
            <button className="nav-link" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
            <button className="cta-btn" style={{ padding: '10px 18px', fontSize: '11px' }} onClick={() => router.push('/login')}>
              Client Login
            </button>
          </div>
        )}
        {isMobile && (
          <button
            style={{ background: 'none', border: 'none', color: C.ink, fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
          background: C.white, borderBottom: `1px solid ${C.line}`, padding: '20px',
        }}>
          {[
            { label: 'Work', to: '#demos' },
            { label: 'How we work', to: '#operator' },
            { label: 'About', to: '/about' },
            { label: 'Contact', to: '#contact' },
          ].map((item) => (
            <button
              key={item.label}
              className="nav-link"
              style={{ display: 'block', padding: '12px 0', width: '100%', textAlign: 'left', fontSize: '14px', color: C.ink }}
              onClick={() => {
                if (item.to.startsWith('#')) document.getElementById(item.to.slice(1))?.scrollIntoView({ behavior: 'smooth' })
                else router.push(item.to)
                setMenuOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
          <button className="cta-btn" style={{ marginTop: '16px', width: '100%', textAlign: 'center' }} onClick={() => router.push('/login')}>
            Client Login
          </button>
        </div>
      )}

      {/* HERO — brand first, one job */}
      <section style={{ padding: 'clamp(104px,11vw,140px) clamp(16px,5vw,48px) clamp(28px,4vw,40px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="hero-brand" style={{ fontFamily: mono, fontSize: '12px', letterSpacing: '3px', color: C.accentDark, marginBottom: '22px', fontWeight: 600 }}>
            JK NO JOKES FINANCIALS
          </div>
          <h1
            className="hero-title hero-title-text"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(36px,5.6vw,62px)',
              lineHeight: 1.06,
              color: C.ink,
              letterSpacing: '-1.4px',
            }}
          >
            The software behind<br />
            your numbers — and<br />
            someone who stays on it.
          </h1>
          <p className="hero-sub" style={{ margin: '22px auto 0', maxWidth: '540px', fontSize: 'clamp(16px,1.9vw,19px)', lineHeight: 1.65, color: C.muted }}>
            We wire QuickBooks, your register, and your bank into one portal built for how you actually operate. Then we keep the books honest.
          </p>
          <div className="hero-cta" style={{ marginTop: '32px', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button className="cta-btn" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>
              See real portals ↓
            </button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">
              Book a call
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED WORK — 4 anonymized portals from live builds */}
      <section id="demos" style={{ padding: '0 clamp(14px,5vw,48px) clamp(40px,5vw,64px)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', color: C.soft, marginBottom: '8px' }}>
              SAMPLE PORTALS · FICTIONAL NAMES · SHAPED LIKE LIVE WORK
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
            {FEATURED.map((d, idx) => (
              <button
                key={d.src}
                className={`pill${activeDemo === idx ? ' on' : ''}`}
                onClick={() => {
                  setActiveDemo(idx)
                  if (typeof document !== 'undefined') document.getElementById('demo-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div
            id="demo-preview"
            className="demo-frame"
            key={activeDemo}
            style={{
              background: C.panel,
              border: `1px solid ${C.panelLine}`,
              borderRadius: '10px',
              padding: 'clamp(8px,1vw,12px)',
              boxShadow: '0 22px 60px rgba(18,24,30,0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '2px 4px 10px' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ marginLeft: '10px', fontFamily: mono, fontSize: '11.5px', color: '#8A969F' }}>
                {active.name.toLowerCase()} — sample portal
              </span>
            </div>
            {isMobile ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#0D1418', borderRadius: '6px' }}>
                <div style={{ fontFamily: mono, fontSize: '11px', color: '#7A8791', marginBottom: '10px', letterSpacing: '1px' }}>
                  BEST ON A WIDER SCREEN
                </div>
                <p style={{ color: '#A8B2B9', fontSize: '14px', marginBottom: '18px', lineHeight: 1.5 }}>{active.blurb}</p>
                <a
                  href={active.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', background: C.accent, color: '#fff', textDecoration: 'none',
                    padding: '14px 24px', fontFamily: mono, fontSize: '12px', letterSpacing: '1.5px',
                  }}
                >
                  OPEN {active.label.toUpperCase()} →
                </a>
              </div>
            ) : (
              <iframe
                key={activeDemo}
                src={active.src}
                title={`${active.name} portal`}
                loading="lazy"
                style={{ display: 'block', width: '100%', height: '460px', border: 'none', borderRadius: '6px', background: C.paper }}
              />
            )}
          </div>

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: C.muted, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
            {active.blurb}{' '}
            <a href={active.src} target="_blank" rel="noopener noreferrer" style={{ color: C.accentDark }}>Open full screen</a>
            {' · '}
            <button
              onClick={() => router.push('/demos')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.accentDark, fontSize: '14px', textDecoration: 'underline', textUnderlineOffset: '3px', fontFamily: 'inherit' }}
            >
              More industries
            </button>
          </p>
        </div>
      </section>

      {/* OPERATOR + INTEGRATIONS */}
      <section id="operator" style={{ padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,48px) clamp(48px,6vw,72px)' }}>
        <div className="split-2" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '36px', alignItems: 'stretch' }}>
          {/* Human */}
          <div style={{ background: C.white, border: `1px solid ${C.line}`, padding: 'clamp(28px,3vw,36px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
              <img
                src="/1779727210800.jpg"
                alt="Jonathan Katz"
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}`, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
                  Jonathan Katz
                </div>
                <div style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '1.4px', color: C.accentDark, marginTop: '4px' }}>
                  FOUNDER · BUILDS + RUNS THE BOOKS
                </div>
              </div>
            </div>
            <p style={{ fontSize: '16px', color: C.muted, lineHeight: 1.75, marginBottom: '16px' }}>
              I’m not selling you a login and walking away. I write the integrations, build the screens your team actually uses, and stay close enough that the numbers mean something when you open them.
            </p>
            <p style={{ fontSize: '16px', color: C.muted, lineHeight: 1.75, marginBottom: '20px' }}>
              Most clients sit around <strong style={{ color: C.ink, fontWeight: 600 }}>$750–$1,000 / month</strong> once a portal is live. Setup is separate. Scope depends on how many systems we wire.
            </p>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ghost-btn">
              Talk it through →
            </a>
          </div>

          {/* Terminal — software proof */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              background: C.panel, border: `1px solid ${C.panelLine}`, borderBottom: 'none', borderRadius: '6px 6px 0 0',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A4650' }} />
              <span style={{ marginLeft: '10px', fontFamily: mono, fontSize: '11.5px', color: '#8A969F' }}>nightly-close.log</span>
            </div>
            <div style={{
              background: C.panel, border: `1px solid ${C.panelLine}`, borderRadius: '0 0 6px 6px',
              padding: 'clamp(22px,2.5vw,30px)', fontFamily: mono, fontSize: 'clamp(11.5px,1.3vw,13.5px)', lineHeight: 2.05,
            }}>
              {[
                ['quickbooks', 'P&L · balance sheet · GL pulled'],
                ['pos / bank', 'tickets & activity classified'],
                ['vendors', 'unit cost + PO matched'],
                ['inventory', 'FIFO relief computed'],
                ['reconcile', 'ties before anything posts'],
                ['operator', 'reviewed · exceptions flagged'],
              ].map(([step, detail]) => (
                <div key={step} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ color: C.accent }}>✓</span>
                  <span style={{ color: '#E8EEF1', minWidth: '104px' }}>{step}</span>
                  <span style={{ color: '#8A969F' }}>{detail}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.panelLine}`, color: '#A8B2B9' }}>
                <span style={{ color: C.accent }}>{'>'}</span> we wire it · we watch it · we close it
                <span className="caret" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="work" style={{ padding: '0 clamp(16px,5vw,48px) clamp(56px,7vw,88px)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(26px,3.4vw,36px)', fontWeight: 600, letterSpacing: '-0.6px', color: C.ink }}>
              Software when you need it. A person when it matters.
            </h2>
          </div>
          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              {
                kicker: 'INTEGRATIONS',
                title: 'We write the pipes',
                body: 'QuickBooks both ways, Clover, vendor invoices, bank feeds — on a schedule that runs. Not a Zapier mashup you babysit.',
              },
              {
                kicker: 'YOUR PORTAL',
                title: 'Built around one business',
                body: 'Profit per order, inventory that ties out, AR that actually gets chased. Screens shaped like your operation, not a template.',
              },
              {
                kicker: 'THE OPERATOR',
                title: 'Someone is accountable',
                body: 'Month-end doesn’t “happen by itself.” Exceptions get reviewed. You get plain English when something looks off.',
              },
            ].map((f) => (
              <div key={f.title} className="feature">
                <div style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: C.accentDark, marginBottom: '12px' }}>{f.kicker}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, color: C.ink, marginBottom: '10px', lineHeight: 1.25 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '14.5px', color: C.muted, lineHeight: 1.7 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: 'clamp(48px,6vw,72px) clamp(16px,5vw,48px)', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2.5px', color: C.accentDark, marginBottom: '14px' }}>
            — GET IN TOUCH
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: '14px' }}>
            Tell us how the business runs.
          </h2>
          <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.7 }}>
            We’ll show you what a portal would look like for your stack — and whether it makes sense before anyone writes a check.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '48px 28px', border: `1px solid ${C.accent}`, background: C.accentWash }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 600, marginBottom: '10px' }}>Got it.</div>
            <div style={{ color: C.muted, fontSize: '14px' }}>Expect a note from us within a day.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['YOUR NAME', 'name', 'text', 'Your name'],
              ['EMAIL ADDRESS', 'email', 'email', 'you@company.com'],
              ['BUSINESS NAME', 'business', 'text', 'Business name'],
            ].map(([label, key, type, ph]) => (
              <div key={key}>
                <label style={{ display: 'block', fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: C.muted, marginBottom: '8px' }}>
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <button
              className="cta-btn"
              style={{ width: '100%', textAlign: 'center', padding: '17px', marginTop: '4px', opacity: (!form.name || !form.email || !form.business) ? 0.5 : 1 }}
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.email || !form.business}
            >
              {submitting ? 'SENDING...' : 'SEND MESSAGE →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: C.muted, fontFamily: mono, marginTop: '6px' }}>
              Or email jk@jknojokes.com
            </p>
          </div>
        )}
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '28px clamp(16px,5vw,48px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700 }}>
            JK<span style={{ color: C.accent }}>.</span>
          </div>
          <button className="ghost-btn" style={{ padding: '9px 16px', fontSize: '11px' }} onClick={() => router.push('/login')}>
            CLIENT LOGIN →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: mono, fontSize: '11px', color: C.soft, letterSpacing: '1px' }}>
            © {new Date().getFullYear()} JK NO JOKES FINANCIALS
          </div>
          <div style={{ display: 'flex', gap: '22px' }}>
            <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '10px', color: C.soft, letterSpacing: '1px' }}>PRIVACY</button>
            <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '10px', color: C.soft, letterSpacing: '1px' }}>TERMS</button>
          </div>
        </div>
      </footer>
    </>
  )
}
