import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import DemoGalleryCard from './DemoGalleryCard'

const STORY = {
  kicker: 'What you get',
  title: 'Your portal, on your real data',
  body:
    'QuickBooks plus the tools you already run — register, vendors, jobs — wired into one private login. Your name on sign-in, the screens you keep asking for, built on your numbers so you can click through before go-live. One company per account.',
}

const START_STEPS = [
  'Quick call — what you sell and what you want to see.',
  'I connect your books and tools, then build your portal.',
  'You sign in on real data; we adjust until it clicks.',
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

  return (
    <div className="m-jk-home">
      <header className="m-jk-home__hero m-jk-home__hero--enter" id="top">
        <p className="m-jk-home__mark" aria-hidden="true">
          JK<span className="m-jk-home__mark-dot">.</span>
        </p>
        <h1 className="m-jk-home__h1">
          One login for the numbers that run your shop.
        </h1>
        <p className="m-jk-home__lead">
          Custom owner portals on QuickBooks and the tools you already run — one login instead of spreadsheets and a pile of tabs.
        </p>
        <div className="m-jk-home__hero-actions">
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--primary"
            onClick={() => scrollTo('samples')}
          >
            See sample portals
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
        <section className="m-jk-home__panel m-jk-home__panel--story">
          <p className="m-jk-story__kicker">{STORY.kicker}</p>
          <h2 className="m-jk-story__title">{STORY.title}</h2>
          <p className="m-jk-story__body">{STORY.body}</p>
        </section>

        <section className="m-jk-home__panel" id="samples">
          <p className="m-jk-story__kicker">Samples</p>
          <h2 className="m-jk-story__title">Open a sample shop</h2>
          <p className="m-jk-story__body m-jk-story__body--tight">
            Fictitious names, real screen layouts. No password — pick one and look around.
          </p>
          <div className="m-jk-home__demos m-jk-home__demos--lead m-jk-stagger-cards">
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
            All samples
          </button>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--story" id="how">
          <p className="m-jk-story__kicker">How it starts</p>
          <h2 className="m-jk-story__title">Call, build, tune</h2>
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
            More detail
          </button>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--form" id="contact">
          <h2>What do you want on screen?</h2>
          <p className="m-jk-home__lede">
            Tell me your trade and the report you wish you had — I&rsquo;ll send the closest sample or{' '}
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              book a call
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
                  placeholder="Profit per order, jobs in progress, what\u2019s on the shelf\u2026"
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
