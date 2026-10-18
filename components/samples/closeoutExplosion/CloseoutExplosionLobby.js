import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../../../lib/demoEmbed'

const CREDIT_CSS = `
.m-sample-credit{padding:10px 30px 4px;font-family:'Inter',system-ui,sans-serif}
.m-sample-credit a{font-size:12px;font-weight:400;color:#6b6560;text-decoration:none;-webkit-font-smoothing:antialiased}
.m-sample-credit a:hover{text-decoration:underline}
@media(max-width:860px){.m-sample-credit{padding:10px 12px 4px}}
html.demo-embed .m-sample-credit{display:none!important}
`

/** Closeout-only site credit — single muted link, no lobby bar. */
export default function CloseoutExplosionLobby() {
  const router = useRouter()
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  return (
    <>
      <style>{CREDIT_CSS}</style>
      <div className="m-sample-credit">
        <a href="https://jknojokes.com">JK No Jokes Financials</a>
      </div>
    </>
  )
}
