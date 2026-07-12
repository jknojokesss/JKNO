import Head from 'next/head'
import { ALL_DEMOS } from '../../lib/industryDemos'

const BOOK = 'https://calendly.com/jk-jknojokes/30min'

export default function DemoGallery() {
  return (
    <>
      <Head>
        <title>Live Industry Demos — JK No Jokes Financials</title>
        <meta name="description" content="20 live, clickable financial dashboard demos — one for your industry. Auto repair, HVAC, restaurants, construction, law firms, gyms, and more. No login, sample data." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F7F4EF;color:#1A1A2E;font-family:'DM Sans',sans-serif}
          .demo-card{display:block;text-decoration:none;background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:22px;transition:all .2s ease}
          .demo-card:hover{border-color:#C9A84C;transform:translateY(-3px);box-shadow:0 12px 32px rgba(26,26,46,.08)}
        `}</style>
      </Head>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#5A6070', letterSpacing: '1px', textDecoration: 'none' }}>← JKNOJOKES.COM</a>

        <div style={{ textAlign: 'center', margin: '36px 0 12px' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>
            — {ALL_DEMOS.length} LIVE DEMOS · NO LOGIN · CLICK AROUND
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            One of these is<br /><span style={{ color: '#C9A84C' }}>your business.</span>
          </h1>
          <p style={{ color: '#5A6070', fontSize: '15px', lineHeight: 1.7, maxWidth: '520px', margin: '20px auto 0' }}>
            Every demo below is a real, clickable dashboard built the way we'd build yours —
            your revenue, your costs, your margin, in plain English. Find your industry and click in.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginTop: '40px' }}>
          {ALL_DEMOS.map((d) => (
            <a key={d.href} href={d.href} className="demo-card">
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>{d.emoji}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '2px', color: '#C9A84C', marginBottom: '6px' }}>{d.industry.toUpperCase()}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>{d.biz}</div>
              <div style={{ fontSize: '13px', color: '#5A6070', lineHeight: 1.6, marginBottom: '14px' }}>{d.blurb}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', color: '#B8943C' }}>OPEN LIVE DEMO →</div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '56px', background: 'linear-gradient(160deg, #1A2035 0%, #242C4A 100%)', borderRadius: '12px', padding: '48px 24px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: '#F7F4EF', marginBottom: '10px' }}>
            Don't see your industry?
          </div>
          <p style={{ color: '#9AA3BD', fontSize: '14px', marginBottom: '24px' }}>
            We'll build a demo around <i>your</i> business before you pay a dime. Free consult + $25 gift card for new clients.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: '#C9A84C', color: '#080808', textDecoration: 'none', padding: '15px 32px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px', display: 'inline-block' }}>
            BOOK A FREE CONSULT →
          </a>
        </div>
      </div>
    </>
  )
}
