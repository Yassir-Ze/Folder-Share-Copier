// Folder Share Copier — Popup Logic
// Reads a folder via <input webkitdirectory>, builds a structured text output,
// and copies it to the clipboard. Handles large folders with async batching.
//
// Architecture:
//   State is organized into file data, cached contents, and display counts.
//   File reading uses async batching (BATCH_SIZE=20) with await sleep(0)
//   to keep the popup responsive. File contents are cached after initial
//   read; only re-reads when ignore patterns change.

// ─── Constants ───────────────────────────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".avif",
  ".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma", ".m4a",
  ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm",
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".dat",
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  ".pyc", ".pyo", ".class", ".jar",
  ".o", ".a", ".lib", ".obj",
  ".iso", ".img", ".vhd",
  ".db", ".sqlite", ".sqlite3",
]);
const BATCH_SIZE = 20;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const LARGE_FOLDER_THRESHOLD = 500;

// ─── State ───────────────────────────────────────────────────────────────────

// Raw file data — populated fresh on each folder selection
let allFiles = [];                 // All File objects from the picker (before filtering)
let selectedFiles = [];            // Files after ignore-pattern filtering
let ignoredFilePaths = [];         // Paths excluded by patterns (for display)

// Counts from the read phase
let totalFiles = 0;
let ignoredCount = 0;
let binaryCount = 0;
let largeCount = 0;
let fileTreeHtml = "";
let lastFolderName = "";

// Cache — avoids re-reading files from disk on copy
let cachedFileContents = [];       // [{path: string, content: string}]
let cachedOutputText = "";         // Full formatted output (with contents)
let cachedTreeOutputText = "";     // Tree-only formatted output (paths only)
let cachedPatternsHash = "";       // Snapshot of patterns used when cache was built

// ─── DOM refs ────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const selectFolderBtn    = $("selectFolderBtn");
const folderInput        = $("folderInput");
const folderName         = $("folderName");
const ignorePatterns     = $("ignorePatterns");
const largeWarning       = $("largeWarning");
const largeWarningText   = $("largeWarningText");
const cancelLargeBtn     = $("cancelLargeBtn");
const continueLargeBtn   = $("continueLargeBtn");
const treeSection        = $("treeSection");
const treeContainer      = $("treeContainer");
const fileCount          = $("fileCount");
const progressDisplay    = $("progressDisplay");
const ignoredSection     = $("ignoredSection");
const ignoredToggle      = $("ignoredToggle");
const ignoredToggleArrow = $("ignoredToggleArrow");
const ignoredCountDisplay = $("ignoredCountDisplay");
const ignoredList        = $("ignoredList");
const warningSection     = $("warningSection");
const warningText        = $("warningText");
const statsSection       = $("statsSection");
const outputStats        = $("outputStats");
const treeOnlyCheckbox   = $("treeOnlyCheckbox");
const actionSection      = $("actionSection");
const selectAnotherBtn   = $("selectAnotherBtn");
const copyBtn            = $("copyBtn");
const toast              = $("toast");

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Load saved ignore patterns
  const result = await chrome.storage.sync.get(["ignorePatterns", "lastFolderName"]);
  if (result.ignorePatterns && Array.isArray(result.ignorePatterns)) {
    ignorePatterns.value = result.ignorePatterns.join("\n");
  }
  // Restore last folder name for display (requirement 10)
  if (result.lastFolderName) {
    folderName.textContent = result.lastFolderName;
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Check if a file is almost certainly binary based on extension or MIME type.
function isBinaryFile(file) {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return (
    BINARY_EXTENSIONS.has(ext) ||
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/")
  );
}

// Classify why a file should be skipped. Returns null if it's OK to read.
function classifyFile(file) {
  if (file.size > MAX_FILE_SIZE) return "large";
  if (isBinaryFile(file)) return "binary";
  return null;
}

// Produce a stable hash of the ignore pattern list for cache invalidation.
function hashPatterns(raw) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
    .join("|");
}

// Format byte count into human-readable string.
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Folder selection ────────────────────────────────────────────────────────

selectFolderBtn.addEventListener("click", () => {
  resetState();
  folderInput.click();
});

selectAnotherBtn.addEventListener("click", () => {
  resetState();
  folderInput.click();
});

folderInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  await handleFolderSelected(files);
});

