const SEGS = 6

/**
 * Fictitious-company sample link — chocolate-bar chrome (JK merch gag, not UI chrome).
 */
export default function ChocolateBarLink({
  href,
  name,
  industry,
  className = '',
  here = false,
}) {
  return (
    <a
      href={href}
      className={`jk-choc-bar${here ? ' jk-choc-bar--here' : ''}${className ? ` ${className}` : ''}`}
    >
      <span className="jk-choc-bar__segs" aria-hidden="true">
        {Array.from({ length: SEGS }, (_, i) => (
          <span key={i} className="jk-choc-bar__seg" />
        ))}
      </span>
      <span className="jk-choc-bar__main">
        <span className="jk-choc-bar__name">{name}</span>
        {industry ? <span className="jk-choc-bar__industry">{industry}</span> : null}
      </span>
      <span className="jk-choc-bar__go" aria-hidden="true">→</span>
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
