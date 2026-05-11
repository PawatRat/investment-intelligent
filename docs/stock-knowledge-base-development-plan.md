# Stock Knowledge Base Development Plan

## Goal

Add a stock-focused knowledge base to Knowledge Core.

Each stock should have its own permanent thesis page and a dated timeline of stock-specific notes. The feature should remain Markdown-first and file-backed, consistent with the current project architecture.

The target user workflow:

```txt
I own or watch many stocks.
For each ticker, I want one place to see:
- my current investment thesis
- weekly performance checks
- earnings notes
- risk notes
- valuation updates
- future buy/sell/add/trim activity
- portfolio-wide posts that mention this stock
```

## Recommended Content Model

Add a new stock content root:

```txt
content/
  stocks/
    MSFT/
      thesis.md
      2026-05-11-weekly-check.md
      2026-05-18-weekly-check.md
      2026-05-25-earnings-review.md
      2026-06-01-risk-note.md

    META/
      thesis.md
      2026-05-11-weekly-check.md
      2026-05-18-weekly-check.md

  posts/
    my-portfolio-check-may-2026.md
    hardware-stocks-valuation-watchlist-2026.md
```

Use this distinction:

- `content/stocks/<TICKER>/thesis.md` is the living permanent thesis.
- `content/stocks/<TICKER>/*.md` except `thesis.md` are dated stock timeline notes.
- `content/posts/*.md` remains for portfolio-wide posts, general research, watchlists, and essays.

## Thesis File Format

Example: `content/stocks/MSFT/thesis.md`

```markdown
---
ticker: MSFT
company: Microsoft
sector: Technology
industry: Software - Infrastructure
status: owned
conviction: strong
theme: Cloud + AI
labels: ["core-holding", "ai", "cloud", "mega-cap"]
updated: 2026-05-11
---

## Investment Thesis

Why I own or watch this stock.

## What Must Be True

The assumptions that need to keep working.

## Valuation Framework

The valuation metrics that matter for this stock.

## Risks

What could break the thesis.

## Watch Items

- Azure growth
- AI capex return
- Copilot adoption
```

Required front matter:

- `ticker`
- `company`
- `status`
- `conviction`
- `labels`
- `updated`

Optional front matter:

- `sector`
- `industry`
- `theme`

Recommended values:

- `status`: `owned`, `watchlist`, `previously-owned`, `sold`, `archived`
- `conviction`: `strong`, `holding`, `watching`, `re-evaluating`

## Stock Labels And Classification

Labels should be first-class metadata on each stock thesis. This lets the user distinguish current holdings, watchlist names, previous holdings, high-priority ideas, risky positions, and other personal categories.

Use two layers:

1. `status` is the primary lifecycle state.
2. `labels` are flexible secondary classifications.

### Primary Status

Use exactly one `status` per stock:

```txt
owned
watchlist
previously-owned
sold
archived
```

Recommended meaning:

- `owned`: Current portfolio position.
- `watchlist`: Not owned, but actively monitored.
- `previously-owned`: Used to own it; keeping history and lessons.
- `sold`: Sold recently or intentionally closed, but still relevant.
- `archived`: Old stock page kept for record, not actively monitored.

Prefer `previously-owned` over only `sold` when the point is long-term historical context. Use `sold` when the sale itself is recent or action-relevant.

### Flexible Labels

Use `labels` for multiple tags that describe why the stock matters.

Example:

```markdown
---
ticker: MSFT
company: Microsoft
status: owned
conviction: strong
labels: ["core-holding", "ai", "cloud", "mega-cap"]
updated: 2026-05-11
---
```

Recommended label examples:

- `core-holding`
- `satellite`
- `high-conviction`
- `watch-closely`
- `speculative`
- `turnaround`
- `valuation-risk`
- `earnings-watch`
- `ai`
- `cloud`
- `advertising`
- `consumer-subscription`
- `developer-platform`
- `previous-winner`
- `lesson-learned`

Do not over-model labels at the beginning. Start with a small set and let real usage decide which labels deserve to stay.

### Status Versus Labels

Examples:

```txt
MSFT
status: owned
labels: ["core-holding", "ai", "cloud", "mega-cap"]

MDB
status: owned
labels: ["speculative", "developer-platform", "valuation-risk"]

NVDA
status: watchlist
labels: ["ai", "semiconductors", "valuation-risk"]

PYPL
status: previously-owned
labels: ["lesson-learned", "turnaround", "previous-winner"]
```

This keeps the main grouping simple while still allowing rich personal context.

