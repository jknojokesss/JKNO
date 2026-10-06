import { useEffect, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')

const TIMING = {
  home: 2800,
  press: 420,
  open: 700,
  hold: 4500,
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

    schedule(runCycle, 600)
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
    <div className="m-phone-stage" aria-label="Tap the app to open the sample portal">
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className={screenClass}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__status" aria-hidden="true">9:41</div>
              <div className="m-phone__app-grid">
                <button type="button" className="m-phone__app" tabIndex={-1} aria-hidden="true">
                  <span className="m-phone__app-icon">JK</span>
                  <span className="m-phone__app-name">Portal</span>
                </button>
              </div>
              <span className="m-phone__finger" aria-hidden="true" />
            </div>
            <div className="m-phone__scene m-phone__scene--portal">
              <iframe
                title="Tire shop demo preview"
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
        Tap the app —{' '}
        <a href="/riverside-tires">open full demo</a>
      </p>
    </div>
  )
}
