import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    href: '/dashboard' },
  { id: 'financials', label: 'Financials',   href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items',href: '/inventory' },
  { id: 'orders',     label: 'Orders',       href: '/orders' },
  { id: 'accounts',   label: 'Accounts',     href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',     href: '/ai' },
]

const cell = (align = 'left', extra = {}) => ({
  padding: '8px 10px', borderBottom: '1px solid #F0F0F0',
  color: '#333', fontSize: '11px', fontFamily: 'DM Mono, monospace',
  textAlign: align, ...extra,
})
const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#888', background: '#FAFAFA',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E5E5E5',
  fontFamily: 'DM Mono, monospace', textAlign: align,
})

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
      .limit(500)
      .then(({ data }) => { setTxns(data || []); setLoading(false) })
  }, [account])

  if (!account) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px',
        width: '620px', maxHeight: '520px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', fontWeight: '600' }}>{account}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>Loading transactions...</div>
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
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={cell('left')}>{t.date}</td>
                    <td style={{ ...cell('left'), color: '#888', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ ...cell('left'), color: '#888' }}>{t.type}</td>
                    <td style={{ ...cell('right'), color: parseFloat(t.amount) >= 0 ? '#16a34a' : '#CC2222' }}>{fmt(parseFloat(t.amount))}</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '20px', color: '#888', fontFamily: 'DM Mono, monospace', fontSize: '11px', textAlign: 'center' }}>No transactions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {txns.length === 500 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #E5E5E5', fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
            Showing most recent 500 transactions
          </div>
        )}
      </div>
    </div>
  )
}

