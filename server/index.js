import express from "express";
import fs from "node:fs/promises";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const postsDir = path.join(rootDir, "content", "posts");
const promptsDir = path.join(rootDir, "prompts");
const stocksDir = path.join(rootDir, "content", "stocks");
const uploadsDir = path.join(rootDir, "public", "uploads");
const activitiesFile = path.join(rootDir, "activities_portfolio.csv");
const quoteCache = new Map();
const quoteCacheTtlMs = 5 * 60 * 1000;
const historicalPriceCache = new Map();
const historicalPriceCacheTtlMs = 6 * 60 * 60 * 1000;
const tickerAliases = {
  SPLG: "SPYM"
};

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_request, _file, callback) => {
      await fs.mkdir(uploadsDir, { recursive: true });
      callback(null, uploadsDir);
    },
    filename: (_request, file, callback) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
      callback(null, `${base || "upload"}-${timestamp}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_request, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only images are allowed (jpeg, png, gif, webp, svg)"), false);
    }
  }
});

app.post("/api/upload", upload.single("image"), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: "No image provided" });
    return;
  }
  response.json({ url: `/uploads/${request.file.filename}` });
});

app.use((error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      response.status(413).json({ error: "File too large (max 5 MB)" });
      return;
    }
    response.status(400).json({ error: error.message });
    return;
  }
  if (error.message && error.message.includes("Only images are allowed")) {
    response.status(400).json({ error: error.message });
    return;
  }
  next(error);
});

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontMatter(source) {
  if (!source.startsWith("---")) {
    return { data: {}, body: source.trim() };
  }

  const end = source.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: source.trim() };
  }

  const frontMatter = source.slice(3, end).trim();
  const body = source.slice(end + 4).trim();
  const data = {};

  for (const line of frontMatter.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return { data, body };
}

function buildFrontMatter(post) {
  const tickers = Array.isArray(post.tickers) ? post.tickers.filter(Boolean) : [];
  const fields = {
    title: post.title,
    slug: post.slug,
    description: post.description,
    date: post.date,
    tags: `[${post.tags.map((tag) => `"${tag}"`).join(", ")}]`,
    tickers: tickers.length > 0 ? `[${tickers.map((t) => `"${t}"`).join(", ")}]` : "",
    coverImage: post.coverImage || ""
  };

  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`);

  return `---\n${lines.join("\n")}\n---\n\n${post.body.trim()}\n`;
}

async function readPostFile(fileName) {
  const filePath = path.join(postsDir, fileName);
  const source = await fs.readFile(filePath, "utf8");
  const { data, body } = parseFrontMatter(source);
  const slug = data.slug?.trim() || fileName.replace(/\.md$/, "");

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    tickers: Array.isArray(data.tickers) ? data.tickers : [],
    coverImage: data.coverImage || "",
    body
  };
}

async function listPosts() {
  await fs.mkdir(postsDir, { recursive: true });
  const files = await fs.readdir(postsDir);
  const posts = await Promise.all(
    files.filter((file) => file.endsWith(".md")).map((file) => readPostFile(file))
  );

  return posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

async function listStockTheses() {
  await fs.mkdir(stocksDir, { recursive: true });
  const entries = await fs.readdir(stocksDir, { withFileTypes: true });
  const tickers = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const stocks = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const source = await fs.readFile(path.join(stocksDir, ticker, "thesis.md"), "utf8");
        const { data } = parseFrontMatter(source);
        return {
          ticker: data.ticker || ticker,
          company: data.company || "",
          sector: data.sector || "",
          status: data.status || "",
          conviction: data.conviction || "",
          labels: Array.isArray(data.labels) ? data.labels : [],
          theme: data.theme || "",
          updated: data.updated || ""
        };
      } catch {
        return { ticker, company: ticker, status: "", conviction: "", labels: [], theme: "", updated: "", sector: "" };
      }
    })
  );

  return stocks;
}

