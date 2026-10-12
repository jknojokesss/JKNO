// Shared faces for public sample portals — Inter + IBM Plex Mono + Barlow Semi
// Condensed (sharp UI, no Cormorant / Space Grotesk demo slop). Matches Reydel-
// style trades demos and homepage iframe embeds.

export const DEMO_UI = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const DEMO_HEAD = "'Barlow Semi Condensed', 'Inter', sans-serif"
export const DEMO_MONO = "'IBM Plex Mono', ui-monospace, monospace"

export const DEMO_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap'

export const DEMO_LOBBY_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap'

/** Paste into inline demo <style> blocks */
export const DEMO_RENDER_HINTS =
  'html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}' +
  'body{font-variant-numeric:tabular-nums}' +
  '.demo-portal-root{font-family:' +
  DEMO_UI +
  ';font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}' +
  '.demo-portal-root table{font-variant-numeric:tabular-nums}'

/** Add to the main app shell div on sample portal pages */
export const DEMO_PORTAL_ROOT_CLASS = 'demo-portal-root'
