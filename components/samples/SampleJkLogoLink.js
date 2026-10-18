import Link from 'next/link'
import { useRouter } from 'next/router'
import { MarketingLogo } from '../MarketingShell'
import { isDemoEmbedQuery } from '../../lib/demoEmbed'

const LOGO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;1,9..40,400&family=Playfair+Display:wght@700&display=swap');
.sample-jk-credit{padding:8px 16px 2px;font-family:'DM Sans',system-ui,sans-serif;line-height:1}
.sample-jk-credit a{display:inline-flex;align-items:center;text-decoration:none}
.sample-jk-credit .m-logo{gap:0}
.sample-jk-credit .m-logo__jk{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#2B2018;line-height:1}
.sample-jk-credit .m-logo__dot{color:#C9A84C}
@media(min-width:861px){.sample-jk-credit{padding:8px 30px 2px}}
html.demo-embed .sample-jk-credit{display:none!important}
`

/** Small JK wordmark link for prospect sample pages only (not the marketing nav). */
export default function SampleJkLogoLink() {
  const router = useRouter()
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  return (
    <>
      <style>{LOGO_CSS}</style>
      <div className="sample-jk-credit">
        <Link href="https://jknojokes.com" aria-label="JK No Jokes home">
          <MarketingLogo size={22} tagline={false} />
        </Link>
      </div>
    </>
  )
}
