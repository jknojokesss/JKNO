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
      // Roofing demo moved to its named route when it got the SRL branding.
      { source: '/roofing', destination: '/srl', permanent: false },
      // Reydel portal lives in jknojokesss/reydel (Vercel project `reydel`).
      // QBO nightly pull + Clover cron + Weldon import stay here so tokens
      // and the Intuit callback don't move. Swap the host when
      // reydel.jknojokes.com is attached. Leave /reset-password here —
      // recovery tokens sit in the URL hash and a redirect would drop them.
      // NOT /login — that is now the router page in pages/login.js that sends
      // each client to their own portal (Reydel clients included). A redirect
      // here would shadow it at the edge and send everyone to Reydel again.
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
        destination: `https://reydel.vercel.app${source}`,
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
