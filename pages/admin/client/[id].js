import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))

const ACCOUNT_TYPES = ['income', 'expense', 'asset', 'liability', 'equity']

export default function AdminClientView() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEntry, setShowEntry] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [entry, setEntry] = useState({ date: '', description: '', amount: '', type: 'income', category: '' })
  const [saving, setSaving] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvMsg, setCsvMsg] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
      if (!adminData) { router.push('/admin'); return }
      setUser(session.user)
      loadClient()
    })
  }, [id])

  const loadClient = async () => {
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single()
    setClient(clientData || { name: 'Reydel Tire', email: 'reydel@reydeltire.com', id })
    const { data: txData } = await supabase.from('transactions').select('*').eq('client_id', id).order('date', { ascending: false })
    setTransactions(txData || [])
    setLoading(false)
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/admin') }

  const handleAddEntry = async () => {
    if (!entry.date || !entry.description || !entry.amount) return
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      client_id: id,
      date: entry.date,
      description: entry.description,
      amount: parseFloat(entry.amount),
      type: entry.type,
      category: entry.category,
      source: 'manual',
    })
    if (!error) {
      setEntry({ date: '', description: '', amount: '', type: 'income', category: '' })
      loadClient()
      setShowEntry(false)
    }
    setSaving(false)
  }

  const handleCSVImport = async () => {
    if (!csvText.trim()) return
    setSaving(true)
    setCsvMsg('')
    const lines = csvText.trim().split('\n')
    const rows = lines.slice(1) // skip header
    let imported = 0
    let errors = 0

    for (const row of rows) {
      const cols = row.split(',').map(c => c.trim().replace(/"/g, ''))
      if (cols.length < 3) continue
      const [date, description, amountRaw, type, category] = cols
      const amount = parseFloat(amountRaw?.replace(/[$,]/g, ''))
      if (!date || !description || isNaN(amount)) { errors++; continue }
      const { error } = await supabase.from('transactions').insert({
        client_id: id, date, description, amount: Math.abs(amount),
        type: type || (amount >= 0 ? 'income' : 'expense'),
        category: category || '',
        source: 'csv',
      })
      if (!error) imported++; else errors++
    }

    setCsvMsg(`✓ Imported ${imported} transactions${errors > 0 ? `. ${errors} rows skipped.` : '.'}`)
    loadClient()
    setSaving(false)
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const netProfit = totalIncome - totalExpenses

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '3px', color: '#C9A84C' }}>LOADING...</div>
    </div>
  )

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#1E2540',
    border: '1px solid #2E3A5C', borderRadius: '2px', fontSize: '13px',
    color: '#EAE8E4', outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box' }

  const labelStyle = { display: 'block', fontFamily: 'monospace', fontSize: '10px',
    letterSpacing: '2px', color: '#6B7A96', marginBottom: '6px' }

  return (
    <>
      <Head><title>{client?.name} — Admin</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0D1120' }}>

        {/* Sidebar */}
        <div style={{ width: '200px', background: '#080E1A', borderRight: '1px solid #1E2540',
          display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E2540' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700',
              color: '#EAE8E4' }}>JK<span style={{ color: '#C9A84C' }}>.</span></div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '3px',
              color: '#C9A84C', marginTop: '4px' }}>ADMIN</div>
          </div>
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <button onClick={() => router.push('/admin/dashboard')}
              style={{ background: 'none', border: 'none', color: '#4A5568', fontSize: '12px',
                fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer', padding: '0',
                marginBottom: '20px', display: 'block' }}>
              ← ALL CLIENTS
            </button>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px',
              color: '#EAE8E4', marginBottom: '4px' }}>{client?.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4A5568' }}>
              {client?.email}
            </div>
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid #1E2540' }}>
            <button onClick={handleSignOut} style={{ width: '100%', padding: '7px',
              background: 'transparent', border: '1px solid #1E2540', borderRadius: '2px',
              color: '#4A5568', fontSize: '10px', fontFamily: 'monospace',
              letterSpacing: '1px', cursor: 'pointer' }}>SIGN OUT</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: '200px', flex: 1, padding: '36px 40px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px',
                color: '#C9A84C', marginBottom: '6px' }}>CLIENT VIEW</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px',
                fontWeight: '600', color: '#EAE8E4', margin: 0 }}>{client?.name}</h1>
              <p style={{ color: '#4A5568', fontSize: '12px', margin: '4px 0 0',
                fontFamily: 'monospace' }}>{transactions.length} transactions on record</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowCSV(true)}
                style={{ padding: '10px 18px', background: 'transparent',
                  border: '1px solid #C9A84C', borderRadius: '2px', color: '#C9A84C',
                  fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer' }}>
                IMPORT CSV
              </button>
              <button onClick={() => setShowEntry(true)}
                style={{ padding: '10px 18px', background: '#C9A84C', color: '#0D1120',
                  border: 'none', borderRadius: '2px', fontSize: '11px',
                  fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer',
                  fontWeight: '600' }}>
                + ADD ENTRY
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'TOTAL INCOME', value: fmt(totalIncome), color: '#2D6A4F' },
              { label: 'TOTAL EXPENSES', value: fmt(totalExpenses), color: '#CC2222' },
              { label: 'NET PROFIT', value: fmt(netProfit), color: netProfit >= 0 ? '#2D6A4F' : '#CC2222' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#161D30', border: '1px solid #1E2540',
                borderRadius: '4px', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px',
                  color: '#4A5568', marginBottom: '8px' }}>{k.label}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px',
                  fontWeight: '600', color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Transactions table */}
          <div style={{ background: '#161D30', border: '1px solid #1E2540', borderRadius: '4px',
            overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1E2540',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '2px',
                color: '#C9A84C' }}>TRANSACTION LEDGER</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4A5568' }}>
                {transactions.length} entries
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2E3A5C',
                  marginBottom: '8px' }}>No transactions yet</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1E2540' }}>
                  Add entries manually or import a CSV
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0D1120' }}>
                      {['DATE', 'DESCRIPTION', 'CATEGORY', 'TYPE', 'AMOUNT'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left',
                          fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px',
                          color: '#4A5568', fontWeight: '500', borderBottom: '1px solid #1E2540' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={tx.id || i} style={{ borderBottom: '1px solid #0D1120' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1E2540'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace',
                          fontSize: '11px', color: '#6B7A96' }}>{tx.date}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#EAE8E4' }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace',
                          fontSize: '10px', color: '#6B7A96' }}>{tx.category || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px',
                            letterSpacing: '1px', padding: '2px 8px', borderRadius: '2px',
                            background: tx.type === 'income' ? 'rgba(45,106,79,0.2)' : 'rgba(204,34,34,0.2)',
                            color: tx.type === 'income' ? '#74C69D' : '#F1948A' }}>
                            {tx.type?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace',
                          fontSize: '13px', fontWeight: '500',
                          color: tx.type === 'income' ? '#74C69D' : '#F1948A',
                          textAlign: 'right' }}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowEntry(false) }}>
          <div style={{ background: '#161D30', border: '1px solid #2E3A5C', borderRadius: '4px',
            padding: '36px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px',
              color: '#C9A84C', marginBottom: '8px' }}>MANUAL ENTRY</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#EAE8E4',
              margin: '0 0 24px', fontWeight: '600' }}>Add Transaction</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>DATE</label>
                <input type="date" value={entry.date}
                  onChange={e => setEntry({ ...entry, date: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
              </div>
              <div>
                <label style={labelStyle}>TYPE</label>
                <select value={entry.type} onChange={e => setEntry({ ...entry, type: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>DESCRIPTION</label>
              <input type="text" placeholder="e.g. Tire sale — Michelin set of 4"
                value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>AMOUNT ($)</label>
                <input type="number" placeholder="0.00" value={entry.amount}
                  onChange={e => setEntry({ ...entry, amount: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
              </div>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <input type="text" placeholder="e.g. Tire Sales"
                  value={entry.category} onChange={e => setEntry({ ...entry, category: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowEntry(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent',
                  border: '1px solid #2E3A5C', borderRadius: '2px', color: '#6B7A96',
                  fontSize: '12px', fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={handleAddEntry}
                disabled={saving || !entry.date || !entry.description || !entry.amount}
                style={{ flex: 2, padding: '12px',
                  background: saving || !entry.date || !entry.description || !entry.amount ? '#1E2540' : '#C9A84C',
                  color: saving || !entry.date || !entry.description || !entry.amount ? '#4A5568' : '#0D1120',
                  border: 'none', borderRadius: '2px', fontSize: '12px',
                  fontFamily: 'monospace', letterSpacing: '2px', cursor: 'pointer', fontWeight: '600' }}>
                {saving ? 'SAVING...' : 'SAVE ENTRY →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSV && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCSV(false) }}>
          <div style={{ background: '#161D30', border: '1px solid #2E3A5C', borderRadius: '4px',
            padding: '36px', width: '100%', maxWidth: '560px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px',
              color: '#C9A84C', marginBottom: '8px' }}>CSV IMPORT</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#EAE8E4',
              margin: '0 0 8px', fontWeight: '600' }}>Import Transactions</h2>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4A5568',
              marginBottom: '20px', lineHeight: 1.6 }}>
              Paste CSV data below. Expected format:<br/>
              <span style={{ color: '#6B7A96' }}>date, description, amount, type, category</span><br/>
              <span style={{ color: '#C9A84C' }}>2025-06-01, Tire sale, 450, income, Tire Sales</span>
            </p>

            <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
              placeholder={'date,description,amount,type,category\n2025-06-01,Tire sale - Michelin,450,income,Tire Sales\n2025-06-02,Inventory purchase,1200,expense,Inventory'}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: '12px',
                fontFamily: 'monospace' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#2E3A5C'} />

            {csvMsg && (
              <div style={{ margin: '12px 0', padding: '10px 14px',
                background: 'rgba(45,106,79,0.15)', border: '1px solid rgba(45,106,79,0.4)',
                borderRadius: '2px', fontSize: '13px', color: '#74C69D', fontFamily: 'monospace' }}>
                {csvMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => { setShowCSV(false); setCsvText(''); setCsvMsg('') }}
                style={{ flex: 1, padding: '12px', background: 'transparent',
                  border: '1px solid #2E3A5C', borderRadius: '2px', color: '#6B7A96',
                  fontSize: '12px', fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={handleCSVImport} disabled={saving || !csvText.trim()}
                style={{ flex: 2, padding: '12px',
                  background: saving || !csvText.trim() ? '#1E2540' : '#C9A84C',
                  color: saving || !csvText.trim() ? '#4A5568' : '#0D1120',
                  border: 'none', borderRadius: '2px', fontSize: '12px',
                  fontFamily: 'monospace', letterSpacing: '2px', cursor: 'pointer', fontWeight: '600' }}>
                {saving ? 'IMPORTING...' : 'IMPORT →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
