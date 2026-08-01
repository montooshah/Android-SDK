/**
 * TXT → { key: value }
 * Supports Key: Value | Key = Value | Key\tValue
 * Also pulls common invoice-labeled lines from free-form text.
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});
  const parsers = (ns.parsers = ns.parsers || {});

  const LABEL_PATTERNS = [
    [/invoice\s*(?:number|no\.?|#)\s*[:#]?\s*(.+)/i, "invoice_number"],
    [/inv\s*(?:number|no\.?|#)\s*[:#]?\s*(.+)/i, "invoice_number"],
    [/reference\s*[:#]?\s*(.+)/i, "reference"],
    [/po\s*(?:number|no\.?|#)?\s*[:#]?\s*(.+)/i, "purchase_order"],
    [/invoice\s*date\s*[:#]?\s*(.+)/i, "invoice_date"],
    [/issue\s*date\s*[:#]?\s*(.+)/i, "invoice_date"],
    [/due\s*date\s*[:#]?\s*(.+)/i, "due_date"],
    [/bill\s*to\s*[:#]?\s*(.+)/i, "contact_name"],
    [/customer\s*[:#]?\s*(.+)/i, "contact_name"],
    [/contact\s*[:#]?\s*(.+)/i, "contact_name"],
    [/email\s*[:#]?\s*(.+)/i, "email"],
    [/phone\s*[:#]?\s*(.+)/i, "phone"],
    [/subtotal\s*[:#]?\s*(.+)/i, "subtotal"],
    [/tax\s*(?:amount)?\s*[:#]?\s*(.+)/i, "tax"],
    [/total\s*(?:due|amount)?\s*[:#]?\s*(.+)/i, "total"],
    [/currency\s*[:#]?\s*(.+)/i, "currency"],
    [/description\s*[:#]?\s*(.+)/i, "description"],
    [/quantity\s*[:#]?\s*(.+)/i, "quantity"],
    [/unit\s*price\s*[:#]?\s*(.+)/i, "unit_price"],
    [/amount\s*[:#]?\s*(.+)/i, "amount"],
  ];

  function parseKeyValueLine(line) {
    const m = line.match(/^([^:=\t]{1,80})\s*[:=\t]\s*(.+)$/);
    if (!m) return null;
    const key = ns.normalizeKey(m[1]);
    if (!key || key.length > 60) return null;
    return [key, ns.normalizeValue(m[2])];
  }

  function parseTxt(text) {
    const data = {};
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/);

    let kvCount = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const kv = parseKeyValueLine(line);
      if (kv) {
        data[kv[0]] = kv[1];
        kvCount += 1;
        continue;
      }

      for (const [re, canonical] of LABEL_PATTERNS) {
        const m = line.match(re);
        if (m && !data[canonical]) {
          data[canonical] = ns.normalizeValue(m[1]);
        }
      }
    }

    if (!Object.keys(data).length) {
      const joined = lines.map((l) => l.trim()).filter(Boolean).join(" ");
      if (joined) data.notes = ns.normalizeValue(joined.slice(0, 500));
    }

    return {
      data,
      meta: { format: "txt", keyValueLines: kvCount, fields: Object.keys(data).length },
    };
  }

  parsers.txt = parseTxt;
})(globalThis);