async function readStockTimeline(ticker) {
  const dir = path.join(stocksDir, ticker.toUpperCase());
  try {
    const files = await fs.readdir(dir);
    const notes = files.filter((f) => f.endsWith(".md") && f !== "thesis.md" && f !== "activity.md");
    const timeline = await Promise.all(
      notes.map(async (filename) => {
        const source = await fs.readFile(path.join(dir, filename), "utf8");
        const { data, body } = parseFrontMatter(source);
        return {
          slug: filename.replace(".md", ""),
          type: data.type || "",
          date: data.date || "",
          title: data.title || filename.replace(".md", ""),
          summary: data.summary || "",
          action: data.action || "",
          ticker: data.ticker || ticker,
          body
        };
      })
    );
    return timeline.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch {
    return [];
  }
}

async function readStockNote(ticker, noteSlug) {
  const safeSlug = slugify(noteSlug);
  if (safeSlug !== noteSlug) {
    const error = new Error("Invalid note slug");
    error.code = "ENOENT";
    throw error;
  }

  const source = await fs.readFile(path.join(stocksDir, ticker.toUpperCase(), `${safeSlug}.md`), "utf8");
  const { data, body } = parseFrontMatter(source);

  return {
    slug: safeSlug,
    type: data.type || "",
    date: data.date || "",
    title: data.title || safeSlug,
    summary: data.summary || "",
    action: data.action || "",
    ticker: data.ticker || ticker.toUpperCase(),
    body
  };
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseActivityDate(value) {
  const cleaned = String(value || "").trim().replace(/-/g, " ");
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/.exec(cleaned);
  if (!match) return "";

  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  const day = Number(match[1]);
  const month = months[match[2].toLowerCase()];
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;

  if (!day || month === undefined || !year) return "";

  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseUsd(value) {
  const cleaned = String(value || "").replace("~", "").replace("USD", "").replace(/[,+]/g, "").trim();
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

function classifyActivity(activity) {
  const normalized = String(activity || "").toLowerCase();
  if (normalized === "buy" || normalized === "sell") return "trade";
  if (normalized.includes("dividend")) return "income";
  if (normalized.includes("fee")) return "fee";
  return "other";
}

function normalizeTicker(value) {
  const ticker = String(value || "").trim().toUpperCase();
  return tickerAliases[ticker] || ticker;
}

function signedCashFlow(activity, amount) {
  if (amount === null) return null;
  const normalized = String(activity || "").toLowerCase();
  if (normalized === "buy") return -Math.abs(amount);
  if (normalized === "sell") return Math.abs(amount);
  return amount;
}

function resolveTradeAmount(activity, rawAmount, executedPrice, shares, warnings) {
  const isTrade = activity === "Buy" || activity === "Sell";
  if (Number.isFinite(rawAmount) || !isTrade) {
    return rawAmount;
  }

  if (!Number.isFinite(executedPrice) || executedPrice <= 0 || !Number.isFinite(shares) || shares <= 0) {
    return rawAmount;
  }

  const derivedAmount = executedPrice * shares;
  warnings.push(`Amount derived from executed price × shares: ${roundNumber(derivedAmount, 2)}`);
  return derivedAmount;
}

function resolveTradeShares(activity, amount, executedPrice, rawShares, warnings) {
  if (activity !== "Buy" || !Number.isFinite(amount) || !Number.isFinite(executedPrice) || executedPrice <= 0) {
    return rawShares;
  }

  const impliedShares = Math.abs(amount) / executedPrice;
  if (!Number.isFinite(impliedShares) || impliedShares <= 0) {
    return rawShares;
  }

  if (!Number.isFinite(rawShares)) {
    warnings.push(`Shares derived from amount / executed price: ${roundNumber(impliedShares, 8)}`);
    return impliedShares;
  }

  const absoluteDifference = Math.abs(rawShares - impliedShares);
  const relativeDifference = absoluteDifference / impliedShares;
  const clearMismatch = absoluteDifference > 0.0001 && relativeDifference > 0.005;
  const likelyDisplayedShareTruncation = absoluteDifference >= 0.00001 && absoluteDifference <= 0.0001;

  if (clearMismatch || likelyDisplayedShareTruncation) {
    warnings.push(`Shares adjusted from ${roundNumber(rawShares, 8)} to ${roundNumber(impliedShares, 8)} using amount / executed price`);
    return impliedShares;
  }

  return rawShares;
}

function buildActivitySummary(activities) {
  const tickerRows = activities.filter((activity) => activity.ticker);
  const buyRows = tickerRows.filter((activity) => activity.activity === "Buy");
  const sellRows = tickerRows.filter((activity) => activity.activity === "Sell");
  const dividendRows = tickerRows.filter((activity) => activity.activity === "Dividend");
  const withholdingRows = tickerRows.filter((activity) => activity.activity === "Dividend Withholding Tax");
  const feeRows = tickerRows.filter((activity) => activity.category === "fee");

  const buyShares = buyRows.reduce((total, activity) => total + (activity.shares || 0), 0);
  const sellShares = sellRows.reduce((total, activity) => total + (activity.shares || 0), 0);
  const totalBuyAmount = buyRows.reduce((total, activity) => total + (activity.amount || 0), 0);
  const totalSellAmount = sellRows.reduce((total, activity) => total + (activity.amount || 0), 0);
  const dividends = dividendRows.reduce((total, activity) => total + (activity.amount || 0), 0);
  const withholdingTax = withholdingRows.reduce((total, activity) => total + (activity.amount || 0), 0);
  const fees = feeRows.reduce((total, activity) => total + (activity.amount || 0), 0);
  const netCashFlow = tickerRows.reduce((total, activity) => {
    if (activity.signedCashFlow === null) return total;
    return total + activity.signedCashFlow;
  }, 0);

  return {
    activityCount: tickerRows.length,
    tradeCount: buyRows.length + sellRows.length,
    latestActivity: tickerRows[0] || null,
    shares: roundNumber(buyShares - sellShares, 8),
    totalBuyAmount: roundNumber(totalBuyAmount, 2),
    totalSellAmount: roundNumber(totalSellAmount, 2),
    averageBuyPrice: buyShares > 0 ? roundNumber(totalBuyAmount / buyShares, 2) : null,
    dividends: roundNumber(dividends, 2),
    withholdingTax: roundNumber(withholdingTax, 2),
    fees: roundNumber(fees, 2),
    netCashFlow: roundNumber(netCashFlow, 2),
    warnings: tickerRows.flatMap((activity) => activity.warnings.map((warning) => ({
      id: activity.id,
      date: activity.date,
      activity: activity.activity,
      warning
    })))
  };
}

function roundNumber(value, decimals) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nullableRoundNumber(value, decimals) {
  if (!Number.isFinite(value)) return null;
  return roundNumber(value, decimals);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toUnixSeconds(dateString) {
  return Math.floor(new Date(`${dateString}T00:00:00.000Z`).getTime() / 1000);
}

function percentChange(gain, basis) {
  if (!Number.isFinite(gain) || !Number.isFinite(basis) || basis <= 0) return null;
  return roundNumber((gain / basis) * 100, 2);
}

function uniqueWarnings(warnings) {
  const seen = new Set();
  return warnings.filter((warning) => {
    const key = `${warning.id || ""}:${warning.ticker || ""}:${warning.date || ""}:${warning.activity || ""}:${warning.warning || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchYahooQuote(ticker) {
  const normalizedTicker = ticker.toUpperCase();
  const cached = quoteCache.get(normalizedTicker);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < quoteCacheTtlMs) {
    return cached.quote;
  }

  const quote = {
    ticker: normalizedTicker,
    price: null,
    currency: "USD",
    marketTime: "",
    error: ""
  };

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?range=1d&interval=1d`);
    if (!response.ok) {
      throw new Error(`Quote request failed with ${response.status}`);
    }

    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta || {};
    const regularPrice = Number(meta.regularMarketPrice);
    const previousClose = Number(meta.previousClose);
    const closePrices = result?.indicators?.quote?.[0]?.close || [];
    const chartPrice = [...closePrices].reverse().find((value) => Number.isFinite(value));
    const price = Number.isFinite(regularPrice) ? regularPrice : Number.isFinite(chartPrice) ? chartPrice : previousClose;
    const marketTime = Number.isFinite(meta.regularMarketTime)
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

    if (!Number.isFinite(price)) {
      throw new Error("Missing latest price");
    }

    quote.price = roundNumber(price, 4);
    quote.currency = meta.currency || "USD";
    quote.marketTime = marketTime;
  } catch (error) {
    quote.error = error.message || "Unable to load quote";
  }

  quoteCache.set(normalizedTicker, { fetchedAt: now, quote });
  return quote;
}

async function fetchYahooHistoricalPrices(ticker, startDate, endDate) {
  const normalizedTicker = ticker.toUpperCase();
  const cacheKey = `${normalizedTicker}:${startDate}:${endDate}`;
  const cached = historicalPriceCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < historicalPriceCacheTtlMs) {
    return cached.result;
  }

  const result = {
    ticker: normalizedTicker,
    prices: new Map(),
    dates: [],
    error: ""
  };

  try {
    const period1 = toUnixSeconds(startDate);
    const period2 = toUnixSeconds(addDays(endDate, 1));
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?period1=${period1}&period2=${period2}&interval=1d&events=history%7Cdiv%7Csplit`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Historical price request failed with ${response.status}`);
    }

    const payload = await response.json();
    const chartResult = payload?.chart?.result?.[0];
    const timestamps = chartResult?.timestamp || [];
    const quote = chartResult?.indicators?.quote?.[0] || {};
    const adjClose = chartResult?.indicators?.adjclose?.[0]?.adjclose || [];
    const close = quote.close || [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const price = Number.isFinite(adjClose[index]) ? adjClose[index] : close[index];
      if (!Number.isFinite(price) || price <= 0) continue;

      const date = new Date(timestamps[index] * 1000).toISOString().slice(0, 10);
      result.prices.set(date, price);
      result.dates.push(date);
    }

    if (result.dates.length === 0) {
      throw new Error("No historical prices returned");
    }
  } catch (error) {
    result.error = error.message || "Unable to load historical prices";
  }

  historicalPriceCache.set(cacheKey, { fetchedAt: now, result });
  return result;
}

function getPriceOnOrBefore(priceMap, date, previousPrice) {
  const exactPrice = priceMap.get(date);
  if (Number.isFinite(exactPrice)) return exactPrice;
  return Number.isFinite(previousPrice) ? previousPrice : null;
}

async function buildPortfolioBenchmark(benchmarkTicker = "SPY") {
  const activityData = await readPortfolioActivities();
  const datedActivities = activityData.activities
    .filter((activity) => activity.date && activity.ticker)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  if (datedActivities.length === 0) {
    return {
      benchmark: benchmarkTicker,
      asOf: new Date().toISOString(),
      source: "yahoo-chart",
      series: [],
      summary: null,
      dataQuality: { warnings: [], unpricedTickers: [] }
    };
  }

  const startDate = datedActivities[0].date;
  const endDate = new Date().toISOString().slice(0, 10);
  const tickers = [...new Set(datedActivities.map((activity) => activity.ticker))].sort();
  const allTickers = [...new Set([...tickers, benchmarkTicker.toUpperCase()])];
  const historicalResults = await Promise.all(
    allTickers.map((ticker) => fetchYahooHistoricalPrices(ticker, startDate, endDate))
  );
  const historicalByTicker = Object.fromEntries(historicalResults.map((result) => [result.ticker, result]));
  const benchmarkHistory = historicalByTicker[benchmarkTicker.toUpperCase()];
  const benchmarkDates = benchmarkHistory?.dates || [];

  if (!benchmarkDates.length) {
    return {
      benchmark: benchmarkTicker.toUpperCase(),
      asOf: new Date().toISOString(),
      source: "yahoo-chart",
      series: [],
      summary: null,
      dataQuality: {
        warnings: [{ ticker: benchmarkTicker.toUpperCase(), warning: benchmarkHistory?.error || "Benchmark prices unavailable" }],
        unpricedTickers: [benchmarkTicker.toUpperCase()]
      }
    };
  }

  const holdings = {};
  const lastPrices = {};
  let benchmarkShares = 0;
  let portfolioCash = 0;
  let benchmarkCash = 0;
  let totalContributed = 0;
  let activityIndex = 0;
  const warnings = historicalResults
    .filter((result) => result.error)
    .map((result) => ({ ticker: result.ticker, warning: result.error }));
  const unpricedTickers = new Set(warnings.map((warning) => warning.ticker));

  const series = [];

  for (const date of benchmarkDates) {
    const benchmarkPrice = benchmarkHistory.prices.get(date);
    if (!Number.isFinite(benchmarkPrice)) continue;

    while (activityIndex < datedActivities.length && datedActivities[activityIndex].date <= date) {
      const activity = datedActivities[activityIndex];
      holdings[activity.ticker] ||= 0;

      if (activity.activity === "Buy") {
        if (Number.isFinite(activity.shares) && Number.isFinite(activity.amount)) {
          holdings[activity.ticker] += activity.shares;
          totalContributed += activity.amount;
          benchmarkShares += activity.amount / benchmarkPrice;
        }
      } else if (activity.activity === "Sell") {
        const sellShares = Number.isFinite(activity.shares) ? activity.shares : 0;
        const sellAmount = Number.isFinite(activity.amount) ? activity.amount : 0;
        holdings[activity.ticker] -= sellShares;
        portfolioCash += sellAmount;

        const benchmarkSharesToSell = sellAmount / benchmarkPrice;
        const soldBenchmarkShares = Math.min(benchmarkShares, benchmarkSharesToSell);
        benchmarkShares -= soldBenchmarkShares;
        benchmarkCash += soldBenchmarkShares * benchmarkPrice;
      } else if (activity.activity === "Dividend" || activity.activity === "Dividend Withholding Tax" || activity.category === "fee") {
        portfolioCash += Number.isFinite(activity.amount) ? activity.amount : 0;
      }

      activityIndex += 1;
    }

    let holdingsValue = 0;
    for (const ticker of tickers) {
      const shares = holdings[ticker] || 0;
      if (Math.abs(shares) < 0.00000001) continue;

      const history = historicalByTicker[ticker];
      const price = getPriceOnOrBefore(history?.prices || new Map(), date, lastPrices[ticker]);
      if (!Number.isFinite(price)) {
        unpricedTickers.add(ticker);
        continue;
      }

      lastPrices[ticker] = price;
      holdingsValue += shares * price;
    }

    if (totalContributed <= 0) continue;

    const portfolioValue = holdingsValue + portfolioCash;
    const benchmarkValue = benchmarkShares * benchmarkPrice + benchmarkCash;
    const portfolioReturnPct = ((portfolioValue - totalContributed) / totalContributed) * 100;
    const benchmarkReturnPct = ((benchmarkValue - totalContributed) / totalContributed) * 100;

    series.push({
      date,
      portfolioValue: roundNumber(portfolioValue, 2),
      benchmarkValue: roundNumber(benchmarkValue, 2),
      netInvested: roundNumber(totalContributed, 2),
      portfolioReturnPct: roundNumber(portfolioReturnPct, 2),
      benchmarkReturnPct: roundNumber(benchmarkReturnPct, 2),
      alphaPct: roundNumber(portfolioReturnPct - benchmarkReturnPct, 2)
    });
  }

  const latest = series.at(-1) || null;

  return {
    benchmark: benchmarkTicker.toUpperCase(),
    asOf: new Date().toISOString(),
    source: "yahoo-chart",
    startDate,
    endDate,
    series,
    summary: latest ? {
      portfolioValue: latest.portfolioValue,
      benchmarkValue: latest.benchmarkValue,
      netInvested: latest.netInvested,
      portfolioReturnPct: latest.portfolioReturnPct,
      benchmarkReturnPct: latest.benchmarkReturnPct,
      alphaPct: latest.alphaPct
    } : null,
    dataQuality: {
      warnings,
      unpricedTickers: [...unpricedTickers].sort()
    }
  };
}

function buildPositionPerformance(ticker, tickerActivities, quote) {
  let shares = 0;
  let costBasis = 0;
  let realizedGain = 0;
  let dividends = 0;
  let taxes = 0;
  let fees = 0;
  let totalBuyAmount = 0;
  const warnings = [];

  const orderedActivities = [...tickerActivities].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  for (const activity of orderedActivities) {
    if (activity.activity === "Buy") {
      if (Number.isFinite(activity.shares) && Number.isFinite(activity.amount)) {
        shares += activity.shares;
        costBasis += activity.amount;
        totalBuyAmount += activity.amount;
      }
    } else if (activity.activity === "Sell") {
      const sellShares = Number.isFinite(activity.shares) ? activity.shares : 0;
      const averageCost = shares > 0 ? costBasis / shares : 0;
      const removedBasis = averageCost * sellShares;

      shares -= sellShares;
      costBasis -= removedBasis;

      if (Number.isFinite(activity.amount)) {
        realizedGain += activity.amount - removedBasis;
      } else {
        warnings.push({
          id: activity.id,
          ticker,
          date: activity.date,
          activity: activity.activity,
          warning: "Sell amount missing; realized P/L is partial"
        });
      }
    } else if (activity.activity === "Dividend") {
      dividends += Number.isFinite(activity.amount) ? activity.amount : 0;
    } else if (activity.activity === "Dividend Withholding Tax") {
      taxes += Number.isFinite(activity.amount) ? activity.amount : 0;
    } else if (activity.category === "fee") {
      fees += Number.isFinite(activity.amount) ? activity.amount : 0;
    }

    for (const warning of activity.warnings || []) {
      warnings.push({
        id: activity.id,
        ticker,
        date: activity.date,
        activity: activity.activity,
        warning
      });
    }
  }

  if (shares < 0) {
    warnings.push({
      id: `${ticker}-negative-shares`,
      ticker,
      date: orderedActivities.at(-1)?.date || "",
      activity: "Position",
      warning: "Negative share balance"
    });
  }

  if (quote?.marketTime) {
    const marketAgeMs = Date.now() - new Date(quote.marketTime).getTime();
    if (Number.isFinite(marketAgeMs) && marketAgeMs > 7 * 24 * 60 * 60 * 1000) {
      warnings.push({
        id: `${ticker}-stale-quote`,
        ticker,
        date: quote.marketTime.slice(0, 10),
        activity: "Quote",
        warning: "Latest quote is stale"
      });
    }
  }

  if (Math.abs(shares) < 0.00000001) {
    shares = 0;
    costBasis = 0;
  }

  const hasMarketValue = shares > 0 && Number.isFinite(quote?.price);
  const marketValue = hasMarketValue ? shares * quote.price : null;
  const averageCost = shares > 0 ? costBasis / shares : null;
  const unrealizedGain = hasMarketValue ? marketValue - costBasis : null;
  const totalGain = (Number.isFinite(unrealizedGain) ? unrealizedGain : 0) + realizedGain + dividends + taxes + fees;
  const returnBasis = totalBuyAmount || costBasis;

  return {
    ticker,
    shares: roundNumber(shares, 8),
    price: nullableRoundNumber(quote?.price, 4),
    currency: quote?.currency || "USD",
    marketTime: quote?.marketTime || "",
    marketValue: nullableRoundNumber(marketValue, 2),
    costBasis: roundNumber(Math.max(costBasis, 0), 2),
    averageCost: nullableRoundNumber(averageCost, 2),
    unrealizedGain: nullableRoundNumber(unrealizedGain, 2),
    unrealizedReturnPct: percentChange(unrealizedGain, costBasis),
    realizedGain: roundNumber(realizedGain, 2),
    dividends: roundNumber(dividends, 2),
    taxes: roundNumber(taxes, 2),
    fees: roundNumber(fees, 2),
    totalGain: roundNumber(totalGain, 2),
    totalReturnPct: percentChange(totalGain, returnBasis),
    allocationPct: 0,
    quoteError: quote?.error || "",
    warnings
  };
}

async function buildPortfolioPerformance() {
  const activityData = await readPortfolioActivities();
  const activitiesByTicker = {};

  for (const activity of activityData.activities) {
    if (!activity.ticker) continue;
    activitiesByTicker[activity.ticker] ||= [];
    activitiesByTicker[activity.ticker].push(activity);
  }

  const quotes = {};
  await Promise.all(
    Object.entries(activityData.summaries).map(async ([ticker, summary]) => {
      quotes[ticker] = summary.shares > 0 ? await fetchYahooQuote(ticker) : {
        ticker,
        price: null,
        currency: "USD",
        marketTime: "",
        error: ""
      };
    })
  );

  const positions = Object.keys(activitiesByTicker).sort().map((ticker) => {
    return buildPositionPerformance(ticker, activitiesByTicker[ticker], quotes[ticker]);
  });
  const totalMarketValue = positions.reduce((total, position) => total + (position.marketValue || 0), 0);

  for (const position of positions) {
    position.allocationPct = totalMarketValue > 0 && Number.isFinite(position.marketValue)
      ? roundNumber((position.marketValue / totalMarketValue) * 100, 2)
      : 0;
  }

  const summary = {
    marketValue: roundNumber(totalMarketValue, 2),
    costBasis: roundNumber(positions.reduce((total, position) => total + position.costBasis, 0), 2),
    unrealizedGain: roundNumber(positions.reduce((total, position) => total + (position.unrealizedGain || 0), 0), 2),
    realizedGain: roundNumber(positions.reduce((total, position) => total + position.realizedGain, 0), 2),
    dividends: roundNumber(positions.reduce((total, position) => total + position.dividends, 0), 2),
    taxes: roundNumber(positions.reduce((total, position) => total + position.taxes, 0), 2),
    fees: roundNumber(positions.reduce((total, position) => total + position.fees, 0), 2),
    totalGain: roundNumber(positions.reduce((total, position) => total + position.totalGain, 0), 2),
    unrealizedReturnPct: null,
    totalReturnPct: null
  };
  summary.unrealizedReturnPct = percentChange(summary.unrealizedGain, summary.costBasis);
  summary.totalReturnPct = percentChange(summary.totalGain, summary.costBasis);

  return {
    asOf: new Date().toISOString(),
    source: "yahoo-chart",
    summary,
    positions,
    dataQuality: {
      warnings: uniqueWarnings([
        ...activityData.dataQuality.warnings,
        ...positions.flatMap((position) => position.warnings)
      ]),
      unpricedTickers: positions
        .filter((position) => position.shares > 0 && (!Number.isFinite(position.price) || position.quoteError))
        .map((position) => position.ticker)
        .sort(),
      untrackedTickers: activityData.dataQuality.untrackedTickers
    }
  };
}

async function readPortfolioActivities() {
  let source;
  try {
    source = await fs.readFile(activitiesFile, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return { activities: [], summaries: {}, dataQuality: { warnings: [], untrackedTickers: [] } };
    }
    throw error;
  }

  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const [headerLine, ...rows] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.replace(/^\uFEFF/, ""));

  const activities = rows.map((line, index) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] || ""]));
    const rawAmount = parseUsd(row["Amount / Cash Flow"]);
    const activity = row.Activity || "";
    const rawTicker = (row.Ticker || "").toUpperCase();
    const ticker = normalizeTicker(rawTicker);
    const date = parseActivityDate(row.Date);
    const warnings = [];
    const executedPrice = parseNumber(row["Executed Price"]);
    const rawShares = parseNumber(row.Shares);
    const shares = resolveTradeShares(activity, rawAmount, executedPrice, rawShares, warnings);
    const amount = resolveTradeAmount(activity, rawAmount, executedPrice, shares, warnings);

    if (!date) warnings.push("Invalid or missing date");
    if (!ticker && activity !== "CAT Fee" && activity !== "TAF Fee") warnings.push("Missing ticker");
    if (rawAmount === null && row.Note?.toLowerCase().includes("amount")) warnings.push(row.Note);

    return {
      id: `${date || "unknown"}-${index + 1}`,
      date,
      rawDate: row.Date || "",
      activity,
      category: classifyActivity(activity),
      ticker,
      rawTicker,
      amount,
      signedCashFlow: signedCashFlow(activity, amount),
      currency: row["Amount / Cash Flow"] ? "USD" : "",
      executedPrice,
      shares,
      rawShares,
      note: row.Note || "",
      warnings
    };
  }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const summaries = {};
  for (const activity of activities) {
    if (!activity.ticker) continue;
    summaries[activity.ticker] ||= [];
    summaries[activity.ticker].push(activity);
  }

  const summaryByTicker = Object.fromEntries(
    Object.entries(summaries).map(([ticker, tickerActivities]) => [ticker, buildActivitySummary(tickerActivities)])
  );
  const stockTickers = new Set((await listStockTheses()).map((stock) => stock.ticker.toUpperCase()));
  const activityTickers = Object.keys(summaryByTicker);

  return {
    activities,
    summaries: summaryByTicker,
    dataQuality: {
      warnings: activities.flatMap((activity) => activity.warnings.map((warning) => ({
        id: activity.id,
        ticker: activity.ticker,
        date: activity.date,
        activity: activity.activity,
        warning
      }))),
      untrackedTickers: activityTickers.filter((ticker) => !stockTickers.has(ticker)).sort()
    }
  };
}

