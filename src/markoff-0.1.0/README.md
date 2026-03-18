<div align="center">
  <img src="public/logo.png" alt="markoff" height="80" />
  <h1>markoff</h1>
  <strong>
    Minimal distraction-free Markdown reader & editor
  </strong>
  <br>
  <br>
  <h2>
    <a href="https://github.com/bennyzen/markoff">github.com/bennyzen/markoff</a>
  </h2>
</div>
<hr>
<div align="center">
  <a href="#why">Why</a> • <a href="#features">Features</a> • <a href="#shortcuts">Shortcuts</a> • <a href="#themes">Themes</a> • <a href="#development">Development</a>
</div>

## Why

markoff is a spin-off of [markon](https://github.com/getmarkon/markon), a web-based Markdown editor. As a PWA, markon runs in a browser sandbox — which means it has no access to the local filesystem. Images referenced in markdown files (e.g. `![](./diagram.png)`) simply don't load. The browser's File System Access API requires the user to manually grant directory access through a picker dialog every single time, which is terrible UX and defeats the purpose of double-clicking a `.md` file to read it.

markoff solves this by wrapping the app in [Tauri v2](https://v2.tauri.app/), giving it native filesystem access. Double-click a markdown file, and it opens with all relative images resolved automatically — no prompts, no permissions dialogs, no broken images.

Other improvements over markon:
- **Reader-first**: defaults to full-width reader mode instead of split editor/preview
- **Preview themes**: 10 independent typographic styles, separate from color schemes
- **Content width**: capped for readability on wide screens
- **Native binary**: no browser required, launches instantly

## Features

- **Native app**: Tauri v2 wrapper with full filesystem access
- **GFM**: GitHub Flavored Markdown + alerts
- **Syntax**: 250+ languages with highlighting
- **Reader mode**: full-width preview (default)
- **Local images**: resolves relative image paths from markdown files
- **Color schemes**: 14 presets with dark/light modes
- **Preview themes**: 10 typographic styles (Billboard, GitHub, Terminal, Magazine, etc.)
- **File handler**: opens `.md` files from your OS file manager
- **Print/PDF**: print stylesheet for clean PDF export via `Ctrl+P`
- **Offline**: no network required

## Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+E` | Toggle reader mode |
| `Ctrl+J` | Cycle preview theme |
| `Ctrl+M` | Toggle dark/light mode |
| `Ctrl+Shift+M` | Cycle color scheme |
| `Ctrl+S` | Save as file |
| `Ctrl+O` | Open file |
| `Ctrl+K` | Toggle spell checker |
| `Ctrl+B` | Toggle scroll sync |
| `Ctrl+Shift+C` | Copy to clipboard |
| `Ctrl+Shift+V` | Paste from clipboard |
| `Ctrl+/` | Settings |
| `Ctrl+P` | Print / Save as PDF |

## Install

Download the latest release for your platform from [GitHub Releases](https://github.com/bennyzen/markoff/releases).

| Platform | File |
|----------|------|
| Linux | `.deb`, `.rpm`, or standalone binary |
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.msi` or `.exe` |

### Build from source

```bash
git clone https://github.com/bennyzen/markoff.git
cd markoff
npm install
npx tauri build --no-bundle    # binary at src-tauri/target/release/markoff
```

## Development

```bash
npm run dev      # start dev server
npx tauri dev    # start Tauri dev mode
npm run check    # lint code
npm run fix      # fix lint issues
```

<details>
<summary id="themes">Themes & Color Schemes</summary>

**markoff** separates **color schemes** (palette) from **preview themes** (typography & layout). These are independent — any color scheme works with any preview theme.

### Color Schemes

14 built-in schemes, each with dark and light modes: Panda, Muted, Nord, Monokai, Dracula, Solarized, GitHub, One Dark, Gruvbox, Tokyo Night, Ayu, Catppuccin, Tomorrow.

### Preview Themes

10 typographic styles that control how rendered markdown looks:

- **Default** — System fonts, balanced spacing
- **GitHub** — Familiar README style, underlined headings
- **Academic** — Serif, indented paragraphs, scholarly feel
- **Terminal** — Monospace, `#` heading prefixes, `>` list markers
- **Magazine** — Serif, drop caps, generous line-height
- **Compact** — Small type, tight spacing, information-dense
- **Notebook** — Warm serif, wavy link underlines, cozy reading
- **Billboard** — Public Sans, ultralight oversized headings
- **Prose** — Source Serif, indented paragraphs, accent underlines
- **Geometric** — Space Grotesk, sharp edges, accent heading borders

</details>

---

## License

[AGPL-3.0](LICENSE)
