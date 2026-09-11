import { useState, useEffect, useRef } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DESKTOP_W = 1120
const DESKTOP_H = 700
const MOBILE_BREAK = 768

export default function DemoPreview({ demos, onMoreDemos }) {
  const [activeDemo, setActiveDemo] = useState(0)
  const [demoReady, setDemoReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scale, setScale] = useState(1)
  const wrapRef = useRef(null)

  const active = demos[activeDemo] || demos[0]
  const embedSrc = demoEmbedSrc(active.src)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAK - 1}px)`)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isMobile || !wrapRef.current) return
    const el = wrapRef.current
    const update = () => setScale(el.clientWidth / DESKTOP_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobile, activeDemo])

  useEffect(() => {
    setDemoReady(false)
  }, [activeDemo, embedSrc])

  const onDemoPick = (i) => {
    if (i === activeDemo) return
    setActiveDemo(i)
  }

  const viewportHeight = isMobile
    ? Math.max(320, Math.round(DESKTOP_H * scale))
    : 'min(48vh, 520px)'

  return (
    <>
      <div id="demos" style={{ marginBottom: '10px' }}>
        <div className="m-demo-tabs">
          {demos.map((d, idx) => (
            <button key={d.label} className={`m-tab${activeDemo === idx ? ' is-active' : ''}`} onClick={() => onDemoPick(idx)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div id="demo-preview" className="m-demo-frame">
        <div className="m-demo-chrome">
          <span className="m-demo-dot" /><span className="m-demo-dot" /><span className="m-demo-dot" />
          <span className="m-demo-chrome-label">{active.label} — sample portal</span>
          <a href={active.src} target="_blank" rel="noopener noreferrer" className="m-demo-open-full">
            Open full ↗
          </a>
        </div>

        <div
          className="m-demo-viewport"
          style={{ height: viewportHeight, minHeight: '320px' }}
        >
          {!demoReady && (
            <div className="m-demo-loading m-demo-loading--overlay">Loading demo…</div>
          )}

          <div
            ref={wrapRef}
            className={isMobile ? 'm-demo-scale-wrap' : 'm-demo-desktop-wrap'}
          >
            <div
              className={isMobile ? 'm-demo-scale-inner' : undefined}
              style={isMobile ? { width: DESKTOP_W, height: DESKTOP_H, transform: `scale(${scale})` } : { height: '100%' }}
            >
              <iframe
                key={activeDemo}
                src={embedSrc}
                title={`${active.label} dashboard`}
                onLoad={() => setDemoReady(true)}
                style={{
                  width: isMobile ? DESKTOP_W : '100%',
                  height: isMobile ? DESKTOP_H : '100%',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#FAFAFA',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <p style={{ marginTop: '10px', fontSize: '13px', color: '#5A6577', lineHeight: 1.55 }}>
        {active.caption}{' '}
        {onMoreDemos && (
          <button className="m-btn--text" style={{ fontSize: '13px' }} onClick={onMoreDemos}>More demos →</button>
        )}
      </p>
    </>
  )
}
