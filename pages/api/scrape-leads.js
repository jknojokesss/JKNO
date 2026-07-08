import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const config = { maxDuration: 60 }

// --- email extraction helpers ---
const JUNK = /\.(png|jpe?g|gif|svg|webp|css|js)$/i
const JUNK_DOMAINS = /(sentry|wixpress|example\.|godaddy|squarespace|\.wixsite|yourdomain|domain\.com|email\.com)/i
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

function extractEmail(html) {
  const found = html.match(EMAIL_RE) || []
  for (const e of found) {
    const email = e.toLowerCase()
    if (JUNK.test(email) || JUNK_DOMAINS.test(email)) continue
    return email
  }
  return null
}

async function fetchText(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadBot/1.0)' } })
    return await res.text()
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

async function findEmail(website) {
  try {
    const base = website.replace(/\/$/, '')
    let html = await fetchText(base)
    let email = extractEmail(html)
    if (email) return email
    // try a contact page
    for (const path of ['/contact', '/contact-us', '/about']) {
      html = await fetchText(base + path, 4000)
      email = extractEmail(html)
      if (email) return email
    }
  } catch {}
  return null
}

// --- Google Places (new) Text Search ---
async function searchPlaces(textQuery) {
  const places = []
  let pageToken
  for (let page = 0; page < 3; page++) {
    const body = { textQuery }
    if (pageToken) body.pageToken = pageToken
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,nextPageToken',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message || 'Places API error')
    if (data.places) places.push(...data.places)
    if (!data.nextPageToken) break
    pageToken = data.nextPageToken
  }
  return places
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { category, town } = req.body
  if (!category || !town) return res.status(400).json({ error: 'Missing category or town' })

  try {
    const query = `${category} in ${town}, NJ`
    const places = await searchPlaces(query)

    // scrape emails for those with a website, in parallel
    const withSites = places.filter((p) => p.websiteUri)
    const emails = await Promise.all(withSites.map((p) => findEmail(p.websiteUri)))

    const leads = withSites.map((p, i) => ({
      first_name: '',
      last_name: '',
      company: p.displayName?.text || '',
      email: emails[i] || '',
      title: '',
      city: town,
      phone: p.nationalPhoneNumber || '',
      sent: false,
    })).filter((l) => l.email)

    // dedupe against existing emails already in the table
    const { data: existing } = await supabase.from('outreach_contacts').select('email')
    const have = new Set((existing || []).map((r) => (r.email || '').toLowerCase()))
    const fresh = leads.filter((l) => !have.has(l.email.toLowerCase()))

    let inserted = []
    if (fresh.length) {
      const { data } = await supabase.from('outreach_contacts').insert(fresh).select()
      inserted = data || []
    }

    res.status(200).json({
      found: places.length,
      withWebsites: withSites.length,
      withEmails: leads.length,
      added: inserted.length,
      skippedDuplicates: leads.length - fresh.length,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
