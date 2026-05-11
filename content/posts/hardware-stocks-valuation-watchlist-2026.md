---
title: Hardware Stocks Valuation Watchlist 2026
slug: hardware-stocks-valuation-watchlist-2026
description: A valuation-first screen of hardware and hardware-adjacent public stocks using market cap, forward P/E, PEG, P/S, EV/EBITDA, growth, short interest, and quality context.
date: 2026-05-05
tags: ["stocks", "hardware", "valuation", "semiconductors", "research"]
tickers: ["HPQ", "SMCI", "HPE", "NTAP", "DELL", "CSCO", "FLEX", "JBL", "WDC", "STX", "NVDA", "AMD"]
---

This is a valuation-first map of hardware and hardware-adjacent stocks. The goal is not to find the most famous AI names. The goal is to find where valuation looks interesting after comparing price, growth, business quality, cyclicality, and risk.

Data below is mainly from Finviz snapshots around the May 4, 2026 close. Treat this as a research note, not investment advice. Hardware is cyclical, and low multiples can be traps when margins, inventory cycles, customer concentration, or growth estimates turn.

## The Screen

I screened for public companies connected to physical compute infrastructure:

- PC and print hardware: HP Inc.
- Servers and enterprise infrastructure: Dell, HPE, Super Micro
- Storage hardware: Western Digital, Seagate, NetApp
- Electronics manufacturing: Flex, Jabil
- Networking and hardware-adjacent infrastructure: Cisco
- AI chip reference points: NVIDIA and AMD

The key columns are:

- **Market cap**: business scale and liquidity.
- **Forward P/E**: price divided by expected next-year earnings.
- **PEG**: forward P/E adjusted by expected growth. Finviz defines PEG as forward P/E divided by annual EPS growth.
- **P/S**: price to sales, useful for low-margin hardware names.
- **EV/EBITDA**: debt-aware operating valuation.
- **EPS next 5Y**: expected annual EPS growth.
- **Short float**: market skepticism or squeeze risk.

## Valuation Table

| Ticker | Company | Segment | Market Cap | Forward P/E | PEG | P/S | EV/EBITDA | EPS Next 5Y | Short Float | Read |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| HPQ | HP Inc. | PC / print | $19.02B | 7.02 | 3.79 | 0.34 | n/a | 1.85% | 13.02% | Cheapest P/E, but weak growth makes the PEG unattractive. |
| SMCI | Super Micro Computer | AI servers | $16.72B | 9.38 | 0.51 | 0.56 | 14.95 | 17.40% | 16.84% | Looks cheap on growth, but the market is pricing meaningful execution risk. |
| HPE | Hewlett Packard Enterprise | servers / networking | $38.09B | 10.51 | 0.64 | 1.06 | 11.23 | 16.27% | 5.57% | One of the cleaner low-multiple setups if AI/networking growth converts. |
| NTAP | NetApp | storage / data infrastructure | $21.89B | 12.98 | ~1.3 | ~3.0 | ~11 | ~9% | ~9% | Less obviously cheap, but higher-margin storage software mix improves quality. |
| DELL | Dell Technologies | servers / storage / PC | $138.21B | 14.35 | 0.78 | ~1.2 | ~13.1 | 18.38% | 7.67% | Best scaled AI-infrastructure value candidate; not deep cheap anymore. |
| CSCO | Cisco | networking | $365.88B | 20.49 | 2.11 | 5.45 | n/a | 8.55% | 1.43% | Quality and cash flow, but valuation is no longer low. |
| FLEX | Flex | electronics manufacturing | $32.10B | 23.91 | 1.55 | 1.20 | 17.48 | 15.40% | 2.48% | Re-rated hard; valuation now asks for execution. |
| JBL | Jabil | electronics manufacturing | $35.96B | 23.59 | 1.17 | 1.10 | 16.21 | 20.22% | 2.35% | Better growth-adjusted than Flex, but no longer a bargain. |
| WDC | Western Digital | storage hardware | $152.47B | 25.67 | 0.35 | 12.95 | n/a | 72.95% | 7.96% | PEG looks very cheap because estimates exploded; cyclicality risk is high. |
| STX | Seagate | storage hardware | $165.60B | 28.30 | 0.42 | 15.04 | n/a | 67.34% | 3.78% | Same storage-cycle issue as WDC: low PEG, high sales multiple. |
| NVDA | NVIDIA | AI accelerators | $4.82T | 17.83 | 0.45 | 22.34 | n/a | 39.38% | 1.21% | Surprisingly reasonable forward P/E, but still priced at a huge sales premium. |
| AMD | Advanced Micro Devices | CPUs / GPUs | $556.83B | 30.07 | 0.57 | 16.08 | n/a | n/a | 2.20% | Growth-adjusted valuation is interesting, but P/E and P/S are still demanding. |

