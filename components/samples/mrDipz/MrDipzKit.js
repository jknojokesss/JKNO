import { CHAR, SPICE, KRAFT, CREAM, CARDBG, INK, MUTED, BORDER, UI, MONO } from './mrDipzUtils'

export const SHELL_CSS = `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${CREAM};font-family:${UI};color:${INK}}
.md-shell{display:flex;min-height:100vh;align-items:stretch}
.md-side{width:236px;flex-shrink:0;background:${CHAR};color:${CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.md-nav{display:flex;flex-direction:column;gap:3px}.md-nav--main{flex:1}
.md-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.md-navbtn:hover{background:rgba(255,255,255,.08);color:${CREAM}}
.md-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.md-click{transition:box-shadow .12s;cursor:pointer}.md-click:hover{box-shadow:inset 0 0 0 1.5px ${SPICE}}
.md-card{background:${CARDBG};border:1px solid ${BORDER};border-radius:2px;padding:20px;margin-bottom:16px}
.md-lbl{font-family:${UI};font-size:11px;font-weight:600;letter-spacing:.7px;text-transform:uppercase;color:${KRAFT}}
.md-kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.md-kpi{flex:1;min-width:150px;padding:15px 17px;text-align:left;position:relative;background:${CARDBG};border:1px solid ${BORDER};border-radius:2px;font-family:${UI};color:${INK}}
.md-kpi-v{font-family:${UI};font-weight:700;letter-spacing:-.4px;font-size:29px;line-height:1.15;margin-top:4px;white-space:nowrap;font-variant-numeric:tabular-nums}
.md-kpi-sub{font-size:12px;color:#A2937A;margin-top:3px}
.md-chev{position:absolute;top:11px;right:13px;color:#C6B79A;font-size:15px}
.md-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px}
.md-stat{background:${CARDBG};border:1px solid ${BORDER};border-radius:2px;padding:12px 14px;text-align:left;font-family:${UI};color:${INK};position:relative}
.md-stat-v{font-weight:700;font-size:20px;margin-top:3px;white-space:nowrap;font-variant-numeric:tabular-nums}
.md-back{display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
.md-backbtn{font-family:${UI};font-weight:600;font-size:13px;padding:8px 14px;min-height:40px;border:1px solid ${BORDER};background:${CARDBG};color:${INK};border-radius:2px;cursor:pointer}
.md-dtitle{font-family:${UI};font-weight:700;font-size:22px;letter-spacing:-.2px;color:${INK};line-height:1.2}
.md-dsub{font-size:12px;color:${MUTED};margin:4px 0 14px}
.md-t{font-family:${MONO};font-size:13px}
.md-t-row{display:grid;grid-template-columns:var(--md-cols);align-items:center;padding:9px 6px;border-top:1px solid ${CREAM};border-radius:2px}
.md-t-head{border-top:none;padding-top:0;padding-bottom:8px;align-items:end}
.md-t-h{font-family:${UI};font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};text-align:right;line-height:1.25}
.md-t-head .md-t-name{font-family:${UI};font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${MUTED}}
.md-t-name{font-family:${UI};font-size:14px;color:${INK};min-width:0;line-height:1.3;padding-right:8px}
.md-t-sub{display:block;font-size:11px;color:${MUTED};margin-top:1px}
.md-t-cv{color:#C9BBA0;font-size:12px;margin-left:4px}
.md-num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.md-t-row--indent .md-t-name{padding-left:14px}
.md-t-row--group{background:${CREAM};border-top:1px solid ${BORDER}}
.md-t-row--group .md-t-name,.md-t-row--group .md-num{font-weight:700}
.md-t-row--total{border-top:1px solid ${BORDER}}
.md-t-row--total .md-t-name,.md-t-row--total .md-num{font-weight:700}
.md-tag{display:inline-block;font-family:${UI};font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;padding:2px 7px;border-radius:10px;margin-left:6px;vertical-align:1px}
@media(max-width:860px){.md-shell{flex-direction:column}.md-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.md-nav--main{flex-direction:row;overflow-x:auto;gap:6px;padding:4px 4px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.md-nav::-webkit-scrollbar{display:none}.md-navbtn{width:auto;padding:8px 14px;border-radius:2px;background:rgba(255,255,255,.07);flex-shrink:0;font-size:13px;min-height:40px}.md-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:600px){button{min-height:40px}.md-card{padding:14px}.md-kpi{padding:13px 14px}.md-kpi-v{font-size:21px}.md-stat-v{font-size:17px}
.md-t{font-size:var(--md-fs-m)}
.md-t-row{grid-template-columns:var(--md-cols-m);column-gap:6px;padding:9px 2px}
.md-t-name{font-size:13px}
.md-t-row--indent .md-t-name{padding-left:8px}
.md-t--stack .md-t-row{justify-content:space-between;column-gap:4px;row-gap:3px}
.md-t--stack .md-t-name{grid-column:1/-1;padding-right:0}
.md-t--stack .md-t-head .md-t-name{display:none}
.md-t-h{font-size:9px;letter-spacing:.3px}}`

