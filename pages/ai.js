import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { STARTERS, buildFacts, answerAsk } from '../lib/askAnswer'

const C = {
  paper: '#F2F0EA', card: '#FFFFFF', ink: '#1B1815', sub: '#6A655C', muted: '#9A9284',
  hair: '#DBD5C7', line: '#E6E1D6', red: '#B0281C',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

async function fetchAllClover() {
  let all = [], from = 0
  while (true) {
    const { data } = await supabase.from('clover_line_items').select('item_name, revenue, quantity, date, order_id').range(from, from + 999)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

export default function Ask() {
  const [facts, setFacts] = useState(null)
  const [messages, setMessages] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const bottom = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') })
  }, [])

  useEffect(() => {
    async function load() {
      const [{ data: mData }, { data: bData }, clover] = await Promise.all([
        supabase.from('monthly_summary').select('month, revenue, profit, cogs').order('month'),
        supabase.from('bs_totals').select('account, amount'),
        fetchAllClover(),
      ])
      const monthly = (mData || []).map((r) => ({
        month: String(r.month).slice(0, 7),
        revenue: Number(r.revenue),
        profit: Number(r.profit),
        cogs: Number(r.cogs),
      }))
      setFacts(buildFacts({ monthly, bs: bData || [], clover }))
    }
    load()
  }, [])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])

  const ask = (text) => {
    const question = (text || q).trim()
    if (!question || busy || !facts) return
    setQ('')
    setBusy(true)
    setMessages((m) => [...m, { role: 'user', text: question }])
    // Same-tick paint so the question shows before the answer lands.
    setTimeout(() => {
      const { answer } = answerAsk(question, facts)
      setMessages((m) => [...m, { role: 'assistant', text: answer }])
      setBusy(false)
    }, 250)
  }

  return (
    <>
      <Head><title>Reydel Tire — Ask</title></Head>
      <Shell active="ai">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.hair}`, padding: '12px 34px' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>REYDEL TIRE &amp; AUTO · LAKEWOOD, NJ</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{facts?.booksThroughName ? `BOOKS THROUGH ${facts.booksThroughName.toUpperCase()}` : ''}</span>
        </div>

        <div style={{ padding: '32px 34px', maxWidth: 760 }}>
          <div style={{ fontFamily: head, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: '0.01em', textTransform: 'uppercase' }}>Ask</div>
          <div style={{ fontFamily: ui, fontSize: 15, color: C.sub, marginTop: 8, maxWidth: 600, lineHeight: 1.5 }}>
            Ask about your shop’s numbers. Answers come from your books and Clover — not a chatbot.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} disabled={!facts || busy} style={{
                padding: '8px 12px', background: C.card, border: `1px solid ${C.hair}`, cursor: facts && !busy ? 'pointer' : 'default',
                fontFamily: ui, fontSize: 12, color: C.ink, textAlign: 'left',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ marginTop: 18, border: `1px solid ${C.hair}`, background: C.card }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.hair}`, fontFamily: head, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
              {messages.length ? 'Conversation' : 'Start with a question'}
            </div>
            <div style={{ padding: '18px 20px', minHeight: 120 }}>
              {!facts && <div style={{ fontFamily: ui, fontSize: 13, color: C.muted }}>Loading your numbers…</div>}
              {facts && !messages.length && (
                <div style={{ fontFamily: ui, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                  Sales, cash, tires vs service, sizes, this month at the register. Pick one above or type it.
                </div>
              )}
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: i ? 22 : 0 }}>
                    <div style={{ maxWidth: '78%', background: C.ink, color: '#F2F0EA', padding: '10px 14px', fontFamily: ui, fontSize: 14, lineHeight: 1.45 }}>{m.text}</div>
                  </div>
                ) : (
                  <div key={i} style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <span style={{ width: 26, height: 26, flexShrink: 0, background: C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 14 }}>R</span>
                    <div style={{ maxWidth: '82%', background: C.paper, border: `1px solid ${C.line}`, padding: '10px 14px', fontFamily: ui, fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                )
              ))}
              {busy && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, background: C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 14 }}>R</span>
                  <div style={{ fontFamily: ui, fontSize: 13, color: C.muted, padding: '10px 0' }}>Looking at the books…</div>
                </div>
              )}
              <div ref={bottom} />
            </div>
            <div style={{ borderTop: `1px solid ${C.hair}`, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', background: C.paper }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') ask() }}
                disabled={!facts || busy}
                placeholder="Ask about sales, cash, margins…"
                style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.hair}`, background: '#fff', color: C.ink, fontFamily: ui, fontSize: 13, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => ask()}
                disabled={!facts || busy || !q.trim()}
                style={{ padding: '10px 16px', background: (!facts || busy || !q.trim()) ? C.hair : C.red, color: (!facts || busy || !q.trim()) ? C.muted : '#fff', border: 'none', fontFamily: head, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: (!facts || busy || !q.trim()) ? 'default' : 'pointer' }}
              >Ask</button>
            </div>
          </div>

          <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 14 }}>
            Closed books through {facts?.booksThroughName || '—'}. This month at the register is Clover, not QuickBooks.
          </div>
        </div>
      </Shell>
    </>
  )
}
