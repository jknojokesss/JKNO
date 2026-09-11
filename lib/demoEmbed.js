// Marketing iframes load demos with ?embed=1 so they skip first-visit modals
// and can trim chrome. Standalone visits keep the full experience.

export function isDemoEmbedQuery(query) {
  const v = query?.embed
  return v === '1' || v === 'true'
}

export function demoEmbedSrc(path) {
  const [base, qs = ''] = path.split('?')
  const params = new URLSearchParams(qs)
  params.set('embed', '1')
  const tail = params.toString()
  return tail ? `${base}?${tail}` : `${base}?embed=1`
}