export function Card({ title, children }) {
  return (
    <div className="md-card">
      {title ? (
        <div className="md-lbl" style={{ marginBottom: 12 }}>
          {title}
        </div>
      ) : null}
      {children}
    </div>
  )
}

export function KPI({ k, v, sub, subColor, accent, onClick }) {
  return (
    <button type="button" className="md-kpi md-click" onClick={onClick}>
      <div className="md-lbl">{k}</div>
      <div className="md-kpi-v md-num" style={{ textAlign: 'left', color: accent || INK }}>
        {v}
      </div>
      {sub ? (
        <div className="md-kpi-sub" style={subColor ? { color: subColor, fontWeight: 600 } : undefined}>
          {sub}
        </div>
      ) : null}
      <span className="md-chev">›</span>
    </button>
  )
}

export function Stat({ k, v, color, onClick }) {
  const inner = (
    <>
      <div className="md-lbl" style={{ fontSize: 10 }}>
        {k}
      </div>
      <div className="md-stat-v md-num" style={{ textAlign: 'left', color: color || INK }}>
        {v}
      </div>
    </>
  )
  if (!onClick) return <div className="md-stat">{inner}</div>
  return (
    <button type="button" className="md-stat md-click" onClick={onClick}>
      {inner}
      <span className="md-chev" style={{ top: 9, right: 11 }}>
        ›
      </span>
    </button>
  )
}

/**
 * Name column + fixed-width number columns sized in `ch` from the longest value, so headers
 * sit over their numbers. Four or more number columns stack under the name on phones.
 */
export function MdTable({ columns, rows, stackAt = 4 }) {
  const numCols = columns.slice(1)
  const ws = numCols.map((c, j) =>
    Math.max(4, Math.ceil(String(c).length * 0.7), ...rows.map((r) => String(r.cells[j] ?? '').length)),
  )
  const stack = numCols.length >= stackAt
  const totalCh = ws.reduce((a, b) => a + b, 0) + numCols.length - 1
  const phoneFs = stack ? (totalCh <= 44 ? 11 : 10) : 12
  const desk = `minmax(0,1fr) ${ws.map((w) => `${w + 2}ch`).join(' ')}`
  const phone = stack ? ws.map((w) => `${w}ch`).join(' ') : `minmax(0,1fr) ${ws.map((w) => `${w}ch`).join(' ')}`
  return (
    <div
      className={`md-t${stack ? ' md-t--stack' : ''}`}
      style={{ '--md-cols': desk, '--md-cols-m': phone, '--md-fs-m': `${phoneFs}px` }}
    >
      <div className="md-t-row md-t-head">
        <span className="md-t-name">{columns[0]}</span>
        {numCols.map((c) => (
          <span key={c} className="md-t-h">
            {c}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const cls = ['md-t-row', r.kind ? `md-t-row--${r.kind}` : '', r.indent ? 'md-t-row--indent' : '', r.onClick ? 'md-click' : '']
          .filter(Boolean)
          .join(' ')
        return (
          <div
            key={r.key}
            className={cls}
            role={r.onClick ? 'button' : undefined}
            tabIndex={r.onClick ? 0 : undefined}
            onClick={r.onClick}
            onKeyDown={r.onClick ? (e) => e.key === 'Enter' && r.onClick() : undefined}
          >
            <span className="md-t-name">
              {r.name}
              {r.tag || null}
              {r.onClick ? <span className="md-t-cv">›</span> : null}
              {r.sub ? <span className="md-t-sub">{r.sub}</span> : null}
            </span>
            {r.cells.map((c, j) => (
              <span key={j} className="md-num" style={r.colors?.[j] ? { color: r.colors[j] } : undefined}>
                {c}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function Tag({ children, color }) {
  return (
    <span className="md-tag" style={{ color, background: CREAM, border: `1px solid ${BORDER}` }}>
      {children}
    </span>
  )
}
