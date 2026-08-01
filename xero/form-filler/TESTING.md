# Testing guide — Xero Form Filler

Best way to validate the extension end-to-end, from install through CSV / TXT / PDF fills.

## 1. Install (unpacked)

1. Open Chrome (or Chromium / Edge).
2. Go to `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the extension root folder — the one that contains `manifest.json`  
   (in this monorepo: `xero/form-filler`).
6. Pin the extension from the puzzle icon for quick access.

**Reload after code changes:** on `chrome://extensions`, click the refresh icon on the card.

---

## 2. Fastest happy path (recommended first)

Use the bundled demo — no Xero login required.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `demo/sample-form.html` in Chrome (File → Open, or drag into a tab) | “New Invoice” form with empty fields |
| 2 | Click the extension icon | Popup opens; status may say it scanned fields |
| 3 | Profile = **Xero Invoice / Bill** (or leave Auto) | — |
| 4 | Upload `demo/samples/invoice.csv` | Extracted data list appears; proposed mappings show high confidence |
| 5 | Click **Fill form** | Contact, invoice #, dates, amounts, etc. populate; fields flash teal outline |
| 6 | Repeat with `invoice.txt` then `invoice.pdf` | Same fields fill |

If fill works for all three formats on the demo page, the core pipeline is healthy.

---

## 3. Automated unit tests (parsers + mapper)

No browser needed:

```bash
cd xero/form-filler   # or repo root if this is the standalone repo
node test/run-tests.mjs
```

Expect: `12 passed, 0 failed`.

Covers: CSV Field/Value parse, TXT key/value parse, Xero profile mapping, key normalization.

---

## 4. Manual checklist by format

### CSV
- [ ] `demo/samples/invoice.csv` (Field,Value layout) fills the demo form
- [ ] Optional: a header+row CSV (e.g. `Contact,Email,Invoice Number` + one data row) also extracts correctly
- [ ] Empty file shows a clear “nothing extracted” style status (no crash)

### TXT
- [ ] `demo/samples/invoice.txt` fills the demo form
- [ ] Lines like `Invoice Number: INV-2048` and `Key = Value` both work
- [ ] `#` comment lines are ignored

### PDF
- [ ] `demo/samples/invoice.pdf` (text PDF) extracts and fills
- [ ] A scanned/image-only PDF shows a warning that no text was found (Phase 1 has no OCR)

---

## 5. Mapping & override behavior

1. Upload a sample so mappings appear.
2. In **Proposed mappings**, change one dropdown (e.g. map Total → Notes).
3. Click **Fill form** — confirm the override is applied.
4. Close popup, reopen on the same host — override should still be selected (saved in `chrome.storage.sync`).
5. Open **Options** (popup button or right-click extension → Options) → confirm override count → **Clear all overrides**.

---

## 6. Profile switching

| Profile | When to use | What to check |
|---------|-------------|----------------|
| Auto-detect | Xero hosts / demo | Picks Xero profile when hostname matches `*.xero.com`; demo/file URLs fall back to Xero default |
| Xero Invoice / Bill | Invoice/bill-like labels | Aliases like `inv_no`, `bill_to`, `po` resolve |
| Generic form | Non-Xero pages | Relies on label/name fuzzy match only |

Quick check: on the demo page, switch to **Generic** after upload — most fields should still map via labels.

---

## 7. Testing on a real Xero page

1. Sign in to Xero and open **New Invoice** (or Bill).
2. Click the extension → **Scan page**.
3. Upload your real CSV/TXT/PDF (or a sanitized sample).
4. Review mappings carefully — Xero’s React UI may use labels that differ slightly; remap any low-confidence rows.
5. **Fill form**, then visually confirm before saving in Xero.

**Tips**
- Prefer CSV/TXT for reliability until your real PDF layout is tuned.
- If a field doesn’t fill, re-scan after Xero finishes rendering the form.
- Do not use production data you aren’t comfortable processing locally (everything runs in the browser; no server upload).

---

## 8. Debugging when something fails

| Symptom | What to check |
|---------|----------------|
| “Cannot access this page” | You’re on `chrome://`, Web Store, or another restricted URL — use a normal http(s) or `file://` page |
| Popup shows 0 fields | Click **Scan page**; ensure the form finished loading; try a hard refresh |
| Extracted data empty (PDF) | Likely image/scanned PDF — use CSV/TXT or a text-based PDF |
| Wrong field filled | Remap in the popup; save override; or add aliases in `lib/profiles/xero-invoice.js` |
| Values don’t stick (React) | Content script already fires `input`/`change`/`blur`; re-scan and retry; check Console for errors |
| Extension outdated after edit | Reload unpacked extension on `chrome://extensions` |

**DevTools**
- Popup: right-click popup → **Inspect**
- Page / content script: F12 on the form tab → Console / Elements (`data-xero-ff-id` on scanned inputs)
- Service worker: `chrome://extensions` → service worker **Inspect views**

---

## 9. Suggested regression order (before shipping changes)

1. `node test/run-tests.mjs`
2. Demo + CSV fill
3. Demo + TXT fill
4. Demo + PDF fill
5. Remap override + Options clear
6. (Optional) Live Xero invoice with a sanitized sample file

---

## 10. Sample files included

| File | Purpose |
|------|---------|
| `demo/samples/invoice.csv` | Field/Value CSV — primary happy path |
| `demo/samples/invoice.txt` | Key: Value text |
| `demo/samples/invoice.pdf` | Minimal text PDF with the same invoice fields |
| `demo/sample-form.html` | Xero-style invoice form for local testing |
