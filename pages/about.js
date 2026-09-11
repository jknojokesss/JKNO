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
        lead="JK No Jokes Financials is a small shop that builds custom financial portals and keeps the books underneath them — wired to QuickBooks, your register, your distributors, and whatever else your business actually uses."
      />

      <section className="m-section">
        <div className="m-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <img src="/1779727210800.jpg" alt="Jonathan Katz" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #C9A84C' }} />
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>Jonathan (Chaim) Katz</div>
                <div style={{ fontSize: '14px', color: '#5A6577', marginTop: '4px' }}>Founder</div>
              </div>
            </div>
            <p style={{ fontSize: '16px', color: '#48536A', lineHeight: 1.75, marginBottom: '18px' }}>
              We don&rsquo;t just record your numbers — we build the system that turns them into decisions. Every client gets their own portal, updated on a schedule, accessible from any device.
            </p>
            <p style={{ fontSize: '16px', color: '#48536A', lineHeight: 1.75, marginBottom: '18px' }}>
              We work with owners who are tired of flying blind — who know something is off but can&rsquo;t see it in a pile of spreadsheets or a QuickBooks report that makes no sense.
            </p>
            <p style={{ fontSize: '16px', color: '#48536A', lineHeight: 1.75, marginBottom: '28px' }}>
              Our job is to make your numbers clear, your reporting automatic, and your books something you actually look at.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="m-btn m-btn--primary" onClick={() => router.push('/#contact')}>Work with us</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary">Book a call</a>
            </div>
          </div>

          <div className="m-card" style={{ padding: '28px' }}>
            {[
              'One point of contact — the person who built your portal',
              'Your own login, scoped to your company on the server',
              'Integrations we wrote ourselves, not a Zapier chain',
              'Nothing goes live until it ties out to QuickBooks',
            ].map((line) => (
              <div key={line} style={{ padding: '12px 0', borderBottom: '1px solid #EEF1F5', fontSize: '15px', color: '#48536A', lineHeight: 1.6 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
