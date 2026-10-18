import { money, changeColor, changePct, pct1, MUTED, INK } from './popinsanityUtils'
import { COMPARE_SHEET_CSS } from './popinsanitySheetCss'

export function CompareChange({ thisVal, priorVal, cost = false }) {
  const delta = priorVal != null ? thisVal - priorVal : null
  const color = changeColor(delta, { cost })
  const pct = priorVal ? changePct(thisVal, priorVal) : null
  if (delta == null) return <span className="pop-compare-num" style={{ color: MUTED }}>—</span>
  return (
    <span className="pop-compare-num" style={{ color }}>
      {money(delta)}
      {pct != null ? (
        <span className="pop-compare-pct">{pct >= 0 ? '+' : ''}{pct1(pct)}</span>
      ) : null}
    </span>
  )
}

export function CompareSheet({
  labelCol,
  thisCol,
  priorCol,
  changeCol,
  rows,
  footer,
  onRow,
  indentLabels = false,
  costChange = false,
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: COMPARE_SHEET_CSS }} />
      <div className="pop-compare-wrap">
        <div className="pop-compare-head">
          <span />
          <span className="pop-compare-num">{thisCol}</span>
          <span className="pop-compare-num">{priorCol}</span>
          <span className="pop-compare-num">{changeCol}</span>
        </div>
        {rows.map((r) => {
          const clickable = !!onRow
          return (
            <div
              key={r.key}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={[
                'pop-compare-line',
                r.indent ? 'pop-compare-line--indent' : '',
                r.bold ? 'pop-compare-line--sub' : '',
                clickable ? 'pop-click' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={clickable ? () => onRow(r) : undefined}
              onKeyDown={clickable ? (e) => e.key === 'Enter' && onRow(r) : undefined}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              <span className="pop-compare-label" style={{ fontWeight: r.bold ? 700 : 400, color: r.indent ? MUTED : INK }}>
                {r.label}
              </span>
              <span className="pop-compare-num" style={{ fontWeight: r.bold ? 700 : 400 }}>{money(r.this)}</span>
              <span className="pop-compare-num" style={{ color: MUTED }}>{money(r.prior)}</span>
              <CompareChange thisVal={r.this} priorVal={r.prior} cost={costChange} />
            </div>
          )
        })}
        {footer ? (
          <div className="pop-compare-line pop-compare-line--sub">
            <span className="pop-compare-label" style={{ fontWeight: 700 }}>{footer.label}</span>
            <span className="pop-compare-num" style={{ fontWeight: 700 }}>{money(footer.this)}</span>
            <span className="pop-compare-num" style={{ fontWeight: 700, color: MUTED }}>{money(footer.prior)}</span>
            <CompareChange thisVal={footer.this} priorVal={footer.prior} cost={costChange} />
          </div>
        ) : null}
      </div>
    </>
  )
}
