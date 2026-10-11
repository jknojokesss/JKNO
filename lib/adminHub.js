// Admin home — where each live client portal lives. URLs are not secret;
// the /admin pages themselves are gated by the admins table.

/** @typedef {{ id: string, name: string, subtitle: string, portalUrl: string, loginUrl: string, slug: string | null, sameTab?: boolean }} AdminClientLauncher */

export const CLIENT_LAUNCHERS = [
  {
    id: 'reydel',
    name: 'Reydel Tire',
    subtitle: 'Owner portal · reydel repo',
    portalUrl: 'https://reydel.vercel.app/reydel-tire/dashboard',
    loginUrl: 'https://reydel.vercel.app/reydel-tire/login',
    slug: 'reydel',
  },
  {
    id: 'lew',
    name: 'Lew Imports',
    subtitle: 'Gown shop · gowns repo',
    portalUrl: 'https://gowns-nine.vercel.app/gowns',
    loginUrl: 'https://gowns-nine.vercel.app/gowns',
    slug: null,
  },
  {
    id: 'jerky',
    name: 'Jerky Munch',
    subtitle: 'Store invoicing · isolated Supabase',
    portalUrl: 'https://jknojokes.com/jerky-munch',
    loginUrl: 'https://jknojokes.com/jerky-munch',
    slug: 'jerky',
  },
  {
    id: 'ar-portal',
    name: 'AR client portal',
    subtitle: 'Invoice desk for portal_users on JKNO',
    portalUrl: '/portal',
    loginUrl: '/portal',
    slug: null,
    sameTab: true,
  },
]

export const ADMIN_TOOLS = [
  { id: 'ar', name: 'AR desk', href: '/admin/ar', blurb: 'Pull open invoices from QBO and email PDFs' },
  { id: 'qbo-push', name: 'Journal push', href: '/admin/qbo-push', blurb: 'Preview and post journal entries' },
  { id: 'sync', name: 'Clover sync', href: '/admin/sync', blurb: 'Manual POS pull (Reydel)' },
  { id: 'leads', name: 'Leads', href: '/admin/leads', blurb: 'Prospect pipeline' },
  { id: 'calls', name: 'Calls', href: '/admin/calls', blurb: 'Call notes' },
]

export function openClientPortal(client, { newTab = true } = {}) {
  const url = client.portalUrl
  if (!url) return
  if (client.sameTab || url.startsWith('/')) {
    window.location.href = url
    return
  }
  if (newTab) window.open(url, '_blank', 'noopener,noreferrer')
  else window.location.href = url
}
