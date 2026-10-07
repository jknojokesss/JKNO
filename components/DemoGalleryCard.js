import { getDemoHook } from '../lib/demoHooks'

export default function DemoGalleryCard({ href, biz, industry, index }) {
  const { hook } = getDemoHook(href)
  const num = String(index + 1).padStart(2, '0')

  return (
    <a href={href} className="m-demo-spot">
      <span className="m-demo-spot__num" aria-hidden="true">{num}</span>
      <span className="m-demo-spot__hook">{hook}</span>
      <span className="m-demo-spot__biz">{biz}</span>
      <span className="m-demo-spot__industry">{industry}</span>
      <span className="m-demo-spot__go">Step inside →</span>
    </a>
  )
}
