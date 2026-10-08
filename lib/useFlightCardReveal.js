import { useLayoutEffect } from 'react'

/**
 * One-shot scroll reveal for homepage story cards ([data-flight-card]).
 */
export function useFlightCardReveal(rootRef) {
  useLayoutEffect(() => {
    let cancelled = false
    let io
    let removeScrollListeners

    const mount = () => {
      const root = rootRef.current
      if (!root) {
        if (!cancelled) window.requestAnimationFrame(mount)
        return
      }

      const cards = [...root.querySelectorAll('[data-flight-card]')]
      if (!cards.length) return

      root.classList.add('m-flight--reveal-ready')

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        cards.forEach((el) => el.classList.add('is-visible'))
        return
      }

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          })
        },
        {
          root: null,
          rootMargin: '0px 0px -14% 0px',
          threshold: [0.12, 0.2],
        },
      )

      cards.forEach((el) => io.observe(el))

      const syncVisible = () => {
        const vh = window.innerHeight
        cards.forEach((el) => {
          if (el.classList.contains('is-visible')) return
          const r = el.getBoundingClientRect()
          if (r.top < vh * 0.8 && r.bottom > vh * 0.12) {
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        })
      }

      syncVisible()
      window.addEventListener('scroll', syncVisible, { passive: true })
      window.addEventListener('resize', syncVisible, { passive: true })
      removeScrollListeners = () => {
        window.removeEventListener('scroll', syncVisible)
        window.removeEventListener('resize', syncVisible)
      }
    }

    mount()

    return () => {
      cancelled = true
      io?.disconnect()
      removeScrollListeners?.()
      rootRef.current?.classList.remove('m-flight--reveal-ready')
    }
  }, [rootRef])
}
