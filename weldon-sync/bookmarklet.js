// Weldon "one-click" import bookmarklet (reference source).
//
// Runs in the user's own browser on weldontire.net (already past Cloudflare and
// logged in), scrapes the invoiced + open order pages, fills any blank costs
// from the order-detail page, and POSTs everything to /reydel-tire/api/weldon-import, which
// inserts only the new web_ids, backfills blank costs / PO#s, and drops
// orders missing *inside this scrape's date span* (cancels). Rows older than
// the oldest date the bookmarklet actually saw are left alone — they aged off
// Weldon's ~6-month invoiced page, they were not canceled. The minified
// javascript: version (with the real
// APP domain + token baked in) is what gets saved as a browser bookmark.
//
// Read-only on Weldon — it only GETs order pages; the only write is to our own DB.

(async () => {
  const APP   = 'https://YOUR-DASHBOARD-DOMAIN/reydel-tire'  // e.g. https://reydel.vercel.app/reydel-tire
  const TOKEN = 'REPLACE_WITH_WELDON_IMPORT_TOKEN'      // must match Vercel env WELDON_IMPORT_TOKEN
  const BASE  = 'https://www.weldontire.net/productcart/pc'
  const PAGES = ['_com_orderhistory.asp?show=invoiced&months=6', '_com_orderhistory.asp?show=open&months=3']

  const sizeRe = /(\\d{3})[\\s\\/\\\\-]+(\\d{2})[\\s\\/\\\\-]*[A-Za-z]{0,3}(\\d{2})/i
