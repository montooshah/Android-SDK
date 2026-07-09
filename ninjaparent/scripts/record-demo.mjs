import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DEMO_DIR = path.join(ROOT, '..', 'demo')
const VIDEO_SIZE = { width: 390, height: 844 }

async function waitForServer(url, maxAttempts = 40) {
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
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })

    const page = await context.newPage()

    // Onboarding — integrations step with Gmail & Outlook
    await page.goto('http://127.0.0.1:5173/?demo=1&show=onboarding', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid="onboarding-flow"]')
    await sleep(3500)
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'smooth' }))
    await sleep(3000)
    await page.getByTestId('onboarding-finish').click()
    await sleep(2500)

    // Today dashboard
    await page.waitForSelector('[data-testid="week-overview"]')
    await sleep(2500)
    const chips = page.getByTestId('child-chips')
    const pills = page.getByTestId('filter-pills')
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
    await sleep(2500)
    await chips.getByTestId('filter-child-noah').click()
    await sleep(2500)
    await pills.getByTestId('filter-type-payment').click()
    await sleep(2500)
    await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'smooth' }))
    await sleep(2000)
    await page.getByTestId('action-card-1').getByRole('button', { name: 'Done' }).click()
    await sleep(2500)
    await chips.getByTestId('filter-all-kids').click()
    await sleep(1500)
    await pills.getByTestId('filter-type-all').click()
    await sleep(2000)

    // Settings — connected Gmail & Outlook
    await page.getByTestId('tab-settings').click()
    await page.waitForSelector('[data-testid="settings-connections"]')
    await sleep(3500)
    await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'smooth' }))
    await sleep(2500)

    // Kids tab
    await page.getByTestId('tab-kids').click()
    await sleep(3000)

    // Back to Today
    await page.getByTestId('tab-today').click()
    await sleep(2000)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await sleep(2500)

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
