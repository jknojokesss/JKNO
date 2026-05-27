import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

// ── Demo P&L Data ─────────────────────────────────────────────────────────────
const PL_DATA = {
  income: {
    label: 'Income',
    accounts: [
      { id: 'rev-sales', name: 'Sales Revenue', amount: 61000, transactions: [
        { date: '06/03', desc: 'Invoice #1042 — Acme Corp', amount: 12000 },
        { date: '06/08', desc: 'Invoice #1043 — Baker LLC', amount: 8500 },
        { date: '06/12', desc: 'Invoice #1044 — Coastal Co', amount: 15000 },
        { date: '06/19', desc: 'Invoice #1045 — DeltaTech', amount: 11000 },
        { date: '06/25', desc: 'Invoice #1046 — Eagle Inc', amount: 14500 },
      ]},
      { id: 'rev-other', name: 'Other Income', amount: 3200, transactions: [
        { date: '06/15', desc: 'Interest income', amount: 800 },
        { date: '06/30', desc: 'Misc income', amount: 2400 },
      ]},
    ]
  },
  expenses: {
    label: 'Expenses',
    accounts: [
      { id: 'exp-payroll', name: 'Payroll', amount: 18000, transactions: [
        { date: '06/15', desc: 'Payroll run — bi-weekly', amount: 9000 },
        { date: '06/30', desc: 'Payroll run — bi-weekly', amount: 9000 },
      ]},
      { id: 'exp-rent', name: 'Rent', amount: 5500, transactions: [
        { date: '06/01', desc: 'Office rent — June', amount: 5500 },
      ]},
      { id: 'exp-marketing', name: 'Marketing', amount: 4200, transactions: [
        { date: '06/05', desc: 'Google Ads', amount: 2000 },
        { date: '06/12', desc: 'Social media ads', amount: 1200 },
        { date: '06/20', desc: 'Printed materials', amount: 1000 },
      ]},
      { id: 'exp-supplies', name: 'Supplies', amount: 2800, transactions: [
        { date: '06/08', desc: 'Office supplies — Staples', amount: 1400 },
        { date: '06/22', desc: 'Office supplies — Amazon', amount: 1400 },
      ]},
      { id: 'exp-utilities', name: 'Utilities', amount: 1800, transactions: [
        { date: '06/02', desc: 'Electric bill', amount: 900 },
        { date: '06/05', desc: 'Internet + phone', amount: 900 },
      ]},
      { id: 'exp-other', name: 'Other Expenses', amount: 3700, transactions: [
        { date: '06/10', desc: 'Insurance premium', amount: 2200 },
        { date: '06/18', desc: 'Software subscriptions', amount: 800 },
        { date: '06/28', desc: 'Miscellaneous', amount: 700 },
      ]},
    ]
  }
}

const BALANCE_DATA = {
  assets: {
    label: 'Assets',
    sections: [
      { label: 'Current Assets', accounts: [
        { name: 'Cash & Cash Equivalents', amount: 84200 },
        { name: 'Accounts Receivable', amount: 31500 },
        { name: 'Inventory', amount: 18400 },
        { name: 'Prepaid Expenses', amount: 4800 },
      ]},
      { label: 'Fixed Assets', accounts: [
        { name: 'Equipment', amount: 45000 },
        { name: 'Less: Accumulated Depreciation', amount: -12000 },
        { name: 'Leasehold Improvements', amount: 22000 },
      ]},
    ]
  },
  liabilities: {
    label: 'Liabilities',
    sections: [
      { label: 'Current Liabilities', accounts: [
        { name: 'Accounts Payable', amount: 14200 },
        { name: 'Accrued Expenses', amount: 6800 },
        { name: 'Short-Term Loans', amount: 10000 },
      ]},
      { label: 'Long-Term Liabilities', accounts: [
        { name: 'Long-Term Debt', amount: 35000 },
      ]},
    ]
  },
  equity: {
    label: "Owner's Equity",
    sections: [
      { label: "Owner's Equity", accounts: [
        { name: "Owner's Capital", amount: 100000 },
        { name: 'Retained Earnings', amount: 27900 },
      ]},
    ]
  }
}

