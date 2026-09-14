import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'jk-home-intro-seen'

export default function HomeIntro({ onDone }) {
  const [phase, setPhase] = useState('mark') // mark → line → burst → out
  const [gone, setGone] = useState(false)

  const finish = useCallback(() => {
    setPhase('out')
    window.setTimeout(() => {
      setGone(true)
      onDone?.()
      try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    }, 350)
  }, [onDone])

  useEffect(() => {
    const skip = typeof window !== 'undefined' && (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || sessionStorage.getItem(STORAGE_KEY)
    )
    if (skip) {
      setGone(true)
      onDone?.()
      return
    }

    document.body.style.overflow = 'hidden'
    const t1 = window.setTimeout(() => setPhase('line'), 550)
    const t2 = window.setTimeout(() => setPhase('burst'), 1300)
    const t3 = window.setTimeout(finish, 2400)

    return () => {
      document.body.style.overflow = ''
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [finish, onDone])

  useEffect(() => {
    if (gone) document.body.style.overflow = ''
  }, [gone])

  if (gone) return null

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
