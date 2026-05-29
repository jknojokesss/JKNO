import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const REYDEL_LOGO = "data:image/png;base64,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"

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

const DEMO_MONTHLY = [
  { month: 'Jan', revenue: 42000, expenses: 31000, profit: 11000 },
  { month: 'Feb', revenue: 38000, expenses: 29000, profit: 9000 },
  { month: 'Mar', revenue: 51000, expenses: 34000, profit: 17000 },
  { month: 'Apr', revenue: 47000, expenses: 33000, profit: 14000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 61000, expenses: 38000, profit: 23000 },
]

const DEMO_EXPENSES = [
  { category: 'Inventory', amount: 22000 },
  { category: 'Payroll', amount: 9000 },
  { category: 'Rent', amount: 3500 },
  { category: 'Marketing', amount: 1800 },
  { category: 'Utilities', amount: 900 },
  { category: 'Other', amount: 800 },
]

// ── Theme system — pulled from client profile ─────────────────────────────────
const THEMES = {
  default: {
    sidebarBg: '#0D0D0D',
    sidebarBorder: '#1a1a1a',
    accent: '#C9A84C',
    accentLight: '#E8D5A3',
    activeNav: '#1a1a1a',
    pageBg: '#F7F4EF',
    cardBg: '#fff',
    chartColor: '#C9A84C',
    positiveColor: '#2D6A4F',
    negativeColor: '#C0392B',
  },
  reydel: {
    sidebarBg: '#1A1A1A',
    sidebarBorder: '#2A2A2A',
    accent: '#CC2222',
    accentLight: '#FF6B6B',
    activeNav: '#2A2A2A',
    pageBg: '#F5F5F5',
    cardBg: '#fff',
    chartColor: '#CC2222',
    positiveColor: '#2D6A4F',
    negativeColor: '#CC2222',
    tirePattern: true,
  },
}

