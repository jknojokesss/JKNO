import ChocolateBarLink from './ChocolateBarLink'

export default function DemoGalleryCard({ href, biz, industry }) {
  return (
    <ChocolateBarLink href={href} name={biz} industry={industry} wide breakPiece={false} />
  )
}
