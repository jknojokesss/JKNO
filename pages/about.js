import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

export default function About() {
  const router = useRouter()
  return (
    <MarketingShell title="About | JK No Jokes Financials">
      <PageHero
        kicker="About"
        title="I build the portal and keep the books."
        lead="Small shop in Jersey. QuickBooks, register, vendors, wired to one login."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap" style={{ maxWidth: '640px' }}>
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
            I write the integrations and build the screens around them. Nightly sync, one login, your company only on the server.
          </p>
          <p className="m-about-p">
            You get me, not a ticket queue. Nothing goes live until it matches QuickBooks.
          </p>
          <p className="m-about-p" style={{ marginBottom: '28px' }}>
            If margin, inventory, and the P&L live in three places and never agree, that&rsquo;s what I fix.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

