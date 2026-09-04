// ── A short, branded pay link ────────────────────────────────────────────
// Stripe's own URLs are long and anonymous — not what belongs in a
// customer's inbox next to an invoice. This is the short one you send:
//
//   /pay?inv=1001   the real thing: looks that invoice up in QuickBooks and
//                   renders a Stripe Elements checkout for EXACTLY the
//                   balance owed, with the invoice number attached to the
//                   payment.
//   /pay            the flat Stripe link, for when there is no invoice
//   /pay/retainer   a named flat link, for another price or product
//   /pay?email=…    prefills the receipt email
//
// A fixed Stripe Payment Link can only ever charge one amount, which is no
// use when every customer owes something different — hence the per-invoice
// checkout. Falls back to the flat link whenever Stripe or the invoice
// lookup is not available, so a link in a sent email never dead-ends.
//
// This used to redirect straight to a Stripe-hosted Checkout Session — safe,
// but the branding is whatever's set in the Stripe dashboard and nothing
// else. This renders the payment form on our own page instead, with
// @stripe/react-stripe-js's PaymentElement, so the page can look like the
// rest of the site (see the appearance object below) instead of Stripe's own
// layout. lib/qboAr.js / lib/qboAuth.js do the actual QuickBooks lookup;
// pages/api/pay/create-intent.js does the actual charge — this page only
// renders and confirms.
//
// Env: STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (per-invoice
// Elements checkout — both are required, since the browser needs the
// publishable key to even load Stripe.js), STRIPE_LINKS / STRIPE_PAYMENT_LINK
// (flat), STRIPE_PAY_CLIENT (which QuickBooks company, default 'jkno').

import { useState } from 'react'
import Head from 'next/head'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Lazy singleton — this module also renders /pay/thanks, /pay (missing-link),
// notFound and paid, none of which need Stripe.js at all. Loading it at
// module scope would fire loadStripe() on every one of those requests too;
// worse, a rejected load (blocked script, ad blocker, a Stripe CDN blip)
// becomes an unhandled promise rejection that has nothing to do with those
// pages. Only created the moment the checkout view actually mounts.
let _stripePromise
function getStripe() {
  if (_stripePromise === undefined) _stripePromise = PUBLISHABLE ? loadStripe(PUBLISHABLE) : null
  return _stripePromise
}

const INK = '#1B1815'
const MUTED = '#6B7280'
const GOLD = '#C9A84C'
const PAPER = '#F6F5F1'
const RULE = '#E5E2DA'

const money = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const niceDate = (iso) => iso
  ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null

function flatLink(name) {
  let links = {}
  try { links = JSON.parse(process.env.STRIPE_LINKS || '{}') } catch (e) { /* fall through */ }
  return links[name] || links.default || process.env.STRIPE_PAYMENT_LINK || null
}

export async function getServerSideProps({ params, query }) {
  const name = (params.slug && params.slug[0]) || 'default'
  if (name === 'thanks') return { props: { thanks: true, inv: String(query.inv || '') } }

  const inv = String(query.inv || '').trim().slice(0, 40)
  const email = String(query.email || '').trim().slice(0, 200)

  // ── Per-invoice checkout ───────────────────────────────────────────────
  if (inv && process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    try {
      const client = process.env.STRIPE_PAY_CLIENT || 'jkno'
      // Imported here, not at module scope: these reach for the service-role
      // key, and Next evaluates page modules at build time when that key is
      // not present. A top-level import fails the whole build.
      const { getLiveToken } = await import('../../lib/qboAuth')
      const { fetchInvoiceByDoc } = await import('../../lib/qboAr')
      const { env, token, realmId } = await getLiveToken(client)
      const found = await fetchInvoiceByDoc(env, token, realmId, inv)

      if (!found) return { props: { notFound: true, inv } }
      const balance = Number(found.Balance || 0)
      if (balance <= 0) return { props: { paid: true, inv } }

      return {
        props: {
          checkout: {
            inv,
            email: email || (found.BillEmail && found.BillEmail.Address) || '',
            amountCents: Math.round(balance * 100),
            customerName: (found.CustomerRef && found.CustomerRef.name) || null,
            dueDate: found.DueDate || null,
          },
        },
      }
    } catch (e) {
      // Never dead-end a paying customer: fall through to the flat link.
      console.error('[pay] invoice lookup failed:', e && e.message)
    }
  }

  // ── Flat link ──────────────────────────────────────────────────────────
  const target = flatLink(name)
  if (!target) return { props: { missing: true, name } }
  let url
  try { url = new URL(target) } catch (e) { return { props: { missing: true, name } } }
  if (inv) url.searchParams.set('client_reference_id', `INV-${inv}`)
  if (email) url.searchParams.set('prefilled_email', email)
  return { redirect: { destination: url.toString(), permanent: false } }
}

const card = {
  background: '#fff', border: `1px solid ${RULE}`, borderRadius: '6px',
  padding: '32px 28px', maxWidth: '460px', width: '100%',
  boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
}

