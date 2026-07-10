# NinjaParent — Investor Demo Package

Quick working prototype, pitch deck, demo video, and **live deployment** for VC presentations.

## Live demo (deployed)

**Parent app** and **investor hub** are now separate:

| Resource | URL | Notes |
|----------|-----|-------|
| **Parent app** | Deploy `ninjaparent/` standalone | `npm run dev:all` → http://localhost:5173 |
| **Investor hub** | `site/` after `npm run build:site` | Pitch deck, PDF, demo videos only |

The investor hub no longer embeds the app at `/app/`. Use the **Open the app** button on the investor landing page.

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
