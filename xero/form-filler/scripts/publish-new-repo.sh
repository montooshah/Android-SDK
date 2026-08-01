#!/usr/bin/env bash
# Publish this extension as its own GitHub repository.
#
# Prerequisites:
#   - gh CLI authenticated as the account that should own the repo
#   - git installed
#
# Usage (from anywhere):
#   bash scripts/publish-new-repo.sh [owner/repo-name]
#
# Examples:
#   bash scripts/publish-new-repo.sh
#   bash scripts/publish-new-repo.sh montooshah/xero-form-filler

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_REPO="montooshah/xero-form-filler"
TARGET="${1:-$DEFAULT_REPO}"
OWNER="${TARGET%%/*}"
NAME="${TARGET#*/}"

if [[ "$OWNER" == "$NAME" ]]; then
  echo "Expected owner/repo, got: $TARGET" >&2
  exit 1
fi

echo "==> Publishing $ROOT as github.com/$TARGET"

if ! command -v gh >/dev/null; then
  echo "gh CLI not found. Install: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/xero-form-filler-publish.XXXXXX")"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

echo "==> Copying extension into clean workdir: $WORKDIR"
cp -a "$ROOT"/. "$WORKDIR"/
cd "$WORKDIR"
rm -rf .git

# Prefer standalone docs at repo root
if [[ -f README.md ]]; then
  :
fi

git init -b main
git add .
git commit -m "Initial commit: Xero Form Filler Chrome extension

Upload CSV/TXT/PDF and autofill web forms. Includes demo page,
sample files, Xero invoice profile, and testing guide."

if gh repo view "$TARGET" >/dev/null 2>&1; then
  echo "==> Repo $TARGET already exists — pushing main"
else
  echo "==> Creating public repo $TARGET"
  gh repo create "$TARGET" --public \
    --description "Chrome extension: upload CSV/TXT/PDF and autofill web forms (Xero-ready)" \
    --source=. \
    --remote=origin \
    --push
  echo "Done: https://github.com/$TARGET"
  exit 0
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${TARGET}.git"
git push -u origin main
echo "Done: https://github.com/$TARGET"
