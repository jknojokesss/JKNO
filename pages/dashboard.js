import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { priceLines } from '../lib/orderCost'

// MOVED: this page is served from jknojokesss/reydel (https://reydel.vercel.app).
// next.config.js redirects /dashboard there. Edits in this file do not reach Thomas.

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }

// Warm-paper / graphite design tokens.
const C = {
  paper: '#F2F0EA', card: '#FFFFFF', ink: '#1B1815', sub: '#6A655C', muted: '#9A9284',
  hair: '#DBD5C7', line: '#E6E1D6', red: '#B0281C', green: '#1C7A4E',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

function normalizeItemName(name) {
  if (!name) return 'Unknown'
  return name.replace(/(\d{3})[\s\/\-]?(\d{2})[\s\/\-]?R(\d{2})/gi, '$1/$2/$3').replace(/(\d{3})\s(\d{2})\s(\d{2})/g, '$1/$2/$3').trim()
}

// Category from the (inconsistent) Clover item name — not Clover's own field.
const SERVICE_RE = /align|mount|balance|patch|plug|rotat|labor|install|valve|tpms|service|repair|brake|sensor|wiper|batter|light|bulb|\bair\b|spare|lug|rim|stud|seal|oil|filter|fix|swap|band/
function saleCategory(name) {
  const n = (name || '').toLowerCase().trim()
  if (!n) return 'other'
  if (n.length <= 5 && /tip/.test(n)) return 'tips'
  if (/\d{3}[\s/\\-]?\d{2}[\s/\\-]?r?\d{2}/.test(n)) return 'new_tire'
  if (/used/.test(n)) return 'used_tire'
  if (SERVICE_RE.test(n)) return 'service'
  return 'other'
}
const MIX_META = {
  new_tire:  { label: 'New Tires',        color: '#B0281C' },
  service:   { label: 'Service & Repair', color: '#8A8577' },
  used_tire: { label: 'Used Tires',       color: '#B9AE9A' },
  other:     { label: 'Other',            color: '#D3CBBA' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, padding: '9px 12px' }}>
      <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, marginBottom: 5 }}>{label}</div>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.name} style={{ fontFamily: mono, fontSize: 12, color: p.color, fontWeight: 500 }}>{p.name}: {fmt(p.value * 1000)}</div>
      ))}
    </div>
  )
}

