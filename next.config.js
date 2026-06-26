/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'storage.googleapis.com'],
  },
  async redirects() {
    // The shul vote moved to its own project on saratogashteibel.org.
    // Keep old jknojokes.com/shul-vote links working for the 36 voters.
    return [
      {
        source: '/shul-vote',
        destination: 'https://saratogashteibel.org/shul-vote',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
