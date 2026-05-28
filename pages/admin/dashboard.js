import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'

const DEMO_CLIENTS = [
  { id: 'demo-1', name: 'Reydel Tire', email: 'reydel@reydeltire.com', theme: 'reydel', status: 'active', last_entry: '2025-06-28' },
]

function AdminShell({ children, user, onSignOut }) {
  const router = useRouter()
  const path = router.pathname

  const navItems = [
    { label: 'Clients', icon: '◈', href: '/admin/dashboard' },
    { label: 'Entries', icon: '≡', href: '/admin/entries' },
    { label: 'Settings', icon: '⚙', href: '/admin/settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D1120' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', background: '#080E1A', borderRight: '1px solid #1E2540',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E2540' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px',
            fontWeight: '700', color: '#EAE8E4', letterSpacing: '1px' }}>
            JK<span style={{ color: '#C9A84C' }}>.</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '3px',
            color: '#C9A84C', marginTop: '4px' }}>ADMIN</div>
        </div>

        <nav style={{ padding: '12px 0', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 20px',
                background: path === item.href ? '#1E2540' : 'transparent', border: 'none',
                borderLeft: path === item.href ? '2px solid #C9A84C' : '2px solid transparent',
                color: path === item.href ? '#EAE8E4' : '#4A5568',
                fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1E2540' }}>
          <div style={{ fontSize: '11px', color: '#4A5568', fontFamily: 'monospace',
            marginBottom: '8px', letterSpacing: '1px' }}>
            {user?.email?.split('@')[0].toUpperCase()}
          </div>
          <button onClick={onSignOut} style={{ width: '100%', padding: '7px',
            background: 'transparent', border: '1px solid #1E2540', borderRadius: '2px',
            color: '#4A5568', fontSize: '10px', fontFamily: 'monospace',
            letterSpacing: '1px', cursor: 'pointer' }}>SIGN OUT</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft: '200px', flex: 1, padding: '36px 40px' }}>
        {children}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
      if (!adminData) { router.push('/admin'); return }
      setUser(session.user)
      loadClients()
    })
  }, [])

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data?.length ? data : DEMO_CLIENTS)
    setLoading(false)
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/admin') }

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.password) return
    setSaving(true)
    setSaveMsg('')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin?.createUser({
      email: newClient.email,
      password: newClient.password,
      email_confirm: true,
    })

    // Insert into clients table
    const { error: clientError } = await supabase.from('clients').insert({
      name: newClient.name,
      email: newClient.email,
    })

    if (clientError) {
      setSaveMsg('Error creating client. Try again.')
    } else {
      setSaveMsg('Client created!')
      setNewClient({ name: '', email: '', password: '' })
      loadClients()
      setTimeout(() => { setShowNewClient(false); setSaveMsg('') }, 1500)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '3px',
        color: '#C9A84C' }}>LOADING...</div>
    </div>
  )

  return (
    <>
      <Head><title>Admin Dashboard — JK No Jokes</title></Head>
      <AdminShell user={user} onSignOut={handleSignOut}>

        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px',
              color: '#C9A84C', marginBottom: '6px' }}>ADMIN DASHBOARD</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px',
              fontWeight: '600', color: '#EAE8E4', margin: 0, letterSpacing: '-0.5px' }}>
              All Clients
            </h1>
            <p style={{ color: '#4A5568', fontSize: '13px', margin: '4px 0 0',
              fontFamily: 'monospace' }}>{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowNewClient(true)}
            style={{ padding: '12px 24px', background: '#C9A84C', color: '#0D1120',
              border: 'none', borderRadius: '2px', fontSize: '12px',
              fontFamily: 'monospace', letterSpacing: '2px', cursor: 'pointer',
              fontWeight: '600' }}>
            + NEW CLIENT
          </button>
        </div>

        {/* Client cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px' }}>
          {clients.map((client, i) => (
            <div key={client.id || i} style={{ background: '#161D30',
              border: '1px solid #1E2540', borderRadius: '4px', padding: '24px',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2540'; e.currentTarget.style.transform = 'translateY(0)' }}
              onClick={() => router.push(`/admin/client/${client.id}`)}>

              {/* Client avatar */}
              <div style={{ width: '44px', height: '44px', borderRadius: '4px',
                background: client.name?.toLowerCase().includes('tire') ? '#CC2222' : '#C9A84C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700',
                color: '#fff', marginBottom: '16px' }}>
                {client.name?.charAt(0)}
              </div>

              <div style={{ fontFamily: 'Georgia, serif', fontSize: '17px',
                fontWeight: '600', color: '#EAE8E4', marginBottom: '4px' }}>
                {client.name}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px',
                color: '#4A5568', marginBottom: '16px' }}>{client.email}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px',
                  letterSpacing: '1px', color: '#2D6A4F',
                  background: 'rgba(45,106,79,0.15)', padding: '3px 8px',
                  borderRadius: '2px' }}>
                  ACTIVE
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px',
                  color: '#C9A84C', letterSpacing: '1px' }}>
                  OPEN →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Client Modal */}
        {showNewClient && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewClient(false) }}>
            <div style={{ background: '#161D30', border: '1px solid #2E3A5C',
              borderRadius: '4px', padding: '36px', width: '100%', maxWidth: '460px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px',
                color: '#C9A84C', marginBottom: '8px' }}>NEW CLIENT</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px',
                color: '#EAE8E4', margin: '0 0 28px', fontWeight: '600' }}>
                Add a Client
              </h2>

              {[
                { label: 'BUSINESS NAME', key: 'name', type: 'text', placeholder: 'Reydel Tire' },
                { label: 'CLIENT EMAIL', key: 'email', type: 'email', placeholder: 'client@business.com' },
                { label: 'TEMP PASSWORD', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px',
                    letterSpacing: '2px', color: '#6B7A96', marginBottom: '8px' }}>
                    {field.label}
                  </label>
                  <input type={field.type} placeholder={field.placeholder}
                    value={newClient[field.key]}
                    onChange={e => setNewClient({ ...newClient, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', background: '#1E2540',
                      border: '1px solid #2E3A5C', borderRadius: '2px', fontSize: '14px',
                      color: '#EAE8E4', outline: 'none', fontFamily: 'sans-serif',
                      boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'}
                    onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
                </div>
              ))}

              {saveMsg && (
                <div style={{ marginBottom: '16px', padding: '10px 14px',
                  background: saveMsg.includes('Error') ? 'rgba(192,57,43,0.15)' : 'rgba(45,106,79,0.15)',
                  border: `1px solid ${saveMsg.includes('Error') ? 'rgba(192,57,43,0.4)' : 'rgba(45,106,79,0.4)'}`,
                  borderRadius: '2px', fontSize: '13px',
                  color: saveMsg.includes('Error') ? '#F1948A' : '#74C69D' }}>
                  {saveMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowNewClient(false)}
                  style={{ flex: 1, padding: '12px', background: 'transparent',
                    border: '1px solid #2E3A5C', borderRadius: '2px', color: '#6B7A96',
                    fontSize: '12px', fontFamily: 'monospace', letterSpacing: '1px',
                    cursor: 'pointer' }}>
                  CANCEL
                </button>
                <button onClick={handleCreateClient}
                  disabled={saving || !newClient.name || !newClient.email || !newClient.password}
                  style={{ flex: 2, padding: '12px',
                    background: saving || !newClient.name || !newClient.email || !newClient.password
                      ? '#1E2540' : '#C9A84C',
                    color: saving || !newClient.name || !newClient.email || !newClient.password
                      ? '#4A5568' : '#0D1120',
                    border: 'none', borderRadius: '2px', fontSize: '12px',
                    fontFamily: 'monospace', letterSpacing: '2px', cursor: 'pointer',
                    fontWeight: '600' }}>
                  {saving ? 'CREATING...' : 'CREATE CLIENT →'}
                </button>
              </div>
            </div>
          </div>
        )}

      </AdminShell>
    </>
  )
}
