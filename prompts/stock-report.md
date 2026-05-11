# Stock Analysis Report

**Purpose:** Gather and analyze a specific stock, produce a structured research note.

**Triggers:** "analyze stock", "stock report for X", "deep dive on X"

---

## Instructions

1. **Gather data for the given ticker:**
   - Company name, sector, industry
   - Market cap, current price
   - P/E ratio (trailing and forward), PEG ratio
   - Revenue growth (1Y, 3Y)
   - EPS growth (1Y, 3Y)
   - Profit margins (gross, operating, net)
   - Debt-to-equity ratio
   - Dividend yield (if applicable)
   - Short interest percentage
   - Key catalysts or risks (news, earnings, sector trends)

2. **Write a concise analysis:**
   - Bull case (2-3 sentences)
   - Bear case (2-3 sentences)
   - Verdict: your take (1 sentence)

3. **Format the output** using the structure below.

---

## Output Format

```markdown
---
title: "[TICKER] — [COMPANY NAME]"
description: "Quick analysis: [one-line summary, e.g. valuation snapshot, growth profile, key risks]"
date: "[YYYY-MM-DD]"
tags: ["stocks", "analysis", "[SECTOR]"]
---

## Vital Signs

| Metric | Value |
|---|---|
| Price | $XX.XX |
| Market Cap | $X.XB |
| Forward P/E | XX.X |
| PEG | X.XX |
| Rev Growth 1Y | XX% |
| Net Margin | XX% |
| Debt/Equity | X.XX |
| Short Interest | X.X% |

## Bull Case

[2-3 sentences on what could drive this stock higher.]

## Bear Case

[2-3 sentences on the risks or reasons to avoid.]

## Verdict

[One sentence: buy, hold, avoid — with one reason.]
```

## Posting

After formatting, POST the result to `http://127.0.0.1:3001/api/posts` with `Content-Type: application/json`. Use the exact front matter and body structure above. Do NOT include a `slug` — the server generates it from the title.
