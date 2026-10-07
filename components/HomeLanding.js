import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { BUSINESS_TYPES, SERVICE_PACKAGES } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'

/** Homepage grid — range of industries; full list lives on /demos */
const HOME_DEMOS = [
  FEATURED_DEMOS[0],
  FEATURED_DEMOS[1],
  FEATURED_DEMOS[5],
  FEATURED_DEMOS[4],
].filter(Boolean)

const STEPS = [
  { n: '1', title: 'Call', body: 'Thirty minutes. What you sell, how you get paid, what you keep rebuilding in Excel.' },
  { n: '2', title: 'Wire-up', body: 'QuickBooks, register, vendors — I write the sync. It runs every night.' },
  { n: '3', title: 'Go live', body: 'About six days. We walk the portal together. Nothing ships until it matches QuickBooks.' },
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

const MARQUEE = BUSINESS_TYPES.map((r) => r.label)

export default function HomeLanding({
  live,
  form,
  setForm,
  onSubmit,
  submitted,
  submitting,
}) {
  const router = useRouter()

  const scrollContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollDemos = () => {
    document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={live ? 'm-home m-home--live' : 'm-home'}>
      <section className="m-dark-band m-dark-band--energy">
        <div className="m-wrap m-band m-band--hero-split">
          <div className="m-band__hero m-band__hero--punch">
            <p className="m-band__kicker m-band__kicker--glow">Your books stay in QuickBooks</p>
            <h1 className="m-band__title m-band__title--punch">
              I build the login that shows{' '}
              <span className="m-gold-text">today&rsquo;s margin</span>.
            </h1>
            <p className="m-band__sub m-band__sub--punch">
              Custom owner portals — tickets, jobs, stores, or SKUs matched to real cost.
              Nightly sync. One company per login. Month-end that actually ties.
            </p>
            <div className="m-band__actions m-band__actions--punch">
              <button type="button" className="m-btn m-btn--gold m-btn--xl m-btn--pop" onClick={scrollContact}>
                Build my portal →
              </button>
              <button type="button" className="m-btn m-btn--ghost-light m-btn--xl" onClick={scrollDemos}>
                Tour the demos
              </button>
            </div>
            <ul className="m-hero-chips" aria-label="Highlights">
              <li>~6 days to launch</li>
              <li>QuickBooks native</li>
              <li>Your data only</li>
            </ul>
          </div>

          <div className="m-hero-visual" aria-hidden="true">
            <div className="m-hero-window">
              <div className="m-hero-window__dots">
                <span /><span /><span />
              </div>
              <p className="m-hero-window__label">Owner view · sample</p>
              <div className="m-hero-window__stats">
                <div className="m-hero-window__stat m-hero-window__stat--hot">
                  <span>Margin today</span>
                  <strong>$4,280</strong>
                </div>
                <div className="m-hero-window__stat">
                  <span>Open tickets</span>
                  <strong>37</strong>
                </div>
                <div className="m-hero-window__stat">
                  <span>Synced</span>
                  <strong className="m-hero-window__live">2:14 AM</strong>
                </div>
              </div>
              <div className="m-hero-window__bar">
                <span style={{ width: '72%' }} />
              </div>
              <p className="m-hero-window__foot">QuickBooks reconciled through last close</p>
            </div>
          </div>
        </div>

        <div className="m-marquee-wrap" aria-hidden="true">
          <div className="m-marquee">
            {[...MARQUEE, ...MARQUEE].map((label, i) => (
              <span key={`${label}-${i}`} className="m-marquee__item">{label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section m-section--packages-punch">
        <div className="m-wrap">
          <div className="m-section-head-punch">
            <p className="m-kicker">Four shapes. One pipe.</p>
            <h2 className="m-h2 m-section-head-punch__title">
              Pick the fight you&rsquo;re in.
            </h2>
          </div>
          <div className="m-package-grid m-package-grid--home">
            {SERVICE_PACKAGES.map((p, i) => (
              <a key={p.title} href={p.href} className="m-package-card m-package-card--punch" style={{ '--pkg-i': i }}>
                <span className="m-package-card__title">{p.title}</span>
                <span className="m-package-card__blurb">{p.blurb}</span>
                <span className="m-package-card__go">See it →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="demos" className="m-section m-section--demos-punch">
        <div className="m-wrap">
          <div className="m-section-head-punch">
            <p className="m-kicker">No slide deck</p>
            <h2 className="m-h2 m-section-head-punch__title">
              Click in. <span className="m-gold-text-dark">Want it for your shop.</span>
            </h2>
            <p className="m-lead m-section-head-punch__lead">
              Fictitious businesses, real screens — the same patterns we ship on your QuickBooks company.
            </p>
          </div>
          <div className="m-demo-grid m-demo-grid--home">
            {HOME_DEMOS.map((d) => (
              <a
                key={d.src}
                href={d.src}
                className="m-demo-tile m-demo-tile--punch"
                style={{ '--tile-accent': d.accent || 'var(--m-gold)' }}
              >
                <span className="m-demo-tile__emoji" aria-hidden="true">{d.emoji}</span>
                <span className="m-demo-tile__industry">{d.label}</span>
                <span className="m-demo-tile__blurb">{d.caption}</span>
                <span className="m-demo-tile__go">Open sample →</span>
              </a>
            ))}
          </div>
          <p className="m-demoshow-more">
            <button type="button" className="m-btn m-btn--secondary m-btn--pop" onClick={() => router.push('/demos')}>
              See every sample portal →
            </button>
          </p>
        </div>
      </section>

      <section className="m-section m-section--panel">
        <div className="m-wrap">
          <div className="m-section-head-punch">
            <p className="m-kicker">Built for operators</p>
            <h2 className="m-h2">If you run the business, this is for you.</h2>
          </div>
          <ul className="m-home-fit m-home-fit--punch">
            {BUSINESS_TYPES.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.detail}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '28px' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/what-we-do')}>
              Everything I build →
            </button>
          </p>
        </div>
      </section>

      <section id="how" className="m-section">
        <div className="m-wrap">
          <div className="m-section-head-punch">
            <p className="m-kicker">Fast</p>
            <h2 className="m-h2">Call → wire-up → go live.</h2>
          </div>
          <div className="m-how-strip" style={{ marginTop: '32px' }}>
            {STEPS.map((s) => (
              <div key={s.n} className="m-step-pop m-step-pop--punch">
                <div className="m-step-pop__n">{s.n}</div>
                <h3 className="m-step-pop__title">{s.title}</h3>
                <p className="m-step-pop__body">{s.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '28px' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/how-it-works')}>
              Full timeline
            </button>
          </p>
        </div>
      </section>

      <section id="contact" className="m-contact-slab m-contact-slab--punch">
        <div className="m-wrap m-contact-grid">
          <div>
            <p className="m-kicker">Let&rsquo;s go</p>
            <h2 className="m-h2 m-contact-slab__title-left">Tell me what you run.</h2>
            <p className="m-lead" style={{ marginTop: '12px' }}>
              I&rsquo;ll point you at the right demo and quote the build — usually same week we start.
            </p>
            <p style={{ marginTop: '20px' }}>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="m-btn m-btn--gold m-btn--pop"
              >
                Book 30 minutes →
              </a>
            </p>
          </div>

          <div className="m-card m-card--pop" style={{ padding: '24px 22px' }}>
            {submitted ? (
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Got it — I&rsquo;ll be in touch.</p>
            ) : (
              <>
                {[
                  { key: 'name', label: 'Your name', type: 'text', placeholder: 'Your name' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@yourshop.com' },
                  { key: 'business', label: 'Business', type: 'text', placeholder: 'Shop name' },
                ].map(({ key, label, type, placeholder }) => (
                  <label key={key} className="m-label" style={{ marginTop: key === 'name' ? 0 : 14 }}>
                    {label}
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </label>
                ))}

                <label className="m-label" style={{ marginTop: 14 }}>
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

                <label className="m-label" style={{ marginTop: 14 }}>
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

                <label className="m-label" style={{ marginTop: 14 }}>
                  One screen you want
                  <textarea
                    rows={3}
                    placeholder="e.g. margin per ticket, landed cost per PO…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </label>

                <button
                  type="button"
                  className="m-btn m-btn--primary m-btn--xl m-btn--pop"
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
                  {submitting ? 'Sending…' : 'Send — let’s build it →'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
