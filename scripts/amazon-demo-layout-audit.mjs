/** Shared DOM layout checks for the amazon demo (empty cards, text overflow). */

export const LAYOUT_WIDTHS = [390, 1280, 1440, 1920]

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
      if (el.querySelector('table tbody tr, svg.chart, .blist, .ov-prod-list li, .kv-rows .kv-row, ul.payout-list li, .mob-card-list .data-card, .conn-h, .report, .bs-grid, .aging, canvas, .empty, .rep-kpis, .mini, .dr-sec'))
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
