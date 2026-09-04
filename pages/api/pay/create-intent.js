// ── PaymentIntent for one QuickBooks invoice ─────────────────────────────
// SERVER-SIDE ONLY. Powers the Elements checkout on /pay?inv=. The amount is
// looked up fresh from QuickBooks HERE, never trusted from the browser — the
// page already knows the balance (it rendered it), but a client could
// otherwise replay this endpoint with any invoice number and any amount.
//
// Same shape as the Checkout Session it replaced (pages/pay/[[...slug]].js):
// invoice number and QBO invoice id go on the PaymentIntent's metadata so a
// payment can be matched back to the invoice later, same as before.

const MAX_CENTS = 50_000_00 // $50,000 — above this, handle it by hand

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Card payments are not set up yet.' })
  }

  const inv = String((req.body && req.body.inv) || '').trim().slice(0, 40)
  const email = String((req.body && req.body.email) || '').trim().slice(0, 200)
  if (!inv) return res.status(400).json({ error: 'Missing invoice number.' })

  try {
    const client = process.env.STRIPE_PAY_CLIENT || 'jkno'
    const { getLiveToken } = await import('../../../lib/qboAuth')
    const { fetchInvoiceByDoc } = await import('../../../lib/qboAr')
    const { env, token, realmId } = await getLiveToken(client)
    const found = await fetchInvoiceByDoc(env, token, realmId, inv)
    if (!found) return res.status(404).json({ error: 'Invoice not found.' })

    const balance = Number(found.Balance || 0)
    if (balance <= 0) return res.status(409).json({ error: 'This invoice is already paid.' })

    const cents = Math.round(balance * 100)
    if (cents > MAX_CENTS) {
      return res.status(409).json({ error: 'For invoices this large, please reply to the email and we’ll arrange payment directly.' })
    }

    const Stripe = require('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      // Explicit list, not automatic_payment_methods — that surfaces every
      // method enabled on the account (Klarna, Affirm, etc.) which has
      // nothing to do with paying an invoice. 'card' covers Apple/Google Pay
      // too — those are wallets on the card rails, not separate types.
      payment_method_types: ['card', 'us_bank_account'],
      receipt_email: email || (found.BillEmail && found.BillEmail.Address) || undefined,
      description: `Invoice ${inv}`,
      metadata: {
        invoice_number: inv,
        qbo_invoice_id: String(found.Id || ''),
        client,
      },
    })

    res.status(200).json({ clientSecret: intent.client_secret, amountCents: cents })
  } catch (e) {
    console.error('[pay/create-intent] failed:', e.message)
    res.status(500).json({ error: 'Could not start the payment. Please try again.' })
  }
}
