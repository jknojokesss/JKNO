import { useState, useEffect, useCallback, useRef } from 'react'
import { markHomeIntroSeen, shouldSkipHomeIntro } from '../lib/homeIntro'

function introTiming() {
  const mobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
  const hold = mobile ? 520 : 680
  const revealAt = mobile ? 280 : 360
  const outAt = revealAt + hold
  const endAt = outAt + 320
  return { revealAt, outAt, endAt }
}

function introShouldCover() {
  if (typeof window === 'undefined') return true
  return !shouldSkipHomeIntro()
}

export default function HomeIntro({ onStart, onReveal }) {
  const [active, setActive] = useState(introShouldCover)
  const [phase, setPhase] = useState('mark')
  const doneRef = useRef(false)
  const onRevealRef = useRef(onReveal)
  const onStartRef = useRef(onStart)

  onRevealRef.current = onReveal
  onStartRef.current = onStart

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('out')
    window.setTimeout(() => {
      setActive(false)
      markHomeIntroSeen()
    }, 320)
  }, [])

  useEffect(() => {
    if (doneRef.current) return

    if (shouldSkipHomeIntro()) {
      doneRef.current = true
      setActive(false)
      onRevealRef.current?.()
      return
    }

    onStartRef.current?.()

    const t = introTiming()
    const t0 = window.setTimeout(() => setPhase('mark'), 0)
    const t1 = window.setTimeout(() => {
      setPhase('reveal')
      onRevealRef.current?.()
    }, t.revealAt)
    const t2 = window.setTimeout(() => setPhase('out'), t.outAt)
    const t3 = window.setTimeout(finish, t.endAt)

    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [finish])

  if (!active) return null

  return (
    <div
      role="button"
      tabIndex={0}
      className={`m-intro m-intro--${phase}`}
      onClick={() => {
        onRevealRef.current?.()
        finish()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRevealRef.current?.()
          finish()
        }
      }}
      aria-label="Enter site"
    >
      <button
        type="button"
        className="m-intro__skip"
        onClick={(e) => {
          e.stopPropagation()
          onRevealRef.current?.()
          finish()
        }}
      >
        Skip
      </button>

      <div className="m-intro__inner">
        <div className="m-intro__mark">
          <span className="m-intro__j">J</span><span className="m-intro__k">K</span><span className="m-intro__dot">.</span>
        </div>
      </div>
    </div>
  )
}
