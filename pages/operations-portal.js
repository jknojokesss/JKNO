import dynamic from 'next/dynamic'

/** Client-only — avoids hydration crash when opening the cash desk (React #425 on marketing shell). */
const OperationsPortalSample = dynamic(() => import('../components/OperationsPortalSample'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f2f0ea',
        color: '#64748b',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      Loading sample…
    </div>
  ),
})

export default function OperationsPortalPage() {
  return <OperationsPortalSample />
}
