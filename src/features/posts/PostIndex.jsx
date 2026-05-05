import { useMemo, useState } from "react";
import { Grid2X2, ListTree, Search } from "lucide-react";
import IconButton from "../../components/IconButton.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import TypewriterTitle from "../../components/TypewriterTitle.jsx";
import GridView from "./components/GridView.jsx";
import TagFilter from "./components/TagFilter.jsx";
import TimelineView from "./components/TimelineView.jsx";
import { usePosts } from "./hooks.js";

export default function PostIndex({ navigate }) {
  const { posts, loading, error } = usePosts();
  const [view, setView] = useState("grid");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const heroTitle = "Whisper words of wisdom";

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
      <div className="grid gap-8 border-b border-black pb-10 lg:grid-cols-[1fr_360px]">
        <div>
          <TypewriterTitle
            className="min-h-[9.5rem] max-w-3xl text-5xl font-semibold leading-[0.96] md:min-h-[8.75rem] md:text-7xl"
            text={heroTitle}
          />
          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-700">
            A backend-first Markdown publishing system for project descriptions, diagrams,
            graph notes, images, tags, filters, timelines, and direct post links.
          </p>
        </div>
        <div className="border-l border-black pl-6 text-sm leading-6 text-neutral-700">
          <p>
            Posts are files in <span className="font-mono text-black">content/posts</span>.
            The browser never writes content in this version; it reads published entries from
            the API and renders them as multiple blog views.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]">
            Filter
          </span>
          <span className="flex items-center border border-black bg-white">
            <Search className="ml-3 h-4 w-4" aria-hidden="true" />
            <input
              className="w-full bg-transparent px-3 py-3 text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, description, or tag"
              value={query}
            />
          </span>
        </label>

        <div className="flex border border-black bg-white">
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
    </section>
  );
}