// Core handler invoked after the user picks a folder via the file input.
async function handleFolderSelected(files) {
  // Reset everything
  resetState();
  allFiles = files;

  // Derive folder name from the first file's webkitRelativePath
  const firstPath = files[0].webkitRelativePath;
  const rootName = firstPath.split("/")[0];
  folderName.textContent = rootName;
  lastFolderName = rootName;

  // Build ignore patterns list
  const rawPatterns = ignorePatterns.value;
  const patterns = parsePatterns(rawPatterns);

  // Filter out pattern-ignored files
  const filtered = filterFiles(files, patterns);
  selectedFiles = filtered.files;
  ignoredFilePaths = filtered.ignoredPaths;
  ignoredCount = filtered.ignoredCount;
  totalFiles = selectedFiles.length;

  // Show file count
  fileCount.textContent = `${totalFiles} file${totalFiles !== 1 ? "s" : ""} selected`;

  if (totalFiles === 0) {
    showIgnoredFiles();
    return;
  }

  // Large folder guard (requirement 8)
  if (totalFiles >= LARGE_FOLDER_THRESHOLD) {
    const ok = await confirmLargeFolder(totalFiles, ignoredCount);
    if (!ok) {
      resetState();
      return;
    }
  }

  // Persist the folder name after the user commits to processing it (not on cancel)
  await chrome.storage.sync.set({ lastFolderName: rootName });

  // Show tree section and begin reading
  treeSection.classList.remove("hidden");
  progressDisplay.textContent = "Reading... 0%";

  // Read files in batches (async to keep UI responsive)
  const result = await readFilesBatched(selectedFiles);

  // Store counts from read phase (fix for bug #1: return values)
  binaryCount = result.binaryCount;
  largeCount = result.largeCount;

  // Render tree
  treeContainer.innerHTML = fileTreeHtml;

  // Show ignored files in collapsible section (bug fix #2)
  showIgnoredFiles();

  // Show warnings
  showWarnings();

  // Cache the formatted outputs (enhancement #4)
  buildOutputCache();

  // Show stats
  updateStats();

  // Enable UI
  progressDisplay.textContent = "100%";
  copyBtn.disabled = false;
  actionSection.classList.remove("hidden");
  statsSection.classList.remove("hidden");
}

// ─── Large folder warning (requirement 8) ────────────────────────────────────

function confirmLargeFolder(fileCount, ignoredCount) {
  return new Promise((resolve) => {
    const extra = ignoredCount > 0
      ? ` (${ignoredCount} ignored by patterns)`
      : "";
    largeWarningText.textContent =
      `This folder contains ${fileCount} readable files${extra}. ` +
      `Processing more than ${LARGE_FOLDER_THRESHOLD} files may cause the popup to lag. ` +
      `Consider narrowing your ignore patterns or selecting a smaller folder.`;
    largeWarning.classList.remove("hidden");

    cancelLargeBtn.onclick = () => {
      largeWarning.classList.add("hidden");
      resolve(false);
    };
    continueLargeBtn.onclick = () => {
      largeWarning.classList.add("hidden");
      resolve(true);
    };
  });
}

// ─── Parse patterns from textarea ────────────────────────────────────────────

function parsePatterns(raw) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Filter files by ignore patterns ─────────────────────────────────────────

// Convert glob-like patterns to regex, filter files, and return the results.
// Returns { files, ignoredPaths, ignoredCount }
function filterFiles(files, patterns) {
  const regexes = patterns.map((p) => {
    let escaped = p.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    escaped = escaped.replace(/\*/g, ".*");
    return new RegExp(escaped, "i");
  });

  const keep = [];
  const ignoredPaths = [];
  let ignored = 0;

  for (const file of files) {
    const path = file.webkitRelativePath;
    const shouldIgnore = regexes.some((re) => re.test(path));
    if (shouldIgnore) {
      ignored++;
      ignoredPaths.push(path);
    } else {
      keep.push(file);
    }
  }

  return { files: keep, ignoredPaths, ignoredCount: ignored };
}

// ─── Show / hide ignored files list (bug fix #2) ─────────────────────────────

function showIgnoredFiles() {
  if (ignoredFilePaths.length === 0) {
    ignoredSection.classList.add("hidden");
    return;
  }

  ignoredCountDisplay.textContent = ignoredFilePaths.length;
  ignoredList.innerHTML = ignoredFilePaths
    .map((p) => `<div class="ignored-file">${escapeHtml(p)}</div>`)
    .join("");
  ignoredSection.classList.remove("hidden");

  // Toggle expand/collapse
  ignoredToggle.onclick = () => {
    const isHidden = ignoredList.classList.toggle("hidden");
    ignoredToggleArrow.classList.toggle("expanded", !isHidden);
    ignoredToggle.setAttribute("aria-expanded", !isHidden);
  };
}

