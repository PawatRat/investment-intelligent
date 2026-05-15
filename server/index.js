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
const portfolioCacheDir = path.join(rootDir, ".cache", "portfolio");
const quoteCacheFile = path.join(portfolioCacheDir, "quotes.json");
const historicalCacheFile = path.join(portfolioCacheDir, "historical-prices.json");
const quoteCache = new Map();
const quoteCacheTtlMs = 12 * 60 * 60 * 1000;
const historicalPriceCache = new Map();
const historicalPriceCacheTtlMs = 12 * 60 * 60 * 1000;
const HISTORICAL_REQUEST_DELAY_MS = 250;
const marketDataHeaders = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  "Accept": "application/json,text/csv,text/plain,*/*"
};
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

async function scanAllMarkdown() {
  const items = [];

  // Scan posts
  await fs.mkdir(postsDir, { recursive: true });
  const postFiles = await fs.readdir(postsDir);
  for (const file of postFiles.filter((f) => f.endsWith(".md"))) {
    const source = await fs.readFile(path.join(postsDir, file), "utf8");
    const { data } = parseFrontMatter(source);
    const slug = data.slug?.trim() || file.replace(/\.md$/, "");
    items.push({
      path: `content/posts/${file}`,
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      tickers: Array.isArray(data.tickers) ? data.tickers : [],
      type: "post",
      kind: "Post"
    });
  }

  // Scan stocks
  await fs.mkdir(stocksDir, { recursive: true });
  const stockEntries = await fs.readdir(stocksDir, { withFileTypes: true });
  const stockDirs = stockEntries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const ticker of stockDirs) {
    const dir = path.join(stocksDir, ticker);
    const files = await fs.readdir(dir);
    for (const file of files.filter((f) => f.endsWith(".md"))) {
      const source = await fs.readFile(path.join(dir, file), "utf8");
      const { data } = parseFrontMatter(source);
      const isThesis = file === "thesis.md";
      items.push({
        path: `content/stocks/${ticker}/${file}`,
        slug: file.replace(/\.md$/, ""),
        title: isThesis
          ? `${data.company || ticker} Thesis`
          : (data.title || file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "")),
        description: data.summary || data.theme || "",
        date: data.date || data.updated || "",
        tags: Array.isArray(data.labels) ? data.labels : [],
        tickers: [data.ticker || ticker],
        type: "stock",
        kind: isThesis ? "Thesis" : (data.type || "Note"),
        ticker,
        status: data.status || "",
        conviction: data.conviction || ""
      });
    }
  }

  return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

async function listPromptFiles(directory = promptsDir, prefix = "") {
  await fs.mkdir(directory, { recursive: true });
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          return listPromptFiles(fullPath, relativePath);
        }

        if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") {
          return [];
        }

        return [relativePath];
      })
  );

  return files.flat();
}

