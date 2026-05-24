# AGENTS.md — Investment Intelligent

## Project Identity

Investment Intelligent is a **backend-first Markdown publishing system** with a stock knowledge base. Posts live as `.md` files with front matter. The frontend reads from the API and renders content as a blog with multiple view modes.

- **Stack:** React 18 + Vite (frontend) / Express (backend) / Tailwind CSS
- **Content:** `.md` files in `content/posts/` — **no database**
- **Stock KB:** `.md` thesis + timeline files in `content/stocks/<TICKER>/`
- **Uploads:** Images stored in `public/uploads/`, served at `/uploads/`
- **Publishing model:** Backend-only. The browser only reads.
- **Local-only folders:** `content/posts/`, `content/stocks/`, `prompts/`, `public/uploads/` are in `.gitignore` — never pushed.

---

## Before You Create Anything New

### Mandatory: Read DESIGN.md First

**Always read `DESIGN.md` in full before writing any UI, component, style, or visual change.** It defines:

- The complete color system (slate/neutral palette, exact hex values)
- Typography rules (serif for prose, sans for UI, mono for code)
- The firm rule: **no rounded corners anywhere** — no `rounded-*`, no `border-radius`
- Spacing conventions, shadow usage, border rules
- Every component's current design spec

### Know the Architecture

```txt
Frontend (Vite, port 5174)
  └── proxies /api and /uploads to backend

Backend (Express, port 3001)
  ├── GET  /api/posts              → lists all posts (no body)
  ├── GET  /api/posts/:slug        → single post (includes body)
  ├── POST /api/posts              → creates a new .md file
  ├── POST /api/upload             → uploads an image (jpeg/png/gif/webp/svg, max 5MB)
  ├── GET  /api/prompts            → lists all prompt templates
  ├── GET  /api/prompts/:filename  → single prompt (includes markdown)
  ├── GET  /api/stocks             → lists all stock theses
  ├── GET  /api/screener           → macro regime + themes + candidates
  ├── POST /api/screener/discovery-request → saves a theme discovery brief
  ├── GET  /api/screener/discovery-results → reads latest discovery suggestions
  ├── POST /api/screener/apply-suggestions → merges suggestions into config.json
  ├── GET  /api/stocks/:ticker     → thesis + timeline + related posts
  └── GET  /api/stocks/:ticker/timeline → timeline notes only
```

### Page Routes

| Route | Page | Lazy-Loaded |
|---|---|---|
| `/` | PostIndex (grid/timeline/graph views) | No |
| `/posts/:slug` | PostDetail | Yes |
| `/prompts` | PromptsIndex | No |
| `/prompts/:filename` | PromptsDetail | Yes |
| `/stocks` | StocksIndex (dashboard) | No |
| `/stocks/:ticker` | StockDetail | Yes |
| `/screener` | ScreenerIndex (macro/theme decision layer) | No |

---

## Development

```bash
npm install          # install dependencies
npm run dev          # start both servers (frontend + backend concurrently)
npm run build        # production build → dist/
npm run preview      # preview production build on port 4173
```

**Dev URLs:**
- Frontend: `http://127.0.0.1:5174`
- Backend: `http://127.0.0.1:3001`

The Vite dev server proxies `/api` and `/uploads` to the backend. No CORS setup needed in dev.

**To verify:** After `npm run build`, check `dist/` with `npx serve dist/` or `npm run preview`.

---

## File Structure

