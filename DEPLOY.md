# Deploying NinjaParent with real Gmail & Outlook

Netlify hosts the **static frontend** only. OAuth and email sync need the **Node API** running somewhere else. Netlify can proxy `/api/*` to that server so everything works on one URL.

## Architecture

```
Browser  →  your-site.netlify.app/app/
              ↓ /api/* proxied
            ninjaparent-api.onrender.com
              ↓ OAuth
            Gmail / Outlook
```

## Step 1 — Deploy the API (Render)

1. Push this repo to GitHub.
2. Go to [Render](https://render.com) → **New** → **Blueprint** → connect the repo.
3. Render reads `render.yaml` and creates the API service.
4. Set these environment variables in Render:

| Variable | Example |
|----------|---------|
| `FRONTEND_URL` | `https://your-site.netlify.app/app` |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://your-api.onrender.com/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | from Azure Portal |
| `MICROSOFT_CLIENT_SECRET` | from Azure Portal |
| `MICROSOFT_REDIRECT_URI` | `https://your-api.onrender.com/api/auth/microsoft/callback` |

5. Copy your Render URL, e.g. `https://ninjaparent-api.onrender.com`.

OAuth setup details: `ninjaparent/SETUP.md`

## Step 2 — Proxy API through Netlify

Rebuild the static site with your API URL:

```bash
NINJAPARENT_API_URL=https://ninjaparent-api.onrender.com npm run build:site
```

This adds a Netlify redirect rule:

```
/api/*  https://ninjaparent-api.onrender.com/api/:splat  200
```

Deploy `site/` to Netlify (same as before).

## Step 3 — Open the live app

Use **without** `?demo=1`:

```
https://your-site.netlify.app/app/
```

The app checks `/api/health`. If the API is reachable and OAuth is configured, Connect Gmail / Connect Outlook start real OAuth flows.

`?demo=1` still forces sample data for investor walkthroughs.

## Local development

```bash
cd ninjaparent
cp .env.example .env   # add OAuth keys
npm install
npm run dev:all        # frontend :5173, API :3001
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Connect button does nothing | API not deployed or `NINJAPARENT_API_URL` missing at build time |
| OAuth redirect error | Redirect URI in Google/Azure must match Render URL exactly |
| CORS error | Set `FRONTEND_URL` to your Netlify app URL including `/app` |
| API sleeps (Render free) | First request may take ~30s to wake; health check warms it |
