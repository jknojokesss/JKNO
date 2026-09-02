import { resolveLoginDestination } from '../../lib/loginDestinations'

// Tells /login which sign-in screen an email belongs to. Routing only — it
// authenticates nobody and returns nothing about the account itself.
//
// It answers identically for a real client and a stranger (see rule 1 in
// lib/loginDestinations.js), so it is deliberately not rate-limited into a
// different response shape: every email gets a destination.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body || {}

  try {
    const url = await resolveLoginDestination(email)
    return res.status(200).json({ url })
  } catch {
    // Never fail in a way that tells the caller something about the email.
    return res.status(200).json({ url: '/portal' })
  }
}
