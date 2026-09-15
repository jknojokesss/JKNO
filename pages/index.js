import { useState, useCallback, useEffect } from 'react'
import Head from 'next/head'
import HomeIntro from '../components/HomeIntro'
import HomePortal from '../components/HomePortal'
import { MARKETING_FONTS } from '../lib/marketing'

export default function Landing() {
  const [portalLive, setPortalLive] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.removeProperty('overflow')
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.business) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
      else alert('Something went wrong. Please email jk@jknojokes.com directly.')
    } catch {
      alert('Something went wrong. Please email jk@jknojokes.com directly.')
    }
    setSubmitting(false)
  }

  const handleIntroReveal = useCallback(() => setPortalLive(true), [])

  return (
    <>
      <Head>
        <title>JK No Jokes Financials — One Portal, Your Systems, Numbers That Tie Out</title>
        <meta name="description" content="Custom portals wired to QuickBooks, your register, and your vendors. One login. Synced nightly. Built for one shop at a time." />
        <meta property="og:title" content="JK No Jokes Financials — One Portal, Your Systems, Numbers That Tie Out" />
        <meta property="og:description" content="Custom portals wired to QuickBooks, your register, and your vendors. One login. Synced nightly. Built for one shop at a time." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jknojokes.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href={MARKETING_FONTS} rel="stylesheet" />
      </Head>

      <HomePortal
        live={portalLive}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitted={submitted}
        submitting={submitting}
      />

      <HomeIntro onReveal={handleIntroReveal} />
    </>
  )
}
