import { lazy, Suspense, useMemo, useState } from "react";
import { GitGraph, Grid2X2, ListTree, Search, Terminal } from "lucide-react";
import IconButton from "../../components/IconButton.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import TypewriterTitle from "../../components/TypewriterTitle.jsx";
import GridView from "./components/GridView.jsx";
import TagFilter from "./components/TagFilter.jsx";
import TimelineView from "./components/TimelineView.jsx";
import { usePosts } from "./hooks.js";

const GraphView = lazy(() => import("./components/GraphView.jsx"));

export default function PostIndex({ navigate }) {
  const { posts, loading, error } = usePosts();
  const [view, setView] = useState("grid");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const heroPhrases = [
    "Investment Maxxing",
    "Stock Maxxing",
    "ETFs Maxxing",
    "Be Stonks Everyday",
    "Portfolio Go Brrr"
  ];

  const tags = useMemo(() => {
    const tagSet = new Set(posts.flatMap((post) => post.tags));
    return ["All", ...Array.from(tagSet).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTag = activeTag === "All" || post.tags.includes(activeTag);
      const searchableText = `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase();
      return matchesTag && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeTag, posts, query]);

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-8 border-b border-neutral-200 pb-10 lg:grid-cols-[1fr_360px]">
        <div>
          <TypewriterTitle
            className="max-w-3xl font-serif text-5xl font-normal tracking-tight leading-[0.96] md:text-7xl"
            phrases={heroPhrases}
          />
          <p className="mt-6 max-w-2xl font-serif text-lg leading-8 text-neutral-700">
            A backend-first Markdown publishing system for project descriptions, diagrams,
            graph notes, images, tags, filters, timelines, and direct post links.
          </p>
        </div>
        <div className="border-l border-neutral-200 pl-8">
          <p className="text-sm leading-6 text-neutral-700">
            Posts are files in <span className="bg-neutral-100 px-1 py-0.5 font-mono text-[13px] text-neutral-800">content/posts</span>.
            The browser never writes content in this version; it reads published entries from
            the API and renders them as multiple blog views.
          </p>
          <div className="mt-6 border border-neutral-200 bg-white p-4">
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

          <div className="mt-6 border border-neutral-200 bg-white p-4">
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
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-neutral-500">
            Filter
          </span>
          <span className="flex items-center border border-neutral-200 bg-white shadow-sm transition-colors focus-within:border-neutral-400">
            <Search className="ml-3 h-4 w-4" aria-hidden="true" />
            <input
              className="w-full bg-transparent px-3 py-3 text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, description, or tag"
              value={query}
            />
          </span>
        </label>

        <div className="flex bg-neutral-100 p-1">
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

      <TagFilter activeTag={activeTag} onChange={setActiveTag} tags={tags} />

      {loading && <StateMessage message="Loading posts..." />}
      {error && <StateMessage message={error} />}
      {!loading && !error && filteredPosts.length === 0 && (
        <StateMessage message="No posts match this filter." />
      )}
      {!loading && !error && view === "grid" && (
        <GridView posts={filteredPosts} navigate={navigate} />
      )}
      {!loading && !error && view === "timeline" && (
        <TimelineView posts={filteredPosts} navigate={navigate} />
      )}
      {!loading && !error && view === "graph" && (
        <Suspense
          fallback={
            <div className="mt-8 flex h-[420px] items-center justify-center border border-neutral-200 bg-white shadow-sm">
              <p className="text-sm text-neutral-600">Loading graph...</p>
            </div>
          }
        >
          <GraphView posts={filteredPosts} navigate={navigate} />
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
