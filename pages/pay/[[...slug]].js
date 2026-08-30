// ── A short, branded pay link ────────────────────────────────────────────
// Stripe's own URLs are long and anonymous — not what belongs in a
// customer's inbox next to an invoice. This is the short one you send:
//
//   /pay?inv=1001   the real thing: looks that invoice up in QuickBooks and
//                   sends them to Stripe for EXACTLY the balance owed, with
//                   the invoice number attached to the payment.
//   /pay            the flat Stripe link, for when there is no invoice
//   /pay/retainer   a named flat link, for another price or product
//   /pay?email=…    prefills their email
//
// A fixed Stripe Payment Link can only ever charge one amount, which is no
// use when every customer owes something different — hence the per-invoice
// checkout. Falls back to the flat link whenever Stripe or the invoice
// lookup is not available, so a link in a sent email never dead-ends.
//
// Env: STRIPE_SECRET_KEY (per-invoice), STRIPE_LINKS / STRIPE_PAYMENT_LINK
// (flat), STRIPE_PAY_CLIENT (which QuickBooks company, default 'jkno').

function flatLink(name) {
  let links = {}
  try { links = JSON.parse(process.env.STRIPE_LINKS || '{}') } catch (e) { /* fall through */ }
  return links[name] || links.default || process.env.STRIPE_PAYMENT_LINK || null
}

export async function getServerSideProps({ params, query, req }) {
  const name = (params.slug && params.slug[0]) || 'default'
  if (name === 'thanks') return { props: { thanks: true, inv: String(query.inv || '') } }

  const inv = String(query.inv || '').trim().slice(0, 40)
  const email = String(query.email || '').trim().slice(0, 200)

  // ── Per-invoice checkout ───────────────────────────────────────────────
  if (inv && process.env.STRIPE_SECRET_KEY) {
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

      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
      const base = process.env.PORTAL_BASE_URL || `${proto}://${req.headers.host}`
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(balance * 100),
            product_data: { name: `Invoice ${inv}` },
          },
        }],
        // Both are how the payment gets matched back to the invoice later —
        // in Stripe's dashboard, and by anything that reconciles it.
        client_reference_id: `INV-${inv}`,
        metadata: { invoice_number: inv, qbo_invoice_id: String(found.Id || ''), client },
        customer_email: email || (found.BillEmail && found.BillEmail.Address) || undefined,
        success_url: `${base}/pay/thanks?inv=${encodeURIComponent(inv)}`,
        cancel_url: `${base}/pay?inv=${encodeURIComponent(inv)}`,
      })
      return { redirect: { destination: session.url, permanent: false } }
    } catch (e) {
      // Never dead-end a paying customer: fall through to the flat link.
      console.error('[pay] per-invoice checkout failed:', e && e.message)
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

const Page = ({ title, children }) => (
  <div style={{ fontFamily: '-apple-system, Segoe UI, sans-serif', maxWidth: '460px', margin: '80px auto', padding: '0 20px', color: '#1A1A1A' }}>
    <h1 style={{ fontSize: '21px', marginBottom: '10px' }}>{title}</h1>
    <div style={{ fontSize: '14.5px', color: '#555', lineHeight: 1.65 }}>{children}</div>
  </div>
)

export default function Pay({ thanks, notFound, paid, missing, inv, name }) {
  if (thanks) return (
    <Page title="Thank you — payment received">
      <p>Your payment for invoice {inv} went through. A receipt is on its way from Stripe.</p>
    </Page>
  )
  if (paid) return (
    <Page title="This invoice is already paid">
      <p>Nothing is outstanding on invoice {inv}. If you think that&rsquo;s wrong, just reply to the email you received.</p>
    </Page>
  )
  if (notFound) return (
    <Page title="We couldn&rsquo;t find that invoice">
      <p>Invoice {inv} isn&rsquo;t one we can look up. Please reply to the email you received and we&rsquo;ll sort it out.</p>
    </Page>
  )
  if (missing) return (
    <Page title="This payment link isn&rsquo;t set up yet">
      <p>Nothing is wrong on your end. Please reply to the email you received and we&rsquo;ll send a working link.</p>
      <p style={{ fontSize: '12px', color: '#999', marginTop: '18px' }}>Reference: {name}</p>
    </Page>
  )
  return null // a redirect already happened
}
