import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

/** Old sample route — redirects to anonymized demo. */
export default function MneTradingRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/ashford-trading') }, [router])
  return (
    <>
      <Head><title>Sample portal</title><meta httpEquiv="refresh" content="0;url=/ashford-trading" /></Head>
      <p style={{ fontFamily: 'system-ui', padding: 24 }}>Opening sample portal…</p>
    </>
  )
}
