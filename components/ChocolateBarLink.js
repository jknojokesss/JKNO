/**
 * Sample portal link — gold-foil wrapped bar; company = name on wrapper, industry = variety line.
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
        'jk-wrap-bar',
        here && 'jk-wrap-bar--here',
        wideFlavor && 'jk-wrap-bar--wide',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="jk-wrap-bar__end jk-wrap-bar__end--left" aria-hidden="true" />
      <span className="jk-wrap-bar__body">
        <span className="jk-wrap-bar__foil" aria-hidden="true" />
        <span className="jk-wrap-bar__label">
          <span className="jk-wrap-bar__name">{name}</span>
          {industry ? <span className="jk-wrap-bar__flavor">{industry}</span> : null}
        </span>
      </span>
      <span className="jk-wrap-bar__end jk-wrap-bar__end--right" aria-hidden="true" />
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
