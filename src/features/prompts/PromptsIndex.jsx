import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, FileInput, FileOutput, FileText, GitBranch, Globe } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { fetchPrompts } from "./api.js";

export default function PromptsIndex({ navigate }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("all");
  const agentPrompts = prompts.filter((prompt) => prompt.group === "agents");
  const commandPrompts = prompts.filter((prompt) => prompt.group !== "agents");
  const groupedPrompts = useMemo(() => {
    const visiblePrompts = prompts.filter((prompt) => {
      if (view === "agents") return prompt.group === "agents";
      if (view === "commands") return prompt.group !== "agents";
      return true;
    });

    return visiblePrompts.reduce((groups, prompt) => {
      const group = prompt.group || "general";
      return {
        ...groups,
        [group]: [...(groups[group] || []), prompt]
      };
    }, {});
  }, [prompts, view]);

  useEffect(() => {
    fetchPrompts()
      .then(setPrompts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading prompts..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <button
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          onClick={() => navigate("/")}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <button
        className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" /> Back to index
      </button>

      <header className="border-b border-neutral-200 pb-12">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">
          Prompts
        </h1>
        <p className="mt-5 font-serif text-lg leading-8 text-neutral-700">
          Reusable agent command templates. Each prompt is a recipe — an agent reads it, gathers real data, and publishes the result as a post.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <PromptViewButton
            active={view === "all"}
            count={prompts.length}
            icon={GitBranch}
            label="All"
            onClick={() => setView("all")}
          />
          <PromptViewButton
            active={view === "commands"}
            count={commandPrompts.length}
            icon={FileText}
            label="Commands"
            onClick={() => setView("commands")}
          />
          <PromptViewButton
            active={view === "agents"}
            count={agentPrompts.length}
            icon={Bot}
            label="Agents"
            onClick={() => setView("agents")}
          />
        </div>
      </header>

      {prompts.length === 0 && (
        <StateMessage message="No prompts available." />
      )}

      <div className="mt-8 space-y-10">
        {Object.entries(groupedPrompts).map(([group, groupPrompts]) => (
          <section key={group}>
            <SectionHeader group={group} count={groupPrompts.length} />
            <div className="grid gap-4 md:grid-cols-2">
              {groupPrompts.map((prompt) => (
                <article
                  className="group flex min-h-[200px] flex-col border border-neutral-200 bg-white p-6 transition-colors duration-300 hover:bg-neutral-50/80"
                  key={prompt.filename}
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
                    {prompt.group === "agents" ? <Bot className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {prompt.group === "agents" ? "Agent Prompt" : "Command Prompt"}
                  </div>
                  <button
                    className="mt-4 block text-left font-serif text-xl font-normal tracking-tight leading-tight text-neutral-900 transition-colors hover:text-neutral-600"
                    onClick={() => navigate(`/prompts/${prompt.filename}`)}
                    type="button"
                  >
                    {prompt.title}
                  </button>
                  <p className="mt-3 flex-1 font-serif text-sm leading-6 text-neutral-600">
                    {prompt.purpose}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <p className="font-mono text-[11px] text-neutral-400">
                      prompts/{prompt.filename}
                    </p>
                    {(prompt.readsCount > 0 || prompt.writesCount > 0 || prompt.externalCount > 0) && (
                      <div className="flex items-center gap-2">
                        {prompt.readsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500" title="Files read">
                            <FileInput className="h-3 w-3" />
                            {prompt.readsCount}
                          </span>
                        )}
                        {prompt.writesCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500" title="Files written">
                            <FileOutput className="h-3 w-3" />
                            {prompt.writesCount}
                          </span>
                        )}
                        {prompt.externalCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500" title="External sources">
                            <Globe className="h-3 w-3" />
                            {prompt.externalCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function PromptViewButton({ active, count, icon: Icon, label, onClick }) {
  return (
    <button
      className={[
        "border px-4 py-3 text-left transition-colors",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className={active ? "font-mono text-[12px] text-neutral-300" : "font-mono text-[12px] text-neutral-400"}>
          {count}
        </span>
      </span>
    </button>
  );
}

function SectionHeader({ group, count }) {
  const isAgents = group === "agents";

  return (
    <div className="mb-4 border-b border-neutral-200 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest text-neutral-500">
          {isAgents ? <Bot className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          {isAgents ? "Agent Files" : "Command Prompts"}
        </div>
        <span className="font-mono text-[11px] text-neutral-400">{count} files</span>
      </div>
      {isAgents && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Agent files define the workflow roles: routing, questioning, research, writing, review, and publishing. They are not output templates; they control how command prompts get executed.
        </p>
      )}
    </div>
  );
}
