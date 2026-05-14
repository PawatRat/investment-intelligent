# Design System — Investment Intelligent

## Core Rule: Absolutely No Rounded Corners

**Every element in this project must have sharp, rectangular corners.** Zero `border-radius` anywhere — no exceptions. This is the defining identity of the design. Rounded corners (e.g., `rounded`, `rounded-lg`, `border-radius`) are forbidden in all components, prose styles, buttons, tags, inputs, images, charts, graph nodes, tooltips, and every other element.

---

## 1. Design Philosophy

- **Sharp and clean.** Every rectangle is a true rectangle. Zero softening, zero curves.
- **Minimal, not cold.** Neutral grays and careful spacing create warmth without decoration.
- **Typography-first.** Content is the entire point. The design gets out of the way.
- **Serif for reading, sans for UI.** Prose content uses a serif stack for a literary feel. Navigation, metadata, and chrome use sans-serif system fonts.
- **No decorative effects.** Shadows are only used where they serve a functional purpose (elevation hints). No gradients, no glows, no overlays.

---

## 2. Typography

### Font Stacks

| Role | Stack | Used In |
|---|---|---|
| **UI (sans)** | `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...` | Header, buttons, tags, filters, metadata, typewriter title |
| **Prose body (serif)** | `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif` | Post body paragraphs, lists, blockquotes |
| **Code (mono)** | `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace` | Inline code, code blocks, diagram labels |

### Scale

| Level | Size | Usage |
|---|---|---|
| **Hero** | `text-5xl` / `text-7xl` (md+) | Typewriter title on index |
| **Post title** | `text-4xl` / `text-5xl` (md+) | Post detail headings (`font-serif`) |
| **Section heading** | `clamp(1.75rem, 4vw, 2.5rem)` | `h2` inside prose |
| **Sub-heading** | `1.25rem` | `h3` inside prose |
| **Card title** | `text-2xl` | Grid view post cards |
| **Timeline title** | `text-3xl` | Timeline view |
| **Body** | `1.125rem` (18px) | Prose reading text |
| **UI labels** | `text-sm` (14px) | Buttons, descriptions, metadata |
| **Micro** | `text-xs` (12px) / `text-[11px]` | Tags, timestamps, secondary metadata |

### Weights

| Weight | Where |
|---|---|
| **400 (normal)** | Prose body, reading text |
| **500 (medium)** | Card descriptions, UI text, tags |
| **600 (semibold)** | Navigation, buttons, labels, headings |
| **700 (bold)** | Only in chart captions |

**Note:** Heading weights in prose are `font-weight: 500` (medium-low), not bold. This keeps the literary feel light and elegant.

---

## 3. Color System

### Base Palette

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| **Background** | `#ffffff` | `white` | Page background, cards, shells |
| **Surface** | `#f8fafc` | `slate-50` | Code blocks, blockquotes |
| **Surface alt** | `#f1f5f9` | `slate-100` | Inline code bg, tag bg, hover states |
| **Subtle border** | `#e2e8f0` | `slate-200` | All borders, dividers, table lines |
| **Muted text** | `#94a3b8` | `slate-400` | Placeholder, disabled |
| **Secondary text** | `#64748b` / `#475569` | `slate-500/600` | Descriptions, metadata, prose body |
| **Body text** | `#334155` | `slate-700` | Reading text, general content |
| **Strong text** | `#0f172a` | `slate-900` | Headings, titles, labels |
| **Pure black** | `#000000` | `black` | Chart text, graph nodes, cursor |

### Where Each Color Lives

```txt
Page background:       #ffffff (white)
Header background:     rgba(255,255,255,0.7) + backdrop-blur
Card background:       #ffffff (white)
Code block bg:         #f8fafc (slate-50)
Inline code bg:        #f1f5f9 (slate-100)
Tag bg:                #f1f5f9 (slate-100)
Tag text:              #475569 (slate-600)
Active tag:            #0f172a (slate-900) bg, white text
Borders:               #e2e8f0 (slate-200)
Post title:            #0f172a (slate-900)
Post body:             #334155 (slate-700)
Post meta:             #64748b (slate-500)
Links:                 #0f172a (slate-900), underline in slate-300
Graph nodes:           #000000 (black)
Graph edges:           #d0d0d0
```

---

## 4. Borders & Dividers

**Rule: 1px, sharp, slate-200 (`#e2e8f0`) everywhere.**

