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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <CloseoutExplosionPortal />
    </>
  )
}
