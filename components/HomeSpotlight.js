import { useEffect, useRef } from 'react'

export default function HomeSpotlight({ children, active }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--spot-x', `${x}%`)
      el.style.setProperty('--spot-y', `${y}%`)
    }

    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [active])

  return (
    <div ref={ref} className={`m-home-spot${active ? ' m-home-spot--on' : ''}`}>
      {children}
    </div>
  )
}
