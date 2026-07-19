import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { categorize, parentOf } from '../lib/accountTypes'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const CATS = ['income', 'expense', 'asset', 'liability', 'equity']
const CAT_LABEL = { income: 'Income', expense: 'Expenses', asset: 'Assets', liability: 'Liabilities', equity: 'Equity' }
const CAT_COLOR = { income: '#16a34a', expense: '#CC2222', asset: '#CC2222', liability: '#888', equity: '#7c3aed' }

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

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

      // Server-aggregated view (account_balances) sums ALL gl_transactions rows.
      // Aggregating client-side off a raw gl_transactions select would silently
      // cap at Supabase's 1,000-row read limit (gl_transactions has ~5k rows).
      const { data: rows } = await supabase
        .from('account_balances').select('name, txn_count, total, types').eq('client_id', clientData?.id)

      if (rows?.length) {
        setAccounts(rows.map(r => ({
          name: r.name,
          category: categorize(r.name),
          parent: parentOf(r.name),
          txnCount: r.txn_count,
          total: Number(r.total),
          types: r.types || [],
        })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total)))
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

  // Order a category's accounts so each parent is followed by its sub-accounts
  // (indented). Parent rows show a rolled-up total (own + subs); subs show their own.
  const nestForDisplay = (items) => {
    const names = new Set(items.map(a => a.name))
    const kids = {}
    const tops = []
    items.forEach(a => {
      if (a.parent && names.has(a.parent)) (kids[a.parent] = kids[a.parent] || []).push(a)
      else tops.push(a)
    })
    return tops
      .map(t => {
        const sub = (kids[t.name] || []).slice().sort((x, y) => Math.abs(y.total) - Math.abs(x.total))
        return { t, sub, rolled: t.total + sub.reduce((s, k) => s + k.total, 0) }
      })
      .sort((a, b) => Math.abs(b.rolled) - Math.abs(a.rolled))
      .flatMap(({ t, sub, rolled }) => [
        { account: t, isChild: false, displayTotal: rolled, hasSubs: sub.length > 0 },
        ...sub.map(k => ({ account: k, isChild: true, displayTotal: k.total, hasSubs: false })),
      ])
  }

  const totalIncome   = accounts.filter(a => a.category === 'income').reduce((s, a) => s + a.total, 0)
  const totalExpenses = accounts.filter(a => a.category === 'expense').reduce((s, a) => s + Math.abs(a.total), 0)
  const totalTxns     = accounts.reduce((s, a) => s + a.txnCount, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5EFE3', fontFamily: 'Inter, sans-serif' }}>
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

      <Shell active="accounts">

        {/* Main — two columns: account list + optional detail panel */}
        <div style={{ display: 'flex' }}>

          {/* Account list */}
          <div style={{ flex: 1, padding: '24px 28px', borderRight: selected ? '1px solid #E7DECB' : 'none' }}>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>CHART OF ACCOUNTS</div>
              <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
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
                <div key={i} style={{ background: '#fff', borderRadius: '6px', padding: '14px 16px', border: '1px solid #E7DECB', borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em', marginBottom: '6px' }}>{card.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: card.color, fontFamily: 'Inter, sans-serif' }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Search + filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..."
                style={{ flex: 1, minWidth: '160px', padding: '7px 12px', border: '1px solid #E7DECB',
                  borderRadius: '4px', fontSize: '11px', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fff', color: '#1a1a1a' }}
              />
              {['all', ...CATS].map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)} style={{
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '9px',
                  fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: activeCat === cat ? THEME.accent : '#F0F0F0',
                  color: activeCat === cat ? '#fff' : '#888', border: 'none',
                }}>{cat}</button>
              ))}
            </div>

            {/* Grouped tables */}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{CAT_LABEL[cat]}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: CAT_COLOR[cat], fontWeight: '600' }}>
                    {fmt(items.reduce((s, a) => s + Math.abs(a.total), 0))} total
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #E7DECB', overflow: 'hidden' }}>
                  {nestForDisplay(items).map((row, i, arr) => {
                    const account = row.account
                    const isSelected = selected?.name === account.name
                    return (
                      <div key={account.name} onClick={() => selectAccount(account)} style={{
                        padding: '11px 16px', paddingLeft: row.isChild ? '40px' : '16px',
                        borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                        background: isSelected ? '#FFF5F5' : row.isChild ? '#FCFCFC' : 'transparent',
                        borderLeft: isSelected ? `3px solid ${THEME.accent}` : '3px solid transparent',
                      }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F5EFE3' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = row.isChild ? '#FCFCFC' : 'transparent' }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: row.isChild ? '400' : '500', color: row.isChild ? '#555' : '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>
                            {row.isChild ? '↳ ' : ''}{account.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                            {account.txnCount} txns &nbsp;·&nbsp; {account.types.slice(0, 2).join(', ')}
                            {row.hasSubs && <span> &nbsp;·&nbsp; incl. sub-accounts</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
                            color: cat === 'income' ? '#16a34a' : cat === 'expense' ? THEME.accent : '#1a1a1a' }}>
                            {fmt(row.displayTotal)}
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
            <div style={{ width: '380px', flexShrink: 0, alignSelf: 'flex-start',
              position: 'sticky', top: '52px', maxHeight: 'calc(100vh - 52px)', overflowY: 'auto',
              background: '#fff', borderLeft: '1px solid #E7DECB', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', marginBottom: '4px' }}>ACCOUNT DETAIL</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>{selected.name}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: THEME.accent, fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{fmt(selected.total)}</div>
                </div>
                <button onClick={() => { setSelected(null); setTxns([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '20px', padding: '4px' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '10px 14px', background: '#F5EFE3', borderRadius: '4px', marginBottom: '16px', border: '1px solid #E7DECB' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>TRANSACTIONS</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>{selected.txnCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>CATEGORY</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize', marginTop: '2px' }}>{selected.category}</div>
                </div>
              </div>

              {txnLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>Loading...</div>
              ) : (
                <>
                  {txns.map((t, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: i < txns.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#1a1a1a', lineHeight: '1.4' }}>{t.description || t.type}</div>
                          {t.split_account && <div style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>→ {t.split_account}</div>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{t.date}</span>
                            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{t.type}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', flexShrink: 0, fontFamily: 'Inter, sans-serif',
                          color: Number(t.amount) >= 0 ? '#16a34a' : THEME.accent }}>
                          {Number(t.amount) >= 0 ? '' : '–'}{fmt(t.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {txns.length === 100 && (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: '#888', fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
                      Showing most recent 100 transactions
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Shell>
    </>
  )
}
