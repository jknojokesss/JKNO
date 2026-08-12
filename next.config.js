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
