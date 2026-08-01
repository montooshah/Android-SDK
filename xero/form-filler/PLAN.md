# Xero Form Filler — Architecture Plan

## Goal

A robust, flexible Chrome extension that lets a user upload a local **PDF**, **CSV**, or **TXT** file, extract structured field data, and autofill matching inputs on the active webpage (starting with Xero-style invoice/bill forms, but not limited to them).

## User flow

1. User opens a web form (e.g. Xero New Invoice / Bill, or any HTML form).
2. User clicks the extension icon → popup opens.
3. User uploads a file (PDF / CSV / TXT).
4. Extension parses the file into a normalized `Record<fieldKey, value>`.
5. Extension scans the page for fillable controls and builds a field inventory.
6. Mapper matches extracted keys → page fields (profile aliases + fuzzy label match).
7. Popup shows a preview of proposed mappings; user can adjust.
8. User clicks **Fill form** → content script writes values and dispatches input/change events.

## Architecture (Manifest V3)

```
xero/form-filler/
├── manifest.json              # MV3 permissions, content scripts, popup
├── background/service-worker.js
├── popup/                     # Upload, parse preview, mapping UI, Fill CTA
├── content/                   # Form discovery + fill on the page
├── lib/
│   ├── parsers/               # csv | txt | pdf → normalized data
│   ├── fieldMapper.js         # alias + fuzzy matching
│   └── profiles/              # site/form profiles (xero-invoice, generic)
├── options/                   # Saved custom mappings / profile editor
└── demo/                      # Local demo form + sample files for testing
```

### Message flow

```
Popup  --parse-->  parsers (in popup)
Popup  --SCAN_FIELDS-->  content script  --fields-->  Popup
Popup  --map-->  fieldMapper + active profile
Popup  --FILL-->  content script  (applies values, fires events)
```

### Why this split

| Piece | Responsibility |
|-------|----------------|
| **Parsers** | Format-specific extraction only; never touch the DOM |
| **Profiles** | Domain knowledge (Xero labels/aliases) without hardcoding into filler |
| **Field mapper** | Generic match engine used by all profiles |
| **Content script** | Only code that reads/writes the live page |
| **Options** | Persist custom mappings so the plugin stays flexible |

## Parsing strategy

### CSV
- Detect delimiter (`,`, `;`, `\t`)
- Support two shapes:
  - **Row map**: header row + one data row → `{header: value}`
  - **Key/value columns**: two columns (`Field,Value`) → same shape
- Trim keys/values; ignore empty rows

### TXT
- Support `Key: Value`, `Key = Value`, and `Key\tValue` lines
- Ignore comments (`#`) and blank lines
- Fallback: treat first non-empty line as free text note field

### PDF
- Use vendored **PDF.js** (no remote script)
- Extract text content per page, then run the same TXT key/value heuristics
- Also run labeled-line heuristics common on invoices:
  - `Invoice Number`, `Invoice Date`, `Due Date`, `Bill To`, amounts, etc.
- Limitation: scanned image-only PDFs need OCR (phase 2); text PDFs work now

## Form discovery & fill

Content script collects for each control:

- `tag`, `type`, `name`, `id`, `placeholder`, `aria-label`
- Associated `<label>` text / nearby text
- Visibility + enabled state
- Stable selector hint (`#id` or `[name=…]`)

Fill path:

1. Set `value` / `checked` / `selected`
2. Dispatch `input`, `change`, and `blur` (React/Xero-friendly)
3. Optionally highlight filled fields briefly

## Mapping engine

1. Normalize keys (`invoice number` → `invoice_number`)
2. Apply **profile aliases** (e.g. `inv_no`, `invoice #` → `invoiceNumber`)
3. Score against page field labels/names (exact > alias > fuzzy token overlap)
4. Prefer unambiguous high-confidence matches; leave low-confidence for manual map in popup
5. Persist user overrides per host in `chrome.storage.sync`

### Built-in profiles

| Profile | Target |
|---------|--------|
| `generic` | Any form; label/name fuzzy match only |
| `xero-invoice` | Xero invoice/bill fields (contact, dates, reference, line items, totals) |

Custom profiles can be added as JSON under `lib/profiles/` or via Options UI.

## Permissions (minimal)

- `activeTab` — act on the current tab when the user opens the popup
- `storage` — save mappings/preferences
- `scripting` — inject fill logic if needed
- Host access: `<all_urls>` for content script (required to fill arbitrary sites); can be tightened later to `*.xero.com`

## Robustness / flexibility principles

1. **Parsers are pluggable** — new formats = new file under `lib/parsers/`
2. **Profiles are data** — Xero specifics are aliases, not hard-coded selectors only
3. **Preview before fill** — never silently overwrite without user confirmation
4. **Event-complete fill** — works with React-controlled inputs (Xero)
5. **Demo harness** — local HTML form + samples so we can test without a Xero login
6. **Graceful PDF failure** — clear message if text cannot be extracted (suggest CSV/TXT)

## Phased delivery

### Phase 1 (this PR) — MVP
- MV3 extension shell + popup upload
- CSV / TXT / PDF (text) parsers
- Generic + Xero invoice profiles
- Scan → map → preview → fill
- Demo page + sample files
- Options page for saved overrides

### Phase 2 (after sample screenshots)
- Tighten Xero selectors from real DOM screenshots
- Line-item table filling (multi-row)
- Host-specific auto profile detection (`go.xero.com`)

### Phase 3 (optional)
- OCR for scanned PDFs (Tesseract or remote API with user consent)
- Bulk fill from multi-row CSV
- Side panel UI instead of popup for longer mapping sessions

## Testing plan

1. Load unpacked extension from `xero/form-filler`
2. Open `demo/sample-form.html`
3. Upload `demo/samples/invoice.csv` → Fill → verify fields
4. Repeat with `.txt` and text `.pdf`
5. Manually remap one field in preview and confirm override persists

## Open input from you

Sample screenshots of the **target Xero page** and a **sample PDF** will let us lock exact labels/selectors and improve PDF heuristics in Phase 2. The Phase 1 design already supports that refinement without rewriting the core.
