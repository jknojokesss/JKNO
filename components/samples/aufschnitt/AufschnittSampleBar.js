import Link from 'next/link'

/** JK wordmark home link only — no “All samples” escape hatch on this portal. */
export default function AufschnittSampleBar() {
  return (
    <nav className="m-sample-lobby" aria-label="JK home">
      <div className="m-sample-lobby__inner">
        <Link href="/" className="m-sample-lobby__brand">
          <span className="m-sample-lobby__jk">
            JK<span className="m-sample-lobby__dot">.</span>
          </span>
          <span className="m-sample-lobby__co">No Jokes Financials</span>
        </Link>
      </div>
    </nav>
  )
}