async function findRelatedPosts(ticker) {
  const posts = await listPosts();
  return posts.filter((post) => {
    const tickersInTags = post.tags.some((tag) => tag.toUpperCase() === ticker.toUpperCase());
    const hasTickersField = Array.isArray(post.tickers);
    const tickerInField = hasTickersField && post.tickers.some((t) => t.toUpperCase() === ticker.toUpperCase());
    return tickersInTags || tickerInField;
  });
}

app.get("/api/stocks", async (_request, response, next) => {
  try {
    const stocks = await listStockTheses();
    const enriched = await Promise.all(
      stocks.map(async (stock) => {
        const timeline = await readStockTimeline(stock.ticker);
        return {
          ...stock,
          timelineCount: timeline.length,
          latestNote: timeline.length > 0 ? {
            slug: timeline[0].slug,
            type: timeline[0].type,
            date: timeline[0].date,
            title: timeline[0].title,
            summary: timeline[0].summary
          } : null
        };
      })
    );
    response.json(enriched);
  } catch (error) {
    next(error);
  }
});

app.get("/api/activities", async (_request, response, next) => {
  try {
    const activityData = await readPortfolioActivities();
    response.json(activityData);
  } catch (error) {
    next(error);
  }
});

app.get("/api/portfolio/performance", async (_request, response, next) => {
  try {
    const performance = await buildPortfolioPerformance();
    response.json(performance);
  } catch (error) {
    next(error);
  }
});