// ─── Batched file reader ─────────────────────────────────────────────────────

// Reads files in batches, populates the tree HTML and the file content cache.
// Returns { binaryCount, largeCount } — each file counted only once (bug fix #3).
async function readFilesBatched(files) {
  let binCount = 0;
  let bigCount = 0;
  let treeLines = [];
  let contents = [];        // Temporary cache accumulator

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    for (const file of batch) {
      const path = file.webkitRelativePath;
      const classification = classifyFile(file);

      if (classification === "large") {
        bigCount++;
        treeLines.push(escapeHtml(`⏭️ ${path} (over 1 MB, skipped)`));
        continue;
      }
      if (classification === "binary") {
        binCount++;
        treeLines.push(escapeHtml(`⏭️ ${path} (binary, skipped)`));
        continue;
      }

      // Attempt to read as text
      let content;
      try {
        content = await readFileAsText(file);
      } catch {
        binCount++;
        treeLines.push(escapeHtml(`⏭️ ${path} (binary, skipped)`));
        continue;
      }

      // Null-byte check catches remaining binary files
      if (content.includes("\u0000")) {
        binCount++;
        treeLines.push(escapeHtml(`⏭️ ${path} (binary content, skipped)`));
        continue;
      }

      // Valid text file — add to tree and cache
      treeLines.push(escapeHtml(`📄 ${path}`));
      contents.push({ path, content });
    }

    // Update progress after each batch
    const pct = Math.round(((i + batch.length) / files.length) * 100);
    progressDisplay.textContent = `Reading... ${pct}%`;

    // Yield to the event loop so the UI updates
    await sleep(0);
  }

  // Wrap tree lines in <div> elements for HTML rendering
  fileTreeHtml = treeLines.map((l) => `<div class="tree-item">${l}</div>`).join("");

  // Store cached contents (requirement 4)
  cachedFileContents = contents;

  return { binaryCount: binCount, largeCount: bigCount };
}

// ─── Build cached output text (requirement 4) ────────────────────────────────

// After reading completes, pre-compute both output variants and store them
// so the copy button doesn't need to re-read files from disk.
function buildOutputCache() {
  // Full output with file contents
  let full = "";
  let tree = "";

  for (const { path, content } of cachedFileContents) {
    full += `=== file: ${path} ===\n`;
    full += content;
    full += "\n\n";
  }

  // Tree-only output — include ALL selected file paths (binary + large included)
  // since this is just a structural listing, not content-dependent.
  for (const f of selectedFiles) {
    tree += `=== file: ${f.webkitRelativePath} ===\n\n`;
  }

  cachedOutputText = full;
  cachedTreeOutputText = tree;
  cachedPatternsHash = hashPatterns(ignorePatterns.value);
}

// ─── Invalidate and rebuild cache when patterns change ───────────────────────

// Re-filters allFiles with the current patterns, re-reads matching files,
// and refreshes the tree + stats. Called from the copy handler when
// the pattern hash differs from cachedPatternsHash.
async function rebuildCacheWithNewPatterns() {
  const rawPatterns = ignorePatterns.value;
  const patterns = parsePatterns(rawPatterns);

  // Re-filter
  const filtered = filterFiles(allFiles, patterns);
  selectedFiles = filtered.files;
  ignoredFilePaths = filtered.ignoredPaths;
  ignoredCount = filtered.ignoredCount;
  totalFiles = selectedFiles.length;

  fileCount.textContent = `${totalFiles} file${totalFiles !== 1 ? "s" : ""} selected`;

  if (totalFiles === 0) {
    treeContainer.innerHTML = "";
    treeSection.classList.add("hidden");
    cachedFileContents = [];
    cachedOutputText = "";
    cachedTreeOutputText = "";
    cachedPatternsHash = hashPatterns(rawPatterns);
    showIgnoredFiles();
    return;
  }

  // Re-read
  progressDisplay.textContent = "Re-reading... 0%";
  const result = await readFilesBatched(selectedFiles);
  binaryCount = result.binaryCount;
  largeCount = result.largeCount;

  treeContainer.innerHTML = fileTreeHtml;
  showIgnoredFiles();
  showWarnings();
  buildOutputCache();
  updateStats();
  progressDisplay.textContent = "100%";
}