## Forward P/E Comparison

```chart
{
  "type": "bar",
  "title": "Forward P/E",
  "description": "Lower is cheaper, before adjusting for growth quality",
  "xKey": "ticker",
  "yKey": "forwardPE",
  "data": [
    { "ticker": "HPQ", "forwardPE": 7.02 },
    { "ticker": "SMCI", "forwardPE": 9.38 },
    { "ticker": "HPE", "forwardPE": 10.51 },
    { "ticker": "NTAP", "forwardPE": 12.98 },
    { "ticker": "DELL", "forwardPE": 14.35 },
    { "ticker": "NVDA", "forwardPE": 17.83 },
    { "ticker": "CSCO", "forwardPE": 20.49 },
    { "ticker": "JBL", "forwardPE": 23.59 },
    { "ticker": "FLEX", "forwardPE": 23.91 },
    { "ticker": "WDC", "forwardPE": 25.67 },
    { "ticker": "STX", "forwardPE": 28.30 },
    { "ticker": "AMD", "forwardPE": 30.07 }
  ]
}
```

The lowest forward P/E names are **HPQ**, **SMCI**, **HPE**, **NTAP**, and **DELL**. That is the first useful cut, but it is not enough. HPQ is cheap because growth is weak. SMCI is cheap because risk is high. HPE and Dell sit in the more interesting middle: not distressed, tied to AI infrastructure, and still below many large-cap tech multiples.

## PEG Comparison

```chart
{
  "type": "bar",
  "title": "PEG Ratio",
  "description": "Lower can signal better growth-adjusted value, but cyclical estimates can distort it",
  "xKey": "ticker",
  "yKey": "peg",
  "data": [
    { "ticker": "WDC", "peg": 0.35 },
    { "ticker": "STX", "peg": 0.42 },
    { "ticker": "NVDA", "peg": 0.45 },
    { "ticker": "SMCI", "peg": 0.51 },
    { "ticker": "AMD", "peg": 0.57 },
    { "ticker": "HPE", "peg": 0.64 },
    { "ticker": "DELL", "peg": 0.78 },
    { "ticker": "JBL", "peg": 1.17 },
    { "ticker": "NTAP", "peg": 1.28 },
    { "ticker": "FLEX", "peg": 1.55 },
    { "ticker": "CSCO", "peg": 2.11 },
    { "ticker": "HPQ", "peg": 3.79 }
  ]
}
```

PEG changes the story. HPQ moves from "cheapest" to "cheap for a reason." WDC and STX screen as extremely cheap on PEG, but that is because storage earnings estimates have surged. The risk is that investors are capitalizing peak-cycle earnings.

## Market Cap Map

```chart
{
  "type": "bar",
  "title": "Market Cap",
  "description": "USD billions; NVIDIA is excluded so smaller names remain readable",
  "xKey": "ticker",
  "yKey": "marketCap",
  "data": [
    { "ticker": "SMCI", "marketCap": 16.72 },
    { "ticker": "HPQ", "marketCap": 19.02 },
    { "ticker": "NTAP", "marketCap": 21.89 },
    { "ticker": "FLEX", "marketCap": 32.10 },
    { "ticker": "JBL", "marketCap": 35.96 },
    { "ticker": "HPE", "marketCap": 38.09 },
    { "ticker": "DELL", "marketCap": 138.21 },
    { "ticker": "WDC", "marketCap": 152.47 },
    { "ticker": "STX", "marketCap": 165.60 },
    { "ticker": "CSCO", "marketCap": 365.88 },
    { "ticker": "AMD", "marketCap": 556.83 }
  ]
}
```

Size matters. A $16B hardware name with high short interest behaves differently from a $365B networking compounder or a $4.8T AI accelerator leader. The lower-cap names can rerate faster, but they also punish mistakes harder.

## Synthesis

### 1. Best balance of low valuation and credible growth: HPE and DELL

**HPE** screens well because the forward P/E is near 10, the PEG is below 1, and P/S is close to 1. That is a rare combination for a company tied to servers, networking, and AI infrastructure. The issue is quality: trailing earnings are messy, return metrics are not clean, and debt/enterprise value matter.

**DELL** is larger, cleaner, and more scaled. It is not as cheap as HPE, but a mid-teens forward P/E and sub-1 PEG are still interesting if AI server demand and storage refresh cycles stay strong. The catch is that Dell already rerated, so future upside needs earnings delivery, not just multiple expansion.

### 2. Highest upside / highest risk value: SMCI

