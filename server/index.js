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
const uploadsDir = path.join(rootDir, "public", "uploads");

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
