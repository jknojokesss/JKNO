/**
 * Gold foil favor bar — on hover (pointer), a wrapped piece breaks off and the rift opens.
 */
export default function ChocolateBarLink({
  href,
  name,
  industry,
  className = '',
  here = false,
  wide = false,
  breakPiece = true,
}) {
  const wideFlavor = wide || (className && className.includes('wide'))

  return (
    <a
      href={href}
      className={[
        'jk-foil-bar',
        breakPiece && 'jk-foil-bar--breakable',
        here && 'jk-foil-bar--here',
        wideFlavor && 'jk-foil-bar--wide',
        className,
      ].filter(Boolean).join(' ')}
    >
      {breakPiece ? (
        <span className="jk-foil-bar__off" aria-hidden="true">
          <span className="jk-foil-bar__end jk-foil-bar__end--left" />
          <span className="jk-foil-bar__off-face">
            <span className="jk-foil-bar__sheen jk-foil-bar__sheen--mini" />
          </span>
        </span>
      ) : (
        <span className="jk-foil-bar__end jk-foil-bar__end--left" aria-hidden="true" />
      )}

      {breakPiece ? <span className="jk-foil-bar__rift" aria-hidden="true" /> : null}

      <span className="jk-foil-bar__pack">
        {breakPiece ? <span className="jk-foil-bar__tear" aria-hidden="true" /> : null}
        <span className="jk-foil-bar__mid">
          <span className="jk-foil-bar__fill" aria-hidden="true" />
          <span className="jk-foil-bar__face">
            {breakPiece ? (
              <>
                <span className="jk-foil-bar__choc-peek" aria-hidden="true" />
                <span className="jk-foil-bar__lid" aria-hidden="true" />
              </>
            ) : null}
            <span className="jk-foil-bar__sheen" aria-hidden="true">
              <span className="jk-foil-bar__glint" />
            </span>
            <span className="jk-foil-bar__type">
              <span className="jk-foil-bar__name">{name}</span>
              {industry ? <span className="jk-foil-bar__sub">{industry}</span> : null}
            </span>
          </span>
        </span>
        <span className="jk-foil-bar__end jk-foil-bar__end--right" aria-hidden="true" />
      </span>
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
