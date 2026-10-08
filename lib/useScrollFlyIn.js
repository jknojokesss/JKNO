import { useEffect } from 'react'

const FLY_SELECTORS = '[data-fly-in], [data-flight-card]'

function resolveRoot(root) {
  if (!root) return null
  if (typeof root === 'object' && 'current' in root) return root.current
  return root
}

/**
 * Adds .is-visible when fly-in targets enter the viewport (one-shot).
 * @param {HTMLElement | import('react').RefObject<HTMLElement | null> | null} root
 */
export function useScrollFlyIn(root, enabled = true, refreshKey = 0) {
  useEffect(() => {
    const el = resolveRoot(root)
    if (!enabled || !el) return undefined
    if (el.classList?.contains?.('m-flight-page')) {
      markFlightPageFlyIns(el)
    }
    const query = () => [...el.querySelectorAll(FLY_SELECTORS)]

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      query().forEach((n) => n.classList.add('is-visible'))
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
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    const observeAll = () => {
      query().forEach((n) => {
        if (!n.classList.contains('is-visible')) io.observe(n)
      })
    }

    observeAll()
    const raf = window.requestAnimationFrame(observeAll)

    return () => {
      window.cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [enabled, root, refreshKey])
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
