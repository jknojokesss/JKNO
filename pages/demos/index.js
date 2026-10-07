import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { BOOKING_URL } from '../../lib/marketing'
import { ALL_DEMOS } from '../../lib/industryDemos'
import { SERVICE_PACKAGES } from '../../lib/buildStack'
import DemoGalleryCard from '../../components/DemoGalleryCard'

export default function DemoGallery() {
  const router = useRouter()
  return (
    <MarketingShell
      title="Sample Portals | JK No Jokes"
      description="Clickable sample portals for trades, retail, and distribution — fictitious data, real screen patterns on QuickBooks."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} doors · no login`}
        title={<>Pick a door.</>}
        lead="Fictitious companies, real layouts. One screen should make you reach for your phone — that&rsquo;s the meeting."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 0, paddingBottom: 'clamp(24px,3vw,36px)' }}>
        <div className="m-wrap">
          <div className="m-ship-strip">
            <p className="m-ship-strip__title">How it ships</p>
            <ol className="m-ship-strip__steps">
              <li>Connect your QuickBooks company (OAuth)</li>
              <li>Nightly sync — P&amp;L, balance sheet, GL; plus your register, vendors, or jobs as needed</li>
              <li>Your scoped login — one company, operating views owners actually use</li>
              <li>Month-end — inventory JE, AR, consignment close, posted when you approve</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-wrap">
          <h2 className="m-h3" style={{ marginBottom: '16px' }}>Four ways owners use this</h2>
          <div className="m-package-grid">
            {SERVICE_PACKAGES.map((p) => (
              <a key={p.title} href={p.href} className="m-package-card">
                <span className="m-package-card__title">{p.title}</span>
                <span className="m-package-card__blurb">{p.blurb}</span>
                <span className="m-package-card__go">Open sample →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <h2 className="m-h3" style={{ marginBottom: '20px' }}>All samples</h2>
          <div className="m-demo-spot-grid m-demo-spot-grid--gallery">
            {ALL_DEMOS.map((d, i) => (
              <DemoGalleryCard
                key={d.href}
                href={d.href}
                biz={d.biz}
                industry={d.industry}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-slab">
        <div className="m-wrap m-cta-slab__inner">
          <h2 className="m-h2 m-cta-slab__title">Nothing here with your name on it?</h2>
          <p className="m-cta-slab__lead">Good. Tell me what you sell — I&rsquo;ll mock your portal first, invoice second.</p>
          <div className="m-cta-slab__actions">
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get in touch</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop-dark">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
