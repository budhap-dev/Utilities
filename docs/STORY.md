# DevKit — The Story

> A developer's daily toolbelt, in one fast, beautiful, offline-friendly web app.

## 1. Why this exists

Every working day a developer reaches for the same small tools: paste a blob of
JSON to see if it's valid, turn an epoch into a readable date, diff two configs,
decode a JWT from a log line, base64 a secret, check a regex. Today those live
in a dozen browser tabs of ad-laden websites that differ in quality, leak data to
third parties, and look nothing alike.

**DevKit** replaces that tab-sprawl with one local-first React app: every tool
runs entirely in the browser (nothing is ever sent to a server), every tool
shares the same keyboard-friendly layout, and the whole thing looks like a
product someone cared about — with proper light, dark and high-contrast themes.

## 2. Who it's for

| Persona | What they need |
|---|---|
| **Priya, backend engineer** | Pastes API payloads all day. Needs JSON validate / format / minify / tree-view instantly, and to diff two responses. |
| **Marco, on-call SRE** | Lives in logs. Needs epoch ↔ ISO ↔ local-time conversions across timezones, JWT decoding, cron expression sanity checks. |
| **Ana, full-stack dev** | Switches contexts constantly. Wants one place for Base64/URL encoding, UUIDs, hashes, regex testing, colour conversion — with a command palette so she never touches the mouse. |

Common thread: they are experts, they are in a hurry, and they distrust tools that
phone home. So: **zero network calls, zero sign-up, instant feedback, keyboard first.**

## 3. The modules

### Requested
| Module | What it does |
|---|---|
| **JSON Parser** | Validate JSON, point to the exact error line/column, explore it as a collapsible tree, copy any node's path. |
| **JSON Formatter** | Pretty-print (2/4-space/tab), minify, sort keys, escape/unescape for embedding in strings. |
| **Date & Time Converter** | Epoch (s/ms) ↔ ISO 8601 ↔ RFC 2822 ↔ human readable; pick any IANA timezone; "now" button; relative time ("3 hours ago"). |
| **File / Text Comparer** | Side-by-side and unified diff of two texts or dropped files; line & inline character highlighting; ignore-whitespace toggle; stats (added/removed). |

### Suggested additions (all pure client-side)
| Module | Why it earns its place |
|---|---|
| **Base64 Encode / Decode** | Secrets, auth headers, data URIs — several times a day. Handles UTF-8 and URL-safe variants. |
| **URL Encode / Decode** | Query strings and redirect URLs; both `encodeURIComponent` and full-URL modes, plus a query-param breakdown table. |
| **JWT Decoder** | Paste a token → header, payload, signature, `exp`/`iat` rendered as dates with an "expired" badge. Never verifies with a secret online. |
| **UUID / ID Generator** | v4 UUIDs, NanoIDs, bulk generation, upper/lower case, copy-all. |
| **Hash Generator** | SHA-1 / SHA-256 / SHA-384 / SHA-512 via Web Crypto, of text or a dropped file; hex and base64 output. |
| **Regex Tester** | Live matches with group highlighting, flags, match table with capture groups, common-pattern cheatsheet. |
| **Colour Converter** | HEX ↔ RGB ↔ HSL, live swatch, contrast ratio checker (WCAG AA/AAA) — handy for the devs who also touch CSS. |
| **Number Base Converter** | Decimal ↔ binary ↔ octal ↔ hex, with BigInt support for 64-bit values. |
| **Cron Expression Parser** | Human-readable explanation plus the next 5 run times. |
| **Text Utilities** | Case conversion (camel/snake/kebab/Title), sort/dedupe lines, trim, word/char count, Lorem Ipsum. |

Nice-to-have for a later phase: YAML ↔ JSON, Markdown preview, QR code generator,
HTML entity encoder, SQL formatter, timestamp "diff" calculator.

## 4. User stories

