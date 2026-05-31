import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const categorize = (name) => {
  const n = name.toLowerCase()
  if (n.includes('sales') || n.includes('income') || n.includes('revenue')) return 'income'
  if (n.includes('checking') || n.includes('bank of america') || n.includes('cash on hand') ||
      n.includes('inventory asset') || n.includes('equipment') || n.includes('clearing')) return 'asset'
  if (n.includes('loan') || n.includes('short term loans')) return 'liability'
  return 'expense'
}

const CATS = ['income', 'expense', 'asset', 'liability']
const CAT_LABEL = { income: 'Income', expense: 'Expenses', asset: 'Assets', liability: 'Liabilities' }
const CAT_COLOR = { income: '#16a34a', expense: '#CC2222', asset: '#CC2222', liability: '#888' }

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'orders',     label: 'Orders',       href: '/orders' },
  { id: 'accounts',   label: 'Accounts',     href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',     href: '/ai' },
]

export default function Accounts() {
  const router = useRouter()
  const [client,     setClient]     = useState(null)
  const [accounts,   setAccounts]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [txns,       setTxns]       = useState([])
  const [txnLoading, setTxnLoading] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [activeCat,  setActiveCat]  = useState('all')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: clientData } = await supabase.from('clients').select('*').eq('email', user.email).single()
      setClient(clientData)

      const { data: gl } = await supabase
        .from('gl_transactions').select('account, type, amount').eq('client_id', clientData?.id)

      if (gl?.length) {
        const map = {}
        gl.forEach(row => {
          if (!map[row.account]) map[row.account] = { name: row.account, category: categorize(row.account), txnCount: 0, total: 0, types: new Set() }
          map[row.account].txnCount++
          map[row.account].total += Number(row.amount)
          map[row.account].types.add(row.type)
        })
        setAccounts(Object.values(map).map(a => ({ ...a, types: [...a.types] })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total)))
      }
      setLoading(false)
    }
    init()
  }, [])

  const selectAccount = async (account) => {
    if (selected?.name === account.name) { setSelected(null); setTxns([]); return }
    setSelected(account)
    setTxnLoading(true)
    const { data } = await supabase
      .from('gl_transactions').select('date, description, type, amount, split_account')
      .eq('client_id', client?.id).eq('account', account.name)
      .order('date', { ascending: false }).limit(100)
    setTxns(data || [])
    setTxnLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const filtered = useMemo(() =>
    accounts.filter(a =>
      (!search || a.name.toLowerCase().includes(search.toLowerCase())) &&
      (activeCat === 'all' || a.category === activeCat)
    ), [accounts, search, activeCat])

  const grouped = useMemo(() => {
    const g = {}
    CATS.forEach(cat => { const items = filtered.filter(a => a.category === cat); if (items.length) g[cat] = items })
    return g
  }, [filtered])

  const totalIncome   = accounts.filter(a => a.category === 'income').reduce((s, a) => s + a.total, 0)
  const totalExpenses = accounts.filter(a => a.category === 'expense').reduce((s, a) => s + Math.abs(a.total), 0)
  const totalTxns     = accounts.reduce((s, a) => s + a.txnCount, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F8F8', fontFamily: 'DM Mono, monospace' }}>
      <div style={{ color: '#888', fontSize: '13px', letterSpacing: '0.05em' }}>Loading accounts...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Reydel Tire — Accounts</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', minHeight: '100vh', background: THEME.sidebarBg, display: 'flex',
          flexDirection: 'column', position: 'fixed', left: 0, top: 0,
          borderRight: `1px solid ${THEME.sidebarBorder}`, zIndex: 100 }}>
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${THEME.sidebarBorder}` }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>REYDEL</div>
            <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>TIRE & AUTO</div>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => router.push(item.href)} style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '10px 20px', textAlign: 'left',
                background: item.id === 'accounts' ? '#2A2A2A' : 'transparent',
                color: item.id === 'accounts' ? '#fff' : '#666',
                border: 'none', cursor: 'pointer', fontSize: '12px',
                fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
                borderLeft: item.id === 'accounts' ? `2px solid ${THEME.accent}` : '2px solid transparent',
              }}>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${THEME.sidebarBorder}`, fontSize: '10px', color: '#3a3a3a', fontFamily: 'DM Mono, monospace' }}>
            JAN – MAY 2026
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: '220px', flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{ position: 'fixed', top: 0, left: '220px', right: 0, background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>ACCOUNTS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Live · Supabase</div>
            </div>
          </div>

          {/* Account list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', paddingTop: '68px', borderRight: selected ? '1px solid #E5E5E5' : 'none' }}>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '4px', fontFamily: 'DM Mono, monospace' }}>CHART OF ACCOUNTS</div>
              <div style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                Jan – May 2026 &nbsp;·&nbsp; {accounts.length} accounts &nbsp;·&nbsp; {totalTxns.toLocaleString()} transactions
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'TOTAL INCOME',   value: fmt(totalIncome),                 color: '#16a34a' },
                { label: 'TOTAL EXPENSES', value: fmt(totalExpenses),               color: THEME.accent },
                { label: 'NET ACTIVITY',   value: fmt(totalIncome - totalExpenses),
                  color: totalIncome - totalExpenses >= 0 ? '#16a34a' : THEME.accent },
              ].map((card, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '6px', padding: '14px 16px', border: '1px solid #E5E5E5', borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace', letterSpacing: '0.15em', marginBottom: '6px' }}>{card.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: card.color, fontFamily: 'DM Mono, monospace' }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Search + filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..."
                style={{ flex: 1, minWidth: '160px', padding: '7px 12px', border: '1px solid #E5E5E5',
                  borderRadius: '4px', fontSize: '11px', fontFamily: 'DM Mono, monospace', outline: 'none', background: '#fff', color: '#1a1a1a' }}
              />
              {['all', ...CATS].map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)} style={{
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '9px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: activeCat === cat ? THEME.accent : '#F0F0F0',
                  color: activeCat === cat ? '#fff' : '#888', border: 'none',
                }}>{cat}</button>
              ))}
            </div>

            {/* Grouped tables */}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{CAT_LABEL[cat]}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: CAT_COLOR[cat], fontWeight: '600' }}>
                    {fmt(items.reduce((s, a) => s + Math.abs(a.total), 0))} total
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                  {items.map((account, i) => {
                    const isSelected = selected?.name === account.name
                    return (
                      <div key={account.name} onClick={() => selectAccount(account)} style={{
                        padding: '11px 16px', borderBottom: i < items.length - 1 ? '1px solid #F0F0F0' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                        background: isSelected ? '#FFF5F5' : 'transparent',
                        borderLeft: isSelected ? `3px solid ${THEME.accent}` : '3px solid transparent',
                      }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8F8F8' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', fontFamily: 'DM Mono, monospace' }}>{account.name}</div>
                          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>
                            {account.txnCount} txns &nbsp;·&nbsp; {account.types.slice(0, 2).join(', ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'DM Mono, monospace',
                            color: cat === 'income' ? '#16a34a' : cat === 'expense' ? THEME.accent : '#1a1a1a' }}>
                            {fmt(account.total)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Transaction detail panel */}
          {selected && (
            <div style={{ width: '380px', flexShrink: 0, overflowY: 'auto', background: '#fff',
              borderLeft: '1px solid #E5E5E5', padding: '68px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', marginBottom: '4px' }}>ACCOUNT DETAIL</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', fontFamily: 'DM Mono, monospace' }}>{selected.name}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: THEME.accent, fontFamily: 'DM Mono, monospace', marginTop: '4px' }}>{fmt(selected.total)}</div>
                </div>
                <button onClick={() => { setSelected(null); setTxns([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '20px', padding: '4px' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '10px 14px', background: '#F8F8F8', borderRadius: '4px', marginBottom: '16px', border: '1px solid #E5E5E5' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>TRANSACTIONS</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', fontFamily: 'DM Mono, monospace' }}>{selected.txnCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>CATEGORY</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', fontFamily: 'DM Mono, monospace', textTransform: 'capitalize', marginTop: '2px' }}>{selected.category}</div>
                </div>
              </div>

              {txnLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>Loading...</div>
              ) : (
                <>
                  {txns.map((t, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: i < txns.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#1a1a1a', lineHeight: '1.4' }}>{t.description || t.type}</div>
                          {t.split_account && <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>→ {t.split_account}</div>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{t.date}</span>
                            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{t.type}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', flexShrink: 0, fontFamily: 'DM Mono, monospace',
                          color: Number(t.amount) >= 0 ? '#16a34a' : THEME.accent }}>
                          {Number(t.amount) >= 0 ? '' : '–'}{fmt(t.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {txns.length === 100 && (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: '#888', fontSize: '10px', fontFamily: 'DM Mono, monospace' }}>
                      Showing most recent 100 transactions
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
