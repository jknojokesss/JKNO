import Link from 'next/link'
import { useRouter } from 'next/router'
import { isDemoEmbedQuery } from '../lib/demoEmbed'
import { getDemoHook } from '../lib/demoHooks'
import { getSamplePortal } from '../lib/samplePortals'
import { getDemoAlignment } from '../lib/demoAlignment'
import DemoGalleryCard from './DemoGalleryCard'

/**
 * Sample portal header — current demo + next sample link.
 * Hidden when ?embed=1 (homepage / marketing iframe — show the app, not the lobby).
 */
export default function DemoLobby({ href, biz, suppress = false }) {
  const router = useRouter()
  if (suppress) return null
  const embedded =
    (typeof window !== 'undefined' && /[?&]embed=(?:1|true)(?:&|$)/.test(window.location.search))
    || router.asPath.includes('embed=1')
    || (router.isReady && isDemoEmbedQuery(router.query))
  if (embedded) return null

  const current = getSamplePortal(href)
  const name = current.name || biz
  const { next, nextLabel } = getDemoHook(href)
  const nextHref = next || '/demos'
  const nextPortal = getSamplePortal(nextHref)
  const nextName = nextPortal.name || nextLabel || 'All samples'
  const { sells } = getDemoAlignment(href)

  return (
    <div className="m-sample-lobby" role="region" aria-label="Sample portal">
      <div className="m-sample-lobby__top">
        <Link href="/" className="m-sample-lobby__jk">
          JK<span className="m-sample-lobby__dot">.</span>
        </Link>
        <p className="m-kicker">Fictitious company · sample portal</p>
      </div>
      <DemoGalleryCard
        href={href}
        biz={name}
        industry={current.industry}
        here
      />
      <p className="m-sample-lobby__sells">
        {sells.join(' · ')}
      </p>
      <p className="m-sample-lobby__next-label">Next sample</p>
      <DemoGalleryCard
        href={nextHref}
        biz={nextName}
        industry={nextPortal.industry}
      />
      <p className="m-sample-lobby__foot">
        <Link href="/demos">All samples</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/#contact">Start a build</Link>
      </p>
    </div>
  )
}
