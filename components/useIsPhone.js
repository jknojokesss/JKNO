import { useState, useEffect } from 'react'

// True on a phone-width screen. Starts false so the server render and the
// first client render agree; the switch happens in an effect.
export default function useIsPhone(breakpoint = 700) {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const sync = () => setPhone(mq.matches)
    sync()
    mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync)
    return () => { mq.removeEventListener ? mq.removeEventListener('change', sync) : mq.removeListener(sync) }
  }, [breakpoint])
  return phone
}
