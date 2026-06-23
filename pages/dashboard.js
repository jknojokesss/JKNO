import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Shell from '../components/Shell'

const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const fmtD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
const pct  = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }

// Canonicalize tire-size format so "235/60R17" and "235/60/17" group as one item.
function normalizeItemName(name) {
  if (!name) return 'Unknown'
  return name
    .replace(/(\d{3})[\s\/\-]?(\d{2})[\s\/\-]?R(\d{2})/gi, '$1/$2/$3')
    .replace(/(\d{3})\s(\d{2})\s(\d{2})/g, '$1/$2/$3')
    .trim()
}

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

// Dashboard is the home/launcher — these buttons replace the sidebar here.
// (Inner pages keep their sidebar, whose Dashboard link returns here.)
const NAV_BUTTONS = [
  { id: 'financials', label: 'Financials',   href: '/financials', icon: '▣', desc: 'P&L, revenue & expenses' },
  { id: 'inventory',  label: 'Sales & Items', href: '/inventory',  icon: '◧', desc: 'Top items by revenue' },
  { id: 'orders',     label: 'Orders',        href: '/orders',     icon: '▤', desc: 'Order history' },
  { id: 'stock',      label: 'Stock',         href: '/stock',      icon: '⬡', desc: 'Tires on hand' },
  { id: 'accounts',   label: 'Accounts',      href: '/accounts',   icon: '◈', desc: 'Balances & transactions' },
  { id: 'ai',         label: 'Ask AI',        href: '/ai',         icon: '✦', desc: 'Plain-English answers' },
]

const TOP_TIRES = [
  { size: '235/60R17', units: 93, revenue: 15257, cogs: 6786, profit: 8471, margin: 55.5 },
  { size: '235/60R18', units: 79, revenue: 13931, cogs: 6107, profit: 7824, margin: 56.2 },
  { size: '215/55R17', units: 70, revenue: 10427, cogs: 4307, profit: 6120, margin: 58.7 },
  { size: '235/55R19', units: 41, revenue: 7447,  cogs: 3163, profit: 4284, margin: 57.5 },
  { size: '235/45R18', units: 33, revenue: 5557,  cogs: 2260, profit: 3297, margin: 59.3 },
  { size: '255/45R19', units: 28, revenue: 6345,  cogs: 3323, profit: 3022, margin: 47.6 },
  { size: '245/50R20', units: 27, revenue: 5552,  cogs: 2729, profit: 2823, margin: 50.8 },
]

