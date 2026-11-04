/** Jerky Munch books follow the owner's US Eastern calendar day. */
export const BOOKS_TZ = 'America/New_York'

/** @param {Date} [date] */
export function isoDateInTimeZone(date = new Date(), timeZone = BOOKS_TZ) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