- As a developer I can open any tool in ≤ 2 keystrokes via a command palette (`⌘K` / `Ctrl+K`) or the sidebar, so switching tools never breaks my flow.
- As a developer I see results update live as I type; no "Run" button unless the operation is expensive.
- As a developer I get a clear, specific error ("Unexpected token } at line 12, column 4") rather than a red "Invalid".
- As a developer I can copy any output with one click and get a toast confirming it.
- As a developer my last-used theme and the last input of each tool are remembered locally, so a reload doesn't lose my work.
- As a developer I can switch between Light, Dark and High-Contrast themes (or follow system) and every tool respects it.
- As a developer nothing I paste ever leaves my machine; the app works with the network cable unplugged.
- As a developer on a 13" laptop the layout still works; on a wide monitor the side-by-side tools use the space.

## 5. Look & feel

- **Shell**: a slim left sidebar with grouped, searchable tools; a top bar with the current tool's name, a theme switcher and the command palette trigger; a roomy content area.
- **Design language**: calm neutrals, one accent colour per theme, generous whitespace, 8-pt spacing grid, rounded-8 cards, subtle borders over heavy shadows. Inter for UI, JetBrains Mono for code panes.
- **Themes** are CSS custom properties on `data-theme` at the root (`light`, `dark`, `contrast`, plus `system`), so every component is theme-agnostic and adding a theme is one CSS block.
- **Tool layout convention**: input pane(s) on the left / top, output on the right / bottom, a toolbar row in between with the tool's options and a Copy / Clear / Sample button set. Consistency is the feature.
- **Feedback**: inline validation states (success/warn/error colour tokens), toast notifications, skeleton-free instant rendering.

## 6. Architecture

```
src/
  index.jsx            bootstraps React, wraps with ThemeProvider + Router
  App.jsx              shell: Sidebar, TopBar, CommandPalette, routed tool view
  registry.js          single source of truth: id, name, group, icon, keywords, component
  components/          shared UI: Panel, CodeArea, Toolbar, Button, Select, Toast, Badge…
  modules/<tool>/      one folder per tool, self-contained (component + helpers + tests)
  lib/                 pure helpers (json, dates, diff, encoding…) with no React
  styles/              tokens.css (themes), base.css (reset/typography), layout.css
  hooks/               useLocalStorage, useDebounce, useClipboard, useTheme
```

- **React 18 + functional components + hooks**, no global state library needed; each tool owns its state and persists via `useLocalStorage`.
- **Webpack 5** with Babel (preset-env + preset-react), `html-webpack-plugin`, dev-server with HMR, content-hashed production bundles, lazy-loaded tool chunks (`React.lazy`) so the first paint stays small.
- **Routing**: `react-router-dom` (`/tools/:id`) so every tool is deep-linkable.
- **Libraries kept minimal**: `diff` for comparison, `date-fns`/`date-fns-tz` for date math; everything else is platform APIs (Web Crypto, Intl, `crypto.randomUUID`).
- **Quality**: ESLint + Prettier, Jest for `lib/` helpers, a tiny `registry` test that asserts every tool has an id/name/component.

## 7. Roadmap

| Phase | Scope |
|---|---|
| **1 — Foundation** | Webpack/React scaffold, theme system, shell (sidebar, top bar, command palette), shared components, tool registry, persistence hooks. |
| **2 — Core tools** | JSON Parser, JSON Formatter, Date & Time Converter, File/Text Comparer. |
| **3 — Everyday tools** | Base64, URL, JWT, UUID, Hash, Regex, Colour, Number Base, Cron, Text Utilities. |
| **4 — Polish** | Keyboard shortcuts per tool, drag-and-drop files everywhere, favourites/recent tools, PWA manifest for offline install, unit tests, README. |

## 8. Non-goals (for now)

- No backend, accounts, sync or analytics.
- No AI features.
- No mobile-first layout — it should be usable on a phone but is designed for laptops and up.

## 9. Definition of done (per tool)

1. Works with empty, valid, and malformed input without crashing.
2. Respects all themes.
3. Has Copy / Clear / Sample actions and persists its last input.
4. Is registered in `registry.js` so it appears in the sidebar and command palette.
5. Helper logic lives in `lib/` with at least a smoke test.