const getTheme = (clientName) => {
  if (!clientName) return THEMES.default
  const name = clientName.toLowerCase()
  if (name.includes('reydel') || name.includes('tire')) return THEMES.reydel
  return THEMES.default
}

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${theme?.accent || '#C9A84C'}`,
      borderRadius: '2px', padding: '10px 14px', fontSize: '12px',
      fontFamily: 'DM Mono, monospace', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#718096', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

// ── Tire tread SVG pattern ────────────────────────────────────────────────────
function TirePattern() {
  return (
    <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.04,
      pointerEvents: 'none', width: '300px', height: '300px' }}
      viewBox="0 0 200 200">
      {[0,1,2,3,4,5,6,7].map(row =>
        [0,1,2,3,4,5,6,7].map(col => (
          <rect key={`${row}-${col}`}
            x={col * 26 + (row % 2) * 13}
            y={row * 14}
            width="18" height="8"
            rx="2"
            fill="#CC2222"
          />
        ))
      )}
    </svg>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      loadClientData(session.user.email)
    })
  }, [])

  const loadClientData = async (email) => {
    const { data } = await supabase.from('clients').select('*').eq('email', email).single()
    setClientData(data || { name: 'Reydel Tire', email })
    setLoading(false)
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
        letterSpacing: '3px', color: '#CC2222' }}>LOADING...</div>
    </div>
  )

  const theme = getTheme(clientData?.name)
  const isReydel = theme === THEMES.reydel

  const latest = DEMO_MONTHLY[DEMO_MONTHLY.length - 1]
  const prev = DEMO_MONTHLY[DEMO_MONTHLY.length - 2]
  const revenueChange = ((latest.revenue - prev.revenue) / prev.revenue) * 100
  const expenseChange = ((latest.expenses - prev.expenses) / prev.expenses) * 100
  const profitChange = ((latest.profit - prev.profit) / prev.profit) * 100
  const margin = (latest.profit / latest.revenue) * 100

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦', href: '/dashboard' },
    { id: 'financials', label: 'Financials', icon: '≡', href: '/financials' },
    { id: 'transactions', label: 'Transactions', icon: '↕', href: '/transactions' },
    { id: 'documents', label: 'Documents', icon: '◻', href: '/documents' },
  ]

  return (
    <>
      <Head>
        <title>{clientData?.name || 'Dashboard'} — JK No Jokes</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: theme.pageBg }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ background: theme.sidebarBg, padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, zIndex: 100,
            borderBottom: `2px solid ${theme.accent}` }}>
            <div>
              {isReydel ? (
                <img src={REYDEL_LOGO} alt="Reydel Tire"
                  style={{ width: '140px', height: 'auto' }} />
              ) : (
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px',
                  fontWeight: '700', color: '#fff' }}>{clientData?.name}</div>
              )}
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: '22px', cursor: 'pointer' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}

        {/* Mobile dropdown */}
        {isMobile && menuOpen && (
          <div style={{ background: theme.sidebarBg, borderBottom: `1px solid ${theme.sidebarBorder}`,
            position: 'sticky', top: '57px', zIndex: 99 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { router.push(item.href); setMenuOpen(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '14px 20px',
                  background: item.id === 'dashboard' ? theme.activeNav : 'transparent',
                  border: 'none',
                  borderLeft: item.id === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent',
                  color: item.id === 'dashboard' ? '#fff' : '#718096',
                  fontSize: '14px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
            <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left',
              padding: '14px 20px', background: 'transparent', border: 'none',
              borderTop: `1px solid ${theme.sidebarBorder}`, color: '#4A5568',
              fontSize: '12px', fontFamily: 'DM Mono, monospace', letterSpacing: '1px',
              cursor: 'pointer' }}>SIGN OUT</button>
          </div>
        )}

        <div style={{ display: 'flex' }}>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div style={{ width: '220px', minHeight: '100vh', background: theme.sidebarBg,
              position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column',
              borderRight: `1px solid ${theme.sidebarBorder}`, overflow: 'hidden' }}>

              {/* Tire pattern decoration */}
              {isReydel && <TirePattern />}

              {/* Logo */}
              <div style={{ padding: '28px 24px 24px',
                borderBottom: `1px solid ${theme.sidebarBorder}`,
                position: 'relative' }}>
                {isReydel ? (
                  <div>
                    <img src={REYDEL_LOGO} alt="Reydel Tire"
                      style={{ width: '172px', height: 'auto', display: 'block' }} />
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px',
                      letterSpacing: '2px', color: '#444', marginTop: '4px' }}>
                      FINANCIAL PORTAL
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px',
                      fontWeight: '700', color: '#fff' }}>{clientData?.name}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px',
                      letterSpacing: '2px', color: theme.accent, marginTop: '4px' }}>FINANCIALS</div>
                  </div>
                )}
              </div>

              {/* Nav */}
              <nav style={{ padding: '16px 0', flex: 1 }}>
                {navItems.map(item => (
                  <button key={item.id} onClick={() => router.push(item.href)} style={{
                    width: '100%', textAlign: 'left', padding: '11px 24px',
                    background: item.id === 'dashboard' ? theme.activeNav : 'transparent',
                    border: 'none',
                    borderLeft: item.id === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent',
                    color: item.id === 'dashboard' ? '#fff' : '#718096',
                    fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '16px', opacity: 0.8 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Bottom branding */}
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${theme.sidebarBorder}` }}>
                <div style={{ fontFamily: 'Playfair Display, serif',
                  color: theme.accent, fontSize: '13px' }}>JK No Jokes</div>
                <button onClick={handleSignOut} style={{ marginTop: '12px', width: '100%',
                  padding: '8px', background: 'transparent',
                  border: `1px solid ${theme.sidebarBorder}`, borderRadius: '2px',
                  color: '#4A5568', fontSize: '11px', fontFamily: 'DM Mono, monospace',
                  letterSpacing: '1px', cursor: 'pointer' }}>SIGN OUT</button>
              </div>
            </div>
          )}

          {/* Main content */}
          <div style={{ marginLeft: isMobile ? '0' : '220px', flex: 1,
            padding: isMobile ? '24px 16px' : '40px 48px' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              {!isMobile && (
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  letterSpacing: '3px', color: theme.accent, marginBottom: '6px' }}>
                  DASHBOARD
                </div>
              )}
              {isReydel ? (
                <img src={REYDEL_LOGO} alt="Reydel Tire"
                  style={{ width: isMobile ? '160px' : '200px', height: 'auto',
                    marginBottom: '4px', display: 'block' }} />
              ) : (
                <h1 style={{ fontFamily: 'Playfair Display, serif',
                  fontSize: isMobile ? '24px' : '32px',
                  fontWeight: '600', color: '#0D0D0D', margin: 0 }}>
                  {clientData?.name}
                </h1>
              )}
              <p style={{ color: '#718096', fontSize: '13px', margin: '6px 0 0' }}>
                Financial overview — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              {/* Red accent bar for Reydel */}
              {isReydel && (
                <div style={{ width: '48px', height: '3px',
                  background: theme.accent, marginTop: '10px' }} />
              )}
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Revenue', value: fmt(latest.revenue), change: revenueChange, positive: revenueChange >= 0 },
                { label: 'Expenses', value: fmt(latest.expenses), change: expenseChange, positive: expenseChange <= 0 },
                { label: 'Net Profit', value: fmt(latest.profit), change: profitChange, positive: profitChange >= 0 },
                { label: 'Profit Margin', value: `${margin.toFixed(1)}%` },
              ].map((card, i) => (
                <div key={i} style={{ background: theme.cardBg,
                  border: isReydel ? `1px solid #E0E0E0` : '1px solid #EDF2F7',
                  borderRadius: '2px',
                  borderTop: isReydel ? `3px solid ${theme.accent}` : 'none',
                  padding: isMobile ? '16px' : '22px 24px',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '1.5px', color: '#A0AEC0', marginBottom: '8px' }}>
                    {card.label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: isReydel ? 'Bebas Neue, sans-serif' : 'Playfair Display, serif',
                    fontSize: isMobile ? '22px' : '26px',
                    color: '#1A1A1A', lineHeight: 1,
                    letterSpacing: isReydel ? '1px' : '0' }}>
                    {card.value}
                  </div>
                  {card.change !== undefined && (
                    <div style={{ marginTop: '6px', fontSize: '11px',
                      color: card.positive ? theme.positiveColor : theme.negativeColor,
                      fontFamily: 'DM Mono, monospace' }}>
                      {pct(card.change)} vs last mo
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr',
              gap: '16px', marginBottom: '16px' }}>

              {/* Revenue vs Expenses */}
              <div style={{ background: theme.cardBg,
                border: isReydel ? '1px solid #E0E0E0' : '1px solid #EDF2F7',
                borderRadius: '2px', padding: isMobile ? '20px 16px' : '24px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                    letterSpacing: '2px', color: '#A0AEC0', marginBottom: '4px' }}>6-MONTH TREND</div>
                  <div style={{ fontFamily: isReydel ? 'Bebas Neue, sans-serif' : 'Playfair Display, serif',
                    fontSize: isReydel ? '20px' : '16px',
                    letterSpacing: isReydel ? '1px' : '0',
                    fontWeight: '600', color: '#1A1A1A' }}>
                    Revenue vs Expenses
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                  <AreaChart data={DEMO_MONTHLY}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.positiveColor} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={theme.positiveColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.accent} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={theme.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={36} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke={theme.positiveColor} strokeWidth={2} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses"
                      stroke={theme.accent} strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Breakdown */}
              <div style={{ background: theme.cardBg,
                border: isReydel ? '1px solid #E0E0E0' : '1px solid #EDF2F7',
                borderRadius: '2px', padding: isMobile ? '20px 16px' : '24px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                    letterSpacing: '2px', color: '#A0AEC0', marginBottom: '4px' }}>THIS MONTH</div>
                  <div style={{ fontFamily: isReydel ? 'Bebas Neue, sans-serif' : 'Playfair Display, serif',
                    fontSize: isReydel ? '20px' : '16px',
                    letterSpacing: isReydel ? '1px' : '0',
                    fontWeight: '600', color: '#1A1A1A' }}>
                    Expense Breakdown
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                  <BarChart data={DEMO_EXPENSES} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'DM Mono, monospace', fill: '#A0AEC0' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="category"
                      tick={{ fontSize: 10, fill: '#4A5568' }}
                      axisLine={false} tickLine={false} width={60} />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Bar dataKey="amount" name="Amount" fill={theme.accent} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom dark chart */}
            <div style={{ background: isReydel ? '#1A1A1A' : '#0D0D0D',
              border: `1px solid ${isReydel ? '#2A2A2A' : '#1a1a1a'}`,
              borderRadius: '2px', padding: isMobile ? '20px 16px' : '28px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.08)', position: 'relative',
              overflow: 'hidden' }}>
              {isReydel && <TirePattern />}
              <div style={{ marginBottom: '20px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px', position: 'relative' }}>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
                    letterSpacing: '2px', color: '#4A5568', marginBottom: '4px' }}>6-MONTH TREND</div>
                  <div style={{ fontFamily: isReydel ? 'Bebas Neue, sans-serif' : 'Playfair Display, serif',
                    fontSize: isReydel ? '22px' : '18px',
                    letterSpacing: isReydel ? '2px' : '0',
                    fontWeight: '600', color: '#fff' }}>
                    NET PROFIT
                  </div>
                </div>
                <button onClick={() => router.push('/financials')} style={{
                  padding: '8px 16px', background: 'transparent',
                  border: `1px solid ${theme.accent}`, borderRadius: '2px',
                  color: theme.accent, fontSize: '11px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '1px', cursor: 'pointer',
                  transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.background = theme.accent; e.target.style.color = '#fff' }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = theme.accent }}>
                  VIEW FINANCIALS →
                </button>
              </div>
              <ResponsiveContainer width="100%" height={isMobile ? 130 : 150}>
                <AreaChart data={DEMO_MONTHLY}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#4A5568' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fill: '#4A5568' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={36} />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Area type="monotone" dataKey="profit" name="Net Profit"
                    stroke={theme.accent} strokeWidth={2.5} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
