import { execSync } from 'child_process'
import { cp, mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SITE = path.join(ROOT, 'site')
const INVESTOR = path.join(ROOT, 'investor-site')
const NINJA = path.join(ROOT, 'ninjaparent')

async function main() {
  console.log('Building parent app for /app/...')
  execSync('npm run build', {
    cwd: NINJA,
    stdio: 'inherit',
    env: { ...process.env, VITE_BASE: '/app/' },
  })

  console.log('Building investor hub...')
  await mkdir(path.join(SITE, 'app'), { recursive: true })
  await mkdir(path.join(SITE, 'deck'), { recursive: true })
  await mkdir(path.join(SITE, 'demo'), { recursive: true })

  execSync(`cp -r ${path.join(NINJA, 'dist')}/. ${path.join(SITE, 'app')}/`)

  await cp(path.join(INVESTOR, 'index.html'), path.join(SITE, 'index.html'))
  try {
    await cp(path.join(INVESTOR, 'logo.svg'), path.join(SITE, 'logo.svg'))
  } catch {
    // optional
  }
  await cp(path.join(ROOT, 'pitch-deck', 'index.html'), path.join(SITE, 'deck', 'index.html'))
  await cp(path.join(ROOT, 'pitch-deck', 'one-pager.html'), path.join(SITE, 'deck', 'one-pager.html'))

  await writeFile(path.join(SITE, 'app', '_redirects'), '/*    /app/index.html   200\n')
  await writeFile(
    path.join(SITE, '_redirects'),
    '/app/*  /app/index.html  200\n',
  )

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

  console.log(`Site built at ${SITE}`)
  console.log('  Investor hub → /')
  console.log('  Parent app   → /app/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
