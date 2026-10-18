import Head from 'next/head'
import MrDipzSample from '../components/samples/mrDipz/MrDipzSample'

export default function MrDipzPage() {
  return (
    <>
      <Head>
        <title>Mr. Dipz — owner portal (sample)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Sample owner portal for Mr. Dipz refrigerated kosher dips — store sales, credits, and wholesale financials."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2B2018" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <MrDipzSample />
    </>
  )
}
