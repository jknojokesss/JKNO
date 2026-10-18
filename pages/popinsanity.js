import Head from 'next/head'
import PopinsanityPortal from '../components/samples/popinsanity/PopinsanityPortal'

export default function PopinsanityPage() {
  return (
    <>
      <Head>
        <title>Popinsanity — owner portal (sample)</title>
        <meta name="description" content="Sample owner portal for Popinsanity: holiday corporate gifts, channel sales, cash timing, and month-end P&amp;L." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2B2B2B" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PopinsanityPortal />
    </>
  )
}
