import { useEffect, useState } from 'react'

const HUD_BY_SECTION = {
  nose: { books: '···', sync: '···', login: '···' },
  books: { books: 'QBO', sync: '24h', login: '···' },
  portal: { books: 'QBO', sync: 'LIVE', login: '1 co' },
  samples: { books: 'DEMO', sync: 'OPEN', login: '···' },
  demos: { books: 'WALK', sync: '···', login: 'OPEN' },
  how: { books: 'BUILD', sync: '6d', login: '···' },
  contact: { books: 'START', sync: '···', login: 'YOU' },
}

/**
 * Scroll-linked motion for the immersive home (parallax, dim, HUD, card lift).
 */
export function useHomeFlightMotion(rootRef, live) {
  const [hud, setHud] = useState(HUD_BY_SECTION.nose)
  const [activeCard, setActiveCard] = useState(null)

  useEffect(() => {
    if (!live) return undefined
    const root = rootRef.current
    if (!root) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      root.style.setProperty('--flight-dim', '0')
      setHud(HUD_BY_SECTION.portal)
      return undefined
    }

    let raf = 0
    let scrollEndTimer

    const cards = () => [...root.querySelectorAll('[data-flight-card]')]
    const nose = root.querySelector('.m-flight__nose')

    const pickSection = () => {
      const mid = window.innerHeight * 0.42
      let best = 'nose'
      let bestDist = Infinity

      if (nose) {
        const nr = nose.getBoundingClientRect()
        if (nr.bottom > mid && nr.top < mid) return 'nose'
      }

      cards().forEach((el) => {
        const id = el.getAttribute('data-flight-card')
        const r = el.getBoundingClientRect()
        const c = r.top + r.height * 0.35
        const d = Math.abs(c - mid)
        if (d < bestDist && r.bottom > 80 && r.top < window.innerHeight - 80) {
          bestDist = d
          best = id
        }
      })
      return best
    }

    const tick = () => {
      raf = 0
      const y = window.scrollY
      const vh = window.innerHeight
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
      const progress = y / maxScroll

      root.style.setProperty('--flight-scroll', String(progress))
      root.style.setProperty('--flight-sky-y', `${-y * 0.42}px`)
      root.style.setProperty('--flight-haze-y', `${-y * 0.68}px`)
      root.style.setProperty('--flight-orb-y', `${-y * 0.22}px`)
      root.style.setProperty('--flight-nose-opacity', String(Math.max(0, 1 - y / (vh * 0.72))))
      root.style.setProperty('--flight-nose-shift', `${-y * 0.18}px`)

      const section = pickSection()

      const cardFocus = () => {
        if (section === 'nose') return 0
        const el = root.querySelector(`[data-flight-card="${section}"]`)
        if (!el) return 0
        const r = el.getBoundingClientRect()
        const center = r.top + r.height * 0.35
        return 1 - Math.min(1, Math.abs(center - vh * 0.45) / (vh * 0.55))
      }

      const dim =
        section === 'nose'
          ? Math.min(0.12, y / (vh * 4))
          : Math.min(0.52, 0.28 + Math.min(0.24, cardFocus()))

      root.style.setProperty('--flight-dim', String(dim))
      root.dataset.flightSection = section
      setHud((prev) => {
        const next = HUD_BY_SECTION[section] || HUD_BY_SECTION.nose
        if (prev.books === next.books && prev.sync === next.sync && prev.login === next.login) return prev
        return next
      })
      setActiveCard(section === 'nose' ? null : section)

      cards().forEach((el) => {
        const r = el.getBoundingClientRect()
        const center = r.top + r.height * 0.4
        const dist = (center - vh * 0.45) / vh
        const lift = dist * 36
        const scale = 1 - Math.min(0.08, Math.abs(dist) * 0.14)
        const id = el.getAttribute('data-flight-card')
        el.style.setProperty('--flight-lift', `${lift}px`)
        el.style.setProperty('--flight-scale', String(scale))
        el.classList.toggle('is-active', id === section)
      })
    }

    const onScroll = () => {
      root.classList.add('m-flight--scrolling')
      window.clearTimeout(scrollEndTimer)
      scrollEndTimer = window.setTimeout(() => {
        root.classList.remove('m-flight--scrolling')
      }, 120)
      if (!raf) raf = window.requestAnimationFrame(tick)
    }

    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(scrollEndTimer)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [live, rootRef])

  return { hud, activeCard }
}
