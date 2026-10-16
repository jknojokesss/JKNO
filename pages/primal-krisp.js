import Head from 'next/head'
import PrimalKrispPortal from '../components/samples/PrimalKrispPortal'

export default function PrimalKrispPage() {
  return (
    <>
      <Head>
        <title>Primal Krisp — owner portal (sample)</title>
        <meta
          name="description"
          content="Sample owner portal for Primal Krisp: kosher meat chips across website, subscriptions, stores, wholesale, and tastings."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2B2018" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PrimalKrispPortal />
    </>
  )
}
