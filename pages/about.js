import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

export default function About() {
  const router = useRouter()
  return (
    <MarketingShell title="Who We Are — JK No Jokes Financials">
      <PageHero
        kicker="Who we are"
        title={<>We write the software<br />and keep the books.</>}
        lead="Small shop. Custom portals wired to QuickBooks, your register, your distributors — whatever your business actually runs on."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap m-about-grid">
          <div>
            <div className="m-about-founder">
              <div className="m-photo-pop">
                <img src="/1779727210800.jpg" alt="Jonathan Katz" />
              </div>
              <div>
                <div className="m-about-name">Jonathan (Chaim) Katz</div>
                <div className="m-about-role">Founder</div>
              </div>
            </div>
            <p className="m-about-p">
              We don&rsquo;t just record your numbers — we build the system that turns them into decisions. Every client gets their own portal, updated on a schedule, accessible from any device.
            </p>
            <p className="m-about-p">
              We work with owners who are tired of flying blind — who know something is off but can&rsquo;t see it in a pile of spreadsheets or a QuickBooks report that makes no sense.
            </p>
            <p className="m-about-p" style={{ marginBottom: '28px' }}>
              Our job is to make your numbers clear, your reporting automatic, and your books something you actually look at.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Work with us</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
            </div>
          </div>

          <div className="m-card m-card--pop m-about-list">
            {[
              'One point of contact — the person who built your portal',
              'Your own login, scoped to your company on the server',
              'Integrations we wrote ourselves — nightly sync into your portal',
              'Nothing goes live until it ties out to QuickBooks',
            ].map((line) => (
              <div key={line} className="m-about-list__item">{line}</div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
