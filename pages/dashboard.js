import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const THEME = {
  sidebarBg: '#1A1A1A',
  sidebarBorder: '#2A2A2A',
  accent: '#CC2222',
  pageBg: '#F5F5F5',
  cardBg: '#fff',
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'financials', label: 'Financials', href: '/financials' },
  { id: 'inventory', label: 'Sales & Items', href: '/inventory' },
  { id: 'accounts', label: 'Accounts', href: '/accounts' },
  { id: 'ai', label: '✦ Ask AI', href: '/ai' },
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

function Sidebar({ active }) {
  const router = useRouter()
  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: THEME.sidebarBg,
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0,
      borderRight: `1px solid ${THEME.sidebarBorder}`, zIndex: 100
    }}>
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${THEME.sidebarBorder}` }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>REYDEL</div>
        <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>TIRE & AUTO</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => router.push(item.href)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 20px', textAlign: 'left',
            background: active === item.id ? '#2A2A2A' : 'transparent',
            color: active === item.id ? '#fff' : '#666',
            border: 'none', cursor: 'pointer', fontSize: '12px',
            fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
            borderLeft: active === item.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${THEME.sidebarBorder}`, fontSize: '10px', color: '#3a3a3a', fontFamily: 'DM Mono, monospace' }}>
        JAN – MAY 2026
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px',
      padding: '14px 16px', flex: 1
    }}>
      <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{label}</div>
      <div style={{ fontSize: '20px', color: '#fff', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: subColor || '#666', marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '10px 14px' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '12px', color: p.color, fontFamily: 'DM Mono, monospace' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('monthly_summary')
        .select('*')
        .order('month')
      if (data) {
        setMonthly(data.map(r => ({
          month: r.month.slice(0, 7),
          label: new Date(r.month + '-01').toLocaleString('default', { month: 'short' }).toUpperCase(),
          revenue: parseFloat(r.revenue),
          expenses: parseFloat(r.expenses),
          profit: parseFloat(r.profit),
          cogs: parseFloat(r.cogs),
          gross_profit: parseFloat(r.gross_profit),
          notes: r.notes || null,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0)
  const totalProfit = monthly.reduce((s, r) => s + r.profit, 0)
  const totalCogs = monthly.reduce((s, r) => s + r.cogs, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

  return (
    <>
      <Head><title>Reydel Tire — Dashboard</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#111' }}>
        <Sidebar active="dashboard" />
        <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Topbar */}
          <div style={{
            background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
            padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '11px', color: '#fff', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>DASHBOARD</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></div>
              <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace' }}>Live · Supabase</div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#555', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPIs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <KPICard label="TOTAL REVENUE" value={fmt(totalRevenue)} sub="Jan–May 2026" subColor="#22c55e" />
                  <KPICard label="NET PROFIT" value={fmt(totalProfit)} sub={`${avgMargin}% margin`} subColor="#22c55e" />
                  <KPICard label="TOTAL COGS" value={fmt(totalCogs)} sub="QB + Weldon matched" subColor="#888" />
                  <KPICard label="GL TRANSACTIONS" value="5,187" sub="99.7% matched" subColor="#22c55e" />
                </div>

                {/* Charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '20px' }}>

                  {/* Monthly chart */}
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>MONTHLY REVENUE / EXPENSES / PROFIT</div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                      {[['#CC2222','Revenue'],['#333','Expenses'],['#22c55e','Profit']].map(([c,l]) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666', fontFamily: 'DM Mono, monospace' }}>
                          <span style={{ width: '8px', height: '8px', background: c, borderRadius: '1px', display: 'inline-block' }}></span>{l}
                        </span>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={monthly} barGap={2} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#555', fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#555', fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#CC2222" radius={[2,2,0,0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#2a2a2a" radius={[2,2,0,0]} />
                        <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly profit table */}
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>PROFIT BY MONTH</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                      <thead>
                        <tr>
                          {['Month','Profit','Margin'].map(h => (
                            <th key={h} style={{ padding: '5px 8px', fontSize: '9px', color: '#4a4a4a', fontWeight: '400', letterSpacing: '0.08em', borderBottom: '1px solid #222', textAlign: h === 'Month' ? 'left' : 'right' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthly.map(m => (
                          <tr key={m.month}>
                            <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#bbb' }}>
                              {m.label} {m.notes && <span style={{ fontSize: '8px', color: '#CC2222' }}>*est</span>}
                            </td>
                            <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#22c55e', textAlign: 'right' }}>{fmt(m.profit)}</td>
                            <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', textAlign: 'right' }}>
                              <span style={{ background: '#142014', color: '#22c55e', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>
                                {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{ padding: '8px 8px', color: '#fff', fontWeight: '600', borderTop: '1px solid #333' }}>TOTAL</td>
                          <td style={{ padding: '8px 8px', color: '#22c55e', fontWeight: '600', textAlign: 'right', borderTop: '1px solid #333' }}>{fmt(totalProfit)}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'right', borderTop: '1px solid #333' }}>
                            <span style={{ background: '#142014', color: '#22c55e', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>{avgMargin}%</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '10px', fontSize: '9px', color: '#444', fontFamily: 'DM Mono, monospace' }}>* May COGS estimated — Weldon pending QB entry</div>
                  </div>
                </div>

                {/* Top tires */}
                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>TOP TIRE SIZES — GROSS PROFIT</div>
                    <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>VIEW ALL →</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        {['Size','Units','Revenue','COGS','Profit','Margin'].map(h => (
                          <th key={h} style={{ padding: '5px 8px', fontSize: '9px', color: '#4a4a4a', fontWeight: '400', letterSpacing: '0.08em', borderBottom: '1px solid #222', textAlign: h === 'Size' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_TIRES.map((t, i) => (
                        <tr key={t.size} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='#1f1f1f'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#fff' }}>{t.size}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#aaa', textAlign: 'right' }}>{t.units}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#aaa', textAlign: 'right' }}>{fmt(t.revenue)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#aaa', textAlign: 'right' }}>{fmt(t.cogs)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', color: '#22c55e', textAlign: 'right' }}>{fmt(t.profit)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #1c1c1c', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              <div style={{ width: '50px', height: '3px', background: '#2a2a2a', borderRadius: '2px' }}>
                                <div style={{ height: '3px', background: '#CC2222', borderRadius: '2px', width: `${Math.round(t.profit / 8471 * 100)}%` }}></div>
                              </div>
                              <span style={{ fontSize: '9px', color: '#888', minWidth: '32px' }}>{t.margin}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
