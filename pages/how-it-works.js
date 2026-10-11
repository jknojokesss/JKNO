import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

const HOW = [
  {
    title: 'Kickoff call',
    body: 'Thirty minutes. How you get paid, what you sell, what has to land on one screen.',
  },
  {
    title: 'Wire-up',
    body: 'QuickBooks, register, vendors, bank, whatever you run on. I write the integrations; they sync every night.',
  },
  {
    title: 'Go live',
    body: 'You log in, we walk it, fix what\u2019s off. Nothing stays live until it matches QuickBooks.',
  },
]

export default function HowItWorks() {
  const router = useRouter()
  return (
    <MarketingShell title="How It Works | JK No Jokes Financials">
      <PageHero
        kicker="How it works"
        title="Call, build, launch."
        lead="Short fixed scope — not a quarter-long rollout. After go-live, nightly sync keeps your week live and the close tied to the books."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap" style={{ maxWidth: '640px' }}>
          {HOW.map((step) => (
            <div key={step.title} style={{ marginBottom: '28px' }}>
              <h3 className="m-h2" style={{ fontSize: '20px', marginBottom: '8px' }}>{step.title}</h3>
              <p className="m-about-p" style={{ margin: 0 }}>{step.body}</p>
            </div>
          ))}

          <div style={{ marginTop: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