```txt
content/posts/               ← Markdown posts live here (file-based CMS, local only)
content/stocks/<TICKER>/     ← Stock thesis + timeline notes (local only)
content/screener/config.json ← Macro screener config (local only)
prompts/                     ← Agent prompt templates (local only)
public/uploads/              ← uploaded images (local only)
docs/                        ← Development plans and design reviews
server/index.js              ← Express API (all backend logic)

src/
  main.jsx                   ← React entry point
  App.jsx                    ← root component, router + layout (5 routes)
  styles.css                 ← @font-face, @tailwind, prose-core, charts, tables
  config/site.js             ← site name, initials, tagline

  lib/
    router.js                ← custom client-side router (pushState + popstate)
    date.js                  ← date formatting (Intl.DateTimeFormat)
    html.js                  ← HTML entity decoder

  components/                ← shared/reusable UI primitives
    DotField.jsx             ← background dot pattern (fixed, pointer-events-none)
    IconButton.jsx           ← view-switcher button (grid/timeline/graph)
    SiteHeader.jsx           ← sticky nav bar (Stocks, Prompts nav links)
    StateMessage.jsx         ← loading/error/empty state display
    TypewriterTitle.jsx      ← looping typewriter animation

  features/posts/            ← everything related to posts
    api.js                   ← fetchPosts(), fetchPost()
    hooks.js                 ← usePosts(), usePost()
    markdown.js              ← parses sections (markdown vs ```chart``` blocks)
    PostIndex.jsx            ← index page (grid/timeline/graph views + filter + search)
    PostDetail.jsx           ← single post page (metadata + cover + prose)
    components/
      GraphView.jsx          ← cytoscape force-directed tag graph (lazy-loaded)
      GridView.jsx           ← card grid layout
      MarkdownBody.jsx       ← markdown → HTML + Mermaid diagrams + chart blocks
      PostCard.jsx           ← grid card (title + desc + tags)
      TagFilter.jsx          ← tag-based filter bar
      TagList.jsx            ← inline tag chips with icons
      TimelineView.jsx       ← vertical timeline layout
      charts/
        ChartBlock.jsx       ← Recharts bar/line/pie renderer (lazy-loaded)

  features/prompts/          ← prompt template browser
    api.js                   ← fetchPrompts(), fetchPrompt()
    PromptsIndex.jsx         ← card grid of available prompts
    PromptsDetail.jsx        ← rendered prompt markdown + "How to run" callout

  features/stocks/           ← stock knowledge base
    api.js                   ← fetchStocks(), fetchStock()
    hooks.js                 ← useStocks(), useStock()
    StocksIndex.jsx          ← dashboard with filterable table
    StockDetail.jsx          ← thesis + timeline + related posts (lazy-loaded)
    StockNoteDetail.jsx      ← individual timeline note detail

  features/screener/         ← macro-to-investment decision layer
    api.js                   ← fetchScreener()
    hooks.js                 ← useScreener()
    ScreenerIndex.jsx        ← regime, factors, themes, candidates, exposure
```

---

## Key Design Rules (from DESIGN.md)

1. **No rounded corners anywhere.** Never use `rounded`, `rounded-lg`, `border-radius`, or any curve-generating class.
2. **Use the neutral palette for everything.** No custom hex colors unless in the documented palette.
3. **Serif for prose body and titles, sans for UI chrome.** Follow the font stacks in DESIGN.md.
4. **Headings are normal weight (400-500), not bold.** Prose headings and post titles use `font-normal`.
5. **Borders are 1px neutral-200.** Unless it's a table header (2px) or blockquote accent (4px).
6. **Shadows are rare.** Only on images, chart tooltips, and active buttons. Cards should NOT use shadows (post-design-review finding).
7. **Tables have horizontal borders only.** No vertical lines. See the table section in DESIGN.md.
8. **Always use existing hooks** (`usePosts`, `usePost`, `useStocks`, `useStock`) instead of fetching directly.
9. **Heavy components → `React.lazy()` + `Suspense`.** PostDetail, PromptsDetail, StockDetail, GraphView, ChartBlock, Mermaid.
10. **Test:** `npm run build` must succeed before pushing.

---

## Component Patterns

### Views and Lazy Loading

- **All heavy components are lazy-loaded** via `React.lazy()` + `Suspense`: PostDetail, PromptsDetail, StockDetail, GraphView, ChartBlock, Mermaid.
- Lightweight views (GridView, TimelineView, StocksIndex, PromptsIndex) are imported eagerly.
- PostIndex is the critical path — keep it lightweight.

### Hooks

```js
// Posts
usePosts()           // { posts, loading, error }
usePost(slug)        // { post, loading, error } — resets on slug change

// Stocks
useStocks()          // { stocks, loading, error }
useStock(ticker)     // { stock, loading, error } — resets on ticker change
```

### API

All API base URLs are relative (`/api/...`), proxied through Vite in dev.

| Function | Endpoint |
|---|---|
| `fetchPosts()` | `GET /api/posts` |
| `fetchPost(slug)` | `GET /api/posts/:slug` |
| `fetchPrompts()` | `GET /api/prompts` |
| `fetchPrompt(filename)` | `GET /api/prompts/:filename` |
| `fetchStocks()` | `GET /api/stocks` |
| `fetchStock(ticker)` | `GET /api/stocks/:ticker` |
| `fetchScreener()` | `GET /api/screener` |