const Shell = ({ children }) => (
  <>
    <Head>
      <title>Pay your invoice — JK No Jokes</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    </Head>
    <div style={{ minHeight: '100vh', background: PAPER, display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px',
      fontFamily: 'Inter, -apple-system, sans-serif', color: INK }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: '700' }}>
            JK<span style={{ color: GOLD }}>.</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  </>
)

const Message = ({ title, children }) => (
  <Shell>
    <div style={card}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '21px', margin: '0 0 10px' }}>{title}</h1>
      <div style={{ fontSize: '14.5px', color: MUTED, lineHeight: 1.65 }}>{children}</div>
    </div>
  </Shell>
)

/* ---------------- the checkout form ---------------- */
function CheckoutForm({ inv, email, amountCents, customerName, dueDate }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || busy) return
    setBusy(true); setError('')

    // Deferred flow: validate the Payment Element's fields first, then ask
    // the server for a PaymentIntent (it recomputes the balance itself —
    // this page's amountCents is display-only), and only then confirm.
    // Nothing is charged until confirmPayment below.
    const { error: submitError } = await elements.submit()
    if (submitError) { setError(submitError.message || 'Please check the payment details.'); setBusy(false); return }

    try {
      const res = await fetch('/api/pay/create-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inv, email }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not start the payment.')

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: body.clientSecret,
        confirmParams: { return_url: `${window.location.origin}/pay/thanks?inv=${encodeURIComponent(inv)}` },
      })
      // Only reached if confirmation failed before redirect; otherwise
      // Stripe sends the customer to return_url once it's done.
      if (confirmError) { setError(confirmError.message || 'Payment could not be completed.'); setBusy(false) }
    } catch (e) {
      setError(e.message); setBusy(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '6px' }}>
        Invoice {inv}
      </div>
      <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', fontVariantNumeric: 'lining-nums tabular-nums', fontSize: '34px', fontWeight: '700', lineHeight: 1.1 }}>
        {money(amountCents)}
      </div>
      <div style={{ fontSize: '13.5px', color: MUTED, marginTop: '4px' }}>
        {customerName ? `${customerName}${dueDate ? ` · due ${niceDate(dueDate)}` : ''}` : (dueDate ? `Due ${niceDate(dueDate)}` : '')}
      </div>

      <div style={{ height: '1px', background: RULE, margin: '22px 0' }} />

      <form onSubmit={submit}>
        <PaymentElement options={{ layout: 'tabs' }} />

        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#FFF5F5',
            border: '1px solid #F1948A', borderRadius: '4px', fontSize: '13.5px', color: '#C0392B' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!stripe || busy}
          style={{ width: '100%', marginTop: '20px', padding: '14px', border: 'none',
            borderRadius: '4px', fontSize: '14.5px', fontWeight: '600', letterSpacing: '0.02em',
            cursor: !stripe || busy ? 'default' : 'pointer',
            background: !stripe || busy ? '#E8D5A3' : GOLD, color: '#1B1815' }}>
          {busy ? 'Processing…' : `Pay ${money(amountCents)}`}
        </button>
      </form>

      <div style={{ marginTop: '16px', fontSize: '12px', color: MUTED, textAlign: 'center' }}>
        Secured by Stripe. Questions? Reply to your invoice email.
      </div>
    </div>
  )
}

export default function Pay({ thanks, notFound, paid, missing, checkout, inv, name }) {
  if (thanks) return (
    <Message title="Thank you — payment received">
      Your payment for invoice {inv} went through. A receipt is on its way from Stripe.
    </Message>
  )
  if (paid) return (
    <Message title="This invoice is already paid">
      Nothing is outstanding on invoice {inv}. If you think that&rsquo;s wrong, just reply to the email you received.
    </Message>
  )
  if (notFound) return (
    <Message title="We couldn&rsquo;t find that invoice">
      Invoice {inv} isn&rsquo;t one we can look up. Please reply to the email you received and we&rsquo;ll sort it out.
    </Message>
  )
  if (missing) return (
    <Message title="This payment link isn&rsquo;t set up yet">
      Nothing is wrong on your end. Please reply to the email you received and we&rsquo;ll send a working link.
      <div style={{ fontSize: '12px', color: '#B0AFA8', marginTop: '14px' }}>Reference: {name}</div>
    </Message>
  )
  if (checkout) return (
    <Shell>
      <Elements stripe={getStripe()} options={{
        mode: 'payment', amount: checkout.amountCents, currency: 'usd',
        // Matches payment_method_types set server-side in create-intent —
        // otherwise Elements shows every method enabled on the account
        // (Klarna, Affirm, etc.) before the real PaymentIntent exists.
        paymentMethodTypes: ['card', 'us_bank_account'],
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: GOLD,
            colorBackground: '#ffffff',
            colorText: INK,
            colorDanger: '#C0392B',
            fontFamily: 'Inter, -apple-system, sans-serif',
            borderRadius: '4px',
          },
        },
      }}>
        <CheckoutForm {...checkout} />
      </Elements>
    </Shell>
  )
  return null // a redirect already happened (flat link)
}
