import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Terminal } from "lucide-react";
import { marked } from "marked";
import StateMessage from "../../components/StateMessage.jsx";
import { fetchPrompt } from "./api.js";

const ChartBlock = lazy(() => import("../posts/components/charts/ChartBlock.jsx"));

export default function PromptsDetail({ filename, navigate }) {
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPrompt(filename)
      .then(setPrompt)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filename]);

  const sections = useMemo(() => {
    if (!prompt?.markdown) return [];
    const chartBlock = /```chart\s*([\s\S]*?)```/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = chartBlock.exec(prompt.markdown)) !== null) {
      const before = prompt.markdown.slice(lastIndex, match.index);
      if (before.trim()) result.push({ type: "markdown", content: before });
      try {
        result.push({ type: "chart", config: JSON.parse(match[1]) });
      } catch {
        result.push({ type: "markdown", content: `\`\`\`json\n${match[1].trim()}\n\`\`\`` });
      }
      lastIndex = match.index + match[0].length;
    }
    const after = prompt.markdown.slice(lastIndex);
    if (after.trim()) result.push({ type: "markdown", content: after });
    return result.length ? result : [{ type: "markdown", content: prompt.markdown }];
  }, [prompt]);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading prompt..." />
      </section>
    );
  }

  if (error || !prompt) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error || "Prompt not found"} />
      </section>
    );
  }

  return (
    <article className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <BackButton navigate={navigate} />
      <header className="border-b border-neutral-200 pb-12">
        <div className="mb-4 inline-flex items-center gap-2 border border-neutral-200 px-3 py-1.5 text-[11px] font-medium tracking-widest text-neutral-500 uppercase">
          <Terminal className="h-3 w-3" />
          Command Prompt
        </div>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">
          {prompt.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-neutral-600">
          File: <span className="font-mono text-sm text-neutral-900">{filename}</span>
        </p>
      </header>

      <div className="prose-core mt-12">
        {sections.map((section, index) => {
          if (section.type === "chart") {
            return (
              <Suspense
                fallback={<div className="chart-shell">Loading chart...</div>}
                key={`chart-${index}`}
              >
                <ChartBlock config={section.config} />
              </Suspense>
            );
          }
          return (
            <div
              key={`md-${index}`}
              dangerouslySetInnerHTML={{ __html: marked.parse(section.content) }}
            />
          );
        })}
      </div>

      <div className="mt-12 border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-[13px] font-medium uppercase tracking-wider text-neutral-500">
          How to run this prompt
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Ask an agent:{" "}
          <span className="font-mono text-neutral-900">
            &ldquo;Run prompts/{filename}&rdquo;
          </span>
        </p>
        <p className="mt-1 text-sm leading-6 text-neutral-500">
          The agent will read this template, gather data, and POST the result to the site as a new post.
        </p>
      </div>
    </article>
  );
}

function BackButton({ navigate }) {
  return (
    <button
      className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      onClick={() => navigate("/prompts")}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" /> All prompts
    </button>
  );
}
