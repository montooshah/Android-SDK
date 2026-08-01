/**
 * Content script — discovers fillable fields and applies values.
 */
(function () {
  if (window.__xeroFormFillerContentLoaded) return;
  window.__xeroFormFillerContentLoaded = true;

  const FILL_HIGHLIGHT = "xero-ff-filled";

  function ensureStyles() {
    if (document.getElementById("xero-ff-styles")) return;
    const style = document.createElement("style");
    style.id = "xero-ff-styles";
    style.textContent = `
      .${FILL_HIGHLIGHT} {
        outline: 2px solid #13b5ea !important;
        outline-offset: 1px !important;
        transition: outline-color 0.3s ease;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function visible(el) {
    if (!el || el.disabled) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  }

  function labelFor(el) {
    if (el.labels && el.labels.length) {
      return Array.from(el.labels)
        .map((l) => l.innerText || l.textContent || "")
        .join(" ")
        .trim();
    }
    const id = el.id;
    if (id) {
      const byFor = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (byFor) return (byFor.innerText || byFor.textContent || "").trim();
    }
    const wrapped = el.closest("label");
    if (wrapped) return (wrapped.innerText || wrapped.textContent || "").trim();

    // Nearby text: previous sibling or parent previous
    const prev = el.previousElementSibling;
    if (prev && ["LABEL", "SPAN", "DIV", "P", "TD", "TH"].includes(prev.tagName)) {
      const t = (prev.innerText || prev.textContent || "").trim();
      if (t && t.length < 80) return t;
    }

    const parent = el.parentElement;
    if (parent) {
      const clone = parent.cloneNode(true);
      clone.querySelectorAll("input,select,textarea,button").forEach((n) => n.remove());
      const t = (clone.innerText || "").trim().split("\n")[0];
      if (t && t.length < 80) return t;
    }
    return "";
  }

  function buildSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
    // fallback path
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  }

  function discoverFields() {
    const nodes = document.querySelectorAll("input, select, textarea");
    const fields = [];
    let idx = 0;
    for (const el of nodes) {
      const type = (el.type || el.tagName.toLowerCase()).toLowerCase();
      if (["hidden", "submit", "button", "image", "file", "reset", "password"].includes(type)) continue;
      if (!visible(el) && type !== "checkbox" && type !== "radio") continue;

      const fieldId = `ff_${idx++}_${el.name || el.id || type}`;
      el.dataset.xeroFfId = fieldId;

      fields.push({
        fieldId,
        tag: el.tagName.toLowerCase(),
        type,
        name: el.name || "",
        id: el.id || "",
        placeholder: el.placeholder || "",
        ariaLabel: el.getAttribute("aria-label") || "",
        label: labelFor(el),
        selector: buildSelector(el),
        value: el.value || "",
      });
    }
    return {
      fields,
      url: location.href,
      hostname: location.hostname,
      title: document.title,
    };
  }

  function setNativeValue(el, value) {
    const proto =
      el.tagName === "SELECT"
        ? window.HTMLSelectElement.prototype
        : el.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function fireEvents(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function findElement(mapping) {
    if (mapping.fieldId) {
      const byData = document.querySelector(`[data-xero-ff-id="${CSS.escape(mapping.fieldId)}"]`);
      if (byData) return byData;
    }
    if (mapping.selector) {
      try {
        const el = document.querySelector(mapping.selector);
        if (el) return el;
      } catch {
        /* ignore bad selector */
      }
    }
    return null;
  }

  function fillFields(mappings, options = {}) {
    ensureStyles();
    const results = [];
    for (const m of mappings || []) {
      const el = findElement(m);
      if (!el) {
        results.push({ fieldId: m.fieldId, ok: false, error: "Element not found" });
        continue;
      }

      const type = (el.type || "").toLowerCase();
      try {
        if (type === "checkbox") {
          const truthy = /^(true|1|yes|y|on|checked)$/i.test(String(m.value));
          el.checked = truthy;
          fireEvents(el);
        } else if (type === "radio") {
          if (String(el.value).toLowerCase() === String(m.value).toLowerCase()) {
            el.checked = true;
            fireEvents(el);
          }
        } else if (el.tagName === "SELECT") {
          const val = String(m.value);
          let matched = false;
          for (const opt of el.options) {
            if (opt.value === val || opt.text.trim().toLowerCase() === val.toLowerCase()) {
              el.value = opt.value;
              matched = true;
              break;
            }
          }
          if (!matched) setNativeValue(el, val);
          fireEvents(el);
        } else {
          setNativeValue(el, String(m.value));
          fireEvents(el);
        }

        if (options.highlight !== false) {
          el.classList.add(FILL_HIGHLIGHT);
          setTimeout(() => el.classList.remove(FILL_HIGHLIGHT), 2500);
        }
        results.push({ fieldId: m.fieldId, ok: true });
      } catch (err) {
        results.push({ fieldId: m.fieldId, ok: false, error: String(err) });
      }
    }
    return {
      filled: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "PING") {
      sendResponse({ ok: true, from: "content" });
      return;
    }

    if (message.type === "SCAN_FIELDS") {
      try {
        sendResponse({ ok: true, ...discoverFields() });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
      return;
    }

    if (message.type === "FILL_FIELDS") {
      try {
        const report = fillFields(message.mappings || [], message.options || {});
        sendResponse({ ok: true, ...report });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
      return;
    }
  });
})();