app.get("/api/portfolio/benchmark", async (request, response, next) => {
  try {
    const benchmark = String(request.query.benchmark || "SPY").toUpperCase().replace(/[^A-Z0-9.^-]/g, "");
    const data = await buildPortfolioBenchmark(benchmark || "SPY");
    response.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stocks/:ticker/timeline", async (request, response, next) => {
  try {
    const ticker = request.params.ticker.toUpperCase();
    const timeline = await readStockTimeline(ticker);
    response.json(timeline.map(({ body, ...note }) => note));
  } catch (error) {
    next(error);
  }
});

app.get("/api/stocks/:ticker/activity", async (request, response, next) => {
  try {
    const ticker = request.params.ticker.toUpperCase();
    const activityData = await readPortfolioActivities();
    const activities = activityData.activities.filter((activity) => activity.ticker === ticker);

    response.json({
      ticker,
      activities,
      summary: activityData.summaries[ticker] || buildActivitySummary([]),
      dataQuality: {
        warnings: activityData.dataQuality.warnings.filter((warning) => warning.ticker === ticker),
        untrackedTickers: activityData.dataQuality.untrackedTickers
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stocks/:ticker/performance", async (request, response, next) => {
  try {
    const ticker = request.params.ticker.toUpperCase();
    const performance = await buildPortfolioPerformance();
    const position = performance.positions.find((item) => item.ticker === ticker);

    response.json({
      ticker,
      asOf: performance.asOf,
      source: performance.source,
      position: position || null,
      dataQuality: {
        warnings: performance.dataQuality.warnings.filter((warning) => warning.ticker === ticker),
        unpricedTickers: performance.dataQuality.unpricedTickers,
        untrackedTickers: performance.dataQuality.untrackedTickers
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stocks/:ticker/notes/:noteSlug", async (request, response, next) => {
  try {
    const ticker = request.params.ticker.toUpperCase();
    const note = await readStockNote(ticker, request.params.noteSlug);
    response.json(note);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.status(404).json({ error: "Stock note not found" });
      return;
    }
    next(error);
  }
});

app.get("/api/stocks/:ticker", async (request, response, next) => {
  try {
    const ticker = request.params.ticker.toUpperCase();
    const source = await fs.readFile(path.join(stocksDir, ticker, "thesis.md"), "utf8");
    const { data, body: thesisBody } = parseFrontMatter(source);

    const timeline = await readStockTimeline(ticker);
    const relatedPosts = await findRelatedPosts(ticker);
    const activityData = await readPortfolioActivities();
    const activity = {
      ticker,
      activities: activityData.activities.filter((row) => row.ticker === ticker),
      summary: activityData.summaries[ticker] || buildActivitySummary([]),
      dataQuality: {
        warnings: activityData.dataQuality.warnings.filter((warning) => warning.ticker === ticker),
        untrackedTickers: activityData.dataQuality.untrackedTickers
      }
    };

    const stock = {
      ticker: data.ticker || ticker,
      company: data.company || ticker,
      sector: data.sector || "",
      status: data.status || "",
      conviction: data.conviction || "",
      labels: Array.isArray(data.labels) ? data.labels : [],
      theme: data.theme || "",
      updated: data.updated || "",
      thesisBody,
      timeline,
      activity,
      relatedPosts: relatedPosts.map(({ body, ...post }) => post)
    };

    response.json(stock);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.status(404).json({ error: "Stock not found" });
      return;
    }
    next(error);
  }
});

app.get("/api/prompts", async (_request, response, next) => {
  try {
    await fs.mkdir(promptsDir, { recursive: true });
    const files = await fs.readdir(promptsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "README.md");

    const prompts = await Promise.all(
      mdFiles.map(async (filename) => {
        const source = await fs.readFile(path.join(promptsDir, filename), "utf8");
        const firstLine = source.split("\n").find((l) => l.startsWith("# "));
        const purposeLine = source.split("\n").find((l) => l.includes("**Purpose:**"));
        const title = firstLine ? firstLine.replace(/^#\s+/, "") : filename.replace(".md", "");
        const purpose = purposeLine ? purposeLine.replace(/\*\*Purpose:\*\*\s*/, "") : "";
        return { filename, title, purpose };
      })
    );

    response.json(prompts);
  } catch (error) {
    next(error);
  }
});

app.get("/api/prompts/:filename", async (request, response, next) => {
  try {
    const filePath = path.join(promptsDir, request.params.filename);
    const source = await fs.readFile(filePath, "utf8");
    const firstLine = source.split("\n").find((l) => l.startsWith("# "));
    const title = firstLine ? firstLine.replace(/^#\s+/, "") : request.params.filename;

    response.json({ filename: request.params.filename, title, markdown: source });
  } catch (error) {
    if (error.code === "ENOENT") {
      response.status(404).json({ error: "Prompt not found" });
      return;
    }
    next(error);
  }
});

app.get("/api/posts", async (_request, response, next) => {
  try {
    const posts = await listPosts();
    response.json(
      posts.map(({ body, ...post }) => ({
        ...post,
        readingMinutes: Math.max(1, Math.ceil(body.split(/\s+/).length / 180))
      }))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/posts/:slug", async (request, response, next) => {
  try {
    const posts = await listPosts();
    const post = posts.find((item) => item.slug === request.params.slug);

    if (!post) {
      response.status(404).json({ error: "Post not found" });
      return;
    }

    response.json({
      ...post,
      readingMinutes: Math.max(1, Math.ceil(post.body.split(/\s+/).length / 180))
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/posts", async (request, response, next) => {
  try {
    const { title, description = "", tags = [], tickers, date, coverImage = "", body } = request.body;

    if (!title || !body) {
      response.status(400).json({ error: "title and body are required" });
      return;
    }

    const safeTags = Array.isArray(tags) ? tags.map(String).filter(Boolean) : [];
    const safeTickers = Array.isArray(tickers) ? tickers.map(String).filter(Boolean) : [];
    const slug = slugify(request.body.slug || title);
    const postDate = date || new Date().toISOString().slice(0, 10);
    const filePath = path.join(postsDir, `${slug}.md`);

    await fs.mkdir(postsDir, { recursive: true });
    await fs.writeFile(
      filePath,
      buildFrontMatter({
        title,
        slug,
        description,
        date: postDate,
        tags: safeTags,
        tickers: safeTickers,
        coverImage,
        body
      }),
      "utf8"
    );

    response.status(201).json({ slug, url: `/posts/${slug}` });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Server error" });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Knowledge Core backend listening on http://127.0.0.1:${port}`);
});
