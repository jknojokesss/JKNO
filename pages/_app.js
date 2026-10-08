import '../styles/globals.css'
import '../styles/marketing.css'
import '../styles/home-flight.css'
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