export default function Financials() {
  const [monthly,      setMonthly]      = useState([])
  const [plTotals,     setPlTotals]     = useState({ income: [], cogs: [], expense: [], other_expense: [] })
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('pl')
  const [drillAccount, setDrillAccount] = useState(null)

  useEffect(() => {
    const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }
    async function load() {
      const { data: mData } = await supabase.from('monthly_summary').select('*').order('month')
      if (mData) setMonthly(mData.map(r => ({
        label: MONTHS[r.month.slice(5)] + ' ' + r.month.slice(0, 4),
        revenue: parseFloat(r.revenue),
        expenses: parseFloat(r.expenses),
        profit: parseFloat(r.profit),
        cogs: parseFloat(r.cogs),
        notes: r.notes || null,
      })))

      const { data: pData } = await supabase.from('pl_totals').select('label, amount, category')
      if (pData) {
        const grouped = { income: [], cogs: [], expense: [], other_expense: [] }
        pData.forEach(row => { if (grouped[row.category]) grouped[row.category].push({ label: row.label, amount: Number(row.amount) }) })
        setPlTotals(grouped)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totals = monthly.reduce((s, r) => ({
    revenue: s.revenue + r.revenue, expenses: s.expenses + r.expenses,
    profit: s.profit + r.profit, cogs: s.cogs + r.cogs,
  }), { revenue: 0, expenses: 0, profit: 0, cogs: 0 })

  const plIncome      = plTotals.income.reduce((s, r) => s + r.amount, 0)
  const plCogs        = plTotals.cogs.reduce((s, r) => s + r.amount, 0)
  const plExpenses    = plTotals.expense.reduce((s, r) => s + r.amount, 0)
  const plOtherExp    = plTotals.other_expense.reduce((s, r) => s + r.amount, 0)
  const plGrossProfit = plIncome - plCogs
  const plNetIncome   = plIncome - plCogs - plExpenses - plOtherExp

  const PL_ROWS = [
    { section: 'INCOME',             rows: plTotals.income.map(r => ({ label: r.label, amount: r.amount, account: r.label })) },
    { section: 'COST OF GOODS SOLD', rows: plTotals.cogs.map(r => ({ label: r.label, amount: -r.amount, account: 'Cost of Goods Sold' })) },
    { section: 'OPERATING EXPENSES', rows: plTotals.expense.map(r => ({ label: r.label, amount: -r.amount, account: r.label })) },
    { section: 'OTHER EXPENSES',     rows: plTotals.other_expense.map(r => ({ label: r.label, amount: -r.amount, account: r.label })) },
  ]

  const tabs = [
    { id: 'pl',       label: 'Profit & Loss' },
    { id: 'monthly',  label: 'Monthly Table' },
    { id: 'expenses', label: 'Expense Breakdown' },
    { id: 'accounts', label: 'Accounts' },
  ]

  const KEY_ACCOUNTS = [
    { name: 'Clover Clearing Account',    sub: 'Sales deposits cleared through Clover', txns: 779 },
    { name: 'TOTAL CHECKING (8059) - 1',  sub: 'Primary operating checking account',    txns: 881 },
    { name: 'BUS COMPLETE CHK (5998) - 1',sub: 'Business checking account',             txns: 621 },
    { name: 'Bank of America 7875',        sub: 'Secondary bank account',               txns: 201 },
    { name: 'Cost of Goods Sold',          sub: 'MAVISX / Weldon tire COGS',            txns: 382 },
    { name: 'Clover Sales',                sub: 'Journal entries from Clover POS',       txns: 111 },
    { name: 'Katz Chase',                  sub: 'Credit card expenses',                 txns: 40  },
    { name: 'Short Term Loans',            sub: 'Short term loan activity',             txns: 22  },
  ]

  return (
    <>
      <Head><title>Reydel Tire — Financials</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F8' }}>
        <Sidebar active="financials" />
        <DrillModal account={drillAccount} onClose={() => setDrillAccount(null)} />
        <div style={{ marginLeft: '220px', flex: 1 }}>

          {/* Topbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E5E5E5', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#1a1a1a', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>FINANCIALS</div>
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
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'TOTAL REVENUE',  value: fmt(plIncome),      sub: 'All sources',                                        sc: '#16a34a' },
                    { label: 'GROSS PROFIT',   value: fmt(plGrossProfit), sub: pct(plGrossProfit / plIncome * 100) + ' gross margin', sc: '#16a34a' },
                    { label: 'TOTAL EXPENSES', value: fmt(plExpenses),    sub: 'Operating expenses',                                 sc: THEME.accent },
                    { label: 'NET INCOME',     value: fmt(plNetIncome),   sub: pct(plNetIncome / plIncome * 100) + ' net margin',    sc: '#16a34a' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E5E5E5', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'DM Mono, monospace',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === t.id ? '#1a1a1a' : '#888',
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
                        <div key={section.section} style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F0F0F0', fontFamily: 'DM Mono, monospace' }}>{section.section}</div>
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
                                <tr key={row.label} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <td style={cell('left', { color: '#1a1a1a' })}>{row.label}</td>
                                  <td style={cell('right', { color: row.amount >= 0 ? '#16a34a' : THEME.accent })}>{fmt(row.amount)}</td>
                                  <td style={cell('right', { color: '#888' })}>{row.txns || '—'}</td>
                                  <td style={cell('right')}>
                                    {row.note ? (
                                      <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '3px' }}>{row.note}</span>
                                    ) : row.account ? (
                                      <button onClick={() => setDrillAccount(row.account)} style={{
                                        fontSize: '9px', background: '#F5F5F5', color: THEME.accent,
                                        border: '1px solid #E5E5E5', padding: '2px 8px', borderRadius: '3px',
                                        cursor: 'pointer', fontFamily: 'DM Mono, monospace',
                                      }}>DRILL →</button>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={4} style={{ padding: '8px 10px', borderTop: '1px solid #E5E5E5', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#1a1a1a', fontWeight: '600', textAlign: 'right' }}>
                                  {section.section === 'INCOME' ? 'Total Income: ' :
                                   section.section === 'COST OF GOODS SOLD' ? 'Gross Profit: ' :
                                   section.section === 'OPERATING EXPENSES' ? 'Total Operating Expenses: ' :
                                   'Total Other Expenses: '}
                                  <span style={{ color: section.section === 'COST OF GOODS SOLD' ? '#16a34a' : sectionTotal >= 0 ? '#16a34a' : THEME.accent }}>
                                    {section.section === 'COST OF GOODS SOLD' ? fmt(plGrossProfit) : fmt(sectionTotal)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                    {/* Net income */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>NET INCOME</div>
                      <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '700', fontFamily: 'DM Mono, monospace' }}>{fmt(plNetIncome)}</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      * May COGS estimated: $1,313 QB actual + $13,896 Weldon purchases pending QB entry
                    </div>
                  </div>
                )}

                {/* Monthly Table Tab */}
                {activeTab === 'monthly' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>MONTHLY P&L — FROM QUICKBOOKS</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace' }}>
                      <thead>
                        <tr>
                          {['Month','Revenue','COGS','Gross Profit','Net Profit','Margin'].map(h => (
                            <th key={h} style={hcell(h === 'Month' ? 'left' : 'right')}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthly.map((m, i) => (
                          <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={cell('left', { color: '#1a1a1a', fontWeight: '600' })}>
                              {m.label}
                              {m.notes && <span style={{ marginLeft: '6px', fontSize: '8px', color: '#92400e' }}>*est</span>}
                            </td>
                            <td style={cell('right')}>{fmt(m.revenue)}</td>
                            <td style={cell('right', { color: THEME.accent })}>{fmt(m.cogs)}</td>
                            <td style={cell('right', { color: '#16a34a' })}>{fmt(m.revenue - m.cogs)}</td>
                            <td style={cell('right', { color: '#16a34a', fontWeight: '600' })}>{fmt(m.profit)}</td>
                            <td style={cell('right')}>
                              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>
                                {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          {[
                            { v: 'TOTAL',                                    a: 'left',  c: '#1a1a1a', w: '700' },
                            { v: fmt(totals.revenue),                        a: 'right', c: '#1a1a1a', w: '700' },
                            { v: fmt(totals.cogs),                           a: 'right', c: THEME.accent, w: '700' },
                            { v: fmt(totals.revenue - totals.cogs),          a: 'right', c: '#16a34a', w: '700' },
                            { v: fmt(totals.profit),                         a: 'right', c: '#16a34a', w: '700' },
                            { v: pct(totals.profit / totals.revenue * 100),  a: 'right', c: '#16a34a', w: '700' },
                          ].map((col, i) => (
                            <td key={i} style={{ padding: '9px 10px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', color: col.c, fontSize: '11px', fontWeight: col.w, fontFamily: 'DM Mono, monospace', textAlign: col.a }}>{col.v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '10px', fontSize: '9px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      * May COGS estimated — Weldon $13,896 pending QB entry
                    </div>
                  </div>
                )}

                {/* Expense Breakdown Tab */}
                {activeTab === 'expenses' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { heading: 'OPERATING EXPENSES', rows: plTotals.expense },
                      { heading: 'OTHER EXPENSES',     rows: plTotals.other_expense },
                    ].map(group => {
                      const maxV = Math.max(...group.rows.map(r => r.amount), 1)
                      const groupTotal = group.rows.reduce((s, r) => s + r.amount, 0)
                      return (
                        <div key={group.heading} style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'DM Mono, monospace' }}>{group.heading}</div>
                          {[...group.rows].sort((a, b) => b.amount - a.amount).map(e => (
                            <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 0', borderBottom: '1px solid #F0F0F0' }}>
                              <div style={{ width: '180px', fontSize: '10px', color: '#333', flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>{e.label}</div>
                              <div style={{ flex: 1, height: '5px', background: '#E5E5E5', borderRadius: '3px' }}>
                                <div style={{ height: '5px', background: THEME.accent, borderRadius: '3px', width: `${Math.round(e.amount / maxV * 100)}%` }} />
                              </div>
                              <div style={{ width: '70px', textAlign: 'right', fontSize: '10px', color: THEME.accent, fontFamily: 'DM Mono, monospace' }}>{fmt(e.amount)}</div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E5E5E5', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#1a1a1a', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>Total: {fmt(groupTotal)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'DM Mono, monospace' }}>KEY ACCOUNTS — CLICK TO DRILL DOWN</div>
                    {KEY_ACCOUNTS.map(a => (
                      <div key={a.name} onClick={() => setDrillAccount(a.name)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', borderRadius: '4px',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#1a1a1a', fontFamily: 'DM Mono, monospace' }}>{a.name}</div>
                          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{a.sub}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{a.txns} txns</div>
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
