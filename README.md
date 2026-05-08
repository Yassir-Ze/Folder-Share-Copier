<div align="center">

# Folder Share Copier

<img src="icons/icon128.png" alt="Folder Share Copier icon" width="80" />

**Select any folder → copy its file tree + contents → paste into ChatGPT, Claude, or any AI tool.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-120+-brightgreen?style=flat-square&logo=googlechrome)](https://chrome.google.com/webstore)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange?style=flat-square)](CONTRIBUTING.md)

</div>

---

## Why This Exists

Every time you paste code into an AI chat, you have two bad options:

- **Copy a single file** — and the AI lacks context from related files.
- **Manually concatenate files** — tedious, error-prone, wastes 10 minutes.

This extension turns a folder into a formatted, AI-ready text block in one click:

```
=== file: src/utils/helpers.js ===
export function parseConfig(raw) { ... }

=== file: src/components/App.js ===
function App() { ... }

=== file: src/styles/main.css ===
body { margin: 0; ... }
```

LLMs understand this format instantly. No more "please also look at my other file."

---

## Features

| Feature | Detail |
|---|---|
| **Folder Picker** | Native OS dialog, works with any folder |
| **Ignore Patterns** | Skip `node_modules`, `.git`, `dist`, `.cache`, `coverage` — fully customizable |
| **Tree Preview** | See exactly which files will be copied before you hit copy |
| **Progress Indicator** | Shows reading percentage for large folders |
| **Binary Detection** | Skips images, videos, archives, compiled binaries automatically |
| **Large File Guard** | Files >1 MB are skipped to avoid bloated output |
| **Copy Output Stats** | See file count, lines, characters, and estimated size |
| **Tree-Only Mode** | Copy just the folder structure when you don't need contents |
| **500+ File Warning** | Get a warning before processing very large folders |
| **Keyboard Shortcut** | Ctrl+Shift+F (Win/Linux) / Cmd+Shift+F (Mac) |
| **Dark Theme** | Easy on the eyes, Catppuccin Mocha palette |
| **Settings Page** | Customize default ignore patterns |

---

## Screenshot

<!-- TODO: Replace with actual screenshot -->
```
┌─────────────────────────────────────────────────┐
│  Folder Share Copier                        ⚙  │
├─────────────────────────────────────────────────┤
│  [📂 Select Folder]  my-project/                │
│                                                 │
│  IGNORE PATTERNS (one per line):                │
│  ┌─────────────────────────────────────────────┐│
│  │ node_modules                                ││
│  │ .git                                        ││
│  │ dist                                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  24 files selected              Reading... 100% │
│  ┌─────────────────────────────────────────────┐│
│  │ 📄 src/index.js                             ││
│  │ 📄 src/utils/helpers.js                     ││
│  │ 📄 src/components/App.js                    ││
│  │ ⏭️ logo.png (binary, skipped)               ││
│  │ ...                                         ││
│  └─────────────────────────────────────────────┘│
│  ▶ Ignored files (142)                         │
│                                                 │
│  ⚠ Skipped 3 binary files. Ignored 142 by       │
│    pattern.                                     │
│                                                 │
│  24 files, 412 lines, 18.2k chars, 18.2 KB     │
│  ☐ Copy file tree only (no contents)            │
│                                                 │
│  [📂 Select Another]  [📋 Copy to Clipboard]    │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

1. Install the extension (see below).
2. Press **Ctrl+Shift+F** (or click the toolbar icon).
3. Click **Select Folder** and pick your project directory.
4. Review the file list and adjust ignore patterns if needed.
5. Click **Copy to Clipboard**.
6. Go to ChatGPT, Claude, or any chat — paste.

**Example output** for a small React project:

```text
=== file: src/App.js ===
import React from 'react';
function App() { return <div>Hello</div>; }
export default App;

=== file: src/index.js ===
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
ReactDOM.render(<App />, document.getElementById('root'));

=== file: package.json ===
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

---

## Installation

### Method 1: Developer Mode (load unpacked)

> Recommended if you want to use it right now. No Chrome Web Store account needed.

1. **Download the extension**
   ```bash
   git clone https://github.com/Yassir-Ze/folder-share-copier.git
   # or download & unzip the latest release from GitHub
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions`
   - Toggle **Developer mode** ON (top-right corner)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the `folder-share-copier` folder
   - The extension icon appears in your toolbar

4. **Done!** Pin it and press Ctrl+Shift+F.

### Method 2: Chrome Web Store

> Coming soon. I need to pay the $5 developer registration fee first.

Once published, you'll be able to install with one click from the Chrome Web Store. If you'd like to speed this up, [sponsor the project](https://github.com/Yassir-Ze/folder-share-copier).

---

## Keyboard Shortcut

| Platform | Shortcut |
|---|---|
| Windows / Linux | `Ctrl + Shift + F` |
| macOS | `Cmd + Shift + F` |

You can customize or remove this in `chrome://extensions/shortcuts`.

---

## Settings

Right-click the extension icon → **Options** (or click the gear icon in the popup).

Configure your default ignore patterns. Changes apply the next time you select a folder.

---

## File Structure

```
folder-share-copier/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker (init defaults)
├── popup.html             # Popup UI
├── popup.css              # Dark theme styles
├── popup.js               # Core logic (reading, formatting, copy)
├── settings.html          # Settings page
├── settings.js            # Settings logic
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT license
├── README.md              # This file
└── icons/
    ├── icon16.png         # Toolbar icon (16px)
    ├── icon48.png         # Extensions page icon (48px)
    └── icon128.png        # Store icon (128px)
```

---

## Known Limitations

- **Binary files** — images, videos, archives, compiled binaries are detected by extension, MIME type, and null-byte content check. They are skipped with a warning.
- **Large files** — files exceeding 1 MB are not read (avoid blowing up your clipboard context).
- **Clipboard limit** — Chrome's clipboard has a practical limit around 10 MB for `navigator.clipboard.writeText()`. Extremely large outputs may fail silently.
- **Encoding** — files are read as UTF-8. Non-UTF-8 text files may show garbled characters.
- **Folder size** — 500+ file folders show a warning. You can still proceed, but reading may take 10-30 seconds.
- **No content script** — the extension operates entirely from the popup. It doesn't inject anything into web pages.

---

## FAQ

### Why not just use the Chrome Web Store?

The Chrome Web Store requires a **$5 one-time developer registration fee**. This project is free and open source. If you want to pay the $5 for me, you're welcome to sponsor the project! Until then, Developer Mode installation takes 30 seconds and works identically.

### Is this safe?

Yes. The extension only runs when you click its icon. It never:
- Sends data anywhere (no network requests at all)
- Reads your browsing history
- Injects scripts into web pages
- Requires any accounts or logins

The only permission it needs is `clipboardWrite` (to copy text). You can verify this by reading the 100% vanilla JavaScript source code.

### Can I contribute features?

Absolutely! Open an issue or pull request on GitHub. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Does it work on Firefox / Edge?

This is a Chrome extension using Manifest V3 APIs. Edge supports Chrome extensions directly — install it the same way. Firefox uses a different extension API and is not currently supported.

### Will it steal my code?

No. The extension is fully offline. No data is sent anywhere. All processing happens locally in your browser. Read the source — it's 100% vanilla JavaScript with zero dependencies.

---

## Development

```bash
git clone https://github.com/Yassir-Ze/folder-share-copier.git
cd folder-share-copier
# No build step needed. Edit any file and reload the extension.
```

To reload after changes: go to `chrome://extensions` → click the refresh icon on the extension card.

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Built with vanilla JS, dark mode, and a deep frustration with copy-pasting code.</sub>
</div>