### Styling

- UI components use **Tailwind utility classes**.
- Prose content (`.prose-core`) uses **custom CSS** in `styles.css`.
- Chart styles are in `styles.css` under `.chart-shell`, `.chart-caption`, `.chart-stage`, `.chart-tooltip`.
- The background dot pattern is in `DotField.jsx` with color in `tailwind.config.js`.

---

## Server Conventions

### Posts CRUD

- Posts are `.md` files with YAML-like front matter (`---` delimited).
- `parseFrontMatter()` is a custom parser (not js-yaml). It handles strings and arrays but has limitations (colons in values will break).
- `buildFrontMatter()` writes back the same format.
- `slugify()` converts titles to URL-safe slugs.
- `listPosts()` reads ALL files from disk on every call. Currently no caching.

### Stock Knowledge Base

- Stock theses are stored as `content/stocks/<TICKER>/thesis.md`.
- Timeline notes as `content/stocks/<TICKER>/YYYY-MM-DD-type.md`.
- Thesis front matter requires: `ticker`, `company`, `status`, `conviction`, `labels`, `updated`.
- Status values: `owned`, `watchlist`, `previously-owned`, `sold`, `archived`.
- Conviction values: `strong`, `holding`, `watching`, `re-evaluating`.
- `listStockTheses()` reads all thesis files from disk.
- `readStockTimeline(ticker)` reads all non-thesis `.md` files from a ticker folder.
- `findRelatedPosts(ticker)` matches general posts by `tickers` front matter or `tags`.

### Uploads

- `POST /api/upload` accepts `image` field (multipart/form-data).
- Saves to `public/uploads/` with timestamped safe filenames.
- Validation: jpeg, png, gif, webp, svg only. Max 5 MB.

---

## Important Gotchas

### Font Files

The project bundles local font files in `src/assets/fonts/`:
- Inter (weights 400, 500, 600, 700) — used for UI
- JetBrains Mono (weights 400, 500, 600) — used for code

These are loaded via `@font-face` in `styles.css` at the very top, before Tailwind directives.

### No Database

**Content is file-based.** If you deploy to a platform without persistent disk, content disappears on every redeploy. See `DEPLOYMENT.md` for strategies.

### Local-Only Folders

The following folders are in `.gitignore` and never pushed to GitHub:
- `content/posts/` — your blog posts
- `content/stocks/` — your stock theses and timeline notes
- `content/screener/` — your macro screener config
- `prompts/` — your agent prompt templates
- `public/uploads/` — your uploaded images

### Macro Screener

The screener is a top-down investment map, not a news digest. It reads `content/screener/config.json` and renders macro regime, factor trends, theme exposure, stock candidates, and portfolio exposure. Do not add raw news feeds, article summaries, scraping, or live macro data retrieval to the screener. News belongs in posts and stock timeline notes.

Interactive discovery is agent-run. The browser saves `content/screener/discovery-request.json`; an agent runs `prompts/theme-discovery.md`, researches external signals, and writes `content/screener/discovery-results.json`; the browser can then apply those suggestions into `config.json`.

### Tailwind Content Path

`tailwind.config.js` scans `./index.html` and `./src/**/*.{js,jsx}`. If you add files outside these paths, update the config.

### Cytoscape

Cytoscape is a transitive dependency from Mermaid. It's available via `import cytoscape from "cytoscape"` but is NOT listed in `package.json` directly. If Mermaid ever drops it, you'll need to add it.

### Marked Does Not Sanitize

`marked.parse()` in `MarkdownBody.jsx` and `StockDetail.jsx` renders HTML directly via `dangerouslySetInnerHTML`. There is no sanitization. HTML in post/thesis bodies is raw-injected into the DOM. If the publishing model ever allows untrusted input, add DOMPurify.

### TypewriterTitle Module State

`TypewriterTitle.jsx` uses recursive `setTimeout` (not `setInterval`) to prevent timer leaks. The timing constants (`TYPE_SPEED`, `DELETE_SPEED`, `PAUSE_MS`) are at the module level.

### Server Error Handlers

`server/index.js` has TWO error handlers:
1. MulterError + file filter handler
2. General 500 fallback

