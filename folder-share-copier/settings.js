// Folder Share Copier — Settings Page Logic

const DEFAULTS = ["node_modules", ".git", "dist", ".cache", "coverage"];

const textarea  = document.getElementById("settingsIgnorePatterns");
const saveBtn   = document.getElementById("saveBtn");
const resetBtn  = document.getElementById("resetBtn");
const statusEl  = document.getElementById("saveStatus");

// Load saved patterns
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.sync.get("ignorePatterns");
  if (result.ignorePatterns && Array.isArray(result.ignorePatterns)) {
    textarea.value = result.ignorePatterns.join("\n");
  } else {
    textarea.value = DEFAULTS.join("\n");
  }
});

// Save
saveBtn.addEventListener("click", async () => {
  const patterns = textarea.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await chrome.storage.sync.set({ ignorePatterns: patterns });

  statusEl.classList.remove("hidden");
  setTimeout(() => statusEl.classList.add("hidden"), 2000);
});

// Reset to defaults
resetBtn.addEventListener("click", async () => {
  textarea.value = DEFAULTS.join("\n");
  await chrome.storage.sync.set({ ignorePatterns: DEFAULTS });

  statusEl.classList.remove("hidden");
  setTimeout(() => statusEl.classList.add("hidden"), 2000);
});
