import Link from 'next/link'
import Head from 'next/head'
import { getDemoHook } from '../lib/demoHooks'
import { getSamplePortal } from '../lib/samplePortals'
import ChocolateBarLink, { ChocolateBarCaption } from './ChocolateBarLink'

const CHOC_FONT =
  'https://fonts.googleapis.com/css2?family=Bitter:wght@600;700&display=swap'

/**
 * Sample portal header — same chocolate bars as the homepage, plus “next bar” trail.
 */
export default function DemoLobby({ href, biz }) {
  const current = getSamplePortal(href)
  const name = current.name || biz
  const { next, nextLabel } = getDemoHook(href)
  const nextHref = next || '/demos'
  const nextPortal = getSamplePortal(nextHref)
  const nextName = nextPortal.name || nextLabel || 'All samples'

  return (
    <>
      <Head>
        <link rel="stylesheet" href={CHOC_FONT} />
      </Head>
      <div className="jk-choc-lobby" role="region" aria-label="Sample portal">
        <div className="jk-choc-lobby__top">
          <Link href="/" className="jk-choc-lobby__jk">
            JK<span className="jk-choc-lobby__dot">.</span>
          </Link>
          <ChocolateBarCaption>Fictitious company · sample portal</ChocolateBarCaption>
        </div>
        <ChocolateBarLink
          href={href}
          name={name}
          industry={current.industry}
          here
        />
        <ChocolateBarCaption sub>Next bar</ChocolateBarCaption>
        <ChocolateBarLink
          href={nextHref}
          name={nextName}
          industry={nextPortal.industry}
        />
        <p className="jk-choc-lobby__foot">
          <Link href="/demos">All samples</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/#contact">Start a build</Link>
        </p>
      </div>
    </>
  )
}
