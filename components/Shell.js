import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const THEME = { side: '#1E1C19', border: '#33302B', accent: '#B0281C', content: '#F2F0EA' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     href: '/dashboard' },
  { id: 'financials', label: 'Financials',    href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items', href: '/inventory' },
  { id: 'orders',     label: 'Orders',        href: '/orders' },
  { id: 'stock',      label: 'Stock',         href: '/stock' },
  { id: 'ai',         label: 'Ask',           href: '/ai' },
]

const head = "'Barlow Semi Condensed', sans-serif"
const mono = "'IBM Plex Mono', monospace"

// Left-sidebar app shell — graphite spine, warm-paper canvas. Wraps each inner
// page's content as `children`. `right` overrides the default status slot.
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
        <div style={{ padding: '2px 8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '32px', height: '32px', background: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', fontWeight: 700, color: '#fff', fontFamily: head }}>R</span>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', fontFamily: head }}>REYDEL</div>
              <div style={{ fontSize: '9px', color: '#7C766B', letterSpacing: '0.3em', fontFamily: head, fontWeight: 500, marginTop: '3px' }}>TIRE &amp; AUTO</div>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: THEME.border, margin: '16px 8px' }} />

        <nav className="rdl-nav">
          {NAV.map(item => {
            const on = active === item.id
            return (
              <button key={item.id} className="rdl-navbtn" onClick={() => router.push(item.href)}
                style={on ? { background: 'rgba(176,40,28,.16)', color: '#fff', boxShadow: `inset 2px 0 0 ${THEME.accent}` } : undefined}>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="rdl-foot">
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {isAdmin && <span style={{ fontSize: '8px', letterSpacing: '0.15em', color: '#fff', background: THEME.accent, padding: '2px 6px', fontFamily: mono }}>ADMIN</span>}
              <span style={{ fontSize: '10px', color: '#7C766B', fontFamily: mono, wordBreak: 'break-all' }}>{email}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {right || (
              <>
                <div style={{ width: '6px', height: '6px', background: '#2E9E6A', borderRadius: '50%' }} />
                <div style={{ fontSize: '10px', color: '#7C766B', fontFamily: mono }}>Live · Supabase</div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="rdl-main">{children}</main>

      <style>{`
        .rdl-shell { display: flex; min-height: 100vh; align-items: stretch; background: ${THEME.content}; }
        .rdl-side { width: 214px; flex-shrink: 0; background: ${THEME.side}; box-shadow: inset -3px 0 0 ${THEME.accent}; display: flex; flex-direction: column; padding: 20px 12px; position: sticky; top: 0; height: 100vh; }
        .rdl-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .rdl-navbtn { display: block; width: 100%; text-align: left; padding: 10px 11px; border: none; border-left: 2px solid transparent; background: transparent; color: #948D81; font-family: ${head}; font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; white-space: nowrap; transition: background .15s, color .15s; }
        .rdl-navbtn:hover { background: rgba(255,255,255,.05); color: #EDEBE6; }
        .rdl-foot { padding: 12px 8px 0; border-top: 1px solid ${THEME.border}; margin-top: 8px; }
        .rdl-main { flex: 1; min-width: 0; background: ${THEME.content}; font-variant-numeric: tabular-nums; }
        @media (max-width: 860px) {
          .rdl-shell { flex-direction: column; }
          .rdl-side { width: auto; height: auto; position: static; flex-direction: column; padding: 12px; box-shadow: inset 0 -3px 0 ${THEME.accent}; }
          .rdl-nav { flex-direction: row; overflow-x: auto; gap: 4px; padding-bottom: 4px; }
          .rdl-navbtn { width: auto; padding: 8px 13px; background: rgba(255,255,255,.06); border-left: none; }
          .rdl-foot { display: none; }
        }
      `}</style>
    </div>
  )
}
