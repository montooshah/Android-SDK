(async function () {
  const defaultProfileEl = document.getElementById("defaultProfile");
  const profileMsg = document.getElementById("profileMsg");
  const overridesList = document.getElementById("overridesList");
  const clearMsg = document.getElementById("clearMsg");

  const stored = await chrome.storage.sync.get(["defaultProfile"]);
  if (stored.defaultProfile) defaultProfileEl.value = stored.defaultProfile;

  document.getElementById("saveProfile").addEventListener("click", async () => {
    await chrome.storage.sync.set({ defaultProfile: defaultProfileEl.value });
    profileMsg.hidden = false;
    profileMsg.textContent = "Saved.";
  });

  async function renderOverrides() {
    const all = await chrome.storage.sync.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith("overrides:"));
    if (!keys.length) {
      overridesList.innerHTML = `<p class="help">No overrides saved yet.</p>`;
      return;
    }
    overridesList.innerHTML = keys
      .map((k) => {
        const host = k.replace(/^overrides:/, "");
        const count = Object.keys(all[k] || {}).length;
        return `<div class="item"><strong>${host}</strong> — <code>${count}</code> override(s)</div>`;
      })
      .join("");
  }

  document.getElementById("clearOverrides").addEventListener("click", async () => {
    const all = await chrome.storage.sync.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith("overrides:"));
    if (keys.length) await chrome.storage.sync.remove(keys);
    clearMsg.hidden = false;
    clearMsg.textContent = "Cleared.";
    await renderOverrides();
  });

  await renderOverrides();
})();
