import { useEffect, useState, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { categorize, parentOf } from '../lib/accountTypes'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }
const monthLabel = (k) => `${MONTHS[k.slice(5, 7)]} ${k.slice(0, 4)}`

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
  padding: '8px 10px', borderBottom: '1px solid #F1EADB',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})
const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#888', background: '#FAF6EC',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #E7DECB',
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
        background: '#fff', border: '1px solid #E7DECB', borderRadius: '12px',
        width: '620px', maxHeight: '520px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(40,30,10,0.18)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7DECB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
          <div style={{ padding: '10px 20px', borderTop: '1px solid #E7DECB', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
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
  const [plByMonth,    setPlByMonth]    = useState({})   // { 'YYYY-MM': { account: signedSum } }
  const [plLabelCat,   setPlLabelCat]   = useState({})   // { account: 'income'|'cogs'|'expense'|'other_expense' }
  const [plMonths,     setPlMonths]     = useState([])   // sorted month keys
  const [plPeriod,     setPlPeriod]     = useState('all')
  const [accounts,     setAccounts]     = useState([])
  const [bs,           setBs]           = useState([])
  const [bsOpen,       setBsOpen]       = useState({ asset: true, liability: false, equity: true })
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('pl')
  const [drillAccount, setDrillAccount] = useState(null)
  const [isAdmin,      setIsAdmin]      = useState(false)
  const [health,       setHealth]       = useState(null)

  useEffect(() => {
    async function load() {
      const { data: mData } = await supabase.from('monthly_summary').select('*').order('month')
      if (mData) setMonthly(mData.map(r => ({
        key: r.month.slice(0, 7),
        label: MONTHS[r.month.slice(5, 7)] + ' ' + r.month.slice(0, 4),
        revenue: parseFloat(r.revenue),
        expenses: parseFloat(r.expenses),
        profit: parseFloat(r.profit),
        cogs: parseFloat(r.cogs),
        notes: r.notes || null,
      })))

      const { data: pData } = await supabase.from('pl_totals').select('label, amount, category')
      let plLabels = []
      if (pData) {
        const grouped = { income: [], cogs: [], expense: [], other_expense: [] }
        const labelCat = {}
        pData.forEach(row => { if (grouped[row.category]) { grouped[row.category].push({ label: row.label, amount: Number(row.amount) }); labelCat[row.label] = row.category } })
        setPlTotals(grouped)
        setPlLabelCat(labelCat)
        plLabels = pData.map(r => r.label)
      }

      // Per-month P&L: GL sums by account tie exactly to pl_totals, so we can
      // rebuild a real month-by-month statement from the raw ledger.
      if (plLabels.length) {
        let glRows = [], from = 0
        while (true) {
          const { data } = await supabase.from('gl_transactions').select('date, account, amount').in('account', plLabels).range(from, from + 999)
          if (!data || data.length === 0) break
          glRows = glRows.concat(data)
          if (data.length < 1000) break
          from += 1000
        }
        const byMonth = {}
        glRows.forEach(t => {
          if (!t.date) return
          const m = t.date.slice(0, 7)
          if (!byMonth[m]) byMonth[m] = {}
          byMonth[m][t.account] = (byMonth[m][t.account] || 0) + Number(t.amount)
        })
        setPlByMonth(byMonth)
        setPlMonths(Object.keys(byMonth).sort())
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

  // Current (in-progress) month key — a partial month is excluded from totals
  // and flagged in the monthly table so it can't be misread as a full month.
  const nowD = new Date()
  const curKey = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`
  const totals = monthly.filter(m => m.key < curKey).reduce((s, r) => ({
    revenue: s.revenue + r.revenue, expenses: s.expenses + r.expenses,
    profit: s.profit + r.profit, cogs: s.cogs + r.cogs,
  }), { revenue: 0, expenses: 0, profit: 0, cogs: 0 })

  // All-time P&L (used for headline reconciliation and the "All time" view).
  const plIncome      = plTotals.income.reduce((s, r) => s + r.amount, 0)
  const plCogs        = plTotals.cogs.reduce((s, r) => s + r.amount, 0)
  const plExpenses    = plTotals.expense.reduce((s, r) => s + r.amount, 0)
  const plOtherExp    = plTotals.other_expense.reduce((s, r) => s + r.amount, 0)
  const plNetIncome   = plIncome - plCogs - plExpenses - plOtherExp

  // P&L for the currently selected period (all-time or a single month).
  const plView = useMemo(() => {
    const empty = { income: [], cogs: [], expense: [], other_expense: [] }
    let g
    if (plPeriod === 'all') {
      g = plTotals
    } else {
      g = { income: [], cogs: [], expense: [], other_expense: [] }
      const monthData = plByMonth[plPeriod] || {}
      Object.entries(monthData).forEach(([acct, sum]) => {
        const cat = plLabelCat[acct]
        if (cat && Math.round(Math.abs(sum)) > 0) g[cat].push({ label: acct, amount: sum })
      })
      Object.values(g).forEach(arr => arr.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)))
    }
    g = g || empty
    const inc  = g.income.reduce((s, r) => s + r.amount, 0)
    const cogs = g.cogs.reduce((s, r) => s + r.amount, 0)
    const exp  = g.expense.reduce((s, r) => s + r.amount, 0)
    const oth  = g.other_expense.reduce((s, r) => s + r.amount, 0)
    return { g, inc, cogs, gross: inc - cogs, exp, oth, net: inc - cogs - exp - oth }
  }, [plPeriod, plTotals, plByMonth, plLabelCat])

  // ── Shared statement styling ────────────────────────────────────────────────
  const ui = "'Inter', sans-serif"
  const card = { background: '#fff', border: '1px solid #E7DECB', borderRadius: '12px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '20px 22px' }
  const pill = (on) => ({ padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: ui, border: `1px solid ${on ? '#1a1a1a' : '#E7DECB'}`, background: on ? '#1a1a1a' : '#fff', color: on ? '#fff' : '#8a8378' })
  const paren = (n) => n < 0 ? `(${fmt(n)})` : fmt(n)

  const SectionHead = ({ children }) => (
    <div style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', fontWeight: 700, fontFamily: ui, margin: '18px 0 4px' }}>{children}</div>
  )
  const LineItem = ({ label, amount, account }) => (
    <div onClick={account ? () => setDrillAccount(account) : undefined}
      onMouseEnter={e => { if (account) e.currentTarget.style.background = '#F5EFE3' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontSize: '12px', fontFamily: ui, color: '#4a4438', cursor: account ? 'pointer' : 'default', borderRadius: '5px' }}>
      <span style={{ paddingLeft: '8px' }}>{label}</span>
      <span style={{ color: amount >= 0 ? '#1a1a1a' : '#b0483a', fontVariantNumeric: 'tabular-nums' }}>{paren(amount)}</span>
    </div>
  )
  const TotalRow = ({ label, amount, accent, sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 8px 4px', marginTop: '2px', borderTop: '1px solid #E7DECB', fontFamily: ui }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>{label}{sub && <span style={{ fontSize: '10px', color: '#a39a88', fontWeight: 400, marginLeft: '8px' }}>{sub}</span>}</span>
      <span style={{ fontSize: '12.5px', fontWeight: 700, color: accent ? '#16a34a' : (amount >= 0 ? '#1a1a1a' : '#b0483a'), fontVariantNumeric: 'tabular-nums' }}>{paren(amount)}</span>
    </div>
  )

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

        <div style={{ padding: '26px 30px', maxWidth: '1160px' }}>
            {loading ? (
              <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Loading...</div>
            ) : (
              <>
                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '23px', fontWeight: 700, color: '#211E17', fontFamily: ui, letterSpacing: '-0.025em' }}>Financials</div>
                    <div style={{ fontSize: '12px', color: '#a39a88', fontFamily: ui, marginTop: '4px' }}>Reydel Tire &amp; Auto · profit &amp; loss, balance sheet and accounts</div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => { window.location.href = '/admin/financials' }}
                      style={{ fontSize: '10px', fontFamily: ui, letterSpacing: '0.08em', color: '#fff', background: THEME.accent, border: 'none', borderRadius: '7px', padding: '9px 14px', cursor: 'pointer' }}>
                      ↑ IMPORT GL FROM QUICKBOOKS
                    </button>
                  )}
                </div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #E7DECB', marginBottom: '20px' }}>
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

                {/* P&L Tab — clean statement with month selector */}
                {activeTab === 'pl' && (
                  <>
                    {/* Period selector */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', marginRight: '2px', fontFamily: ui, fontWeight: 600 }}>PERIOD</span>
                      {[{ k: 'all', l: 'All time' }, ...plMonths.map(k => ({ k, l: MONTHS[k.slice(5, 7)] }))].map(o => (
                        <button key={o.k} onClick={() => setPlPeriod(o.k)} style={pill(plPeriod === o.k)}>{o.l}</button>
                      ))}
                    </div>

                    {/* Statement card */}
                    <div style={{ ...card, maxWidth: '660px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #E7DECB', paddingBottom: '12px', marginBottom: '4px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', fontFamily: ui, letterSpacing: '-0.01em' }}>Profit &amp; Loss</div>
                          <div style={{ fontSize: '10px', color: '#a39a88', marginTop: '2px', fontFamily: ui }}>Reydel Tire &amp; Auto</div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b6355', fontFamily: ui, fontWeight: 500 }}>{plPeriod === 'all' ? 'All time' : monthLabel(plPeriod)}</div>
                      </div>

                      {plView.g.income.length === 0 && plView.g.expense.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#a39a88', fontFamily: ui, padding: '18px 8px' }}>No activity in this period.</div>
                      ) : (
                        <>
                          <SectionHead>INCOME</SectionHead>
                          {plView.g.income.map(r => <LineItem key={r.label} label={r.label} amount={r.amount} account={r.label} />)}
                          <TotalRow label="Total Income" amount={plView.inc} />

                          <SectionHead>COST OF GOODS SOLD</SectionHead>
                          {plView.g.cogs.map(r => <LineItem key={r.label} label={r.label} amount={-r.amount} account="Cost of Goods Sold" />)}
                          <TotalRow label="Gross Profit" amount={plView.gross} accent sub={plView.inc > 0 ? `${pct(plView.gross / plView.inc * 100)} margin` : null} />

                          <SectionHead>OPERATING EXPENSES</SectionHead>
                          {plView.g.expense.map(r => <LineItem key={r.label} label={r.label} amount={-r.amount} account={r.label} />)}
                          <TotalRow label="Total Operating Expenses" amount={-plView.exp} />

                          {plView.g.other_expense.length > 0 && (
                            <>
                              <SectionHead>OTHER EXPENSES</SectionHead>
                              {plView.g.other_expense.map(r => <LineItem key={r.label} label={r.label} amount={-r.amount} account={r.label} />)}
                              <TotalRow label="Total Other Expenses" amount={-plView.oth} />
                            </>
                          )}

                          {/* Net income */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '14px 12px', background: plView.net >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${plView.net >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '9px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: plView.net >= 0 ? '#16a34a' : '#991b1b', fontFamily: ui }}>NET INCOME</span>
                            <span style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                              {plView.inc > 0 && <span style={{ fontSize: '11px', color: '#6b6355', fontFamily: ui }}>{pct(plView.net / plView.inc * 100)} margin</span>}
                              <span style={{ fontSize: '21px', fontWeight: 700, color: plView.net >= 0 ? '#16a34a' : '#991b1b', fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt(plView.net)}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Balance Sheet Tab */}
                {activeTab === 'bs' && (() => {
                  const groups = { asset: [], liability: [], equity: [] }
                  bs.forEach(r => { if (groups[r.category]) groups[r.category].push(r) })
                  Object.values(groups).forEach(g => g.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)))
                  const tot = c => groups[c].reduce((s, r) => s + r.amount, 0)
                  const totA = tot('asset'), totL = tot('liability'), totE = tot('equity')
                  const balanced = Math.abs(totA - totL - totE) < 0.01
                  // Collapsible section — header shows total + count; click to expand rows.
                  const Section = ({ title, cat, rows, total }) => {
                    const open = bsOpen[cat]
                    return (
                      <div style={{ ...card, padding: '0', overflow: 'hidden' }}>
                        <div onClick={() => setBsOpen(s => ({ ...s, [cat]: !s[cat] }))}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF6EC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', color: '#a39a88', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>▶</span>
                            <span style={{ fontSize: '10px', color: '#6b6355', letterSpacing: '0.14em', fontWeight: 700, fontFamily: ui }}>{title}</span>
                            <span style={{ fontSize: '9px', color: '#b8ae9a', fontFamily: ui }}>{rows.length} account{rows.length === 1 ? '' : 's'}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: total >= 0 ? '#1a1a1a' : THEME.accent, fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
                        </div>
                        {open && (
                          <div style={{ borderTop: '1px solid #E7DECB', padding: '6px 8px 10px' }}>
                            {rows.map(r => (
                              <div key={r.account} onClick={r.account !== 'Net Income' ? () => setDrillAccount(r.account) : undefined}
                                onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '5px', cursor: r.account !== 'Net Income' ? 'pointer' : 'default', fontFamily: ui }}>
                                <span style={{ fontSize: '12px', color: r.account === 'Net Income' ? '#16a34a' : '#4a4438', paddingLeft: '18px' }}>{r.account}</span>
                                <span style={{ fontSize: '12px', color: r.amount >= 0 ? '#1a1a1a' : THEME.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                  if (!bs.length) return <div style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>No balance sheet data yet — import a General Ledger.</div>
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '660px' }}>
                      <Section title="ASSETS" cat="asset" rows={groups.asset} total={totA} />
                      <Section title="LIABILITIES" cat="liability" rows={groups.liability} total={totL} />
                      <Section title="EQUITY" cat="equity" rows={groups.equity} total={totE} />
                      <div style={{ background: balanced ? '#f0fdf4' : '#fef2f2', border: `1px solid ${balanced ? '#bbf7d0' : '#fecaca'}`, borderRadius: '9px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: balanced ? '#16a34a' : '#991b1b', fontWeight: '700', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
                          {balanced ? '✓ IN BALANCE' : '✕ OUT OF BALANCE'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b6355', fontFamily: 'Inter, sans-serif' }}>
                          Assets {fmt(totA)} &nbsp;=&nbsp; Liabilities + Equity {fmt(totL + totE)}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Monthly Table Tab */}
                {activeTab === 'monthly' && (
                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
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
                        {monthly.map((m, i) => {
                          const partial = m.key >= curKey
                          return (
                            <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ opacity: partial ? 0.6 : 1 }}>
                              <td style={cell('left', { color: '#1a1a1a', fontWeight: '600' })}>
                                {m.label}
                                {partial && <span style={{ marginLeft: '6px', fontSize: '8px', color: '#a39a88', letterSpacing: '0.06em' }}>· IN PROGRESS</span>}
                              </td>
                              <td style={cell('right')}>{fmt(m.revenue)}</td>
                              <td style={cell('right', { color: THEME.accent })}>{fmt(m.cogs)}</td>
                              <td style={cell('right', { color: '#16a34a' })}>{fmt(m.revenue - m.cogs)}</td>
                              <td style={cell('right', { color: '#16a34a', fontWeight: '600' })}>{fmt(m.profit)}</td>
                              <td style={cell('right')}>
                                {partial ? <span style={{ fontSize: '9px', color: '#a39a88' }}>—</span> : (
                                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '3px', fontSize: '9px' }}>
                                    {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        <tr>
                          {[
                            { v: 'TOTAL',                                    a: 'left',  c: '#1a1a1a', w: '700' },
                            { v: fmt(totals.revenue),                        a: 'right', c: '#1a1a1a', w: '700' },
                            { v: fmt(totals.cogs),                           a: 'right', c: THEME.accent, w: '700' },
                            { v: fmt(totals.revenue - totals.cogs),          a: 'right', c: '#16a34a', w: '700' },
                            { v: fmt(totals.profit),                         a: 'right', c: '#16a34a', w: '700' },
                            { v: pct(totals.profit / totals.revenue * 100),  a: 'right', c: '#16a34a', w: '700' },
                          ].map((col, i) => (
                            <td key={i} style={{ padding: '9px 10px', borderTop: '2px solid #E7DECB', background: '#FAF6EC', color: col.c, fontSize: '11px', fontWeight: col.w, fontFamily: 'Inter, sans-serif', textAlign: col.a }}>{col.v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
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
                        <div key={group.heading} style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '12px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '20px 22px', maxWidth: '660px' }}>
                          <div style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', fontWeight: 700, marginBottom: '16px', fontFamily: ui }}>{group.heading}</div>
                          {[...group.rows].sort((a, b) => b.amount - a.amount).map(e => (
                            <div key={e.label} style={{ padding: '9px 0', borderBottom: '1px solid #F1EADB' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                <span style={{ fontSize: '12px', color: '#4a4438', fontFamily: ui }}>{e.label}</span>
                                <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                  <span style={{ fontSize: '10px', color: '#a39a88', fontFamily: ui }}>{groupTotal > 0 ? pct(e.amount / groupTotal * 100) : '—'}</span>
                                  <span style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 600, fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt(e.amount)}</span>
                                </span>
                              </div>
                              <div style={{ height: '6px', background: '#F1EADB', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: `linear-gradient(90deg, ${THEME.accent}, #e05a3a)`, borderRadius: '3px', width: `${Math.round(e.amount / maxV * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '4px', borderTop: '1px solid #E7DECB' }}>
                            <span style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: ui, fontWeight: 700 }}>Total</span>
                            <span style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: ui, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(groupTotal)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                  <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
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
                              onMouseEnter={e => e.currentTarget.style.background = '#F5EFE3'}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #F1EADB' }}>
                      <div style={{ fontSize: '11px', color: '#333', fontFamily: 'Inter, sans-serif' }}>{k}{sub && <span style={{ color: '#aaa', marginLeft: '8px' }}>{sub}</span>}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: bad ? '#CC2222' : '#1a1a1a' }}>{v}</div>
                    </div>
                  )
                  const Check = ({ ok, label, detail }) => (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #F1EADB' }}>
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
                      <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>DATA FRESHNESS</div>
                        <Row k="Clover sales" v={ago(health?.cloverLastSynced)} sub={health?.cloverLastSynced ? new Date(health.cloverLastSynced).toLocaleString() : ''} bad={cloverStale} />
                        <Row k="Last Clover sync" v={health?.lastCloverSync ? (health.lastCloverSync.ok ? 'OK' : 'FAILED') : '—'} sub={health?.lastCloverSync ? ago(health.lastCloverSync.ran_at) : ''} bad={cloverFailed} />
                        <Row k="Weldon orders" v={ago(health?.weldonLastAdded)} sub={health?.weldonLastAdded ? new Date(health.weldonLastAdded).toLocaleString() : ''} />
                        <Row k="Financials" v={health?.lastImport ? ago(health.lastImport.imported_at) : '—'} sub={health?.lastImport ? `last ${health.lastImport.kind} import` : ''} />
                      </div>
                      <div style={{ background: '#fff', border: '1px solid #E7DECB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(60,45,20,0.05)', padding: '16px' }}>
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
