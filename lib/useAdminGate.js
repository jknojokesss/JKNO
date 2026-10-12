import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/** Redirect to /admin when there is no admin session. */
export function useAdminGate(router) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (!session?.user?.email) {
        router.replace('/admin')
        return
      }
      const { data: adminRow } = await supabase
        .from('admins')
        .select('email')
        .eq('email', session.user.email)
        .maybeSingle()
      if (!adminRow) {
        await supabase.auth.signOut()
        router.replace('/admin')
        return
      }
      setUser(session.user)
      setReady(true)
    })
    return () => { cancelled = true }
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  return { user, ready, signOut }
}
