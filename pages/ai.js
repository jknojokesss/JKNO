import { useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'

const C = {
  paper: '#F2F0EA', card: '#FFFFFF', ink: '#1B1815', sub: '#6A655C', muted: '#9A9284',
  hair: '#DBD5C7', line: '#E6E1D6', red: '#B0281C', green: '#1C7A4E',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

// Sample questions + the plain-English answers the assistant will give, using
// Reydel's real figures so the preview feels like the finished product.
const SAMPLE = [
  { q: 'What was my best month this year?',
    a: 'June — $75,090 in sales, your strongest month on record. That’s up 48% over May, at a 52% net margin.' },
  { q: 'How’s my cash looking?',
    a: 'As of your last reconciled month (June 30) you had $20,897 in the bank. Operations threw off strong cash — most of it went to paying down the old loans.' },
  { q: 'What’s driving the business — tires or service?',
    a: 'New tires are ~72% of revenue, service & repair ~21%, used tires ~5%. So it’s mostly a tire shop, with a healthy service arm.' },
  { q: 'Which tire sizes sell best?',
    a: '235/60R17 and 235/60R18 lead, then 215/55R17. Your top five sizes make up over half of tire revenue.' },
]

export default function Ask() {
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])

  return (
    <>
      <Head><title>Reydel Tire — Ask</title></Head>
      <Shell active="ai">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.hair}`, padding: '12px 34px' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>REYDEL TIRE &amp; AUTO · LAKEWOOD, NJ</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.red }}>◷ COMING SOON</span>
        </div>

        <div style={{ padding: '32px 34px', maxWidth: 760 }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: head, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: '0.01em', textTransform: 'uppercase' }}>Ask</div>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.red, border: `1px solid ${C.red}`, padding: '3px 8px', letterSpacing: '0.08em' }}>COMING SOON</span>
          </div>
          <div style={{ fontFamily: ui, fontSize: 15, color: C.sub, marginTop: 8, maxWidth: 600, lineHeight: 1.5 }}>
            Ask a plain-English question about your shop’s numbers and get a straight answer — no spreadsheets, no digging through tabs. Here’s a preview of the kind of thing you’ll be able to ask:
          </div>

          {/* sample conversation */}
          <div style={{ marginTop: 26, border: `1px solid ${C.hair}`, background: C.card }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.hair}`, fontFamily: head, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
              Sample conversation
            </div>
            <div style={{ padding: '18px 20px' }}>
              {SAMPLE.map((m, i) => (
                <div key={i} style={{ marginTop: i ? 22 : 0 }}>
                  {/* question */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '78%', background: C.ink, color: '#F2F0EA', padding: '10px 14px', fontFamily: ui, fontSize: 14, lineHeight: 1.45 }}>{m.q}</div>
                  </div>
                  {/* answer */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <span style={{ width: 26, height: 26, flexShrink: 0, background: C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 14 }}>R</span>
                    <div style={{ maxWidth: '82%', background: C.paper, border: `1px solid ${C.line}`, padding: '10px 14px', fontFamily: ui, fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{m.a}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* disabled input */}
            <div style={{ borderTop: `1px solid ${C.hair}`, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', background: C.paper }}>
              <input disabled placeholder="Ask about your sales, cash, margins…" style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.hair}`, background: '#EDEAE1', color: C.muted, fontFamily: ui, fontSize: 13, outline: 'none' }} />
              <button disabled style={{ padding: '10px 16px', background: C.hair, color: C.muted, border: 'none', fontFamily: head, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'not-allowed' }}>Ask</button>
            </div>
          </div>

          <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 14 }}>
            Answers will pull live from your own books — sales, costs, cash and inventory. Launching soon.
          </div>
        </div>
      </Shell>
    </>
  )
}
