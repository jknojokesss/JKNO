import Head from 'next/head'
import LeaseBrokerPortal from '../components/samples/leaseBroker/LeaseBrokerPortal'

const PAGE_URL = 'https://jknojokes.com/lease-broker-crm'

export default function LeaseBrokerCrmPage() {
  return (
    <>
      <Head>
        <title>Parkway Lease Brokers — broker CRM (sample)</title>
        <meta name="robots" content="noindex" />
        <meta
          name="description"
          content="Sample CRM for independent auto lease brokers: dealer quotes, fees, lease-end pipeline, and referrals."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1A1F2E" />
        <meta property="og:title" content="Parkway Lease Brokers — sample CRM" />
        <meta property="og:description" content="Fictitious lease broker sample: quotes, fees, lease-end follow-up, and referrals." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <LeaseBrokerPortal />
    </>
  )
}
