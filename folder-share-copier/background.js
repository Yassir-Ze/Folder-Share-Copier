// Folder Share Copier — Background Service Worker
// Handles keyboard shortcut and extension lifecycle events.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default ignore patterns on first install
    chrome.storage.sync.get("ignorePatterns", (data) => {
      if (!data.ignorePatterns) {
        chrome.storage.sync.set({
          ignorePatterns: ["node_modules", ".git", "dist", ".cache", "coverage"],
        });
      }
    });
  }
});
