import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import { decodeHtml } from "../../../lib/html.js";
import { parseMarkdownSections } from "../markdown.js";

const ChartBlock = lazy(() => import("./charts/ChartBlock.jsx"));
let mermaidPromise;

export default function MarkdownBody({ markdown, slug }) {
  const sections = useMemo(() => parseMarkdownSections(markdown), [markdown]);

  return (
    <div className="prose-core mt-16">
      {sections.map((section, index) => {
        if (section.type === "chart") {
          return (
            <Suspense
              fallback={<div className="chart-shell">Loading chart...</div>}
              key={`${slug}-chart-${index}`}
            >
              <ChartBlock config={section.config} />
            </Suspense>
          );
        }

        return (
          <MarkdownSection
            html={marked.parse(section.content)}
            key={`${slug}-markdown-${index}`}
            mermaidId={`${slug}-${index}`}
          />
        );
      })}
    </div>
  );
}

function MarkdownSection({ html, mermaidId }) {
  const sectionRef = useRef(null);
  const preparedHtml = html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_match, code) => `<div class="diagram" data-mermaid>${decodeHtml(code)}</div>`
  );

  useEffect(() => {
    const blocks = sectionRef.current?.querySelectorAll("[data-mermaid]") || [];
    if (!blocks.length) return;

    blocks.forEach(async (block, index) => {
      const graphDefinition = block.textContent;
      const id = `mermaid-${mermaidId}-${index}`;
      try {
        const mermaid = await loadMermaid();
        const { svg } = await mermaid.render(id, graphDefinition);
        block.innerHTML = svg;
      } catch (error) {
        block.textContent = graphDefinition;
      }
    });
  }, [preparedHtml, mermaidId]);

  return <div ref={sectionRef} dangerouslySetInnerHTML={{ __html: preparedHtml }} />;
}

async function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          background: "#ffffff",
          primaryColor: "#ffffff",
          primaryTextColor: "#000000",
          primaryBorderColor: "#000000",
          lineColor: "#000000",
          secondaryColor: "#f5f5f5",
          tertiaryColor: "#ffffff",
          fontFamily: "system-ui, sans-serif"
        }
      });
      return mermaid;
    });
  }

  return mermaidPromise;
}
