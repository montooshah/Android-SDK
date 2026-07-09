import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ONE_PAGER_HTML = path.join(ROOT, 'pitch-deck', 'one-pager.html')
const OUTPUT_PDF = path.join(ROOT, 'pitch-deck', 'NinjaParent-Investor-One-Pager.pdf')

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto(`file://${ONE_PAGER_HTML}`, { waitUntil: 'networkidle' })
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  })
  await browser.close()
  console.log(`PDF saved to ${OUTPUT_PDF}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
