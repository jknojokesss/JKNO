/**
 * Capture desktop Overview (1440px) and export 1200×630 OG PNG for link previews.
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/amazon-demo'
const OUT = path.join(process.cwd(), 'public/amazon-demo/og-v3.png')
const ART = '/opt/cursor/artifacts/amazon-demo/og-v3.png'
const MAX_BYTES = 300 * 1024
const CHROME =
  process.env.PLAYWRIGHT_CHROME_PATH || '/usr/local/bin/google-chrome'

async function captureClip(page) {
  return page.evaluate(() => {
    const app = document.querySelector('.app')
    if (!app) return null
    const appR = app.getBoundingClientRect()
    const width = Math.round(appR.width)
    const aspectH = Math.round(width * (630 / 1200))
    let bottomNeed = appR.top + aspectH
    const profitPanel = [...document.querySelectorAll('.panel-h h2')].find(
      (h) => h.textContent?.trim() === 'Profit',
    )
    if (profitPanel) {
      const pr = profitPanel.closest('section')?.getBoundingClientRect()
      if (pr) bottomNeed = Math.max(bottomNeed, pr.top + 72)
    }
    const height = Math.round(bottomNeed - appR.top)
    return {
      x: Math.round(appR.left),
      y: Math.round(appR.top),
      width,
      height,
    }
  })
}

async function writePng(buffer, dest) {
  let level = 9
  let quality = 92
  for (let attempt = 0; attempt < 6; attempt++) {
    const out = await sharp(buffer)
      .resize(1200, 630, { fit: 'fill' })
      .png({ compressionLevel: level, quality, effort: 10 })
      .toBuffer()
    if (out.length <= MAX_BYTES || attempt === 5) {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, out)
      return out.length
    }
    quality -= 8
    level = Math.min(9, level + 1)
  }
  return fs.statSync(dest).size
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
  })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}#/overview`, { waitUntil: 'load', timeout: 60000 })
  await page.waitForSelector('.ov-kpi-grid', { timeout: 20000 })
  await page.waitForFunction(() => window.__portal, { timeout: 15000 })
  await page.waitForTimeout(400)

  const clip = await captureClip(page)
  if (!clip) throw new Error('Could not measure overview clip')
  const shot = await page.screenshot({ type: 'png', clip })
  await browser.close()

  const bytes = await writePng(shot, OUT)
  fs.mkdirSync(path.dirname(ART), { recursive: true })
  fs.copyFileSync(OUT, ART)

  const meta = await sharp(OUT).metadata()
  console.log(`Wrote ${OUT} (${bytes} bytes, ${meta.width}×${meta.height})`)
  console.log(`Artifact ${ART}`)
  if (bytes > MAX_BYTES) {
    console.error(`FAIL size ${bytes} > ${MAX_BYTES}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
