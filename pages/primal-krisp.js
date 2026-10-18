import Head from 'next/head'
import PrimalKrispPortal from '../components/samples/PrimalKrispPortal'

const OG_IMAGE = 'https://jknojokes.com/samples/primal-krisp/og-image.png'
const PAGE_URL = 'https://jknojokes.com/primal-krisp'

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
        <link rel="icon" type="image/png" sizes="32x32" href="/samples/primal-krisp/favicon-32.png" />
        <link rel="icon" type="image/svg+xml" href="/samples/primal-krisp/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/samples/primal-krisp/apple-touch-icon.png" />
        <meta property="og:title" content="Primal Krisp — sample dashboard" />
        <meta
          property="og:description"
          content="Fictitious owner portal sample for Primal Krisp meat chips: sales, stores, subscriptions, and month-end in one place."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Primal Krisp — sample dashboard" />
        <meta
          name="twitter:description"
          content="Fictitious owner portal sample for Primal Krisp meat chips: sales, stores, subscriptions, and month-end in one place."
        />
        <meta name="twitter:image" content={OG_IMAGE} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PrimalKrispPortal />
    </>
  )
}
