import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Old share links — sample is Westview Auto Group on the public site. */
export default function BuckleUpRedirect() {
  const router = useRouter()
  useEffect(() => {
    const q = router.asPath.includes('?') ? router.asPath.slice(router.asPath.indexOf('?')) : ''
    router.replace(`/westview-auto${q}`)
  }, [router])
  return null
}
