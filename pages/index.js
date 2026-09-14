import { useState } from 'react'
import { useRouter } from 'next/router'
import MarketingShell from '../components/MarketingShell'
import DemoPreview from '../components/DemoPreview'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK, BUSINESS_TYPES } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_OUTCOMES, PAIN_POINTS, HOW_STEPS, PROOF_LINES } from '../lib/homeContent'

const HOME_DEMOS = FEATURED_DEMOS.filter((d) =>
  ['Tire shop', 'Roofing', 'Fencing', 'Bridal shop', 'Property mgmt', 'Import & distro', 'Collections'].includes(d.label)
)

export default function Landing() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', business: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.business) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          business: form.business,
          message: form.message || undefined,
        }),
      })
      if (res.ok) setSubmitted(true)
      else alert('Something went wrong. Please email jk@jknojokes.com directly.')
    } catch {
      alert('Something went wrong. Please email jk@jknojokes.com directly.')
    }
    setSubmitting(false)
  }

  return (
    <MarketingShell
      padTop={false}
      title="JK No Jokes Financials — Custom Dashboards Wired Into Your Systems"
      description="Custom financial portals wired into QuickBooks — profit per job, inventory, AR, and month-end close. Built for shops, contractors, wholesalers, and property managers."
    >
      {/* HERO */}
      <section className="m-hero">
        <div className="m-wrap m-hero__inner">
          <div className="m-hero__copy">
            <div className="m-kicker">Custom financial portals</div>
            <h1 className="m-h1" style={{ marginBottom: '18px' }}>
              Stop guessing.<br />
              <span className="m-gold-text">See what you&rsquo;re making.</span>
            </h1>
            <p className="m-lead" style={{ marginBottom: '28px', maxWidth: '480px' }}>
              We connect QuickBooks to the systems you already run — register, distributors, vendors, bank — and build one portal that shows profit per sale, job, or order. Updated every night.
            </p>
            <div className="m-hero__actions">
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--primary">
                Book a free call
              </a>
              <button type="button" className="m-btn m-btn--secondary" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>
                See a live demo
              </button>
            </div>
          </div>
          <div className="m-hero__outcomes">
            {HERO_OUTCOMES.map((o) => (
              <div key={o.stat} className="m-outcome-card">
                <div className="m-outcome-card__stat">{o.stat}</div>
                <div className="m-outcome-card__detail">{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF TICKER */}
      <section className="m-proof-strip" aria-hidden="true">
        <div className="m-proof-strip__track">
          {[...PROOF_LINES, ...PROOF_LINES].map((line, i) => (
            <span key={i} className="m-proof-strip__item">{line}</span>
          ))}
        </div>
      </section>

      {/* LIVE DEMOS */}
      <section className="m-section--panel" style={{ padding: 'clamp(36px,5vw,52px) 0 clamp(32px,4vw,44px)' }}>
        <div className="m-wrap--wide">
          <div style={{ marginBottom: '20px', maxWidth: '640px' }}>
            <div className="m-kicker">Live demos</div>
            <h2 className="m-h2" style={{ fontSize: 'clamp(22px, 3vw, 32px)', marginBottom: '10px' }}>
              Click in. This is what we build.
            </h2>
            <p className="m-lead" style={{ fontSize: '16px' }}>
              Real dashboards — sample data, no login. Pick your industry and scroll around.
            </p>
          </div>
          <DemoPreview demos={HOME_DEMOS} onMoreDemos={() => router.push('/demos')} />
          <p style={{ marginTop: '20px', fontSize: '15px', color: '#48536A', lineHeight: 1.6, maxWidth: '640px' }}>
            <strong style={{ color: '#0E1420', fontWeight: 600 }}>Pulled, matched, reconciled every night.</strong>{' '}
            Nothing goes live until it ties out to QuickBooks.
          </p>
        </div>
      </section>

      {/* PAIN → FIX */}
      <section className="m-section">
        <div className="m-wrap">
          <div className="m-kicker">Sound familiar?</div>
          <h2 className="m-h2" style={{ marginBottom: '28px', maxWidth: '520px' }}>
            Your books are fine. Your visibility isn&rsquo;t.
          </h2>
          <div className="m-pain-grid">
            {PAIN_POINTS.map((p) => (
              <div key={p.pain} className="m-pain-card">
                <p className="m-pain-card__pain">{p.pain}</p>
                <p className="m-pain-card__fix">{p.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE BUILD FOR */}
      <section className="m-section--panel" style={{ padding: 'clamp(48px,6vw,64px) 0' }}>
        <div className="m-wrap">
          <div className="m-kicker">Who this is for</div>
          <h2 className="m-h2" style={{ marginBottom: '24px' }}>If you run on QuickBooks and fly blind, we built this for you.</h2>
          <div className="m-types-grid">
            {BUSINESS_TYPES.map((t) => (
              <div key={t.label} className="m-type-card">
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#0E1420' }}>{t.label}</div>
                <div style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.55 }}>{t.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="m-section">
        <div className="m-wrap">
          <div className="m-kicker">How it works</div>
          <h2 className="m-h2" style={{ marginBottom: '28px' }}>Live in about a week. No software to learn.</h2>
          <div className="m-how-strip">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="m-step-card">
                <div className="m-step-card__n">{s.n}</div>
                <h3 className="m-step-card__title">{s.title}</h3>
                <p className="m-step-card__body">{s.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '24px', textAlign: 'center' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/how-it-works')}>Full timeline →</button>
          </p>
        </div>
      </section>

      {/* WHAT WE BUILD */}
      <section id="build" className="m-section--panel" style={{ padding: 'clamp(48px,6vw,64px) 0' }}>
        <div className="m-wrap">
          <div className="m-kicker">What we build</div>
          <h2 className="m-h2" style={{ marginBottom: '24px' }}>Integrations, dashboard, and close — one engine.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {BUILD_STACK.map((col) => (
              <div key={col.title} className="m-card" style={{ borderLeftWidth: '3px', padding: '20px 22px' }}>
                <div className="m-kicker" style={{ marginBottom: '8px' }}>{col.kicker.replace(/^THE /, '')}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.25 }}>
                  {col.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.55, marginBottom: '14px' }}>{col.blurb}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {col.items.slice(0, 3).map((it) => (
                    <li key={it.t} style={{ fontSize: '13px', color: '#0E1420', padding: '6px 0', borderTop: '1px solid #EEF1F5', lineHeight: 1.4 }}>
                      {it.href ? (
                        <a href={it.href} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#B8943C' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#0E1420' }}>
                          {it.t} →
                        </a>
                      ) : it.t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '14px' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/what-we-do')}>Everything we build →</button>
          </p>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="m-cta-band">
        <div className="m-wrap m-cta-band__inner">
          <div>
            <h2 className="m-h2" style={{ fontSize: 'clamp(22px, 3vw, 30px)', marginBottom: '8px' }}>
              We&rsquo;ll build a demo around your business before you pay anything.
            </h2>
            <p className="m-lead" style={{ fontSize: '16px', margin: 0, maxWidth: '480px' }}>
              30 minutes on a call. Tell us what you run. We show you what we&rsquo;d wire up.
            </p>
          </div>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--primary m-cta-band__btn">
            Book a free call
          </a>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: 'clamp(48px,6vw,64px) 0' }}>
        <div className="m-wrap m-contact-grid">
          <div>
            <div className="m-kicker">Get started</div>
            <h2 className="m-h2" style={{ marginBottom: '14px', fontSize: 'clamp(22px, 2.8vw, 30px)' }}>
              What would you want on one screen?
            </h2>
            <p className="m-lead" style={{ fontSize: '16px', marginBottom: '20px' }}>
              Name, email, and what you run. We&rsquo;ll reply with whether we can help and what a first version would look like.
            </p>
            <div style={{ fontSize: '14px', color: '#5A6577', lineHeight: 1.7 }}>
              <a href="mailto:jk@jknojokes.com" style={{ color: '#0E1420', fontWeight: 600 }}>jk@jknojokes.com</a>
              <br />
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#B8943C', fontWeight: 600 }}>Or book a call directly →</a>
            </div>
          </div>

          {submitted ? (
            <div className="m-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>We&rsquo;ll be in touch.</div>
              <p style={{ fontSize: '15px', color: '#48536A' }}>Usually within one business day.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'name', label: 'Your name', type: 'text', placeholder: 'John Smith' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
                { key: 'business', label: 'Business & what you sell', type: 'text', placeholder: 'Tire shop · wholesale · roofing contractor…' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="m-label">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="m-label">What do you want to see? <span style={{ fontWeight: 400, color: '#9AA3BD' }}>(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Profit per job, inventory that ties out, AR aging, owner statements…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              <button
                type="button"
                className="m-btn m-btn--primary"
                style={{ width: '100%', marginTop: '4px' }}
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email || !form.business}
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  )
}
