import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const GOLD = '#C9A84C', CREAM = '#F7F4EF', INK = '#1A1A2E', MUTED = '#5A6070', GREEN = '#2D6A4F'
const KEY = 'jknj_leads'

const STAGES = [
  { id: 'new', label: 'New', color: '#5A6070' },
  { id: 'contacted', label: 'Contacted', color: '#C9852C' },
  { id: 'demo', label: 'Demo Sent', color: '#2C7BC9' },
  { id: 'meeting', label: 'Meeting', color: '#7A3CC9' },
  { id: 'proposal', label: 'Proposal', color: '#B07B16' },
  { id: 'won', label: 'Won 🎉', color: GREEN },
  { id: 'lost', label: 'Lost', color: '#A23B2D' },
]
const STAGE = Object.fromEntries(STAGES.map(s => [s.id, s]))
const ACTIVE = ['new', 'contacted', 'demo', 'meeting', 'proposal']
const FUNNEL = ['new', 'contacted', 'demo', 'meeting', 'proposal']
const SOURCES = ['Referral', 'Expo', 'LinkedIn', 'WhatsApp', 'Cold call', 'Website', 'Other']

const now = () => new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
const uid = () => Math.random().toString(36).slice(2, 9)

// Seeded with JK's real pipeline so the tracker is useful on first open.
const SEED = [
  { id: uid(), business: 'Reydel Tire', contact: 'Reydel', source: 'Referral', value: 500, stage: 'won',
    next: '', notes: 'First client — came through current employer. Keep them thrilled, ask for a referral.', log: [{ at: now(), text: 'Marked Won 🎉' }] },
  { id: uid(), business: 'Country Crave', contact: '', source: 'Expo', value: 400, stage: 'demo',
    next: 'Follow up on the dashboard + $25 offer', notes: 'Peanut chew wholesaler to supermarkets. Met at SIXPO. Sent email + called. Brown dashboard built.', log: [{ at: now(), text: 'Demo sent' }] },
  { id: uid(), business: 'YT Appliance Repair', contact: '', source: 'Cold call', value: 350, stage: 'contacted',
    next: 'Re-engage — first call he hung up after 10s, email sent. Try a different angle.', notes: 'Slate/orange dashboard built (jobs + line items + techs). Hung up fast on call; emailed after.', log: [{ at: now(), text: 'Called + emailed' }] },
  { id: uid(), business: "Aryeh's SBA", contact: 'Aryeh', source: 'Referral', value: 0, stage: 'demo',
    next: 'Lock in the referral partnership — he feeds me messy-books deals, I make him look good', notes: '⭐ REFERRAL SOURCE, not a paying client. SBA loan guy — sees businesses that need clean books to get funded. Dashboard built.', log: [{ at: now(), text: 'Demo sent' }] },
  { id: uid(), business: 'Bear & Wolf', contact: '', source: 'Referral', value: 0, stage: 'demo',
    next: 'Pitch the partnership: I get sellers sale-ready, you close more deals', notes: '⭐ REFERRAL SOURCE — business broker. Sellers need clean books to survive due diligence. Black/green deal-desk dashboard built.', log: [{ at: now(), text: 'Demo sent' }] },
  { id: uid(), business: 'Mint Capital', contact: '', source: 'Referral', value: 300, stage: 'demo',
    next: 'Follow up on the mortgage dashboard', notes: 'Mortgage broker. Mint-themed pipeline dashboard built.', log: [{ at: now(), text: 'Demo sent' }] },
]

