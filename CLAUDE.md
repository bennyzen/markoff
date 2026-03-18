# Markoff

Minimal distraction-free Markdown reader & editor. A spin-off of [markon](https://github.com/getmarkon/markon), wrapped in Tauri v2 for native desktop use with full filesystem access.

## Architecture

**Frontend**: Vanilla JS (ES modules) + CSS custom properties. No frameworks.
**Backend**: Tauri v2 (Rust) for native file I/O and image resolution.
**Build**: Vite 7 + vite-plugin-pwa. Biome for linting/formatting.

### Key modules (`src/`)

| File | Purpose |
|------|---------|
| `main.js` | App bootstrap, Tauri/PWA file handling |
| `core.js` | CodeMirror 6 editor setup |
| `preview.js` | Markdown rendering (marked + morphdom), local image resolution |
| `actions.js` | Toolbar actions, hotkeys config (`ACTIONS_CONFIG` is the single source of truth) |
| `settings.js` | Settings dialog, color scheme & preview theme pickers |
| `hotkeys.js` | Keyboard shortcut handler |
| `utils.js` | Theme helpers, `PREVIEW_THEMES` array, DOM utilities |
| `storage.js` | Persistence orchestrator (delegates to `worker.js`) |
| `worker.js` | Web Worker for async IndexedDB read/write |
| `toc.js` | Table of contents overlay |
| `syntax.js` | Highlight.js lazy loading |
| `callouts.js` | GitHub-style callout rendering |

### Tauri backend (`src-tauri/src/`)

| Command | Purpose |
|---------|---------|
| `read_file_text` | Read a file as UTF-8 string |
| `read_file_as_data_url` | Read a file as base64 data URL (for images) |
| `get_pending_file` | Get the file path passed as CLI arg |

**Important**: Tauri v2 command params must be camelCase in both Rust and JS. Rust uses `#[allow(non_snake_case)]` for this.

### Data flow

1. Editor input → CodeMirror listener → subscriber callbacks
2. Subscribers: storage (persist to IndexedDB), preview (re-render)
3. Preview: `marked.parse()` → `enhanceCallouts()` → `highlightAll()` → `morphdom()` → `handleLocalImages()`
4. Image resolution: relative `src` → Tauri `invoke('read_file_as_data_url')` → base64 data URL → cached in memory

### Theming

Two independent systems:
- **Color schemes**: `data-theme` + `data-mode` attributes on `<html>`, defined in `themes.css`
- **Preview themes**: `data-preview-theme` attribute on `<html>`, `--pv-*` CSS variables on `#preview` (not `#previewhtml`, so TOC inherits the font)

## Code style

Enforced by Biome (`biome.json`):
- **Tabs** for indentation
- **Single quotes**, semicolons as needed
- **120 char** line width
- **Arrow parens**: as needed (`x => x`, not `(x) => x`)

Run `npm run check` to lint, `npm run fix` to auto-fix.

### Conventions

- Pure functions, no classes (except `LatencyProfiler` in profiler.js)
- One module per feature
- Functions: `camelCase`, verb-first (`createEditor`, `setupPreview`)
- Constants: `UPPER_SNAKE_CASE`
- CSS IDs/classes: `kebab-case`
- Global state on `window.__` prefix (`__fileBaseDir`, `__launchedWithFile`)

## Build & run

```bash
npm install
npx tauri dev              # dev mode with hot reload
npx tauri build --no-bundle  # release binary
npm run dev                # web-only dev server (no Tauri)
npm run build              # web-only production build
```

Binary output: `src-tauri/target/release/markoff`

## CI

- `.github/workflows/release.yml` — Builds Linux/macOS/Windows binaries on `v*` tags via `tauri-apps/tauri-action@v1`

## Things to know

- No test framework exists yet
- `sample.md` is the default content shown when no file is opened
- WebKitGTK (Linux webview) has quirks: avoid `grid` + `fit-content` combos, use `-webkit-backdrop-filter` prefix, `color-mix()` may not work
- Storage keys are `markoff-storage` / `markoff-content` (IndexedDB via Web Worker)
- `__MARKON_PERF__` global exposes the profiler (legacy name, not user-facing)
