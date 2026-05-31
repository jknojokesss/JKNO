import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const THEME = {
  sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222',
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'financials', label: 'Financials', href: '/financials' },
  { id: 'inventory', label: 'Sales & Items', href: '/inventory' },
  { id: 'accounts', label: 'Accounts', href: '/accounts' },
  { id: 'ai', label: '✦ Ask AI', href: '/ai' },
]

const cell = (align='left', extra={}) => ({
  padding: '8px 10px', borderBottom: '1px solid #1c1c1c',
  color: '#bbb', fontSize: '11px', fontFamily: 'DM Mono, monospace',
  textAlign: align, ...extra
})
const hcell = (align='left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#4a4a4a',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #222',
  fontFamily: 'DM Mono, monospace', textAlign: align
})

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

function DrillModal({ account, onClose }) {
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!account) return
    setLoading(true)
    supabase
      .from('gl_transactions')
      .select('date, description, amount, type')
      .eq('account', account)
      .order('date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTxns(data || [])
        setLoading(false)
      })
  }, [account])

  if (!account) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
        width: '600px', maxHeight: '500px', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#fff', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>{account}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#555', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>Loading transactions...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={hcell('left')}>DATE</th>
                  <th style={hcell('left')}>DESCRIPTION</th>
                  <th style={hcell('left')}>TYPE</th>
                  <th style={hcell('right')}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background='#1f1f1f'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={cell('left')}>{t.date}</td>
                    <td style={{ ...cell('left'), color: '#888', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ ...cell('left'), color: '#555' }}>{t.type}</td>
                    <td style={{ ...cell('right'), color: parseFloat(t.amount) >= 0 ? '#22c55e' : '#CC2222' }}>{fmt(parseFloat(t.amount))}</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '20px', color: '#555', fontFamily: 'DM Mono, monospace', fontSize: '11px', textAlign: 'center' }}>No transactions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {txns.length === 50 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #2a2a2a', fontSize: '9px', color: '#444', fontFamily: 'DM Mono, monospace' }}>
            Showing most recent 50 transactions
          </div>
        )}
      </div>
    </div>
  )
}

