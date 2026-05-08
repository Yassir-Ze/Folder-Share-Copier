# Contributing to Folder Share Copier

Thank you for considering a contribution! This is a small open-source project
built with vanilla JavaScript, and every issue, PR, and suggestion helps.

## Quick Links

- [Open an issue](https://github.com/Yassir-Ze/folder-share-copier/issues/new)
- [Submit a PR](https://github.com/Yassir-Ze/folder-share-copier/compare)
- [Discussions](https://github.com/Yassir-Ze/folder-share-copier/discussions)

## Development Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/Yassir-Ze/folder-share-copier.git
   cd folder-share-copier
   ```

2. No build step, no dependencies. Just edit the files.

3. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer mode
   - Click **Load unpacked**
   - Select the `folder-share-copier` folder

4. Make your changes, then reload the extension (refresh icon on the extension card).

## Code Style

- **Vanilla JavaScript only** — no React, no TypeScript, no build tools.
- **ES modules** are used where appropriate (`type: "module"` in background).
- **No external dependencies** — everything is hand-written.
- **Comments** on non-obvious logic (but don't over-comment).
- **Dark theme** — all UI follows the Catppuccin Mocha color palette.
- **Consistent naming** — `camelCase` for variables/functions, `kebab-case` for CSS classes.
- **Async batching** — any operation that reads files or might block the UI should use batching with `await sleep(0)`.

## What Needs Help

| Area | Skill Level | Description |
|---|---|---|
| Firefox port | Advanced | Port the extension to Firefox's Manifest V3 API |
| Token counting | Intermediate | Add token estimation for GPT-4, Claude 3, etc. |
| Tests | Intermediate | Add manual test scenarios for edge cases |
| UI polish | Beginner | Improve the dark theme, add light mode option |
| Documentation | Beginner | Improve README, add screenshots, write tutorials |
| Issue triage | Beginner | Help reproduce and categorize bug reports |

## Pull Request Process

1. Fork the repo and create a branch from `main`.
2. If your change adds a feature, open an issue first to discuss it.
3. Keep changes focused — one feature/fix per PR.
4. Update the README if your change affects usage.
5. Update CHANGELOG.md under the "Unreleased" section.
6. Make sure the extension loads without errors in Developer mode.
7. Open the PR against `main`.

## Reporting Bugs

When opening a bug report, include:

- Chrome version (chrome://version)
- Extension version (from chrome://extensions)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshot (if visual)

## Feature Requests

Open an issue with the label `enhancement`. Describe:

- What you want to achieve
- Why the current behavior doesn't support it
- Any examples of how you've seen this done elsewhere

## Code of Conduct

Be respectful. This is a hobby project maintained by real people.
Harassment, trolling, and entitlement will not be tolerated.

---

Thanks for helping make Folder Share Copier better.
