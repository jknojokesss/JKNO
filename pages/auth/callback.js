import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        // Handle the hash fragment from OAuth redirect
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            router.push('/dashboard')
          } else {
            router.push('/')
          }
        })
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F4EF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        letterSpacing: '3px',
        color: '#C9A84C',
      }}>
        SIGNING IN...
      </div>
    </div>
  )
}
