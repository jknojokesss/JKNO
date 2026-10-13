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
        lead="Start with the owner portfolio hub if you run more than one business — then browse single-trade samples. Fictitious names, real layouts."
        align="center"
      />

      <DemoGalleryIndex />
    </MarketingShell>
  )
}
