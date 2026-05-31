import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const categorize = (name) => {
  const n = name.toLowerCase()
  if (n.includes('sales') || n.includes('income') || n.includes('revenue')) return 'income'
  if (
    n.includes('checking') || n.includes('bank of america') || n.includes('cash on hand') ||
    n.includes('inventory asset') || n.includes('equipment') || n.includes('clearing')
  ) return 'asset'
  if (n.includes('loan') || n.includes('short term loans')) return 'liability'
  return 'expense'
}

const CATS = ['income', 'expense', 'asset', 'liability']
const CAT_LABEL = { income: 'Income', expense: 'Expenses', asset: 'Assets', liability: 'Liabilities' }
const CAT_COLOR = { income: '#2D6A4F', expense: '#CC2222', asset: '#CC2222', liability: '#718096' }

const THEME = {
  sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A',
  accent: '#CC2222', activeNav: '#2A2A2A',
  pageBg: '#F5F5F5', cardBg: '#fff',
}

const NAV = [
  { id: 'overview',  label: 'Overview',  href: '/dashboard' },
  { id: 'accounts',  label: 'Accounts',  href: '/accounts' },
  { id: 'ai',        label: '✦ Ask AI',  href: '/ai' },
]

export default function Accounts() {
  const router = useRouter()
  const [client,          setClient]          = useState(null)
  const [accounts,        setAccounts]        = useState([])
  const [selected,        setSelected]        = useState(null)
  const [txns,            setTxns]            = useState([])
  const [txnLoading,      setTxnLoading]      = useState(false)
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [activeCat,       setActiveCat]       = useState('all')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: clientData } = await supabase
        .from('clients').select('*').eq('email', user.email).single()
      setClient(clientData)

      const { data: gl } = await supabase
        .from('gl_transactions')
        .select('account, type, amount')
        .eq('client_id', clientData?.id)

      if (gl?.length) {
        const map = {}
        gl.forEach(row => {
          if (!map[row.account]) {
            map[row.account] = { name: row.account, category: categorize(row.account), txnCount: 0, total: 0, types: new Set() }
          }
          map[row.account].txnCount++
          map[row.account].total += Number(row.amount)
          map[row.account].types.add(row.type)
        })
        setAccounts(
          Object.values(map)
            .map(a => ({ ...a, types: [...a.types] }))
            .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
        )
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
      .from('gl_transactions')
      .select('date, description, type, amount, split_account')
      .eq('client_id', client?.id)
      .eq('account', account.name)
      .order('date', { ascending: false })
      .limit(100)
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
    CATS.forEach(cat => {
      const items = filtered.filter(a => a.category === cat)
      if (items.length) g[cat] = items
    })
    return g
  }, [filtered])

  const totalIncome   = accounts.filter(a => a.category === 'income').reduce((s, a) => s + a.total, 0)
  const totalExpenses = accounts.filter(a => a.category === 'expense').reduce((s, a) => s + Math.abs(a.total), 0)
  const totalTxns     = accounts.reduce((s, a) => s + a.txnCount, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#F5F5F5', fontFamily: 'DM Mono, monospace' }}>
      <div style={{ color: '#718096', fontSize: '13px', letterSpacing: '0.05em' }}>Loading accounts...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>{client?.name} — Accounts</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }
          button:hover { opacity: 0.85; }`}
        </style>
      </Head>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: '220px', background: THEME.sidebarBg, display: 'flex',
          flexDirection: 'column', height: '100%', flexShrink: 0 }}>
          <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${THEME.sidebarBorder}` }}>
            <div style={{ color: '#fff', fontSize: '15px', fontWeight: '700',
              fontFamily: 'DM Mono, monospace' }}>{client?.name}</div>
            <div style={{ color: THEME.accent, fontSize: '10px', fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.1em', marginTop: '4px' }}>ACCOUNTS</div>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => router.push(item.href)}
                style={{ display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
                  background: item.id === 'accounts' ? THEME.activeNav : 'transparent',
                  color: item.id === 'accounts' ? '#fff' : '#a0aec0',
                  border: 'none', cursor: 'pointer', fontSize: '13px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em',
                  borderLeft: item.id === 'accounts' ? `2px solid ${THEME.accent}` : '2px solid transparent',
                }}>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${THEME.sidebarBorder}` }}>
            <div style={{ color: '#718096', fontSize: '11px', marginBottom: '4px',
              fontFamily: 'DM Mono, monospace' }}>{client?.name}</div>
            <button onClick={handleLogout}
              style={{ color: '#718096', fontSize: '11px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'DM Mono, monospace', padding: 0 }}>
              Sign out →
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: THEME.pageBg }}>

          {/* Account list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px',
            borderRight: selected ? '1px solid #e2e8f0' : 'none' }}>

            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
                Chart of Accounts
              </h1>
              <div style={{ color: '#718096', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                Jan – May 2026 &nbsp;·&nbsp; {accounts.length} accounts &nbsp;·&nbsp; {totalTxns.toLocaleString()} transactions
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Income',   value: fmt(totalIncome),                   color: '#2D6A4F' },
                { label: 'Total Expenses', value: fmt(totalExpenses),                 color: THEME.accent },
                { label: 'Net Activity',   value: fmt(totalIncome - totalExpenses),
                  color: totalIncome - totalExpenses >= 0 ? '#2D6A4F' : THEME.accent },
              ].map((card, i) => (
                <div key={i} style={{ background: THEME.cardBg, borderRadius: '4px',
                  padding: '20px', border: '1px solid #e2e8f0', borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{card.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Search + category filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search accounts..."
                style={{ flex: 1, minWidth: '160px', padding: '8px 12px', border: '1px solid #e2e8f0',
                  borderRadius: '4px', fontSize: '13px', fontFamily: 'DM Mono, monospace',
                  outline: 'none', background: '#fff' }}
              />
              {['all', ...CATS].map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  style={{ padding: '8px 14px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em',
                    textTransform: 'uppercase', transition: 'all 0.1s',
                    background: activeCat === cat ? THEME.accent : '#fff',
                    color:      activeCat === cat ? '#fff' : '#718096',
                    border:     activeCat === cat ? 'none' : '1px solid #e2e8f0',
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Grouped tables */}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {CAT_LABEL[cat]}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace',
                    color: CAT_COLOR[cat], fontWeight: '600' }}>
                    {fmt(items.reduce((s, a) => s + Math.abs(a.total), 0))} total
                  </div>
                </div>

                <div style={{ background: THEME.cardBg, borderRadius: '4px',
                  border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {items.map((account, i) => {
                    const isSelected = selected?.name === account.name
                    return (
                      <div key={account.name}
                        onClick={() => selectAccount(account)}
                        style={{
                          padding: '13px 20px',
                          borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isSelected ? `${THEME.accent}0D` : 'transparent',
                          borderLeft: isSelected ? `3px solid ${THEME.accent}` : '3px solid transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f7fafc' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>
                            {account.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#a0aec0', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>
                            {account.txnCount} txns &nbsp;·&nbsp; {account.types.slice(0, 2).join(', ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700',
                            color: cat === 'income' ? '#2D6A4F' : cat === 'expense' ? THEME.accent : '#1a202c' }}>
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

          {/* ── Transaction detail panel ── */}
          {selected && (
            <div style={{ width: '400px', flexShrink: 0, overflowY: 'auto',
              background: '#fff', padding: '28px 24px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Account Detail
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a202c', lineHeight: '1.3' }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: THEME.accent, marginTop: '6px' }}>
                    {fmt(selected.total)}
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setTxns([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: '#a0aec0', fontSize: '22px', padding: '2px 6px', lineHeight: 1 }}>
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', gap: '24px', padding: '12px 16px', background: '#f7fafc',
                borderRadius: '4px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.05em', marginBottom: '2px' }}>TRANSACTIONS</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a202c' }}>
                    {selected.txnCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.05em', marginBottom: '2px' }}>CATEGORY</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c', textTransform: 'capitalize' }}>
                    {selected.category}
                  </div>
                </div>
              </div>

              {txnLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#718096',
                  fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.05em' }}>
                  Loading...
                </div>
              ) : (
                <>
                  {txns.map((t, i) => (
                    <div key={i} style={{
                      padding: '12px 0',
                      borderBottom: i < txns.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#1a202c', lineHeight: '1.4' }}>
                            {t.description || t.type}
                          </div>
                          {t.split_account && (
                            <div style={{ fontSize: '11px', color: '#a0aec0', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>
                              → {t.split_account}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '10px', color: '#718096', fontFamily: 'DM Mono, monospace' }}>
                              {t.date}
                            </span>
                            <span style={{ fontSize: '10px', color: '#a0aec0', fontFamily: 'DM Mono, monospace' }}>
                              {t.type}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', flexShrink: 0,
                          color: Number(t.amount) >= 0 ? '#2D6A4F' : THEME.accent }}>
                          {Number(t.amount) >= 0 ? '' : '–'}{fmt(t.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {txns.length === 100 && (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: '#a0aec0',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
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
