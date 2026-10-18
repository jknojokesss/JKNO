import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../../../lib/demoEmbed'

const LOBBY_FONT =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap'

/**
 * Closeout-only lobby bar: JK wordmark + Home (no gallery / other-sample links).
 */
export default function CloseoutExplosionLobby() {
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
      <nav className="ce-lobby" aria-label="Leave sample">
        <div className="ce-lobby__inner">
          <Link href="/" className="ce-lobby__brand">
            <span className="ce-lobby__jk">
              JK<span className="ce-lobby__dot">.</span>
            </span>
            <span className="ce-lobby__co">No Jokes Financials</span>
          </Link>
          <div className="ce-lobby__nav">
            <Link href="/" className="ce-lobby__home">
              Home
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
