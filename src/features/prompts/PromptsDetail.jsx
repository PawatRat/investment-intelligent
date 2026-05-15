import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, FileText, GitBranch, PencilLine, Search, ShieldCheck, Terminal, Upload } from "lucide-react";
import { marked } from "marked";
import ArticleNav from "../../components/ArticleNav.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { addHeadingIds, extractMarkdownHeadings } from "../../lib/markdownHeadings.js";
import { fetchPrompt } from "./api.js";
import FileInteractionDiagram from "./components/FileInteractionDiagram.jsx";

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
  const workflow = useMemo(() => parseAgentWorkflow(prompt?.markdown || ""), [prompt]);
  const fileInteractions = useMemo(() => parseFileInteractions(prompt?.markdown || ""), [prompt]);
  const headings = useMemo(() => extractMarkdownHeadings(prompt?.markdown || "", filename), [filename, prompt]);
  const renderedSections = useMemo(() => {
    const counts = new Map();
    return sections.map((section) => {
      if (section.type === "chart") return section;
      return {
        ...section,
        html: addHeadingIds(marked.parse(section.content), filename, counts)
      };
    });
  }, [filename, sections]);

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
    <div className="relative z-10 mx-auto max-w-[90rem] px-5 py-8 lg:py-12">
      {/* Three-column layout on wide screens */}
      <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8 xl:grid-cols-[14rem_1fr_16rem] xl:gap-10">
        
        {/* Left: ArticleNav */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <ArticleNav headings={headings} />
          </div>
        </div>

        {/* Center: Content */}
        <article className="min-w-0">
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

          <FileInteractionDiagram interactions={fileInteractions} />

          <div className="mt-12">
            <div className="prose-core">
              {renderedSections.map((section, index) => {
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
                    dangerouslySetInnerHTML={{ __html: section.html }}
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
          </div>
        </article>

        {/* Right: Workflow Panel — hidden on < xl, sticky on xl */}
        {workflow && (
          <div className="mt-10 xl:mt-0">
            <div className="xl:sticky xl:top-28">
              <WorkflowPanel workflow={workflow} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseAgentWorkflow(markdown) {
  const workflowMatch = markdown.match(/## Agent Workflow\s*([\s\S]*?)(?=\n## |\n# |$)/);
  if (!workflowMatch) return null;

  const content = workflowMatch[1];
  const type = content.match(/Workflow type:\s*`([^`]+)`/)?.[1] || "";
  const chainSource = content.match(/```txt\s*([\s\S]*?)```/)?.[1] || "";
  const chain = chainSource
    .split("->")
    .map((step) => step.trim())
    .filter(Boolean);
  const depth = content.match(/Questioner depth:\s*([^\.\n]+)/)?.[1]?.trim() || "";
  const target = content.match(/Publisher target:\s*`([^`]+)`/)?.[1] || "";

  if (!type && chain.length === 0 && !depth && !target) return null;

  return { type, chain, depth, target };
}

function WorkflowPanel({ workflow }) {
  return (
    <aside className="border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
        <GitBranch className="h-3.5 w-3.5" />
        Workflow
      </div>

      <div className="mt-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
          Type
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-900">
          {workflow.type || "custom"}
        </p>
      </div>

      {workflow.depth && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            Questioner
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            {workflow.depth}
          </p>
        </div>
      )}

      {workflow.chain.length > 0 && (
        <ol className="mt-5">
          {workflow.chain.map((step, index) => (
            <WorkflowStep
              key={`${step}-${index}`}
              last={index === workflow.chain.length - 1}
              step={step}
            />
          ))}
        </ol>
      )}

      {workflow.target && (
        <div className="mt-5 border-t border-neutral-200 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            Writes To
          </p>
          <p className="mt-1 break-words font-mono text-[11px] leading-5 text-neutral-700">
            {workflow.target}
          </p>
        </div>
      )}
    </aside>
  );
}

function WorkflowStep({ last, step }) {
  const Icon = workflowIcon(step);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[13px] top-7 h-full w-px bg-neutral-200" />}
      <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center border border-neutral-200 bg-white text-neutral-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 border border-neutral-200 bg-neutral-50 px-3 py-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
          {step.replace(/-/g, " ")}
        </p>
      </div>
    </li>
  );
}

function workflowIcon(step) {
  const normalized = step.toLowerCase();
  if (normalized.includes("router")) return GitBranch;
  if (normalized.includes("questioner")) return Bot;
  if (normalized.includes("researcher")) return Search;
  if (normalized.includes("writer")) return PencilLine;
  if (normalized.includes("reviewer")) return ShieldCheck;
  if (normalized.includes("publisher")) return Upload;
  return FileText;
}

function parseFileInteractions(markdown) {
  const match = markdown.match(/## File Interactions\s*([\s\S]*?)(?=\n## |\n# |$)/);
  if (!match) return null;

  const content = match[1];
  const reads = [];
  const writes = [];
  const external = [];

  const readSection = content.match(/\*\*Reads:\*\*\s*([\s\S]*?)(?=\*\*Writes:|\*\*External:|$)/);
  const writeSection = content.match(/\*\*Writes:\*\*\s*([\s\S]*?)(?=\*\*External:|$)/);
  const externalSection = content.match(/\*\*External:\*\*\s*([\s\S]*)/);

  if (readSection) {
    const lines = readSection[1].split("\n").filter((l) => l.trim().startsWith("- "));
    for (const line of lines) {
      const text = line.trim().replace(/^- /, "");
      const parts = text.split(" — ");
      reads.push({ path: parts[0]?.trim() || text, description: parts[1]?.trim() || "" });
    }
  }

  if (writeSection) {
    const lines = writeSection[1].split("\n").filter((l) => l.trim().startsWith("- "));
    for (const line of lines) {
      const text = line.trim().replace(/^- /, "");
      const parts = text.split(" — ");
      writes.push({ path: parts[0]?.trim() || text, description: parts[1]?.trim() || "" });
    }
  }

  if (externalSection) {
    const lines = externalSection[1].split("\n").filter((l) => l.trim().startsWith("- "));
    for (const line of lines) {
      external.push(line.trim().replace(/^- /, ""));
    }
  }

  return { reads, writes, external };
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
