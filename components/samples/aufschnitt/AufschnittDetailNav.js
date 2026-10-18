/** Paired Back / Close for Aufschnitt drill-downs (plain text, no glyphs). */
export default function AufschnittDetailNav({ onBack }) {
  return (
    <div className="au-detail-nav">
      <button type="button" className="au-detail-back" onClick={onBack}>
        Back
      </button>
      <button type="button" className="au-detail-back" onClick={onBack}>
        Close
      </button>
    </div>
  )
}
