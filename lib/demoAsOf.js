/**
 * Pin "today" for marketing / prospect demos so AR aging, forecasts, and copy
 * stay stable between deploys. Live client books (Reydel, etc.) use their own
 * reconciled-through dates in-page.
 */
export const DEMO_AS_OF_ISO = '2026-09-25'
export const DEMO_AS_OF = new Date(`${DEMO_AS_OF_ISO}T12:00:00Z`)
export const DEMO_LATEST_MONTH_LABEL = 'September 2026'
