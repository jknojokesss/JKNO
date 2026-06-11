import Head from 'next/head'
import { useRouter } from 'next/router'
import DemoDashboard from '../components/DemoDashboard'

const GOLD = '#C9A84C'

export default function Demo() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Live Demo — JK No Jokes Bookkeeping</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background:#F7F4EF; font-family:'DM Sans',sans-serif; }`}</style>
      </Head>

      {/* Demo banner */}
      <div style={{ background: GOLD, color: '#1A1A2E', textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        LIVE DEMO · SAMPLE DATA FOR A FICTIONAL SHOP — this is what your portal could look like
      </div>

      <DemoDashboard />

      {/* Bottom CTA */}
      <div style={{ maxWidth: '1080px', margin: '28px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', padding: '32px', background: '#fff', border: '1px solid #EDF2F7', borderRadius: '6px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 600, color: '#1A1A2E' }}>Want this for your business?</div>
          <p style={{ color: '#5A6070', fontSize: '14px', margin: '8px auto 20px', maxWidth: '440px', lineHeight: 1.6 }}>
            We'll build you a portal like this one — real numbers, synced from your POS, books that actually tie out.
          </p>
          <button onClick={() => { window.location.href = '/#contact' }} style={{ background: GOLD, color: '#1A1A2E', border: 'none', padding: '15px 34px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer', borderRadius: '2px' }}>
            GET STARTED →
          </button>
          <div style={{ marginTop: '14px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#5A6070', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>← Back to jknojokes.com</button>
          </div>
        </div>
      </div>
    </>
  )
}
