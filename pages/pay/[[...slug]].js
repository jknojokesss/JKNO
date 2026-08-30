// ── A short, branded pay link ────────────────────────────────────────────
// Stripe's own URLs are long and look like nothing — not what you want
// sitting in a customer's inbox next to an invoice. This bounces:
//
//   /pay                     → the default Stripe link
//   /pay/retainer            → a named one, for a different price or product
//   /pay?inv=1001            → tags the payment with the invoice number, so
//                              Stripe shows what it was for
//   /pay?email=a@b.com       → prefills their email on Stripe's page
//
// Configure with STRIPE_LINKS, a JSON map, e.g.
//   {"default":"https://buy.stripe.com/xxx","retainer":"https://buy.stripe.com/yyy"}
// or just STRIPE_PAYMENT_LINK for a single one. Changing where /pay points
// is then an environment change — links already sitting in sent emails keep
// working.

export async function getServerSideProps({ params, query }) {
  let links = {}
  try { links = JSON.parse(process.env.STRIPE_LINKS || '{}') } catch (e) { /* fall through */ }
  const name = (params.slug && params.slug[0]) || 'default'
  const target = links[name] || links.default || process.env.STRIPE_PAYMENT_LINK || null

  if (!target) return { props: { missing: true, name } }

  let url
  try { url = new URL(target) } catch (e) { return { props: { missing: true, name } } }
  // Stripe reads these on Payment Links: the reference shows up on the
  // payment so it can be matched back to an invoice, and the email saves
  // the customer typing it.
  if (query.inv) url.searchParams.set('client_reference_id', String(query.inv).slice(0, 200))
  if (query.email) url.searchParams.set('prefilled_email', String(query.email).slice(0, 200))

  return { redirect: { destination: url.toString(), permanent: false } }
}

export default function Pay({ missing, name }) {
  if (!missing) return null // the redirect already happened
  return (
    <div style={{ fontFamily: '-apple-system, Segoe UI, sans-serif', maxWidth: '460px', margin: '80px auto', padding: '0 20px', color: '#1A1A1A' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>This payment link isn&rsquo;t set up yet</h1>
      <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
        Nothing is wrong on your end. Please reply to the email you received and we&rsquo;ll send you a
        working link.
      </p>
      <p style={{ fontSize: '12px', color: '#999', marginTop: '18px' }}>Reference: {name}</p>
    </div>
  )
}
