import { DEMO_FONT_LINK } from '../lib/demoFonts'

/** Preconnect + single Google Fonts sheet for sample portal pages */
export default function DemoFontLinks() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={DEMO_FONT_LINK} rel="stylesheet" />
    </>
  )
}
