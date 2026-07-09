# NinjaParent — Gmail & Outlook Setup

## Quick start

```bash
cd ninjaparent
cp .env.example .env
# Add OAuth credentials to .env (see below)
npm install
npm run dev:all
```

Open **http://localhost:5173** → complete the **sign-up flow** (name, children, connect Gmail/Outlook) → dashboard.

On first launch (especially on mobile), you'll see a 3-step onboarding:
1. **Welcome** — parent name & email
2. **Your children** — add kids for email matching
3. **Connect** — Gmail and/or Outlook integration

---

## Google Gmail

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → enable **Gmail API**
3. **OAuth consent screen** → External → add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
4. **Credentials** → Create **OAuth client ID** → Web application
5. Authorized redirect URI:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
6. Copy Client ID and Secret to `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

**Note:** While in testing mode, add your Gmail address as a test user on the consent screen.

---

## Microsoft Outlook

1. Go to [Azure Portal](https://portal.azure.com/) → **App registrations** → New registration
2. Redirect URI (Web):
   ```
   http://localhost:3001/api/auth/microsoft/callback
   ```
3. **Certificates & secrets** → New client secret
4. **API permissions** → Add:
   - `Microsoft Graph` → Delegated → `Mail.Read`, `User.Read`, `offline_access`
5. Copy Application (client) ID and secret to `.env`:
   ```
   MICROSOFT_CLIENT_ID=...
   MICROSOFT_CLIENT_SECRET=...
   MICROSOFT_TENANT_ID=common
   ```

---

## How it works

```
Gmail/Outlook OAuth → store tokens (SQLite)
        ↓
Fetch school-related emails (last 30 days)
        ↓
Rule-based extraction → action items
        ↓
Match to children via name/year/school keywords
        ↓
Priority scoring → dashboard
```

### Email query (Gmail)

Searches for messages newer than 30 days matching school-related keywords (school, homework, parentpay, trip, newsletter, etc.).

### Child matching

Default children (Lily, Noah, Mia) are seeded with keywords. Emails are matched by child name, year group, and school name in subject/body.

Unmatched emails appear under **Unassigned**.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + OAuth config status |
| GET | `/api/auth/google` | Start Gmail OAuth |
| GET | `/api/auth/microsoft` | Start Outlook OAuth |
| GET | `/api/dashboard` | Children, action items, stats |
| GET | `/api/connections` | Connected accounts |
| POST | `/api/sync` | Fetch & process new emails |
| POST | `/api/action-items/:id/complete` | Mark action done |
| DELETE | `/api/connections/:id` | Disconnect account |

---

## Production deployment

Update redirect URIs in Google/Azure to your production API URL, e.g.:

```
https://api.ninjaparent.app/api/auth/google/callback
https://api.ninjaparent.app/api/auth/microsoft/callback
```

Set `FRONTEND_URL` to your frontend origin and deploy the API alongside the React app (or proxy `/api` to the Node server).
