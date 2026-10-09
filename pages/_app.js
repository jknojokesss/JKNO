import '../styles/globals.css'
import '../styles/marketing.css'
import '../styles/home-landing.css'
import '../styles/marketing-flight-pages.css'
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
