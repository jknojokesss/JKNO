import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'orders',     label: 'Orders',       href: '/orders' },
  { id: 'accounts',   label: 'Accounts',     href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',     href: '/ai' },
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
      borderRight: `1px solid ${THEME.sidebarBorder}`, zIndex: 100,
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
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{label}</div>
      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: subColor || '#888', marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '12px', color: p.color === '#E5E5E5' ? '#888' : p.color, fontFamily: 'DM Mono, monospace' }}>
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
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0)
  const totalProfit  = monthly.reduce((s, r) => s + r.profit, 0)
  const totalCogs    = monthly.reduce((s, r) => s + r.cogs, 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

  return (
    <>
      <Head><title>Reydel Tire — Dashboard</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="dashboard" />
        <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>DASHBOARD</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Live · Supabase</div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* KPIs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <KPICard label="TOTAL REVENUE"    value={fmt(totalRevenue)} sub="Jan–May 2026"        subColor="#16a34a" />
                  <KPICard label="NET PROFIT"       value={fmt(totalProfit)}  sub={`${avgMargin}% margin`} subColor="#16a34a" />
                  <KPICard label="TOTAL COGS"       value={fmt(totalCogs)}    sub="QB + Weldon matched" subColor="#888" />
                  <KPICard label="GL TRANSACTIONS"  value="5,187"             sub="99.7% matched"       subColor="#16a34a" />
                </div>

                {/* Charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '20px' }}>

                  {/* Monthly chart */}
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>MONTHLY REVENUE / EXPENSES / PROFIT</div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                      {[['#CC2222','Revenue'],['#D0D0D0','Expenses'],['#16a34a','Profit']].map(([c, l]) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                          <span style={{ width: '8px', height: '8px', background: c, borderRadius: '1px', display: 'inline-block' }} />{l}
                        </span>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={monthly} barGap={2} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888', fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#888', fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue"  name="Revenue"  fill="#CC2222" radius={[2,2,0,0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#D0D0D0" radius={[2,2,0,0]} />
                        <Bar dataKey="profit"   name="Profit"   fill="#16a34a" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly profit table */}
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>PROFIT BY MONTH</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                      <thead>
                        <tr>
                          {['Month','Profit','Margin'].map(h => (
                            <th key={h} style={{ padding: '5px 8px', fontSize: '9px', color: '#888', fontWeight: '400', letterSpacing: '0.08em', borderBottom: '1px solid #E5E5E5', textAlign: h === 'Month' ? 'left' : 'right', background: '#FAFAFA' }}>{h}</th>
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
                    <div style={{ marginTop: '10px', fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>* May COGS estimated — Weldon pending QB entry</div>
                  </div>
                </div>

                {/* Top tires */}
                <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>TOP TIRE SIZES — GROSS PROFIT</div>
                    <button onClick={() => router.push('/inventory')} style={{ fontSize: '10px', color: THEME.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>VIEW ALL →</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                    <thead>
                      <tr>
                        {['Size','Units','Revenue','COGS','Profit','Margin'].map(h => (
                          <th key={h} style={{ padding: '5px 8px', fontSize: '9px', color: '#888', fontWeight: '400', letterSpacing: '0.08em', borderBottom: '1px solid #E5E5E5', textAlign: h === 'Size' ? 'left' : 'right', background: '#FAFAFA' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_TIRES.map((t) => (
                        <tr key={t.size} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#1a1a1a', fontWeight: '500' }}>{t.size}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#888', textAlign: 'right' }}>{t.units}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#333', textAlign: 'right' }}>{fmt(t.revenue)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#888', textAlign: 'right' }}>{fmt(t.cogs)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', color: '#16a34a', textAlign: 'right', fontWeight: '600' }}>{fmt(t.profit)}</td>
                          <td style={{ padding: '7px 8px', borderBottom: '1px solid #F0F0F0', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              <div style={{ width: '50px', height: '3px', background: '#E5E5E5', borderRadius: '2px' }}>
                                <div style={{ height: '3px', background: THEME.accent, borderRadius: '2px', width: `${Math.round(t.profit / 8471 * 100)}%` }} />
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
