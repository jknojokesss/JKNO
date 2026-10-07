/**
 * Sample link — gold crimp ends, Hershey-style segmented face with embossed type.
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
        'jk-foil-bar',
        here && 'jk-foil-bar--here',
        wideFlavor && 'jk-foil-bar--wide',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="jk-foil-bar__end jk-foil-bar__end--left" aria-hidden="true">
        <span className="jk-foil-bar__choc" />
      </span>
      <span className="jk-foil-bar__face">
        <span className="jk-foil-bar__slab" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="jk-foil-bar__segment" />
          ))}
        </span>
        <span className="jk-foil-bar__type">
          <span className="jk-foil-bar__name">{name}</span>
          {industry ? <span className="jk-foil-bar__sub">{industry}</span> : null}
        </span>
      </span>
      <span className="jk-foil-bar__end jk-foil-bar__end--right" aria-hidden="true">
        <span className="jk-foil-bar__choc" />
      </span>
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
