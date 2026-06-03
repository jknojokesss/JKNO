import { useRouter } from 'next/router'

const THEME = { bg: '#1A1A1A', border: '#2A2A2A', accent: '#CC2222' }

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',     href: '/dashboard' },
  { id: 'financials', label: 'Financials',    href: '/financials' },
  { id: 'inventory',  label: 'Sales & Items', href: '/inventory' },
  { id: 'orders',     label: 'Orders',        href: '/orders' },
  { id: 'stock',      label: 'Stock',         href: '/stock' },
  { id: 'accounts',   label: 'Accounts',      href: '/accounts' },
  { id: 'ai',         label: '✦ Ask AI',      href: '/ai' },
]

// Shared horizontal nav bar — replaces the old per-page sidebar + topbar on the
// inner data pages. `right` overrides the default Live · Supabase status slot;
// the flex-wrap lets the links reflow onto a second line on narrow screens.
export default function TopNav({ active, right }) {
  const router = useRouter()
  return (
    <div style={{
      background: THEME.bg, borderBottom: `1px solid ${THEME.border}`,
      padding: '0 20px', display: 'flex', alignItems: 'center', gap: '20px',
      flexWrap: 'wrap', minHeight: '52px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>REYDEL</span>
        <span style={{ fontSize: '9px', color: THEME.accent, letterSpacing: '0.2em', fontFamily: 'DM Mono, monospace' }}>TIRE & AUTO</span>
      </div>

      <nav style={{ display: 'flex', gap: '2px', flex: 1, flexWrap: 'wrap' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => router.push(item.href)} style={{
            padding: '8px 13px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: active === item.id ? '#fff' : '#888',
            fontSize: '12px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
            borderBottom: active === item.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
          }}
            onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.color = '#ccc' }}
            onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.color = '#888' }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {right || (
          <>
            <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
            <div style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace' }}>Live · Supabase</div>
          </>
        )}
      </div>
    </div>
  )
}
