import { useLayoutEffect, useRef, useState } from 'react'
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

function anchorDocTops(root) {
  return FLIGHT_STEP_IDS.map((id) => stepAnchor(root, id))
    .filter(Boolean)
    .map((el) => {
      const r = el.getBoundingClientRect()
      return r.top + window.scrollY
    })
}

function stripProgressFromScroll(root, scrollY, vh) {
  const tops = anchorDocTops(root)
  if (tops.length < 2) return 0
  const start = tops[0]
  const end = tops[tops.length - 1]
  if (end <= start) return 0
  const focal = scrollY + vh * 0.4
  return Math.max(0, Math.min(1, (focal - start) / (end - start)))
}

function pickStepIndex(root, vh) {
  const focal = window.scrollY + vh * 0.4
  const tops = anchorDocTops(root)
  if (!tops.length) return 0

  let best = 0
  let bestDist = Infinity
  tops.forEach((top, i) => {
    const d = Math.abs(focal - top)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

function pickSection(root, vh) {
  const idx = pickStepIndex(root, vh)
  return FLIGHT_STEP_IDS[idx] || 'nose'
}

function setFlightVars(root, vars) {
  const html = document.documentElement
  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
    html.style.setProperty(key, val)
  })
}

function runMotion(root, onHud, onStep) {
  const cards = () => [...root.querySelectorAll('[data-flight-card]')]

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    cards().forEach((el) => el.classList.add('is-visible'))
    setFlightVars(root, { '--flight-dim': '0', '--flight-strip-fill': '0.2' })
    const fillEl = root.querySelector('.m-flight-strip__fill')
    const beaconEl = root.querySelector('.m-flight-strip__beacon')
    if (fillEl) fillEl.style.width = '20%'
    if (beaconEl) beaconEl.style.left = '20%'
    onHud(HUD_BY_SECTION.portal)
    onStep(2)
    return () => {
      document.documentElement.style.removeProperty('--flight-strip-fill')
    }
  }

  let scrollEndTimer
  let loopActive = true
  let lastStep = -1
  let lastHudKey = ''

  const tick = () => {
    if (!loopActive) return
    const y = window.scrollY
    const vh = window.innerHeight
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
    const progress = y / maxScroll
    const fill = stripProgressFromScroll(root, y, vh)

    const sway = Math.sin(progress * Math.PI * 2.4) * 48
    const roll = progress * 14 - 7
    const driftLayer = -y * 0.55

    const fillPct = `${fill * 100}%`
    const fillEl = root.querySelector('.m-flight-strip__fill')
    const beaconEl = root.querySelector('.m-flight-strip__beacon')
    if (fillEl) fillEl.style.width = fillPct
    if (beaconEl) beaconEl.style.left = fillPct

    setFlightVars(root, {
      '--flight-scroll': String(progress),
      '--flight-strip-fill': String(fill),
      '--flight-sky-y': `${-y * 0.85}px`,
      '--flight-haze-y': `${-y * 1.2}px`,
      '--flight-orb-y': `${-y * 0.48}px`,
      '--flight-sky-scale': String(1.12 + progress * 0.12),
      '--flight-nose-opacity': String(Math.max(0, 1 - y / (vh * 0.62))),
      '--flight-nose-shift': `${-y * 0.32}px`,
      '--flight-debris-sway': `${sway}px`,
      '--flight-debris-roll': `${roll}deg`,
      '--flight-debris-y': `${driftLayer}px`,
      '--flight-contrail-shift': `${progress * 140}vw`,
    })

    const section = pickSection(root, vh)
    const stepIdx = pickStepIndex(root, vh)

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

    setFlightVars(root, { '--flight-dim': String(dim) })
    root.dataset.flightSection = section

    if (stepIdx !== lastStep) {
      lastStep = stepIdx
      onStep(stepIdx)
    }

    const hud = HUD_BY_SECTION[section] || HUD_BY_SECTION.nose
    const hudKey = `${hud.books}|${hud.sync}|${hud.login}`
    if (hudKey !== lastHudKey) {
      lastHudKey = hudKey
      onHud(hud)
    }

    cards().forEach((el) => {
      const r = el.getBoundingClientRect()
      const center = r.top + r.height * 0.4
      const dist = (center - vh * 0.45) / vh
      const lift = dist * 48
      const drift = dist * 24 * (el.closest('.m-flight__lane--right') ? 1 : -1)
      const scale = 1 - Math.min(0.06, Math.abs(dist) * 0.1)
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
    tick()
  }

  const loop = () => {
    if (!loopActive) return
    tick()
    window.requestAnimationFrame(loop)
  }

  tick()
  window.requestAnimationFrame(loop)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  return () => {
    loopActive = false
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.clearTimeout(scrollEndTimer)
    document.documentElement.style.removeProperty('--flight-strip-fill')
    document.documentElement.style.removeProperty('--flight-scroll')
  }
}

/**
 * Scroll-linked motion for the immersive home (parallax, dim, HUD, card lift, strip).
 */
export function useHomeFlightMotion(rootRef) {
  const [hud, setHud] = useState(HUD_BY_SECTION.nose)
  const [activeStep, setActiveStep] = useState(0)
  const hudRef = useRef(HUD_BY_SECTION.nose)

  useLayoutEffect(() => {
    let cleanup
    let rafId

    const attach = () => {
      const root = rootRef.current
      if (!root) return false
      cleanup = runMotion(root, (next) => {
        hudRef.current = next
        setHud(next)
      }, setActiveStep)
      return true
    }

    if (!attach()) {
      rafId = window.requestAnimationFrame(() => attach())
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [rootRef])

  return { hud, activeStep }
}
