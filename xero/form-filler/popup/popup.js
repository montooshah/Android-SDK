/**
 * Popup controller — upload → parse → scan → map → fill.
 */
(function () {
  const ns = globalThis.XeroFormFiller;
  const $ = (id) => document.getElementById(id);

  const state = {
    fileName: "",
    parsed: null,
    page: null,
    mapResult: null,
    overrides: {},
  };

  function setStatus(text, kind) {
    const el = $("status");
    el.textContent = text;
    el.classList.remove("error", "ok");
    if (kind) el.classList.add(kind);
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function ensureContentScript(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: "PING" });
      return true;
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content/content.js"],
      });
      return true;
    }
  }

  async function sendToTab(message) {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab");
    // chrome:// and store pages cannot be scripted
    if (tab.url && /^(chrome|chrome-extension|edge|about|devtools):/i.test(tab.url)) {
      throw new Error("Cannot access this page. Open a normal web form (or the demo HTML).");
    }
    await ensureContentScript(tab.id);
    return chrome.tabs.sendMessage(tab.id, message);
  }

  async function loadSavedOverrides(hostname) {
    const key = `overrides:${hostname || "unknown"}`;
    const stored = await chrome.storage.sync.get(key);
    return stored[key] || {};
  }

  async function saveOverrides(hostname, overrides) {
    const key = `overrides:${hostname || "unknown"}`;
    await chrome.storage.sync.set({ [key]: overrides });
  }

  function renderExtracted(data) {
    const panel = $("extractedPanel");
    const list = $("extractedList");
    const keys = Object.keys(data || {});
    $("extractCount").textContent = String(keys.length);
    if (!keys.length) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    list.innerHTML = keys
      .map(
        (k) =>
          `<div class="kv-row"><strong title="${escapeHtml(k)}">${escapeHtml(k)}</strong><span title="${escapeHtml(data[k])}">${escapeHtml(data[k])}</span></div>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderMappings(mapResult, fields) {
    const panel = $("mappingPanel");
    const list = $("mappingList");
    const mappings = mapResult?.mappings || [];
    $("mapCount").textContent = String(mappings.length);

    if (!mappings.length) {
      panel.hidden = true;
      $("actions").hidden = true;
      return;
    }

    panel.hidden = false;
    $("actions").hidden = false;
    $("fillBtn").disabled = false;

    const fieldOptions = (fields || [])
      .map(
        (f) =>
          `<option value="${escapeHtml(f.fieldId)}">${escapeHtml(f.label || f.name || f.id || f.fieldId)}</option>`
      )
      .join("");

    list.innerHTML = mappings
      .map((m) => {
        return `
        <div class="map-row" data-key="${escapeHtml(m.dataKey)}">
          <div>
            <div class="key">${escapeHtml(m.dataKey)} → <span class="conf">${Math.round(m.confidence * 100)}%</span></div>
            <div class="meta">${escapeHtml(String(m.value).slice(0, 60))}</div>
          </div>
          <select data-map-key="${escapeHtml(m.dataKey)}">
            ${fieldOptions.replace(
              `value="${escapeHtml(m.fieldId)}"`,
              `value="${escapeHtml(m.fieldId)}" selected`
            )}
          </select>
        </div>`;
      })
      .join("");

    list.querySelectorAll("select[data-map-key]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        const dataKey = sel.getAttribute("data-map-key");
        state.overrides[dataKey] = sel.value;
        if (state.page?.hostname) {
          await saveOverrides(state.page.hostname, state.overrides);
        }
        // Update mapping fieldId in place
        const m = state.mapResult.mappings.find((x) => x.dataKey === dataKey);
        if (m) {
          m.fieldId = sel.value;
          const field = state.page.fields.find((f) => f.fieldId === sel.value);
          if (field) {
            m.selector = field.selector;
            m.label = field.label || field.name || field.id;
            m.source = "override";
            m.confidence = 1;
          }
        }
      });
    });
  }

  async function remap() {
    if (!state.parsed || !state.page) return;
    const profileSelect = $("profileSelect").value;
    let profileId = profileSelect === "auto" ? null : profileSelect;

    // When auto-detect finds only generic (e.g. file:// demo), use saved default.
    if (!profileId) {
      const resolved = ns.resolveProfile(null, state.page.hostname || "");
      if (!resolved || resolved.id === "generic") {
        const stored = await chrome.storage.sync.get(["defaultProfile"]);
        profileId = stored.defaultProfile || "xero-invoice";
      }
    }

    state.mapResult = ns.mapFields(state.parsed.data, state.page.fields, {
      profileId,
      hostname: state.page.hostname,
      overrides: state.overrides,
    });

    renderMappings(state.mapResult, state.page.fields);

    const profileName = state.mapResult.profile?.name || "Generic";
    const n = state.mapResult.mappings.length;
    const warn = state.parsed.meta?.warning;
    setStatus(
      warn
        ? warn
        : `Parsed ${Object.keys(state.parsed.data).length} fields · ${n} mapped with “${profileName}”.`,
      warn ? "error" : n ? "ok" : undefined
    );
  }

  async function scanPage() {
    setStatus("Scanning page fields…");
    const res = await sendToTab({ type: "SCAN_FIELDS" });
    if (!res?.ok) throw new Error(res?.error || "Scan failed");
    state.page = res;
    state.overrides = await loadSavedOverrides(res.hostname);
    setStatus(`Found ${res.fields.length} fields on ${res.hostname || "page"}.`, "ok");
    if (state.parsed) await remap();
  }

  async function parseFile(file) {
    const name = file.name || "file";
    const lower = name.toLowerCase();
    let result;

    if (lower.endsWith(".csv") || file.type === "text/csv") {
      const text = await file.text();
      result = ns.parsers.csv(text);
    } else if (lower.endsWith(".txt") || file.type === "text/plain") {
      const text = await file.text();
      result = ns.parsers.txt(text);
    } else if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      const buf = await file.arrayBuffer();
      result = await ns.parsers.pdf(buf);
    } else {
      // Try text first, then pdf
      try {
        const text = await file.text();
        if (text.includes(",") || text.includes(":")) {
          result = text.includes(",") && text.split("\n")[0].includes(",")
            ? ns.parsers.csv(text)
            : ns.parsers.txt(text);
        } else {
          throw new Error("unknown");
        }
      } catch {
        const buf = await file.arrayBuffer();
        result = await ns.parsers.pdf(buf);
      }
    }

    state.fileName = name;
    state.parsed = result;
    $("fileName").hidden = false;
    $("fileName").textContent = name;
    renderExtracted(result.data);
    await remap();
  }

  async function fillForm() {
    if (!state.mapResult?.mappings?.length) {
      setStatus("Nothing to fill — upload a file and scan the page first.", "error");
      return;
    }
    $("fillBtn").disabled = true;
    setStatus("Filling form…");
    try {
      const res = await sendToTab({
        type: "FILL_FIELDS",
        mappings: state.mapResult.mappings,
        options: { highlight: true },
      });
      if (!res?.ok) throw new Error(res?.error || "Fill failed");
      setStatus(`Filled ${res.filled} field(s)${res.failed ? ` · ${res.failed} failed` : ""}.`, "ok");
    } catch (err) {
      setStatus(String(err.message || err), "error");
    } finally {
      $("fillBtn").disabled = false;
    }
  }

  // --- Wire UI ---
  const dropzone = $("dropzone");
  const fileInput = $("fileInput");

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", async (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      try {
        await parseFile(file);
      } catch (err) {
        setStatus(String(err.message || err), "error");
      }
    }
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      await parseFile(file);
    } catch (err) {
      setStatus(String(err.message || err), "error");
    }
  });

  $("scanBtn").addEventListener("click", async () => {
    try {
      await scanPage();
    } catch (err) {
      setStatus(String(err.message || err), "error");
    }
  });

  $("profileSelect").addEventListener("change", () => {
    remap().catch((err) => setStatus(String(err.message || err), "error"));
  });

  $("fillBtn").addEventListener("click", () => {
    fillForm();
  });

  $("optionsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Boot: scan page so mappings are ready after upload
  scanPage().catch((err) => {
    setStatus(`Ready to upload. (${err.message})`, undefined);
  });
})();
