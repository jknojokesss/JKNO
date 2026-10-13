import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import { painLineForDemo } from '../lib/homeSamplePains'
import DemoGalleryCard from './DemoGalleryCard'

const START_STEPS = [
  'Quick call — what you sell and what you want on screen.',
  'I connect QuickBooks and your tools, then build your portal.',
  'You sign in on real data; we adjust until it clicks.',
]

const TRADES = [
  'Multiple businesses / portfolio',
  'Tire / auto',
  'Contractor / trades',
  'Import / wholesale',
  'Retail / custom orders',
  'Property / professional services',
  'Other',
]

const BOOKS = [
  'QuickBooks Online',
  'QuickBooks Desktop',
  'Spreadsheet / accountant only',
  'Other software',
]

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function HomeLanding({
  form,
  setForm,
  onSubmit,
  submitted,
  submitting,
}) {
  const router = useRouter()
  const [motionOn, setMotionOn] = useState(false)

  useEffect(() => {
    setMotionOn(true)
  }, [])

  return (
    <div className={`m-jk-home${motionOn ? ' m-jk-home--motion-on' : ''}`}>
      <header className={`m-jk-home__hero m-jk-home__hero--enter${motionOn ? ' m-jk-home__hero--motion' : ''}`} id="top">
        <p className="m-jk-home__mark" aria-hidden="true">
          JK<span className="m-jk-home__mark-dot">.</span>
        </p>
        <h1 className="m-jk-home__h1">
          Custom portals for owners — your numbers, your login.
        </h1>
        <p className="m-jk-home__lead">
          I build the screens you keep asking for on the phone — margin, who owes you, what is in the bank — wired to
          how you actually sell. Keep your bookkeeper, or have me handle the books too.
        </p>
        <div className="m-jk-home__hero-actions">
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--primary"
            onClick={() => scrollTo('samples')}
          >
            Open sample portals
          </button>
        </div>
        <p className="m-jk-home__hero-secondary">
          <button type="button" className="m-jk-home__link" onClick={() => scrollTo('contact')}>
            Tell me what you need
          </button>
          {' · '}
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-jk-home__link">
            Book a call
          </a>
        </p>
      </header>

      <div className="m-jk-home__flow">
        <section className="m-jk-home__panel m-jk-home__panel--samples" id="samples">
          <h2 className="m-jk-story__title">Sample portals</h2>
          <p className="m-jk-story__body m-jk-story__body--tight">
            Fictitious company names. No password — click one and look around.
          </p>
          <div className="m-jk-home__demos m-jk-home__demos--lead m-jk-stagger-cards">
            {HERO_SAMPLE_BARS.map((p) => (
              <DemoGalleryCard
                key={p.href}
                href={p.href}
                biz={p.name}
                pain={painLineForDemo(p.href)}
                compact
              />
            ))}
          </div>
          <button
            type="button"
            className="m-jk-text-link"
            onClick={() => router.push('/demos')}
          >
            All samples (including multi-business hub)
          </button>
        </section>

        <section className="m-jk-home__plain" id="offer">
          <h2 className="m-jk-story__title">Portal first — books optional</h2>
          <p className="m-jk-story__body">
            Keep your bookkeeper or bring me the books — either way you get a portal built on your numbers, not a template
            off the shelf. QuickBooks stays the books; the portal is where you actually look. One company per login on
            production builds; you get me, not a ticket queue.
          </p>
          <ol className="m-jk-steps">
            {START_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            type="button"
            className="m-jk-text-link"
            onClick={() => router.push('/how-it-works')}
          >
            More on how it works
          </button>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--form" id="contact">
          <h2>Tell me what you need</h2>
          <p className="m-jk-home__lede">
            Your trade and the screen you wish you had — I&rsquo;ll send the closest sample or point you at{' '}
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              a call
            </a>
            .
          </p>
          {submitted ? (
            <p className="m-jk-home__lede" style={{ marginBottom: 0 }}>Got it. I&rsquo;ll be in touch.</p>
          ) : (
            <>
              {[
                { key: 'name', label: 'Your name', type: 'text', placeholder: 'Your name' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'you@yourshop.com' },
                { key: 'business', label: 'Business', type: 'text', placeholder: 'Shop name' },
              ].map(({ key, label, type, placeholder }) => (
                <label key={key} className="m-label" style={{ marginTop: key === 'name' ? 0 : 14, display: 'block' }}>
                  {label}
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </label>
              ))}

              <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
                Trade
                <select
                  className="m-select"
                  value={form.trade}
                  onChange={(e) => setForm({ ...form, trade: e.target.value })}
                >
                  <option value="">Select</option>
                  {TRADES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
                Books today
                <select
                  className="m-select"
                  value={form.quickbooks}
                  onChange={(e) => setForm({ ...form, quickbooks: e.target.value })}
                >
                  <option value="">Select</option>
                  {BOOKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </label>

              <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
                The screen you want
                <textarea
                  rows={3}
                  placeholder="Profit per ticket, who still owes me, jobs in progress…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </label>

              <button
                type="button"
                className="m-btn m-btn--gold m-btn--pop"
                style={{ width: '100%', marginTop: 18 }}
                onClick={onSubmit}
                disabled={
                  submitting
                  || !form.name
                  || !form.email
                  || !form.business
                  || !form.trade
                  || !form.quickbooks
                }
              >
                {submitting ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
