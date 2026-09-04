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

  const sizeRe = /(\d{3})[\s\/\\-]+(\d{2})[\s\/\\-]*[A-Za-z]{0,3}(\d{2})/i
  const iso = (s) => { const m = (s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}` : null }
  const getDoc = async (url) => new DOMParser().parseFromString(await (await fetch(url, { credentials: 'include' })).text(), 'text/html')

  const parseDoc = (doc) => {
    const out = []
    for (const tr of doc.querySelectorAll('tr')) {
      const cells = [...tr.cells].map((c) => (c.innerText || '').trim().replace(/\s+/g, ' '))
      if (cells.length < 6) continue
      const m = (cells[0] || '').match(/^(\d{6,})$/); if (!m) continue
      const desc = cells[3] || ''; const sm = desc.match(sizeRe)
      let brand = desc.replace(/^Item:\s*\S+\s*/i, ''); if (sm) brand = brand.slice(0, brand.indexOf(sm[0]))
      const status = cells[6] || ''; const im = status.match(/Invoiced:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      // "PO# STOCK" = a shelf/inventory buy; "PO# <name/number>" = a customer order.
      const pm = status.match(/PO#\s*(.+?)\s*$/i)
      const a = tr.querySelector('a[href*="orderdetail"]')
      out.push({
        web_id: m[1],
        order_date: iso(cells[1]),
        invoiced_date: im ? iso(im[0]) : null,
        size: sm ? `${sm[1]}/${sm[2]}/${sm[3]}` : null,
        qty: parseInt((cells[2] || '').replace(/[^0-9]/g, ''), 10) || null,
        unit_cost: parseFloat((cells[4] || '').replace(/[^0-9.]/g, '')) || null,
        description: brand.replace(/\s+/g, ' ').trim(),
        po_number: pm ? pm[1].trim().slice(0, 60) : null,
        detail: a ? a.getAttribute('href') : null,
      })
    }
    return out
  }

  try {
    const map = new Map()
    for (const p of PAGES) for (const r of parseDoc(await getDoc(`${BASE}/${p}`))) if (!map.has(r.web_id)) map.set(r.web_id, r)
    const rows = [...map.values()]

    // Fill blank costs (some cash orders) from the order-detail page.
    for (const r of rows) {
      // Cost priority (the server enforces it):
      //   1) the per-tire box price (already in r.unit_cost) always wins;
      //   2) if blank, leave unit_cost null so a later sync can fill it from the box;
      //   3) last resort — send the order total (cc charge = largest $ on the detail
      //      page) ÷ tires as derived_cost. The server only uses it for an order
      //      that's still blank on a later sync, so the box price gets first crack.
      if ((r.unit_cost == null || r.unit_cost <= 0) && r.detail) {
        try {
          const url = r.detail.startsWith('http') ? r.detail : `${BASE}/${r.detail.replace(/^\/?(productcart\/pc\/)?/, '')}`
          const nums = ((await getDoc(url)).body.innerText.match(/\$[\d,]+(?:\.\d{2})?/g) || [])
            .map((s) => parseFloat(s.replace(/[^0-9.]/g, ''))).filter((n) => n > 0)
          if (nums.length) {
            const total = Math.max(...nums)
            const q = r.qty && r.qty > 0 ? r.qty : 1
            r.derived_cost = +(total / q).toFixed(2)
          }
        } catch (e) {}
      }
      delete r.detail
    }

    const res = await fetch(`${APP}/api/weldon-import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-import-token': TOKEN },
      body: JSON.stringify({ orders: rows, seen: rows.map((r) => r.web_id) }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || res.status)
    const extra = j.cancel_skipped
      ? ` — ${j.cancel_skipped} missing, left them (scrape looked short)`
      : (j.canceled ? `, dropped ${j.canceled} canceled${j.canceled_ids?.length ? ` (${j.canceled_ids.join(', ')})` : ''}` : '')
    alert(`Weldon sync ✓  scanned ${j.received} orders, added ${j.inserted} new, filled ${j.backfilled || 0} costs, tagged ${j.po_tagged || 0} PO#s${extra}`)
  } catch (e) {
    alert('Weldon sync failed: ' + (e.message || e))
  }
})()