| Element | Style |
|---|---|
| Section dividers | `border-b border-slate-200` |
| Card borders | 1px solid `#e2e8f0` |
| Input/filter borders | 1px solid `#e2e8f0` |
| Code block borders | 1px solid `#e2e8f0` |
| Prose heading top rule | `border-top: 1px solid #e2e8f0` |
| Blockquote accent | `border-left: 4px solid #cbd5e1` (thicker) |
| Table cell borders | Horizontal only, 1px `#e2e8f0` |
| Table header rule | 2px `#e2e8f0` (slightly thicker) |

---

## 5. Shadows

Shadows are extremely sparse. Only used where functional elevation is needed.

| Element | Shadow |
|---|---|
| **Post images** | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| **Chart tooltip** | `0 4px 6px -1px rgb(0 0 0 / 0.1)` |
| **Filter input (focus)** | `shadow-sm` (Tailwind utility) |
| **Active icon button** | `shadow-sm` |
| **Header initials box** | `shadow-sm` |

No shadows on: cards, graph nodes, mermaid diagrams, tags, buttons (except active icon button).

---

## 6. Spacing & Layout

### Page Container

- **Index:** `max-w-6xl`, `px-5`, `py-12`
- **Post detail:** `max-w-4xl`, `px-5`, `py-12`
- **Header:** `max-w-6xl`, `px-5`, `py-4`
- **Prose sections:** `mt-16` from metadata, `mt-3.5` between `h2` sections

### Grid & Flex

- Card grid: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- Index header: `grid gap-8 lg:grid-cols-[1fr_360px]`
- Filter bar: `grid gap-5 lg:grid-cols-[1fr_auto]`
- Tag list: `flex flex-wrap gap-2`
- Tag filter: `flex flex-wrap gap-2`

---

## 7. Components

### SiteHeader

- Sticky, `backdrop-blur-md`, `bg-white/70`
- Left: logo monogram (slate-900 bg, white text, `shadow-sm`) + site name + tagline
- Right: edition badge (`border border-slate-200`, `bg-slate-50/50`, micro text)
- Navigation: click logo to go to `/` (via `navigate`)

### TypewriterTitle

- Sans font, bold weight, tight leading (`[0.96]`)
- Types text, pauses 3s, deletes, loops forever
- Cursor: `w-[0.08em] bg-black`, blinks when paused
- Respects `prefers-reduced-motion`: shows full text immediately

### IconButton (View Switcher)

- 3 buttons in an inline group: Grid, Timeline, Graph
- Container: `bg-slate-100 p-1`
- Active: white bg, slate-900 text, `shadow-sm`
- Inactive: transparent bg, slate-500 text, hover to slate-900
- No borders between buttons (segmented control pattern)

### TagFilter

- Horizontal wrap of pill-shaped buttons (rectangular, not rounded)
- Default: `bg-slate-100`, slate-600 text
- Active: `bg-slate-900`, white text, `shadow-sm`
- Hover: `bg-slate-200`

### TagList

- Inline tag chips with small icons
- Style: `bg-slate-100`, slate-600 text, `text-[12px]`
- Each tag has a `Tags` icon (lucide)

### PostCard (Grid View)

- White card, 1px slate-200 border
- Metadata across top (calendar icon + date + tag list)
- Title: `text-2xl semibold`
- Description: `text-sm` slate-700
- Footer button: `border border-slate-200`, hover: black bg + white text

### TimelineView

- Left-aligned vertical line (`border-l border-slate-200`)
- Each entry: bullet dot (white circle, slate-200 border), date, title, description, tags
- Title linked via `navigate` + `post.slug`

### GraphView (Obsidian-style)

- Uses cytoscape.js with `cose` force-directed layout
- Nodes: 10px black circles, labels below
- Edges: 1px light gray bezier curves
- Hover: node + connected elements highlight, rest dim to 15% opacity
- Click: navigates to post

### StateMessage

- Minimal message box: `p-6`, 1px slate-200 border, white bg
- Used for: loading, error, empty states

---

## 8. Post Content (Prose)

Markdown post body is rendered inside `.prose-core`.

### Typographic Style

- **Body font:** serif stack, `1.125rem` (18px), `line-height: 1.8`
- **Body color:** `#334155` (slate-700)
- **Max width:** constrained by `max-w-4xl` parent
- **Vertical rhythm:** `> * + * { margin-top: 1.4rem }`

### Headings

| Level | Font | Size | Weight | Color | Top border |
|---|---|---|---|---|---|
| **h2** | Serif | `clamp(1.75rem, 4vw, 2.5rem)` | 500 | `#0f172a` | 1px `#e2e8f0` |
| **h3** | Serif | `1.25rem` | 500 | `#0f172a` | None |

### Body Elements