function resolvePromptPath(filename) {
  const normalizedFilename = path.normalize(String(filename || "")).replace(/^(\.\.(\/|\\|$))+/, "");
  const resolvedPath = path.resolve(promptsDir, normalizedFilename);
  const promptsRoot = path.resolve(promptsDir);

  if (!resolvedPath.startsWith(`${promptsRoot}${path.sep}`) || !normalizedFilename.endsWith(".md")) {
    const error = new Error("Prompt not found");
    error.code = "ENOENT";
    throw error;
  }

  return { filename: normalizedFilename.split(path.sep).join("/"), filePath: resolvedPath };
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

async function readJsonFile(filePath, fallback) {
  try {
    const source = await fs.readFile(filePath, "utf8");
    return JSON.parse(source);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hydrateQuoteCache(source) {
  for (const [ticker, entry] of Object.entries(source || {})) {
    if (!entry?.quote) continue;
    quoteCache.set(ticker, entry);
  }
}

async function readPersistentQuoteCache() {
  const source = await readJsonFile(quoteCacheFile, {});
  hydrateQuoteCache(source);
  return source;
}

async function persistQuoteCache() {
  await writeJsonFile(quoteCacheFile, Object.fromEntries(quoteCache));
}

function mapToRows(priceMap) {
  return [...priceMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, price]) => ({ date, price }));
}

function rowsToPriceMap(rows) {
  return new Map((rows || [])
    .filter((row) => row?.date && Number.isFinite(row.price))
    .map((row) => [row.date, row.price]));
}

function benchmarkCacheFile(benchmarkTicker) {
  return path.join(portfolioCacheDir, `benchmark-${benchmarkTicker.toUpperCase().replace(/[^A-Z0-9.-]/g, "")}.json`);
}

async function readPersistentHistoricalCache() {
  return readJsonFile(historicalCacheFile, {});
}

async function persistHistoricalCache(source) {
  await writeJsonFile(historicalCacheFile, source);
}

async function readBenchmarkSeriesCache(benchmarkTicker) {
  return readJsonFile(benchmarkCacheFile(benchmarkTicker), null);
}

async function persistBenchmarkSeriesCache(benchmarkTicker, data) {
  await writeJsonFile(benchmarkCacheFile(benchmarkTicker), {
    savedAt: new Date().toISOString(),
    ...data
  });
}

async function fetchYahooQuote(ticker) {
  const normalizedTicker = ticker.toUpperCase();
  const cached = quoteCache.get(normalizedTicker);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < quoteCacheTtlMs) {
    return cached.quote;
  }

  const persistentCache = await readPersistentQuoteCache();
  const persistentEntry = persistentCache[normalizedTicker];
  if (persistentEntry?.quote && now - persistentEntry.fetchedAt < quoteCacheTtlMs) {
    quoteCache.set(normalizedTicker, persistentEntry);
    return persistentEntry.quote;
  }

  const quote = {
    ticker: normalizedTicker,
    price: null,
    currency: "USD",
    marketTime: "",
    source: "yahoo-chart",
    error: ""
  };

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?range=1d&interval=1d`, {
      headers: marketDataHeaders
    });
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
    quote.source = "yahoo-chart";
  } catch (error) {
    const yahooError = error.message || "Unable to load Yahoo quote";
    const fallbackQuote = await fetchStooqQuote(normalizedTicker);
    if (Number.isFinite(fallbackQuote.price)) {
      quote.price = fallbackQuote.price;
      quote.currency = fallbackQuote.currency;
      quote.marketTime = fallbackQuote.marketTime;
      quote.source = fallbackQuote.source;
      quote.error = "";
    } else {
      const staleQuote = cached?.quote || persistentEntry?.quote;
      if (Number.isFinite(staleQuote?.price)) {
        quote.price = staleQuote.price;
        quote.currency = staleQuote.currency || "USD";
        quote.marketTime = staleQuote.marketTime || "";
        quote.source = "stale-cache";
        quote.error = "";
      } else {
        quote.error = fallbackQuote.error
          ? `${yahooError}; Stooq fallback failed: ${fallbackQuote.error}`
          : yahooError;
      }
    }
  }

  quoteCache.set(normalizedTicker, { fetchedAt: now, quote });
  if (Number.isFinite(quote.price)) {
    await persistQuoteCache();
  }
  return quote;
}

async function fetchStooqQuote(ticker) {
  const normalizedTicker = ticker.toUpperCase();
  const symbol = `${normalizedTicker.toLowerCase()}.us`;
  const quote = {
    ticker: normalizedTicker,
    price: null,
    currency: "USD",
    marketTime: "",
    source: "stooq-latest",
    error: ""
  };

  try {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
    const response = await fetch(url, { headers: marketDataHeaders });
    if (!response.ok) {
      throw new Error(`Stooq quote request failed with ${response.status}`);
    }

    const csv = await response.text();
    const [headerLine, valueLine] = csv.trim().split(/\r?\n/);
    if (!headerLine || !valueLine) {
      throw new Error("No Stooq quote returned");
    }

    const headers = parseCsvLine(headerLine);
    const values = parseCsvLine(valueLine);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    const close = parseNumber(row.Close);
    if (!Number.isFinite(close) || close <= 0) {
      throw new Error("Missing Stooq close price");
    }

    quote.price = roundNumber(close, 4);
    quote.marketTime = row.Date
      ? new Date(`${row.Date}T${row.Time || "00:00:00"}Z`).toISOString()
      : new Date().toISOString();
  } catch (error) {
    quote.error = error.message || "Unable to load Stooq quote";
  }

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
    source: "yahoo-chart",
    error: ""
  };

  const persistentCache = await readPersistentHistoricalCache();
  const tickerCache = persistentCache[normalizedTicker] || { rows: [] };
  const cachedRows = (tickerCache.rows || [])
    .filter((row) => row.date >= startDate && row.date <= endDate && Number.isFinite(row.price))
    .sort((a, b) => a.date.localeCompare(b.date));

  try {
    const allRows = [...cachedRows];
    const earliestCachedDate = cachedRows[0]?.date || "";
    const latestCachedDate = cachedRows.at(-1)?.date || "";
    const ranges = [];

    if (!cachedRows.length) {
      ranges.push([startDate, endDate]);
    } else {
      if (startDate < earliestCachedDate) {
        ranges.push([startDate, addDays(earliestCachedDate, -1)]);
      }
      if (latestCachedDate < endDate) {
        ranges.push([addDays(latestCachedDate, 1), endDate]);
      }
    }

    for (const [rangeStart, rangeEnd] of ranges) {
      if (rangeStart > rangeEnd) continue;
      const rangeRows = await fetchYahooHistoricalPriceRange(normalizedTicker, rangeStart, rangeEnd);
      allRows.push(...rangeRows);
    }

    const mergedRows = mapToRows(rowsToPriceMap(allRows));
    result.prices = rowsToPriceMap(mergedRows.filter((row) => row.date >= startDate && row.date <= endDate));
    result.dates = [...result.prices.keys()].sort();

    if (result.dates.length === 0) {
      throw new Error("No historical prices returned");
    }

    persistentCache[normalizedTicker] = {
      updatedAt: new Date(now).toISOString(),
      rows: mergedRows
    };
    await persistHistoricalCache(persistentCache);
  } catch (error) {
    const yahooError = error.message || "Unable to load historical prices";
    if (cachedRows.length > 0) {
      result.prices = rowsToPriceMap(cachedRows);
      result.dates = [...result.prices.keys()].sort();
      result.source = "historical-cache";
      result.error = `${yahooError}; using stored historical cache`;
    } else {
      try {
        const fallbackRows = await fetchPocketPortfolioHistoricalPrices(normalizedTicker, startDate, endDate);
        result.prices = rowsToPriceMap(fallbackRows);
        result.dates = [...result.prices.keys()].sort();
        result.source = "pocketportfolio-monthly";
        result.error = `Yahoo failed (${yahooError}); using PocketPortfolio monthly fallback`;

        persistentCache[normalizedTicker] = {
          updatedAt: new Date(now).toISOString(),
          source: result.source,
          rows: mapToRows(result.prices)
        };
        await persistHistoricalCache(persistentCache);
      } catch (fallbackError) {
        result.error = `${yahooError}; PocketPortfolio fallback failed: ${fallbackError.message || "Unable to load fallback prices"}`;
      }
    }
  }

  historicalPriceCache.set(cacheKey, { fetchedAt: now, result });
  return result;
}

async function fetchPocketPortfolioHistoricalPrices(ticker, startDate, endDate) {
  const url = `https://www.pocketportfolio.app/api/tickers/${encodeURIComponent(ticker)}/json?range=max`;
  const response = await fetch(url, { headers: marketDataHeaders });
  if (!response.ok) {
    throw new Error(`PocketPortfolio request failed with ${response.status}`);
  }

  const payload = await response.json();
  const rows = (payload?.data || [])
    .map((row) => ({
      date: String(row.date || ""),
      price: Number(row.close)
    }))
    .filter((row) => row.date >= startDate && row.date <= endDate && Number.isFinite(row.price) && row.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (rows.length === 0) {
    throw new Error("No PocketPortfolio prices returned");
  }

  return rows;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchYahooHistoricalPriceRange(ticker, startDate, endDate) {
  const period1 = toUnixSeconds(startDate);
  const period2 = toUnixSeconds(addDays(endDate, 1));
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d&events=history%7Cdiv%7Csplit`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await delay((attempt + 1) * 1000);
    }
    try {
      const response = await fetch(url, { headers: marketDataHeaders });
      if (!response.ok) {
        if (response.status === 429 && attempt < 2) continue;
        throw new Error(`Historical price request failed with ${response.status}`);
      }

      const payload = await response.json();
      const chartResult = payload?.chart?.result?.[0];
      const timestamps = chartResult?.timestamp || [];
      const quote = chartResult?.indicators?.quote?.[0] || {};
      const adjClose = chartResult?.indicators?.adjclose?.[0]?.adjclose || [];
      const close = quote.close || [];
      const rows = [];

      for (let index = 0; index < timestamps.length; index += 1) {
        const price = Number.isFinite(adjClose[index]) ? adjClose[index] : close[index];
        if (!Number.isFinite(price) || price <= 0) continue;

        rows.push({
          date: new Date(timestamps[index] * 1000).toISOString().slice(0, 10),
          price
        });
      }

      if (rows.length === 0) {
        throw new Error("No historical prices returned");
      }

      return rows;
    } catch (error) {
      lastError = error.message || "Historical price request failed";
    }
  }

  throw new Error(lastError || "Historical price request failed after retries");
}

function getPriceOnOrBefore(priceMap, date, previousPrice) {
  const exactPrice = priceMap.get(date);
  if (Number.isFinite(exactPrice)) return exactPrice;

  let latestPrice = null;
  for (const [priceDate, price] of priceMap.entries()) {
    if (priceDate > date) break;
    if (Number.isFinite(price)) latestPrice = price;
  }
  if (Number.isFinite(latestPrice)) return latestPrice;

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
  const historicalResults = [];
  for (const ticker of allTickers) {
    if (historicalResults.length > 0) {
      await delay(HISTORICAL_REQUEST_DELAY_MS);
    }
    historicalResults.push(await fetchYahooHistoricalPrices(ticker, startDate, endDate));
  }
  const historicalByTicker = Object.fromEntries(historicalResults.map((result) => [result.ticker, result]));
  const benchmarkHistory = historicalByTicker[benchmarkTicker.toUpperCase()];
  const benchmarkDates = benchmarkHistory?.dates || [];

  if (!benchmarkDates.length) {
    const storedBenchmark = await readBenchmarkSeriesCache(benchmarkTicker);
    if (storedBenchmark?.series?.length) {
      return {
        ...storedBenchmark,
        asOf: new Date().toISOString(),
        source: `${storedBenchmark.source || "yahoo-chart"} + stored benchmark cache`,
        dataQuality: {
          ...(storedBenchmark.dataQuality || {}),
          warnings: [
            ...(storedBenchmark.dataQuality?.warnings || []),
            { ticker: benchmarkTicker.toUpperCase(), warning: benchmarkHistory?.error || "Benchmark prices unavailable" }
          ],
          unpricedTickers: [...new Set([...(storedBenchmark.dataQuality?.unpricedTickers || []), benchmarkTicker.toUpperCase()])].sort()
        }
      };
    }

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
  const unpricedTickers = new Set(
    historicalResults
      .filter((result) => result.error && !result.dates.length)
      .map((result) => result.ticker)
  );

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

  const benchmarkResult = {
    benchmark: benchmarkTicker.toUpperCase(),
    asOf: new Date().toISOString(),
    source: buildBenchmarkSourceLabel(historicalResults),
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

  if (series.length > 0) {
    await persistBenchmarkSeriesCache(benchmarkTicker, benchmarkResult);
  }

  return benchmarkResult;
}

function buildBenchmarkSourceLabel(historicalResults) {
  const sources = historicalResults.map((result) => result.source).filter(Boolean);
  if (sources.some((source) => source.includes("pocketportfolio-monthly"))) {
    return "yahoo-chart + pocketportfolio-monthly fallback";
  }
  if (sources.some((source) => source.includes("historical-cache") || source.includes("historical cache"))) {
    return "yahoo-chart + historical cache";
  }
  return "yahoo-chart";
}

async function buildPortfolioDcaBenchmark(benchmarkTicker = "SPY") {
  const cashflowBenchmark = await buildPortfolioBenchmark(benchmarkTicker);
  const actualSeries = cashflowBenchmark.series || [];
  const actualSummary = cashflowBenchmark.summary;

  if (!actualSeries.length || !actualSummary?.netInvested) {
    return {
      benchmark: benchmarkTicker.toUpperCase(),
      asOf: new Date().toISOString(),
      source: cashflowBenchmark.source || "yahoo-chart",
      strategy: "monthly-equal-dca",
      contributionAmount: 0,
      contributionCount: 0,
      series: [],
      summary: null,
      dataQuality: cashflowBenchmark.dataQuality || { warnings: [], unpricedTickers: [] }
    };
  }

  const startDate = actualSeries[0].date;
  const endDate = actualSeries.at(-1).date;
  const benchmarkHistory = await fetchYahooHistoricalPrices(benchmarkTicker, startDate, endDate);
  const benchmarkDates = (benchmarkHistory.dates || []).filter((date) => date >= startDate && date <= endDate);
  const dcaDates = firstBenchmarkDateByMonth(benchmarkDates);

  if (!dcaDates.length) {
    return {
      benchmark: benchmarkTicker.toUpperCase(),
      asOf: new Date().toISOString(),
      source: benchmarkHistory.source || cashflowBenchmark.source || "yahoo-chart",
      strategy: "monthly-equal-dca",
      contributionAmount: 0,
      contributionCount: 0,
      series: [],
      summary: null,
      dataQuality: {
        warnings: [
          ...(cashflowBenchmark.dataQuality?.warnings || []),
          { ticker: benchmarkTicker.toUpperCase(), warning: benchmarkHistory.error || "No DCA benchmark dates available" }
        ],
        unpricedTickers: [benchmarkTicker.toUpperCase()]
      }
    };
  }

  const actualByDate = new Map(actualSeries.map((row) => [row.date, row]));
  const contributionAmount = actualSummary.netInvested / dcaDates.length;
  let benchmarkShares = 0;
  let contributed = 0;
  let previousActual = null;

  const series = [];
  for (const date of benchmarkDates) {
    const actual = actualByDate.get(date) || previousActual;
    if (actualByDate.has(date)) previousActual = actualByDate.get(date);
    if (!actual) continue;

    const benchmarkPrice = getPriceOnOrBefore(benchmarkHistory.prices, date, null);
    if (!Number.isFinite(benchmarkPrice)) continue;

    if (dcaDates.includes(date)) {
      benchmarkShares += contributionAmount / benchmarkPrice;
      contributed += contributionAmount;
    }

    if (contributed <= 0) continue;

    const dcaValue = benchmarkShares * benchmarkPrice;
    const dcaReturnPct = ((dcaValue - contributed) / contributed) * 100;

    series.push({
      date,
      portfolioValue: actual.portfolioValue,
      dcaValue: roundNumber(dcaValue, 2),
      contributed: roundNumber(contributed, 2),
      portfolioReturnPct: actual.portfolioReturnPct,
      dcaReturnPct: roundNumber(dcaReturnPct, 2),
      alphaPct: roundNumber(actual.portfolioReturnPct - dcaReturnPct, 2)
    });
  }

  const latest = series.at(-1) || null;
  const warnings = [
    ...(cashflowBenchmark.dataQuality?.warnings || []),
    ...(benchmarkHistory.error ? [{ ticker: benchmarkTicker.toUpperCase(), warning: benchmarkHistory.error }] : [])
  ];

  return {
    benchmark: benchmarkTicker.toUpperCase(),
    asOf: new Date().toISOString(),
    source: buildBenchmarkSourceLabel([{ source: cashflowBenchmark.source }, benchmarkHistory]),
    strategy: "monthly-equal-dca",
    contributionAmount: roundNumber(contributionAmount, 2),
    contributionCount: dcaDates.length,
    startDate,
    endDate,
    series,
    summary: latest ? {
      portfolioValue: latest.portfolioValue,
      dcaValue: latest.dcaValue,
      contributed: latest.contributed,
      portfolioReturnPct: latest.portfolioReturnPct,
      dcaReturnPct: latest.dcaReturnPct,
      alphaPct: latest.alphaPct,
      valueGap: roundNumber(latest.portfolioValue - latest.dcaValue, 2)
    } : null,
    dataQuality: {
      warnings,
      unpricedTickers: benchmarkHistory.dates?.length ? [] : [benchmarkTicker.toUpperCase()]
    }
  };
}

function firstBenchmarkDateByMonth(dates) {
  const months = new Set();
  const result = [];

  for (const date of dates) {
    const monthKey = date.slice(0, 7);
    if (months.has(monthKey)) continue;
    months.add(monthKey);
    result.push(date);
  }

  return result;
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
        source: "none",
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
    source: buildQuoteSourceLabel(Object.values(quotes)),
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

function buildQuoteSourceLabel(quotes) {
  const sources = new Set(quotes.map((quote) => quote?.source).filter(Boolean));
  if (sources.has("stooq-latest")) {
    return "yahoo-chart + stooq-latest fallback";
  }
  if (sources.has("stale-cache")) {
    return "yahoo-chart + stale quote cache";
  }
  return "yahoo-chart";
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
          } : null,
          timeline: timeline.map((note) => ({
            slug: note.slug,
            type: note.type,
            date: note.date,
            title: note.title
          }))
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

app.get("/api/portfolio/dca-benchmark", async (request, response, next) => {
  try {
    const benchmark = String(request.query.benchmark || "SPY").toUpperCase().replace(/[^A-Z0-9.^-]/g, "");
    const data = await buildPortfolioDcaBenchmark(benchmark || "SPY");
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
    const mdFiles = await listPromptFiles();

    const prompts = await Promise.all(
      mdFiles.map(async (filename) => {
        const { filePath } = resolvePromptPath(filename);
        const source = await fs.readFile(filePath, "utf8");
        const firstLine = source.split("\n").find((l) => l.startsWith("# "));
        const purposeLine = source.split("\n").find((l) => l.includes("**Purpose:**"));
        const title = firstLine ? firstLine.replace(/^#\s+/, "") : filename.replace(".md", "");
        const purpose = purposeLine ? purposeLine.replace(/\*\*Purpose:\*\*\s*/, "") : "";
        const group = filename.includes("/") ? filename.split("/")[0] : "general";
        return { filename, title, purpose, group };
      })
    );

    response.json(prompts);
  } catch (error) {
    next(error);
  }
});

app.get("/api/prompts/*", async (request, response, next) => {
  try {
    const { filename, filePath } = resolvePromptPath(request.params[0]);
    const source = await fs.readFile(filePath, "utf8");
    const firstLine = source.split("\n").find((l) => l.startsWith("# "));
    const title = firstLine ? firstLine.replace(/^#\s+/, "") : filename;

    response.json({ filename, title, markdown: source });
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

app.get("/api/content", async (_request, response, next) => {
  try {
    const items = await scanAllMarkdown();
    response.json(items);
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
  console.log(`Investment Intelligent backend listening on http://127.0.0.1:${port}`);
});
