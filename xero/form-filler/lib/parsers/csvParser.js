/**
 * CSV → { key: value }
 * Supports:
 *  - header row + single data row
 *  - two-column Field,Value layout
 *  - multi-row: returns first data row + __rows array for future line items
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});
  const parsers = (ns.parsers = ns.parsers || {});

  function detectDelimiter(text) {
    const first = text.split(/\r?\n/).find((l) => l.trim()) || "";
    const counts = {
      ",": (first.match(/,/g) || []).length,
      ";": (first.match(/;/g) || []).length,
      "\t": (first.match(/\t/g) || []).length,
    };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ",";
  }

  function parseLine(line, delimiter) {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells.map((c) => c.trim());
  }

  function looksLikeKeyValue(headers) {
    if (headers.length < 2) return false;
    const h0 = ns.normalizeKey(headers[0]);
    const h1 = ns.normalizeKey(headers[1]);
    return (
      (h0 === "field" || h0 === "key" || h0 === "name" || h0 === "label") &&
      (h1 === "value" || h1 === "data" || h1 === "val")
    );
  }

  function parseCsv(text) {
    const cleaned = String(text || "").replace(/^\uFEFF/, "");
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length);
    if (!lines.length) {
      return { data: {}, meta: { format: "csv", rows: 0 } };
    }

    const delimiter = detectDelimiter(cleaned);
    const rows = lines.map((l) => parseLine(l, delimiter));
    const headers = rows[0];

    // Field,Value layout (explicit header only — avoids misreading 2-column tables)
    if (looksLikeKeyValue(headers)) {
      const body = rows.slice(1);
      const data = {};
      for (const row of body) {
        const key = ns.normalizeKey(row[0]);
        if (!key) continue;
        data[key] = ns.normalizeValue(row[1]);
      }
      return {
        data,
        meta: { format: "csv", layout: "key_value", delimiter, rows: body.length },
      };
    }

    // Header + data rows
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));
    const first = {};
    headers.forEach((h, i) => {
      const key = ns.normalizeKey(h);
      if (!key) return;
      first[key] = ns.normalizeValue((dataRows[0] || [])[i]);
    });

    const allRows = dataRows.map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = ns.normalizeKey(h);
        if (!key) return;
        obj[key] = ns.normalizeValue(r[i]);
      });
      return obj;
    });

    return {
      data: first,
      rows: allRows,
      meta: { format: "csv", layout: "tabular", delimiter, rows: allRows.length },
    };
  }

  parsers.csv = parseCsv;
})(globalThis);
