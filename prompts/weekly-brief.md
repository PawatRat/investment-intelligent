# Weekly Brief

**Purpose:** Produce a weekly summary on a given topic — market recap, sector update, or trend report.

**Triggers:** "weekly brief on X", "summarize this week in X"

---

## Instructions

1. **Gather recent developments** (past 5-7 days) in the given topic area:
   - Major news headlines
   - Notable stock movers (if relevant)
   - Earnings reports or guidance updates
   - Industry/sector developments

2. **Identify 3-5 key themes** that dominated the week.

3. **Provide a forward look** — what to watch next week.

---

## Output Format

```markdown
---
title: "Weekly Brief — [TOPIC] — [WEEK ENDING DATE]"
description: "Key developments, movers, and themes in [topic] for the week of [date range]."
date: "[YYYY-MM-DD]"
tags: ["weekly", "brief", "[TOPIC]"]
---

## Key Themes

### 1. [Theme One]
[2-3 sentences on the biggest story of the week.]

### 2. [Theme Two]
[2-3 sentences.]

### 3. [Theme Three]
[2-3 sentences.]

## Movers

| Ticker | Move | Driver |
|---|---|---|
| XXX | +X.X% | [one-line reason] |
| XXX | -X.X% | [one-line reason] |

## Charts

```chart
{
  "type": "bar",
  "title": "Weekly Returns",
  "data": [
    {"label": "AAPL", "value": 2.3},
    {"label": "NVDA", "value": 5.1},
    {"label": "MSFT", "value": -1.2}
  ]
}
```

## What to Watch

- [Item 1 for next week]
- [Item 2 for next week]
- [Item 3 for next week]
```

## Posting

POST the result to `http://127.0.0.1:3001/api/posts`. Use real chart data — this template includes a sample chart block that the agent should replace with actual weekly return data. Do NOT include a `slug`.
