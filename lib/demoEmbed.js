// Marketing iframes load demos with ?embed=1 so they skip first-visit modals
// and can trim chrome. Standalone visits keep the full experience.

export function isDemoEmbedQuery(query) {
  const v = query?.embed
  return v === '1' || v === 'true'
}

/** Pages router — marketing iframes need embed known on first paint (query is empty until ready). */
export function getDemoEmbedServerProps(query) {
  return { props: { demoEmbed: isDemoEmbedQuery(query) } }
}

export const DEMO_EMBED_HIDE_LOBBY_CSS = '.m-sample-lobby{display:none!important}'

export function demoEmbedSrc(path) {
  const [base, qs = ''] = path.split('?')
  const params = new URLSearchParams(qs)
  params.set('embed', '1')
  const tail = params.toString()
  return tail ? `${base}?${tail}` : `${base}?embed=1`
}

/** Hero phone iframe — auto-rotates demo tabs while mounted. */
export function phoneDemoEmbedSrc(path) {
  const src = demoEmbedSrc(path)
  const join = src.includes('?') ? '&' : '?'
  return `${src}${join}phone=1`
}
