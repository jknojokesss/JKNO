import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import HomeLanding from '../components/HomeLanding'
import MarketingShell from '../components/MarketingShell'

const PORTFOLIO_TRADE = 'Multiple businesses / portfolio'

export default function Landing() {
  const router = useRouter()
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

  useEffect(() => {
    document.body.style.removeProperty('overflow')
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.portfolio === '1' || router.query.interest === 'portfolio') {
      setForm((f) => ({
        ...f,
        trade: PORTFOLIO_TRADE,
        message: f.message || 'Interested in the owner portfolio hub — multiple businesses, one login.',
      }))
    }
  }, [router.isReady, router.query.portfolio, router.query.interest])

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

  return (
    <>
      <MarketingShell
        title="JK No Jokes Financials | Owner portals for your shop"
        description="Run your business like you meant to — owner portals on your real QuickBooks and tools. Open a sample in 60 seconds, no login."
        marketingHome
        padTop={false}
      >
        <HomeLanding
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitted={submitted}
          submitting={submitting}
        />
      </MarketingShell>
    </>
  )
}