export default function Financials() {
  const [monthly,   setMonthly]   = useState([])
  const [plTotals,  setPlTotals]  = useState({ income: [], cogs: [], expense: [], other_expense: [] })
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('pl')
  const [drillAccount, setDrillAccount] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('monthly_summary').select('*').order('month'),
      supabase.from('pl_totals').select('label, amount, category'),
    ]).then(([{ data: mData }, { data: pData }]) => {
      if (mData) setMonthly(mData.map(r => ({
        label: new Date(r.month + '-01').toLocaleString('default', { month: 'short' }).toUpperCase() + ' ' + r.month.slice(0,4),
        revenue: parseFloat(r.revenue),
        expenses: parseFloat(r.expenses),
        profit: parseFloat(r.profit),
        cogs: parseFloat(r.cogs),
        notes: r.notes || null,
      })))
      if (pData) {
        const grouped = { income: [], cogs: [], expense: [], other_expense: [] }
        pData.forEach(row => { if (grouped[row.category]) grouped[row.category].push({ label: row.label, amount: Number(row.amount) }) })
        setPlTotals(grouped)
      }
      setLoading(false)
    })
  }, [])

  const totals = monthly.reduce((s, r) => ({
    revenue: s.revenue + r.revenue,
    expenses: s.expenses + r.expenses,
    profit: s.profit + r.profit,
    cogs: s.cogs + r.cogs,
    gross_profit: s.gross_profit + r.gross_profit,
  }), { revenue: 0, expenses: 0, profit: 0, cogs: 0, gross_profit: 0 })

  const plIncome       = plTotals.income.reduce((s, r) => s + r.amount, 0)
  const plCogs         = plTotals.cogs.reduce((s, r) => s + r.amount, 0)
  const plExpenses     = plTotals.expense.reduce((s, r) => s + r.amount, 0)
  const plOtherExp     = plTotals.other_expense.reduce((s, r) => s + r.amount, 0)
  const plGrossProfit  = plIncome - plCogs

  const PL_ROWS = [
    { section: 'INCOME', rows: plTotals.income.map(r => ({ label: r.label, amount: r.amount, account: r.label })) },
    { section: 'COST OF GOODS SOLD', rows: plTotals.cogs.map(r => ({ label: r.label, amount: -r.amount, account: 'Cost of Goods Sold' })) },
    { section: 'OPERATING EXPENSES', rows: plTotals.expense.map(r => ({ label: r.label, amount: -r.amount, account: r.label })) },
    { section: 'OTHER EXPENSES', rows: plTotals.other_expense.map(r => ({ label: r.label, amount: -r.amount, account: r.label })) },
  ]

  const tabs = [
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'monthly', label: 'Monthly Table' },
    { id: 'expenses', label: 'Expense Breakdown' },
    { id: 'accounts', label: 'Accounts' },
  ]

  const KEY_ACCOUNTS = [
    { name: 'Clover Clearing Account', sub: 'Sales deposits cleared through Clover', txns: 779 },
    { name: 'TOTAL CHECKING (8059) - 1', sub: 'Primary operating checking account', txns: 881 },
    { name: 'BUS COMPLETE CHK (5998) - 1', sub: 'Business checking account', txns: 621 },
    { name: 'Bank of America 7875', sub: 'Secondary bank account', txns: 201 },
    { name: 'Cost of Goods Sold', sub: 'MAVISX / Weldon tire COGS', txns: 382 },
    { name: 'Clover Sales', sub: 'Journal entries from Clover POS', txns: 111 },
    { name: 'Personal', sub: 'Owner draws & personal expenses', txns: 774 },
    { name: 'Hart', sub: 'Vendor payments', txns: 31 },
    { name: 'Katz Chase', sub: 'Credit card expenses', txns: 40 },
    { name: 'Short Term Loans', sub: 'Short term loan activity', txns: 22 },
  ]

  return (
    <>
      <Head><title>Reydel Tire — Financials</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#111' }}>
        <Sidebar active="financials" />
        <DrillModal account={drillAccount} onClose={() => setDrillAccount(null)} />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#fff', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>FINANCIALS</div>
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
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'TOTAL REVENUE', value: fmt(totals.revenue), sub: 'All sources', sc: '#22c55e' },
                    { label: 'GROSS PROFIT', value: fmt(totals.revenue - totals.cogs), sub: pct((totals.revenue - totals.cogs)/totals.revenue*100) + ' gross margin', sc: '#22c55e' },
                    { label: 'TOTAL EXPENSES', value: fmt(totals.expenses), sub: 'Operations', sc: '#CC2222' },
                    { label: 'NET PROFIT', value: fmt(totals.profit), sub: pct(totals.profit/totals.revenue*100) + ' net margin', sc: '#22c55e' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#fff', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #2a2a2a', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'DM Mono, monospace',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === t.id ? '#fff' : '#555',
                      borderBottom: activeTab === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* P&L Tab */}
                {activeTab === 'pl' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {PL_ROWS.map(section => {
                      const sectionTotal = section.rows.reduce((s, r) => s + r.amount, 0)
                      return (
                        <div key={section.section} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #222', fontFamily: 'DM Mono, monospace' }}>{section.section}</div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={hcell('left')}>ACCOUNT</th>
                                <th style={hcell('right')}>AMOUNT</th>
                                <th style={hcell('right')}>TXNS</th>
                                <th style={hcell('right')}>ACTION</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map(row => (
                                <tr key={row.label} onMouseEnter={e => e.currentTarget.style.background='#1f1f1f'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                  <td style={cell('left', { color: '#ddd' })}>{row.label}</td>
                                  <td style={cell('right', { color: row.amount >= 0 ? '#22c55e' : '#CC2222' })}>{fmt(row.amount)}</td>
                                  <td style={cell('right', { color: '#555' })}>{row.txns || '—'}</td>
                                  <td style={cell('right')}>
                                    {row.note ? (
                                      <span style={{ fontSize: '9px', background: '#2a1a0a', color: '#f59e0b', padding: '2px 6px', borderRadius: '3px' }}>{row.note}</span>
                                    ) : row.account ? (
                                      <button onClick={() => setDrillAccount(row.account)} style={{
                                        fontSize: '9px', background: '#1f1f1f', color: THEME.accent,
                                        border: `1px solid #2a2a2a`, padding: '2px 8px', borderRadius: '3px',
                                        cursor: 'pointer', fontFamily: 'DM Mono, monospace'
                                      }}>DRILL →</button>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={4} style={{ padding: '8px 10px', borderTop: '1px solid #333', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#fff', fontWeight: '600', textAlign: 'right' }}>
                                  {section.section === 'INCOME' ? 'Total Income: ' :
                                   section.section === 'COST OF GOODS SOLD' ? 'Gross Profit: ' :
                                   section.section === 'OPERATING EXPENSES' ? 'Total Operating Expenses: ' :
                                   'Total Other Expenses: '}
                                  <span style={{ color: section.section === 'COST OF GOODS SOLD' ? '#22c55e' : sectionTotal >= 0 ? '#22c55e' : '#CC2222' }}>
                                    {section.section === 'COST OF GOODS SOLD' ? fmt(plGrossProfit) : fmt(sectionTotal)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                    {/* Net profit */}
                    <div style={{ background: '#141a14', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>NET PROFIT</div>
                      <div style={{ fontSize: '22px', color: '#22c55e', fontWeight: '700', fontFamily: 'DM Mono, monospace' }}>{fmt(totals.profit)}</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#444', fontFamily: 'DM Mono, monospace' }}>
                      * May COGS estimated: $1,313 QB actual + $13,896 Weldon purchases pending QB entry
                    </div>
                  </div>
                )}

                {/* Monthly Table Tab */}
                {activeTab === 'monthly' && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>MONTHLY P&L — FROM QUICKBOOKS</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                      <thead>
                        <tr>
                          {['Month','Revenue','COGS','Gross Profit','Expenses','Net Profit','Margin'].map(h => (
                            <th key={h} style={hcell(h === 'Month' ? 'left' : 'right')}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthly.map((m, i) => (
                          <tr key={i} onMouseEnter={e => e.currentTarget.style.background='#1f1f1f'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={cell('left', { color: '#fff' })}>
                              {m.label}
                              {m.notes && <span style={{ marginLeft: '6px', fontSize: '8px', color: '#f59e0b' }}>*est</span>}
                            </td>
                            <td style={cell('right')}>{fmt(m.revenue)}</td>
                            <td style={cell('right', { color: '#CC2222' })}>{fmt(m.cogs)}</td>
                            <td style={cell('right', { color: '#22c55e' })}>{fmt(m.revenue - m.cogs)}</td>
                            <td style={cell('right', { color: '#CC2222' })}>{fmt(m.expenses)}</td>
                            <td style={cell('right', { color: '#22c55e', fontWeight: '600' })}>{fmt(m.profit)}</td>
                            <td style={cell('right')}>
                              <span style={{ background: '#142014', color: '#22c55e', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>
                                {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          {[
                            { v: 'TOTAL', a: 'left', c: '#fff', w: '600' },
                            { v: fmt(totals.revenue), a: 'right', c: '#fff', w: '600' },
                            { v: fmt(totals.cogs), a: 'right', c: '#CC2222', w: '600' },
                            { v: fmt(totals.revenue - totals.cogs), a: 'right', c: '#22c55e', w: '600' },
                            { v: fmt(totals.expenses), a: 'right', c: '#CC2222', w: '600' },
                            { v: fmt(totals.profit), a: 'right', c: '#22c55e', w: '600' },
                            { v: pct(totals.profit/totals.revenue*100), a: 'right', c: '#22c55e', w: '600' },
                          ].map((col, i) => (
                            <td key={i} style={{ padding: '9px 10px', borderTop: '1px solid #333', color: col.c, fontSize: '11px', fontWeight: col.w, fontFamily: 'DM Mono, monospace', textAlign: col.a }}>{col.v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '10px', fontSize: '9px', color: '#444', fontFamily: 'DM Mono, monospace' }}>
                      * May COGS estimated — Weldon $13,896 pending QB entry
                    </div>
                  </div>
                )}

                {/* Expense Breakdown Tab */}
                {activeTab === 'expenses' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { heading: 'OPERATING EXPENSES', rows: plTotals.expense },
                      { heading: 'OTHER EXPENSES', rows: plTotals.other_expense },
                    ].map(group => {
                      const maxV = Math.max(...group.rows.map(r => r.amount), 1)
                      const groupTotal = group.rows.reduce((s, r) => s + r.amount, 0)
                      return (
                        <div key={group.heading} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'DM Mono, monospace' }}>{group.heading}</div>
                          {[...group.rows].sort((a, b) => b.amount - a.amount).map(e => (
                            <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 0', borderBottom: '1px solid #1c1c1c' }}>
                              <div style={{ width: '180px', fontSize: '10px', color: '#aaa', flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>{e.label}</div>
                              <div style={{ flex: 1, height: '5px', background: '#222', borderRadius: '3px' }}>
                                <div style={{ height: '5px', background: '#CC2222', borderRadius: '3px', width: `${Math.round(e.amount / maxV * 100)}%` }} />
                              </div>
                              <div style={{ width: '70px', textAlign: 'right', fontSize: '10px', color: '#CC2222', fontFamily: 'DM Mono, monospace' }}>{fmt(e.amount)}</div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #333', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>Total: {fmt(groupTotal)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#4a4a4a', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>KEY ACCOUNTS — CLICK TO DRILL DOWN</div>
                    {KEY_ACCOUNTS.map(a => (
                      <div key={a.name} onClick={() => setDrillAccount(a.name)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderBottom: '1px solid #1c1c1c', cursor: 'pointer',
                        borderRadius: '4px', transition: 'background 0.1s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background='#1f1f1f'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#ddd', fontFamily: 'DM Mono, monospace' }}>{a.name}</div>
                          <div style={{ fontSize: '9px', color: '#555', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{a.sub}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#666', fontFamily: 'DM Mono, monospace' }}>{a.txns} txns</div>
                          <div style={{ fontSize: '9px', color: THEME.accent, marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>DRILL →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
