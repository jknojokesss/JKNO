/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'storage.googleapis.com'],
  },
  async redirects() {
    // The shul vote moved to its own project on saratogashteibel.org.
    // Keep old jknojokes.com/shul-vote links working for the 36 voters.
    // Host-scoped so this NEVER fires when saratogashteibel.org is (even
    // briefly, mid-propagation) served by this project — avoids a self-loop.
    return [
      // The roofing and fencing demos were named after the real prospects they
      // were built for. Renamed to invented businesses; these keep any link
      // already sent out working. Delete them once nothing points here.
      { source: '/roofing', destination: '/riverstone-roofing', permanent: false },
      { source: '/srl', destination: '/riverstone-roofing', permanent: false },
      { source: '/quefence', destination: '/riverbend-fence', permanent: false },
      // Reydel portal lives in jknojokesss/reydel under /reydel-tire.
      // QBO nightly pull + Intuit connect/callback stay here (token rotation).
      // Clover cron + Weldon import moved to the reydel project — do not
      // re-add /api/cron/clover-sync here or two syncs will race.
      // Leave /reset-password here — recovery tokens sit in the URL hash and
      // a redirect would drop them. NOT /login — that is the router page.
      ...[
        '/dashboard',
        '/financials',
        '/inventory',
        '/orders',
        '/stock',
        '/ai',
        '/admin/sync',
        '/admin/qbo-push',
      ].map((source) => ({
        source,
        destination: `https://reydel.vercel.app/reydel-tire${source}`,
        permanent: false,
      })),
      {
        source: '/shul-vote',
        has: [{ type: 'host', value: 'jknojokes.com' }],
        destination: 'https://saratogashteibel.org/shul-vote',
        permanent: false,
      },
      {
        source: '/shul-vote',
        has: [{ type: 'host', value: 'www.jknojokes.com' }],
        destination: 'https://saratogashteibel.org/shul-vote',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
