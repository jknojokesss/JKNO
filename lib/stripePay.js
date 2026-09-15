// Create a shareable Stripe Payment Link for a one-off invoice amount, via the
// Stripe REST API (no stripe npm dependency). Returns the URL, or null on any
// failure (the email still sends, just without the button).
async function stripeForm(path, params) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Stripe ${path}: ${(j.error && j.error.message) || r.status}`)
  return j
}

export async function createInvoicePayLink({ amount, label }) {
  if (!process.env.STRIPE_SECRET_KEY) return null
  const cents = Math.round(Number(amount) * 100)
  if (!cents || cents < 50) return null
  try {
    const price = await stripeForm('prices', {
      currency: 'usd',
      unit_amount: String(cents),
      'product_data[name]': label || 'Invoice payment',
    })
    const link = await stripeForm('payment_links', {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
    })
    return link.url || null
  } catch (e) {
    console.error('Stripe pay link failed:', e.message)
    return null
  }
}
