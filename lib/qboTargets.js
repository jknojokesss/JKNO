import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabaseAdmin'

// SERVER-SIDE ONLY.
//
// Where each client's QuickBooks data is written. Most clients land in the
// main project; clients with their own isolated Supabase project (Jerky
// Munch) get written there instead, so their books never sit in the shared
// database. The connection row itself (tokens) always lives in the main
// project — one place to see every connection's health.
//
// Adding an isolated client = one entry here + its service-role key in the
// environment. The target project must have the qbo_* tables (same migration
// as the main project).
const ISOLATED = {
  jerky: {
    url: 'https://jjcnzpicenrbxqrjqsnn.supabase.co',
    keyEnv: 'JERKY_SUPABASE_SERVICE_ROLE_KEY',
    label: "Jerky Munch's own project",
  },
}

const cache = {}

// Returns { db, label }. Falls back to the main project — with the reason —
// when an isolated client's key is missing, rather than silently writing a
// client's books somewhere they shouldn't go.
export function targetFor(clientSlug) {
  const iso = ISOLATED[clientSlug]
  if (!iso) return { db: supabaseAdmin, label: 'main project' }

  const key = process.env[iso.keyEnv]
  if (!key) {
    const err = new Error(`${clientSlug} is configured as isolated but ${iso.keyEnv} is not set — refusing to write its books to the main project.`)
    err.isConfig = true
    throw err
  }
  if (!cache[clientSlug]) {
    cache[clientSlug] = createClient(iso.url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return { db: cache[clientSlug], label: iso.label }
}

export const isolatedSlugs = Object.keys(ISOLATED)
