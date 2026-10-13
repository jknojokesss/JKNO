import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { ALL_DEMOS } from '../../lib/industryDemos'
import DemoGalleryIndex from '../../components/DemoGalleryIndex'

export default function DemoGallery() {
  return (
    <MarketingShell
      title="Sample Portals | JK No Jokes"
      description="Owner portfolio hub plus trade samples — fictitious data, real screen patterns on QuickBooks."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} samples · no login`}
        title={<>Open a sample.</>}
        lead="No pitch deck — click a sample and see if it matches the business you are trying to run. Fictitious names, real layouts, no password."
        align="center"
      />

      <DemoGalleryIndex />
    </MarketingShell>
  )
}