## Future Activity Ledger Design

The stock folder model should leave room for a future activity ledger. This ledger will record what the user actually did with the stock: buy, add, hold, trim, sell, close, reopen, watch, or stop watching.

Do not implement this in the first version. The first version should focus on thesis files and timeline notes. The important design point is to keep activity separate from research notes so the feature can expand cleanly later.

Recommended future structure:

```txt
content/stocks/MSFT/
  thesis.md
  activity.md
  2026-05-11-weekly-check.md
  2026-05-18-weekly-check.md
```

Future `activity.md` format:

```markdown
---
ticker: MSFT
type: activity-ledger
updated: 2026-05-18
---

## Activity

| Date | Action | Size | Price | Reason | Linked Note |
|---|---|---:|---:|---|---|
| 2026-05-01 | buy | starter | 395.00 | Initial cloud + AI thesis | thesis.md |
| 2026-05-18 | hold | n/a | 415.00 | Valuation still reasonable | 2026-05-18-weekly-check.md |
| 2026-06-10 | trim | 20% | 460.00 | Multiple expanded too quickly | 2026-06-10-valuation-update.md |
```

Recommended future activity actions:

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

Future API:

```txt
GET /api/stocks/:ticker/activity
```

Future response shape:

```json
[
  {
    "date": "2026-05-01",
    "action": "buy",
    "size": "starter",
    "price": 395.0,
    "reason": "Initial cloud + AI thesis",
    "linkedNote": "thesis.md"
  }
]
```

Future UI placement:

- Stock detail page gets an `Activity` section below the stock header and above the research timeline.
- Activity should use a compact transaction-style table.
- Timeline notes should remain research events.
- Activity entries should remain portfolio behavior events.

Important separation:

```txt
Timeline note = what happened / what I think
Activity ledger = what I did
Thesis = why I own or watch it
```

This separation keeps the design expandable without turning weekly notes into transaction records.

## Timeline Note Format

Example: `content/stocks/MSFT/2026-05-18-weekly-check.md`

```markdown
---
ticker: MSFT
type: weekly-check
date: 2026-05-18
title: MSFT Weekly Check
summary: Azure growth still supports the thesis, but AI capex remains the key watch item.
action: hold
---

## Performance

What happened to the stock this week.

## What Changed

Important business, valuation, or news changes.

## Thesis Impact

Does this strengthen, weaken, or not change the thesis?

## Action

Hold / Add / Trim / Watch / Re-evaluate.
```

Required front matter:

- `ticker`
- `type`
- `date`
- `title`
- `summary`

Optional front matter:

- `action`
- `source`
- `tags`

Recommended `type` values:

- `weekly-check`
- `earnings-review`
- `valuation-update`
- `risk-note`
- `news-note`
- `thesis-update`

Recommended `action` values:

- `hold`
- `add`
- `trim`
- `watch`
- `re-evaluate`

## Portfolio Post Compatibility

Portfolio-wide posts should remain in `content/posts`.

Add optional `tickers` front matter to general posts:

```markdown
---
title: My Portfolio Check - May 2026
date: 2026-05-11
tags: ["stocks", "portfolio", "MSFT", "META", "GOOGL"]
tickers: ["MSFT", "META", "GOOGL", "NFLX", "CRM", "MDB"]
---
```

The stock detail page should show these as related portfolio posts.

Matching logic:

1. Prefer `tickers` front matter when present.
2. Fall back to matching ticker in `tags`.

## Backend Plan

Current backend file:

```txt
server/index.js
```

Add a new stock content directory:

```js
const stocksDir = path.join(rootDir, "content", "stocks");
```

### New API Endpoints

Add these endpoints:

```txt
GET /api/stocks
GET /api/stocks/:ticker
GET /api/stocks/:ticker/timeline
```

Optional later endpoints:

```txt
POST /api/stocks/:ticker/thesis
POST /api/stocks/:ticker/notes
```

Do not add write endpoints in the first implementation unless needed. This project is currently backend-published by agents and curl, so read-only stock pages are enough for the first useful version.

### `GET /api/stocks`

Purpose:

Return all stock thesis summaries for the stock dashboard.

Implementation:

1. Read folders under `content/stocks`.
2. For each folder, read `thesis.md`.
3. Parse front matter and body.
4. Return metadata only, not full thesis body.
5. Include latest timeline note metadata if available.

Response shape:

