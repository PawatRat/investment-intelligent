# Investment Intelligent Technical Architecture Design

## Overview

Investment Intelligent is a small, backend-first Markdown publishing system. The software design is intentionally simple:

- React renders the reading and browsing experience.
- Express owns publishing and upload writes.
- The filesystem is the content store.
- Markdown files are the source of truth for posts.
- The browser never writes content directly.

Architecture visual:

![Investment Intelligent technical architecture design](/Users/pawatrattanasom/Desktop/projs/knowledge-core/public/uploads/technical-architecture-design.svg)

## Runtime Topology

```txt
Browser
  |
  | GET /, /posts/:slug, /prompts
  v
Vite React app :5174
  |
  | dev proxy: /api, /uploads
  v
Express API :3001
  |
  | fs.readFile / fs.writeFile
  v
Filesystem
  - content/posts/*.md
  - prompts/*.md
  - public/uploads/*
```

In development, Vite serves the frontend on port `5174` and proxies `/api` and `/uploads` to Express on port `3001`. In production, the same-origin deployment needs to route API and upload requests to the backend.

## Client Design

The frontend is a read-only React application.

- `src/App.jsx` is the top-level route switch.
- `src/lib/router.js` implements minimal client routing with `pushState` and `popstate`.
- `src/features/posts/api.js` wraps `GET /api/posts` and `GET /api/posts/:slug`.
- `src/features/posts/hooks.js` owns loading, error, and fetched post state.
- `PostIndex.jsx` filters posts by tag/search and switches between grid, timeline, and graph views.
- `PostDetail.jsx` fetches one post and renders the Markdown body.

Heavy UI paths are lazy-loaded:

- `PostDetail`
- `PromptsDetail`
- `GraphView`
- `ChartBlock`
- `Mermaid`

## Backend Design

The backend is a single Express app in `server/index.js`.

Read endpoints:

- `GET /api/posts` lists all Markdown posts, strips the body, and adds `readingMinutes`.
- `GET /api/posts/:slug` returns one full post with body.
- `GET /api/prompts` lists prompt templates.
- `GET /api/prompts/:filename` returns one prompt template.
- `GET /uploads/*` serves uploaded static assets.

Write endpoints:

- `POST /api/posts` validates `title` and `body`, creates a slug, builds front matter, and writes a `.md` file.
- `POST /api/upload` accepts one multipart `image`, validates image MIME type, enforces a 5 MB limit, and writes into `public/uploads`.

The backend reads all post files from disk on each post request. There is no cache layer and no database.

## Content Model

Posts are Markdown files with simple front matter:

```markdown
---
title: Example Post
slug: example-post
description: Short description.
date: 2026-05-11
tags: ["project", "markdown"]
coverImage: /uploads/example.svg
---

Post body goes here.
```

The parser is intentionally lightweight. It supports scalar strings and array-style tags, but it is not a full YAML parser. Values with complex YAML behavior should be avoided unless the parser is replaced.

## Rendering Pipeline

Post body rendering has three paths:

- Regular Markdown is rendered with `marked`.
- Mermaid code blocks are converted into diagram containers and rendered client-side through lazy-loaded `mermaid`.
- Custom fenced `chart` blocks are parsed as JSON and rendered with Recharts.

Chart block flow:

```txt
Markdown body
  -> parseMarkdownSections()
  -> chart JSON config
  -> ChartBlock
  -> Recharts bar / line / pie
```

Mermaid flow:

```txt
Markdown body
  -> marked.parse()
  -> replace language-mermaid code blocks
  -> lazy import mermaid
  -> mermaid.render()
  -> inject generated SVG
```

## Key Design Decisions

- **Backend-only publishing:** The browser can read posts and prompts, but post creation goes through the backend API.
- **File-based CMS:** Markdown files are easy to inspect, version, and edit without database migrations.
- **Relative API URLs:** The frontend uses `/api/...`, so Vite can proxy in dev and production can use same-origin routing.
- **Lazy heavy renderers:** Cytoscape, Mermaid, chart rendering, and post detail views are kept off the initial path.
- **Prompt templates are first-class files:** The `prompts/` folder acts as a reusable agent workflow library for generating posts.

## Risks And Constraints

- **No sanitization:** `MarkdownBody.jsx` uses `dangerouslySetInnerHTML` after `marked.parse()`. This is acceptable only for trusted content. If untrusted authors are introduced, add DOMPurify or server-side sanitization.
- **No persistence guarantee on stateless hosts:** Posts and uploads are disk files. Deployments need persistent disk, Git-backed publishing, or object storage.
- **No write conflict handling:** `POST /api/posts` overwrites the slug file if the slug already exists.
- **No cache:** Listing posts reads every Markdown file on each request. This is fine for small content volume but should be revisited if the archive grows.
- **Simple front matter parser:** Colons and complex YAML structures can break expectations.

## Recommended Technical Improvements

1. Replace the custom front matter parser with a real parser such as `gray-matter`.
2. Add slug collision handling or explicit overwrite behavior for `POST /api/posts`.
3. Add Markdown sanitization before any untrusted publishing path exists.
4. Introduce a small content cache with invalidation after writes if post count grows.
5. Split `server/index.js` into route, content, prompt, and upload modules once backend behavior expands.
