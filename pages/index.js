import { useState, useEffect } from 'react'
import HomeLanding from '../components/HomeLanding'
import MarketingShell from '../components/MarketingShell'
export default function Landing() {
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
        description="Owner portals tied to QuickBooks and the software you already use. See sample shops, then start a build."
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