function KPICard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>{label}</div>
      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: subColor || '#888', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '12px', color: p.color === '#E5E5E5' ? '#888' : p.color, fontFamily: 'Inter, sans-serif' }}>
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

  const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0)
  const totalProfit  = monthly.reduce((s, r) => s + r.profit, 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

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

  const tabs = [
    { id: 'overview',   label: 'Overview' },
    { id: 'inventory',  label: 'Sales & Items' },
  ]

  const hcell = (align = 'left') => ({
    padding: '5px 8px', fontSize: '9px', color: '#888', fontWeight: '400',
    letterSpacing: '0.08em', borderBottom: '1px solid #E5E5E5',
    textAlign: align, background: '#FAFAFA', fontFamily: 'Inter, sans-serif',
  })

  return (
    <>
      <Head><title>Reydel Tire — Dashboard</title></Head>
      <Shell active="dashboard">
          <div style={{ padding: '24px 28px' }}>

            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* Period toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {[['week', 'Last 7 days'], ['month', 'This month']].map(([p, l]) => (
                    <button key={p} onClick={() => setPeriod(p)} style={{
                      padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', border: `1px solid ${period === p ? '#1a1a1a' : '#E5E5E5'}`,
                      background: period === p ? '#1a1a1a' : '#fff', color: period === p ? '#fff' : '#888',
                    }}>{l}</button>
                  ))}
                </div>

                {/* Period KPIs (live Clover sales) */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <KPICard label="REVENUE"    value={fmt(pRevenue)}            sub={periodLabel}        subColor="#16a34a" />
                  <KPICard label="SALES"      value={pOrders.toLocaleString()} sub={`${periodLabel} · tickets`} subColor="#888" />
                  <KPICard label="TIRES SOLD" value={pUnits.toLocaleString()}  sub={periodLabel}        subColor="#888" />
                  <KPICard label="AVG TICKET" value={fmt(pAvg)}                sub="revenue ÷ tickets"  subColor="#888" />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E5E5E5', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === t.id ? '#1a1a1a' : '#888',
                      borderBottom: activeTab === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '20px' }}>

                      {/* Monthly chart */}
                      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>MONTHLY REVENUE / EXPENSES / PROFIT</div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                          {[['#CC2222','Revenue'],['#D0D0D0','Expenses'],['#16a34a','Profit']].map(([c, l]) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
                              <span style={{ width: '8px', height: '8px', background: c, borderRadius: '1px', display: 'inline-block' }} />{l}
                            </span>
                          ))}
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={monthly} barGap={2} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#888', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="revenue"  name="Revenue"  fill="#CC2222" radius={[2,2,0,0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#D0D0D0" radius={[2,2,0,0]} />
                            <Bar dataKey="profit"   name="Profit"   fill="#16a34a" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Monthly profit table */}
                      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>PROFIT BY MONTH</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <thead>
                            <tr>
                              {['Month','Profit','Margin'].map(h => (
                                <th key={h} style={hcell(h === 'Month' ? 'left' : 'right')}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthly.map(m => (
                              <tr key={m.month} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#333' }}>
                                  {m.label}{m.notes && <span style={{ fontSize: '8px', color: THEME.accent, marginLeft: '4px' }}>*est</span>}
                                </td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#16a34a', textAlign: 'right' }}>{fmt(m.profit)}</td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', textAlign: 'right' }}>
                                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>
                                    {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ padding: '8px 8px', color: '#1a1a1a', fontWeight: '700', borderTop: '2px solid #E5E5E5', background: '#FAFAFA' }}>TOTAL</td>
                              <td style={{ padding: '8px 8px', color: '#16a34a', fontWeight: '700', textAlign: 'right', borderTop: '2px solid #E5E5E5', background: '#FAFAFA' }}>{fmt(totalProfit)}</td>
                              <td style={{ padding: '8px 8px', textAlign: 'right', borderTop: '2px solid #E5E5E5', background: '#FAFAFA' }}>
                                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>{avgMargin}%</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: '10px', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>* May COGS estimated</div>
                      </div>
                    </div>

                    {/* Top sellers this period (live) */}
                    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif' }}>TOP SELLERS — {periodLabel.toUpperCase()}</div>
                        <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>ALL ITEMS →</button>
                      </div>
                      {periodTop.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#888', fontFamily: 'Inter, sans-serif', padding: '8px 0' }}>No sales in this period yet.</div>
                      ) : periodTop.map((t, i) => (
                        <div key={t.name} style={{ padding: '9px 0', borderTop: i ? '1px solid #F4F4F4' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                            <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(t.revenue)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '5px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.round(t.revenue / periodMax * 100)}%`, height: '100%', background: THEME.accent }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#888', whiteSpace: 'nowrap', minWidth: '54px', textAlign: 'right' }}>{t.units} sold</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sales & Items Tab */}
                {activeTab === 'inventory' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif' }}>ALL ITEMS — RANKED BY REVENUE</div>
                      <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>FULL PAGE →</button>
                    </div>
                    {(
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                        <thead>
                          <tr>
                            {['#','Item','Orders','Revenue','Avg Sale'].map(h => (
                              <th key={h} style={hcell(h === '#' || h === 'Item' ? 'left' : 'right')}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {topItems.map((item, i) => (
                            <tr key={item.name} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F0F0', color: '#888', width: '32px' }}>{i + 1}</td>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F0F0', color: i < 3 ? '#1a1a1a' : '#333', fontWeight: i < 3 ? '600' : '400', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F0F0', color: '#888', textAlign: 'right' }}>{item.orders}</td>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F0F0', color: i < 3 ? '#16a34a' : '#333', fontWeight: i < 3 ? '600' : '400', textAlign: 'right' }}>{fmt(item.revenue)}</td>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F0F0', color: '#888', textAlign: 'right' }}>{fmtD(item.revenue / item.orders)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
      </Shell>
    </>
  )
}
