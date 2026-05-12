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
  const fields = {
    title: post.title,
    slug: post.slug,
    description: post.description,
    date: post.date,
    tags: `[${post.tags.map((tag) => `"${tag}"`).join(", ")}]`,
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
  const slug = data.slug || fileName.replace(/\.md$/, "");

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

function signedCashFlow(activity, amount) {
  if (amount === null) return null;
  const normalized = String(activity || "").toLowerCase();
  if (normalized === "buy") return -Math.abs(amount);
  if (normalized === "sell") return Math.abs(amount);
  return amount;
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
    const amount = parseUsd(row["Amount / Cash Flow"]);
    const activity = row.Activity || "";
    const ticker = (row.Ticker || "").toUpperCase();
    const date = parseActivityDate(row.Date);
    const warnings = [];

    if (!date) warnings.push("Invalid or missing date");
    if (!ticker && activity !== "CAT Fee" && activity !== "TAF Fee") warnings.push("Missing ticker");
    if (amount === null && row.Note?.toLowerCase().includes("amount")) warnings.push(row.Note);

    return {
      id: `${date || "unknown"}-${index + 1}`,
      date,
      rawDate: row.Date || "",
      activity,
      category: classifyActivity(activity),
      ticker,
      amount,
      signedCashFlow: signedCashFlow(activity, amount),
      currency: row["Amount / Cash Flow"] ? "USD" : "",
      executedPrice: parseNumber(row["Executed Price"]),
      shares: parseNumber(row.Shares),
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
    const { title, description = "", tags = [], date, coverImage = "", body } = request.body;

    if (!title || !body) {
      response.status(400).json({ error: "title and body are required" });
      return;
    }

    const safeTags = Array.isArray(tags) ? tags.map(String).filter(Boolean) : [];
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
