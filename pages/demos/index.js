import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { ALL_DEMOS } from '../../lib/industryDemos'
import DemoGalleryIndex from '../../components/DemoGalleryIndex'

export default function DemoGallery() {
  return (
    <MarketingShell
      title="Sample Portals | JK No Jokes"
      description="Clickable sample portals for trades, retail, and distribution — fictitious data, real screen patterns on QuickBooks."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} samples · no login`}
        title={<>Open a sample.</>}
        lead="Fictitious companies, real layouts. One screen should make you reach for your phone — that&rsquo;s the meeting."
        align="center"
      />

      <DemoGalleryIndex />
    </MarketingShell>
  )
}
