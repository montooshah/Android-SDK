import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DEMO_DIR = path.join(ROOT, '..', 'demo')
const VIDEO_SIZE = { width: 1280, height: 720 }

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${url}`)
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  await mkdir(DEMO_DIR, { recursive: true })

  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  })

  try {
    await waitForServer('http://127.0.0.1:5173')
    console.log('Dev server ready')

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({
      recordVideo: { dir: DEMO_DIR, size: VIDEO_SIZE },
      viewport: VIDEO_SIZE,
    })

    const page = await context.newPage()
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
    await sleep(4000)

    // Overview — week stats & AI insight
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await sleep(3500)
    await page.evaluate(() => window.scrollTo({ top: 280, behavior: 'smooth' }))
    await sleep(4000)
    await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' }))
    await sleep(4500)

    // Filter by Noah
    await page.getByTestId('filter-child-noah').click()
    await sleep(4000)
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }))
    await sleep(3500)

    // Payments filter
    await page.getByTestId('filter-type-payment').click()
    await sleep(4000)

    // Homework filter
    await page.getByTestId('filter-type-homework').click()
    await sleep(3500)

    // Overdue filter
    await page.getByTestId('filter-type-overdue').click()
    await sleep(3500)

    // Back to all kids + all actions
    await page.getByTestId('filter-all-kids').click()
    await sleep(2000)
    await page.getByTestId('filter-type-all').click()
    await sleep(3000)

    // Complete an action
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
    await sleep(2000)
    await page.getByTestId('action-btn-1').hover()
    await sleep(1500)
    await page.locator('[data-testid="action-card-1"] button').filter({ hasText: 'Mark complete' }).click()
    await sleep(3500)

    // Filter Lily
    await page.getByTestId('filter-child-lily').click()
    await sleep(4000)
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }))
    await sleep(3500)

    // Events filter
    await page.getByTestId('filter-type-event').click()
    await sleep(3500)

    await page.getByTestId('filter-all-kids').click()
    await sleep(2000)
    await page.getByTestId('filter-type-all').click()
    await sleep(3000)

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await sleep(4000)

    const video = page.video()
    await context.close()
    await browser.close()

    if (video) {
      const webmPath = await video.path()
      const mp4Path = path.join(DEMO_DIR, 'ninjaparent-demo.mp4')

      const { execSync } = await import('child_process')
      execSync(
        `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${mp4Path}"`,
        { stdio: 'inherit' }
      )
      console.log(`Demo video saved to ${mp4Path}`)
    }
  } finally {
    server.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
