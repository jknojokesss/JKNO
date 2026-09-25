import { useState, useEffect, useCallback, useRef } from 'react'
import { markHomeIntroSeen, shouldSkipHomeIntro } from '../lib/homeIntro'

const INTRO_LINE = 'Loading your customized portal...'

function introTiming() {
  const desktop =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
  const mobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
  const typeMs = desktop ? 26 : mobile ? 30 : 36
  const typeDone = INTRO_LINE.length * typeMs
  const markDelay = desktop ? 420 : mobile ? 380 : 650
  const afterType = desktop ? 320 : mobile ? 260 : 480
  const holdBeforeOut = desktop ? 520 : mobile ? 400 : 750
  const outDuration = desktop ? 320 : mobile ? 280 : 400
  return {
    typeMs,
    revealAt: markDelay + typeDone + afterType,
    outAt: markDelay + typeDone + afterType + holdBeforeOut,
    endAt: markDelay + typeDone + afterType + holdBeforeOut + outDuration,
    markDelay,
  }
}

function introShouldCover() {
  if (typeof window === 'undefined') return true
  return !shouldSkipHomeIntro()
}

export default function HomeIntro({ onStart, onReveal }) {
  const [active, setActive] = useState(introShouldCover)
  const [phase, setPhase] = useState('mark')
  const [typed, setTyped] = useState('')
  const doneRef = useRef(false)
  const onRevealRef = useRef(onReveal)
  const onStartRef = useRef(onStart)

  onRevealRef.current = onReveal
  onStartRef.current = onStart

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setTyped(INTRO_LINE)
    setPhase('out')
    window.setTimeout(() => {
      setActive(false)
      markHomeIntroSeen()
    }, 400)
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

    const t1 = window.setTimeout(() => setPhase('line'), t.markDelay)
    const t2 = window.setTimeout(() => {
      setPhase('reveal')
      onRevealRef.current?.()
    }, t.revealAt)
    const t3 = window.setTimeout(() => setPhase('out'), t.outAt)
    const t4 = window.setTimeout(finish, t.endAt)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
    }
  }, [finish])

  useEffect(() => {
    if (phase !== 'line' || doneRef.current) return undefined

    const { typeMs } = introTiming()
    setTyped('')
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTyped(INTRO_LINE.slice(0, i))
      if (i >= INTRO_LINE.length) window.clearInterval(id)
    }, typeMs)

    return () => window.clearInterval(id)
  }, [phase])

  if (!active) return null

  const progress = typed.length / INTRO_LINE.length

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
        <p className="m-intro__line" aria-live="polite">
          <span className="m-intro__type">{typed}</span>
          {phase === 'line' && typed.length < INTRO_LINE.length && (
            <span className="m-intro__cursor" aria-hidden="true" />
          )}
        </p>
        <div className="m-intro__progress" aria-hidden="true">
          <div className="m-intro__progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
