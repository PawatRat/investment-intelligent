# Stock Feature Next Development Plan

## Purpose

This planner reviews the current stock knowledge-base implementation and defines the next development phase. It is intentionally a planning document only. Do not treat this file as implementation work.

Current feature shape:

```txt
content/stocks/<TICKER>/thesis.md
content/stocks/<TICKER>/<YYYY-MM-DD>-news-note.md

/stocks
/stocks/:ticker
/stocks/:ticker/:noteSlug

/api/stocks
/api/stocks/:ticker
/api/stocks/:ticker/timeline
/api/stocks/:ticker/notes/:noteSlug
```

The direction is correct: each stock has a thesis, timeline notes, labels/status, and a dedicated note page.

## Current Review Findings

### P1: Stock note API route is shadowed by `/api/stocks/:ticker`

In `server/index.js`, this route appears before the note routes:

```js
app.get("/api/stocks/:ticker", ...)
```

Because Express matches routes in order, a request like:

```txt
/api/stocks/MSFT/notes/2026-05-11-news-note
```

can be swallowed by the broader `/:ticker` route depending on route matching behavior and server state. The note-specific routes should be declared before `GET /api/stocks/:ticker`.

Required route order:

```txt
GET /api/stocks
GET /api/stocks/:ticker/timeline
GET /api/stocks/:ticker/notes/:noteSlug
GET /api/stocks/:ticker
```

Acceptance check:

```bash
curl -i http://127.0.0.1:3001/api/stocks/MSFT/notes/2026-05-11-news-note
```

Expected:

```txt
HTTP/1.1 200 OK
```

### P1: Post `tickers` front matter is not returned by `readPostFile`

The development plan says stock pages should match related posts by:

1. `tickers` front matter
2. fallback to `tags`

Current `readPostFile()` returns `tags` but not `tickers`, so this code path cannot work:

```js
const hasTickersField = Array.isArray(post.tickers);
```

Fix:

```js
tickers: Array.isArray(data.tickers) ? data.tickers : [],
```

Add this to the object returned from `readPostFile()`.

Acceptance check:

- Add `tickers: ["MSFT"]` to a post without `MSFT` in `tags`.
- Confirm `/api/stocks/MSFT` includes that post in `relatedPosts`.

### P1: `hasTickerInBody` is dead code

Current code:

```js
const hasTickerInBody = false; // skip expensive search for now
```

This is unused and should be removed. Related-post matching should be explicit and predictable:

```js
return tickerInField || tickersInTags;
```

### P2: Label filtering is not complete

`StocksIndex.jsx` computes available labels:

```js
const labels = useMemo(...)
```

But the UI does not render label filter controls and the filter logic does not use a label filter.

Add:

```txt
labelFilter state
label filter buttons
stock.labels.includes(labelFilter)
```

Acceptance check:

- `/stocks` shows label filters such as `core-holding`, `ai`, `cloud`, `valuation-risk`.
- Clicking `valuation-risk` shows MDB.
- Clicking `cloud` shows MSFT and GOOGL.

### P2: Search does not include labels

Current search includes:

```txt
ticker company theme
```

Update searchable text to include:

```txt
ticker company theme sector status conviction labels
```

Acceptance check:

- Searching `valuation-risk` shows MDB.
- Searching `advertising` shows META and GOOGL.

### P2: Stock note pages use raw `marked.parse` instead of `MarkdownBody`

`StockDetail.jsx` and `StockNoteDetail.jsx` render Markdown with direct `marked.parse()` and `dangerouslySetInnerHTML`.

This means stock thesis/notes do not get the full post renderer behavior:

- chart blocks
- Mermaid diagrams
- shared Markdown rendering path
- future renderer improvements

Recommended fix:

Use the existing `MarkdownBody` component from:

```txt
src/features/posts/components/MarkdownBody.jsx
```

Usage:

```jsx
<MarkdownBody markdown={note.body} slug={`${ticker}-${note.slug}`} />
```

For thesis:

```jsx
<MarkdownBody markdown={stock.thesisBody} slug={`${stock.ticker}-thesis`} />
```

Acceptance check:

- A stock note with a `chart` block renders a chart.
- A stock note with a Mermaid block renders a diagram.

### P2: Empty timeline state is missing

On `/stocks/:ticker`, if `stock.timeline.length === 0`, the Timeline section disappears.

Better UX:

```txt
Timeline
No timeline notes yet.
```

Acceptance check:

- `/stocks/META` shows a clear empty timeline state.

### P2: Dashboard latest note should be clickable

The dashboard table shows `Latest Note`, but it is plain text.

Expected behavior:

- If `stock.latestNote` exists, clicking it navigates to:

```txt
/stocks/<TICKER>/<latestNote.slug>
```

Acceptance check:

- `/stocks` latest note for MSFT opens `/stocks/MSFT/2026-05-11-news-note`.

### P3: Design token drift remains

The code uses many `neutral-*` classes while `DESIGN.md` asks for the slate palette.