The first handler passes unknown errors to `next(error)` so the second catches them. Do not reorder these.

### Vite Proxy

The Vite dev server proxies `/api` and `/uploads` to `http://127.0.0.1:3001`. In production, use Nginx (see `DEPLOYMENT.md`) or same-origin deployment.

### Frontend Port

Frontend runs on port **5174** (not 5173) to avoid conflicts. Set in both `vite.config.js` and `package.json`.

---

## Prompts Library

The `prompts/` folder stores reusable AI agent prompt templates. Each `.md` file is a recipe — the agent reads it, executes the instructions (gathering data, running analysis), formats the output as a post, and POSTs it to `/api/posts`.

### How Prompts Work

```
User → "Run prompts/growth-scanner.md for semiconductors"
Agent → Reads the prompt template
Agent → Gathers real data, runs the analysis
Agent → Formats output with front matter + markdown body
Agent → POSTs to /api/posts
Result → New post appears on the site
```

### Available Prompts

| Prompt | Use |
|---|---|
| `prompts/stock-report.md` | Deep-dive analysis on a single ticker |
| `prompts/growth-scanner.md` | Scan a sector for high-growth stocks, ranked |
| `prompts/weekly-brief.md` | Weekly summary/recap on a topic with chart blocks |
| `prompts/portfolio-check.md` | Personal portfolio health check (local only) |

### Prompt File Structure

Each prompt contains:
- **Purpose** — what it produces
- **Triggers** — natural language phrases that should activate it
- **Instructions** — step-by-step what data to gather and analyze
- **Output Format** — exact front matter + markdown structure expected
- **Posting** — reminder to POST to `/api/posts`

### Adding a New Prompt

1. Create `prompts/your-prompt.md`
2. Follow the existing format (purpose, instructions, output format)
3. Include relevant `tags` for filtering on the site
4. The agent should always POST the result with no `slug` field — the server generates it

### Important: Chart Blocks

Some prompts include ` ```chart ` blocks. When an agent populates chart data, it must:
- Use valid JSON inside the chart block
- Include `type`, `data`, `xKey`, `yKey` fields
- Supported chart types: `bar`, `line`, `pie`

---

## Stock Knowledge Base

Each stock gets its own permanent page with a thesis file and dated timeline notes.

### Content Model

```txt
content/stocks/<TICKER>/
  thesis.md              ← permanent investment thesis
  2026-05-11-weekly-check.md  ← dated timeline note
  2026-05-18-earnings-review.md
  activity.md            ← future: buy/sell ledger
```

### Thesis Front Matter

```md
---
ticker: MSFT
company: Microsoft
sector: Technology
status: owned
conviction: strong
theme: Cloud + AI
labels: ["core-holding", "ai", "cloud", "mega-cap"]
updated: 2026-05-11
---
```

### Timeline Note Front Matter

```md
---
ticker: MSFT
type: weekly-check
date: 2026-05-18
title: MSFT Weekly Check
summary: Azure growth still supports the thesis.
action: hold
---
```

### Status & Conviction Values

| Status | Conviction |
|---|---|
| `owned` | `strong` |
| `watchlist` | `holding` |
| `previously-owned` | `watching` |
| `sold` | `re-evaluating` |
| `archived` | |

### Portfolio Post Compatibility

General posts in `content/posts/` can include a `tickers` field to link to stock pages:

```md
tickers: ["MSFT", "META", "GOOGL", "NFLX", "CRM", "MDB"]
```

The stock detail page automatically shows these as "Related Posts".

---

## When Adding a New Feature

Follow this checklist:

- [ ] Read `DESIGN.md` for color/font/border/sizing rules
- [ ] Check existing components for patterns to match
- [ ] Heavy components → `React.lazy()` + `Suspense`
- [ ] Use existing hooks instead of fetching directly
- [ ] UI → Tailwind classes. Prose → `styles.css`.
- [ ] No `rounded-*` or `border-radius` anywhere
- [ ] Add new route in `App.jsx` + nav link in `SiteHeader.jsx` if needed
- [ ] Add new endpoint in `server/index.js` if needed
- [ ] Test: `npm run build` must succeed
- [ ] Update `DESIGN.md` if the new component introduces a new visual pattern
- [ ] Update `AGENTS.md` if the feature changes architecture or conventions
