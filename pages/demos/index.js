import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { ALL_DEMOS } from '../../lib/industryDemos'
import DemoGalleryIndex from '../../components/DemoGalleryIndex'

export default function DemoGallery() {
  return (
    <MarketingShell
      title="Sample Portals | JK No Jokes"
      description="Owner portfolio hub plus trade samples: fictitious data, real screen patterns on QuickBooks."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} samples · no login`}
        title={<>Open a sample.</>}
        lead="Each sample started as one owner's shape — yours gets wired the same way. Click around; fictitious names, real layouts, no password."
        align="center"
      />

      <DemoGalleryIndex />
    </MarketingShell>
  )
}
