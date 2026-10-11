import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import DemoPreview from './DemoPreview'

const HOME_PREVIEW_DEMOS = HERO_SAMPLE_BARS.map((bar) => {
  const row = FEATURED_DEMOS.find((d) => d.src === bar.href)
  return {
    label: bar.industry || row?.label || bar.name,
    biz: bar.name,
    src: bar.href,
    caption:
      row?.caption
      || `Fictitious data — open ${bar.name} and click around like it’s your shop.`,
  }
})

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
      <header className="m-jk-home__hero m-jk-home__hero--product" id="top">
        <div
          className="m-jk-home__hero-preview m-jk-home__panel m-jk-home__panel--samples"
          id="samples"
        >
          <p className="m-jk-home__preview-kicker">Sample portals · no login</p>
          <DemoPreview
            demos={HOME_PREVIEW_DEMOS}
            showHead={false}
            onMoreDemos={() => router.push('/demos')}
          />
        </div>

        <div className="m-jk-home__hero-copy">
          <p className="m-jk-home__eyebrow">Run the week on real numbers</p>
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
              onClick={() => scrollTo('contact')}
            >
              Start a build
            </button>
            <button
              type="button"
              className="m-jk-home__btn m-jk-home__btn--ghost"
              onClick={() => router.push('/demos')}
            >
              All samples
            </button>
          </div>
        </div>
      </header>

      <div className="m-jk-home__flow">
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
                <li>Built in about six days after kickoff</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="m-jk-home__panel" id="how">
          <h2>Kickoff to login in about six days</h2>
          <ol className="m-jk-steps">
            <li>Tell me what you run and what&rsquo;s in QuickBooks already.</li>
            <li>I wire sync and your portal shell.</li>
            <li>You click around on real GL — not slides.</li>
            <li>We tune until close and your must-have screen match.</li>
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
