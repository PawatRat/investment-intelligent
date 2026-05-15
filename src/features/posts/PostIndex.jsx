import { lazy, Suspense, useMemo, useState } from "react";
import { GitGraph, Grid2X2, ListTree, Search, Terminal } from "lucide-react";
import IconButton from "../../components/IconButton.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import TypewriterTitle from "../../components/TypewriterTitle.jsx";
import GridView from "./components/GridView.jsx";
import TagFilter from "./components/TagFilter.jsx";
import TimelineView from "./components/TimelineView.jsx";
import { useContent } from "./hooks.js";

const GraphView = lazy(() => import("./components/GraphView.jsx"));

export default function PostIndex({ navigate }) {
  const { items, loading, error } = useContent();
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const heroPhrases = [
    "Investment Maxxing",
    "Stock Maxxing",
    "ETFs Maxxing",
    "Be Stonks Everyday",
    "Portfolio Go Brrr"
  ];

  const tags = useMemo(() => {
    const tagSet = new Set(items.flatMap((item) => item.tags));
    return ["All", ...Array.from(tagSet).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTag = activeTag === "All" || item.tags.includes(activeTag);
      const matchesType = activeType === "All" || item.type === activeType;
      const searchableText = `${item.title} ${item.description} ${item.tags.join(" ")} ${item.path} ${item.kind}`.toLowerCase();
      return matchesTag && matchesType && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeTag, activeType, items, query]);

  const postItems = useMemo(() => filteredItems.filter((i) => i.type === "post"), [filteredItems]);

  function handleItemClick(item) {
    if (item.type === "post") {
      navigate(`/posts/${item.slug}`);
    } else if (item.type === "stock") {
      if (item.kind === "Thesis") {
        navigate(`/stocks/${item.ticker}`);
      } else {
        navigate(`/stocks/${item.ticker}/${item.slug}`);
      }
    }
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-8">
      <div className="border-b border-neutral-200 pb-8">
        <TypewriterTitle
          className="max-w-3xl font-serif text-4xl font-normal tracking-tight leading-[1.1] md:text-5xl"
          phrases={heroPhrases}
        />
        <p className="mt-3 max-w-2xl font-serif text-base leading-7 text-neutral-700">
          A backend-first Markdown publishing system for project descriptions, diagrams,
          graph notes, images, tags, filters, timelines, and direct post links.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <GitGraph className="h-3.5 w-3.5" />
            Knowledge Graph
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Explore how posts, stocks, and timeline notes connect across the entire project.
          </p>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-neutral-200 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            onClick={() => navigate("/graph")}
            type="button"
          >
            <GitGraph className="h-4 w-4" />
            Open graph view
          </button>
        </div>

        <div className="border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <Terminal className="h-3.5 w-3.5" />
            Prompt Commands
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Type any of these to trigger an agent to research and publish.
          </p>
          <div className="mt-3 space-y-2">
            <CommandExample text="Run stock-report.md for AAPL" />
            <CommandExample text="Update MSFT thesis" />
            <CommandExample text="Weekly check on META" />
            <CommandExample text="Run growth-scanner.md for semiconductors" />
            <CommandExample text="Run portfolio-check.md" />
          </div>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-neutral-200 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            onClick={() => navigate("/prompts")}
            type="button"
          >
            <Terminal className="h-4 w-4" />
            Browse all prompts
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-neutral-500">
            Filter
          </span>
          <span className="flex items-center border border-neutral-200 bg-white shadow-sm transition-colors focus-within:border-neutral-400">
            <Search className="ml-3 h-4 w-4" aria-hidden="true" />
            <input
              className="w-full bg-transparent px-3 py-3 text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, path, tag, or type"
              value={query}
            />
          </span>
        </label>

        <div className="flex bg-neutral-100 p-1">
          <IconButton active={view === "list"} label="List view" onClick={() => setView("list")}>
            <ListTree className="h-4 w-4" />
          </IconButton>
          <IconButton active={view === "grid"} label="Grid view" onClick={() => setView("grid")}>
            <Grid2X2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            active={view === "timeline"}
            label="Timeline view"
            onClick={() => setView("timeline")}
          >
            <ListTree className="h-4 w-4" />
          </IconButton>
          <IconButton
            active={view === "graph"}
            label="Graph view"
            onClick={() => setView("graph")}
          >
            <GitGraph className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-medium text-neutral-500">Type</span>
        {["All", "post", "stock"].map((type) => (
          <button
            key={type}
            className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
              activeType === type ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
            onClick={() => setActiveType(type)}
            type="button"
          >
            {type === "All" ? "All" : type === "post" ? "Posts" : "Stocks"}
          </button>
        ))}
      </div>

      <TagFilter activeTag={activeTag} onChange={setActiveTag} tags={tags} />

      {loading && <StateMessage message="Loading content..." />}
      {error && <StateMessage message={error} />}
      {!loading && !error && filteredItems.length === 0 && (
        <StateMessage message="No content matches this filter." />
      )}

      {!loading && !error && view === "list" && (
        <div className="mt-6 overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Title</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Path</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Type</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.path}
                  className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-neutral-900">{item.title}</span>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{item.path}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      item.type === "post"
                        ? "bg-neutral-900 text-white"
                        : item.kind === "Thesis"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {item.kind}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-500">{item.date || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-block bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-neutral-500">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && view === "grid" && (
        <GridView posts={postItems} navigate={navigate} />
      )}
      {!loading && !error && view === "timeline" && (
        <TimelineView posts={postItems} navigate={navigate} />
      )}
      {!loading && !error && view === "graph" && (
        <Suspense
          fallback={
            <div className="mt-8 flex h-[420px] items-center justify-center border border-neutral-200 bg-white shadow-sm">
              <p className="text-sm text-neutral-600">Loading graph...</p>
            </div>
          }
        >
          <GraphView posts={postItems} navigate={navigate} />
        </Suspense>
      )}
    </section>
  );
}

function CommandExample({ text }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-neutral-400" />
      <span className="font-mono text-[12px] leading-5 text-neutral-700">{text}</span>
    </div>
  );
}
