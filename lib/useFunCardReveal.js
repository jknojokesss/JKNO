import { useEffect } from 'react'

/** Scroll fly-in for [data-fun-card] — fails open after 2.5s. */
export function useFunCardReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const cards = () => [...root.querySelectorAll('[data-fun-card]')]
    if (!cards().length) return undefined

    root.classList.add('m-fun--reveal-pending')

    const reveal = (el) => {
      if (!el.classList.contains('is-visible')) el.classList.add('is-visible')
    }

    const sync = () => {
      const vh = window.innerHeight
      cards().forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.9 && r.bottom > vh * 0.04) reveal(el)
      })
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      cards().forEach(reveal)
      return () => root.classList.remove('m-fun--reveal-pending')
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
      { rootMargin: '0px 0px -4% 0px', threshold: 0.06 },
    )

    cards().forEach((el) => {
      if (!el.classList.contains('is-visible')) io.observe(el)
    })

    window.addEventListener('scroll', sync, { passive: true })
    const failsafe = window.setTimeout(() => cards().forEach(reveal), 2500)

    return () => {
      window.clearTimeout(failsafe)
      io.disconnect()
      window.removeEventListener('scroll', sync)
      root.classList.remove('m-fun--reveal-pending')
    }
  }, [rootRef])
}
