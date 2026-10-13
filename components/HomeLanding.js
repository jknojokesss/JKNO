import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import { painLineForDemo } from '../lib/homeSamplePains'
import DemoGalleryCard from './DemoGalleryCard'

const STORY = {
  kicker: 'What you get',
  title: 'Software that feels like your shop',
  body:
    'Not another dashboard template — your register, vendors, and QuickBooks wired into one login with the screens you keep describing on phone calls. Built on your numbers, tuned until you would actually use it every Monday. One company per account; you get me, not a ticket queue.',
}

const START_STEPS = [
  'Quick call — what you sell and what would make your week easier.',
  'I connect your books and tools, then build the portal around that.',
  'You sign in on real data; we keep adjusting until it feels like yours.',
]

const PORTFOLIO_HREF = '/operations-portal'

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
          Run your business like you meant to.
        </h1>
        <p className="m-jk-home__lead">
          You did not open a shop to fight spreadsheets at midnight. I build owner portals on your real QuickBooks and
          the tools you already run — margin, cash, what is owed — one login, one tire shop or five businesses.
        </p>
        <div className="m-jk-home__hero-actions">
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--primary"
            onClick={() => scrollTo('samples')}
          >
            See it in 60 seconds — open a sample
          </button>
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--ghost"
            onClick={() => scrollTo('contact')}
          >
            Tell me what you want built
          </button>
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--ghost m-jk-home__btn--ops"
            onClick={() => router.push(PORTFOLIO_HREF)}
          >
            Multi-business sample
          </button>
        </div>
      </header>

      <div className="m-jk-home__flow">
        <section className="m-jk-home__panel m-jk-home__panel--story m-jk-home__panel--spotlight" id="portfolio">
          <p className="m-jk-story__kicker">Run more than one business?</p>
          <h2 className="m-jk-story__title">One hub, four doors</h2>
          <p className="m-jk-story__body">
            Three trade samples you can actually open — tires, rentals, roofing — plus an{' '}
            <strong>Operations Center</strong> for cards, banks, and whether cash covers what is due. Every card clicks
            through.
          </p>
          <button
            type="button"
            className="m-jk-home__btn m-jk-home__btn--primary m-jk-home__btn--inline"
            onClick={() => router.push(PORTFOLIO_HREF)}
          >
            Open owner portfolio sample
          </button>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--story" id="offer">
          <p className="m-jk-story__kicker">How we work</p>
          <h2 className="m-jk-story__title">I build it. You run the business.</h2>
          <p className="m-jk-story__body">
            Keep your bookkeeper or bring me the books — either way you get a portal that matches how you actually sell.
            QuickBooks stays the books; your login is the cockpit. Same nightly sync, same person answering when something
            looks off.
          </p>
          <ul className="m-jk-steps m-jk-steps--plain">
            <li><strong>Setup</strong> — connect QuickBooks and your tools, build your screens, launch on real data.</li>
            <li><strong>Ongoing</strong> — sync keeps running; tune screens as you grow. Bookkeeping help only if you want it.</li>
            <li><strong>Timing</strong> — most first portals land in a few weeks; exact scope comes out of the kickoff call.</li>
          </ul>
        </section>

        <section className="m-jk-home__panel m-jk-home__panel--story">
          <p className="m-jk-story__kicker">{STORY.kicker}</p>
          <h2 className="m-jk-story__title">{STORY.title}</h2>
          <p className="m-jk-story__body">{STORY.body}</p>
        </section>

        <section className="m-jk-home__panel" id="samples">
          <p className="m-jk-story__kicker">Samples</p>
          <h2 className="m-jk-story__title">Click one — feel if this is you</h2>
          <p className="m-jk-story__body m-jk-story__body--tight">
            Fake company names, real layouts. No login. If a screen makes you think &ldquo;that&rsquo;s what I&rsquo;ve been asking for,&rdquo;
            that&rsquo;s the conversation.
          </p>
          <div className="m-jk-home__demos m-jk-home__demos--lead m-jk-stagger-cards">
            {HERO_SAMPLE_BARS.map((p) => (
              <DemoGalleryCard
                key={p.href}
                href={p.href}
                biz={p.name}
                pain={painLineForDemo(p.href)}
                compact
                featured={p.href === PORTFOLIO_HREF}
                featuredLabel="Multi-business"
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

        <section className="m-jk-home__panel m-jk-home__panel--story m-jk-home__panel--proof">
          <p className="m-jk-story__kicker">References</p>
          <h2 className="m-jk-story__title">Samples here are fake — ask for a real one</h2>
          <p className="m-jk-story__body">
            Every demo on this site uses a made-up company so you can click around without a password. I don&rsquo;t put
            client testimonials on a public page without permission — on a kickoff call I can share references from owners
            already using this on their books.
          </p>
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
          <h2>What would make your business easier?</h2>
          <p className="m-jk-home__lede">
            One sentence is enough — the margin view, the cash picture, the thing your accountant can&rsquo;t pull out of
            QuickBooks. I&rsquo;ll point you at the closest sample or{' '}
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              get on a call
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
                  placeholder="I want to see profit per ticket / who still owes me / if I can pay the cards this week…"
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
