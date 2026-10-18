import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../../../lib/demoEmbed'
import { DEMO_LOBBY_FONT_LINK } from '../../../lib/demoFonts'

/** Prospect sample top bar: JK brand + Home only (no samples gallery link). */
export default function PopinsanityLobby() {
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
        <link href={DEMO_LOBBY_FONT_LINK} rel="stylesheet" />
      </Head>
      <nav className="m-sample-lobby" aria-label="Leave sample">
        <div className="m-sample-lobby__inner">
          <Link href="/" className="m-sample-lobby__brand">
            <span className="m-sample-lobby__jk">
              JK<span className="m-sample-lobby__dot">.</span>
            </span>
            <span className="m-sample-lobby__co">No Jokes Financials</span>
          </Link>
          <div className="m-sample-lobby__nav">
            <Link href="/" className="m-sample-lobby__home">
              Home
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
