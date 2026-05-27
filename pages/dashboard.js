import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

// ── Demo data (replaced with real Supabase data once DB is set up) ────────────
const DEMO_MONTHLY = [
  { month: 'Jan', revenue: 42000, expenses: 31000, profit: 11000 },
  { month: 'Feb', revenue: 38000, expenses: 29000, profit: 9000 },
  { month: 'Mar', revenue: 51000, expenses: 34000, profit: 17000 },
  { month: 'Apr', revenue: 47000, expenses: 33000, profit: 14000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 61000, expenses: 38000, profit: 23000 },
]

const DEMO_EXPENSES = [
  { category: 'Payroll', amount: 18000 },
  { category: 'Rent', amount: 5500 },
  { category: 'Marketing', amount: 4200 },
  { category: 'Supplies', amount: 2800 },
  { category: 'Utilities', amount: 1800 },
  { category: 'Other', amount: 3700 },
]

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E8D5A3',
      borderRadius: '2px', padding: '10px 14px',
      fontSize: '12px', fontFamily: 'DM Mono, monospace',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: '#718096', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, clientName, clientLogo, onSignOut }) {
  const router = useRouter()
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦', href: '/dashboard' },
    { id: 'financials', label: 'Financials', icon: '≡', href: '/financials' },
    { id: 'transactions', label: 'Transactions', icon: '↕', href: '/transactions' },
    { id: 'documents', label: 'Documents', icon: '◻', href: '/documents' },
  ]

  return (
    <div style={{
      width: '220px', minHeight: '100vh',
      background: '#0D0D0D',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0,
      borderRight: '1px solid #1a1a1a',
    }}>
      {/* Logo */}
      <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid #1a1a1a' }}>
        {clientLogo
          ? <img src={clientLogo} alt="logo" style={{ height: '36px', objectFit: 'contain' }} />
          : (
            <div>
              <div style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px', fontWeight: '700', color: '#fff',
              }}>{clientName || 'Your Business'}</div>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '9px',
                letterSpacing: '2px', color: '#C9A84C', marginTop: '4px',
              }}>FINANCIALS</div>
            </div>
          )
        }
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 0', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '11px 24px',
              background: active === item.id ? '#1a1a1a' : 'transparent',
              border: 'none',
              borderLeft: active === item.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: active === item.id ? '#fff' : '#718096',
              fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
              fontWeight: active === item.id ? '500' : '400',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '12px',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '16px', opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* JK Branding at bottom */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '11px', color: '#4A5568', marginBottom: '12px',
          fontFamily: 'DM Mono, monospace', letterSpacing: '1px' }}>
          POWERED BY
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', color: '#C9A84C', fontSize: '14px' }}>
          JK No Jokes
        </div>
        <button onClick={onSignOut} style={{
          marginTop: '16px', width: '100%', padding: '8px',
          background: 'transparent', border: '1px solid #2a2a2a',
          borderRadius: '2px', color: '#4A5568', fontSize: '11px',
          fontFamily: 'DM Mono, monospace', letterSpacing: '1px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.target.style.borderColor = '#C9A84C'}
          onMouseLeave={e => e.target.style.borderColor = '#2a2a2a'}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, change, positive, delay }) {
  return (
    <div className={`fade-up-delay-${delay}`} style={{
      background: '#fff', border: '1px solid #EDF2F7',
      borderRadius: '2px', padding: '24px 28px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace',
        letterSpacing: '2px', color: '#A0AEC0', textTransform: 'uppercase',
        marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif',
        fontSize: '28px', fontWeight: '600', color: '#0D0D0D', lineHeight: 1 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{
          marginTop: '8px', fontSize: '12px',
          color: positive ? '#2D6A4F' : '#C0392B',
          fontFamily: 'DM Mono, monospace',
        }}>
          {pct(change)} vs last month
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      loadClientData(session.user.email)
    })
  }, [])

  const loadClientData = async (email) => {
    // Try to load real client data; fall back to demo
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single()
    setClientData(data || { name: 'Demo Company', email })
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
        letterSpacing: '3px', color: '#C9A84C' }}>LOADING...</div>
    </div>
  )

  const latest = DEMO_MONTHLY[DEMO_MONTHLY.length - 1]
  const prev = DEMO_MONTHLY[DEMO_MONTHLY.length - 2]
  const revenueChange = ((latest.revenue - prev.revenue) / prev.revenue) * 100
  const expenseChange = ((latest.expenses - prev.expenses) / prev.expenses) * 100
  const profitChange = ((latest.profit - prev.profit) / prev.profit) * 100
  const margin = (latest.profit / latest.revenue) * 100

  return (
    <>
      <Head><title>{clientData?.name || 'Dashboard'} — JK No Jokes</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F4EF' }}>
        <Sidebar
          active="dashboard"
          clientName={clientData?.name}
          clientLogo={clientData?.logo_url}
          onSignOut={handleSignOut}
        />

        {/* Main content */}
        <div style={{ marginLeft: '220px', flex: 1, padding: '40px 48px' }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: '40px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                letterSpacing: '3px', color: '#C9A84C', marginBottom: '6px' }}>
                DASHBOARD
              </div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px',
                fontWeight: '600', color: '#0D0D0D', margin: 0 }}>
                {clientData?.name || 'Your Business'}
              </h1>
              <p style={{ color: '#718096', fontSize: '14px', margin: '6px 0 0',
                fontFamily: 'DM Sans, sans-serif' }}>
                Financial overview — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#A0AEC0',
                fontFamily: 'DM Mono, monospace', letterSpacing: '1px' }}>
                {user?.email}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px', marginBottom: '32px' }}>
            <KPICard label="Revenue" value={fmt(latest.revenue)}
              change={revenueChange} positive={revenueChange >= 0} delay={1} />
            <KPICard label="Expenses" value={fmt(latest.expenses)}
              change={expenseChange} positive={expenseChange <= 0} delay={2} />
            <KPICard label="Net Profit" value={fmt(latest.profit)}
              change={profitChange} positive={profitChange >= 0} delay={3} />
            <KPICard label="Profit Margin" value={`${margin.toFixed(1)}%`}
              delay={4} />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr',
            gap: '20px', marginBottom: '20px' }}>

            {/* Revenue vs Expenses area chart */}
            <div className="fade-up-delay-2" style={{
              background: '#fff', border: '1px solid #EDF2F7',
              borderRadius: '2px', padding: '28px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  letterSpacing: '2px', color: '#A0AEC0', marginBottom: '4px' }}>
                  6-MONTH TREND
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif',
                  fontSize: '18px', fontWeight: '600', color: '#0D0D0D' }}>
                  Revenue vs Expenses
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={DEMO_MONTHLY}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C0392B" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#C0392B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#2D6A4F" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses"
                    stroke="#C0392B" strokeWidth={2} fill="url(#expGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Expense breakdown bar chart */}
            <div className="fade-up-delay-3" style={{
              background: '#fff', border: '1px solid #EDF2F7',
              borderRadius: '2px', padding: '28px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  letterSpacing: '2px', color: '#A0AEC0', marginBottom: '4px' }}>
                  THIS MONTH
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif',
                  fontSize: '18px', fontWeight: '600', color: '#0D0D0D' }}>
                  Expense Breakdown
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DEMO_EXPENSES} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category"
                    tick={{ fontSize: 11, fontFamily: 'DM Sans, monospace', fill: '#4A5568' }}
                    axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Amount" fill="#C9A84C"
                    radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit trend */}
          <div className="fade-up-delay-4" style={{
            background: '#0D0D0D', border: '1px solid #1a1a1a',
            borderRadius: '2px', padding: '28px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ marginBottom: '24px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  letterSpacing: '2px', color: '#4A5568', marginBottom: '4px' }}>
                  6-MONTH TREND
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif',
                  fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                  Net Profit
                </div>
              </div>
              <button
                onClick={() => router.push('/financials')}
                style={{
                  padding: '8px 20px', background: 'transparent',
                  border: '1px solid #C9A84C', borderRadius: '2px',
                  color: '#C9A84C', fontSize: '11px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '1px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = '#C9A84C'; e.target.style.color = '#000' }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#C9A84C' }}
              >
                VIEW FINANCIALS →
              </button>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={DEMO_MONTHLY}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#4A5568' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#4A5568' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="profit" name="Net Profit"
                  stroke="#C9A84C" strokeWidth={2} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </>
  )
}
