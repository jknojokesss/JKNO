import { useEffect, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')

export default function HomePhoneShowcase() {
  const [phase, setPhase] = useState('home')
  const [motionOk, setMotionOk] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMotionOk(false)
      setPhase('portal')
      return undefined
    }
    let t = 0
    const ids = []
    const schedule = (fn, ms) => {
      ids.push(window.setTimeout(fn, ms))
    }
    const loop = () => {
      setPhase('home')
      schedule(() => setPhase('tap'), 2200)
      schedule(() => setPhase('portal'), 2800)
      schedule(loop, 7200)
    }
    schedule(() => setPhase('tap'), 1400)
    schedule(() => setPhase('portal'), 2000)
    schedule(loop, 6400)
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [])

  return (
    <div className="m-phone-stage" aria-label="Sample portal on a phone">
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className={`m-phone__screen${motionOk ? ` m-phone__screen--${phase}` : ' m-phone__screen--portal'}`}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__status" aria-hidden="true">9:41</div>
              <div className="m-phone__app-grid">
                <div className="m-phone__app">
                  <span className="m-phone__app-icon">JK</span>
                  <span className="m-phone__app-name">Portal</span>
                </div>
              </div>
              <span className="m-phone__tap-ring" aria-hidden="true" />
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
        Sample tire shop —{' '}
        <a href="/riverside-tires">open full demo</a>
      </p>
    </div>
  )
}
