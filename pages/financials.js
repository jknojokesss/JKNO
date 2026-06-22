import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { categorize, parentOf } from '../lib/accountTypes'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

// Account classification is shared with the Accounts page (lib/accountTypes).
const CAT_LABEL = { income: 'Income', expense: 'Expense', asset: 'Asset', liability: 'Liability', equity: 'Equity' }

// Optional friendly descriptions; falls back to category + transaction types.
const ACCOUNT_DESC = {
  'Clover Clearing Account':     'Sales deposits cleared through Clover',
  'TOTAL CHECKING (8059) - 1':   'Primary operating checking account',
  'BUS COMPLETE CHK (5998) - 1': 'Business checking account',
  'Bank of America 7875':        'Secondary bank account',
  'Cost of Goods Sold':          'MAVISX / Weldon tire COGS',
  'Clover Sales':                'Journal entries from Clover POS',
  'Katz Chase':                  'Credit card expenses',
  'Short Term Loans':            'Short term loan activity',
}

const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222' }

const cell = (align = 'left', extra = {}) => ({
  padding: '8px 10px', borderBottom: '1px solid #F0F0F0',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})
const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#888', background: '#FAFAFA',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E5E5E5',
  fontFamily: 'Inter, sans-serif', textAlign: align,
})

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
          <div style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', fontWeight: '600' }}>{account}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>Loading transactions...</div>
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
                  <tr><td colSpan={4} style={{ padding: '20px', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px', textAlign: 'center' }}>No transactions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {txns.length === 500 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #E5E5E5', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
            Showing most recent 500 transactions
          </div>
        )}
      </div>
    </div>
  )
}