```json
[
  {
    "ticker": "MSFT",
    "company": "Microsoft",
    "sector": "Technology",
    "status": "owned",
    "conviction": "strong",
    "labels": ["core-holding", "ai", "cloud", "mega-cap"],
    "theme": "Cloud + AI",
    "updated": "2026-05-11",
    "latestNote": {
      "slug": "2026-05-18-weekly-check",
      "type": "weekly-check",
      "date": "2026-05-18",
      "title": "MSFT Weekly Check",
      "summary": "Azure growth still supports the thesis."
    }
  }
]
```

### `GET /api/stocks/:ticker`

Purpose:

Return the full stock page data.

Implementation:

1. Normalize ticker to uppercase.
2. Read `content/stocks/<TICKER>/thesis.md`.
3. Read all timeline notes in that folder except `thesis.md`.
4. Read general posts from `content/posts`.
5. Match related posts where `tickers` includes ticker or `tags` includes ticker.
6. Sort timeline notes and related posts newest first.

Response shape:

```json
{
  "ticker": "MSFT",
  "company": "Microsoft",
  "sector": "Technology",
  "status": "owned",
  "conviction": "strong",
  "labels": ["core-holding", "ai", "cloud", "mega-cap"],
  "theme": "Cloud + AI",
  "updated": "2026-05-11",
  "thesisBody": "## Investment Thesis\n...",
  "activitySummary": null,
  "timeline": [
    {
      "slug": "2026-05-18-weekly-check",
      "type": "weekly-check",
      "date": "2026-05-18",
      "title": "MSFT Weekly Check",
      "summary": "Azure growth still supports the thesis.",
      "action": "hold",
      "body": "## Performance\n..."
    }
  ],
  "relatedPosts": [
    {
      "slug": "my-portfolio-check-may-2026",
      "title": "My Portfolio Check - May 2026",
      "description": "Valuation and growth health check...",
      "date": "2026-05-11",
      "tags": ["stocks", "portfolio", "MSFT"]
    }
  ]
}
```

`activitySummary` is optional in the first implementation. If `activity.md` does not exist, return `null` or omit it. This reserves API space for the future activity ledger without requiring the first implementation to build it.

### `GET /api/stocks/:ticker/timeline`

Purpose:

Return timeline notes only. This is useful if the detail page later wants to refresh notes independently.

Response shape:

```json
[
  {
    "slug": "2026-05-18-weekly-check",
    "type": "weekly-check",
    "date": "2026-05-18",
    "title": "MSFT Weekly Check",
    "summary": "Azure growth still supports the thesis.",
    "action": "hold"
  }
]
```

## Backend Implementation Notes

The current `parseFrontMatter()` only supports strings and simple arrays. For this feature, either:

1. Keep the existing parser and use only simple front matter values.
2. Preferably replace it with `gray-matter` before this feature grows.

Recommended for first implementation:

- Keep current parser if minimizing change.
- Add `tickers` support because it already works like `tags`.
- Avoid nested YAML.

Important helper functions to add:

```txt
readStockThesis(ticker)
readStockTimeline(ticker)
listStocks()
findRelatedPosts(ticker)
readStockNoteFile(ticker, fileName)
```

Potential future refactor:

```txt
server/
  index.js
  content.js
  posts.js
  stocks.js
  prompts.js
  uploads.js
```

Do not refactor server modules in the first feature pass unless the implementation becomes hard to read.

## Frontend Plan

Add a new feature folder:

```txt
src/features/stocks/
  api.js
  hooks.js
  StocksIndex.jsx
  StockDetail.jsx
  components/
    StockHeader.jsx
    StockTimeline.jsx
    ThesisPanel.jsx
    RelatedPosts.jsx
    StockMetaTable.jsx
```

### Routes

Add routes in `src/App.jsx`:

```txt
/stocks
/stocks/:ticker
```

Route behavior:

- `/stocks` renders `StocksIndex`.
- `/stocks/MSFT` renders `StockDetail` for `MSFT`.
- Use `React.lazy()` for `StockDetail`, since it renders Markdown and timeline content.

### Frontend API

Create `src/features/stocks/api.js`:

```js
export async function fetchStocks() {
  const response = await fetch("/api/stocks");
  if (!response.ok) throw new Error("Unable to load stocks");
  return response.json();
}

export async function fetchStock(ticker) {
  const response = await fetch(`/api/stocks/${ticker}`);
  if (!response.ok) throw new Error("Stock not found");
  return response.json();
}
```

Create `src/features/stocks/hooks.js`:

```txt
useStocks()
useStock(ticker)
```

Match the existing pattern from `src/features/posts/hooks.js`.

## UI Design