This is not blocking, but if the next development phase touches stock UI, normalize new or edited stock components to `slate-*`.

Do not do a broad visual refactor unless explicitly requested.

## Recommended Next Development Phase

### Phase 1: Correctness And Route Stability

Goal:

Make the stock APIs reliable and aligned with the content model.

Tasks:

- Move note and timeline routes above `GET /api/stocks/:ticker`.
- Add `tickers` to `readPostFile()`.
- Remove `hasTickerInBody` dead code.
- Add API checks for:
  - `/api/stocks`
  - `/api/stocks/MSFT`
  - `/api/stocks/MSFT/timeline`
  - `/api/stocks/MSFT/notes/2026-05-11-news-note`
  - missing note returns JSON 404

Acceptance criteria:

- Dedicated stock note API returns `200`.
- Related posts work through `tickers` front matter.
- Missing stock note returns:

```json
{"error":"Stock note not found"}
```

### Phase 2: Stock Dashboard Filters

Goal:

Make `/stocks` usable as a portfolio cockpit.

Tasks:

- Add `labelFilter`.
- Render label filter chips below status/conviction filters.
- Include labels in search text.
- Make latest note clickable.

Acceptance criteria:

- Filter by status works.
- Filter by conviction works.
- Filter by label works.
- Search by label works.
- Latest note opens a dedicated note page.

### Phase 3: Shared Markdown Rendering

Goal:

Make stock thesis and stock notes support the same Markdown features as normal posts.

Tasks:

- Replace direct `marked.parse()` in `StockDetail.jsx` thesis body with `MarkdownBody`.
- Replace direct `marked.parse()` in inline timeline expansion with `MarkdownBody`.
- Replace direct `marked.parse()` in `StockNoteDetail.jsx` with `MarkdownBody`.

Acceptance criteria:

- Stock thesis renders normally.
- Stock note page renders normally.
- Chart blocks render inside stock notes.
- Mermaid diagrams render inside stock notes.

### Phase 4: Timeline UX

Goal:

Make timeline notes easier to scan and open.

Tasks:

- Add empty state for no timeline notes.
- Make note title clickable. This is already partially implemented.
- Keep `Read note` for inline preview.
- Keep `Open page` for full page.
- Consider filtering by timeline `type` later, but do not add until there are enough notes.

Acceptance criteria:

- `/stocks/MSFT` shows timeline with clickable title, inline read, and open page.
- `/stocks/META` shows empty timeline state.

### Phase 5: Prompt And Content Workflow

Goal:

Make it easy to generate news notes consistently for every stock.

Current prompt:

```txt
prompts/stock-news-note.md
```

Next prompt improvements:

- Add examples for `weekly-check`, `earnings-review`, and `risk-note`.
- Add a prompt that updates or reviews `thesis.md`.
- Add a prompt that creates a first `thesis.md` for a new ticker.

Recommended prompt files:

```txt
prompts/stock-weekly-check.md
prompts/stock-earnings-review.md
prompts/stock-risk-note.md
prompts/stock-thesis.md
prompts/stock-thesis-review.md
```

Acceptance criteria:

- A future agent can generate a note into the correct stock folder without additional instruction.
- Generated notes appear automatically in `/stocks/:ticker`.
- Generated notes can open at `/stocks/:ticker/:noteSlug`.

## Future Phase: Activity Ledger

Do not implement this in the next phase unless explicitly requested.

Reserved design:

```txt
content/stocks/<TICKER>/activity.md
```

Purpose:

```txt
Thesis = why I own or watch it
Timeline note = what happened / what I think
Activity ledger = what I did
```

Future activity API:

```txt
GET /api/stocks/:ticker/activity
```

Future activity examples:

```txt
buy
add
hold
trim
sell
close
reopen
watch
stop-watching
```

## Suggested Implementation Order For Next Agent

1. Fix backend route order and `tickers` propagation.
2. Add label filter and label-aware search on `/stocks`.
3. Switch stock thesis and notes to shared `MarkdownBody`.
4. Add empty timeline state.
5. Make latest note clickable on the dashboard.
6. Run build and API smoke checks.

## Smoke Test Checklist

Run:

```bash
npm run build
```

Check API:

```bash
curl -sS http://127.0.0.1:3001/api/stocks
curl -sS http://127.0.0.1:3001/api/stocks/MSFT
curl -sS http://127.0.0.1:3001/api/stocks/MSFT/timeline
curl -sS http://127.0.0.1:3001/api/stocks/MSFT/notes/2026-05-11-news-note
```

Check UI:

```txt
/stocks
/stocks/MSFT
/stocks/MSFT/2026-05-11-news-note
```

Expected:

- Stocks dashboard loads.
- MSFT detail page loads.
- MSFT news note opens as a dedicated page.
- MSFT news note can also expand inline from the timeline.
- META/GOOGL/CRM/NFLX/MDB pages load even without timeline notes.
