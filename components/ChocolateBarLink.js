/**
 * Gold foil favor bar — label on the bar; hover lift + glint only (readable before click).
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

  const typeBlock = (
    <span className="jk-foil-bar__type">
      <span className="jk-foil-bar__name">{name}</span>
      {industry ? <span className="jk-foil-bar__sub">{industry}</span> : null}
    </span>
  )

  const sheen = (
    <span className="jk-foil-bar__sheen" aria-hidden="true">
      <span className="jk-foil-bar__glint" />
    </span>
  )

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
      <span className="jk-foil-bar__end jk-foil-bar__end--left" aria-hidden="true" />
      <span className="jk-foil-bar__mid">
        <span className="jk-foil-bar__face">
          {sheen}
          {typeBlock}
        </span>
      </span>
      <span className="jk-foil-bar__end jk-foil-bar__end--right" aria-hidden="true" />
    </a>
  )
}

export function ChocolateBarCaption({ children, sub = false, strip = false }) {
  const className = [
    'jk-choc-cap',
    sub && 'jk-choc-cap--sub',
    strip && 'jk-choc-cap--strip',
  ].filter(Boolean).join(' ')
  return <p className={className}>{children}</p>
}
