import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { BOOKING_URL } from '../../lib/marketing'
import { ALL_DEMOS } from '../../lib/industryDemos'
import { SERVICE_PACKAGES } from '../../lib/buildStack'
import DemoGalleryCard from '../../components/DemoGalleryCard'
import ChocolateBarLink, { ChocolateBarCaption } from '../../components/ChocolateBarLink'

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

      <section
        className="m-section m-ship-intro"
        style={{ paddingTop: 'clamp(20px,3vw,32px)', paddingBottom: 'clamp(16px,2.5vw,28px)' }}
      >
        <div className="m-wrap m-ship-intro__inner">
          <p className="m-ship-hook">
            Kickoff to login in about <strong>six days</strong> — same pipe on every build.
          </p>
          <ul className="m-ship-chain" aria-label="How a build ships">
            <li>
              <span className="m-ship-chain__verb">Connect</span> QuickBooks once
            </li>
            <li>
              <span className="m-ship-chain__verb">Sync</span> register and vendors nightly
            </li>
            <li>
              <span className="m-ship-chain__verb">Sign in</span> to one scoped portal
            </li>
            <li>
              <span className="m-ship-chain__verb">Close</span> when the books match
            </li>
          </ul>
          <button
            type="button"
            className="m-ship-intro__more m-btn--text"
            onClick={() => router.push('/how-it-works')}
          >
            Full timeline
          </button>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-wrap">
          <ChocolateBarCaption>Four flavors</ChocolateBarCaption>
          <div className="jk-choc-grid jk-choc-grid--tight">
            {SERVICE_PACKAGES.map((p) => (
              <ChocolateBarLink
                key={p.title}
                href={p.href}
                name={p.title}
                industry={p.blurb}
                wide
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <ChocolateBarCaption>Full box</ChocolateBarCaption>
          <div className="jk-choc-grid jk-choc-grid--gallery">
            {ALL_DEMOS.map((d) => (
              <DemoGalleryCard
                key={d.href}
                href={d.href}
                biz={d.biz}
                industry={d.industry}
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
