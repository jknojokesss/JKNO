import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AdminShell from '../../components/AdminShell'
import { openClientPortal } from '../../lib/adminHub'
import { useAdminGate } from '../../lib/useAdminGate'
import { supabase } from '../../lib/supabase'

function qboBadge(qbo) {
  if (!qbo) return null
  if (qbo.status === 'connected') return { text: 'QBO ok', className: 'a-hub__badge a-hub__badge--ok' }
  if (qbo.status === 'reauth_needed') return { text: 'QBO reauth', className: 'a-hub__badge a-hub__badge--warn' }
  if (qbo.status === 'error') return { text: 'QBO error', className: 'a-hub__badge a-hub__badge--warn' }
  return { text: qbo.status || 'QBO', className: 'a-hub__badge' }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, ready, signOut } = useAdminGate(router)
  const [clients, setClients] = useState([])
  const [tools, setTools] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    ;(async () => {
      setLoadError('')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      try {
        const res = await fetch('/api/admin/hub', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('hub')
        const json = await res.json()
        if (!cancelled) {
          setClients(json.clients || [])
          setTools(json.tools || [])
        }
      } catch {
        if (!cancelled) setLoadError('Could not load client list. Refresh, or check you are still signed in as admin.')
      }
    })()
    return () => { cancelled = true }
  }, [ready])

  if (!ready) {
    return <div className="a-hub__loading">Loading…</div>
  }

  return (
    <>
      <Head>
        <title>Admin — Client portals | JK No Jokes</title>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <AdminShell user={user} onSignOut={signOut}>
        <h1 className="a-hub__h1">Client portals</h1>
        <p className="a-hub__lead">
          One click opens their live site in a new tab. Use the links underneath for sign-in or QuickBooks connect.
        </p>

        {loadError && (
          <p className="a-hub__lead" style={{ color: '#f1948a' }} role="alert">{loadError}</p>
        )}

        <p className="a-hub__section-title">Live clients</p>
        <div className="a-hub__clients">
          {clients.map((client) => {
            const badge = qboBadge(client.qbo)
            return (
              <article key={client.id} className="a-hub__card">
                <div className="a-hub__card-top">
                  <div>
                    <h2 className="a-hub__card-name">{client.name}</h2>
                    <p className="a-hub__card-sub">{client.subtitle}</p>
                  </div>
                  {badge && <span className={badge.className}>{badge.text}</span>}
                </div>
                {client.qbo?.company_name && (
                  <p className="a-hub__card-sub" style={{ margin: 0 }}>
                    {client.qbo.company_name}
                    {client.qbo.last_synced_at && (
                      <> · synced {new Date(client.qbo.last_synced_at).toLocaleDateString()}</>
                    )}
                  </p>
                )}
                <button
                  type="button"
                  className="a-hub__open"
                  onClick={() => openClientPortal(client)}
                >
                  Open portal →
                </button>
                <div className="a-hub__links">
                  <a href={client.loginUrl} target={client.sameTab ? undefined : '_blank'} rel="noopener noreferrer">
                    Sign-in page
                  </a>
                  {client.slug && (
                    <a href={`/api/qbo/connect?client=${encodeURIComponent(client.slug)}`}>
                      Connect QBO
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <p className="a-hub__section-title">JK tools</p>
        <div className="a-hub__tools">
          {tools.map((tool) => (
            <a key={tool.id} href={tool.href} className="a-hub__tool">
              <p className="a-hub__tool-name">{tool.name}</p>
              <p className="a-hub__tool-blurb">{tool.blurb}</p>
            </a>
          ))}
        </div>
      </AdminShell>
    </>
  )
}
