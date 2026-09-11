import LegalDoc from '../components/LegalDoc'

const SECTIONS = [
  {
    heading: '1. Agreement to Terms',
    body: 'By accessing or using jknojokes.com or any JK No Jokes Financials services you agree to be bound by these Terms of Service. If you do not agree to these terms do not use our services.',
  },
  {
    heading: '2. Description of Services',
    body: 'JK No Jokes Financials provides:',
    bullets: [
      'Custom financial dashboards and client portals',
      'Bookkeeping and financial reporting services',
      'AI-powered financial insights and analysis',
      'Bank account connectivity via Plaid',
      'POS system integration (Clover and others)',
    ],
  },
  {
    heading: '3. Client Accounts',
    body: 'To access your client portal you must have an account. You are responsible for:',
    bullets: [
      'Maintaining the confidentiality of your login credentials',
      'All activity that occurs under your account',
      'Notifying us immediately of any unauthorized access at jk@jknojokes.com',
    ],
  },
  {
    heading: '4. Financial Data and Bank Connectivity',
    body: 'By connecting your bank accounts through our platform you authorize JK No Jokes Financials to:',
    bullets: [
      'Access your transaction history in read-only mode via Plaid',
      'Store and process your financial data to provide our services',
      'Display your financial data within your client portal',
    ],
    footer: 'We do not have the ability to move, transfer, or initiate transactions in your bank accounts. Access is read-only.',
  },
  {
    heading: '5. Accuracy of Financial Information',
    body: 'While we strive to provide accurate financial reporting and insights:',
    bullets: [
      'Our services are not a substitute for professional accounting or tax advice',
      'You are responsible for verifying the accuracy of all financial data',
      'We are not responsible for decisions made based on information displayed in your dashboard',
      'Always consult a licensed accountant or CPA for tax preparation and compliance',
    ],
  },
  {
    heading: '6. Payment and Fees',
    body: 'Service fees are agreed upon separately in your client agreement. We reserve the right to modify fees with 30 days written notice. Failure to pay may result in suspension of access to your client portal.',
  },
  {
    heading: '7. Confidentiality',
    body: 'We treat all client financial data as strictly confidential. We will not share, sell, or disclose your financial information to any third party except as described in our Privacy Policy or as required by law.',
  },
  {
    heading: '8. Intellectual Property',
    body: 'The JK No Jokes Financials platform, dashboard technology, and all associated software are our proprietary property. You may not copy, reproduce, or reverse engineer any part of our platform.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'To the maximum extent permitted by law JK No Jokes Financials shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the fees paid by you in the three months prior to the claim.',
  },
  {
    heading: '10. Termination',
    body: 'Either party may terminate services with 30 days written notice. Upon termination you will have 30 days to export your data before it is permanently deleted from our systems.',
  },
  {
    heading: '11. Governing Law',
    body: 'These Terms shall be governed by the laws of the State of New Jersey without regard to its conflict of law provisions.',
  },
  {
    heading: '12. Changes to Terms',
    body: 'We reserve the right to modify these Terms at any time. Material changes will be communicated via email. Continued use of our services after changes constitutes acceptance of the new Terms.',
  },
  {
    heading: '13. Contact',
    body: 'Questions about these Terms? Contact us:',
    contact: true,
  },
]

export default function Terms() {
  return <LegalDoc title="Terms of Service" sections={SECTIONS} />
}
