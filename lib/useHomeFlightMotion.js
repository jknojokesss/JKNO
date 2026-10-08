import { useEffect, useState } from 'react'
import { FLIGHT_STEP_IDS } from './flightSteps'

export { FLIGHT_STEPS } from './flightSteps'

const HUD_BY_SECTION = {
  nose: { books: '···', sync: '···', login: '···' },
  books: { books: 'QBO', sync: '24h', login: '···' },
  portal: { books: 'QBO', sync: 'LIVE', login: '1 co' },
  samples: { books: 'DEMO', sync: 'OPEN', login: '···' },
  demos: { books: 'WALK', sync: '···', login: 'OPEN' },
  how: { books: 'BUILD', sync: '6d', login: '···' },
  contact: { books: 'START', sync: '···', login: 'YOU' },
}

function stepAnchor(root, stepId) {
  if (stepId === 'nose') return root.querySelector('#flight-intro')
  const card = root.querySelector(`[data-flight-card="${stepId}"]`)
  return card?.closest('.m-flight__lane') || document.getElementById(`flight-${stepId}`)
}

function stripProgress(root, y, vh) {
  const anchors = FLIGHT_STEP_IDS.map((id) => stepAnchor(root, id)).filter(Boolean)
  if (anchors.length < 2) return 0

  const tops = anchors.map((el) => {
    const r = el.getBoundingClientRect()
    return r.top + y - vh * 0.38
  })

  const max = tops[tops.length - 1]
  const min = tops[0]
  if (max <= min) return 0
  const scrollPos = y
  const t = (scrollPos - min) / (max - min)
  return Math.max(0, Math.min(1, t))
}

/**
 * Scroll-linked motion for the immersive home (parallax, dim, HUD, card lift, strip).
 */
export function useHomeFlightMotion(rootRef, live) {
  const [hud, setHud] = useState(HUD_BY_SECTION.nose)
  const [activeStep, setActiveStep] = useState(0)
  const [stripFill, setStripFill] = useState(0)

  useEffect(() => {
    if (!live) return undefined
    const root = rootRef.current
    if (!root) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      root.style.setProperty('--flight-dim', '0')
      root.style.setProperty('--flight-strip-fill', '0')
      setHud(HUD_BY_SECTION.portal)
      setActiveStep(2)
      setStripFill(0.35)
      return undefined
    }

    let raf = 0
    let scrollEndTimer

    const cards = () => [...root.querySelectorAll('[data-flight-card]')]
    const nose = root.querySelector('.m-flight__nose')

    const pickSection = () => {
      const mid = window.innerHeight * 0.4
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
      const fill = stripProgress(root, y, vh)

      root.style.setProperty('--flight-scroll', String(progress))
      root.style.setProperty('--flight-strip-fill', String(fill))
      root.style.setProperty('--flight-sky-y', `${-y * 0.72}px`)
      root.style.setProperty('--flight-haze-y', `${-y * 1.05}px`)
      root.style.setProperty('--flight-orb-y', `${-y * 0.38}px`)
      root.style.setProperty('--flight-sky-scale', String(1.12 + progress * 0.08))
      root.style.setProperty('--flight-nose-opacity', String(Math.max(0, 1 - y / (vh * 0.62))))
      root.style.setProperty('--flight-nose-shift', `${-y * 0.28}px`)

      const section = pickSection()
      const stepIdx = Math.max(0, FLIGHT_STEP_IDS.indexOf(section))

      const cardFocus = () => {
        if (section === 'nose') return 0
        const el = root.querySelector(`[data-flight-card="${section}"]`)
        if (!el) return 0
        const r = el.getBoundingClientRect()
        const center = r.top + r.height * 0.35
        return 1 - Math.min(1, Math.abs(center - vh * 0.45) / (vh * 0.5))
      }

      const dim =
        section === 'nose'
          ? Math.min(0.14, y / (vh * 3))
          : Math.min(0.58, 0.32 + Math.min(0.26, cardFocus()))

      root.style.setProperty('--flight-dim', String(dim))
      root.dataset.flightSection = section

      setStripFill((prev) => (Math.abs(prev - fill) < 0.002 ? prev : fill))
      setActiveStep((prev) => (prev === stepIdx ? prev : stepIdx))

      setHud((prev) => {
        const next = HUD_BY_SECTION[section] || HUD_BY_SECTION.nose
        if (prev.books === next.books && prev.sync === next.sync && prev.login === next.login) return prev
        return next
      })

      cards().forEach((el) => {
        const r = el.getBoundingClientRect()
        const center = r.top + r.height * 0.4
        const dist = (center - vh * 0.45) / vh
        const lift = dist * 58
        const drift = dist * 22 * (el.closest('.m-flight__lane--right') ? 1 : -1)
        const scale = 1 - Math.min(0.1, Math.abs(dist) * 0.16)
        const id = el.getAttribute('data-flight-card')
        el.style.setProperty('--flight-lift', `${lift}px`)
        el.style.setProperty('--flight-drift', `${drift}px`)
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

  return { hud, activeStep, stripFill }
}
