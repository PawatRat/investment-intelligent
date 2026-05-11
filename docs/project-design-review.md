# Knowledge Core Project Design Review

## Design Read

Knowledge Core has a clear product shape: it is not a generic blog theme, it is a backend-owned Markdown publishing surface. The strongest design decision is the strict rectangular visual language. The no-radius rule, slate palette, serif prose, and sparse borders make the app feel like a quiet editorial tool rather than a marketing site.

The main experience works as a publishing archive:

- The index gives three useful modes: grid for browsing, timeline for chronology, graph for relationships.
- The post detail page correctly gets quieter and lets the prose, tables, charts, diagrams, and code blocks carry the experience.
- The prompt library fits the backend-first concept because prompts are templates for producing posts, not a separate authoring UI.
- The file-based content model is easy to reason about and keeps the architecture lightweight.

## Visual Artifact

Open this SVG design board:

![Knowledge Core project design visual](/Users/pawatrattanasom/Desktop/projs/knowledge-core/public/uploads/project-design-visual.svg)

The board summarizes the visual language, index layout, reading surface, publishing flow, and design review notes.

## Strengths

- **Identity is coherent:** Sharp corners, thin borders, monochrome slate UI, and serif prose all reinforce the same editorial system.
- **Architecture and UI agree:** The browser reads, the backend publishes, and the UI presents content as an archive instead of pretending to be a CMS.
- **View modes are valuable:** Grid, timeline, and graph are meaningfully different ways to inspect the same posts.
- **The post renderer is extensible:** Markdown, Mermaid, and chart blocks make posts richer without changing the storage model.

## Issues To Tighten

- **Palette drift:** `DESIGN.md` specifies slate tokens, but several components use `neutral-*`. They are visually close, but it weakens the documented system.
- **Shadow drift:** `PostCard` uses `shadow-sm`, while `DESIGN.md` says cards should not use shadows. Either remove the card shadow or update the design spec.
- **Border weight drift:** `TimelineView` uses `border-l-2`, while the design rule says borders are normally 1px except documented cases.
- **Security caveat:** Markdown HTML is rendered through `dangerouslySetInnerHTML` without sanitization. This is acceptable only while publishing remains trusted and backend-only.
- **Deployment caveat:** The file-backed model needs persistent disk or an object storage strategy in production.

## Recommended Next Steps

1. Normalize component classes from `neutral-*` to `slate-*` so implementation and `DESIGN.md` match exactly.
2. Decide whether post cards should have shadows. The cleaner answer is to remove `shadow-sm` from cards and graph/loading shells.
3. Add a short security note near `MarkdownBody.jsx` or in `DEPLOYMENT.md` explaining that raw HTML is trusted-only until DOMPurify or equivalent sanitization is added.
4. Keep new UI features as rectangular, sparse, and content-led. The current design is strongest when it avoids decorative chrome.