Follow `DESIGN.md` exactly:

- No rounded corners.
- Use slate palette.
- Serif for thesis/prose.
- Sans for UI metadata.
- Borders are 1px slate-200.
- Avoid card shadows unless the design document is changed.

### `/stocks` Dashboard

Purpose:

Show all owned/watched stocks in one place.

Suggested layout:

```txt
Stocks
Search/filter controls

Ticker | Company | Status | Labels | Conviction | Theme | Last Updated | Latest Note
MSFT   | Microsoft | Owned | Core, AI, Cloud | Strong | Cloud + AI | May 18 | Weekly Check
META   | Meta      | Owned | Core, Ads, AI | Strong | AI Ads | May 18 | Weekly Check
MDB    | MongoDB   | Owned | Speculative, Valuation Risk | Watching | Database | May 18 | Risk Note
NVDA   | NVIDIA    | Watchlist | AI, Semiconductors | Watching | AI Hardware | May 18 | News Note
PYPL   | PayPal    | Previously Owned | Lesson Learned | Archived | Fintech | Apr 12 | Exit Review
```

Filters:

- Status: All / Owned / Watchlist / Previously Owned / Sold / Archived
- Conviction: All / Strong / Holding / Watching / Re-evaluating
- Labels: Core Holding / Speculative / Valuation Risk / AI / Cloud / Lesson Learned
- Search: ticker, company, theme

Keep this page dense and scan-friendly. It is a portfolio cockpit, not a landing page.

### `/stocks/:ticker` Detail Page

Purpose:

One permanent page for one stock.

Suggested structure:

```txt
Back to stocks

MSFT - Microsoft
Status: Owned
Labels: Core Holding, AI, Cloud, Mega Cap
Conviction: Strong
Theme: Cloud + AI
Last thesis update: May 11, 2026

[Thesis Summary / Full Thesis]

[Timeline Filters]
All | Weekly | Earnings | Valuation | Risk | News | Thesis Updates

[Timeline]
May 18, 2026 - Weekly Check
May 11, 2026 - Portfolio Check
May 02, 2026 - Earnings Review

[Related Portfolio Posts]
```

Important behavior:

- Timeline notes from `content/stocks/<TICKER>/*.md` should be primary.
- Related portfolio posts from `content/posts/*.md` should be secondary.
- Timeline should sort newest first.
- Timeline should support filtering by `type`.
- Status and labels should be visible near the stock title because they explain how the user currently treats the stock.
- Reserve the model for future activity records, but do not mix buy/sell actions into research timeline notes.

### Label UI

Use rectangular chips, matching existing tag styling.

Recommended hierarchy:

- Status chip: highest priority, shown beside the ticker/company heading.
- Conviction chip: shown near status.
- Labels: secondary chips below the header metadata.

Examples:

```txt
MSFT - Microsoft
[Owned] [Strong]
[Core Holding] [AI] [Cloud] [Mega Cap]

NVDA - NVIDIA
[Watchlist] [Watching]
[AI] [Semiconductors] [Valuation Risk]

PYPL - PayPal
[Previously Owned] [Archived]
[Lesson Learned] [Turnaround]
```

Dashboard filter behavior:

- Clicking a status chip on the dashboard filters by status.
- Clicking a label chip filters by that label.
- A stock can have one status and many labels.

Technical note:

- Keep status separate from labels in data. Do not store `owned` or `watchlist` inside `labels`, because status controls lifecycle grouping.

## Timeline UX

Each timeline item should show:

```txt
Date
Type
Title
Summary
Action
```

If expanded or opened:

```txt
Full Markdown body
```

Recommended first version:

- Render timeline items inline with summary and a "Read note" button.
- Clicking opens `/stocks/:ticker/:noteSlug` only if a separate note detail route is added.
- Simpler first version: expand the selected note inline on the stock detail page.

Recommended route strategy:

First version:

```txt
/stocks/MSFT
```

Later version:

```txt
/stocks/MSFT/2026-05-18-weekly-check
```

Avoid adding note-detail routes until the stock detail page becomes too long.

## Prompt Plan

Add prompts later after the feature exists.

Recommended prompt files:

```txt
prompts/stock-thesis.md
prompts/stock-weekly-check.md
prompts/stock-earnings-review.md
prompts/stock-risk-note.md
prompts/thesis-review.md
```

### `stock-weekly-check.md`

Purpose:

Generate one dated timeline note for a ticker.

Output target:

```txt
content/stocks/<TICKER>/<YYYY-MM-DD>-weekly-check.md
```

