/**
 * Gold foil favor bar — label stays readable; foil caps peel in 3D on hover.
 */
export default function ChocolateBarLink({
  href,
  name,
  industry,
  className = '',
  here = false,
  wide = false,
  unwrap = true,
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

  const faceInner = unwrap ? (
    <>
      <span className="jk-foil-bar__face-base" aria-hidden="true" />
      <span className="jk-foil-bar__flap jk-foil-bar__flap--top" aria-hidden="true" />
      <span className="jk-foil-bar__flap jk-foil-bar__flap--left" aria-hidden="true" />
      <span className="jk-foil-bar__flap jk-foil-bar__flap--right" aria-hidden="true" />
      <span className="jk-foil-bar__label">
        {sheen}
        {typeBlock}
      </span>
    </>
  ) : (
    <>
      {sheen}
      {typeBlock}
    </>
  )

  const barBody = (
    <>
      <span className="jk-foil-bar__end jk-foil-bar__end--left" aria-hidden="true" />
      <span className="jk-foil-bar__mid">
        <span className="jk-foil-bar__face">{faceInner}</span>
      </span>
      <span className="jk-foil-bar__end jk-foil-bar__end--right" aria-hidden="true" />
    </>
  )

  return (
    <a
      href={href}
      className={[
        'jk-foil-bar',
        unwrap && 'jk-foil-bar--unwrap',
        here && 'jk-foil-bar--here',
        wideFlavor && 'jk-foil-bar--wide',
        className,
      ].filter(Boolean).join(' ')}
    >
      {unwrap ? (
        <span className="jk-foil-bar__stage">
          <span className="jk-foil-bar__choc" aria-hidden="true">
            <span className="jk-foil-bar__end jk-foil-bar__end--choc jk-foil-bar__end--left" />
            <span className="jk-foil-bar__choc-body" />
            <span className="jk-foil-bar__end jk-foil-bar__end--choc jk-foil-bar__end--right" />
          </span>
          <span className="jk-foil-bar__wrap">{barBody}</span>
        </span>
      ) : (
        barBody
      )}
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
