import IndustryDemo from '../../components/IndustryDemo'
import { INDUSTRIES } from '../../lib/industryDemos'

export default function DemoPage({ cfg }) {
  return <IndustryDemo cfg={cfg} />
}

export function getStaticPaths() {
  return {
    paths: INDUSTRIES.map((c) => ({ params: { slug: c.slug } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const cfg = INDUSTRIES.find((c) => c.slug === params.slug)
  return { props: { cfg } }
}
