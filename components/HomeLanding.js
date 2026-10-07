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
  { n: '2', title: 'Wire-up', body: 'Your books, register, vendors — I write the sync. It runs every night.' },
  { n: '3', title: 'Go live', body: 'About six days. We walk the portal together. Nothing ships until it matches your books.' },
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

/** Mini portal previews — same chrome as the live demos (sidebar + screen). */
const HERO_PORTALS = [
  {
    href: '/demo',
    code: 'SUMMIT',
    side: '#1E2A3A',
    accent: '#2A6CB8',
    screen: 'Consignment · September',
    stat: '$4,215',
    statLabel: 'collected · sample month',
    nav: ['Overview', 'Stores', 'Direct', 'Close'],
    activeNav: 1,
    rows: [['Midtown Market', '6 units short'], ['Parkway Foods', 'Clean']],
  },
  {
    href: '/riverstone-roofing',
    code: 'RIVERSTONE',
    side: '#1A1E24',
    accent: '#035CEB',
    screen: 'Job margin · open',
    stat: '−4.2 pts',
    statLabel: 'vs bid · flagged job',
    nav: ['Margin', 'WIP', 'Cash', 'Buyer'],
    activeNav: 0,
    rows: [['Harbor Apts re-roof', 'Over budget'], ['Retail pad #4', 'On track']],
  },
  {
    href: '/northline-global',
    code: 'NORTHLINE',
    side: '#1A1C19',
    accent: '#C9A84C',
    screen: 'Orders · picking',
    stat: '31.2%',
    statLabel: 'margin · SO-8821',
    nav: ['Pipeline', 'POs', 'Inventory', 'Orders'],
    activeNav: 3,
    rows: [['Urban Home Co', '$8,420'], ['Landed PO-2841', 'In transit']],
  },
]

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
      <section className="m-dark-band m-dark-band--brief">
        <div className="m-wrap m-hero-brief">
          <div className="m-hero-brief__copy">
            <p className="m-hero-brief__mark" aria-hidden="true">
              <span className="m-hero-brief__jk">JK<span className="m-hero-brief__dot">.</span></span>
            </p>
            <h1 className="m-band__title m-band__title--brief">
              Your books close the month.
              <br />
              You still need today&rsquo;s margin in one login.
            </h1>
            <p className="m-band__sub m-band__sub--brief">
              I connect your register, vendor portal, or jobs to a portal scoped to your company.
              Most owners run QuickBooks Online; I&rsquo;ll wire to Desktop or the stack your accountant
              already uses — operating view here, official books there.
            </p>
            <div className="m-band__actions">
              <button type="button" className="m-btn m-btn--gold m-btn--pop" onClick={scrollContact}>
                Get started
              </button>
              <button type="button" className="m-btn m-btn--ghost-light" onClick={scrollDemos}>
                View demos
              </button>
            </div>
            <p className="m-hero-brief__note">
              Custom build per owner — about six days from kickoff to go-live.
            </p>
          </div>

          <div className="m-hero-portal-stack">
            <p className="m-hero-portal-stack__cap">Sample portals</p>
            {HERO_PORTALS.map((p, i) => (
              <a
                key={p.href}
                href={p.href}
                className="m-hero-portal-card"
                style={{
                  '--portal-accent': p.accent,
                  '--portal-side': p.side,
                  '--portal-i': i,
                }}
              >
                <div className="m-hero-portal-card__inner">
                  <div className="m-hero-portal-card__nav">
                    <span className="m-hero-portal-card__code">{p.code}</span>
                    {p.nav.map((label, ni) => (
                      <span
                        key={label}
                        className={`m-hero-portal-card__navitem${ni === p.activeNav ? ' is-on' : ''}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="m-hero-portal-card__main">
                    <span className="m-hero-portal-card__screen">{p.screen}</span>
                    <span className="m-hero-portal-card__stat">{p.stat}</span>
                    <span className="m-hero-portal-card__statlab">{p.statLabel}</span>
                    <div className="m-hero-portal-card__rows">
                      {p.rows.map(([left, right]) => (
                        <div key={left} className="m-hero-portal-card__row">
                          <span>{left}</span>
                          <span>{right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section">
        <div className="m-wrap">
          <h2 className="m-h2">What owners hire me for</h2>
          <p className="m-lead" style={{ maxWidth: '52ch', marginBottom: '24px' }}>
            Books in on a schedule, operating screen out — different UI depending on the business.
          </p>
          <div className="m-package-grid">
            {SERVICE_PACKAGES.map((p) => (
              <a key={p.title} href={p.href} className="m-package-card">
                <span className="m-package-card__title">{p.title}</span>
                <span className="m-package-card__blurb">{p.blurb}</span>
                <span className="m-package-card__go">Open sample</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="demos" className="m-section m-section--panel">
        <div className="m-wrap">
          <h2 className="m-h2">Demos</h2>
          <p className="m-lead" style={{ maxWidth: '52ch', marginBottom: '24px' }}>
            Fictitious companies. Real screen layouts — walk them like you own the place.
          </p>
          <div className="m-demo-grid">
            {HOME_DEMOS.map((d) => (
              <a key={d.src} href={d.src} className="m-demo-tile">
                <span className="m-demo-tile__industry">{d.label}</span>
                <span className="m-demo-tile__blurb">{d.caption}</span>
                <span className="m-demo-tile__go">Open →</span>
              </a>
            ))}
          </div>
          <p style={{ marginTop: '24px' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/demos')}>
              All demos
            </button>
          </p>
        </div>
      </section>

      <section className="m-section">
        <div className="m-wrap">
          <h2 className="m-h2">Who I build for</h2>
          <ul className="m-home-fit">
            {BUSINESS_TYPES.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.detail}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '28px' }}>
            <button type="button" className="m-btn m-btn--secondary" onClick={() => router.push('/what-we-do')}>
              What I build
            </button>
          </p>
        </div>
      </section>

      <section id="how" className="m-section m-section--panel">
        <div className="m-wrap">
          <h2 className="m-h2">How it works</h2>
          <div className="m-how-strip" style={{ marginTop: '32px' }}>
            {STEPS.map((s) => (
              <div key={s.n} className="m-step-pop">
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

      <section id="contact" className="m-contact-slab">
        <div className="m-wrap m-contact-grid">
          <div>
            <h2 className="m-h2">Get started</h2>
            <p className="m-lead" style={{ marginTop: '12px' }}>
              Tell me what you run and what you want on one screen. I&rsquo;ll point you at the right demo and quote the build.
            </p>
            <p style={{ marginTop: '20px', fontSize: '15px', color: 'var(--m-muted)' }}>
              Or{' '}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn--text">
                book a 30-minute call
              </a>
              .
            </p>
          </div>

          <div className="m-card" style={{ padding: '24px 22px' }}>
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
                  className="m-btn m-btn--primary"
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
          </div>
        </div>
      </section>
    </div>
  )
}
