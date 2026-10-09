import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { BOOKING_URL } from '../../lib/marketing'
import { ALL_DEMOS } from '../../lib/industryDemos'
import { SERVICE_PACKAGES } from '../../lib/buildStack'
import DemoGalleryCard from '../../components/DemoGalleryCard'

const SHIP_PIPELINE = [
  {
    title: 'Connect QuickBooks',
    body: 'One Intuit link. Chart and GL mirror on a nightly schedule.',
  },
  {
    title: 'Nightly sync',
    body: 'Register, vendors, jobs — whatever you actually run.',
  },
  {
    title: 'Your login',
    body: 'Your name on sign-in, your colors. One company per account.',
  },
  {
    title: 'Close in sync',
    body: 'Month-end ties to the books you already trust.',
  },
]

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

      <section className="m-section" style={{ paddingTop: 'clamp(24px,4vw,36px)', paddingBottom: 'clamp(20px,3vw,28px)' }}>
        <div className="m-wrap" style={{ maxWidth: '52rem' }}>
          <h2 className="m-h2" style={{ marginBottom: '0.45rem' }}>How it ships</h2>
          <p className="m-lead" style={{ marginBottom: '1.25rem', maxWidth: '40ch' }}>
            Same pipe for every client — about six days from kickoff to login.
          </p>
          <ol className="m-jk-pipeline">
            {SHIP_PIPELINE.map((step, i) => (
              <li key={step.title} className="m-jk-pipeline__item">
                <span className="m-jk-pipeline__n">Step {i + 1}</span>
                <p className="m-jk-pipeline__title">{step.title}</p>
                <p className="m-jk-pipeline__body">{step.body}</p>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="m-jk-text-link"
            onClick={() => router.push('/how-it-works')}
          >
            Full timeline
          </button>
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