export default function Leads() {
  const router = useRouter()
  const [leads, setLeads] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [showClosed, setShowClosed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ business: '', contact: '', source: 'Referral', value: '' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      setLeads(raw ? JSON.parse(raw) : SEED)
    } catch (_) { setLeads(SEED) }
    setLoaded(true)
  }, [])

  const save = (next) => { setLeads(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch (_) {} }

  const addLead = () => {
    if (!f.business.trim()) return
    const lead = { id: uid(), business: f.business.trim(), contact: f.contact.trim(), source: f.source,
      value: Number(f.value) || 0, stage: 'new', next: '', notes: '', log: [{ at: now(), text: 'Added as a new lead' }] }
    save([lead, ...leads])
    setF({ business: '', contact: '', source: 'Referral', value: '' })
    setAdding(false)
  }
  const setStage = (id, stage) => save(leads.map(l => l.id === id
    ? { ...l, stage, log: [{ at: now(), text: `Moved to ${STAGE[stage].label.replace(' 🎉', '')}` }, ...(l.log || [])] }
    : l))
  const setField = (id, field, val) => save(leads.map(l => l.id === id ? { ...l, [field]: val } : l))
  const remove = (id) => save(leads.filter(l => l.id !== id))

  const active = leads.filter(l => ACTIVE.includes(l.stage))
  const closed = leads.filter(l => !ACTIVE.includes(l.stage))
  const pipeline = active.reduce((s, l) => s + (l.value || 0), 0)
  const demosOut = active.filter(l => ['demo', 'meeting', 'proposal'].includes(l.stage)).length
  const won = leads.filter(l => l.stage === 'won').length
  const hitList = active.filter(l => (l.next || '').trim())

  const card = { background: '#fff', border: '1px solid #E8E1D4', borderRadius: '12px', padding: '20px' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#A99A82' }

  const StageSelect = ({ lead }) => (
    <select value={lead.stage} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setStage(lead.id, e.target.value) }}
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 11px',
        borderRadius: '20px', border: 'none', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.5px',
        fontWeight: 600, color: '#fff', background: `${STAGE[lead.stage].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {STAGES.map(s => <option key={s.id} value={s.id} style={{ color: INK, background: '#fff' }}>{s.label}</option>)}
    </select>
  )

  const LeadCard = ({ lead }) => {
    const open = expanded === lead.id
    return (
      <div style={{ ...card, padding: '0', marginBottom: '12px', overflow: 'hidden', borderColor: open ? GOLD : '#E8E1D4' }}>
        <div onClick={() => setExpanded(open ? null : lead.id)} style={{ padding: '16px 18px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '21px', fontWeight: 600, color: INK, lineHeight: 1.1 }}>
                {lead.business}
              </div>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                {lead.contact && <span>{lead.contact} · </span>}
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', color: '#A99A82', textTransform: 'uppercase' }}>{lead.source}</span>
                {lead.value > 0 && <span style={{ color: GREEN, fontWeight: 600 }}> · ${lead.value}/mo</span>}
                {lead.value === 0 && !ACTIVE.includes('x') && <span style={{ color: '#B07B16' }}> · ⭐ partner</span>}
              </div>
            </div>
            <StageSelect lead={lead} />
          </div>
          {lead.next && !open && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: INK, background: '#FBF7EE', border: '1px solid #F0E7D3', borderRadius: '8px', padding: '8px 11px' }}>
              🎯 <strong>Next:</strong> {lead.next}
            </div>
          )}
        </div>

        {open && (
          <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F0EADF' }}>
            <div style={{ ...lbl, margin: '14px 0 6px' }}>NEXT ACTION</div>
            <input value={lead.next} onChange={(e) => setField(lead.id, 'next', e.target.value)}
              placeholder="What's the very next thing you need to do?"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }} />

            <div style={{ ...lbl, margin: '16px 0 6px' }}>NOTES</div>
            <textarea value={lead.notes} onChange={(e) => setField(lead.id, 'notes', e.target.value)} rows={3}
              placeholder="Context, what they need, what was said…"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', alignItems: 'center' }}>
              <button onClick={() => setStage(lead.id, 'won')} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>✓ WON</button>
              <button onClick={() => setStage(lead.id, 'lost')} style={{ background: 'none', color: '#A23B2D', border: '1px solid #E7C9C3', borderRadius: '8px', padding: '9px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>LOST</button>
              <button onClick={() => { if (confirm(`Delete ${lead.business}?`)) remove(lead.id) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>delete</button>
            </div>

            {(lead.log || []).length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #F0EADF', paddingTop: '12px' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>ACTIVITY</div>
                {lead.log.map((e, i) => (
                  <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '3px 0' }}>
                    <span style={{ color: '#B3A88F', fontFamily: 'DM Mono, monospace', marginRight: '8px' }}>{e.at}</span>{e.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Lead Tracker — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${CREAM};font-family:'DM Sans',sans-serif}::placeholder{color:#B3A88F}`}</style>
      </Head>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 18px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>← Dashboard</button>
          <button onClick={() => router.push('/admin/calls')} style={{ background: 'none', border: '1px solid #E0D6C2', borderRadius: '20px', color: INK, fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', padding: '7px 14px' }}>📞 Call Tracker →</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, letterSpacing: '2px', color: INK }}>JK<span style={{ color: GOLD }}>.</span></span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: GOLD }}>LEAD TRACKER</span>
        </div>
        <p style={{ color: MUTED, fontSize: '14px', marginBottom: '22px' }}>Every prospect, every stage, one screen. <strong>Work the hit list. Move the stage. Close the deal.</strong></p>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { k: 'ACTIVE LEADS', v: active.length, sub: 'in the pipeline' },
            { k: 'PIPELINE / MO', v: `$${pipeline.toLocaleString()}`, sub: 'if they all close' },
            { k: 'DEMOS OUT', v: demosOut, sub: 'awaiting a yes' },
            { k: 'CLIENTS WON', v: won, sub: 'on the board' },
          ].map(s => (
            <div key={s.k} style={{ ...card, flex: 1, minWidth: '150px', padding: '16px 18px' }}>
              <div style={lbl}>{s.k}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{s.v}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B3A88F', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Funnel */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ ...lbl, marginBottom: '12px' }}>PIPELINE FUNNEL</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {FUNNEL.map(id => {
              const c = active.filter(l => l.stage === id).length
              return (
                <div key={id} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: '8px', background: c > 0 ? `${STAGE[id].color}14` : '#FAF6EE', border: `1px solid ${c > 0 ? STAGE[id].color + '44' : '#EFE7D8'}` }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 600, color: c > 0 ? STAGE[id].color : '#C9BBA0', lineHeight: 1 }}>{c}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: MUTED, letterSpacing: '0.5px', marginTop: '4px' }}>{STAGE[id].label.toUpperCase()}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hit list */}
        {hitList.length > 0 && (
          <div style={{ ...card, marginBottom: '16px', background: '#1A1A2E', borderColor: '#1A1A2E' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: GOLD, marginBottom: '12px' }}>🎯 YOUR HIT LIST — CHASE THESE NEXT</div>
            {hitList.map(l => (
              <div key={l.id} onClick={() => setExpanded(l.id)} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderBottom: '1px solid #2A2A40', cursor: 'pointer', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', color: '#fff', fontWeight: 600, minWidth: '130px' }}>{l.business}</span>
                <span style={{ fontSize: '13px', color: '#C9C4D6' }}>{l.next}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add lead */}
        {!adding ? (
          <button onClick={() => setAdding(true)} style={{ width: '100%', background: GOLD, color: INK, border: 'none', borderRadius: '10px', padding: '14px', fontFamily: 'DM Mono, monospace', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '20px' }}>+ ADD A LEAD</button>
        ) : (
          <div style={{ ...card, marginBottom: '20px' }}>
            <div style={{ ...lbl, marginBottom: '12px' }}>NEW LEAD</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} placeholder="Business name *" style={{ flex: 2, minWidth: '160px', padding: '12px', fontSize: '15px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }} />
              <input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Contact name" style={{ flex: 1, minWidth: '120px', padding: '12px', fontSize: '15px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} style={{ flex: 1, minWidth: '130px', padding: '12px', fontSize: '15px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} type="number" placeholder="$ / mo (0 if partner)" style={{ flex: 1, minWidth: '130px', padding: '12px', fontSize: '15px', border: '1px solid #E0D6C2', borderRadius: '8px', background: CREAM, color: INK, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: '1px solid #E0D6C2', borderRadius: '8px', padding: '12px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
              <button onClick={addLead} style={{ flex: 2, background: INK, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD LEAD</button>
            </div>
          </div>
        )}

        {/* Active leads */}
        {active.length === 0 && <p style={{ textAlign: 'center', color: '#B3A88F', fontSize: '14px', padding: '20px 0' }}>No active leads. Add one above and go get 'em.</p>}
        {active.map(l => <LeadCard key={l.id} lead={l} />)}

        {/* Closed */}
        {closed.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <button onClick={() => setShowClosed(!showClosed)} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', padding: '10px 0' }}>
              {showClosed ? '▾' : '▸'} CLOSED ({closed.length}) — {won} won · {closed.length - won} lost
            </button>
            {showClosed && closed.map(l => <LeadCard key={l.id} lead={l} />)}
          </div>
        )}

        {loaded && <p style={{ textAlign: 'center', color: '#B3A88F', fontSize: '11px', fontFamily: 'DM Mono, monospace', marginTop: '24px' }}>Saved in this browser · A tracked lead is a lead you don't forget</p>}
      </div>
    </>
  )
}
