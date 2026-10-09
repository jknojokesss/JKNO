import { useEffect } from 'react'

/**
 * Scroll fly-in for [data-home-card]. Fails open: content always ends up visible.
 */
export function useHomeCardReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const cards = () => [...root.querySelectorAll('[data-home-card]')]
    if (!cards().length) return undefined

    root.classList.add('m-home--reveal-pending')

    const reveal = (el) => {
      if (!el.classList.contains('is-visible')) el.classList.add('is-visible')
    }

    const sync = () => {
      const vh = window.innerHeight
      cards().forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.88 && r.bottom > vh * 0.05) reveal(el)
      })
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      cards().forEach(reveal)
      return () => root.classList.remove('m-home--reveal-pending')
    }

    sync()

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target)
            io.unobserve(entry.target)
          }
        })
      },
      { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.05 },
    )

    cards().forEach((el) => {
      if (!el.classList.contains('is-visible')) io.observe(el)
    })

    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync, { passive: true })

    const failsafe = window.setTimeout(() => {
      cards().forEach(reveal)
    }, 2500)

    return () => {
      window.clearTimeout(failsafe)
      io.disconnect()
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      root.classList.remove('m-home--reveal-pending')
    }
  }, [rootRef])
}
