import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const THEME = { bg: '#1C1A17', border: '#2C2925', accent: '#CC2222', content: '#F6F1E6' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     href: '/dashboard' },
  { id: 'financials', label: 'Financials',    href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items', href: '/inventory' },
  { id: 'orders',     label: 'Orders',        href: '/orders' },
  { id: 'stock',      label: 'Stock',         href: '/stock' },
  { id: 'ai',         label: '✦ Ask AI', href: '/ai' },
]

const mono = 'DM Mono, monospace'
const ui = "'Inter', sans-serif"

// Left-sidebar app shell — Riverside Bakery layout, Reydel colors. Wraps each
// inner page's content as `children`; replaces the old horizontal TopNav bar.
// `right` overrides the default "Live · Supabase" status slot.
export default function Shell({ active, right, children }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email)
      const { data } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle()
      setIsAdmin(!!data)
    })
  }, [])

  return (
    <div className="rdl-shell">
      <aside className="rdl-side">
        <div style={{ padding: '4px 10px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff', fontFamily: mono, boxShadow: '0 2px 8px rgba(204,34,34,.35)' }}>R</span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', fontFamily: mono }}>REYDEL</div>
              <div style={{ fontSize: '8px', color: '#8a8378', letterSpacing: '0.22em', fontFamily: mono, marginTop: '2px' }}>TIRE &amp; AUTO</div>
            </div>
          </div>
        </div>

        <nav className="rdl-nav">
          {NAV.map(item => {
            const on = active === item.id
            return (
              <button key={item.id} className="rdl-navbtn" onClick={() => router.push(item.href)}
                style={on ? { background: 'rgba(255,255,255,.08)', color: '#fff', boxShadow: `inset 3px 0 0 ${THEME.accent}` } : undefined}>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="rdl-foot">
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {isAdmin && <span style={{ fontSize: '8px', letterSpacing: '0.15em', color: '#fff', background: THEME.accent, padding: '2px 6px', borderRadius: '3px', fontFamily: mono }}>ADMIN</span>}
              <span style={{ fontSize: '10px', color: '#888', fontFamily: mono, wordBreak: 'break-all' }}>{email}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {right || (
              <>
                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                <div style={{ fontSize: '10px', color: '#888', fontFamily: mono }}>Live · Supabase</div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="rdl-main">{children}</main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .rdl-shell { display: flex; min-height: 100vh; align-items: stretch; background: ${THEME.content}; }
        .rdl-side { width: 214px; flex-shrink: 0; background: linear-gradient(180deg, #201D19 0%, #17150F 100%); border-right: 1px solid ${THEME.border}; display: flex; flex-direction: column; padding: 20px 12px; position: sticky; top: 0; height: 100vh; }
        .rdl-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
        .rdl-navbtn { display: block; width: 100%; text-align: left; padding: 9px 12px; border-radius: 8px; border: none; background: transparent; color: #8a8378; font-family: ${ui}; font-size: 12.5px; font-weight: 500; letter-spacing: 0.01em; cursor: pointer; white-space: nowrap; transition: background .15s, color .15s; }
        .rdl-navbtn:hover { background: rgba(255,255,255,.06); color: #efe9dd; }
        .rdl-foot { padding: 12px 8px 0; border-top: 1px solid ${THEME.border}; margin-top: 8px; }
        .rdl-main { flex: 1; min-width: 0; background: ${THEME.content}; font-variant-numeric: tabular-nums; }
        @media (max-width: 860px) {
          .rdl-shell { flex-direction: column; }
          .rdl-side { width: auto; height: auto; position: static; flex-direction: column; padding: 12px; }
          .rdl-nav { flex-direction: row; overflow-x: auto; gap: 4px; padding-bottom: 4px; }
          .rdl-navbtn { width: auto; padding: 8px 13px; border-radius: 16px; background: rgba(255,255,255,.06); }
          .rdl-foot { display: none; }
        }
      `}</style>
    </div>
  )
}
