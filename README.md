# Investment Intelligent

A backend-first Markdown publishing system with a stock knowledge base.

Posts live as `.md` files with front matter. The frontend reads from the API. Stocks get their own permanent pages with investment theses and dated timeline notes. Agent prompt templates produce posts automatically.

## What It Does

- **Write Markdown.** Every post and stock thesis is a `.md` file on disk — no database.
- **Browse by view.** Grid, timeline, and Obsidian-style graph views on the index.
- **Rich content.** Markdown with Mermaid diagrams, Recharts chart blocks, code highlighting, and tables.
- **Track stocks.** Each ticker gets a permanent thesis page, timeline of research notes, and linked portfolio posts.
- **Screen macro themes.** A local screener maps macro factors to themes, candidate stocks, and portfolio exposure without live data feeds.
- **Agent prompts.** Reusable templates an AI agent can run to gather data, analyze stocks, and publish posts.
- **Backend publishing.** POST posts and upload images via the API. The browser only reads.

## Run

```bash
npm install
npm run dev
```

| | URL |
|---|---|
| **Frontend** | http://127.0.0.1:5174 |
| **Backend** | http://127.0.0.1:3001 |

## Routes

| Route | Page |
|---|---|
| `/` | Post index (grid, timeline, graph views) |
| `/posts/:slug` | Single post |
| `/stocks` | Stock dashboard |
| `/stocks/:ticker` | Stock detail (thesis, timeline, related posts) |
| `/screener` | Macro factor, theme, candidate, and portfolio exposure screener |
| `/prompts` | Prompt templates browser |

## Create A Post

```bash
POST http://127.0.0.1:3001/api/posts
Content-Type: application/json
```

```json
{
  "title": "New Note",
  "description": "A short summary for listing views.",
  "tags": ["stocks", "research"],
  "date": "2026-05-06",
  "coverImage": "/uploads/example.png",
  "body": "## Markdown\n\n```mermaid\ngraph TD\nA[Idea] --> B[Post]\n```\n\n```chart\n{\"type\":\"bar\",\"xKey\":\"label\",\"yKey\":\"value\",\"data\":[{\"label\":\"A\",\"value\":10}]}\n```"
}
```

## Upload An Image

```bash
curl -X POST http://127.0.0.1:3001/api/upload -F "image=@photo.png"
```

Returns `{ "url": "/uploads/photo-1712345678901.png" }`. Use this URL in `coverImage` or inside Markdown body.

## Stock Model

Each stock in `content/stocks/<TICKER>/` has:

```
MSFT/
  thesis.md              ← investment thesis (status, conviction, labels)
  2026-05-11-weekly-check.md  ← timeline note
```

Thesis front matter example:

```md
---
ticker: MSFT
company: Microsoft
status: owned
conviction: strong
theme: Cloud + AI
labels: ["core-holding", "ai", "cloud", "mega-cap"]
---
```

Timeline notes connect to the stock page and show in date order. Portfolio-wide posts with a `tickers: ["MSFT", "META"]` field appear as related posts.

## Macro Screener

The `/screener` route reads `content/screener/config.json` and renders a top-down investment map:

- macro regime and risk level
- macro factors, states, trends, and impacted themes
- theme matrix with beneficiaries and risks
- candidate table with explicit 1-5 judgment scores
- portfolio exposure by macro theme

The screener is intentionally not a news feed. News summaries belong in posts and stock timeline notes. Screener data is local-only and can be updated manually or by an agent.

## Charts

Posts and prompts support fenced `chart` blocks in `bar`, `line`, and `pie` types:

````markdown
```chart
{"type":"bar","title":"Revenue","xKey":"ticker","yKey":"value","data":[{"ticker":"MSFT","value":2800},{"ticker":"META","value":1900}]}
```
````

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Express (file-based, no database)
- **Diagrams:** Mermaid
- **Charts:** Recharts
- **Graph:** Cytoscape.js
- **Markdown:** marked

## Project Docs

| Doc | Content |
|---|---|
| `AGENTS.md` | Agent instructions — read this before working on the project |
| `DESIGN.md` | Full design system — colors, typography, components, rules |
| `DEPLOYMENT.md` | Deployment guide — VPS, PaaS, CI/CD |
| `docs/stock-knowledge-base-development-plan.md` | Stock feature implementation plan |
| `docs/technical-architecture-design.md` | Architecture overview |
| `docs/project-design-review.md` | Design review and recommendations |
