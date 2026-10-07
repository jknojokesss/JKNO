import ChocolateBarLink from './ChocolateBarLink'

export default function DemoGalleryCard({ href, biz, industry }) {
  return (
    <ChocolateBarLink
      href={href}
      name={biz}
      industry={industry}
      className="jk-choc-bar--grid"
    />
  )
}
