import { execSync, spawn } from 'child_process'
import { cp, mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SITE = path.join(ROOT, 'site')
const NINJA = path.join(ROOT, 'ninjaparent')

async function run(cmd, cwd = ROOT) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true })
}

async function main() {
  console.log('Building NinjaParent app...')
  run('VITE_BASE=/app/ npm run build', NINJA)

  console.log('Assembling static site...')
  await mkdir(path.join(SITE, 'app'), { recursive: true })
  await mkdir(path.join(SITE, 'deck'), { recursive: true })
  await mkdir(path.join(SITE, 'demo'), { recursive: true })

  run(`cp -r ${path.join(NINJA, 'dist')}/. ${SITE}/app/`)
  await cp(path.join(ROOT, 'pitch-deck', 'index.html'), path.join(SITE, 'deck', 'index.html'))
  await cp(path.join(ROOT, 'pitch-deck', 'one-pager.html'), path.join(SITE, 'deck', 'one-pager.html'))

  const pdfPath = path.join(ROOT, 'pitch-deck', 'NinjaParent-Investor-One-Pager.pdf')
  try {
    await cp(pdfPath, path.join(SITE, 'NinjaParent-Investor-One-Pager.pdf'))
  } catch {
    console.warn('PDF not found yet — run export-one-pager-pdf first')
  }

  for (const file of ['ninjaparent-demo.mp4', 'ninjaparent-demo-narrated.mp4']) {
    try {
      await cp(path.join(ROOT, 'demo', file), path.join(SITE, 'demo', file))
    } catch {
      // optional
    }
  }

  const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NinjaParent — Investor Demo</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      background: linear-gradient(160deg, #0f766e 0%, #134e4a 50%, #0f172a 100%);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .container { max-width: 720px; width: 100%; text-align: center; }
    .logo {
      width: 72px; height: 72px; background: rgba(255,255,255,0.15);
      border-radius: 20px; margin: 0 auto 1.5rem;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px);
    }
    h1 { font-family: 'Outfit', sans-serif; font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; }
    .subtitle { font-size: 1.2rem; opacity: 0.85; margin-bottom: 2.5rem; }
    .cards { display: grid; gap: 1rem; text-align: left; }
    a.card {
      display: block; background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2); border-radius: 16px;
      padding: 1.25rem 1.5rem; color: #fff; text-decoration: none;
      transition: all 0.2s; backdrop-filter: blur(8px);
    }
    a.card:hover { background: rgba(255,255,255,0.18); transform: translateY(-2px); }
    a.card strong { font-family: 'Outfit', sans-serif; font-size: 1.1rem; display: block; margin-bottom: 0.25rem; }
    a.card span { font-size: 0.9rem; opacity: 0.75; }
    .badge {
      display: inline-block; background: #5eead4; color: #134e4a;
      font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem;
      border-radius: 100px; margin-left: 0.5rem; vertical-align: middle;
    }
    footer { margin-top: 2.5rem; font-size: 0.85rem; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 18V8l8-4 8 4v10l-8 4-8-4z"/><path d="M12 4v16M4 8l8 4 8-4"/></svg>
    </div>
    <h1>NinjaParent</h1>
    <p class="subtitle">School life, unified. Investor demo package.</p>
    <div class="cards">
      <a class="card" href="/app/">
        <strong>Live Prototype <span class="badge">Interactive</span></strong>
        <span>AI-prioritized dashboard — filter by child, complete actions</span>
      </a>
      <a class="card" href="/deck/">
        <strong>Pitch Deck</strong>
        <span>10-slide VC presentation — arrow keys to navigate</span>
      </a>
      <a class="card" href="/NinjaParent-Investor-One-Pager.pdf">
        <strong>One-Pager PDF</strong>
        <span>Single-page investor summary — print or share</span>
      </a>
      <a class="card" href="/demo/ninjaparent-demo-narrated.mp4">
        <strong>Demo Video <span class="badge">Narrated</span></strong>
        <span>Product walkthrough with AI voiceover</span>
      </a>
      <a class="card" href="/demo/ninjaparent-demo.mp4">
        <strong>Demo Video (silent)</strong>
        <span>Screen recording without narration</span>
      </a>
    </div>
    <footer>Seed Round · July 2026 · <a href="https://magical-beijinho-20ef2b.netlify.app" style="color:#5eead4">magical-beijinho-20ef2b.netlify.app</a></footer>
  </div>
</body>
</html>`
  await writeFile(path.join(SITE, 'index.html'), landingHtml)

  // SPA fallback for /app
  await writeFile(path.join(SITE, 'app', '_redirects'), '/*    /app/index.html   200\n')
  await writeFile(path.join(SITE, '_redirects'), '/app/*  /app/index.html  200\n')

  console.log(`Site built at ${SITE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
