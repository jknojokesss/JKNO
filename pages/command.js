import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'

const NAVY = '#1e2d4e', GOLD = '#c9a84c', CREAM = '#faf7f2', MUTED = '#7a7068', BORDER = '#ddd5c4'
const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = "'Jost', -apple-system, system-ui, sans-serif"
const PRI = { high: { bg: '#fbeae7', fg: '#B23A2E', label: 'High' }, med: { bg: '#fff4dd', fg: '#8a6d2f', label: 'Med' }, low: { bg: '#eef1f6', fg: '#5a6b8a', label: 'Low' } }
const KINDS = [{ k: 'client', label: 'Clients' }, { k: 'shul', label: 'Saratoga Shteibel' }, { k: 'adar', label: 'Adar Global' }, { k: 'business', label: 'JKNOJOKES' }]
const STATUS_COLOR = { live: '#2e7d32', building: '#8a6d2f', onboarding: '#8a6d2f', paused: '#B23A2E', idea: MUTED }
const STATUSES = ['live', 'building', 'onboarding', 'paused', 'idea']
const money = (n) => (n || n === 0 ? '$' + Number(n).toLocaleString('en-US') : '')
const PASS_KEY = 'jk_command_code'

export default function Command() {
  const [passcode, setPasscode] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [q, setQ] = useState('')
  const [fProject, setFProject] = useState('')
  const [fPriority, setFPriority] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [ntTitle, setNtTitle] = useState('')
  const [ntProject, setNtProject] = useState('')
  const [ntPriority, setNtPriority] = useState('med')
  const [npName, setNpName] = useState('')
  const [npCompany, setNpCompany] = useState('')
  const toastTimer = useRef(null)

  function flash(m) { setToast(m); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2200) }
  async function call(code, action, extra) {
    const r = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: code, action, ...(extra || {}) }) })
    const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Request failed'); return d
  }
  async function run(action, extra, msg, code) {
    const used = code != null ? code : passcode
    setBusy(true); setError('')
    try {
      const d = await call(used, action, extra)
      setData(d)
      if (typeof window !== 'undefined') sessionStorage.setItem(PASS_KEY, used)
      if (msg) flash(msg)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(PASS_KEY) : ''
    if (!saved) return
    setPasscode(saved)
    run(undefined, null, null, saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- login ----
  if (!data) return (
    <>
      <Head><title>JK Command Center</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: SANS, display: 'flex', justifyContent: 'center', paddingTop: '14vh' }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, borderRadius: 6, padding: '26px 24px', width: 330 }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Command Center</div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Everything you're running, in one place.</div>
          <input type="password" value={passcode} placeholder="Passcode" onChange={(e) => setPasscode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') run() }} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 15, background: CREAM, outline: 'none' }} />
          {error && <div style={{ color: '#B23A2E', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button onClick={() => run()} disabled={busy} style={{ width: '100%', marginTop: 14, padding: 12, border: 'none', borderRadius: 5, background: NAVY, color: '#fff', fontWeight: 500, fontFamily: SANS, cursor: 'pointer' }}>{busy ? 'Loading…' : 'Enter'}</button>
        </div>
      </div>
    </>
  )

  const { projects, tasks, prospects, stats, byProject } = data
  const projectNames = projects.map((p) => p.name)

  // ---- task filtering + sort ----
  const rank = { high: 0, med: 1, low: 2 }
  let visible = tasks.filter((t) => (showDone ? true : t.status !== 'done'))
  if (fProject) visible = visible.filter((t) => t.project === fProject)
  if (fPriority) visible = visible.filter((t) => t.priority === fPriority)
  if (q.trim()) { const s = q.toLowerCase(); visible = visible.filter((t) => (t.title || '').toLowerCase().includes(s) || (t.project || '').toLowerCase().includes(s)) }
  visible.sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || rank[a.priority] - rank[b.priority] || a.id - b.id)

  function exportCsv() {
    const rows = [['Priority', 'Status', 'Project', 'Task', 'Source']].concat(tasks.map((t) => [t.priority, t.status, t.project || '', (t.title || '').replace(/"/g, '""'), t.source || '']))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'jk-action-items.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const tile = (n, label, color, onClick, active) => (
    <div onClick={onClick} style={{ flex: '1 1 120px', minWidth: 120, background: active ? NAVY : '#fff', border: `1px solid ${active ? NAVY : BORDER}`, borderRadius: 8, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: active ? '#fff' : (color || NAVY), lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,.8)' : MUTED, marginTop: 4, letterSpacing: '0.03em' }}>{label}</div>
    </div>
  )
  const chipBtn = (val, cur, set, label) => (
    <button onClick={() => set(cur === val ? '' : val)} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${cur === val ? NAVY : BORDER}`, background: cur === val ? NAVY : '#fff', color: cur === val ? '#fff' : NAVY, fontFamily: SANS, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{label}</button>
  )
  const sel = { padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 13, background: CREAM, fontFamily: SANS, outline: 'none' }

  return (
    <>
      <Head><title>JK Command Center</title><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex" /><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@0,500;0,600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" /></Head>
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: SANS, color: '#2a2a2a', padding: '26px 18px 70px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: NAVY }}>Command Center</div>
            <button onClick={() => run()} disabled={busy} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: SANS, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>{busy ? 'Refreshing…' : 'Refresh'}</button>
          </div>
          {error && <div style={{ color: '#B23A2E', fontSize: 13, margin: '8px 0' }}>{error}</div>}

          {/* stat tiles */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0 26px' }}>
            {tile(stats.openTasks, 'Open items', NAVY, () => { setFPriority(''); setShowDone(false); setFProject('') }, !fPriority && !fProject && !showDone)}
            {tile(stats.highOpen, 'High priority', '#B23A2E', () => setFPriority(fPriority === 'high' ? '' : 'high'), fPriority === 'high')}
            {tile(stats.clients, 'Clients', NAVY)}
            {tile(stats.live, 'Live apps', '#2e7d32')}
            {tile(stats.openProspects, 'Prospects', GOLD)}
          </div>

          {/* ACTION ITEMS */}
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: NAVY, marginBottom: 12 }}>Action Items</div>

          {/* add task */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input value={ntTitle} placeholder="Add an action item…" onChange={(e) => setNtTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ntTitle.trim()) { run('add_task', { title: ntTitle, project: ntProject || null, priority: ntPriority }, 'Added'); setNtTitle('') } }} style={{ flex: '2 1 260px', ...sel, background: '#fff' }} />
            <select value={ntProject} onChange={(e) => setNtProject(e.target.value)} style={sel}><option value="">— project —</option>{projectNames.map((n) => <option key={n} value={n}>{n}</option>)}</select>
            <select value={ntPriority} onChange={(e) => setNtPriority(e.target.value)} style={sel}><option value="high">High</option><option value="med">Med</option><option value="low">Low</option></select>
            <button onClick={() => { if (ntTitle.trim()) { run('add_task', { title: ntTitle, project: ntProject || null, priority: ntPriority }, 'Added'); setNtTitle('') } }} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: NAVY, color: '#fff', fontWeight: 500, fontFamily: SANS, cursor: 'pointer', fontSize: 13 }}>Add</button>
          </div>

          {/* filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <input value={q} placeholder="Search…" onChange={(e) => setQ(e.target.value)} style={{ ...sel, flex: '1 1 160px', background: '#fff' }} />
            <select value={fProject} onChange={(e) => setFProject(e.target.value)} style={sel}><option value="">All projects</option>{projectNames.map((n) => <option key={n} value={n}>{n}{byProject[n] ? ` (${byProject[n]})` : ''}</option>)}</select>
            {chipBtn('high', fPriority, setFPriority, 'High')}
            {chipBtn('med', fPriority, setFPriority, 'Med')}
            {chipBtn('low', fPriority, setFPriority, 'Low')}
            <button onClick={() => setShowDone(!showDone)} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${showDone ? NAVY : BORDER}`, background: showDone ? NAVY : '#fff', color: showDone ? '#fff' : NAVY, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>{showDone ? 'Hide done' : 'Show done'}</button>
            <button onClick={exportCsv} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${BORDER}`, background: '#fff', color: NAVY, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, marginLeft: 'auto' }}>Export CSV</button>
          </div>

          {/* task list */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 30 }}>
            {visible.length === 0 && <div style={{ padding: '20px 16px', color: MUTED, fontSize: 14, textAlign: 'center' }}>Nothing here — {q || fProject || fPriority ? 'no items match your filters.' : 'you\'re all caught up. 🎉'}</div>}
            {visible.map((t, i) => {
              const done = t.status === 'done', p = PRI[t.priority] || PRI.med
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 14px', borderTop: i ? `1px solid #f0ebe0` : 'none', background: done ? '#fbfaf7' : '#fff' }}>
                  <button onClick={() => run('toggle_task', { id: t.id }, done ? 'Reopened' : 'Done')} title="Toggle done" style={{ marginTop: 1, width: 20, height: 20, flexShrink: 0, borderRadius: 5, border: `1.5px solid ${done ? '#2e7d32' : '#cfc7b5'}`, background: done ? '#2e7d32' : '#fff', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '17px', padding: 0 }}>{done ? '✓' : ''}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, color: done ? MUTED : '#2a2a2a', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.35 }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5, alignItems: 'center' }}>
                      {t.project && <span onClick={() => setFProject(t.project)} style={{ fontSize: 11, color: NAVY, background: '#eef1f6', padding: '2px 8px', borderRadius: 10, cursor: 'pointer' }}>{t.project}</span>}
                      {t.source === 'review' && <span style={{ fontSize: 10.5, color: GOLD, border: `1px solid ${GOLD}`, padding: '1px 6px', borderRadius: 10 }}>review</span>}
                      {t.due_date && <span style={{ fontSize: 11, color: MUTED }}>{t.due_date}</span>}
                    </div>
                  </div>
                  <select value={t.priority} onChange={(e) => run('set_task', { id: t.id, priority: e.target.value })} style={{ border: 'none', background: p.bg, color: p.fg, fontSize: 11.5, fontWeight: 600, borderRadius: 10, padding: '3px 6px', fontFamily: SANS, cursor: 'pointer' }}><option value="high">High</option><option value="med">Med</option><option value="low">Low</option></select>
                  <button onClick={() => { if (confirm('Delete this item?')) run('del_task', { id: t.id }, 'Deleted') }} title="Delete" style={{ background: 'none', border: 'none', color: '#c9b8b0', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                </div>
              )
            })}
          </div>

          {/* PROJECTS */}
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: NAVY, marginBottom: 14 }}>Projects</div>
          {KINDS.map(({ k, label }) => {
            const list = projects.filter((p) => p.kind === k)
            if (!list.length) return null
            return (
              <div key={k} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {list.map((p) => (
                    <div key={p.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: NAVY, lineHeight: 1.15 }}>{p.name}</div>
                        <select value={p.status} onChange={(e) => run('set_project', { id: p.id, status: e.target.value }, 'Status saved')} style={{ border: 'none', background: 'transparent', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_COLOR[p.status] || MUTED, fontFamily: SANS, cursor: 'pointer' }}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {p.monthly_value ? <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{money(p.monthly_value)}<span style={{ fontSize: 11 }}>/mo{(p.notes || '').includes('CONFIRM') ? ' · confirm cadence' : ''}</span></div> : null}
                      {p.notes ? <div style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>{p.notes}</div> : null}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {byProject[p.name] ? <span onClick={() => { setFProject(p.name); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ fontSize: 11.5, color: '#B23A2E', background: '#fbeae7', padding: '3px 9px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>{byProject[p.name]} open</span> : <span style={{ fontSize: 11.5, color: '#2e7d32' }}>clear</span>}
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: NAVY, textDecoration: 'none', borderBottom: `1px solid ${BORDER}` }}>Open ↗</a>}
                        {p.admin_url && <a href={p.admin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: NAVY, textDecoration: 'none', borderBottom: `1px solid ${BORDER}` }}>Admin ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* PROSPECTS */}
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: NAVY, margin: '10px 0 12px' }}>Pipeline ({stats.openProspects})</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input value={npName} placeholder="Prospect name" onChange={(e) => setNpName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && npName.trim()) { run('add_prospect', { name: npName, company: npCompany || null }, 'Added'); setNpName(''); setNpCompany('') } }} style={{ flex: '1 1 160px', ...sel, background: '#fff' }} />
            <input value={npCompany} placeholder="Company (optional)" onChange={(e) => setNpCompany(e.target.value)} style={{ flex: '1 1 140px', ...sel, background: '#fff' }} />
            <button onClick={() => { if (npName.trim()) { run('add_prospect', { name: npName, company: npCompany || null }, 'Added'); setNpName(''); setNpCompany('') } }} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: NAVY, color: '#fff', fontWeight: 500, fontFamily: SANS, cursor: 'pointer', fontSize: 13 }}>Add</button>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {prospects.length === 0 && <div style={{ padding: '18px 16px', color: MUTED, fontSize: 14 }}>No prospects yet. Add one above, or import the LinkedIn list later.</div>}
            {prospects.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderTop: i ? `1px solid #f0ebe0` : 'none' }}>
                <div><div style={{ fontSize: 14.5, color: NAVY }}>{p.name}{p.company ? <span style={{ color: MUTED }}> · {p.company}</span> : ''}</div>{p.demo_industry && <div style={{ fontSize: 12, color: MUTED }}>{p.demo_industry}</div>}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={p.stage} onChange={(e) => run('set_prospect', { id: p.id, stage: e.target.value })} style={sel}>{['lead', 'demo_sent', 'followup', 'closing', 'won', 'lost'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <button onClick={() => { if (confirm('Delete this prospect?')) run('del_prospect', { id: p.id }, 'Deleted') }} title="Delete" style={{ background: 'none', border: 'none', color: '#c9b8b0', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: NAVY, color: '#fff', padding: '10px 22px', borderRadius: 24, fontSize: 13.5, boxShadow: '0 6px 20px rgba(30,45,78,.3)' }}>{toast}</div>}
      </div>
    </>
  )
}
