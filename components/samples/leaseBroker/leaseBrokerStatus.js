import { stageLabel } from './leaseBrokerUtils'

export function stageStatusClass(stage) {
  if (stage === 'delivered' || stage === 'fee_paid') return 'lb-status--ok'
  if (stage === 'signed' || stage === 'quoted') return 'lb-status--accent'
  return 'lb-status--neutral'
}

export function StageStatus({ stage }) {
  return <span className={`lb-status ${stageStatusClass(stage)}`}>{stageLabel(stage)}</span>
}