export default function Financials() {
  // Require sign-in: send anonymous visitors to /login before any data renders.
  // Also flag admins (JK No Jokes) so the GL import control shows only to them.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.replace('/login'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle()
      setIsAdmin(!!adminData)
    })
  }, [])
  const [monthly,      setMonthly]      = useState([])
  const [plTotals,     setPlTotals]     = useState({ income: [], cogs: [], expense: [], other_expense: [] })
  const [accounts,     setAccounts]     = useState([])
  const [bs,           setBs]           = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('pl')
  const [drillAccount, setDrillAccount] = useState(null)
  const [isAdmin,      setIsAdmin]      = useState(false)
  const [health,       setHealth]       = useState(null)

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

      // Live account balances — same server-aggregated view the Accounts page reads,
      // so balances and txn counts match across both screens (no stale hardcoding).
      const { data: aData } = await supabase
        .from('account_balances').select('name, txn_count, total, types')
      if (aData) setAccounts(aData.map(r => ({
        name: r.name,
        category: categorize(r.name),
        total: Number(r.total),
        txns: r.txn_count,
        types: r.types || [],
      })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total)))

      const { data: bData } = await supabase.from('bs_totals').select('account, amount, category')
      if (bData) setBs(bData.map(r => ({ account: r.account, amount: Number(r.amount), category: r.category })))

      // Data-health: freshness + Clover sync status (reconciliation is computed from data already loaded)
      const [cpt, wf, li, sl] = await Promise.all([
        supabase.from('clover_pos_total').select('*').maybeSingle(),
        supabase.from('weldon_orders').select('created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('import_log').select('imported_at, kind').order('imported_at', { ascending: false }).limit(1),
        supabase.from('sync_log').select('ran_at, ok').eq('source', 'clover').order('ran_at', { ascending: false }).limit(1),
      ])
      setHealth({
        cloverPos: cpt.data ? Number(cpt.data.total) : null,
        cloverLastSynced: cpt.data?.last_synced || null,
        weldonLastAdded: wf.data?.[0]?.created_at || null,
        lastImport: li.data?.[0] || null,
        lastCloverSync: sl.data?.[0] || null,
      })

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
    { id: 'bs',       label: 'Balance Sheet' },
    { id: 'monthly',  label: 'Monthly Table' },
    { id: 'expenses', label: 'Expense Breakdown' },
    { id: 'accounts', label: 'Accounts' },
    ...(isAdmin ? [{ id: 'health', label: 'Data Health' }] : []),
  ]

  const accountsTotalTxns = accounts.reduce((s, a) => s + a.txns, 0)

  return (
    <>
      <Head><title>Reydel Tire — Financials</title></Head>
      <Shell active="financials">
        <DrillModal account={drillAccount} onClose={() => setDrillAccount(null)} />

        <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* Admin-only: import a fresh QuickBooks GL. Clients never see this. */}
                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button onClick={() => { window.location.href = '/admin/financials' }}
                      style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', color: '#fff', background: THEME.accent, border: 'none', borderRadius: '4px', padding: '8px 14px', cursor: 'pointer' }}>
                      ↑ IMPORT GL FROM QUICKBOOKS
                    </button>
                  </div>
                )}
                {/* KPI row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'TOTAL REVENUE',  value: fmt(plIncome),      sub: 'All sources',                                        sc: '#16a34a' },
                    { label: 'GROSS PROFIT',   value: fmt(plGrossProfit), sub: pct(plGrossProfit / plIncome * 100) + ' gross margin', sc: '#16a34a' },
                    { label: 'TOTAL EXPENSES', value: fmt(plExpenses),    sub: 'Operating expenses',                                 sc: THEME.accent },
                    { label: 'NET INCOME',     value: fmt(plNetIncome),   sub: pct(plNetIncome / plIncome * 100) + ' net margin',    sc: '#16a34a' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', color: '#1a1a1a', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>{k.value}</div>
                      <div style={{ fontSize: '10px', color: k.sc, marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E5E5E5', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'Inter, sans-serif',
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
                          <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F0F0F0', fontFamily: 'Inter, sans-serif' }}>{section.section}</div>
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
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                      }}>DRILL →</button>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={4} style={{ padding: '8px 10px', borderTop: '1px solid #E5E5E5', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#1a1a1a', fontWeight: '600', textAlign: 'right' }}>
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
                      <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em' }}>NET INCOME</div>
                      <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>{fmt(plNetIncome)}</div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
                      * May COGS estimated: $1,313 QB actual + $13,896 Weldon purchases pending QB entry
                    </div>
                  </div>
                )}

                {/* Balance Sheet Tab */}
                {activeTab === 'bs' && (() => {
                  const groups = { asset: [], liability: [], equity: [] }
                  bs.forEach(r => { if (groups[r.category]) groups[r.category].push(r) })
                  Object.values(groups).forEach(g => g.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)))
                  const tot = c => groups[c].reduce((s, r) => s + r.amount, 0)
                  const totA = tot('asset'), totL = tot('liability'), totE = tot('equity')
                  const balanced = Math.abs(totA - totL - totE) < 0.01
                  const Section = ({ title, rows, total }) => (
                    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F0F0F0', fontFamily: 'Inter, sans-serif' }}>{title}</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {rows.map(r => (
                            <tr key={r.account} onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={cell('left', { color: r.account === 'Net Income' ? '#16a34a' : '#1a1a1a' })}>{r.account}</td>
                              <td style={cell('right', { color: r.amount >= 0 ? '#1a1a1a' : THEME.accent })}>{fmt(r.amount)}</td>
                              <td style={cell('right')}>
                                {r.account !== 'Net Income' && (
                                  <button onClick={() => setDrillAccount(r.account)} style={{ fontSize: '9px', background: '#F5F5F5', color: THEME.accent, border: '1px solid #E5E5E5', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>DRILL →</button>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 10px', borderTop: '1px solid #E5E5E5', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#1a1a1a', fontWeight: '600', textAlign: 'right' }}>
                              Total {title.charAt(0) + title.slice(1).toLowerCase()}: <span>{fmt(total)}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )
                  if (!bs.length) return <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>No balance sheet data yet — import a General Ledger.</div>
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <Section title="ASSETS" rows={groups.asset} total={totA} />
                      <Section title="LIABILITIES" rows={groups.liability} total={totL} />
                      <Section title="EQUITY" rows={groups.equity} total={totE} />
                      <div style={{ background: balanced ? '#f0fdf4' : '#fef2f2', border: `1px solid ${balanced ? '#bbf7d0' : '#fecaca'}`, borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: balanced ? '#16a34a' : '#991b1b', fontWeight: '600', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
                          {balanced ? '✓ IN BALANCE' : '✕ OUT OF BALANCE'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif' }}>
                          Assets {fmt(totA)} &nbsp;=&nbsp; Liabilities + Equity {fmt(totL + totE)}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Monthly Table Tab */}
                {activeTab === 'monthly' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>MONTHLY P&L — FROM QUICKBOOKS</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
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
                            <td key={i} style={{ padding: '9px 10px', borderTop: '2px solid #E5E5E5', background: '#FAFAFA', color: col.c, fontSize: '11px', fontWeight: col.w, fontFamily: 'Inter, sans-serif', textAlign: col.a }}>{col.v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '10px', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
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
                          <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>{group.heading}</div>
                          {[...group.rows].sort((a, b) => b.amount - a.amount).map(e => (
                            <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 0', borderBottom: '1px solid #F0F0F0' }}>
                              <div style={{ width: '180px', fontSize: '10px', color: '#333', flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>{e.label}</div>
                              <div style={{ flex: 1, height: '5px', background: '#E5E5E5', borderRadius: '3px' }}>
                                <div style={{ height: '5px', background: THEME.accent, borderRadius: '3px', width: `${Math.round(e.amount / maxV * 100)}%` }} />
                              </div>
                              <div style={{ width: '70px', textAlign: 'right', fontSize: '10px', color: THEME.accent, fontFamily: 'Inter, sans-serif' }}>{fmt(e.amount)}</div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E5E5E5', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#1a1a1a', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>Total: {fmt(groupTotal)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif' }}>ACCOUNT BALANCES — CLICK TO DRILL DOWN</div>
                      <div style={{ fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
                        {accounts.length} accounts &nbsp;·&nbsp; {accountsTotalTxns.toLocaleString()} txns
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={hcell('left')}>ACCOUNT</th>
                          <th style={hcell('left')}>CATEGORY</th>
                          <th style={hcell('right')}>BALANCE</th>
                          <th style={hcell('right')}>TXNS</th>
                          <th style={hcell('right')}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map(a => {
                          const parent = parentOf(a.name)
                          const sub = parent ? `↳ sub-account of ${parent}` : (ACCOUNT_DESC[a.name] || a.types.slice(0, 3).join(', '))
                          return (
                            <tr key={a.name} onClick={() => setDrillAccount(a.name)} style={{ cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F8F8F8'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={cell('left', { color: '#1a1a1a' })}>
                                {a.name}
                                {sub && <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{sub}</div>}
                              </td>
                              <td style={cell('left', { color: '#888' })}>{CAT_LABEL[a.category]}</td>
                              <td style={cell('right', { color: a.total >= 0 ? '#16a34a' : THEME.accent })}>{fmt(a.total)}</td>
                              <td style={cell('right', { color: '#888' })}>{a.txns}</td>
                              <td style={cell('right')}>
                                <span style={{ fontSize: '9px', color: THEME.accent, fontFamily: 'Inter, sans-serif' }}>DRILL →</span>
                              </td>
                            </tr>
                          )
                        })}
                        {accounts.length === 0 && (
                          <tr><td colSpan={5} style={{ padding: '20px', color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '11px', textAlign: 'center' }}>No accounts found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Data Health Tab (admin only) */}
                {activeTab === 'health' && (() => {
                  const glClover = (plTotals.income.find(r => r.label === 'Clover Sales')?.amount) || 0
                  const cloverPos = health?.cloverPos
                  const posVar = cloverPos != null ? cloverPos - glClover : null
                  const bsAssets = bs.filter(r => r.category === 'asset').reduce((s, r) => s + r.amount, 0)
                  const bsLE = bs.filter(r => r.category !== 'asset').reduce((s, r) => s + r.amount, 0)
                  const bsBalanced = Math.abs(bsAssets - bsLE) < 0.01
                  const niBs = bs.find(r => r.account === 'Net Income')?.amount || 0
                  const niTie = Math.abs(niBs - plNetIncome) < 0.01
                  const ago = (ts) => { if (!ts) return '—'; const h = (Date.now() - new Date(ts)) / 36e5; return h < 1 ? `${Math.round(h * 60)} min ago` : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} d ago` }
                  const cloverStale = health?.cloverLastSynced ? (Date.now() - new Date(health.cloverLastSynced)) / 36e5 > 36 : true
                  const cloverFailed = health?.lastCloverSync?.ok === false
                  const Row = ({ k, v, sub, bad }) => (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #F0F0F0' }}>
                      <div style={{ fontSize: '11px', color: '#333', fontFamily: 'Inter, sans-serif' }}>{k}{sub && <span style={{ color: '#aaa', marginLeft: '8px' }}>{sub}</span>}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: bad ? '#CC2222' : '#1a1a1a' }}>{v}</div>
                    </div>
                  )
                  const Check = ({ ok, label, detail }) => (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #F0F0F0' }}>
                      <div style={{ fontSize: '11px', color: '#333', fontFamily: 'Inter, sans-serif' }}>
                        <span style={{ color: ok ? '#16a34a' : '#CC2222', marginRight: '8px' }}>{ok ? '✓' : '✕'}</span>{label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{detail}</div>
                    </div>
                  )
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {(cloverStale || cloverFailed) && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '14px 18px', fontSize: '12px', color: '#991b1b', fontFamily: 'Inter, sans-serif' }}>
                          ⚠ {cloverFailed ? 'The last Clover sync FAILED.' : 'Clover data looks stale — no successful sync in over 36 hours.'} Check the API token / cron.
                        </div>
                      )}
                      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>DATA FRESHNESS</div>
                        <Row k="Clover sales" v={ago(health?.cloverLastSynced)} sub={health?.cloverLastSynced ? new Date(health.cloverLastSynced).toLocaleString() : ''} bad={cloverStale} />
                        <Row k="Last Clover sync" v={health?.lastCloverSync ? (health.lastCloverSync.ok ? 'OK' : 'FAILED') : '—'} sub={health?.lastCloverSync ? ago(health.lastCloverSync.ran_at) : ''} bad={cloverFailed} />
                        <Row k="Weldon orders" v={ago(health?.weldonLastAdded)} sub={health?.weldonLastAdded ? new Date(health.weldonLastAdded).toLocaleString() : ''} />
                        <Row k="Financials" v={health?.lastImport ? ago(health.lastImport.imported_at) : '—'} sub={health?.lastImport ? `last ${health.lastImport.kind} import` : ''} />
                      </div>
                      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '6px', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>RECONCILIATION</div>
                        <Check ok={bsBalanced} label="Balance sheet balances" detail={`${fmt(bsAssets)} = ${fmt(bsLE)}`} />
                        <Check ok={niTie} label="Net income ties P&L → Balance Sheet" detail={`${fmt(plNetIncome)} / ${fmt(niBs)}`} />
                        <Check ok={posVar != null && glClover > 0 && Math.abs(posVar) < glClover * 0.05} label="Clover POS ≈ booked Clover Sales" detail={cloverPos != null ? `POS ${fmt(cloverPos)} vs GL ${fmt(glClover)} (Δ ${fmt(posVar)})` : '—'} />
                        <div style={{ fontSize: '9px', color: '#aaa', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
                          POS vs booked won't be exact — timing, refunds, tax/tips differ. Large gaps are the signal.
                        </div>
                      </div>
                    </div>
                  )
                })()}

              </>
            )}
          </div>
      </Shell>
    </>
  )
}
