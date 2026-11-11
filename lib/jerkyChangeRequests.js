export const JERKY_CHANGE_REQUEST_STATUSES = ['received', 'in_progress', 'done', 'declined']

export const JERKY_CHANGE_REQUEST_STATUS_LABELS = {
  received: 'Received',
  in_progress: 'In progress',
  done: 'Done',
  declined: 'Declined',
}

export function jerkyChangeRequestStatusLabel(status) {
  return JERKY_CHANGE_REQUEST_STATUS_LABELS[status] || String(status || '')
}

export function isJerkyChangeRequestStatus(s) {
  return JERKY_CHANGE_REQUEST_STATUSES.includes(s)
}

export function jerkyChangeRequestStatusPillStyle(status) {
  switch (status) {
    case 'received':
      return { color: '#fff', bg: '#8A7A66' }
    case 'in_progress':
      return { color: '#2B2018', bg: '#E8C98A' }
    case 'done':
      return { color: '#fff', bg: '#3E7C4F' }
    case 'declined':
      return { color: '#fff', bg: '#C03A22' }
    default:
      return { color: '#2B2018', bg: '#E6DBC8' }
  }
}
