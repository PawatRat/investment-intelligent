export function extractMarkdownHeadings(markdown, baseId) {
  const headings = [];
  const counts = new Map();
  let inFence = false;

  for (const line of String(markdown || "").split("\n")) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    const text = cleanHeadingText(match[2]);
    if (!text) continue;

    headings.push({
      id: createHeadingId(text, baseId, counts),
      depth,
      text
    });
  }

  return headings;
}

export function addHeadingIds(html, baseId, counts) {
  return String(html || "").replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (match, level, content) => {
    const text = cleanHeadingText(stripHtml(content));
    if (!text) return match;
    const id = createHeadingId(text, baseId, counts);
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
}

function createHeadingId(text, baseId, counts) {
  const base = `${slugify(baseId || "section")}-${slugify(text) || "heading"}`;
  const count = counts.get(base) || 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function cleanHeadingText(value) {
  return stripHtml(value)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&[a-z0-9#]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
