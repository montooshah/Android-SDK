/**
 * Maps extracted data keys → discovered page fields.
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});

  function invertAliases(aliases) {
    const map = new Map();
    for (const [canonical, list] of Object.entries(aliases || {})) {
      const canonNorm = ns.normalizeKey(canonical);
      map.set(canonNorm, canonNorm);
      for (const a of list) map.set(ns.normalizeKey(a), canonNorm);
    }
    return map;
  }

  function resolveProfile(profileId, hostname) {
    const profiles = ns.profiles || {};
    if (profileId && profiles[profileId]) return profiles[profileId];

    // Auto-detect by host
    for (const p of Object.values(profiles)) {
      if (p.id === "generic") continue;
      if ((p.hostPatterns || []).some((re) => re.test(hostname))) return p;
    }
    return profiles.generic || { id: "generic", aliases: {}, selectors: {} };
  }

  function fieldSearchText(field) {
    return [field.label, field.name, field.id, field.placeholder, field.ariaLabel]
      .filter(Boolean)
      .join(" ");
  }

  /**
   * @param {Record<string,string>} data normalized extracted data
   * @param {Array} fields discovered page fields
   * @param {object} options { profileId, hostname, overrides }
   * @returns {{ mappings: Array, unmatchedData: string[], unmatchedFields: Array, profile }}
   */
  function mapFields(data, fields, options = {}) {
    const profile = resolveProfile(options.profileId, options.hostname || "");
    const aliasToCanon = invertAliases(profile.aliases);
    const overrides = options.overrides || {}; // dataKey → fieldId

    const usedFields = new Set();
    const mappings = [];
    const dataKeys = Object.keys(data || {});

    // Apply user overrides first
    for (const [dataKey, fieldId] of Object.entries(overrides)) {
      const field = fields.find((f) => f.fieldId === fieldId);
      if (!field || data[dataKey] == null) continue;
      mappings.push({
        dataKey,
        value: data[dataKey],
        fieldId: field.fieldId,
        selector: field.selector,
        label: field.label || field.name || field.id,
        confidence: 1,
        source: "override",
      });
      usedFields.add(field.fieldId);
    }

    // Canonicalize data keys via aliases
    const canonData = {};
    for (const key of dataKeys) {
      const nk = ns.normalizeKey(key);
      const canon = aliasToCanon.get(nk) || nk;
      if (overrides[key] || overrides[nk] || overrides[canon]) continue;
      if (canonData[canon] == null) canonData[canon] = { value: data[key], originalKey: key };
    }

    // Score each remaining data key against remaining fields
    for (const [canon, { value, originalKey }] of Object.entries(canonData)) {
      let best = null;
      for (const field of fields) {
        if (usedFields.has(field.fieldId)) continue;
        if (field.type === "hidden" || field.type === "submit" || field.type === "button") continue;

        const search = fieldSearchText(field);
        const searchNorm = ns.normalizeKey(search);
        let score = 0;
        let source = "fuzzy";

        if (searchNorm === canon || ns.normalizeKey(field.name) === canon || ns.normalizeKey(field.id) === canon) {
          score = 0.98;
          source = "exact";
        } else if (aliasToCanon.get(ns.normalizeKey(field.name)) === canon || aliasToCanon.get(ns.normalizeKey(field.id)) === canon) {
          score = 0.92;
          source = "alias";
        } else {
          score = ns.tokenSimilarity(canon, search);
          // Boost if selector hint matches
          const hints = (profile.selectors && profile.selectors[canon]) || [];
          // hints are CSS — we only boost if field selector string overlaps hint keywords
          if (hints.length && hints.some((h) => search.toLowerCase().includes(canon.split("_")[0]))) {
            score = Math.min(1, score + 0.15);
            source = "profile_hint";
          }
        }

        if (!best || score > best.score) {
          best = { field, score, source };
        }
      }

      if (best && best.score >= 0.45) {
        mappings.push({
          dataKey: originalKey,
          canonicalKey: canon,
          value,
          fieldId: best.field.fieldId,
          selector: best.field.selector,
          label: best.field.label || best.field.name || best.field.id,
          confidence: Number(best.score.toFixed(2)),
          source: best.source,
        });
        usedFields.add(best.field.fieldId);
      }
    }

    mappings.sort((a, b) => b.confidence - a.confidence);

    const matchedDataKeys = new Set(mappings.map((m) => m.dataKey));
    const unmatchedData = dataKeys.filter((k) => !matchedDataKeys.has(k) && data[k] !== "");
    const unmatchedFields = fields.filter(
      (f) =>
        !usedFields.has(f.fieldId) &&
        f.type !== "hidden" &&
        f.type !== "submit" &&
        f.type !== "button"
    );

    return { mappings, unmatchedData, unmatchedFields, profile };
  }

  ns.mapFields = mapFields;
  ns.resolveProfile = resolveProfile;
})(globalThis);
