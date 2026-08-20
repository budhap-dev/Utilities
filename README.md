# DevKit

A developer's daily toolbelt — JSON, dates, diffs, encoders and more — as a single React + webpack app that runs **entirely in the browser**. Nothing you paste ever leaves your machine.

> Read the product story, personas, module list and roadmap in [docs/STORY.md](docs/STORY.md).

## Tools

| Group | Tools |
|---|---|
| JSON | JSON Parser (validate, pinpoint errors, tree view, copy paths) · JSON Formatter (pretty / minify / sort keys / escape / unescape) |
| Date & Time | Date & Time Converter (epoch ↔ ISO ↔ any timezone, relative) · Cron Parser (explain + next runs) |
| Text & Files | File / Text Comparer (side-by-side & unified diff, inline highlights) · Text Utilities (case, lines, stats, lorem) · Regex Tester |
| Encoding | Base64 · URL Encoder · Number Base Converter (BigInt) |
| Security | JWT Decoder · Hash Generator (SHA-1/256/384/512 via Web Crypto) |
| Generators | UUID / NanoID Generator · Colour Converter (HEX/RGB/HSL + WCAG contrast) |

Shell features: collapsible sidebar with filter, command palette (`⌘K` / `Ctrl+K`), five themes (System, Light, Dark, Ocean, High-contrast), per-tool input persistence, copy-to-clipboard toasts, drag-and-drop files into any code pane, deep-linkable routes (`/tools/<id>`), lazy-loaded tool chunks.

## Getting started

```bash
npm install
npm start        # dev server on http://localhost:3000 (opens browser)
npm run build    # production bundle in dist/
npm test         # jest unit tests for the helper libraries
```

Requires Node 18+.

## Project layout

```
src/
  index.jsx            bootstrap: Router + ThemeProvider + ToastProvider
  App.jsx              shell: Sidebar, TopBar, CommandPalette, routed tool view
  registry.js          single source of truth for every tool (id, name, group, icon, component)
  components/          shared UI (Panel, CodeArea, Button, Select, Badge, Toast, icons…)
  hooks/               useLocalStorage, useDebounce, useClipboard, useTheme
  lib/                 pure helpers with no React (json, diff, datetime, cron, color, text, base64, jwt)
  modules/<tool>/      one self-contained folder per tool
  styles/              tokens.css (themes), base.css, layout.css, components.css
test/                  jest tests for lib/ and the registry
docs/STORY.md          product story & roadmap
```

## Adding a tool

1. Create `src/modules/<id>/<Name>.jsx` exporting a default component (use `Panel`, `CodeArea`, `Toolbar` etc. from `components/ui.jsx`; persist inputs with `useLocalStorage`).
2. Put any non-React logic in `src/lib/` and add a test in `test/`.
3. Register it in `src/registry.js` — it immediately appears in the sidebar, home page, command palette and router.

## Themes

Themes are blocks of CSS custom properties keyed by `data-theme` on `<html>` (`src/styles/tokens.css`). Components only ever reference tokens (`--bg`, `--text`, `--accent`, …), so adding a theme is one CSS block plus an entry in `src/hooks/useTheme.jsx`.
