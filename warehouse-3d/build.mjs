// Builds two outputs from src/:
//   dist/artifact.html   — page content with the three.js bundle inlined (for claude.ai artifact)
//   dist/standalone.html — same thing wrapped in a full HTML document (open directly in a browser)
import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const res = await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  write: false,
  target: 'es2020',
})
const bundle = res.outputFiles[0].text
const page = readFileSync('src/page.html', 'utf8')
const artifact = page.replace('/*__BUNDLE__*/', () => bundle)

mkdirSync('dist', { recursive: true })
writeFileSync('dist/artifact.html', artifact)
writeFileSync(
  'dist/standalone.html',
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>\n<body>\n${artifact}\n</body>\n</html>\n`
)
console.log(`artifact.html: ${(artifact.length / 1024).toFixed(0)} KB`)
