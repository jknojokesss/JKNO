import { createClient } from '@supabase/supabase-js'

// SERVER-SIDE ONLY. Uses the service-role key, which bypasses RLS.
// Never import this into a page/component that runs in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
