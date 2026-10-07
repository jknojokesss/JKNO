import { DEMO_SCOPES } from '../lib/demoScope'

const mono = "'IBM Plex Mono', ui-monospace, monospace"
const sans = "'Inter', system-ui, sans-serif"

export default function DemoScopeBanner({ scope = 'template', compact = false }) {
  const copy = DEMO_SCOPES[scope] || DEMO_SCOPES.template

  if (compact) {
    return (
      <div
        style={{
          background: '#1a1c19',
          color: '#e8e4dc',
          padding: '10px 16px',
          fontFamily: sans,
          fontSize: '12px',
          lineHeight: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <strong style={{ color: '#f7f4ef', fontWeight: 600 }}>{copy.title}</strong>
        <span style={{ color: 'rgba(247,244,239,0.55)' }}> — {copy.body}</span>
      </div>
    )
  }

  return (
    <aside
      style={{
        background: '#f7f5f0',
        border: '1px solid #d8d4cc',
        borderLeft: '3px solid #c9a84c',
        padding: '14px 18px',
        margin: '0 0 20px',
        fontFamily: sans,
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontFamily: mono,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#6b6560',
        }}
      >
        {copy.label}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#1b1815', lineHeight: 1.35 }}>
        {copy.title}
      </p>
      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: '#4a4540', maxWidth: '72ch' }}>
        {copy.body}
      </p>
    </aside>
  )
}
