import { useEffect, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')

const TIMING = {
  home: 3200,
  press: 450,
  open: 750,
  hold: 5000,
}

/** Decorative home-screen apps — Riverside Tires is the one that opens the demo. */
const DECOY_APPS = [
  { label: 'Mail', glyph: 'M', hue: '#3b82f6' },
  { label: 'Photos', glyph: '🌸', hue: '#ec4899' },
  { label: 'Maps', glyph: '↑', hue: '#22c55e' },
  { label: 'Clock', glyph: '◷', hue: '#1e1e1e' },
  { label: 'Notes', glyph: '≡', hue: '#fbbf24' },
  { label: 'Weather', glyph: '☀', hue: '#38bdf8' },
  { label: 'Music', glyph: '♫', hue: '#f43f5e' },
  { label: 'Settings', glyph: '⚙', hue: '#6b7280' },
]

const RIVERSIDE_APP = {
  label: 'Riverside Tires',
  abbr: 'RT',
  hue: '#B0281C',
}

export default function HomePhoneShowcase() {
  const [phase, setPhase] = useState('home')
  const [motionOk, setMotionOk] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMotionOk(false)
      setPhase('hold')
      return undefined
    }

    const ids = []
    const schedule = (fn, ms) => {
      ids.push(window.setTimeout(fn, ms))
    }

    const cycleMs = TIMING.home + TIMING.press + TIMING.open + TIMING.hold

    const runCycle = () => {
      setPhase('home')
      schedule(() => setPhase('press'), TIMING.home)
      schedule(() => setPhase('open'), TIMING.home + TIMING.press)
      schedule(() => setPhase('hold'), TIMING.home + TIMING.press + TIMING.open)
    }

    schedule(runCycle, 700)
    const loopId = window.setInterval(runCycle, cycleMs)
    ids.push(loopId)
    return () => {
      ids.forEach((id) => {
        window.clearTimeout(id)
        window.clearInterval(id)
      })
    }
  }, [])

  const screenClass = motionOk
    ? `m-phone__screen m-phone__screen--${phase}`
    : 'm-phone__screen m-phone__screen--hold'

  return (
    <div className="m-phone-stage" aria-label="iPhone home screen — tap Riverside Tires to open the portal">
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className="m-phone__island" aria-hidden="true" />
          <div className={screenClass}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__wallpaper" aria-hidden="true" />
              <div className="m-phone__ios-bar">
                <span>9:41</span>
              </div>

              <div className="m-phone__ios-grid">
                {DECOY_APPS.slice(0, 4).map((app) => (
                  <div key={app.label} className="m-phone__app m-phone__app--decoy">
                    <span className="m-phone__app-icon" style={{ background: app.hue }}>{app.glyph}</span>
                    <span className="m-phone__app-name">{app.label}</span>
                  </div>
                ))}

                <div className="m-phone__app m-phone__app--rt">
                  <span className="m-phone__app-icon m-phone__app-icon--rt">{RIVERSIDE_APP.abbr}</span>
                  <span className="m-phone__app-name">{RIVERSIDE_APP.label}</span>
                  <span className="m-phone__finger" aria-hidden="true" />
                </div>

                {DECOY_APPS.slice(4).map((app) => (
                  <div key={app.label} className="m-phone__app m-phone__app--decoy">
                    <span className="m-phone__app-icon" style={{ background: app.hue }}>{app.glyph}</span>
                    <span className="m-phone__app-name">{app.label}</span>
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
              <iframe
                title="Riverside Tires demo"
                src={DEMO_SRC}
                className="m-phone__iframe"
                loading="lazy"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>
      </div>
      <p className="m-phone-stage__cap">
        Tap <strong>Riverside Tires</strong> —{' '}
        <a href="/riverside-tires">open full demo</a>
      </p>
    </div>
  )
}
