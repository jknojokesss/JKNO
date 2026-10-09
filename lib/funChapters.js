export const FUN_CHAPTERS = [
  { id: 'top', label: 'Home', target: 'top' },
  { id: 'books', label: 'Books', target: 'books' },
  { id: 'portal', label: 'Portal', target: 'portal' },
  { id: 'samples', label: 'Samples', target: 'samples' },
  { id: 'demos', label: 'Gallery', target: 'demos' },
  { id: 'how', label: 'Ship', target: 'how' },
  { id: 'contact', label: 'Start', target: 'contact' },
]

export function scrollToChapter(targetId) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