// ─── Show warning section ────────────────────────────────────────────────────

function showWarnings() {
  const warnings = [];
  if (binaryCount > 0) {
    warnings.push(`Skipped ${binaryCount} binary file${binaryCount !== 1 ? "s" : ""}`);
  }
  if (largeCount > 0) {
    warnings.push(`Skipped ${largeCount} file${largeCount !== 1 ? "s" : ""} over 1 MB`);
  }
  if (ignoredCount > 0) {
    warnings.push(`Ignored ${ignoredCount} file${ignoredCount !== 1 ? "s" : ""} by pattern`);
  }

  if (warnings.length > 0) {
    warningText.textContent = warnings.join(". ") + ".";
    warningSection.classList.remove("hidden");
  } else {
    warningSection.classList.add("hidden");
  }
}

// ─── Stats display (enhancements #6 and #7) ──────────────────────────────────

// Updates the output statistics row based on current cache and tree-only mode.
function updateStats() {
  const isTreeOnly = treeOnlyCheckbox.checked;

  if (isTreeOnly) {
    // Tree-only stats: includes ALL selected files (binary + large paths listed)
    const count = selectedFiles.length;
    const size = cachedTreeOutputText.length;
    const lines = size > 0 ? cachedTreeOutputText.split("\n").length : 0;
    outputStats.textContent = `${count} files, ${lines.toLocaleString()} lines, ${formatSize(size)} (tree only)`;
  } else {
    // Full-mode stats from cache
    const count = cachedFileContents.length;
    if (count === 0) {
      outputStats.textContent = "No readable files";
      return;
    }
    let chars = 0;
    let lines = 0;
    for (const { path, content } of cachedFileContents) {
      chars += `=== file: ${path} ===\n`.length + content.length + 2;
      lines += 2 + content.split("\n").length;
    }
    outputStats.textContent = `${count} files, ${lines.toLocaleString()} lines, ${chars.toLocaleString()} chars, ${formatSize(chars)}`;
  }
}

// ─── Tree-only toggle (enhancement #5) ───────────────────────────────────────

treeOnlyCheckbox.addEventListener("change", () => {
  updateStats();
});

// ─── File reading helper ─────────────────────────────────────────────────────

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ─── Copy to clipboard ───────────────────────────────────────────────────────

copyBtn.addEventListener("click", async () => {
  copyBtn.disabled = true;
  copyBtn.textContent = "⏳ Preparing...";

  try {
    // Check if patterns have changed since cache was built (requirement 4)
    const currentHash = hashPatterns(ignorePatterns.value);

    if (currentHash !== cachedPatternsHash) {
      // Patterns changed — re-filter + re-read before copying
      await rebuildCacheWithNewPatterns();
    }

    // Choose output based on tree-only mode (enhancement #5)
    const output = treeOnlyCheckbox.checked ? cachedTreeOutputText : cachedOutputText;

    if (!output) {
      showToast("Nothing to copy — no readable files");
      return;
    }

    await copyTextToClipboard(output);
    showToast("Copied to clipboard!");
  } finally {
    copyBtn.disabled = false;
    copyBtn.textContent = "\u{1F4CB} Copy to Clipboard";
  }
});

// ─── Clipboard helpers ───────────────────────────────────────────────────────

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments where the async Clipboard API isn't available
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

// ─── State reset (requirement 9) ─────────────────────────────────────────────

// Clears all state so the user can select a different folder cleanly.
function resetState() {
  allFiles = [];
  selectedFiles = [];
  ignoredFilePaths = [];
  totalFiles = 0;
  ignoredCount = 0;
  binaryCount = 0;
  largeCount = 0;
  fileTreeHtml = "";
  cachedFileContents = [];
  cachedOutputText = "";
  cachedTreeOutputText = "";
  cachedPatternsHash = "";

  treeSection.classList.add("hidden");
  ignoredSection.classList.add("hidden");
  warningSection.classList.add("hidden");
  statsSection.classList.add("hidden");
  actionSection.classList.add("hidden");
  largeWarning.classList.add("hidden");
  treeContainer.innerHTML = "";
  fileCount.textContent = "";
  progressDisplay.textContent = "";
  outputStats.textContent = "";
  folderName.textContent = "";
  copyBtn.disabled = true;
}

// ─── Toast notification ──────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
