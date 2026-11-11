/** Sample rows for Vercel previews — no live jerky_change_requests table required. */

export function jerkyChangeRequestPreviewMockEnabled() {
  return process.env.NEXT_PUBLIC_JERKY_CHANGE_REQUEST_PREVIEW_MOCK === '1'
}

export const JERKY_PREVIEW_CHANGE_REQUEST_SAMPLES = [
  {
    id: 'jerky-preview-change:1',
    user_id: '00000000-0000-0000-0000-000000000001',
    submitter_email: 'efraim@jerkymunch.com',
    request_text: 'On Consignment, show unpaid dollars on one line so it does not wrap on small phones.',
    page_label: 'Consignment',
    status: 'in_progress',
    reply_note: 'On it — tuning the metric row for 390px.',
    created_at: '2026-11-08T14:22:00.000Z',
    updated_at: '2026-11-09T10:05:00.000Z',
    isSample: true,
  },
  {
    id: 'jerky-preview-change:2',
    user_id: '00000000-0000-0000-0000-000000000001',
    submitter_email: 'efraim@jerkymunch.com',
    request_text: 'Invoice Stores tab: remember which store panel was open after creating an invoice.',
    page_label: 'Invoice Stores',
    status: 'done',
    reply_note: 'Shipped — panel stays open after a successful create.',
    created_at: '2026-11-02T18:40:00.000Z',
    updated_at: '2026-11-05T16:12:00.000Z',
    isSample: true,
  },
  {
    id: 'jerky-preview-change:3',
    user_id: '00000000-0000-0000-0000-000000000001',
    submitter_email: 'efraim@jerkymunch.com',
    request_text: 'Financials: default comparison range to last quarter instead of all time.',
    page_label: 'Financials',
    status: 'received',
    reply_note: null,
    created_at: '2026-11-10T21:15:00.000Z',
    updated_at: '2026-11-10T21:15:00.000Z',
    isSample: true,
  },
]

export function isJerkyPreviewChangeRequestId(id) {
  return String(id || '').startsWith('jerky-preview-change:')
}
