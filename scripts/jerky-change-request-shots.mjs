/**
 * PR screenshots — Jerky change requests (preview mock, magic-link auth).
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync } from 'fs'

const PREVIEW =
  process.env.JERKY_PREVIEW_URL ||
  'https://jknojokes-git-cursor-jerky-chan-000000-jonathan-katz-s-projects.vercel.app/jerky-munch'
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

async function boot(viewport) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport })
  const previewUrl = new URL(PREVIEW.includes('?') ? PREVIEW : `${PREVIEW}`)
  const share = previewUrl.searchParams.get('_vercel_share')
  const bootstrap =
    share && share.length > 0
      ? `${previewUrl.origin}/?_vercel_share=${encodeURIComponent(share)}`
      : previewUrl.origin
  await page.goto(bootstrap, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.evaluate((s) => localStorage.setItem('jerky-munch-auth', s), sessionJson)
  await page.goto(PREVIEW.includes('?') ? PREVIEW : `${PREVIEW}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.getByRole('button', { name: 'Consignment', exact: true }).waitFor({ timeout: 90000 })
  return { browser, page }
}

const phone = await boot({ width: 390, height: 844 })
await phone.page.getByTestId('jerky-change-request-btn').waitFor({ timeout: 30000 })
await phone.page.screenshot({ path: `${OUT}/jerky-change-request-btn-phone.png` })
await phone.page.getByTestId('jerky-change-request-btn').click()
await phone.page.getByTestId('jerky-change-text').waitFor()
await phone.page.getByTestId('jerky-change-text').fill(
  'Consignment: when two log lines share a date, sort by time created so running shelf totals read correctly on phone.',
)
await phone.page.screenshot({ path: `${OUT}/jerky-change-request-form-phone.png` })
await phone.page.getByRole('button', { name: 'View my requests' }).click()
await phone.page.getByTestId('jerky-change-list').waitFor({ timeout: 30000 })
await phone.page.screenshot({ path: `${OUT}/jerky-change-request-list-phone.png` })
await phone.browser.close()

const desk = await boot({ width: 1280, height: 900 })
await desk.page.getByTestId('jerky-change-request-btn').waitFor({ timeout: 30000 })
await desk.page.screenshot({ path: `${OUT}/jerky-change-request-btn-desktop.png` })
await desk.page.getByTestId('jerky-change-request-btn').click()
await desk.page.getByTestId('jerky-change-text').fill(
  'Consignment: when two log lines share a date, sort by time created so running shelf totals read correctly.',
)
await desk.page.screenshot({ path: `${OUT}/jerky-change-request-form-desktop.png` })
await desk.page.getByTestId('jerky-change-back-btn').click()
await desk.page.getByTestId('jerky-my-change-requests-btn').click()
await desk.page.getByTestId('jerky-change-list').waitFor({ timeout: 30000 })
await desk.page.screenshot({ path: `${OUT}/jerky-change-request-list-desktop.png` })
await desk.browser.close()

console.log('saved change-request screenshots to', OUT)
