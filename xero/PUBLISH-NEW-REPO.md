# Create a dedicated GitHub repository

The cloud agent token can push to existing repos (like this one) but **cannot create new repositories** under your account. Run these steps once on your machine (with your GitHub login).

## Option A — one script (recommended)

From a checkout of this branch:

```bash
cd xero/form-filler
bash scripts/publish-new-repo.sh montooshah/xero-form-filler
```

That will:

1. Copy the extension into a clean temp folder (repo root = extension root)
2. `git init` + initial commit
3. `gh repo create` (public) and push `main`

Requires: [GitHub CLI](https://cli.github.com/) (`gh auth login`).

## Option B — manual

1. On GitHub: **New repository** → name `xero-form-filler` → Public → **do not** add README/license
2. Locally:

```bash
# from this branch
rm -rf /tmp/xero-form-filler && mkdir /tmp/xero-form-filler
cp -a xero/form-filler/. /tmp/xero-form-filler/
cd /tmp/xero-form-filler
rm -rf .git
git init -b main
git add .
git commit -m "Initial commit: Xero Form Filler Chrome extension"
git remote add origin https://github.com/montooshah/xero-form-filler.git
git push -u origin main
```

## After it exists

- Clone: `git clone https://github.com/montooshah/xero-form-filler.git`
- Load unpacked from the clone root (folder with `manifest.json`)
- Follow [form-filler/TESTING.md](./form-filler/TESTING.md)

If you create an **empty** repo and paste the URL here, a follow-up agent can push into it for you.
