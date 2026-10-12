import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../lib/demoEmbed'

/**
 * Minimal escape hatch above a sample portal (gallery lives on /demos).
 * Hidden when ?embed=1 (homepage / marketing iframe — show the app only).
 */
export default function DemoLobby({ suppress = false }) {
  const router = useRouter()
  if (suppress) return null
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  return (
    <nav className="m-sample-lobby" aria-label="Leave sample">
      <div className="m-sample-lobby__inner">
        <Link href="/demos" className="m-sample-lobby__back">
          ← All samples
        </Link>
        <Link href="/" className="m-sample-lobby__home">
          Home
        </Link>
      </div>
    </nav>
  )
}
