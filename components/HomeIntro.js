import { useState, useEffect, useCallback } from 'react'
import { markHomeIntroSeen, shouldSkipHomeIntro } from '../lib/homeIntro'

export default function HomeIntro({ onStart, onDone }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState('mark')

  const finish = useCallback(() => {
    setPhase('out')
    window.setTimeout(() => {
      setActive(false)
      document.body.style.overflow = ''
      onDone?.()
      markHomeIntroSeen()
    }, 350)
  }, [onDone])

  useEffect(() => {
    if (shouldSkipHomeIntro()) {
      onDone?.()
      return
    }

    setActive(true)
    onStart?.()
    document.body.style.overflow = 'hidden'

    const t1 = window.setTimeout(() => setPhase('line'), 900)
    const t2 = window.setTimeout(() => setPhase('burst'), 1800)
    const t3 = window.setTimeout(finish, 3000)

    return () => {
      document.body.style.overflow = ''
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [finish, onDone, onStart])

  if (!active) return null

  return (
    <button
      type="button"
      className={`m-intro m-intro--${phase}`}
      onClick={finish}
      aria-label="Enter site"
    >
      <div className="m-intro__burst" aria-hidden="true" />
      <div className="m-intro__inner">
        <div className="m-intro__mark">JK<span>.</span></div>
        <p className="m-intro__line">
          We build the software<br />behind your numbers.
        </p>
      </div>
    </button>
  )
}
