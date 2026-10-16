import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

const HOW = [
  {
    title: 'Kickoff call',
    body: 'Thirty minutes. How you get paid, what you sell, what has to land on one screen. We decide portal-only vs. books included.',
  },
  {
    title: 'Wire-up',
    body: 'QuickBooks, register, vendors, bank: whatever you run on. I write the connections; they sync every night.',
  },
  {
    title: 'Go live',
    body: 'You log in on real data, we walk it, fix what\u2019s off. Typical first launch is a few weeks; nothing stays live until it matches QuickBooks.',
  },
  {
    title: 'After launch',
    body: 'Sync keeps running. Optional support for month-end and bookkeeping if you want it. Your bookkeeper can stay in the picture either way.',
  },
]

export default function HowItWorks() {
  const router = useRouter()
  return (
    <MarketingShell title="How It Works | JK No Jokes Financials">
      <PageHero
        kicker="How it works"
        title="You talk. I build. You run."
        lead="Thirty minutes to hear what would make your week easier, then a portal on your real data, tuned until you trust the numbers."
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
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Tell me what you need</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