// ── Drill-down Modal ──────────────────────────────────────────────────────────
function DrillModal({ account, onClose }) {
  if (!account) return null
  const total = account.transactions.reduce((s, t) => s + t.amount, 0)
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '2px',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        border: '1px solid #E8D5A3',
        maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #EDF2F7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '2px', color: '#C9A84C', marginBottom: '4px' }}>
              DRILL DOWN
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px',
              fontWeight: '600', color: '#0D0D0D' }}>
              {account.name}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '20px',
            color: '#A0AEC0', cursor: 'pointer', padding: '4px',
          }}>×</button>
        </div>

        {/* Transactions */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {account.transactions.map((t, i) => (
            <div key={i} style={{
              padding: '14px 28px',
              borderBottom: '1px solid #F7F7F7',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
                  color: '#A0AEC0', minWidth: '40px' }}>{t.date}</span>
                <span style={{ fontSize: '14px', color: '#2D3748' }}>{t.desc}</span>
              </div>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px',
                fontWeight: '500', color: '#0D0D0D' }}>
                {fmt(t.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ padding: '16px 28px', borderTop: '2px solid #0D0D0D',
          display: 'flex', justifyContent: 'space-between',
          background: '#F7F4EF' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '2px', color: '#4A5568' }}>TOTAL</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px',
            fontWeight: '600', color: '#0D0D0D' }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── P&L View ──────────────────────────────────────────────────────────────────
function PLView({ onDrill }) {
  const totalIncome = PL_DATA.income.accounts.reduce((s, a) => s + a.amount, 0)
  const totalExpenses = PL_DATA.expenses.accounts.reduce((s, a) => s + a.amount, 0)
  const netProfit = totalIncome - totalExpenses

  return (
    <div>
      {/* Income */}
      <SectionBlock label="INCOME" accounts={PL_DATA.income.accounts}
        total={totalIncome} totalLabel="Total Income" positive onDrill={onDrill} />
      {/* Expenses */}
      <SectionBlock label="EXPENSES" accounts={PL_DATA.expenses.accounts}
        total={totalExpenses} totalLabel="Total Expenses" onDrill={onDrill} />
      {/* Net */}
      <div style={{ marginTop: '24px', padding: '20px 24px',
        background: '#0D0D0D', borderRadius: '2px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px',
          letterSpacing: '2px', color: '#fff' }}>NET PROFIT</span>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px',
          fontWeight: '600', color: netProfit >= 0 ? '#74C69D' : '#F1948A' }}>
          {netProfit >= 0 ? '' : '-'}{fmt(netProfit)}
        </span>
      </div>
    </div>
  )
}

function SectionBlock({ label, accounts, total, totalLabel, positive, onDrill }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
        letterSpacing: '3px', color: '#C9A84C', marginBottom: '12px' }}>
        {label}
      </div>
      <div style={{ border: '1px solid #EDF2F7', borderRadius: '2px', overflow: 'hidden' }}>
        {accounts.map((acc, i) => (
          <div key={acc.id}
            onClick={() => acc.transactions && onDrill(acc)}
            style={{
              padding: '14px 20px',
              borderBottom: i < accounts.length - 1 ? '1px solid #F7F7F7' : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: acc.transactions ? 'pointer' : 'default',
              background: '#fff',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (acc.transactions) e.currentTarget.style.background = '#FAFAFA' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', color: '#2D3748' }}>{acc.name}</span>
              {acc.transactions && (
                <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace',
                  color: '#C9A84C', letterSpacing: '1px' }}>DETAIL ↗</span>
              )}
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px',
              fontWeight: '500', color: '#0D0D0D' }}>
              {fmt(acc.amount)}
            </span>
          </div>
        ))}
        <div style={{ padding: '14px 20px', background: '#F7F4EF',
          borderTop: '2px solid #0D0D0D',
          display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '1px', color: '#4A5568', fontWeight: '500' }}>
            {totalLabel}
          </span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px',
            fontWeight: '600', color: '#0D0D0D' }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Balance Sheet View ────────────────────────────────────────────────────────
function BalanceView() {
  const calcSection = (section) => section.accounts.reduce((s, a) => s + a.amount, 0)
  const calcCategory = (cat) => cat.sections.reduce((s, sec) => s + calcSection(sec), 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Left: Assets */}
      <div>
        <BalanceCategory category={BALANCE_DATA.assets} />
      </div>
      {/* Right: Liabilities + Equity */}
      <div>
        <BalanceCategory category={BALANCE_DATA.liabilities} />
        <BalanceCategory category={BALANCE_DATA.equity} />
      </div>
    </div>
  )
}

