import IndustryDemo from '../../components/IndustryDemo'
import { INDUSTRIES, HIDDEN_DEMO_SLUGS } from '../../lib/industryDemos'

export default function DemoPage({ cfg }) {
  return <IndustryDemo cfg={cfg} />
}

export function getStaticPaths() {
  return {
    paths: INDUSTRIES.filter((c) => !HIDDEN_DEMO_SLUGS.has(c.slug)).map((c) => ({ params: { slug: c.slug } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const cfg = INDUSTRIES.find((c) => c.slug === params.slug)
  if (!cfg || HIDDEN_DEMO_SLUGS.has(params.slug)) return { notFound: true }
  return { props: { cfg } }
}
