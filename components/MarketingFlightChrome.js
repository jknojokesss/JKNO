/** Shared sky / grain backdrop for flight-themed marketing pages (not the scroll-home). */
export default function MarketingFlightChrome() {
  return (
    <div className="m-flight-page__chrome" aria-hidden="true">
      <div className="m-flight-page__sky" />
      <div className="m-flight-page__haze" />
      <div className="m-flight-page__vignette" />
      <div className="m-flight-page__grain" />
    </div>
  )
}
