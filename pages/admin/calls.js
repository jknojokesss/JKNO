import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const GOLD = '#C9A84C', CREAM = '#F7F4EF', INK = '#1A1A2E', MUTED = '#5A6070', GREEN = '#2D6A4F'
const KEY = 'jknj_call_log'
const GOAL = 5

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calls() {
  const router = useRouter()
  const [log, setLog] = useState({})
  const [name, setName] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try { setLog(JSON.parse(localStorage.getItem(KEY) || '{}')) } catch (_) {}
    setLoaded(true)
  }, [])

  const save = (next) => { setLog(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch (_) {} }

  const today = new Date()
  const todayStr = fmt(today)
  const count = (d) => (log[d] || []).length

  const logCall = () => {
    const entry = { name: name.trim(), at: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
    save({ ...log, [todayStr]: [...(log[todayStr] || []), entry] })
    setName('')
  }
  const undo = (d, i) => save({ ...log, [d]: (log[d] || []).filter((_, k) => k !== i) })

  // This week, Mon–Fri
  const monday = new Date(today)
  const dow = today.getDay()
  monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow))
  const week = Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })

  const weekTotal = week.reduce((s, d) => s + count(fmt(d)), 0)
  const daysHit = week.filter((d) => count(fmt(d)) >= GOAL).length

  // Streak: consecutive most-recent weekdays (incl. today if done) hitting the goal
  let streak = 0
  {
    const d = new Date(today)
    // if today isn't done yet, start the count from yesterday
    if (count(todayStr) < GOAL) d.setDate(d.getDate() - 1)
    for (let i = 0; i < 60; i++) {
      const wd = d.getDay()
      if (wd !== 0 && wd !== 6) { if (count(fmt(d)) >= GOAL) streak++; else break }
      d.setDate(d.getDate() - 1)
    }
  }

  const todayCount = count(todayStr)
  const done = todayCount >= GOAL
  const isWeekend = dow === 0 || dow === 6

  const card = { background: '#fff', border: '1px solid #E8E1D4', borderRadius: '12px', padding: '22px' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#A99A82' }

  return (
    <>
      <Head>
        <title>Daily Call Tracker — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${CREAM};font-family:'DM Sans',sans-serif}::placeholder{color:#B3A88F}`}</style>
      </Head>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 18px 60px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '18px' }}>← Dashboard</button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, letterSpacing: '2px', color: INK }}>JK<span style={{ color: GOLD }}>.</span></span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: GOLD }}>DAILY CALL TRACKER</span>
        </div>
        <p style={{ color: MUTED, fontSize: '14px', marginBottom: '22px' }}>Goal: <strong>{GOAL} calls a day, Monday–Friday.</strong> Tap the button each time you make one.</p>

        {/* Today */}
        <div style={{ ...card, marginBottom: '16px', background: done ? '#F3F8F4' : '#fff', borderColor: done ? '#CFE4D6' : '#E8E1D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
            <div style={lbl}>TODAY · {DAYS[dow]} {today.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
            {isWeekend && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B3A88F' }}>weekend — no goal today</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 600, color: done ? GREEN : INK, lineHeight: 1 }}>
              {todayCount}<span style={{ color: '#B3A88F', fontSize: '30px' }}> / {GOAL}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array.from({ length: GOAL }, (_, i) => (
                <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: i < todayCount ? GOLD : '#EFE7D8', border: i < todayCount ? 'none' : '1px solid #E0D6C2' }} />
              ))}
            </div>
            {done && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: GREEN, fontWeight: 600 }}>🎉 GOAL HIT</div>}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && logCall()}
              placeholder="Who'd you call? (optional)"
              style={{ flex: 1, minWidth: '180px', padding: '13px 14px', fontSize: '15px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }} />
            <button onClick={logCall} style={{ background: GOLD, color: INK, border: 'none', borderRadius: '8px', padding: '13px 22px', fontFamily: 'DM Mono, monospace', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer' }}>+ LOG A CALL</button>
          </div>

          {(log[todayStr] || []).length > 0 && (
            <div style={{ marginTop: '14px' }}>
              {log[todayStr].map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F0EADF' }}>
                  <span style={{ fontSize: '13px', color: INK }}><span style={{ color: GOLD, marginRight: '8px' }}>#{i + 1}</span>{c.name || 'Call'} <span style={{ color: '#B3A88F', fontSize: '11px' }}>· {c.at}</span></span>
                  <button onClick={() => undo(todayStr, i)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>undo</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This week */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ ...lbl, marginBottom: '14px' }}>THIS WEEK</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {week.map((d, i) => {
              const c = count(fmt(d)), hit = c >= GOAL, isToday = fmt(d) === todayStr
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: '8px', background: hit ? '#EAF3EC' : '#FAF6EE', border: isToday ? `2px solid ${GOLD}` : '1px solid #EFE7D8' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, letterSpacing: '1px' }}>{DAYS[d.getDay()].toUpperCase()}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 600, color: hit ? GREEN : INK, margin: '4px 0 2px' }}>{c}</div>
                  <div style={{ fontSize: '14px' }}>{hit ? '✅' : c > 0 ? '◔' : '–'}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { k: 'CALLS THIS WEEK', v: weekTotal, sub: `goal ${GOAL * 5}` },
            { k: 'DAYS HIT GOAL', v: `${daysHit}/5`, sub: 'this week' },
            { k: 'CURRENT STREAK', v: `${streak}🔥`, sub: streak === 1 ? 'weekday' : 'weekdays' },
          ].map((s) => (
            <div key={s.k} style={{ ...card, flex: 1, minWidth: '150px', padding: '16px 18px' }}>
              <div style={lbl}>{s.k}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{s.v}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B3A88F', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {loaded && <p style={{ textAlign: 'center', color: '#B3A88F', fontSize: '11px', fontFamily: 'DM Mono, monospace', marginTop: '24px' }}>Saved in this browser · 5 a day keeps the pipeline full</p>}
      </div>
    </>
  )
}
