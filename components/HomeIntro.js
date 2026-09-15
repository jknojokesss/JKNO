import { useState, useEffect, useCallback, useRef } from 'react'
import { markHomeIntroSeen, shouldSkipHomeIntro } from '../lib/homeIntro'

const CHIPS = [
  { text: 'margin', left: '6%', top: '14%', r: -14 },
  { text: 'profit', left: '78%', top: '11%', r: 11 },
  { text: 'QuickBooks', left: '4%', top: '52%', r: -8 },
  { text: 'register', left: '82%', top: '38%', r: 16 },
  { text: 'COGS', left: '44%', top: '6%', r: -20 },
  { text: 'inventory', left: '18%', top: '78%', r: 9 },
  { text: 'RO #4812', left: '68%', top: '72%', r: -12 },
  { text: '$4,820 AR', left: '2%', top: '32%', r: 7 },
  { text: '38.2%', left: '52%', top: '82%', r: -16 },
  { text: 'PO #1042', left: '86%', top: '58%', r: 13 },
  { text: 'job cost', left: '34%', top: '22%', r: 10 },
  { text: 'rent roll', left: '58%', top: '48%', r: -9 },
]

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

    const t1 = window.setTimeout(() => setPhase('line'), 700)
    const t2 = window.setTimeout(() => setPhase('scatter'), 1500)
    const t3 = window.setTimeout(() => {
      setPhase('snap')
      onRevealRef.current?.()
    }, 2600)
    const t4 = window.setTimeout(() => setPhase('out'), 4000)
    const t5 = window.setTimeout(finish, 4400)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
      window.clearTimeout(t5)
    }
  }, [finish])

  if (!active) return null

  return (
    <button
      type="button"
      className={`m-intro m-intro--${phase}`}
      onClick={() => {
        onRevealRef.current?.()
        finish()
      }}
      aria-label="Enter site"
    >
      {CHIPS.map((chip) => (
        <span
          key={chip.text}
          className="m-intro__chip"
          style={{
            left: chip.left,
            top: chip.top,
            '--r': `${chip.r}deg`,
          }}
          aria-hidden="true"
        >
          {chip.text}
        </span>
      ))}

      <div className="m-intro__inner">
        <div className="m-intro__mark">JK<span>.</span></div>
        <p className="m-intro__line">
          Custom portals<br />for your books.
        </p>
      </div>
    </button>
  )
}