async function fetchAllClover() {
  let all = [], from = 0
  while (true) {
    const { data } = await supabase.from('clover_line_items').select('item_name, revenue, quantity, date, order_id').range(from, from + 999)
    if (!data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

export default function Dashboard() {
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [monthly, setMonthly] = useState([])
  const [clover, setClover] = useState([])
  const [weldon, setWeldon] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [{ data }, cloverRows, w] = await Promise.all([
        supabase.from('monthly_summary').select('*').order('month'),
        fetchAllClover(),
        supabase.from('weldon_orders').select('order_date, size, qty, unit_cost, description, po_number'),
      ])
      if (data) setMonthly(data.map(r => ({
        month: r.month.slice(0, 7), label: MONTHS[r.month.slice(5, 7)] || r.month.slice(5, 7),
        revenue: parseFloat(r.revenue), expenses: parseFloat(r.expenses), profit: parseFloat(r.profit), cogs: parseFloat(r.cogs),
      })))
      setClover(cloverRows)
      setWeldon(w.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const nowD = new Date()
  const curKey = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`
  const closed = monthly.filter(m => m.month < curKey)
  const totalProfit = closed.reduce((s, r) => s + r.profit, 0)
  const totalRevenue = closed.reduce((s, r) => s + r.revenue, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

  const last = closed[closed.length - 1]
  const prev = closed[closed.length - 2]
  const year = last ? last.month.slice(0, 4) : String(nowD.getFullYear())
  const fullMonth = last ? new Date(`${last.month}-01T00:00:00`).toLocaleDateString([], { month: 'long' }) : ''
  const momRev = last && prev && prev.revenue ? (last.revenue - prev.revenue) / prev.revenue * 100 : null
  const grossLast = last ? last.revenue - last.cogs : 0
  const netMarginLast = last && last.revenue ? last.profit / last.revenue * 100 : 0
  const ytd = closed.filter(r => r.month.slice(0, 4) === year)
  const ytdRev = ytd.reduce((s, r) => s + r.revenue, 0)
  const ytdProfit = ytd.reduce((s, r) => s + r.profit, 0)
  const isRecord = last && closed.every(m => m.revenue <= last.revenue)
  const growthPhrase = momRev != null ? (momRev >= 0 ? `up ${Math.round(momRev)}% over ${prev.label}` : `down ${Math.round(Math.abs(momRev))}% from ${prev.label}`) : ''

  const now = new Date()
  const monthStart = `${curKey}-01`
  const wd = new Date(now); wd.setDate(now.getDate() - 6)
  const weekStart = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
  const startStr = period === 'week' ? weekStart : monthStart
  const openLabel = period === 'week' ? 'last 7 days' : now.toLocaleDateString([], { month: 'long' }) + ' so far'

  const register = useMemo(() => {
    const lines = clover.filter(r => r.date && r.date >= startStr)
    const priced = priceLines(lines, weldon)
    const sale = priced.reduce((s, r) => s + r.sale, 0)
    const cost = priced.reduce((s, r) => s + r.cost, 0)
    const tickets = new Set(priced.map(r => r.orderId).filter(Boolean)).size
    const units = priced.reduce((s, r) => s + (Number(r.qty) || 1), 0)
    return {
      sale, cost, profit: sale - cost,
      margin: sale > 0 ? (sale - cost) / sale * 100 : 0,
      tickets, units, n: priced.length,
      avg: tickets ? sale / tickets : 0,
    }
  }, [clover, weldon, startStr])

  const lastMonth = last?.month
  const lastRows = lastMonth ? clover.filter(r => r.date && r.date.slice(0, 7) === lastMonth) : []
  const lastUnits = lastRows.reduce((s, r) => s + Number(r.quantity || 1), 0)

  const mix = useMemo(() => {
    const rows = lastMonth ? clover.filter(r => r.date && r.date.slice(0, 7) === lastMonth) : []
    const cats = {}
    rows.forEach(r => { const c = saleCategory(r.item_name); if (c === 'tips') return; const k = MIX_META[c] ? c : 'other'; cats[k] = (cats[k] || 0) + Number(r.revenue || 0) })
    const total = Object.values(cats).reduce((s, v) => s + v, 0)
    return { list: Object.entries(cats).map(([k, rev]) => ({ ...MIX_META[k], rev })).sort((a, b) => b.rev - a.rev), total }
  }, [clover, lastMonth])
  const tireShare = mix.total ? Math.round((mix.list.find(c => c.label === 'New Tires')?.rev || 0) / mix.total * 100) : 0

  const topSizes = useMemo(() => {
    const rows = lastMonth ? clover.filter(r => r.date && r.date.slice(0, 7) === lastMonth) : []
    const map = {}
    rows.forEach(r => { if (saleCategory(r.item_name) !== 'new_tire') return; const k = normalizeItemName(r.item_name); if (!map[k]) map[k] = { name: k, revenue: 0, units: 0 }; map[k].revenue += Number(r.revenue || 0); map[k].units += Number(r.quantity || 1) })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
  }, [clover, lastMonth])

  const chartData = closed.map(m => ({ label: m.label, rev: m.revenue / 1000, exp: m.expenses / 1000, profit: m.profit / 1000 }))

  const panel = { background: C.card, border: `1px solid ${C.hair}`, padding: '18px 20px' }
  const secTitle = { fontFamily: head, fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '0.04em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: `1px solid ${C.hair}`, marginBottom: 12 }
  const strip = last ? [['Revenue', fmt(last.revenue)], ['Gross profit', fmt(grossLast)], ['Net margin', `${Math.round(netMarginLast)}%`], ['YTD revenue', fmt(ytdRev)], ['Tires sold', lastUnits.toLocaleString()]] : []

  return (
    <>
      <Head><title>Reydel Tire — Dashboard</title></Head>
      <Shell active="dashboard">
        {/* status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.hair}`, padding: '12px 34px' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>REYDEL TIRE &amp; AUTO · LAKEWOOD, NJ</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{last ? `BOOKS THROUGH ${last.label} ${year}` : ''}</span>
        </div>

        <div style={{ padding: '32px 34px', maxWidth: 1040 }}>
          {loading ? (
            <div style={{ color: C.muted, fontFamily: ui, fontSize: 12 }}>Loading…</div>
          ) : !last ? (
            <div style={{ color: C.muted, fontFamily: ui, fontSize: 13 }}>No closed months yet.</div>
          ) : (
            <>
              {/* This month at the register — Clover tickets, Weldon cost. Not the books. */}
              <div style={{ ...panel, marginBottom: 32, cursor: 'pointer' }} onClick={() => router.push('/orders')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{now.toLocaleDateString([], { month: 'long' })} · At the register</div>
                    <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 3 }}>Clover sales · Weldon cost · not closed books</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {[['week', '7 days'], ['month', 'This month']].map(([p, l]) => (
                      <button key={p} onClick={e => { e.stopPropagation(); setPeriod(p) }} style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.05em', padding: '5px 12px', cursor: 'pointer', border: `1px solid ${C.hair}`, background: period === p ? C.ink : C.card, color: period === p ? '#fff' : C.muted, textTransform: 'uppercase' }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex' }}>
                  {[
                    ['Sales', fmt(register.sale)],
                    ['Est. cost', fmt(register.cost)],
                    ['Est. gross', fmt(register.profit)],
                    ['Margin', register.sale ? `${Math.round(register.margin)}%` : '—'],
                    ['Tickets', register.tickets.toLocaleString()],
                  ].map(([l, v], i) => (
                    <div key={l} style={{ flex: 1, padding: '10px 14px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
                      <div style={{ fontFamily: ui, fontSize: 10.5, color: C.muted }}>{l}</div>
                      <div style={{ fontFamily: mono, fontSize: 16, color: l === 'Est. gross' ? C.green : C.ink, fontWeight: 500, marginTop: 4 }}>{v}</div>
                      <div style={{ fontFamily: ui, fontSize: 9, color: C.muted, marginTop: 2 }}>{openLabel}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HERO — last closed month */}
              <div style={{ fontFamily: head, fontSize: 13, fontWeight: 600, color: C.red, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Net Profit · {fullMonth} {year}</div>
              <div style={{ fontFamily: head, fontSize: 72, fontWeight: 700, color: C.ink, lineHeight: 1, margin: '6px 0 12px' }}>{fmt(last.profit)}</div>
              <div style={{ fontFamily: ui, fontSize: 16, color: C.sub, maxWidth: 640, lineHeight: 1.5 }}>
                {isRecord ? `${fullMonth} was Reydel's strongest month on record — ` : `${fullMonth} brought in `}
                <span style={{ color: C.ink, fontWeight: 500 }}>{fmt(last.revenue)} in sales{growthPhrase ? `, ${growthPhrase}` : ''}</span>, at a {Math.round(netMarginLast)}% net margin.{tireShare ? ` Tires drove ${tireShare}% of it; service and used the rest.` : ''}
              </div>

              {/* inline stat strip */}
              <div style={{ display: 'flex', marginTop: 24, borderTop: `1px solid ${C.hair}`, borderBottom: `1px solid ${C.hair}` }}>
                {strip.map(([l, v], i) => (
                  <div key={l} style={{ flex: 1, padding: '13px 18px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
                    <div style={{ fontFamily: ui, fontSize: 11, color: C.muted }}>{l}</div>
                    <div style={{ fontFamily: mono, fontSize: 17, color: C.ink, fontWeight: 500, marginTop: 5 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* chart + profit table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, marginTop: 30 }}>
                <div style={panel}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...secTitle }}>
                    <span>Revenue, Expenses &amp; Profit</span>
                    <button onClick={() => router.push('/financials')} style={{ fontFamily: mono, fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>FULL P&amp;L →</button>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    {[[C.red, 'Revenue'], ['#CBC2B0', 'Expenses'], [C.green, 'Profit']].map(([c, l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: ui, fontSize: 10, color: C.sub }}>
                        <span style={{ width: 8, height: 8, background: c, display: 'inline-block' }} />{l}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={2} barCategoryGap="26%">
                      <CartesianGrid strokeDasharray="2 3" stroke={C.line} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted, fontFamily: mono }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: mono }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(176,40,28,0.05)' }} />
                      <Bar dataKey="rev" name="Revenue" fill={C.red} />
                      <Bar dataKey="exp" name="Expenses" fill="#CBC2B0" />
                      <Line dataKey="profit" name="Profit" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div style={panel}>
                  <div style={secTitle}>Profit by Month</div>
                  {closed.map(m => (
                    <div key={m.month} onClick={() => router.push('/financials')}
                      onMouseEnter={e => e.currentTarget.style.background = C.paper} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderTop: `1px solid ${C.line}`, cursor: 'pointer' }}>
                      <span style={{ fontFamily: ui, fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{m.label} {m.month.slice(0, 4)}</span>
                      <span style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: mono, fontSize: 12.5, color: C.green, fontWeight: 500 }}>{fmt(m.profit)}</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, width: 46, textAlign: 'right' }}>{m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}</span>
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 0', borderTop: `2px solid ${C.hair}`, marginTop: 2 }}>
                    <span style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total</span>
                    <span style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: mono, fontSize: 13, color: C.green, fontWeight: 600 }}>{fmt(totalProfit)}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, width: 46, textAlign: 'right' }}>{avgMargin}%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* mix + top sizes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 24, marginTop: 24 }}>
                <div style={panel}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...secTitle }}>
                    <span>Sales Mix · {last.label}</span>
                    <button onClick={() => router.push('/inventory')} style={{ fontFamily: mono, fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>ITEMS →</button>
                  </div>
                  {/* one 100% bar, split by category */}
                  <div onClick={() => router.push('/inventory')} style={{ display: 'flex', width: '100%', height: 36, cursor: 'pointer', border: `1px solid ${C.hair}` }}>
                    {mix.list.map((c, i) => {
                      const p = mix.total > 0 ? c.rev / mix.total * 100 : 0
                      return (
                        <div key={c.label} title={`${c.label} · ${p.toFixed(0)}%`}
                          style={{ width: `${p}%`, background: c.color, borderLeft: i ? `1px solid ${C.paper}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {p >= 9 && <span style={{ fontFamily: mono, fontSize: 11, color: '#fff', fontWeight: 600 }}>{p.toFixed(0)}%</span>}
                        </div>
                      )
                    })}
                  </div>
                  {/* legend */}
                  <div style={{ marginTop: 14 }}>
                    {mix.list.map((c, i) => {
                      const p = mix.total > 0 ? c.rev / mix.total * 100 : 0
                      return (
                        <div key={c.label} onClick={() => router.push('/inventory')}
                          onMouseEnter={e => e.currentTarget.style.background = C.paper} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px', margin: '0 -6px', borderTop: i ? `1px solid ${C.line}` : 'none', cursor: 'pointer' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: ui, fontSize: 13, color: C.ink, fontWeight: 500 }}>
                            <span style={{ width: 10, height: 10, background: c.color, display: 'inline-block' }} />{c.label}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{p.toFixed(0)}%</span>
                            <span style={{ fontFamily: mono, fontSize: 13, color: C.ink, fontWeight: 600 }}>{fmt(c.rev)}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={panel}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...secTitle }}>
                    <span>Top Tire Sizes · {last.label}</span>
                    <button onClick={() => router.push('/inventory')} style={{ fontFamily: mono, fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>ALL →</button>
                  </div>
                  {topSizes.map((t, i) => (
                    <div key={t.name} onClick={() => router.push(`/inventory?q=${encodeURIComponent(t.name)}`)}
                      onMouseEnter={e => e.currentTarget.style.background = C.paper} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 6px', margin: '0 -6px', borderTop: i ? `1px solid ${C.line}` : 'none', cursor: 'pointer' }}>
                      <span style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 10, fontWeight: 600, background: i < 3 ? C.red : '#E0D9CA', color: i < 3 ? '#fff' : C.sub }}>{i + 1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: ui, fontSize: 12.5, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                        <div style={{ fontFamily: mono, fontSize: 9.5, color: C.muted }}>{t.units.toLocaleString()} sold</div>
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{fmt(t.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Shell>
    </>
  )
}
