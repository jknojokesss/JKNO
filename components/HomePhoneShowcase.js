import { useEffect, useRef, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')

const TIMING = {
  home: 4200,
  approach: 1800,
  tap: 1100,
  pressed: 3800,
  open: 2800,
  hold: 12000,
}

function AppIcon({ label, glyph, hue, rt = false }) {
  return (
    <div className={`m-phone__app${rt ? ' m-phone__app--rt' : ''}`}>
      <span
        className={`m-phone__app-icon${rt ? ' m-phone__app-icon--rt' : ''}`}
        style={rt ? undefined : { background: hue }}
      >
        {glyph}
      </span>
      <span className="m-phone__app-name">{label}</span>
      {rt && (
        <>
          <span className="m-phone__press-ring" aria-hidden="true" />
          <span className="m-phone__finger" aria-hidden="true" />
        </>
      )}
    </div>
  )
}

/** Three rows × four icons — Riverside Tires row 2, column 1. */
const HOME_ROWS = [
  [
    { label: 'FaceTime', glyph: '📹', hue: '#22c55e' },
    { label: 'Calendar', glyph: '31', hue: '#fff' },
    { label: 'Photos', glyph: '🌸', hue: '#ec4899' },
    { label: 'Camera', glyph: '📷', hue: '#64748b' },
  ],
  [
    { label: 'Riverside Tires', glyph: 'RT', hue: '#B0281C', rt: true },
    { label: 'Mail', glyph: 'M', hue: '#3b82f6' },
    { label: 'Notes', glyph: '≡', hue: '#fbbf24' },
    { label: 'Reminders', glyph: '☑', hue: '#fff' },
  ],
  [
    { label: 'Maps', glyph: '↑', hue: '#22c55e' },
    { label: 'Weather', glyph: '☀', hue: '#38bdf8' },
    { label: 'Stocks', glyph: '📈', hue: '#1e1e1e' },
    { label: 'Settings', glyph: '⚙', hue: '#6b7280' },
  ],
]

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function captionForPhase(phase) {
  if (phase === 'approach' || phase === 'tap' || phase === 'pressed') {
    return 'press'
  }
  if (phase === 'open' || phase === 'hold') {
    return 'open'
  }
  return 'home'
}

export default function HomePhoneShowcase() {
  const stageRef = useRef(null)
  const [phase, setPhase] = useState('home')
  const [motionOk, setMotionOk] = useState(true)
  const [inView, setInView] = useState(false)
  const [loadDemo, setLoadDemo] = useState(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined

    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.6] },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMotionOk(false)
      setPhase('home')
      return undefined
    }

    if (!inView) {
      setPhase('home')
      return undefined
    }

    let cancelled = false

    const loop = async () => {
      await sleep(400)
      while (!cancelled && inView) {
        setPhase('home')
        await sleep(TIMING.home)
        if (cancelled) break
        setLoadDemo(true)
        setPhase('approach')
        await sleep(TIMING.approach)
        if (cancelled) break
        setPhase('tap')
        await sleep(TIMING.tap)
        if (cancelled) break
        setPhase('pressed')
        await sleep(TIMING.pressed)
        if (cancelled) break
        setPhase('open')
        await sleep(TIMING.open)
        if (cancelled) break
        setPhase('hold')
        await sleep(TIMING.hold)
      }
    }

    loop()
    return () => {
      cancelled = true
    }
  }, [inView])

  const screenClass = motionOk
    ? `m-phone__screen m-phone__screen--${phase}`
    : 'm-phone__screen m-phone__screen--home'

  const cap = captionForPhase(phase)

  return (
    <div
      ref={stageRef}
      className="m-phone-stage"
      aria-label="iPhone home screen — tap Riverside Tires to open the portal"
    >
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className="m-phone__island" aria-hidden="true" />
          <div className={screenClass}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__wallpaper" aria-hidden="true" />
              <div className="m-phone__ios-bar">
                <span>9:41</span>
              </div>

              <div className="m-phone__ios-pages">
                {HOME_ROWS.map((row, ri) => (
                  <div key={ri} className="m-phone__ios-row">
                    {row.map((app) => (
                      <AppIcon
                        key={app.label}
                        label={app.label}
                        glyph={app.glyph}
                        hue={app.hue}
                        rt={app.rt}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="m-phone__dock" aria-hidden="true">
                {['Phone', 'Safari', 'Messages', 'Music'].map((name) => (
                  <div key={name} className="m-phone__dock-icon" />
                ))}
              </div>
            </div>

            <div className="m-phone__scene m-phone__scene--portal">
              {loadDemo && (
                <iframe
                  title="Riverside Tires demo"
                  src={DEMO_SRC}
                  className="m-phone__iframe"
                  loading="eager"
                  tabIndex={-1}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="m-phone-stage__cap">
        {cap === 'press' && (
          <>
            Finger on <strong>Riverside Tires</strong> — watch it open
          </>
        )}
        {cap === 'open' && (
          <>
            <strong>Riverside Tires</strong> portal —{' '}
            <a href="/riverside-tires">open full demo</a>
          </>
        )}
        {cap === 'home' && (
          <>
            Home screen — tap <strong>Riverside Tires</strong> (
            <a href="/riverside-tires">full demo</a>)
          </>
        )}
      </p>
    </div>
  )
}
