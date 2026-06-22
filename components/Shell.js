import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const THEME = { bg: '#1A1A1A', border: '#2A2A2A', accent: '#CC2222', content: '#F8F8F8' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     href: '/dashboard' },
  { id: 'financials', label: 'Financials',    href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items', href: '/inventory' },
  { id: 'orders',     label: 'Orders',        href: '/orders' },
  { id: 'stock',      label: 'Stock',         href: '/stock' },
  { id: 'accounts',   label: 'Accounts',      href: '/accounts' },
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '4px 10px 18px' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '0.1em', fontFamily: mono }}>REYDEL</span>
          <span style={{ fontSize: '9px', color: THEME.accent, letterSpacing: '0.2em', fontFamily: mono }}>TIRE &amp; AUTO</span>
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
        .rdl-side { width: 210px; flex-shrink: 0; background: ${THEME.bg}; border-right: 1px solid ${THEME.border}; display: flex; flex-direction: column; padding: 18px 12px; position: sticky; top: 0; height: 100vh; }
        .rdl-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .rdl-navbtn { display: block; width: 100%; text-align: left; padding: 9px 12px; border-radius: 7px; border: none; background: transparent; color: #888; font-family: ${ui}; font-size: 12.5px; font-weight: 500; letter-spacing: 0.01em; cursor: pointer; white-space: nowrap; transition: background .15s, color .15s; }
        .rdl-navbtn:hover { background: rgba(255,255,255,.05); color: #ccc; }
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
