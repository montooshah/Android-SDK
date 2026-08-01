/**
 * Generic profile — no domain aliases beyond identity.
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});
  const profiles = (ns.profiles = ns.profiles || {});

  profiles.generic = {
    id: "generic",
    name: "Generic form",
    hostPatterns: [/.*/],
    /**
     * Map of canonicalKey → list of aliases (already conceptually normalized).
     * Identity only; fuzzy matching handles the rest.
     */
    aliases: {},
    /**
     * Optional hint selectors for known fields (empty for generic).
     */
    selectors: {},
  };
})(globalThis);
