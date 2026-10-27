/** Shared DOM layout checks for the amazon demo (empty cards, text overflow). */

export const LAYOUT_WIDTHS = [360, 390, 430, 1280, 1440, 1920]

export const LAYOUT_ROUTES = [
  '#/overview',
  '#/report',
  '#/products',
  '#/shipments',
  '#/expenses',
  '#/inventory',
  '#/cash',
  '#/payables',
  '#/payout',
  '#/sources',
]

export async function auditMainLayout(page) {
  return page.evaluate(() => {
    const fails = []
    const main = document.querySelector('#main')
    if (!main) return { fails: ['missing #main'] }

    const isEmptyCard = (el) => {
      if (!el.classList.contains('card')) return false
      if (el.querySelector('table tbody tr, svg.chart, .blist, .ov-prod-list li, .ov-kpi-grid a, .kv-rows .kv-row, ul.payout-list li, .mob-card-list .data-card, .conn-h, .report, .bs-grid, .aging, canvas, .empty, .rep-kpis, .mini, .dr-sec, .inv-buckets, .inv-total, .fin-note'))
        return false
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
      if (text.length < 4) return true
      const h2 = el.querySelector('h2')
      if (h2 && text.length <= (h2.textContent || '').length + 6) return true
      return false
    }

    main.querySelectorAll('.card').forEach((el, i) => {
      if (isEmptyCard(el)) fails.push(`empty card: ${el.querySelector('h2')?.textContent || 'card ' + i}`)
    })

    main.querySelectorAll('.ov-box').forEach((box) => {
      const val = box.querySelector('.ov-box-val')
      if (!val) return
      const br = val.getBoundingClientRect()
      const bb = box.getBoundingClientRect()
      const pad = 2
      if (br.right > bb.right - pad || br.left < bb.left + pad) {
        const lbl = box.querySelector('.ov-box-lbl')?.textContent || 'KPI'
        fails.push(`overflow: "${lbl}" spills past box`)
      }
    })

    main.querySelectorAll('.stat-grid dd, .kpi .val, .rep-kpis strong').forEach((el) => {
      const cell = el.parentElement
      if (!cell) return
      const er = el.getBoundingClientRect()
      const cr = cell.getBoundingClientRect()
      if (er.right > cr.right + 0.5) {
        fails.push(`overflow: stat "${(el.textContent || '').slice(0, 20)}"`)
      }
    })

    const INSET = 12
    const textInsetSel =
      'h2, h3, .inv-total span, .inv-total strong, .inv-bucket-lbl, .inv-bucket-val strong, .inv-bucket-val small, .fin-note, .ov-prod-name, .ov-prod-line2, .prod-card-name, .prod-card-line2, .prod-card-meta, .data-card-t, .data-card-rows, .blist .nm, .blist .am, .blist .pc, .kv-row span, .kv-row strong, .panel-h .note, .stat-grid dt, .stat-grid dd, .payout-list li, .ship-card-id, .claim-card-meta, .aging-lbl, .aging-amt, .tools, .empty, .show-more'
    main.querySelectorAll('.card').forEach((card) => {
      const cr = card.getBoundingClientRect()
      if (cr.width < 40) return
      card.querySelectorAll(textInsetSel).forEach((el) => {
        if (el.closest('.tbl-wrap, .report, table')) return
        if (!el.offsetParent && !el.getClientRects().length) return
        const st = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (r.width < 4 || r.height < 4) return
        const pl = parseFloat(st.paddingLeft) || 0
        const pr = parseFloat(st.paddingRight) || 0
        const textLeft = r.left + pl
        const textRight = r.right - pr
        const label = (el.className || el.tagName).toString().slice(0, 36)
        if (textLeft < cr.left + INSET - 1) {
          fails.push(`inset <${INSET}px left: ${label}`)
        }
        if (textRight > cr.right - INSET + 1) {
          fails.push(`inset <${INSET}px right: ${label}`)
        }
      })
    })

    const gapMin = 4
    const rowGroups = [
      '.ov-prod-line2',
      '.prod-card-line2',
      '.inv-total',
      '.data-card-rows div',
      '.ship-card-top',
      '.claim-card-top',
    ]
    rowGroups.forEach((sel) => {
      main.querySelectorAll(sel).forEach((row) => {
        const kids = [...row.children].filter((c) => {
          const t = (c.textContent || '').trim()
          return t.length > 0 && c.getBoundingClientRect().height > 0
        })
        for (let i = 0; i < kids.length - 1; i++) {
          const a = kids[i].getBoundingClientRect()
          const b = kids[i + 1].getBoundingClientRect()
          const sameRow = Math.abs(a.top - b.top) < 14 && Math.abs(a.bottom - b.bottom) < 14
          if (!sameRow) continue
          const gap = b.left - a.right
          if (gap < gapMin - 0.5) {
            fails.push(`row gap <${gapMin}px: "${(kids[i].textContent || '').trim().slice(0, 12)}" / "${(kids[i + 1].textContent || '').trim().slice(0, 12)}"`)
          }
          if (a.right > b.left + 0.5) {
            fails.push(`row overlap: "${(kids[i].textContent || '').trim().slice(0, 12)}" / "${(kids[i + 1].textContent || '').trim().slice(0, 12)}"`)
          }
        }
      })
    })

    main.querySelectorAll('.ov-prod-body, .prod-card-body').forEach((body) => {
      const hideHost = body.closest('.prod-cards, .ov-prod-list')
      if (hideHost && getComputedStyle(hideHost).display === 'none') return
      const st = getComputedStyle(body)
      if (st.display === 'none' || st.visibility === 'hidden') return
      const name = body.querySelector('.ov-prod-name, .prod-card-name')
      const line2 = body.querySelector('.ov-prod-line2, .prod-card-line2')
      if (!name || !line2) return
      const nr = name.getBoundingClientRect()
      const lr = line2.getBoundingClientRect()
      if (nr.height < 2 || lr.height < 2) return
      if (lr.top - nr.bottom < gapMin - 0.5) {
        fails.push('product name touches metrics line')
      }
    })

    return { fails }
  })
}

export async function runLayoutAudits(page, base, routes = LAYOUT_ROUTES, widths = LAYOUT_WIDTHS) {
  const allFails = []
  for (const width of widths) {
    for (const route of routes) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('#main', { timeout: 15000 })
      await page.waitForTimeout(250)
      const { fails } = await auditMainLayout(page)
      fails.forEach((f) => allFails.push(`${width}px ${route}: ${f}`))
    }
  }
  return allFails
}
