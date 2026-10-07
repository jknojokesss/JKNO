import { useState, useCallback, useEffect, useLayoutEffect } from 'react'
import HomeIntro from '../components/HomeIntro'
import HomeLanding from '../components/HomeLanding'
import MarketingShell from '../components/MarketingShell'
import { shouldSkipHomeIntro, isDirectHomeTraffic } from '../lib/homeIntro'

function initialSkipIntro() {
  if (typeof window === 'undefined') return false
  return shouldSkipHomeIntro()
}

export default function Landing() {
  const [portalLive, setPortalLive] = useState(initialSkipIntro)
  const [form, setForm] = useState({
    name: '',
    email: '',
    business: '',
    trade: '',
    quickbooks: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useLayoutEffect(() => {
    if (isDirectHomeTraffic()) setPortalLive(true)
  }, [])

  useEffect(() => {
    document.body.style.removeProperty('overflow')
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.business || !form.trade || !form.quickbooks) return
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
      <MarketingShell
        title="JK No Jokes Financials | Portals wired to QuickBooks"
        description="Custom owner portals on QuickBooks — see today's margin while you run the month. Demos for trades, retail, and distribution. About six days to launch."
        darkHeader
        padTop={false}
      >
        <HomeLanding
          live={portalLive}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitted={submitted}
          submitting={submitting}
        />
      </MarketingShell>

      <HomeIntro onReveal={handleIntroReveal} />
    </>
  )
}