SMCI has the kind of valuation screen that value investors notice: forward P/E below 10, PEG near 0.5, P/S below 1, and strong expected growth. But the short float is high. That means the market is not ignoring the stock; it is actively debating the quality and durability of the earnings stream.

The stock is interesting only if you believe the company can keep revenue growth, margins, governance, supply chain execution, and customer demand stable. If any of those break, the low multiple may be a warning, not an opportunity.

### 3. Optical cheap but structurally weak: HPQ

HPQ is the cheapest stock in the table on forward P/E. The market cap is modest, P/S is extremely low, and the dividend can matter for total return. But the PEG ratio is high because growth expectations are low. This is more of a cash-return / mean-reversion case than a growth-at-a-discount case.

For HPQ to work well, investors likely need one of three things: stronger PC replacement demand, print stabilization, or aggressive capital return at attractive prices.

### 4. Storage stocks are not simple bargains anymore: WDC and STX

WDC and STX show very low PEG ratios because expected earnings growth is enormous. But both also trade at high P/S ratios after huge share-price moves. That is an unusual mix: cheap on forward growth, expensive on current sales.

The core question is cycle durability. If AI storage demand creates a multi-year margin reset, these names can keep working. If current forecasts are near peak-cycle optimism, PEG is misleading.

### 5. Quality but not low valuation: Cisco, Flex, Jabil

Cisco is safer and more durable than most hardware names, but it no longer screens as low valuation. Flex and Jabil are benefiting from electronics manufacturing and AI infrastructure exposure, but both have already rerated. They may still be good companies, but the easy valuation argument is weaker now.

### 6. AI leaders are not all expensive in the same way

NVIDIA is not low valuation on sales. A P/S above 20 is a premium multiple. But its forward P/E and PEG are less extreme because earnings are enormous. AMD is more demanding on forward P/E, but still screens well on PEG if growth expectations are met.

This matters because "cheap" depends on the denominator. NVIDIA is expensive versus sales, less expensive versus forward earnings, and still highly dependent on whether AI accelerator margins stay exceptional.

## Ranking

My valuation-interest ranking from this screen:

1. **HPE**: best low-multiple plus growth setup, but watch debt, margins, and integration risk.
2. **DELL**: stronger scale and AI server exposure, still reasonable but no longer undiscovered.
3. **SMCI**: highest upside screen, highest risk profile.
4. **NTAP**: not deep cheap, but stronger margin profile and storage relevance.
5. **HPQ**: cheap P/E, weak growth; more value trap risk.
6. **JBL**: good growth-adjusted setup, but rerated.
7. **FLEX**: good business momentum, valuation less compelling.
8. **WDC / STX**: strong momentum and low PEG, but storage-cycle risk is too large to call them clean value.
9. **CSCO**: quality, but valuation does not screen low.
10. **NVDA / AMD**: useful reference points, not classic low-valuation hardware stocks.

## What I Would Track Next

- Gross margin trend by segment.
- Free cash flow conversion, not just EPS.
- Backlog quality for AI servers and storage.
- Customer concentration.
- Inventory and working capital.
- Debt maturity and interest expense.
- Share count direction.
- Whether revenue growth is unit-driven or pricing-driven.
- Whether PEG is low because growth is durable, or because estimates are temporarily inflated.

## Sources

- Finviz explains **Forward P/E** and **PEG** definitions in its screener help page.
- Finviz valuation snapshots used: [DELL](https://finviz.com/quote.ashx?e=2026-06-18&ov=chain_date&p=d&r=y1&t=DELL%2CIONQ&ty=oc), [HPQ](https://finviz.com/quote?p=w&t=HPQ&ta=1&ty=c), [HPE](https://finviz.com/quote?t=HPE&ty=ea), [SMCI](https://finviz.com/quote.ashx?t=SMCI&ty=ocv), [NTAP](https://finviz.com/quote.ashx?t=NTAP&ty=ea), [WDC](https://finviz.com/quote.ashx?t=wdc), [STX](https://finviz.com/quote?t=STX), [CSCO](https://finviz.com/quote.ashx?e=2026-05-22&ov=list_date&p=w&r=y2&t=CSCO&ta=0&ty=ocv), [FLEX](https://finviz.com/quote?t=FLEX), [JBL](https://finviz.com/quote?t=JBL), [NVDA](https://finviz.com/quote?t=NVDA), and [AMD](https://finviz.com/quote?t=AMD).
- StockAnalysis cross-check pages used for Dell and HP valuation context: [DELL statistics](https://stockanalysis.com/stocks/dell/statistics/) and [HPQ ratios](https://stockanalysis.com/stocks/hpq/financials/ratios/).
