import { useState } from 'react'
import { useRouter } from 'next/router'
import MarketingShell from '../components/MarketingShell'
import DemoPreview from '../components/DemoPreview'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'

// Five tabs cover the main product patterns; the rest live on /demos.
const HOME_DEMOS = FEATURED_DEMOS.filter((d) =>
  ['Tire shop', 'Roofing', 'Fencing', 'Bridal shop', 'Property mgmt', 'Import & distro', 'Collections'].includes(d.label)
)

export default function Landing() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <MarketingShell
      padTop={false}
      title="JK No Jokes Financials — Custom Dashboards Wired Into Your Systems"
      description="Custom financial portals wired into QuickBooks — POS, distributor invoices, wholesale billing, job costing, inventory, AR, and month-end close."
    >
      {/* HERO */}
      <section style={{ padding: 'clamp(64px,8vw,88px) 24px 28px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 className="m-h1" style={{ marginBottom: '16px' }}>
            We build the <span style={{ color: '#C9A84C' }}>software</span><br />behind your numbers.
          </h1>
          <p className="m-lead" style={{ margin: '0 auto 20px', maxWidth: '520px', fontSize: '17px' }}>
            We connect QuickBooks to the systems you already run, then build one portal that shows what you&rsquo;re actually making.
          </p>
          <button className="m-btn m-btn--primary" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}>
            See a real one ↓
          </button>
        </div>
      </section>

      {/* LIVE DEMOS */}
      <section className="m-section--panel" style={{ padding: 'clamp(28px,4vw,40px) 0 clamp(32px,4vw,44px)' }}>
        <div className="m-wrap--wide">
          <DemoPreview demos={HOME_DEMOS} onMoreDemos={() => router.push('/demos')} />
          <p style={{ marginTop: '20px', fontSize: '15px', color: '#48536A', lineHeight: 1.6, textAlign: 'center', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
            <strong style={{ color: '#0E1420', fontWeight: 600 }}>Pulled, matched, reconciled every night.</strong>{' '}
            QuickBooks, your register, vendor invoices, inventory — nothing goes live until it ties out.
          </p>
        </div>
      </section>

      {/* WHAT WE BUILD — 3 cards, production rhythm */}
      <section id="build" style={{ padding: 'clamp(36px,5vw,48px) 0' }}>
        <div className="m-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {BUILD_STACK.slice(0, 3).map((col) => (
              <div key={col.title} className="m-card" style={{ borderLeftWidth: '3px', padding: '18px 20px' }}>
                <div className="m-kicker" style={{ marginBottom: '8px' }}>{col.kicker.replace(/^THE /, '')}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.25 }}>
                  {col.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.55 }}>{col.blurb}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '18px', textAlign: 'center', fontSize: '14px' }}>
            <button className="m-btn--text" onClick={() => router.push('/what-we-do')}>Everything we build →</button>
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="m-section--panel" style={{ padding: 'clamp(40px,5vw,56px) 0' }}>
        <div className="m-wrap" style={{ maxWidth: '480px' }}>
          <h2 className="m-h2" style={{ marginBottom: '20px', textAlign: 'center', fontSize: 'clamp(20px, 2.5vw, 26px)' }}>
            What would you want built first?
          </h2>

          {submitted ? (
            <div className="m-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 600 }}>We&rsquo;ll be in touch.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'name', label: 'Your name', type: 'text', placeholder: 'John Smith' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
                { key: 'business', label: 'Business name', type: 'text', placeholder: 'Acme Corp' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="m-label">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <button
                className="m-btn m-btn--primary"
                style={{ width: '100%', marginTop: '4px' }}
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email || !form.business}
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9AA3BD' }}>
                Or <a href="mailto:jk@jknojokes.com" style={{ color: '#5A6577' }}>jk@jknojokes.com</a>
                {' · '}
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#5A6577' }}>book a call</a>
              </p>
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  )
}
