import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../../../lib/demoEmbed'

const LOBBY_FONT =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap'

const LOBBY_CSS = `
.md-lobby{position:sticky;top:0;z-index:20;background:#f2f0ea;border-bottom:1px solid rgba(27,24,21,.08);font-family:'Inter',system-ui,sans-serif}
.md-lobby__inner{max-width:1200px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.md-lobby__brand{display:inline-flex;align-items:baseline;gap:8px;text-decoration:none;color:#1b1815;min-width:0}
.md-lobby__jk{font-family:'Playfair Display',Georgia,serif;font-size:1.125rem;font-weight:700;letter-spacing:-.02em;line-height:1}
.md-lobby__dot{color:#c9a84c}
.md-lobby__co{font-size:.7rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6b6560;white-space:nowrap}
.md-lobby__home{font-size:.875rem;font-weight:500;color:#6b6560;text-decoration:none;-webkit-font-smoothing:antialiased}
.md-lobby__home:hover{text-decoration:underline}
`

/** Top bar for /mr-dipz only: JK brand + Home (no gallery link). */
export default function MrDipzLobby() {
  const router = useRouter()
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={LOBBY_FONT} rel="stylesheet" />
      </Head>
      <style>{LOBBY_CSS}</style>
      <nav className="md-lobby" aria-label="Leave sample">
        <div className="md-lobby__inner">
          <Link href="/" className="md-lobby__brand">
            <span className="md-lobby__jk">
              JK<span className="md-lobby__dot">.</span>
            </span>
            <span className="md-lobby__co">No Jokes Financials</span>
          </Link>
          <Link href="/" className="md-lobby__home">
            Home
          </Link>
        </div>
      </nav>
    </>
  )
}
