# Growth Stock Scanner

**Purpose:** Scan a sector or category for high-growth stocks, rank by growth metrics, and produce a watchlist report.

**Triggers:** "scan growth stocks", "find high growth in X", "growth screener for X"

---

## Instructions

1. **Identify candidates in the given sector/topic:**
   - List 5-10 relevant public companies
   - Focus on companies with clear growth narratives

2. **For each company, gather:**
   - Ticker, company name
   - Market cap
   - Revenue growth (1Y, 3Y if available)
   - EPS growth (1Y)
   - Forward P/E
   - PEG ratio
   - One-line thesis (what makes it a growth play)

3. **Rank them** by a composite of revenue growth + EPS growth + reasonable valuation (PEG < 2 preferred).

4. **Write a summary** of the top 3 picks and why they stand out.

---

## Output Format

```markdown
---
title: "Growth Watchlist — [TOPIC/SECTOR]"
description: "Screening high-growth opportunities in [sector]. Ranked by revenue growth, earnings momentum, and valuation reasonableness."
date: "[YYYY-MM-DD]"
tags: ["stocks", "growth", "watchlist", "[SECTOR]"]
---

## The Screen

[1-2 sentence intro: what we're looking for and why this sector is interesting right now.]

## Top Picks

| Rank | Ticker | Company | Market Cap | Rev Growth 1Y | Fwd P/E | PEG | Thesis |
|---|---|---|---|---|---|---|---|
| 1 | XXX | [Name] | $XB | XX% | XX.X | X.XX | One-line thesis |
| 2 | XXX | [Name] | $XB | XX% | XX.X | X.XX | One-line thesis |
| 3 | XXX | [Name] | $XB | XX% | XX.X | X.XX | One-line thesis |

## Runner-Up

| Ticker | Company | Market Cap | Rev Growth 1Y | Note |
|---|---|---|---|---|
| XXX | [Name] | $XB | XX% | Brief note |
| XXX | [Name] | $XB | XX% | Brief note |

## Takeaway

[2-3 sentences: which stocks caught attention, risks to the thesis, what to watch next.]
```

## Posting

POST the result to `http://127.0.0.1:3001/api/posts` with `Content-Type: application/json`. Do NOT include a `slug` — the server generates it from the title.
