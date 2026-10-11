import '../styles/globals.css'
import '../styles/marketing.css'
import '../styles/jk-theme.css'
import '../styles/jk-home.css'
import '../styles/marketing-flight-pages.css'
import '../styles/admin-hub.css'
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
