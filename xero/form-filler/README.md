# Xero Form Filler

Chrome extension (Manifest V3) that uploads a local **CSV**, **TXT**, or **PDF**, extracts fields, and fills the active web form. Tuned for Xero-style invoice/bill pages, but works on any HTML form via a generic profile.

> Full architecture notes: see [PLAN.md](./PLAN.md).

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder (`xero/form-filler`)
4. Pin the extension

## Quick test

1. Open `demo/sample-form.html` in Chrome
2. Click the extension icon
3. Upload `demo/samples/invoice.csv` (or `.txt` / `.pdf`)
4. Review proposed mappings → **Fill form**

## Features

- **Parsers**: CSV (header row or Field/Value), TXT (`Key: Value` + invoice heuristics), PDF (text extraction via PDF.js)
- **Profiles**: `xero-invoice` aliases + `generic` fuzzy match
- **Preview & remap** before filling; overrides saved per hostname
- **React-friendly fill**: sets native value setters and fires `input` / `change` / `blur`
- **Demo harness** so you can test without a Xero login

## Project layout

```
xero/form-filler/
├── PLAN.md                 # Architecture & phases
├── manifest.json
├── popup/                  # Upload + mapping UI
├── content/content.js      # Scan & fill page fields
├── background/
├── lib/parsers/            # csv | txt | pdf
├── lib/profiles/           # generic | xero-invoice
├── lib/fieldMapper.js
├── options/                # Defaults & override management
└── demo/                   # Sample form + files
```

## Adding a new site profile

1. Copy `lib/profiles/xero-invoice.js` → `lib/profiles/your-site.js`
2. Define `aliases` (canonical key → alternate names) and optional `selectors`
3. Include the script in `popup/popup.html`
4. Add an `<option>` in the profile select

## Limitations (Phase 1)

- Scanned/image-only PDFs need OCR (not included) — use CSV/TXT or a text PDF
- Multi-row line-item tables are parsed from CSV `rows` but only the first row is auto-filled
- Real Xero DOM selectors will be tightened once sample screenshots are available

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` / `scripting` | Scan & fill the page you are on |
| `storage` | Save mapping overrides |
| `<all_urls>` | Content script on arbitrary forms (can be narrowed later) |
