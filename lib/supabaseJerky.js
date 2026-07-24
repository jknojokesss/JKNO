import { createClient } from '@supabase/supabase-js'

// ── Jerky Munch — Efraim's OWN isolated Supabase project ──────────────
// Data isolation lives here: this is a separate project from the main
// JK No Jokes database, with its own tables, auth users, and RLS.
// The anon key is PUBLIC by design (it ships in the browser bundle);
// Row Level Security is what actually protects the data.
//
// A distinct storageKey keeps this project's auth session from colliding
// with the main /login session in the same browser.
const JERKY_URL = 'https://jjcnzpicenrbxqrjqsnn.supabase.co'
const JERKY_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY256cGljZW5yYnhxcmpxc25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDI0MTAsImV4cCI6MjA5NzgxODQxMH0.aibevqF8qtx0nse7yVOIjeEXA39W-yp4eZEHOaYt768'

export const jerkySupabase = createClient(JERKY_URL, JERKY_ANON_KEY, {
  auth: {
    storageKey: 'jerky-munch-auth',
    persistSession: true,
    autoRefreshToken: true,
    // Bypass the Web Locks API. supabase-js uses navigator.locks to coordinate
    // token refresh across tabs, but that acquisition can hang indefinitely in
    // some embedded/dev browser contexts, leaving getSession() unresolved.
    // This app is single-user-per-browser, so a pass-through lock is safe.
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
})
