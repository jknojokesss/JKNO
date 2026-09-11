import LegalDoc from '../components/LegalDoc'

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'JK No Jokes Financials ("we," "us," or "our") operates jknojokes.com and provides financial dashboard and bookkeeping services. This Privacy Policy explains how we collect, use, and protect your information.',
  },
  {
    heading: '2. Information We Collect',
    items: [
      { label: 'Information you provide', bullets: ['Full name', 'Email address', 'Business name', 'Financial and accounting data you share with us'] },
      { label: 'Information collected automatically', bullets: ['Bank transaction data (via Plaid, with your explicit authorization)', 'Business financial data including revenue, expenses, and profit figures', 'Usage data and log information when you access your client portal'] },
    ],
  },
  {
    heading: '3. How We Use Your Information',
    bullets: [
      'Provide and maintain your client financial dashboard',
      'Connect to your bank accounts and financial institutions via Plaid',
      'Generate financial reports, insights, and analytics',
      'Communicate with you about your account',
      'Improve our services',
    ],
  },
  {
    heading: '4. Data Storage',
    body: 'Your data is stored securely using Supabase, a secure cloud database provider. All data is encrypted at rest and in transit. We maintain your data only as long as necessary to provide our services or as required by law.',
  },
  {
    heading: '5. Third Party Services',
    body: 'We use the following third party services to operate our platform:',
    boldItems: [
      { label: 'Supabase', desc: 'secure cloud database storage' },
      { label: 'Plaid', desc: 'bank account connectivity and transaction data (jknojokes.com/plaid-privacy)' },
      { label: 'Anthropic', desc: 'AI-powered financial insights and analysis' },
      { label: 'Vercel', desc: 'website hosting' },
    ],
    footer: 'Each third party has their own privacy policy governing their use of your data.',
  },
  {
    heading: '6. Data Sharing',
    body: 'We do not sell your personal or financial data to any third party. We only share data with the service providers listed above as necessary to operate our platform. We may disclose your information if required by law or legal process.',
  },
  {
    heading: '7. Your Rights (New Jersey Residents)',
    body: 'As a New Jersey resident you have the right to:',
    bullets: ['Access the personal data we hold about you', 'Request correction of inaccurate data', 'Request deletion of your data', 'Opt out of any data sharing'],
    footer: 'To exercise any of these rights contact us at jk@jknojokes.com.',
  },
  {
    heading: '8. Security',
    body: 'We take reasonable technical and organizational measures to protect your data including encryption, secure access controls, and regular security reviews. However no system is completely secure and we cannot guarantee absolute security.',
  },
  {
    heading: '9. Children\'s Privacy',
    body: 'Our services are not directed at children under 13. We do not knowingly collect personal information from children.',
  },
  {
    heading: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated date.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have any questions about this Privacy Policy please contact us:',
    contact: true,
  },
]

export default function Privacy() {
  return <LegalDoc title="Privacy Policy" sections={SECTIONS} />
}
