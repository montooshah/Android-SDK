# NinjaParent — Investor Demo Package

Quick working prototype, pitch deck, demo video, and **live deployment** for VC presentations.

## Live demo (deployed)

| Resource | URL |
|----------|-----|
| **Landing page** | https://magical-beijinho-20ef2b.netlify.app |
| **Prototype** | https://magical-beijinho-20ef2b.netlify.app/app/ |
| **Pitch deck** | https://magical-beijinho-20ef2b.netlify.app/deck/ |
| **One-pager PDF** | https://magical-beijinho-20ef2b.netlify.app/NinjaParent-Investor-One-Pager.pdf |
| **Narrated video** | https://magical-beijinho-20ef2b.netlify.app/demo/ninjaparent-demo-narrated.mp4 |

**Netlify Drop password:** `My-Drop-Site` (required for anonymous deploy — [claim the site](https://app.netlify.com/drop/magical-beijinho-20ef2b) within 60 min to remove password and get a permanent URL)

**GitHub Pages:** Site pushed to `gh-pages` branch — enable in repo Settings → Pages → branch `gh-pages` for `https://montooshah.github.io/Android-SDK/`

## What's included locally

| Asset | Location | Description |
|-------|----------|-------------|
| **Live prototype** | `ninjaparent/` | React dashboard with AI-prioritized school actions |
| **Pitch deck** | `pitch-deck/index.html` | 10-slide investor deck (keyboard navigable) |
| **One-pager PDF** | `pitch-deck/NinjaParent-Investor-One-Pager.pdf` | Single-page investor summary |
| **Demo video (silent)** | `demo/ninjaparent-demo.mp4` | ~70-second product walkthrough |
| **Demo video (narrated)** | `demo/ninjaparent-demo-narrated.mp4` | ~91-second walkthrough with TTS voiceover |
| **Static site** | `site/` | Built deployable bundle |

## Run locally

```bash
cd ninjaparent
npm install
npm run dev
# http://localhost:5173
```

## Build & deploy everything

```bash
# From repo root
npm install
npm run pdf              # Export one-pager PDF
npm run narrate          # Generate TTS narrated video
npm run build:site       # Build site/ folder
```

### Redeploy to Netlify Drop

```bash
cd site
npx netlify deploy --prod --dir=. --allow-anonymous --site-name your-site-name
```

### Enable GitHub Pages (permanent, free)

1. Repo → Settings → Pages → Source: `gh-pages` branch, `/`
2. Push updates: `cd site && git push -f origin HEAD:gh-pages` (after rebuilding)

## Pitch deck

Open `pitch-deck/index.html` in a browser. Use **arrow keys** or nav buttons.

## Narrated video

Generated with Microsoft Edge TTS (`en-GB-SoniaNeural`). Re-run:

```bash
npm run narrate
```

Voiceover script: `demo/VOICEOVER-SCRIPT.md`

## Investor talking points

- **Problem:** Parents receive 50–200 school messages/month across 5+ apps per child
- **Solution:** One dashboard, AI-prioritized actions, filter by child
- **Market:** 8M UK households with school-age children; £9.99/mo SaaS
- **Moat:** Cross-school parent graph + priority ML trained on parent behavior
- **Ask:** £750K seed to build integrations and acquire first 500 families
