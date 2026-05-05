# Knowledge Core

Knowledge Core is a minimal Markdown blog built around backend-owned publishing. Posts are stored as `.md` files with front matter metadata, including tags, dates, descriptions, and optional images. The frontend reads only from the backend API and renders posts in grid, timeline, and detail views.

## Foundation

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Content: Markdown files in `content/posts`
- Fonts: bundled local `@fontsource/inter` and `@fontsource/jetbrains-mono`
- Heavy post renderers: lazy-loaded on post detail pages

## Frontend Structure

```txt
src/
  components/        shared UI primitives
  config/            app-level metadata
  features/posts/    post API, hooks, views, Markdown, charts
  lib/               small framework-agnostic utilities
```

The index route stays lightweight. Markdown parsing, Mermaid, and chart rendering live in the post-detail feature so the app has a better base for future features.

## Run

```bash
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Backend: `http://127.0.0.1:3001`

## Create A Post

In this version, posting is backend-only. Send Markdown and metadata to:

```bash
POST http://127.0.0.1:3001/api/posts
Content-Type: application/json
```

```json
{
  "title": "New Knowledge Note",
  "description": "A short summary for listing views.",
  "tags": ["system", "research"],
  "date": "2026-05-05",
  "coverImage": "/uploads/example.png",
  "body": "## Markdown\n\n```mermaid\ngraph TD\nA[Idea] --> B[Post]\n```\n\n```chart\n{\"type\":\"bar\",\"xKey\":\"label\",\"yKey\":\"value\",\"data\":[{\"label\":\"A\",\"value\":10}]}\n```"
}
```

## Charts

Markdown posts support fenced `chart` blocks. The renderer currently supports `bar`, `line`, and `pie` charts with a minimal black-and-white style.