| Element | Style |
|---|---|
| **Paragraph** | `color: #475569`, serif, 18px |
| **Link** | `color: #0f172a`, underline with `#cbd5e1` (slate-300), offset 4px |
| **Bold** | Inherits color from parent |
| **Lists** | `padding-left: 1.25rem`, `color: #475569` |
| **Blockquote** | `bg: #f8fafc`, `border-left: 4px #cbd5e1`, `color: #475569`, `padding: 1rem 1.5rem` |
| **Horizontal rule** | `border-top: 1px #e2e8f0`, `margin: 3rem 0` |

### Code

| Context | Style |
|---|---|
| **Inline code** | JetBrains Mono, `bg: #f1f5f9`, 1px `#e2e8f0` border, `color: #0f172a`, `padding: 0.2rem 0.4rem` |
| **Code blocks** | `bg: #f8fafc`, 1px `#e2e8f0` border, `padding: 1.25rem`, overflow-x scroll |
| **Code block inner** | `background: transparent`, `border: 0`, `display: block`, `padding: 0` |

### Images

- `display: block`, `max-width: 100%`, `height: auto`
- `box-shadow`: subtle shadow for depth
- No border (images inside `.prose-core` are shadow-only)

### Tables

- **No vertical borders.** Only horizontal separators between rows.
- Header: bottom border 2px `#e2e8f0`, uppercase, small, muted
- Data cells: bottom border 1px `#f1f5f9`, slate-700 text
- Last row: no bottom border
- No border-radius, no shadows

### Mermaid Diagrams

- Rendered as SVG inside `.diagram` divs
- Theme: `base` with white/black color scheme
- Font: `system-ui, sans-serif`
- Inherited border: 1px `#e2e8f0`

---

## 9. Chart Blocks

Charts use Recharts with a black-and-white theme.

| Chart Type | Key Style |
|---|---|
| **Bar** | Black fill, black stroke, slate gridlines |
| **Line** | Black stroke (2px), white dots (black border), black active dot |
| **Pie** | Alternating black/white slices, black stroke |

**Chart Shell:**
- Border: 1px `#e2e8f0`
- Background: white
- Caption: uppercase black title + muted description
- Tooltip: white bg, 1px slate-200 border, subtle shadow

---

## 10. Interactive States

| State | Pattern |
|---|---|
| **Hover (button)** | `hover:bg-black`, `hover:text-white` |
| **Hover (tag)** | `hover:bg-slate-200` |
| **Hover (link)** | Inherited (underlined) |
| **Hover (nav item)** | `hover:opacity-80` |
| **Focus (input)** | `focus-within:border-slate-400` |
| **Active (icon)** | `bg-white text-slate-900 shadow-sm` |
| **Active (tag)** | `bg-slate-900 text-white shadow-sm` |
| **Loading** | `StateMessage` component |
| **Empty** | `StateMessage` component |

---

## 11. Responsive Strategy

| Breakpoint | Behavior |
|---|---|
| **< 640px** | Chart stage shrinks to 280px height |
| **< 768px** | Post title drops from 5xl → 4xl, cards go 1-column |
| **≥ 768px (md)** | Grid goes 2-column, hero title goes 7xl |
| **≥ 1024px (lg)** | Grid goes 3-column, index header becomes 2-col layout |

---

## 12. File Map

```txt
src/
  components/
    DotField.jsx           — background dot pattern (pointer-events-none)
    IconButton.jsx         — segmented control button
    SiteHeader.jsx         — sticky nav bar
    StateMessage.jsx       — loading/error/empty state
    TypewriterTitle.jsx    — looping typewriter animation
  config/
    site.js               — site name, initials, tagline
  lib/
    date.js               — date formatting
    html.js               — HTML entity decoder
    router.js             — client-side router (pushState)
  features/posts/
    api.js                — fetchPosts(), fetchPost()
    hooks.js              — usePosts(), usePost()
    markdown.js           — parses sections (markdown vs chart blocks)
    PostIndex.jsx         — index page (grid/timeline/graph views)
    PostDetail.jsx        — single post page
    components/
      GraphView.jsx       — cytoscape graph visualization
      GridView.jsx        — card grid layout
      MarkdownBody.jsx    — markdown + mermaid + chart renderer
      PostCard.jsx        — grid card
      TagFilter.jsx       — tag-based filter bar
      TagList.jsx         — inline tag chips
      TimelineView.jsx    — vertical timeline layout
      charts/
        ChartBlock.jsx    — Recharts bar/line/pie renderer
server/
  index.js                — Express API (posts CRUD, image upload)
```
