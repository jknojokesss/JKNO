import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

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
                <svg viewBox="0 0 180 60" width="130" height="43" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="32" fontFamily="Arial Black, sans-serif" fontSize="28"
                    fontWeight="900" fill="#ffffff" letterSpacing="2">REYDEL</text>
                  <rect x="0" y="36" width="120" height="3" fill="#CC2222" rx="1"/>
                  <text x="2" y="52" fontFamily="Arial, sans-serif" fontSize="14"
                    fontWeight="700" fill="#CC2222" letterSpacing="6">TIRE</text>
                  <circle cx="158" cy="36" r="18" fill="none" stroke="#CC2222" strokeWidth="3"/>
                  <circle cx="158" cy="36" r="10" fill="none" stroke="#CC2222" strokeWidth="2"/>
                  <circle cx="158" cy="36" r="4" fill="#CC2222"/>
                  <rect x="155" y="15" width="6" height="4" rx="1" fill="#CC2222"/>
                  <rect x="155" y="53" width="6" height="4" rx="1" fill="#CC2222"/>
                  <rect x="137" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                  <rect x="175" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                </svg>
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
                    <svg viewBox="0 0 180 60" width="160" height="53" xmlns="http://www.w3.org/2000/svg">
                      {/* REYDEL text */}
                      <text x="0" y="32" fontFamily="Arial Black, sans-serif" fontSize="28"
                        fontWeight="900" fill="#ffffff" letterSpacing="2">REYDEL</text>
                      {/* Red underline */}
                      <rect x="0" y="36" width="120" height="3" fill="#CC2222" rx="1"/>
                      {/* TIRE text */}
                      <text x="2" y="52" fontFamily="Arial, sans-serif" fontSize="14"
                        fontWeight="700" fill="#CC2222" letterSpacing="6">TIRE</text>
                      {/* Tire icon - circle with treads */}
                      <circle cx="158" cy="36" r="18" fill="none" stroke="#CC2222" strokeWidth="3"/>
                      <circle cx="158" cy="36" r="10" fill="none" stroke="#CC2222" strokeWidth="2"/>
                      <circle cx="158" cy="36" r="4" fill="#CC2222"/>
                      {/* Tire tread marks */}
                      <rect x="155" y="15" width="6" height="4" rx="1" fill="#CC2222"/>
                      <rect x="155" y="53" width="6" height="4" rx="1" fill="#CC2222"/>
                      <rect x="137" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                      <rect x="175" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                      <rect x="141" y="20" width="4" height="4" rx="1" fill="#CC2222" transform="rotate(45 143 22)"/>
                      <rect x="169" y="20" width="4" height="4" rx="1" fill="#CC2222" transform="rotate(45 171 22)"/>
                      <rect x="141" y="48" width="4" height="4" rx="1" fill="#CC2222" transform="rotate(45 143 50)"/>
                      <rect x="169" y="48" width="4" height="4" rx="1" fill="#CC2222" transform="rotate(45 171 50)"/>
                    </svg>
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
                <div style={{ marginBottom: '4px' }}>
                  <svg viewBox="0 0 220 60" width={isMobile ? '160px' : '200px'} height={isMobile ? '43px' : '54px'} xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="32" fontFamily="Arial Black, sans-serif" fontSize="28"
                      fontWeight="900" fill="#1A1A1A" letterSpacing="2">REYDEL</text>
                    <rect x="0" y="36" width="120" height="3" fill="#CC2222" rx="1"/>
                    <text x="2" y="52" fontFamily="Arial, sans-serif" fontSize="14"
                      fontWeight="700" fill="#CC2222" letterSpacing="6">TIRE</text>
                    <circle cx="158" cy="36" r="18" fill="none" stroke="#CC2222" strokeWidth="3"/>
                    <circle cx="158" cy="36" r="10" fill="none" stroke="#CC2222" strokeWidth="2"/>
                    <circle cx="158" cy="36" r="4" fill="#CC2222"/>
                    <rect x="155" y="15" width="6" height="4" rx="1" fill="#CC2222"/>
                    <rect x="155" y="53" width="6" height="4" rx="1" fill="#CC2222"/>
                    <rect x="137" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                    <rect x="175" y="33" width="4" height="6" rx="1" fill="#CC2222"/>
                  </svg>
                </div>
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
