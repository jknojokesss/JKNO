import Head from 'next/head'
import AufschnittPortal from '../components/samples/aufschnitt/AufschnittPortal'

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
      <AufschnittPortal />
    </>
  )
}
