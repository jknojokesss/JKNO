export default function DemoGalleryCard({
  href,
  biz,
  industry,
  here = false,
  compact = false,
  onDark = false,
  variant = 'default',
  emoji = '✦',
  accent = '#c9a84c',
}) {
  if (variant === 'fun') {
    return (
      <a
        href={href}
        className="m-fun-door"
        style={{ '--door-accent': accent }}
      >
        <span className="m-fun-door__emoji" aria-hidden="true">{emoji}</span>
        <span className="m-fun-door__text">
          {industry ? <span className="m-fun-door__industry">{industry}</span> : null}
          <span className="m-fun-door__name">{biz}</span>
        </span>
        <span className="m-fun-door__go" aria-hidden="true">→</span>
      </a>
    )
  }

  return (
    <a
      href={href}
      className={[
        'm-demo-card',
        here && 'm-demo-card--here',
        compact && 'm-demo-card--compact',
        onDark && 'm-demo-card--on-dark',
      ].filter(Boolean).join(' ')}
    >
      {industry ? <span className="m-demo-card__industry">{industry}</span> : null}
      <span className="m-demo-card__name">{biz}</span>
      <span className="m-demo-card__go">{here ? 'You are here' : 'Open sample'}</span>
    </a>
  )
}
