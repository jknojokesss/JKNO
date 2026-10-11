import { useRouter } from 'next/router'

export default function AdminShell({ user, onSignOut, children }) {
  const router = useRouter()
  const path = router.pathname

  return (
    <div className="a-hub">
      <div className="a-hub__layout">
        <aside className="a-hub__side">
          <div className="a-hub__brand">
            <div className="a-hub__brand-jk">JK<span>.</span></div>
            <div className="a-hub__brand-tag">Admin</div>
          </div>
          <nav className="a-hub__nav" aria-label="Admin">
            <button
              type="button"
              className={path === '/admin/dashboard' ? 'is-active' : ''}
              onClick={() => router.push('/admin/dashboard')}
            >
              Client portals
            </button>
            <a href="/" className="">Marketing site</a>
            <a href="/login">Client login router</a>
          </nav>
          <div className="a-hub__foot">
            {user?.email}
            <button type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </aside>
        <main className="a-hub__main">{children}</main>
      </div>
    </div>
  )
}
