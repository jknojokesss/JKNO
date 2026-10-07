const MOLD_PIECES = 6

/**
 * Gold-wrapped candy bar — company on the label, industry as the variety line.
 */
export default function ChocolateBarLink({
  href,
  name,
  industry,
  className = '',
  here = false,
  wide = false,
}) {
  const wideFlavor = wide || (className && className.includes('wide'))

  return (
    <a
      href={href}
      className={[
        'jk-candy-bar',
        here && 'jk-candy-bar--here',
        wideFlavor && 'jk-candy-bar--wide',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="jk-candy-bar__crimp jk-candy-bar__crimp--left" aria-hidden="true" />
      <span className="jk-candy-bar__face">
        <span className="jk-candy-bar__mold" aria-hidden="true">
          {Array.from({ length: MOLD_PIECES }, (_, i) => (
            <span key={i} className="jk-candy-bar__piece" />
          ))}
        </span>
        <span className="jk-candy-bar__foil" aria-hidden="true" />
        <span className="jk-candy-bar__label">
          <span className="jk-candy-bar__name">{name}</span>
          {industry ? <span className="jk-candy-bar__variety">{industry}</span> : null}
        </span>
      </span>
      <span className="jk-candy-bar__crimp jk-candy-bar__crimp--right" aria-hidden="true" />
    </a>
  )
}

export function ChocolateBarCaption({ children, sub = false }) {
  return (
    <p className={sub ? 'jk-choc-cap jk-choc-cap--sub' : 'jk-choc-cap'}>
      {children}
    </p>
  )
}
