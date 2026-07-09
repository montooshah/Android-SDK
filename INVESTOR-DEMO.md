# NinjaParent — Investor Demo Package

Quick working prototype, pitch deck, and demo video for VC presentations.

## What's included

| Asset | Location | Description |
|-------|----------|-------------|
| **Live prototype** | `ninjaparent/` | React dashboard with AI-prioritized school actions |
| **Pitch deck** | `pitch-deck/index.html` | 10-slide investor deck (keyboard navigable) |
| **Demo video** | `demo/ninjaparent-demo.mp4` | ~90-second product walkthrough |

## Run the prototype

```bash
cd ninjaparent
npm install
npm run dev
```

Open http://localhost:5173

## View the pitch deck

Open `pitch-deck/index.html` in a browser. Use **arrow keys** or the nav buttons to move between slides.

## Re-record demo video

```bash
cd ninjaparent
npm install playwright
npx playwright install chromium
npm run demo:record
```

## 90-second demo script

1. **0:00–0:10** — Dashboard overview: 3 kids, 4 connected apps, week stats
2. **0:10–0:25** — AI Priority Insight: explain smart ranking
3. **0:25–0:45** — Scroll action cards: payment, registration, overdue homework
4. **0:45–0:60** — Filter by Noah → child-specific queue
5. **0:60–0:75** — Filter Payments → batch payment view
6. **0:75–0:90** — Mark action complete → filter by Lily

## Investor talking points

- **Problem:** Parents receive 50–200 school messages/month across 5+ apps per child
- **Solution:** One dashboard, AI-prioritized actions, filter by child
- **Market:** 8M UK households with school-age children; £9.99/mo SaaS
- **Moat:** Cross-school parent graph + priority ML trained on parent behavior
- **Ask:** £750K seed to build integrations and acquire first 500 families
