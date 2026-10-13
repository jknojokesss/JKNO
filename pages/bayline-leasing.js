import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Legacy URL — share /buckle-up instead. */
export default function BaylineLeasingRedirect() {
  const router = useRouter()
  useEffect(() => {
    const q = router.asPath.includes('?') ? router.asPath.slice(router.asPath.indexOf('?')) : ''
    router.replace(`/westview-auto${q}`)
  }, [router])
  return null
}
