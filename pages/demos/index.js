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
        kicker={`${ALL_DEMOS.length} samples · no login`}
        title={<>Open a sample.</>}
        lead="Fictitious companies, real layouts. One screen should make you reach for your phone — that&rsquo;s the meeting."
        align="center"
      />

      <section className="m-section m-section--panel" style={{ paddingTop: 'clamp(28px,4vw,40px)', paddingBottom: 'clamp(28px,4vw,40px)' }}>
        <div className="m-wrap">
          <p className="m-ship-row__cap">How it ships</p>
          <ol className="m-ship-row">
            <li>
              <span className="m-ship-row__n">1</span>
              <span className="m-ship-row__text">Connect QuickBooks</span>
            </li>
            <li>
              <span className="m-ship-row__n">2</span>
              <span className="m-ship-row__text">Sync runs at night</span>
            </li>
            <li>
              <span className="m-ship-row__n">3</span>
              <span className="m-ship-row__text">Your scoped login</span>
            </li>
            <li>
              <span className="m-ship-row__n">4</span>
              <span className="m-ship-row__text">Close when you approve</span>
            </li>
          </ol>
          <p className="m-ship-row__more">
            <button type="button" className="m-btn--text" onClick={() => router.push('/how-it-works')}>
              Full timeline
            </button>
          </p>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-wrap">
          <p className="m-kicker" style={{ marginBottom: 12 }}>Packages</p>
          <div className="m-demo-grid">
            {SERVICE_PACKAGES.map((p) => (
              <DemoGalleryCard
                key={p.title}
                href={p.href}
                biz={p.title}
                industry={p.blurb}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <p className="m-kicker" style={{ marginBottom: 12 }}>All samples</p>
          <div className="m-demo-grid m-demo-grid--gallery">
            {ALL_DEMOS.map((d) => (
              <DemoGalleryCard
                key={d.href}
                href={d.href}
                biz={d.biz}
                industry={d.industry}
                compact
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
