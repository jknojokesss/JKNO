export default function DemoGalleryCard({
  href,
  biz,
  industry,
  here = false,
  compact = false,
  onDark = false,
}) {
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
