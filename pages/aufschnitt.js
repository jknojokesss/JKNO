import Head from 'next/head'
import AufschnittPortal from '../components/samples/aufschnitt/AufschnittPortal'

/** Hide marketing site chrome if a shared layout adds it — scoped to this route only. */
const PROSPECT_ROUTE_CSS = `
body:has([data-aufschnitt-prospect]) > header.m-header,
body:has([data-aufschnitt-prospect]) > .m-header,
body:has([data-aufschnitt-prospect]) .marketing-site > .m-header,
body:has([data-aufschnitt-prospect]) nav.m-sample-lobby {
  display: none !important;
}
`

export default function AufschnittPage() {
  return (
    <>
      <Head>
        <title>Aufschnitt Meats — owner portal (sample)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Sample owner portal for Aufschnitt Meats: kosher meat snacks across stores, Amazon, and own website."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2B2018" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: PROSPECT_ROUTE_CSS }} />
      <div data-aufschnitt-prospect>
        <AufschnittPortal />
      </div>
    </>
  )
}
