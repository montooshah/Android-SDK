# NinjaParent Prototype

School communication dashboard with **real Gmail and Outlook integration**.

```bash
cp .env.example .env   # add OAuth credentials — see SETUP.md
npm install
npm run dev:all        # frontend :5173 + API :3001
```

- `npm run dev` — frontend only
- `npm run dev:api` — API server only
- `npm run build` — production frontend build

See **SETUP.md** for Gmail/Outlook OAuth setup.
