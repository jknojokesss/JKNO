import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import Shell from '../components/Shell'

const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
const pct  = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }
const ui = "'Inter', sans-serif"

// Warm cream design tokens — matches the Shell canvas.
const C = {
  card: '#fff', border: '#E7DECB', shadow: '0 1px 3px rgba(60,45,20,0.05)',
  ink: '#211E17', muted: '#a39a88', sub: '#6b6355', hover: '#F5EFE3', headBg: '#FAF6EC',
  red: '#CC2222', green: '#15803d', greenBg: '#dcfce7', gold: '#C9A84C',
}

// Canonicalize tire-size format so "235/60R17" and "235/60/17" group as one item.
function normalizeItemName(name) {
  if (!name) return 'Unknown'
  return name
    .replace(/(\d{3})[\s\/\-]?(\d{2})[\s\/\-]?R(\d{2})/gi, '$1/$2/$3')
    .replace(/(\d{3})\s(\d{2})\s(\d{2})/g, '$1/$2/$3')
    .trim()
}

function KPICard({ label, value, sub, trend, accent }) {
  const tColor = trend > 0 ? C.green : trend < 0 ? '#b91c1c' : C.sub
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px', flex: 1, minWidth: '168px', boxShadow: C.shadow, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: accent || C.red }} />
      <div style={{ fontSize: '9px', color: C.muted, letterSpacing: '0.14em', marginBottom: '9px', fontFamily: ui, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '24px', color: C.ink, fontWeight: 700, fontFamily: ui, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: trend != null ? tColor : C.sub, marginTop: '6px', fontFamily: ui, fontWeight: 500 }}>{trend != null && (trend > 0 ? '▲ ' : trend < 0 ? '▼ ' : '')}{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px', boxShadow: '0 6px 18px rgba(60,45,20,0.12)' }}>
      <div style={{ fontSize: '11px', color: C.muted, marginBottom: '6px', fontFamily: ui }}>{label}</div>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.name} style={{ fontSize: '12px', color: p.color, fontFamily: ui, fontWeight: 500 }}>
          {p.name}: {fmt(p.value)}
        </div>
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
  // Require sign-in: send anonymous visitors to /login before any data renders.
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) window.location.replace('/login') }) }, [])
  const [monthly,   setMonthly]   = useState([])
  const [clover,    setClover]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [period,    setPeriod]    = useState('month')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('monthly_summary').select('*').order('month')
      if (data) {
        setMonthly(data.map(r => ({
          month: r.month.slice(0, 7),
          label: MONTHS[r.month.slice(5, 7)] || r.month.slice(5, 7),
          revenue: parseFloat(r.revenue),
          expenses: parseFloat(r.expenses),
          profit: parseFloat(r.profit),
          cogs: parseFloat(r.cogs),
          notes: r.notes || null,
        })))
      }
      setClover(await fetchAllClover())
      setLoading(false)
    }
    load()
  }, [])

  // Exclude the current, in-progress month from headline metrics — a partial
  // month (e.g. through the 19th) shows misleading totals & margins. The live
  // current month is surfaced separately in the "current activity" strip below.
  const nowD = new Date()
  const curKey = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`
  const closed = monthly.filter(m => m.month < curKey)

  const totalRevenue = closed.reduce((s, r) => s + r.revenue, 0)
  const totalProfit  = closed.reduce((s, r) => s + r.profit, 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

  const last = closed[closed.length - 1]
  const prev = closed[closed.length - 2]
  const year = last ? last.month.slice(0, 4) : String(nowD.getFullYear())
  const momRev = last && prev && prev.revenue ? (last.revenue - prev.revenue) / prev.revenue * 100 : null
  const grossLast = last ? last.revenue - last.cogs : 0
  const grossMarginLast = last && last.revenue ? grossLast / last.revenue * 100 : 0
  const netMarginLast = last && last.revenue ? last.profit / last.revenue * 100 : 0
  const ytd = closed.filter(r => r.month.slice(0, 4) === year)
  const ytdRev = ytd.reduce((s, r) => s + r.revenue, 0)
  const ytdProfit = ytd.reduce((s, r) => s + r.profit, 0)

  // ── Current-period stats from live Clover sales ──────────────────────────────
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const wd = new Date(now); wd.setDate(now.getDate() - 6)
  const weekStart = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
  const startStr = period === 'week' ? weekStart : monthStart
  const periodLabel = period === 'week' ? 'Last 7 days' : now.toLocaleDateString([], { month: 'long' }) + ' so far'
  const periodRows = clover.filter(r => r.date && r.date >= startStr)
  const pRevenue = periodRows.reduce((s, r) => s + Number(r.revenue || 0), 0)
  const pUnits = periodRows.reduce((s, r) => s + Number(r.quantity || 1), 0)
  const pOrders = new Set(periodRows.map(r => r.order_id)).size
  const pAvg = pOrders ? pRevenue / pOrders : 0
  const periodTop = (() => {
    const map = {}
    periodRows.forEach(r => { const k = normalizeItemName(r.item_name); if (!map[k]) map[k] = { name: k, revenue: 0, units: 0 }; map[k].revenue += Number(r.revenue || 0); map[k].units += Number(r.quantity || 1) })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 7)
  })()
  const periodMax = periodTop[0] ? periodTop[0].revenue : 1

  const topItems = useMemo(() => {
    const map = {}
    clover.forEach(r => { const k = normalizeItemName(r.item_name); if (!map[k]) map[k] = { name: k, orders: 0, revenue: 0 }; map[k].orders++; map[k].revenue += Number(r.revenue || 0) })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 30)
  }, [clover])

  // Top 10 items by revenue (all-time), with units sold — for the home grid.
  const top10 = useMemo(() => {
    const map = {}
    clover.forEach(r => { const k = normalizeItemName(r.item_name); if (!map[k]) map[k] = { name: k, revenue: 0, units: 0 }; map[k].revenue += Number(r.revenue || 0); map[k].units += Number(r.quantity || 1) })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [clover])

  const tabs = [
    { id: 'overview',   label: 'Overview' },
    { id: 'inventory',  label: 'Sales & Items' },
  ]

  const hcell = (align = 'left') => ({
    padding: '6px 8px', fontSize: '9px', color: C.muted, fontWeight: '600',
    letterSpacing: '0.08em', borderBottom: `1px solid ${C.border}`,
    textAlign: align, background: C.headBg, fontFamily: ui,
  })
  const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', boxShadow: C.shadow }
  const capLabel = { fontSize: '9px', color: C.muted, letterSpacing: '0.15em', marginBottom: '12px', fontFamily: ui, fontWeight: 600 }

  return (
    <>
      <Head><title>Reydel Tire — Dashboard</title></Head>
      <Shell active="dashboard">
          <div style={{ padding: '26px 30px', maxWidth: '1160px' }}>

            {loading ? (
              <div style={{ color: C.muted, fontFamily: ui, fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* Header band */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '23px', fontWeight: 700, color: C.ink, fontFamily: ui, letterSpacing: '-0.025em' }}>Business Overview</div>
                    <div style={{ fontSize: '12px', color: C.muted, fontFamily: ui, marginTop: '4px' }}>
                      Reydel Tire &amp; Auto{last ? ` · financials through ${last.label} ${year}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '7px 13px', boxShadow: C.shadow }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.15)' }} />
                    <span style={{ fontSize: '11px', color: C.sub, fontFamily: ui, fontWeight: 500 }}>Live · synced from POS &amp; bank</span>
                  </div>
                </div>

                {/* Growth KPIs (closed-month) */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <KPICard label={`REVENUE · ${last ? last.label : ''}`} value={last ? fmt(last.revenue) : '—'}
                    trend={momRev} sub={momRev != null ? `${Math.abs(momRev).toFixed(0)}% vs ${prev.label}` : 'latest closed month'} accent={C.red} />
                  <KPICard label={`GROSS PROFIT · ${last ? last.label : ''}`} value={last ? fmt(grossLast) : '—'}
                    sub={last ? `${pct(grossMarginLast)} gross margin` : null} accent={C.gold} />
                  <KPICard label={`NET PROFIT · ${last ? last.label : ''}`} value={last ? fmt(last.profit) : '—'}
                    sub={last ? `${pct(netMarginLast)} net margin` : null} accent={C.green} />
                  <KPICard label={`REVENUE · YTD ${year}`} value={fmt(ytdRev)}
                    sub={`${ytd.length} mo · ${fmt(ytdProfit)} profit`} accent={C.red} />
                </div>

                {/* Live "this month in progress" strip */}
                <div style={{ ...cardStyle, padding: '14px 16px', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ ...capLabel, marginBottom: 0 }}>{now.toLocaleDateString([], { month: 'long' }).toUpperCase()} · IN PROGRESS</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[['week', 'Last 7 days'], ['month', 'This month']].map(([p, l]) => (
                        <button key={p} onClick={() => setPeriod(p)} style={{
                          padding: '6px 13px', borderRadius: '16px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          fontFamily: ui, border: `1px solid ${period === p ? C.ink : C.border}`,
                          background: period === p ? C.ink : '#fff', color: period === p ? '#fff' : C.muted,
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[['REVENUE', fmt(pRevenue), C.green], ['TICKETS', pOrders.toLocaleString(), C.sub],
                      ['TIRES SOLD', pUnits.toLocaleString(), C.sub], ['AVG TICKET', fmt(pAvg), C.sub]].map(([l, v, col]) => (
                      <div key={l} style={{ flex: 1, minWidth: '120px', background: C.hover, borderRadius: '9px', padding: '11px 14px' }}>
                        <div style={{ fontSize: '9px', color: C.muted, letterSpacing: '0.12em', marginBottom: '5px', fontFamily: ui, fontWeight: 600 }}>{l}</div>
                        <div style={{ fontSize: '18px', color: C.ink, fontWeight: 700, fontFamily: ui }}>{v}</div>
                        <div style={{ fontSize: '9px', color: col, marginTop: '3px', fontFamily: ui }}>{periodLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: `1px solid ${C.border}`, marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: ui, fontWeight: 600,
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === t.id ? C.ink : C.muted,
                      borderBottom: activeTab === t.id ? `2px solid ${C.red}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>

                      {/* Monthly chart with profit trend line */}
                      <div style={cardStyle}>
                        <div style={capLabel}>REVENUE, EXPENSES &amp; PROFIT BY MONTH</div>
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
                          {[[C.red,'Revenue'],['#D8CDB4','Expenses'],[C.green,'Profit']].map(([c, l]) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', color: C.muted, fontFamily: ui, fontWeight: 500 }}>
                              <span style={{ width: '8px', height: '8px', background: c, borderRadius: '2px', display: 'inline-block' }} />{l}
                            </span>
                          ))}
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={closed} barGap={2} barCategoryGap="24%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D6" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted, fontFamily: ui }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: ui }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(204,34,34,0.04)' }} />
                            <Bar dataKey="revenue"  name="Revenue"  fill={C.red} radius={[3,3,0,0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#D8CDB4" radius={[3,3,0,0]} />
                            <Line dataKey="profit"  name="Profit"   stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Monthly profit table */}
                      <div style={cardStyle}>
                        <div style={capLabel}>PROFIT BY MONTH</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: ui }}>
                          <thead>
                            <tr>{['Month','Profit','Margin'].map(h => (<th key={h} style={hcell(h === 'Month' ? 'left' : 'right')}>{h}</th>))}</tr>
                          </thead>
                          <tbody>
                            {closed.map(m => (
                              <tr key={m.month} onMouseEnter={e => e.currentTarget.style.background = C.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F1EADB', color: C.ink }}>
                                  {m.label}{m.notes && <span style={{ fontSize: '8px', color: C.red, marginLeft: '4px' }}>*est</span>}
                                </td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F1EADB', color: C.green, textAlign: 'right', fontWeight: 600 }}>{fmt(m.profit)}</td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F1EADB', textAlign: 'right' }}>
                                  <span style={{ background: C.greenBg, color: C.green, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>
                                    {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ padding: '8px 8px', color: C.ink, fontWeight: 700, borderTop: `2px solid ${C.border}`, background: C.headBg }}>TOTAL</td>
                              <td style={{ padding: '8px 8px', color: C.green, fontWeight: 700, textAlign: 'right', borderTop: `2px solid ${C.border}`, background: C.headBg }}>{fmt(totalProfit)}</td>
                              <td style={{ padding: '8px 8px', textAlign: 'right', borderTop: `2px solid ${C.border}`, background: C.headBg }}>
                                <span style={{ background: C.greenBg, color: C.green, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>{avgMargin}%</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top 10 best sellers (all-time, by revenue) */}
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ ...capLabel, marginBottom: 0 }}>TOP 10 BEST SELLERS · BY REVENUE</div>
                        <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ui, fontWeight: 600 }}>ALL ITEMS →</button>
                      </div>
                      {top10.length === 0 ? (
                        <div style={{ fontSize: '12px', color: C.muted, fontFamily: ui, padding: '8px 0' }}>No sales data yet.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
                          {top10.map((t, i) => (
                            <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: C.hover, borderRadius: '10px', padding: '11px 13px' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, fontFamily: ui, background: i < 3 ? C.red : '#EBE1CD', color: i < 3 ? '#fff' : C.muted }}>{i + 1}</div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, fontFamily: ui, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                                <div style={{ fontSize: '10px', color: C.muted, fontFamily: ui, marginTop: '2px' }}>{t.units.toLocaleString()} sold</div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: C.ink, fontFamily: ui, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(t.revenue)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Sales & Items Tab */}
                {activeTab === 'inventory' && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: C.shadow }}>
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ ...capLabel, marginBottom: 0 }}>ALL ITEMS — RANKED BY REVENUE</div>
                      <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: ui, fontWeight: 600 }}>FULL PAGE →</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: ui }}>
                      <thead>
                        <tr>{['#','Item','Orders','Revenue','Avg Sale'].map(h => (<th key={h} style={hcell(h === '#' || h === 'Item' ? 'left' : 'right')}>{h}</th>))}</tr>
                      </thead>
                      <tbody>
                        {topItems.map((item, i) => (
                          <tr key={item.name} onMouseEnter={e => e.currentTarget.style.background = C.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '8px 8px', borderBottom: '1px solid #F1EADB', color: C.muted, width: '32px' }}>{i + 1}</td>
                            <td style={{ padding: '8px 8px', borderBottom: '1px solid #F1EADB', color: i < 3 ? C.ink : '#4a4438', fontWeight: i < 3 ? '600' : '400', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                            <td style={{ padding: '8px 8px', borderBottom: '1px solid #F1EADB', color: C.muted, textAlign: 'right' }}>{item.orders}</td>
                            <td style={{ padding: '8px 8px', borderBottom: '1px solid #F1EADB', color: i < 3 ? C.green : '#4a4438', fontWeight: i < 3 ? '600' : '400', textAlign: 'right' }}>{fmt(item.revenue)}</td>
                            <td style={{ padding: '8px 8px', borderBottom: '1px solid #F1EADB', color: C.muted, textAlign: 'right' }}>{fmtD(item.revenue / item.orders)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
      </Shell>
    </>
  )
}
