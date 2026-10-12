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
          <p className="m-about-p">
            Background is shop-floor finance — tire and auto, import, property, consignment — wired to QuickBooks Online for
            real operating businesses in New Jersey. The samples on this site use fictitious names; live portals run on
            owner data with the same patterns.
          </p>
          <p className="m-about-p m-about-p--proof">
            <strong>Proof:</strong> Owner portals on this stack run on live QuickBooks data for real shops (tire &amp; auto,
            import, and others in NJ). Everything labeled &ldquo;sample&rdquo; on jknojokes.com is fictitious — the layouts
            are the same ones owners sign into daily.
          </p>
          <p className="m-about-p">
            <strong>How your data is handled:</strong> QuickBooks tokens and book data stay in a private Supabase project
            with row-level security on client tables. Portal logins are scoped server-side to one company — a user cannot
            name or open another client&rsquo;s books. I use the service role only on the server for sync and admin tasks,
            never in the browser bundle.
          </p>
          <p className="m-about-p" style={{ marginBottom: '28px' }}>
            If margin, inventory, and the profit-and-loss live in three places and never agree, that&rsquo;s what I fix.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Tell me what you need</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

