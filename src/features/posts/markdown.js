export function parseMarkdownSections(markdown) {
  const sections = [];
  const chartBlock = /```chart\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = chartBlock.exec(markdown)) !== null) {
    const markdownBefore = markdown.slice(lastIndex, match.index);
    if (markdownBefore.trim()) {
      sections.push({ type: "markdown", content: markdownBefore });
    }

    try {
      sections.push({ type: "chart", config: JSON.parse(match[1]) });
    } catch (error) {
      sections.push({
        type: "markdown",
        content: `\`\`\`json\n${match[1].trim()}\n\`\`\`\n\nChart block could not be parsed.`
      });
    }

    lastIndex = match.index + match[0].length;
  }

  const markdownAfter = markdown.slice(lastIndex);
  if (markdownAfter.trim()) {
    sections.push({ type: "markdown", content: markdownAfter });
  }

  return sections.length ? sections : [{ type: "markdown", content: markdown }];
}
