import Link from 'next/link'
import { getDemoHook } from '../lib/demoHooks'

/**
 * Thin entry strip on sample portals — sets the mood before the product UI.
 * Scope copy stays in DemoScopeBanner; this is the tease.
 */
export default function DemoLobby({ href, biz }) {
  const { hook, next, nextLabel } = getDemoHook(href)
  const nextHref = next || '/demos'
  const nextText = nextLabel || 'All samples'

  return (
    <div className="m-demo-lobby" role="region" aria-label="Sample portal">
      <div className="m-demo-lobby__inner">
        <Link href="/" className="m-demo-lobby__jk">
          JK<span className="m-demo-lobby__dot">.</span>
        </Link>
        <div className="m-demo-lobby__mid">
          {biz && <span className="m-demo-lobby__biz">{biz}</span>}
          <p className="m-demo-lobby__hook">{hook}</p>
        </div>
        <Link href={nextHref} className="m-demo-lobby__next">
          Next: {nextText}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </div>
  )
}
