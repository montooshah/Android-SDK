/**
 * Background service worker — thin lifecycle + ping handler.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Xero Form Filler] installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true, from: "background" });
  }
  return false;
});
