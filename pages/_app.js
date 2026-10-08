import '../styles/globals.css'
import '../styles/marketing.css'
import '../styles/home-flight.css'
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
