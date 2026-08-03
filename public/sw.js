// Jerky Munch PWA service worker — makes the app installable + resilient on flaky
// connections. Conservative on purpose: only same-origin GETs are cached, and
// navigations are network-FIRST so a fresh deploy always wins. Supabase/auth
// (cross-origin) requests are never intercepted.
const CACHE = 'jerky-munch-v1'
const SHELL = '/jerky-munch'

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)).catch(() => {}))
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // never touch Supabase / cross-origin

  // Pages: network-first so new deploys and live data always win; cache as fallback.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(SHELL, copy)); return res })
        .catch(() => caches.match(req).then((r) => r || caches.match(SHELL)))
    )
    return
  }

  // Same-origin static assets: stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) } return res })
        .catch(() => cached)
      return cached || fetched
    })
  )
})