Prompt should gather:

- Weekly price move
- Major company news
- Earnings or guidance changes
- Valuation change
- Thesis impact
- Action: hold/add/trim/watch/re-evaluate

## Migration Plan

Start with current holdings:

```txt
MSFT
META
GOOGL
NFLX
CRM
MDB
```

Create initial folders:

```txt
content/stocks/MSFT/thesis.md
content/stocks/META/thesis.md
content/stocks/GOOGL/thesis.md
content/stocks/NFLX/thesis.md
content/stocks/CRM/thesis.md
content/stocks/MDB/thesis.md
```

Use the existing `my-portfolio-check-may-2026.md` as the source for initial thesis drafts.

Update the portfolio post front matter to include:

```md
tickers: ["MSFT", "META", "GOOGL", "NFLX", "CRM", "MDB"]
```

This lets each stock page show the portfolio check as a related post.

## Implementation Phases

### Phase 1: Content Shape

- Add `content/stocks/<TICKER>/thesis.md` files.
- Add one sample weekly note for one ticker.
- Add `tickers` front matter support to at least one portfolio post.
- Add `status` and `labels` front matter to every thesis file.

Acceptance criteria:

- Files are readable by the backend.
- Front matter is simple and compatible with the parser.
- Stocks can be grouped as owned, watchlist, previously owned, sold, or archived.

### Phase 2: Backend Read API

- Add `GET /api/stocks`.
- Add `GET /api/stocks/:ticker`.
- Add `GET /api/stocks/:ticker/timeline`.
- Join related posts by `tickers` or `tags`.

Acceptance criteria:

- `/api/stocks` returns all thesis summaries.
- `/api/stocks/MSFT` returns thesis, timeline, and related posts.
- Missing ticker returns 404.
- Timeline sorts newest first.

### Phase 3: Frontend Pages

- Add `/stocks`.
- Add `/stocks/:ticker`.
- Add stock feature API/hooks.
- Add dashboard table.
- Add stock detail page with thesis and timeline.
- Show status and labels in both stock dashboard and stock detail header.

Acceptance criteria:

- User can navigate to `/stocks`.
- User can open `/stocks/MSFT`.
- Thesis Markdown renders.
- Timeline notes render in date order.
- Related portfolio posts appear.
- Status and labels render as rectangular chips.

### Phase 4: Timeline Filtering

- Add type filter controls to stock detail.
- Filter timeline by `weekly-check`, `earnings-review`, `valuation-update`, `risk-note`, `news-note`, `thesis-update`.
- Add dashboard filters for stock status and labels.

Acceptance criteria:

- Filter controls do not affect related posts.
- Empty states are clear and match existing `StateMessage` style.
- Dashboard can filter to owned stocks, watchlist stocks, previously owned stocks, and label groups.

### Phase 5: Prompt Templates

- Add prompt templates for stock weekly checks and thesis updates.
- Document expected output paths and front matter.

Acceptance criteria:

- Another agent can generate a weekly stock note in the correct folder.
- Generated notes appear automatically in `/stocks/:ticker`.

## Testing Plan

Minimum verification:

```bash
npm run build
```

Manual checks:

- Open `/stocks`.
- Open `/stocks/MSFT`.
- Verify direct refresh works for `/stocks/MSFT` in dev and production preview.
- Verify `/api/stocks` returns JSON.
- Verify `/api/stocks/MSFT` returns thesis, timeline, and related posts.
- Verify timeline sort order.
- Verify stock with no timeline notes has a clean empty state.
- Verify missing ticker returns 404.

If tests are added later, prioritize backend helper tests:

- `parseFrontMatter`
- `listStocks`
- `readStockTimeline`
- `findRelatedPosts`

## Important Non-Goals For First Version

Do not add these in the first implementation:

- User login.
- Database.
- Live external news API.
- Background jobs.
- Browser-based editor.
- Automatic scheduled weekly checks.
- Buy/sell activity ledger.
- Separate note detail routes unless needed.

These can come later after the file model and stock pages are stable.

## Final Recommended Model

```txt
Stock = permanent investment object
Thesis = content/stocks/<TICKER>/thesis.md
Timeline = dated Markdown files inside content/stocks/<TICKER>/
Future activity = content/stocks/<TICKER>/activity.md
Portfolio posts = content/posts/*.md
Stock page = thesis + stock timeline + related portfolio posts, later activity
```

This design scales from 6 stocks to many stocks while keeping the system understandable and compatible with the existing backend-first Markdown architecture.