function BalanceCategory({ category }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
        letterSpacing: '3px', color: '#C9A84C', marginBottom: '12px' }}>
        {category.label.toUpperCase()}
      </div>
      {category.sections.map((section, si) => (
        <div key={si} style={{ marginBottom: '12px',
          border: '1px solid #EDF2F7', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#F7F4EF',
            fontSize: '11px', fontFamily: 'DM Mono, monospace',
            letterSpacing: '1px', color: '#718096' }}>
            {section.label}
          </div>
          {section.accounts.map((acc, i) => (
            <div key={i} style={{
              padding: '11px 16px',
              borderBottom: i < section.accounts.length - 1 ? '1px solid #F7F7F7' : 'none',
              display: 'flex', justifyContent: 'space-between',
              background: '#fff',
            }}>
              <span style={{ fontSize: '13px', color: acc.amount < 0 ? '#718096' : '#2D3748' }}>
                {acc.name}
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px',
                color: acc.amount < 0 ? '#C0392B' : '#0D0D0D' }}>
                {acc.amount < 0 ? `(${fmt(acc.amount)})` : fmt(acc.amount)}
              </span>
            </div>
          ))}
          <div style={{ padding: '11px 16px', background: '#F7F4EF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace',
              color: '#4A5568', letterSpacing: '1px' }}>
              Total {section.label}
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px',
              fontWeight: '500', color: '#0D0D0D' }}>
              {fmt(section.accounts.reduce((s, a) => s + a.amount, 0))}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Financials Page ──────────────────────────────────────────────────────
export default function Financials() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pl')
  const [drillAccount, setDrillAccount] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      supabase.from('clients').select('*').eq('email', session.user.email).single()
        .then(({ data }) => { setClientData(data || { name: 'Demo Company' }); setLoading(false) })
    })
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F7F4EF' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px',
        letterSpacing: '3px', color: '#C9A84C' }}>LOADING...</div>
    </div>
  )

  // Sidebar import inline to avoid circular deps
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦', href: '/dashboard' },
    { id: 'financials', label: 'Financials', icon: '≡', href: '/financials' },
    { id: 'transactions', label: 'Transactions', icon: '↕', href: '/transactions' },
    { id: 'documents', label: 'Documents', icon: '◻', href: '/documents' },
  ]

  const tabs = [
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'bs', label: 'Balance Sheet' },
    { id: 'cf', label: 'Cash Flow' },
  ]

  return (
    <>
      <Head><title>Financials — JK No Jokes</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F4EF' }}>
        {/* Sidebar */}
        <div style={{ width: '220px', minHeight: '100vh', background: '#0D0D0D',
          position: 'fixed', left: 0, top: 0, borderRight: '1px solid #1a1a1a',
          display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px',
              fontWeight: '700', color: '#fff' }}>{clientData?.name || 'Your Business'}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px',
              letterSpacing: '2px', color: '#C9A84C', marginTop: '4px' }}>FINANCIALS</div>
          </div>
          <nav style={{ padding: '16px 0', flex: 1 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => router.push(item.href)} style={{
                width: '100%', textAlign: 'left', padding: '11px 24px',
                background: item.id === 'financials' ? '#1a1a1a' : 'transparent', border: 'none',
                borderLeft: item.id === 'financials' ? '2px solid #C9A84C' : '2px solid transparent',
                color: item.id === 'financials' ? '#fff' : '#718096',
                fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                fontWeight: item.id === 'financials' ? '500' : '400',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '16px', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '20px 24px', borderTop: '1px solid #1a1a1a' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', color: '#C9A84C', fontSize: '14px' }}>
              JK No Jokes
            </div>
            <button onClick={handleSignOut} style={{
              marginTop: '12px', width: '100%', padding: '8px',
              background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '2px',
              color: '#4A5568', fontSize: '11px', fontFamily: 'DM Mono, monospace',
              letterSpacing: '1px', cursor: 'pointer',
            }}>SIGN OUT</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: '220px', flex: 1, padding: '40px 48px' }}>
          <div className="fade-up" style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '3px', color: '#C9A84C', marginBottom: '6px' }}>FINANCIALS</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px',
              fontWeight: '600', color: '#0D0D0D', margin: 0 }}>Financial Reports</h1>
            <p style={{ color: '#718096', fontSize: '14px', margin: '6px 0 0' }}>
              Period: June 2025 &nbsp;·&nbsp; Click any line item to drill into transactions
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '32px',
            border: '1px solid #EDF2F7', borderRadius: '2px', overflow: 'hidden',
            background: '#fff', width: 'fit-content' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '12px 28px',
                background: activeTab === tab.id ? '#0D0D0D' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#718096',
                border: 'none', borderRight: '1px solid #EDF2F7',
                fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                fontWeight: '500', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fade-up">
            {activeTab === 'pl' && <PLView onDrill={setDrillAccount} />}
            {activeTab === 'bs' && <BalanceView />}
            {activeTab === 'cf' && (
              <div style={{ padding: '48px', textAlign: 'center',
                background: '#fff', border: '1px solid #EDF2F7', borderRadius: '2px' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px',
                  color: '#0D0D0D', marginBottom: '8px' }}>Cash Flow Statement</div>
                <div style={{ color: '#A0AEC0', fontSize: '14px' }}>Coming in the next build</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drill Modal */}
      <DrillModal account={drillAccount} onClose={() => setDrillAccount(null)} />
    </>
  )
}
