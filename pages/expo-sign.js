import Head from 'next/head'
import { useEffect, useRef } from 'react'

const GOLD = '#C9A84C', INK = '#1A1A2E'
const TARGET = 'https://www.jknojokes.com/expo'

// Printable table sign for the expo. Open /expo-sign, hit Print, prop it up next
// to the tablet. The QR (rendered in-browser) points to /expo so passersby can
// scan and enter their info even when you're talking to someone else.
export default function ExpoSign() {
  const qrRef = useRef(null)

  useEffect(() => {
    const render = () => {
      if (window.QRCode && qrRef.current) {
        qrRef.current.innerHTML = ''
        // eslint-disable-next-line new-cap
        new window.QRCode(qrRef.current, { text: TARGET, width: 300, height: 300, correctLevel: window.QRCode.CorrectLevel.M })
      }
    }
    if (window.QRCode) { render(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    s.onload = render
    document.body.appendChild(s)
  }, [])

  return (
    <>
      <Head>
        <title>Expo Sign — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#fff}
          @media print{ .no-print{display:none!important} @page{ margin:0.4in } }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', background: '#fff' }}>
        <button className="no-print" onClick={() => window.print()} style={{
          position: 'fixed', top: 20, right: 20, background: INK, color: '#F0DEAC', border: 'none',
          padding: '12px 20px', borderRadius: '6px', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '1px', cursor: 'pointer',
        }}>🖨 PRINT</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '40px', fontWeight: 700, letterSpacing: '2px', color: INK }}>
          JK<span style={{ color: GOLD }}>.</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '4px', color: GOLD, marginTop: '4px' }}>NO JOKES FINANCIALS</div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '54px', fontWeight: 700, color: INK, lineHeight: 1.05, margin: '40px 0 8px', maxWidth: '640px' }}>
          Do you know your <span style={{ color: GOLD }}>real</span> profit?
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#5A6070', maxWidth: '560px', lineHeight: 1.4 }}>
          Clean books + a live dashboard of your true numbers.
        </p>

        <div style={{ margin: '38px 0 16px', padding: '20px', border: `3px solid ${GOLD}`, borderRadius: '20px', background: '#fff' }}>
          <div ref={qrRef} style={{ width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        </div>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '20px', letterSpacing: '2px', color: INK, fontWeight: 500 }}>📱 SCAN ME</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', color: INK, marginTop: '16px', maxWidth: '560px', lineHeight: 1.3 }}>
          See the live demo + grab a free <span style={{ color: GOLD, fontWeight: 700 }}>$25 gift card</span> 🎁
        </p>
        <p className="no-print" style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#A8A095', marginTop: '24px' }}>{TARGET}</p>
      </div>
    </>
  )
}
