import { cp, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SITE = path.join(ROOT, 'site')
const INVESTOR = path.join(ROOT, 'investor-site')

async function main() {
  console.log('Building investor hub (separate from parent app)...')
  await mkdir(path.join(SITE, 'deck'), { recursive: true })
  await mkdir(path.join(SITE, 'demo'), { recursive: true })

  await cp(path.join(INVESTOR, 'index.html'), path.join(SITE, 'index.html'))
  await cp(path.join(ROOT, 'pitch-deck', 'index.html'), path.join(SITE, 'deck', 'index.html'))
  await cp(path.join(ROOT, 'pitch-deck', 'one-pager.html'), path.join(SITE, 'deck', 'one-pager.html'))

  const pdfPath = path.join(ROOT, 'pitch-deck', 'NinjaParent-Investor-One-Pager.pdf')
  try {
    await cp(pdfPath, path.join(SITE, 'NinjaParent-Investor-One-Pager.pdf'))
  } catch {
    console.warn('PDF not found — run npm run pdf first')
  }

  for (const file of ['ninjaparent-demo.mp4', 'ninjaparent-demo-narrated.mp4']) {
    try {
      await cp(path.join(ROOT, 'demo', file), path.join(SITE, 'demo', file))
    } catch {
      // optional
    }
  }

  console.log(`Investor hub built at ${SITE}`)
  console.log('Parent app deploys separately from ninjaparent/ (npm run build)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
