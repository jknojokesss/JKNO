import { useState } from 'react'
import { useRouter } from 'next/router'
import MarketingShell from '../components/MarketingShell'
import HomeIntro from '../components/HomeIntro'
import DemoPreview from '../components/DemoPreview'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'

const HOME_DEMOS = FEATURED_DEMOS.filter((d) =>
  ['Tire shop', 'Roofing', 'Fencing', 'Bridal shop', 'Property mgmt', 'Import & distro', 'Collections'].includes(d.label)
)

export default function Landing() {
  const router = useRouter()
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return !!sessionStorage.getItem('jk-home-intro-seen')
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
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

  const scrollDemos = () => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <MarketingShell
      padTop={false}
      darkHeader={!introDone}
      title="JK No Jokes Financials — Custom Dashboards Wired Into Your Systems"
      description="Custom financial portals wired into QuickBooks — POS, distributor invoices, wholesale billing, job costing, inventory, AR, and month-end close."
    >
      <HomeIntro onDone={() => setIntroDone(true)} />

      <div className={`m-home${introDone ? ' m-home--live' : ''}`}>
        <section className="m-stage">
          <div className="m-wrap m-stage__inner">
            <h1 className="m-stage__title">
              We build the software<br />behind your numbers.
            </h1>
            <p className="m-stage__sub">
              QuickBooks wired to your register, distributors, and vendors — one portal, updated every night.
            </p>
            <button type="button" className="m-btn m-btn--primary m-btn--pop m-stage__btn" onClick={scrollDemos}>
              See a real one ↓
            </button>
          </div>
        </section>

        <section className="m-section--panel m-home__demos" style={{ padding: 'clamp(20px,3vw,32px) 0 clamp(28px,3vw,40px)' }}>
          <div className="m-wrap--wide">
            <DemoPreview demos={HOME_DEMOS} onMoreDemos={() => router.push('/demos')} />
          </div>
        </section>

        <section id="build" style={{ padding: 'clamp(32px,4vw,44px) 0' }}>
          <div className="m-wrap">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {BUILD_STACK.slice(0, 3).map((col) => (
                <div key={col.title} className="m-card m-card--pop" style={{ borderLeftWidth: '3px', padding: '18px 20px' }}>
                  <div className="m-kicker" style={{ marginBottom: '8px' }}>{col.kicker.replace(/^THE /, '')}</div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.25 }}>
                    {col.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.55 }}>{col.blurb}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
              <button type="button" className="m-btn--text" onClick={() => router.push('/what-we-do')}>Everything we build →</button>
            </p>
          </div>
        </section>

        <section id="contact" className="m-section--panel" style={{ padding: 'clamp(36px,4vw,48px) 0' }}>
          <div className="m-wrap" style={{ maxWidth: '440px' }}>
            <h2 className="m-h2" style={{ marginBottom: '18px', textAlign: 'center', fontSize: 'clamp(20px, 2.5vw, 26px)' }}>
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
                  type="button"
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
      </div>
    </MarketingShell>
  )
}
