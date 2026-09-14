import { useState } from 'react'
import Head from 'next/head'
import HomeIntro from '../components/HomeIntro'
import HomeAssemble from '../components/HomeAssemble'
import HomePortal from '../components/HomePortal'
import { MARKETING_FONTS } from '../lib/marketing'

export default function Landing() {
  const [portalVisible, setPortalVisible] = useState(false)
  const [assembling, setAssembling] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleIntroDone = ({ playedIntro }) => {
    setPortalVisible(true)
    setAssembling(playedIntro)
  }

  return (
    <>
      <Head>
        <title>JK No Jokes Financials — Custom Dashboards Wired Into Your Systems</title>
        <meta name="description" content="Custom financial portals wired into QuickBooks — POS, distributor invoices, job costing, inventory, AR, and month-end close." />
        <meta property="og:title" content="JK No Jokes Financials — Custom Dashboards Wired Into Your Systems" />
        <meta property="og:description" content="Custom financial portals wired into QuickBooks — POS, distributor invoices, job costing, inventory, AR, and month-end close." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jknojokes.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href={MARKETING_FONTS} rel="stylesheet" />
      </Head>

      <HomeIntro onDone={handleIntroDone} />

      {portalVisible && assembling && (
        <HomeAssemble onDone={() => setAssembling(false)} />
      )}

      {portalVisible && (
        <HomePortal
          live={!assembling}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitted={submitted}
          submitting={submitting}
        />
      )}
    </>
  )
}
