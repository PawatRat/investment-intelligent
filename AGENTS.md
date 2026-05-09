# AGENTS.md — Knowledge Core

## Project Identity

Knowledge Core is a **backend-first Markdown publishing system**. Posts live as `.md` files with front matter. The frontend reads from the API and renders content as a blog with multiple view modes.

- **Stack:** React 18 + Vite (frontend) / Express (backend) / Tailwind CSS
- **Content:** `.md` files in `content/posts/` — **no database**
- **Uploads:** Images stored in `public/uploads/`, served at `/uploads/`
- **Publishing model:** Backend-only. The browser only reads.

---

## Before You Create Anything New

### Mandatory: Read DESIGN.md First

**Always read `DESIGN.md` in full before writing any UI, component, style, or visual change.** It defines:

- The complete color system (slate palette, exact hex values)
- Typography rules (serif for prose, sans for UI, mono for code)
- The firm rule: **no rounded corners anywhere** — no `rounded-*`, no `border-radius`
- Spacing conventions, shadow usage, border rules
- Every component's current design spec

### Know the Architecture

```txt
Frontend (Vite, port 5173)
  └── proxies /api and /uploads to backend

Backend (Express, port 3001)
  ├── GET  /api/posts           → lists all posts (no body)
  ├── GET  /api/posts/:slug     → single post (includes body)
  ├── POST /api/posts           → creates a new .md file
  └── POST /api/upload          → uploads an image (jpeg/png/gif/webp/svg, max 5MB)
```

---

## Development

```bash
npm install          # install dependencies
npm run dev          # start both servers (frontend + backend concurrently)
npm run build        # production build → dist/
npm run preview      # preview production build on port 4173
```

**Dev URLs:**
- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:3001`

The Vite dev server proxies `/api` and `/uploads` to the backend. No CORS setup needed in dev.

**To verify:** After `npm run build`, check `dist/` with `npx serve dist/` or `npm run preview`.

---

## File Structure

```txt
content/posts/               ← Markdown posts live here (file-based CMS)
public/uploads/              ← uploaded images
server/index.js              ← Express API (all backend logic)

src/
  main.jsx                   ← React entry point
  App.jsx                    ← root component, router + layout
  styles.css                 ← @font-face, @tailwind, prose-core, charts
  config/site.js             ← site name, initials, tagline

  lib/
    router.js                ← custom client-side router (pushState + popstate)
    date.js                  ← date formatting (Intl.DateTimeFormat)
    html.js                  ← HTML entity decoder

  components/                ← shared/reusable UI primitives
    DotField.jsx             ← background dot pattern (fixed, pointer-events-none)
    IconButton.jsx           ← view-switcher button (grid/timeline/graph)
    SiteHeader.jsx           ← sticky nav bar
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
      PostCard.jsx           ← grid card (title + desc + tags + button)
      TagFilter.jsx          ← tag-based filter bar
      TagList.jsx            ← inline tag chips with icons
      TimelineView.jsx       ← vertical timeline layout
      charts/
        ChartBlock.jsx       ← Recharts bar/line/pie renderer
```

---

## Key Design Rules (from DESIGN.md)

1. **No rounded corners anywhere.** Never use `rounded`, `rounded-lg`, `border-radius`, or any curve-generating class.
2. **Use the slate palette for everything.** No custom hex colors unless in the documented palette.
3. **Serif for prose body, sans for UI chrome.** Follow the font stacks in DESIGN.md.
4. **Headers are medium weight (500), not bold.** Prose headings use `font-weight: 500`.
5. **Borders are always 1px slate-200.** Unless it's a table header (2px) or blockquote accent (4px).
6. **Shadows are rare.** Only on images, chart tooltips, and active buttons.
7. **Tables have horizontal borders only.** No vertical lines. See the table section in DESIGN.md.

---

## Component Patterns

### Views and Lazy Loading

- **Heavy components (PostDetail, ChartBlock, GraphView) are lazy-loaded** via `React.lazy()` + `Suspense`.
- New heavy features should follow this pattern.
- Lightweight views (GridView, TimelineView) are imported eagerly since PostIndex itself is a critical path.

### Hooks

- `usePosts()` fetches all posts. Use for list/index views.
- `usePost(slug)` fetches a single post. Resets state when slug changes.
- Both return `{ posts/post, loading, error }`.

### API

- `fetchPosts()` → `GET /api/posts` (no body, includes readingMinutes)
- `fetchPost(slug)` → `GET /api/posts/:slug` (full post with body)
- Base URL is relative (`/api/...`), proxied through Vite in dev.

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

**Content is file-based.** If you deploy to a platform without persistent disk, posts disappear on every redeploy. See `DEPLOYMENT.md` for strategies.

### Tailwind Content Path

`tailwind.config.js` scans `./index.html` and `./src/**/*.{js,jsx}`. If you add files outside these paths, update the config.

### Cytoscape

Cytoscape is a transitive dependency from Mermaid. It's available via `import cytoscape from "cytoscape"` but is NOT listed in `package.json` directly. If Mermaid ever drops it, you'll need to add it.

### Marked Does Not Sanitize

`marked.parse()` in `MarkdownBody.jsx` renders HTML directly via `dangerouslySetInnerHTML`. There is no sanitization. HTML in post bodies is raw-injected into the DOM. If the publishing model ever allows untrusted input, add DOMPurify.

### TypewriterTitle Module State

`TypewriterTitle.jsx` uses recursive `setTimeout` (not `setInterval`) to prevent timer leaks. The timing constants (`TYPE_SPEED`, `DELETE_SPEED`, `PAUSE_MS`) are at the module level.

### Error Handler Order

`server/index.js` has TWO error handlers:
1. Lines 51-65: handles MulterError + custom file filter errors
2. Lines 222-225: general 500 fallback

The first handler passes unknown errors to `next(error)` so the second catches them. Do not reorder these.

### Vite Proxy

The Vite dev server proxies `/api` and `/uploads` to `http://127.0.0.1:3001`. In production, use Nginx (see `DEPLOYMENT.md`) or same-origin deployment.

---

## When Adding a New Feature

Follow this checklist:

- [ ] Read `DESIGN.md` for color/font/border/sizing rules
- [ ] Check existing components for patterns to match
- [ ] Heavy components → `React.lazy()` + `Suspense`
- [ ] Use existing hooks (`usePosts`, `usePost`) instead of fetching directly
- [ ] UI → Tailwind classes. Prose → `styles.css`.
- [ ] No `rounded-*` or `border-radius` anywhere
- [ ] Test: `npm run build` must succeed
- [ ] Update `DESIGN.md` if the new component introduces a new visual pattern
