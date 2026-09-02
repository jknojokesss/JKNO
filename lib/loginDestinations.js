// ── Where a client actually logs in ──────────────────────────────────────
// SERVER-SIDE ONLY. This map names client emails, so it must never reach the
// browser bundle — reach it through /api/login-destination, never by import
// from a page.
//
// The problem this solves: jknojokes.com had one "Client Login" button
// pointing at /login, and next.config.js redirected /login straight to
// reydel.vercel.app. Every client who clicked it — Lew Imports, Wilner,
// anybody — landed on Thomas Reydel's login screen. Meanwhile the real
// sign-in forms were scattered across /portal, /gowns, /jerky-munch and
// reydel.vercel.app, so each client had to be handed their own private URL
// and told not to use the button on the website.
//
// Now /login asks for an email and sends the person to their own door.
//
// Two rules this file exists to enforce:
//
// 1. NEVER reveal whether an account exists. An unknown email resolves to
//    DEFAULT_DESTINATION like any other, so this endpoint can't be used to
//    enumerate our client list. That is why there is no "not found" return.
// 2. This routes only. It authenticates nothing and grants nothing — being
//    sent to a portal is not access to it. Every destination still runs its
//    own sign-in, and the portal API still forces one client_slug per login
//    (lib/portalAuth.js). Sending someone to the wrong door costs them a
//    confusing screen, never somebody else's books.
//
// Adding a client: if they sign in at /portal, do nothing — the portal_users
// lookup below finds them automatically. If their portal is a separate app
// (a different repo, a different Supabase project), add a row here.

const DEFAULT_DESTINATION = '/portal'

const DESTINATIONS = [
  {
    label: 'Reydel Tire',
    // Portal UI lives in jknojokesss/reydel. Different origin, so a session
    // made here would not carry over — we hand off at the login screen and
    // Thomas types his password there. Swap this host when
    // reydel.jknojokes.com is attached.
    emails: ['thomashart84@gmail.com'],
    url: 'https://reydel.vercel.app/login',
  },
  {
    label: 'Lew Imports',
    // Owner and seamstress both sign in on the same screen, so match the
    // whole domain rather than listing accounts that come and go.
    domain: '@lewimports.com',
    url: '/gowns',
  },
  {
    label: 'Jerky Munch',
    // Isolated Supabase project (lib/supabaseJerky.js) — we can't look these
    // accounts up from the main project, so they have to be named here.
    domain: '@jerkymunch.com',
    url: '/jerky-munch',
  },
]

/**
 * Which login screen does this email belong to?
 *
 * Always resolves to a URL. An unknown or malformed email gets
 * DEFAULT_DESTINATION — see rule 1 above.
 */
export async function resolveLoginDestination(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return DEFAULT_DESTINATION

  for (const d of DESTINATIONS) {
    if (d.emails && d.emails.includes(email)) return d.url
    if (d.domain && email.endsWith(d.domain)) return d.url
  }

  // Anyone mapped in portal_users signs in at /portal. Looked up rather than
  // listed so onboarding a portal client stays a row, not a deploy.
  //
  // supabaseAdmin is imported HERE, not at the top: it calls createClient at
  // module scope and throws outright when SUPABASE_SERVICE_ROLE_KEY is absent
  // or rotated. A top-level import made that failure take down routing for
  // every client above too, none of whom need the database at all.
  try {
    const { supabaseAdmin } = await import('./supabaseAdmin')
    const { data } = await supabaseAdmin
      .from('portal_users').select('email').eq('email', email).maybeSingle()
    if (data) return '/portal'
  } catch {
    // A lookup failure must not become an error the caller can distinguish
    // from "no match" — that would leak existence. Fall through.
  }

  return DEFAULT_DESTINATION
}
