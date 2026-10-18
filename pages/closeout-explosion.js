import Head from 'next/head'
import CloseoutExplosionPortal from '../components/samples/closeoutExplosion/CloseoutExplosionPortal'

export default function CloseoutExplosionPage() {
  return (
    <>
      <Head>
        <title>Closeout Explosion — owner portal (sample)</title>
        <meta
          name="description"
          content="Sample owner portal for Closeout Explosion Inc: lot profit, cash in stock, and buyer receivables."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2B2018" />
        <meta name="robots" content="noindex, nofollow" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <CloseoutExplosionPortal />
    </>
  )
}
