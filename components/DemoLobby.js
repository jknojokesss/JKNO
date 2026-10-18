import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../lib/demoEmbed'
import { DEMO_LOBBY_FONT_LINK } from '../lib/demoFonts'

const CREDIT_CSS = `
.m-sample-credit{padding:10px 30px 4px;font-family:'Inter',system-ui,sans-serif}
.m-sample-credit a{font-size:12px;font-weight:400;color:#6b6560;text-decoration:none;-webkit-font-smoothing:antialiased}
.m-sample-credit a:hover{text-decoration:underline}
@media(max-width:860px){.m-sample-credit{padding:10px 12px 4px}}
html.demo-embed .m-sample-credit{display:none!important}
`

function SampleSiteCredit() {
  return (
    <>
      <style>{CREDIT_CSS}</style>
      <div className="m-sample-credit">
        <a href="https://jknojokes.com">JK No Jokes Financials</a>
      </div>
    </>
  )
}

/**
 * Minimal escape hatch above a sample portal (gallery lives on /demos).
 * Hidden when ?embed=1 (homepage / marketing iframe — show the app only).
 */
export default function DemoLobby({ suppress = false, hideAllSamplesLink = false, minimal = false }) {
  const router = useRouter()
  if (suppress) return null
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  if (minimal) return <SampleSiteCredit />

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
            {!hideAllSamplesLink ? (
              <Link href="/demos" className="m-sample-lobby__back">
                ← All samples
              </Link>
            ) : null}
            <Link href="/" className="m-sample-lobby__home">
              Home
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
