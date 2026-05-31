import Head from 'next/head'
import { useRouter } from 'next/router'

const SECTIONS = [
  {
    heading: '1. Agreement to Terms',
    body: 'By accessing or using jknojokes.com or any JK No Jokes Bookkeeping services you agree to be bound by these Terms of Service. If you do not agree to these terms do not use our services.',
  },
  {
    heading: '2. Description of Services',
    body: 'JK No Jokes Bookkeeping provides:',
    bullets: [
      'Custom financial dashboards and client portals',
      'Bookkeeping and financial reporting services',
      'AI-powered financial insights and analysis',
      'Bank account connectivity via Plaid',
      'POS system integration (Clover and others)',
    ],
  },
  {
    heading: '3. Client Accounts',
    body: 'To access your client portal you must have an account. You are responsible for:',
    bullets: [
      'Maintaining the confidentiality of your login credentials',
      'All activity that occurs under your account',
      'Notifying us immediately of any unauthorized access at jk@jknojokes.com',
    ],
  },
  {
    heading: '4. Financial Data and Bank Connectivity',
    body: 'By connecting your bank accounts through our platform you authorize JK No Jokes Bookkeeping to:',
    bullets: [
      'Access your transaction history in read-only mode via Plaid',
      'Store and process your financial data to provide our services',
      'Display your financial data within your client portal',
    ],
    footer: 'We do not have the ability to move, transfer, or initiate transactions in your bank accounts. Access is read-only.',
  },
  {
    heading: '5. Accuracy of Financial Information',
    body: 'While we strive to provide accurate financial reporting and insights:',
    bullets: [
      'Our services are not a substitute for professional accounting or tax advice',
      'You are responsible for verifying the accuracy of all financial data',
      'We are not responsible for decisions made based on information displayed in your dashboard',
      'Always consult a licensed accountant or CPA for tax preparation and compliance',
    ],
  },
  {
    heading: '6. Payment and Fees',
    body: 'Service fees are agreed upon separately in your client agreement. We reserve the right to modify fees with 30 days written notice. Failure to pay may result in suspension of access to your client portal.',
  },
  {
    heading: '7. Confidentiality',
    body: 'We treat all client financial data as strictly confidential. We will not share, sell, or disclose your financial information to any third party except as described in our Privacy Policy or as required by law.',
  },
  {
    heading: '8. Intellectual Property',
    body: 'The JK No Jokes Bookkeeping platform, dashboard technology, and all associated software are our proprietary property. You may not copy, reproduce, or reverse engineer any part of our platform.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'To the maximum extent permitted by law JK No Jokes Bookkeeping shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the fees paid by you in the three months prior to the claim.',
  },
  {
    heading: '10. Termination',
    body: 'Either party may terminate services with 30 days written notice. Upon termination you will have 30 days to export your data before it is permanently deleted from our systems.',
  },
  {
    heading: '11. Governing Law',
    body: 'These Terms shall be governed by the laws of the State of New Jersey without regard to its conflict of law provisions.',
  },
  {
    heading: '12. Changes to Terms',
    body: 'We reserve the right to modify these Terms at any time. Material changes will be communicated via email. Continued use of our services after changes constitutes acceptance of the new Terms.',
  },
  {
    heading: '13. Contact',
    body: 'Questions about these Terms? Contact us:',
    contact: true,
  },
]

export default function Terms() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Terms of Service — JK No Jokes Bookkeeping</title>
        <meta name="description" content="Terms of Service for JK No Jokes Bookkeeping" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #F7F4EF; color: #1A1A2E; font-family: 'DM Sans', sans-serif; }`}</style>
      </Head>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #DDD8CE', padding: '20px 48px', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '700', letterSpacing: '2px', color: '#1A1A2E' }}>
          JK<span style={{ color: '#C9A84C' }}>.</span>
        </button>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', color: '#5A6070' }}>
          ← HOME
        </button>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '56px', paddingBottom: '40px', borderBottom: '1px solid #DDD8CE' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>LEGAL</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '600', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: '16px', color: '#1A1A2E' }}>
            Terms of Service
          </h1>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>
            <strong style={{ color: '#1A1A2E' }}>JK No Jokes Bookkeeping</strong><br />
            Last updated: May 31, 2026
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: '600', color: '#1A1A2E', marginBottom: '12px' }}>{s.heading}</h2>
              {s.body && <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8, marginBottom: s.bullets || s.footer ? '12px' : 0 }}>{s.body}</p>}
              {s.bullets && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: s.footer ? '12px' : 0 }}>
                  {s.bullets.map((b, j) => <li key={j} style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>{b}</li>)}
                </ul>
              )}
              {s.footer && <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8 }}>{s.footer}</p>}
              {s.contact && (
                <div style={{ marginTop: '12px', padding: '20px 24px', background: '#E8E4DC', border: '1px solid #DDD8CE' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: '600', color: '#1A1A2E', marginBottom: '6px' }}>JK No Jokes Bookkeeping</div>
                  <div style={{ fontSize: '14px', color: '#5A6070' }}>Email: <a href="mailto:jk@jknojokes.com" style={{ color: '#C9A84C', textDecoration: 'none' }}>jk@jknojokes.com</a></div>
                  <div style={{ fontSize: '14px', color: '#5A6070' }}>Website: jknojokes.com</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #DDD8CE', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#F7F4EF' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '700', letterSpacing: '2px' }}>JK<span style={{ color: '#C9A84C' }}>.</span></div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>© {new Date().getFullYear()} JK NO JOKES BOOKKEEPING</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>PRIVACY</button>
          <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#C9A84C', letterSpacing: '1px' }}>TERMS</button>
        </div>
      </footer>
    </>
  )
}
