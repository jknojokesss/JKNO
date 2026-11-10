/**
 * Screenshots from live Vercel preview (read-only). Requires JERKY_SUPABASE_SERVICE_ROLE_KEY.
 * Does not write consignment data — auth via one-time magic link only.
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync } from 'fs'

const PREVIEW =
  process.env.JERKY_PREVIEW_URL ||
  'https://jknojokes-git-cursor-jerky-shel-33b1d8-jonathan-katz-s-projects.vercel.app/jerky-munch?_vercel_share=yZLfj1C8rPrYUR08zvy3zVehCYkWjKIz'
const OUT = '/opt/cursor/artifacts'
const PW = process.env.PLAYWRIGHT_BROWSERS_PATH || '/agent/repos/JKNO/.pw'
const EMAIL = process.env.JERKY_SCREENSHOT_EMAIL || 'efraim@jerkymunch.com'

mkdirSync(OUT, { recursive: true })

const key = process.env.JERKY_SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('JERKY_SUPABASE_SERVICE_ROLE_KEY required')

const JERKY_URL = 'https://jjcnzpicenrbxqrjqsnn.supabase.co'
const JERKY_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY256cGljZW5yYnhxcmpxc25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDI0MTAsImV4cCI6MjA5NzgxODQxMH0.aibevqF8qtx0nse7yVOIjeEXA39W-yp4eZEHOaYt768'

const admin = createClient(JERKY_URL, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const anon = createClient(JERKY_URL, JERKY_ANON, {
  auth: { storageKey: 'jerky-munch-auth', persistSession: false, autoRefreshToken: false },
})

const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: EMAIL,
})
if (linkErr || !linkData?.properties?.hashed_token) throw linkErr || new Error('no magic link')
const { data: authData, error: authErr } = await anon.auth.verifyOtp({
  token_hash: linkData.properties.hashed_token,
  type: 'email',
})
if (authErr || !authData.session) throw authErr || new Error('verifyOtp failed')
const sessionJson = JSON.stringify(authData.session)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const previewUrl = new URL(PREVIEW)
const share = previewUrl.searchParams.get('_vercel_share')
const bootstrap =
  share && share.length > 0
    ? `${previewUrl.origin}/?_vercel_share=${encodeURIComponent(share)}`
    : previewUrl.origin
await page.goto(bootstrap, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.evaluate(
  (s) => localStorage.setItem('jerky-munch-auth', s),
  sessionJson,
)
await page.goto(PREVIEW, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.getByRole('button', { name: 'Consignment', exact: true }).waitFor({ timeout: 60000 })
await page.getByRole('button', { name: 'Consignment', exact: true }).click()
await page.waitForTimeout(800)
const cards = page.locator('[data-testid^="consign-card-"]')
const cardCount = await cards.count()
let maxHeader = 0
for (let i = 0; i < cardCount; i++) {
  const header = cards.nth(i).locator(':scope > div').first()
  const box = await header.boundingBox()
  if (box) maxHeader = Math.max(maxHeader, box.height)
}
if (maxHeader > 130) {
  throw new Error(`consign card header too tall (max ${Math.round(maxHeader)}px); layout regression`)
}
console.log(`consign cards: ${cardCount}, max collapsed header ${Math.round(maxHeader)}px`)
await page.getByText('Chick Chock').first().scrollIntoViewIfNeeded()
await page.getByText('Evergreen Lakewood').first().scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/jerky-polish-evergreen-neighbors.png` })
await page.screenshot({ path: `${OUT}/jerky-polish-evergreen-card.png` })
await page.getByText('Evergreen Lakewood').first().click()
await page.waitForTimeout(800)
await page.getByTestId('consign-action-chips').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/jerky-polish-evergreen-actions.png`, fullPage: false })
const ledger = page.getByTestId('consign-activity-ledger')
await ledger.scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/jerky-polish-evergreen-activity.png` })
const report = page.getByTestId('consign-drop-report')
await report.scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/jerky-polish-evergreen-dropoffs.png` })
await browser.close()
console.log('saved preview screenshots to', OUT)
