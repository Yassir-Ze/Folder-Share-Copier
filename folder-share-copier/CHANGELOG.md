# Changelog

All notable changes to Folder Share Copier will be documented in this file.

## [1.0.0] — 2026-05-08

### Initial Release

- Folder selection via `<input webkitdirectory>` native picker
- Ignore patterns (default: `node_modules`, `.git`, `dist`, `.cache`, `coverage`)
- Structured output format: `=== file: path ===\n[content]\n\n`
- Async batched file reading (20 files per batch) — handles 100+ files without freezing
- Real-time progress percentage while reading
- Binary file detection (extension blacklist + MIME type + null-byte check)
- Large file skipping (>1 MB, with warning)
- "Copy file tree only" mode — copies folder structure without contents
- Output statistics preview (files, lines, characters, estimated size)
- Collapsible "Ignored files" section in tree preview
- Large folder warning dialog (500+ file threshold)
- Select another folder button with full state reset
- Last folder name persisted across popup sessions
- Settings page for customizing default ignore patterns
- Keyboard shortcut: Ctrl+Shift+F (Win/Linux) / Cmd+Shift+F (Mac)
- Dark developer theme (Catppuccin Mocha-inspired)
- Toast notification on copy
- Clipboard API with execCommand fallback
- Pattern-change detection: auto re-reads when ignore patterns are modified
- Manifest V3 compliant
