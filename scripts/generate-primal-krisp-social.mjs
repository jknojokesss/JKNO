#!/usr/bin/env node
/**
 * Generate Primal Krisp favicons + og-image for /primal-krisp.
 * Run: node scripts/generate-primal-krisp-social.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, 'public/samples/primal-krisp')

const CHAR = '#2B2018'
const CREAM = '#F6F0E6'
const KRAFT = '#A9763A'

function faviconSvg(size, fontSize) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${CHAR}"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${CREAM}">PK</text>
    </svg>`,
  )
}

function ogSvg() {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="${CHAR}"/>
      <text x="600" y="268" text-anchor="middle" font-family="system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="8" fill="${CREAM}">PRIMAL KRISP</text>
      <text x="600" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="500" fill="${KRAFT}">Sample dashboard</text>
    </svg>`,
  )
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  await sharp(faviconSvg(32, 13)).png().toFile(path.join(outDir, 'favicon-32.png'))
  await sharp(faviconSvg(180, 52)).png().toFile(path.join(outDir, 'apple-touch-icon.png'))
  await sharp(ogSvg()).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'og-image.png'))
  const ogStat = fs.statSync(path.join(outDir, 'og-image.png'))
  if (ogStat.size > 300 * 1024) {
    console.warn('og-image.png exceeds 300 KB:', ogStat.size)
  }
  console.log('Wrote Primal Krisp social assets to', outDir)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
