import { formatCalendarDate, formatSoldLogNote } from './consignmentRecon.js'

/** Synthetic log rows — merged client-side only when preview overlay is enabled at build time. */
export const JERKY_PREVIEW_CONSIGN_LOG_OVERLAYS = {
  '9d5a29f5-b90d-4766-ab3f-4f0fed00d22e': [
    {
      logId: 'jerky-preview-overlay:evergreen-lakewood-sold-2026-11-09',
      atIso: '2026-11-09',
      t: formatSoldLogNote(105, '2026-11-09'),
    },
  ],
}

export function jerkyConsignPreviewOverlayEnabled() {
  return process.env.NEXT_PUBLIC_JERKY_CONSIGN_PREVIEW_OVERLAY === '1'
}

export function isJerkyPreviewOverlayLogId(logId) {
  return String(logId || '').startsWith('jerky-preview-overlay:')
}

export function mergeJerkyPreviewConsignOverlays(row) {
  if (!jerkyConsignPreviewOverlayEnabled()) return row
  const extra = JERKY_PREVIEW_CONSIGN_LOG_OVERLAYS[row.id]
  if (!extra?.length) return row
  const merged = [
    ...(row.log || []),
    ...extra.map((e) => ({
      ...e,
      at: formatCalendarDate(e.atIso),
    })),
  ]
  return { ...row, log: merged }
}
