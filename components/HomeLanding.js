import { useState } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import DemoGalleryCard from './DemoGalleryCard'

const SITE_FEATURES = [
  {
    tag: 'Open week',
    title: 'Margin while tickets are still ringing',
    body: 'Match register, vendor, or job data to what you sold — before the month is closed.',
  },
  {
    tag: 'Closed month',
    title: 'Books you can defend',
    body: 'Official statements and GL in the portal. Nightly sync — not a spreadsheet rebuild.',
  },
  {
    tag: 'Your shop',
    title: 'Not a template with your logo pasted on',
    body: 'Your sign-in, your nav, your colors. One login, one company.',
  },
  {
    tag: 'Short build',
    title: 'Days on the calendar, not a quarter-long IT project',
    body: 'Kickoff call, wire-up, your login. You click through on real data before anything stays live.',
  },
]

const TRADES = [
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
  const [featureIx, setFeatureIx] = useState(0)
  const activeFeature = SITE_FEATURES[featureIx]

  return (
    <div className="m-jk-home">
      <header className="m-jk-home__hero" id="top">
        <p className="m-jk-home__mark" aria-hidden="true">
          JK<span className="m-jk-home__mark-dot">.</span>
        </p>
        <h1 className="m-jk-home__h1">
          Your accountant has the month.
          <br />
          You need <em className="m-jk-home__today">TODAY</em>.
        </h1>
        <p className="m-jk-home__lead">
          Margin while the week is still open — then a close that ties to QuickBooks. Built for owners who are done rebuilding the same screen every Monday.
        </p>
        <div className="m-jk-home__hero-actions">
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--primary"
            onClick={() => scrollTo('samples')}
          >
            Open a sample
          </button>
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--ghost"
            onClick={() => scrollTo('contact')}
          >
            Start a build
          </button>
        </div>
      </header>

      <div className="m-jk-home__flow">
        <section className="m-jk-home__panel m-jk-home__panel--features" id="features">
          <h2>What you actually get</h2>
          <p className="m-jk-home__lede">
            Operating screens for the week you&rsquo;re in — plus a close that lines up with the books.
          </p>
          <div className="m-jk-feature-picker">
            <div className="m-jk-feature-picker__tabs" role="tablist" aria-label="What you get">
              {SITE_FEATURES.map((f, i) => (
                <button
                  key={f.tag}
                  type="button"
                  role="tab"
                  id={`feature-tab-${i}`}
                  aria-selected={featureIx === i}
                  aria-controls="feature-panel"
                  className={`m-jk-feature-picker__tab${featureIx === i ? ' is-active' : ''}`}
                  onClick={() => setFeatureIx(i)}
                >
                  {f.tag}
                </button>
              ))}
            </div>
            <div
              className="m-jk-feature-picker__stage"
              role="tabpanel"
              id="feature-panel"
              aria-labelledby={`feature-tab-${featureIx}`}
              key={featureIx}
            >
              <h3 className="m-jk-feature-picker__title">{activeFeature.title}</h3>
              <p className="m-jk-feature-picker__body">{activeFeature.body}</p>
            </div>
          </div>
        </section>

        <section className="m-jk-home__panel" id="samples">
          <h2>Open a sample shop</h2>
          <p className="m-jk-home__lede">
            Fictitious businesses, real portals — full screen, no login. Pick an industry and click through.
          </p>
          <div className="m-jk-home__demos m-jk-home__demos--lead">
            {HERO_SAMPLE_BARS.map((p) => (
              <DemoGalleryCard
                key={p.href}
                href={p.href}
                biz={p.name}
                industry={p.industry}
                compact
              />
            ))}
          </div>
          <button
            type="button"
            className="m-jk-text-link"
            onClick={() => router.push('/demos')}
          >
            Browse all samples
          </button>
        </section>

        <section className="m-jk-home__panel" id="approach">
          <div className="m-jk-home__split">
            <div>
              <h2>QuickBooks stays the boss</h2>
              <p>
                Nightly sync mirrors your chart and GL. Statements win arguments — not a spreadsheet rebuild.
              </p>
              <ul className="m-jk-home__list">
                <li>P&amp;L and balance sheet, trailing two years</li>
                <li>GL detail for recon and close</li>
                <li>One Intuit connection per company</li>
              </ul>
            </div>
            <div>
              <h2>Looks like your shop</h2>
              <p>
                Your name on sign-in, your colors on the nav. One login, one company — never someone else&rsquo;s template.
              </p>
              <ul className="m-jk-home__list">
                <li>Live week vs closed month, labeled honestly</li>
                <li>Integrations for register, vendors, jobs</li>
                <li>Short fixed-scope build — not a drawn-out IT rollout</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="m-jk-home__panel" id="how">
          <h2>Call, build, tune</h2>
          <ol className="m-jk-steps">
            <li>Thirty-minute kickoff — what you sell and what has to be on one screen.</li>
            <li>I wire your books, register, vendors, whatever you run.</li>
            <li>You log in and click around — not a slide deck.</li>
            <li>We keep at it until close and that screen match.</li>
          </ol>
          <button
            type="button"
            className="m-jk-text-link"
            onClick={() => router.push('/how-it-works')}
          >
            Full timeline
          </button>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--form" id="contact">
          <h2>What&rsquo;s the one screen you keep rebuilding?</h2>
          <p className="m-jk-home__lede">
            I&rsquo;ll point you at the closest sample — or{' '}
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              book thirty minutes
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
                That one screen
                <textarea
                  rows={3}
                  placeholder="Margin per ticket, landed cost per PO, rent roll on the 1st…"
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
