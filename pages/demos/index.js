import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { BOOKING_URL } from '../../lib/marketing'
import { ALL_DEMOS } from '../../lib/industryDemos'

export default function DemoGallery() {
  const router = useRouter()
  return (
    <MarketingShell
      title="Live Industry Demos | JK No Jokes Financials"
      description="Live, clickable financial dashboard demos for your industry. No login, sample data."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} live demos · no login`}
        title={<>One of these is your business.</>}
        lead="Every card below is a real dashboard. Click in, scroll around, pretend it's yours."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <div className="m-demo-grid">
            {ALL_DEMOS.map((d) => (
              <a key={d.href} href={d.href} className="m-demo-tile">
                <span className="m-demo-tile__emoji" aria-hidden="true">{d.emoji}</span>
                <span className="m-demo-tile__industry">{d.industry}</span>
                <span className="m-demo-tile__biz">{d.biz}</span>
                <span className="m-demo-tile__blurb">{d.blurb}</span>
                <span className="m-demo-tile__go">Open live demo →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-slab">
        <div className="m-wrap m-cta-slab__inner">
          <h2 className="m-h2 m-cta-slab__title">Don&rsquo;t see your industry?</h2>
          <p className="m-cta-slab__lead">We&rsquo;ll build a demo around your business before you pay a dime.</p>
          <div className="m-cta-slab__actions">
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get in touch</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop-dark">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
