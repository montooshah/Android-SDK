/**
 * Shared key/value normalization helpers used by parsers and mapper.
 * Attaches to globalThis.XeroFormFiller
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});

  function normalizeKey(raw) {
    return String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/[#№]/g, " number ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeValue(raw) {
    if (raw == null) return "";
    return String(raw).trim().replace(/\s+/g, " ");
  }

  function tokenize(text) {
    return normalizeKey(text)
      .split("_")
      .filter((t) => t.length > 1);
  }

  /** Dice coefficient on token sets — good enough fuzzy for field labels. */
  function tokenSimilarity(a, b) {
    const ta = new Set(tokenize(a));
    const tb = new Set(tokenize(b));
    if (!ta.size || !tb.size) return 0;
    let overlap = 0;
    for (const t of ta) if (tb.has(t)) overlap += 1;
    return (2 * overlap) / (ta.size + tb.size);
  }

  ns.normalizeKey = normalizeKey;
  ns.normalizeValue = normalizeValue;
  ns.tokenize = tokenize;
  ns.tokenSimilarity = tokenSimilarity;
})(globalThis);
