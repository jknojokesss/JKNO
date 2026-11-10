/**
 * E2E screenshots for Jerky consignment metrics (phone width).
 * Usage: NEXT_PUBLIC_E2E=1 node scripts/jerky-consign-preview-shots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { spawn } from 'child_process'

const OUT = '/opt/cursor/artifacts'
const PW = process.env.PLAYWRIGHT_BROWSERS_PATH || '/agent/repos/JKNO/.pw'
mkdirSync(OUT, { recursive: true })

const env = {
  ...process.env,
  NEXT_PUBLIC_E2E: '1',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk5MDgwMDAsImV4cCI6MTk2NTQ4NDAwMH0.placeholder',
  PORT: '3119',
}

const server = spawn('npx', ['next', 'dev', '-p', '3119'], { env, cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' })
await new Promise((r) => setTimeout(r, 8000))

const browser = await chromium.launch({ headless: true, channel: undefined, executablePath: undefined })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://localhost:3119/jerky-munch', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('button.jm-navbtn', { hasText: /^Consignment$/ }).click()
await page.waitForTimeout(400)
await page.getByText('Evergreen Lakewood').first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/jerky-evergreen-lakewood-card.png`, fullPage: false })
const report = page.getByTestId('consign-drop-report')
await report.scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/jerky-evergreen-lakewood-reports.png`, fullPage: false })
await browser.close()
server.kill()
console.log('saved screenshots to', OUT)
