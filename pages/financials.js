import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Shell from '../components/Shell'
import { categorize } from '../lib/accountTypes'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
const pct = (n) => `${parseFloat(n).toFixed(1)}%`

const MONTHS = { '01':'JAN','02':'FEB','03':'MAR','04':'APR','05':'MAY','06':'JUN','07':'JUL','08':'AUG','09':'SEP','10':'OCT','11':'NOV','12':'DEC' }
const monthLabel = (k) => `${MONTHS[k.slice(5, 7)]} ${k.slice(0, 4)}`

// Cash / bank accounts — a GL row whose `account` is one of these IS a cash
// movement; its `split_account` tells us why (→ operating / investing / financing).
const CASH_ACCTS = ['Clover Clearing Account','TOTAL CHECKING (8059) - 1','BUS COMPLETE CHK (5998) - 1','Bank of America 7875','BOA Savings','Cash on hand','Savings 1651']


const THEME = { sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#B0281C' }

const cell = (align = 'left', extra = {}) => ({
  padding: '8px 10px', borderBottom: '1px solid #E6E1D6',
  color: '#333', fontSize: '11px', fontFamily: 'Inter, sans-serif',
  textAlign: align, ...extra,
})
const hcell = (align = 'left') => ({
  padding: '6px 10px', fontSize: '9px', color: '#888', background: '#ECE7DD',
  fontWeight: '400', letterSpacing: '0.1em', borderBottom: '1px solid #DBD5C7',
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
        background: '#fff', border: '1px solid #DBD5C7', borderRadius: '0',
        width: '620px', maxHeight: '520px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(40,30,10,0.18)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DBD5C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#1B1815', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', fontWeight: '600' }}>{account}</div>
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
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#ECE8DF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={cell('left')}>{t.date}</td>
                    <td style={{ ...cell('left'), color: '#888', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ ...cell('left'), color: '#888' }}>{t.type}</td>
                    <td style={{ ...cell('right'), color: parseFloat(t.amount) >= 0 ? '#1C7A4E' : '#B0281C' }}>{fmt(parseFloat(t.amount))}</td>
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
          <div style={{ padding: '10px 20px', borderTop: '1px solid #DBD5C7', fontSize: '9px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
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
  const [compareOn,    setCompareOn]    = useState(false)
  const [comparePeriod, setComparePeriod] = useState(null)
  const [cashRows,     setCashRows]     = useState([])   // gl rows where account is a cash/bank account
  const [cfPeriod,     setCfPeriod]     = useState('all')
  const [accounts,     setAccounts]     = useState([])
  const [bs,           setBs]           = useState([])
  const [bsOpen,       setBsOpen]       = useState({ asset: true, liability: false, equity: true })
  const [acctOpen,     setAcctOpen]     = useState({ asset: true, liability: false, equity: false, income: false, expense: false })
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

      // Cash-flow source: every GL row that moves a bank/cash account.
      let cRows = [], cf = 0
      while (true) {
        const { data } = await supabase.from('gl_transactions').select('date, amount, split_account').in('account', CASH_ACCTS).range(cf, cf + 999)
        if (!data || data.length === 0) break
        cRows = cRows.concat(data)
        if (data.length < 1000) break
        cf += 1000
      }
      setCashRows(cRows)

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

  // Build a P&L for any period (all-time or a single month key).
  const buildPL = (period) => {
    let g
    if (period === 'all') {
      g = plTotals
    } else {
      g = { income: [], cogs: [], expense: [], other_expense: [] }
      const monthData = plByMonth[period] || {}
      Object.entries(monthData).forEach(([acct, sum]) => {
        const cat = plLabelCat[acct]
        if (cat && Math.round(Math.abs(sum)) > 0) g[cat].push({ label: acct, amount: sum })
      })
      Object.values(g).forEach(arr => arr.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)))
    }
    const inc  = g.income.reduce((s, r) => s + r.amount, 0)
    const cogs = g.cogs.reduce((s, r) => s + r.amount, 0)
    const exp  = g.expense.reduce((s, r) => s + r.amount, 0)
    const oth  = g.other_expense.reduce((s, r) => s + r.amount, 0)
    return { g, inc, cogs, gross: inc - cogs, exp, oth, net: inc - cogs - exp - oth }
  }
  const plView = buildPL(plPeriod)
  const plCmp  = compareOn && comparePeriod && plPeriod !== 'all' ? buildPL(comparePeriod) : null

  // ── Shared statement styling ────────────────────────────────────────────────
  const ui = "'Inter', sans-serif"
  const card = { background: '#fff', border: '1px solid #DBD5C7', borderRadius: '0', boxShadow: 'none', padding: '20px 22px' }
  const pill = (on) => ({ padding: '6px 12px', borderRadius: '0', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: ui, border: `1px solid ${on ? '#1B1815' : '#DBD5C7'}`, background: on ? '#1B1815' : '#fff', color: on ? '#fff' : '#8a8378' })
  const paren = (n) => n < 0 ? `(${fmt(n)})` : fmt(n)

  const SectionHead = ({ children }) => (
    <div style={{ fontSize: '9px', color: '#9A9284', letterSpacing: '0.14em', fontWeight: 700, fontFamily: ui, margin: '18px 0 4px' }}>{children}</div>
  )
  const LineItem = ({ label, amount, account }) => (
    <div onClick={account ? () => setDrillAccount(account) : undefined}
      onMouseEnter={e => { if (account) e.currentTarget.style.background = '#ECE8DF' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontSize: '12px', fontFamily: ui, color: '#4A453C', cursor: account ? 'pointer' : 'default', borderRadius: '0' }}>
      <span style={{ paddingLeft: '8px' }}>{label}</span>
      <span style={{ color: amount >= 0 ? '#1B1815' : '#b0483a', fontVariantNumeric: 'tabular-nums' }}>{paren(amount)}</span>
    </div>
  )
  const TotalRow = ({ label, amount, accent, sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 8px 4px', marginTop: '2px', borderTop: '1px solid #DBD5C7', fontFamily: ui }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1B1815' }}>{label}{sub && <span style={{ fontSize: '10px', color: '#9A9284', fontWeight: 400, marginLeft: '8px' }}>{sub}</span>}</span>
      <span style={{ fontSize: '12.5px', fontWeight: 700, color: accent ? '#1C7A4E' : (amount >= 0 ? '#1B1815' : '#b0483a'), fontVariantNumeric: 'tabular-nums' }}>{paren(amount)}</span>
    </div>
  )

  const tabs = [
    { id: 'pl',       label: 'Profit & Loss' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'bs',       label: 'Balance Sheet' },
    { id: 'monthly',  label: 'Monthly Table' },
    { id: 'accounts', label: 'Account Balances' },
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
                    <div style={{ fontSize: '23px', fontWeight: 700, color: '#1B1815', fontFamily: "'Barlow Semi Condensed', sans-serif", letterSpacing: '0.02em', textTransform: 'uppercase' }}>Financials</div>
                    <div style={{ fontSize: '12px', color: '#9A9284', fontFamily: ui, marginTop: '4px' }}>Reydel Tire &amp; Auto · profit &amp; loss, balance sheet and accounts</div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => { window.location.href = '/admin/financials' }}
                      style={{ fontSize: '10px', fontFamily: ui, letterSpacing: '0.08em', color: '#fff', background: THEME.accent, border: 'none', borderRadius: '0', padding: '9px 14px', cursor: 'pointer' }}>
                      ↑ IMPORT GL FROM QUICKBOOKS
                    </button>
                  )}
                </div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #DBD5C7', marginBottom: '20px' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: '8px 16px', fontSize: '10px', fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTab === t.id ? '#1B1815' : '#888',
                      borderBottom: activeTab === t.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      marginBottom: '-1px',
                    }}>{t.label}</button>
                  ))}
                </div>

                {/* P&L Tab — clean statement with month selector + compare */}
                {activeTab === 'pl' && (
                  <>
                    {/* Period selector + compare toggle */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: compareOn ? '10px' : '18px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#9A9284', letterSpacing: '0.14em', marginRight: '2px', fontFamily: ui, fontWeight: 600 }}>PERIOD</span>
                      {[{ k: 'all', l: 'All time' }, ...plMonths.map(k => ({ k, l: MONTHS[k.slice(5, 7)] }))].map(o => (
                        <button key={o.k} onClick={() => setPlPeriod(o.k)} style={pill(plPeriod === o.k)}>{o.l}</button>
                      ))}
                      {plMonths.length > 1 && (
                        <button onClick={() => {
                          const next = !compareOn
                          setCompareOn(next)
                          if (next) {
                            let base = plPeriod
                            if (base === 'all') { base = plMonths[plMonths.length - 1]; setPlPeriod(base) }
                            if (!comparePeriod || comparePeriod === base) {
                              const idx = plMonths.indexOf(base)
                              setComparePeriod(plMonths[idx - 1] || plMonths.find(m => m !== base) || base)
                            }
                          }
                        }} style={{ ...pill(compareOn), marginLeft: '10px' }}>⇄ Compare</button>
                      )}
                    </div>

                    {/* Compare-to selector */}
                    {compareOn && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#9A9284', letterSpacing: '0.14em', marginRight: '2px', fontFamily: ui, fontWeight: 600 }}>COMPARE&nbsp;TO</span>
                        {plMonths.map(k => (
                          <button key={k} onClick={() => setComparePeriod(k)} style={pill(comparePeriod === k)}>{MONTHS[k.slice(5, 7)]}</button>
                        ))}
                      </div>
                    )}

                    {/* Statement card */}
                    <div style={{ ...card, maxWidth: plCmp ? '740px' : '660px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #DBD5C7', paddingBottom: '12px', marginBottom: '4px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B1815', fontFamily: ui, letterSpacing: '-0.01em' }}>Profit &amp; Loss</div>
                          <div style={{ fontSize: '10px', color: '#9A9284', marginTop: '2px', fontFamily: ui }}>Reydel Tire &amp; Auto</div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b6355', fontFamily: ui, fontWeight: 500 }}>
                          {plCmp ? `${monthLabel(plPeriod)} vs ${monthLabel(comparePeriod)}` : (plPeriod === 'all' ? 'All time' : monthLabel(plPeriod))}
                        </div>
                      </div>

                      {plView.g.income.length === 0 && plView.g.expense.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#9A9284', fontFamily: ui, padding: '18px 8px' }}>No activity in this period.</div>
                      ) : plCmp ? (() => {
                        // ── Comparison table ──────────────────────────────────
                        const dCol = d => Math.round(d) === 0 ? '#9A9284' : d > 0 ? '#1C7A4E' : '#b0483a'
                        const dStr = d => Math.round(Math.abs(d)) === 0 ? '—' : (d > 0 ? '+' : '−') + fmt(d)
                        const cNum = { padding: '6px 10px', fontSize: '12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: ui }
                        const cHead = { padding: '7px 10px', fontSize: '9px', color: '#9A9284', fontWeight: 600, letterSpacing: '0.06em', textAlign: 'right', borderBottom: '1px solid #DBD5C7', fontFamily: ui }
                        const rowsOf = (sec, sign) => {
                          const seen = new Set(), out = []
                          ;[...plView.g[sec], ...plCmp.g[sec]].forEach(r => { if (!seen.has(r.label)) { seen.add(r.label); out.push(r.label) } })
                          const val = (view, l) => { const f = view.g[sec].find(r => r.label === l); return sign * (f ? f.amount : 0) }
                          return out.map(l => ({ label: l, a: val(plView, l), b: val(plCmp, l) }))
                        }
                        const SEC = [
                          { head: 'INCOME', sec: 'income', sign: 1, tLabel: 'Total Income', tA: plView.inc, tB: plCmp.inc, account: l => l },
                          { head: 'COST OF GOODS SOLD', sec: 'cogs', sign: -1, tLabel: 'Gross Profit', tA: plView.gross, tB: plCmp.gross, accent: true, account: () => 'Cost of Goods Sold' },
                          { head: 'OPERATING EXPENSES', sec: 'expense', sign: -1, tLabel: 'Total Operating Expenses', tA: -plView.exp, tB: -plCmp.exp, account: l => l },
                          ...((plView.g.other_expense.length || plCmp.g.other_expense.length) ? [{ head: 'OTHER EXPENSES', sec: 'other_expense', sign: -1, tLabel: 'Total Other Expenses', tA: -plView.oth, tB: -plCmp.oth, account: l => l }] : []),
                        ]
                        return (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
                            <thead>
                              <tr>
                                <th style={{ ...cHead, textAlign: 'left' }}></th>
                                <th style={cHead}>{MONTHS[plPeriod.slice(5, 7)]}&nbsp;{plPeriod.slice(0, 4)}</th>
                                <th style={cHead}>{MONTHS[comparePeriod.slice(5, 7)]}&nbsp;{comparePeriod.slice(0, 4)}</th>
                                <th style={cHead}>Change</th>
                              </tr>
                            </thead>
                            <tbody>
                              {SEC.map(S => (
                                <React.Fragment key={S.sec}>
                                  <tr><td colSpan={4} style={{ fontSize: '9px', color: '#9A9284', letterSpacing: '0.14em', fontWeight: 700, padding: '14px 10px 3px', fontFamily: ui }}>{S.head}</td></tr>
                                  {rowsOf(S.sec, S.sign).map(r => (
                                    <tr key={r.label} onClick={() => setDrillAccount(S.account(r.label))}
                                      onMouseEnter={e => e.currentTarget.style.background = '#ECE8DF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                      style={{ cursor: 'pointer' }}>
                                      <td style={{ padding: '6px 10px 6px 24px', fontSize: '12px', color: '#4A453C', fontFamily: ui }}>{r.label}</td>
                                      <td style={{ ...cNum, color: r.a >= 0 ? '#1B1815' : '#b0483a' }}>{paren(r.a)}</td>
                                      <td style={{ ...cNum, color: '#8a8378' }}>{paren(r.b)}</td>
                                      <td style={{ ...cNum, color: dCol(r.a - r.b), fontWeight: 500 }}>{dStr(r.a - r.b)}</td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#1B1815', fontFamily: ui, borderTop: '1px solid #DBD5C7' }}>{S.tLabel}</td>
                                    <td style={{ ...cNum, fontWeight: 700, borderTop: '1px solid #DBD5C7', color: S.accent ? '#1C7A4E' : (S.tA >= 0 ? '#1B1815' : '#b0483a') }}>{paren(S.tA)}</td>
                                    <td style={{ ...cNum, fontWeight: 700, borderTop: '1px solid #DBD5C7', color: '#6b6355' }}>{paren(S.tB)}</td>
                                    <td style={{ ...cNum, fontWeight: 700, borderTop: '1px solid #DBD5C7', color: dCol(S.tA - S.tB) }}>{dStr(S.tA - S.tB)}</td>
                                  </tr>
                                </React.Fragment>
                              ))}
                              {/* Net income */}
                              <tr>
                                <td style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: '#1C7A4E', fontFamily: ui, borderTop: '2px solid #DBD5C7' }}>NET INCOME</td>
                                <td style={{ ...cNum, fontSize: '15px', fontWeight: 700, color: plView.net >= 0 ? '#1C7A4E' : '#991b1b', borderTop: '2px solid #DBD5C7' }}>{paren(plView.net)}</td>
                                <td style={{ ...cNum, fontSize: '13px', fontWeight: 700, color: '#6b6355', borderTop: '2px solid #DBD5C7' }}>{paren(plCmp.net)}</td>
                                <td style={{ ...cNum, fontSize: '13px', fontWeight: 700, color: dCol(plView.net - plCmp.net), borderTop: '2px solid #DBD5C7' }}>{dStr(plView.net - plCmp.net)}</td>
                              </tr>
                            </tbody>
                          </table>
                        )
                      })() : (
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '14px 12px', background: plView.net >= 0 ? '#EEF3EE' : '#fef2f2', border: `1px solid ${plView.net >= 0 ? '#C6DECB' : '#fecaca'}`, borderRadius: '0' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: plView.net >= 0 ? '#1C7A4E' : '#991b1b', fontFamily: ui }}>NET INCOME</span>
                            <span style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                              {plView.inc > 0 && <span style={{ fontSize: '11px', color: '#6b6355', fontFamily: ui }}>{pct(plView.net / plView.inc * 100)} margin</span>}
                              <span style={{ fontSize: '21px', fontWeight: 700, color: plView.net >= 0 ? '#1C7A4E' : '#991b1b', fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt(plView.net)}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Cash Flow Tab — direct method from cash-account activity */}
                {activeTab === 'cashflow' && (() => {
                  if (!cashRows.length) return <div style={{ color: '#9A9284', fontFamily: ui, fontSize: '12px' }}>No cash data yet — import a General Ledger.</div>
                  const headF = "'Barlow Semi Condensed', sans-serif", monoF = "'IBM Plex Mono', monospace"
                  const cashSet = new Set(CASH_ACCTS)
                  const acctCat = {}
                  bs.forEach(r => { acctCat[r.account] = r.category })
                  Object.entries(plLabelCat).forEach(([k, v]) => { acctCat[k] = v })
                  const sectionOf = (sp) => {
                    if (cashSet.has(sp)) return 'transfer'
                    const s = sp || ''
                    if (!s) return 'operating'
                    const parent = s.split(':')[0]
                    if (/Accounts Payable|Clover Tax|Clover Gratuity/.test(parent)) return 'operating'
                    const cat = acctCat[parent] || acctCat[s]
                    if (cat === 'equity' || cat === 'liability') return 'financing'
                    if (cat === 'asset') return 'investing'
                    return 'operating'
                  }
                  const labelOf = (sp) => { const s = sp || ''; return s ? s.split(':')[0] : 'Cash sales & deposits' }
                  const beginCash = cfPeriod === 'all' ? 0 : cashRows.filter(r => r.date && r.date.slice(0, 7) < cfPeriod).reduce((s, r) => s + Number(r.amount), 0)
                  const periodRows = cashRows.filter(r => cfPeriod === 'all' ? true : (r.date && r.date.slice(0, 7) === cfPeriod))
                  const secs = { operating: {}, investing: {}, financing: {}, transfer: {} }
                  periodRows.forEach(r => { const se = sectionOf(r.split_account); const l = labelOf(r.split_account); secs[se][l] = (secs[se][l] || 0) + Number(r.amount) })
                  const lines = (se) => Object.entries(secs[se]).map(([l, v]) => ({ label: l, amt: v })).filter(x => Math.round(x.amt) !== 0).sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt))
                  const tot = (se) => Object.values(secs[se]).reduce((s, v) => s + v, 0)
                  const opT = tot('operating'), invT = tot('investing'), finT = tot('financing'), trT = tot('transfer')
                  const netChange = opT + invT + finT + trT
                  const endCash = beginCash + netChange
                  const cfMonths = [...new Set(cashRows.filter(r => r.date).map(r => r.date.slice(0, 7)))].sort()

                  return (
                    <>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#a39a88', letterSpacing: '0.14em', marginRight: '2px', fontFamily: ui, fontWeight: 600 }}>PERIOD</span>
                        {[{ k: 'all', l: 'All time' }, ...cfMonths.map(k => ({ k, l: MONTHS[k.slice(5, 7)] }))].map(o => (
                          <button key={o.k} onClick={() => setCfPeriod(o.k)} style={pill(cfPeriod === o.k)}>{o.l}</button>
                        ))}
                      </div>

                      <div style={{ ...card, maxWidth: '660px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #DBD5C7', paddingBottom: '12px', marginBottom: '4px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B1815', fontFamily: headF, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Statement of Cash Flows</div>
                            <div style={{ fontSize: '10px', color: '#a39a88', marginTop: '2px', fontFamily: ui }}>Reydel Tire &amp; Auto · actual cash in &amp; out</div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b6355', fontFamily: ui, fontWeight: 500 }}>{cfPeriod === 'all' ? 'All time' : monthLabel(cfPeriod)}</div>
                        </div>

                        <SectionHead>OPERATING ACTIVITIES</SectionHead>
                        {lines('operating').map(r => <LineItem key={r.label} label={r.label} amount={r.amt} />)}
                        <TotalRow label="Net cash from operations" amount={opT} accent={opT >= 0} />

                        {lines('investing').length > 0 && (
                          <>
                            <SectionHead>INVESTING ACTIVITIES</SectionHead>
                            {lines('investing').map(r => <LineItem key={r.label} label={r.label} amount={r.amt} />)}
                            <TotalRow label="Net cash from investing" amount={invT} />
                          </>
                        )}

                        <SectionHead>FINANCING ACTIVITIES</SectionHead>
                        {lines('financing').map(r => <LineItem key={r.label} label={r.label} amount={r.amt} />)}
                        <TotalRow label="Net cash from financing" amount={finT} />

                        {Math.round(trT) !== 0 && <TotalRow label="Transfers between accounts" amount={trT} />}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '14px 12px', background: netChange >= 0 ? '#EEF3EE' : '#FBF0EE', border: `1px solid ${netChange >= 0 ? '#C6DECB' : '#E8C6C0'}` }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: netChange >= 0 ? '#1C7A4E' : THEME.accent, fontFamily: headF, textTransform: 'uppercase' }}>Net change in cash</span>
                          <span style={{ fontSize: '21px', fontWeight: 700, color: netChange >= 0 ? '#1C7A4E' : THEME.accent, fontFamily: monoF, fontVariantNumeric: 'tabular-nums' }}>{netChange < 0 ? `(${fmt(netChange)})` : fmt(netChange)}</span>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 2px', fontFamily: ui, fontSize: '12px', color: '#6b6355' }}><span>Cash at start of period</span><span style={{ fontFamily: monoF }}>{fmt(beginCash)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 2px', fontFamily: ui, fontSize: '12.5px', color: '#1B1815', fontWeight: 600, borderTop: '1px solid #E6E1D6' }}><span>Cash at end of period</span><span style={{ fontFamily: monoF }}>{fmt(endCash)}</span></div>
                        </div>
                        <div style={{ fontSize: '9px', color: '#a39a88', fontFamily: ui, marginTop: '10px' }}>
                          Direct method — every bank/cash movement, grouped by purpose. Ties to the cash on the Balance Sheet.
                        </div>
                      </div>
                    </>
                  )
                })()}

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
                          onMouseEnter={e => e.currentTarget.style.background = '#ECE7DD'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', color: '#9A9284', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>▶</span>
                            <span style={{ fontSize: '10px', color: '#6b6355', letterSpacing: '0.14em', fontWeight: 700, fontFamily: ui }}>{title}</span>
                            <span style={{ fontSize: '9px', color: '#b8ae9a', fontFamily: ui }}>{rows.length} account{rows.length === 1 ? '' : 's'}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: total >= 0 ? '#1B1815' : THEME.accent, fontFamily: ui, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
                        </div>
                        {open && (
                          <div style={{ borderTop: '1px solid #DBD5C7', padding: '6px 8px 10px' }}>
                            {rows.map(r => (
                              <div key={r.account} onClick={r.account !== 'Net Income' ? () => setDrillAccount(r.account) : undefined}
                                onMouseEnter={e => e.currentTarget.style.background = '#ECE8DF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '0', cursor: r.account !== 'Net Income' ? 'pointer' : 'default', fontFamily: ui }}>
                                <span style={{ fontSize: '12px', color: r.account === 'Net Income' ? '#1C7A4E' : '#4A453C', paddingLeft: '18px' }}>{r.account}</span>
                                <span style={{ fontSize: '12px', color: r.amount >= 0 ? '#1B1815' : THEME.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.amount)}</span>
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
                      <div style={{ background: balanced ? '#EEF3EE' : '#fef2f2', border: `1px solid ${balanced ? '#C6DECB' : '#fecaca'}`, borderRadius: '0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: balanced ? '#1C7A4E' : '#991b1b', fontWeight: '700', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
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
                  <div style={{ background: '#fff', border: '1px solid #DBD5C7', borderRadius: '0', boxShadow: 'none', padding: '16px' }}>
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
                          const drillable = plMonths.includes(m.key)
                          return (
                            <tr key={i}
                              onClick={drillable ? () => { setCompareOn(false); setPlPeriod(m.key); setActiveTab('pl') } : undefined}
                              onMouseEnter={e => e.currentTarget.style.background = '#ECE8DF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              style={{ opacity: partial ? 0.6 : 1, cursor: drillable ? 'pointer' : 'default' }}>
                              <td style={cell('left', { color: '#1B1815', fontWeight: '600' })}>
                                {m.label}
                                {partial && <span style={{ marginLeft: '6px', fontSize: '8px', color: '#9A9284', letterSpacing: '0.06em' }}>· IN PROGRESS</span>}
                                {drillable && !partial && <span style={{ marginLeft: '6px', fontSize: '9px', color: THEME.accent }}>→</span>}
                              </td>
                              <td style={cell('right')}>{fmt(m.revenue)}</td>
                              <td style={cell('right', { color: THEME.accent })}>{fmt(m.cogs)}</td>
                              <td style={cell('right', { color: '#1C7A4E' })}>{fmt(m.revenue - m.cogs)}</td>
                              <td style={cell('right', { color: '#1C7A4E', fontWeight: '600' })}>{fmt(m.profit)}</td>
                              <td style={cell('right')}>
                                {partial ? <span style={{ fontSize: '9px', color: '#9A9284' }}>—</span> : (
                                  <span style={{ background: '#DDEBE0', color: '#1C7A4E', padding: '1px 6px', borderRadius: '0', fontSize: '9px' }}>
                                    {m.revenue > 0 ? pct(m.profit / m.revenue * 100) : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        <tr>
                          {[
                            { v: 'TOTAL',                                    a: 'left',  c: '#1B1815', w: '700' },
                            { v: fmt(totals.revenue),                        a: 'right', c: '#1B1815', w: '700' },
                            { v: fmt(totals.cogs),                           a: 'right', c: THEME.accent, w: '700' },
                            { v: fmt(totals.revenue - totals.cogs),          a: 'right', c: '#1C7A4E', w: '700' },
                            { v: fmt(totals.profit),                         a: 'right', c: '#1C7A4E', w: '700' },
                            { v: pct(totals.profit / totals.revenue * 100),  a: 'right', c: '#1C7A4E', w: '700' },
                          ].map((col, i) => (
                            <td key={i} style={{ padding: '9px 10px', borderTop: '2px solid #DBD5C7', background: '#ECE7DD', color: col.c, fontSize: '11px', fontWeight: col.w, fontFamily: 'Inter, sans-serif', textAlign: col.a }}>{col.v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}


                {/* Accounts Tab — balances grouped by type, collapsible */}
                {activeTab === 'accounts' && (() => {
                  if (!accounts.length) return <div style={{ color: '#9A9284', fontFamily: ui, fontSize: '12px' }}>No account data yet — import a General Ledger.</div>
                  // Net Income (current-year earnings) is a balance-sheet equity line, not a
                  // real GL account — fold it into Equity so this view ties to the Balance Sheet.
                  const netIncome = (bs.find(r => r.account === 'Net Income')?.amount) ??
                    (accounts.filter(a => a.category === 'income').reduce((s, a) => s + a.total, 0) -
                     accounts.filter(a => a.category === 'expense').reduce((s, a) => s + a.total, 0))
                  const build = (defs) => defs.map(g => {
                    let rows = accounts.filter(a => a.category === g.cat).sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
                    if (g.cat === 'equity') rows = [...rows, { name: 'Net Income (current year)', total: netIncome, txns: null, synthetic: true }]
                    return { ...g, rows, total: rows.reduce((s, a) => s + a.total, 0) }
                  }).filter(g => g.rows.length)
                  const bsGroups = build([{ cat: 'asset', label: 'ASSETS' }, { cat: 'liability', label: 'LIABILITIES' }, { cat: 'equity', label: 'EQUITY' }])
                  const plGroups = build([{ cat: 'income', label: 'INCOME' }, { cat: 'expense', label: 'EXPENSES' }])
                  const gTot = c => (bsGroups.find(g => g.cat === c)?.total || 0)
                  const totA = gTot('asset'), totL = gTot('liability'), totE = gTot('equity')
                  const balanced = Math.abs(totA - totL - totE) < 1

                  const GroupCard = (g) => {
                    const open = acctOpen[g.cat]
                    return (
                      <div key={g.cat} style={{ ...card, padding: '0', overflow: 'hidden' }}>
                        <div onClick={() => setAcctOpen(s => ({ ...s, [g.cat]: !s[g.cat] }))}
                          onMouseEnter={e => e.currentTarget.style.background = '#ECE7DD'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', color: '#9A9284', transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>▶</span>
                            <span style={{ fontSize: '11px', color: '#6b6355', letterSpacing: '0.1em', fontWeight: 700, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>{g.label}</span>
                            <span style={{ fontSize: '9px', color: '#b8ae9a', fontFamily: ui }}>{g.rows.length} line{g.rows.length === 1 ? '' : 's'}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: g.total >= 0 ? '#1B1815' : THEME.accent, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>{fmt(g.total)}</span>
                        </div>
                        {open && (
                          <div style={{ borderTop: '1px solid #DBD5C7', padding: '6px 8px 10px' }}>
                            {g.rows.map(a => (
                              <div key={a.name} onClick={a.synthetic ? undefined : () => setDrillAccount(a.name)}
                                onMouseEnter={e => { if (!a.synthetic) e.currentTarget.style.background = '#ECE8DF' }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', cursor: a.synthetic ? 'default' : 'pointer', fontFamily: ui }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', color: a.synthetic ? '#6b6355' : '#4A453C', fontStyle: a.synthetic ? 'italic' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                                  <div style={{ fontSize: '9px', color: '#9A9284', marginTop: '1px' }}>{a.synthetic ? 'income − expenses, year to date' : `${a.txns} txns`}</div>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: a.total >= 0 ? '#1C7A4E' : THEME.accent, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingLeft: '12px' }}>{fmt(a.total)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '660px' }}>
                      <div style={{ fontSize: '10px', color: '#9A9284', fontFamily: ui }}>
                        {accounts.length} accounts · {accountsTotalTxns.toLocaleString()} transactions · click any account to see its ledger
                      </div>
                      {bsGroups.map(GroupCard)}
                      {/* Balance-sheet identity check */}
                      <div style={{ background: balanced ? '#EEF3EE' : '#FBF0EE', border: `1px solid ${balanced ? '#C6DECB' : '#E8C6C0'}`, padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: balanced ? '#1C7A4E' : THEME.accent, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>{balanced ? '✓ In balance' : '✕ Out of balance'}</span>
                        <span style={{ fontSize: '11px', color: '#6b6355', fontFamily: "'IBM Plex Mono', monospace" }}>Assets {fmt(totA)} = Liabilities + Equity {fmt(totL + totE)}</span>
                      </div>
                      {/* P&L accounts (behind Net Income) */}
                      <div style={{ fontSize: '10px', color: '#9A9284', fontFamily: ui, marginTop: '8px' }}>
                        Profit &amp; loss accounts (year to date) — these net to the <span style={{ fontStyle: 'italic' }}>Net Income</span> shown in Equity above, so they are not part of the balance-sheet total.
                      </div>
                      {plGroups.map(GroupCard)}
                    </div>
                  )
                })()}

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #E6E1D6' }}>
                      <div style={{ fontSize: '11px', color: '#333', fontFamily: 'Inter, sans-serif' }}>{k}{sub && <span style={{ color: '#aaa', marginLeft: '8px' }}>{sub}</span>}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: bad ? '#B0281C' : '#1B1815' }}>{v}</div>
                    </div>
                  )
                  const Check = ({ ok, label, detail }) => (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid #E6E1D6' }}>
                      <div style={{ fontSize: '11px', color: '#333', fontFamily: 'Inter, sans-serif' }}>
                        <span style={{ color: ok ? '#1C7A4E' : '#B0281C', marginRight: '8px' }}>{ok ? '✓' : '✕'}</span>{label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter, sans-serif' }}>{detail}</div>
                    </div>
                  )
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {(cloverStale || cloverFailed) && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0', padding: '14px 18px', fontSize: '12px', color: '#991b1b', fontFamily: 'Inter, sans-serif' }}>
                          ⚠ {cloverFailed ? 'The last Clover sync FAILED.' : 'Clover data looks stale — no successful sync in over 36 hours.'} Check the API token / cron.
                        </div>
                      )}
                      <div style={{ background: '#fff', border: '1px solid #DBD5C7', borderRadius: '0', boxShadow: 'none', padding: '16px' }}>
                        <div style={{ fontSize: '9px', color: '#888', letterSpacing: '0.15em', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>DATA FRESHNESS</div>
                        <Row k="Clover sales" v={ago(health?.cloverLastSynced)} sub={health?.cloverLastSynced ? new Date(health.cloverLastSynced).toLocaleString() : ''} bad={cloverStale} />
                        <Row k="Last Clover sync" v={health?.lastCloverSync ? (health.lastCloverSync.ok ? 'OK' : 'FAILED') : '—'} sub={health?.lastCloverSync ? ago(health.lastCloverSync.ran_at) : ''} bad={cloverFailed} />
                        <Row k="Weldon orders" v={ago(health?.weldonLastAdded)} sub={health?.weldonLastAdded ? new Date(health.weldonLastAdded).toLocaleString() : ''} />
                        <Row k="Financials" v={health?.lastImport ? ago(health.lastImport.imported_at) : '—'} sub={health?.lastImport ? `last ${health.lastImport.kind} import` : ''} />
                      </div>
                      <div style={{ background: '#fff', border: '1px solid #DBD5C7', borderRadius: '0', boxShadow: 'none', padding: '16px' }}>
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
