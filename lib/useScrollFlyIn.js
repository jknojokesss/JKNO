import { useEffect } from 'react'

const FLY_SELECTORS = '[data-fly-in], [data-flight-card]'

/**
 * Adds .is-visible when fly-in targets enter the viewport (one-shot).
 */
export function useScrollFlyIn(rootRef, enabled = true, refreshKey = 0) {
  useEffect(() => {
    if (!enabled) return undefined
    const root = rootRef?.current || document
    if (root?.classList?.contains?.('m-flight-page')) {
      markFlightPageFlyIns(root)
    }
    const query = () => [...(root.querySelectorAll?.(FLY_SELECTORS) || [])]
    let nodes = query()
    if (!nodes.length) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      nodes.forEach((n) => n.classList.add('is-visible'))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -18% 0px', threshold: 0.12 },
    )

    const observeAll = () => {
      nodes = query()
      nodes.forEach((n) => {
        if (!n.classList.contains('is-visible')) io.observe(n)
      })
    }

    observeAll()
    const raf1 = window.requestAnimationFrame(() => {
      observeAll()
      window.requestAnimationFrame(observeAll)
    })

    return () => {
      window.cancelAnimationFrame(raf1)
      io.disconnect()
    }
  }, [enabled, rootRef, refreshKey])
}

/** Tag inner marketing blocks for scroll fly-in (alternating lanes). */
export function markFlightPageFlyIns(rootEl) {
  if (!rootEl) return
  const blocks = rootEl.querySelectorAll('.m-inner-hero, .m-section')
  blocks.forEach((el, i) => {
    if (el.hasAttribute('data-fly-in')) return
    el.setAttribute('data-fly-in', '')
    el.dataset.flyLane = i % 2 === 0 ? 'left' : 'right'
  })
}
