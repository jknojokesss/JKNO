import { useState } from 'react'
import { ACCENT, INK, STAGES, vehicleLabel } from './leaseBrokerUtils'

export default function LeaseBrokerBoard({ deals, onMove, openDeal }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = deals.filter((d) => d.stage === s.id)
    return acc
  }, {})

  const onDragStart = (e, dealId) => {
    setDragId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
  }

  const onDrop = (e, stage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    if (id) onMove(id, stage)
    setDragId(null)
    setOverStage(null)
  }

  return (
    <div>
      <div className="lb-board">
        {STAGES.map((col) => (
          <div
            key={col.id}
            className="lb-col"
            onDragOver={(e) => {
              e.preventDefault()
              setOverStage(col.id)
            }}
            onDragLeave={() => setOverStage(null)}
            onDrop={(e) => onDrop(e, col.id)}
            style={overStage === col.id ? { outline: `2px dashed ${ACCENT}` } : undefined}
          >
            <div className="lb-col-h">{col.label} ({byStage[col.id].length})</div>
            {byStage[col.id].map((d) => (
              <div
                key={d.id}
                className="lb-card-deal"
                draggable
                onDragStart={(e) => onDragStart(e, d.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => openDeal(d.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openDeal(d.id)
                }}
              >
                <div style={{ fontWeight: 600, color: INK }}>{d.client.name}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{vehicleLabel(d.vehicle)}</div>
                {d.quotes?.length ? (
                  <div style={{ fontSize: 11, color: ACCENT, marginTop: 6 }}>{d.quotes.length} quote{d.quotes.length > 1 ? 's' : ''}</div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
