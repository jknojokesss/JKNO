// Shared login routing helpers — safe to import from pages (no client email map).

/** Paths where /login can collect the password (main Supabase project). */
export function signInOnLoginPage(url) {
  return url === '/portal' || url === '/admin'
}

/** Append email for the destination sign-in form. */
export function loginUrlWithEmail(url, rawEmail) {
  const email = String(rawEmail || '').trim()
  if (!email) return url
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url)
      u.searchParams.set('email', email)
      return u.toString()
    } catch {
      return url
    }
  }
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}email=${encodeURIComponent(email)}`
}
