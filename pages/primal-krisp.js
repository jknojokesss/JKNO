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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PrimalKrispPortal />
    </>
  )
}
