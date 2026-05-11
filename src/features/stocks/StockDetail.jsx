import { ArrowLeft } from "lucide-react";
import { marked } from "marked";
import { useState } from "react";
import StateMessage from "../../components/StateMessage.jsx";
import { useStock } from "./hooks.js";

export default function StockDetail({ ticker, navigate }) {
  const { stock, loading, error } = useStock(ticker);
  const [openNoteSlug, setOpenNoteSlug] = useState("");

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading stock..." />
      </section>
    );
  }

  if (error || !stock) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900" onClick={() => navigate("/stocks")} type="button">
          <ArrowLeft className="h-4 w-4" /> All stocks
        </button>
        <StateMessage message={error || "Stock not found"} />
      </section>
    );
  }

  const thesisHtml = marked.parse(stock.thesisBody || "");

  return (
    <article className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900" onClick={() => navigate("/stocks")} type="button">
        <ArrowLeft className="h-4 w-4" /> All stocks
      </button>

      <header className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{stock.ticker}</span>
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider bg-neutral-900 text-white">{stock.status}</span>
          <span className="text-[13px] font-medium text-neutral-500">{stock.conviction}</span>
        </div>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">{stock.company}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          {stock.sector && <span>{stock.sector}</span>}
          {stock.theme && <span className="text-neutral-400">|</span>}
          {stock.theme && <span>{stock.theme}</span>}
          <span className="text-neutral-400">|</span>
          <span>Updated {stock.updated}</span>
        </div>
        {stock.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stock.labels.map((l) => (
              <span key={l} className="inline-block border border-neutral-200 px-2 py-0.5 text-[10px] font-medium tracking-wider text-neutral-500 uppercase">{l}</span>
            ))}
          </div>
        )}
      </header>

      <div className="prose-core mt-12">
        <h2>Thesis</h2>
        <div dangerouslySetInnerHTML={{ __html: thesisHtml }} />
      </div>

      {stock.timeline.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-neutral-900 border-b border-neutral-200 pb-4">Timeline</h2>
          <div className="mt-6 border-l-2 border-neutral-200">
            {stock.timeline.map((note) => {
              const isOpen = openNoteSlug === note.slug;
              const noteHtml = isOpen ? marked.parse(note.body || "") : "";
              return (
              <article className="relative pb-8 pl-8" key={note.slug}>
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 bg-neutral-300 ring-4 ring-white" />
                <div className="flex items-center gap-2 mb-1">
                  <time className="text-[13px] font-medium text-neutral-500">{note.date}</time>
                  <span className="inline-block px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border border-neutral-200">{note.type}</span>
                  {note.action && (
                    <span className="text-[12px] font-medium text-neutral-600">{note.action}</span>
                  )}
                </div>
                <button
                  className="block text-left font-serif text-lg font-normal text-neutral-900 transition-colors hover:text-neutral-600"
                  onClick={() => navigate(`/stocks/${stock.ticker}/${note.slug}`)}
                  type="button"
                >
                  {note.title}
                </button>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{note.summary}</p>
                <button
                  className="mt-3 border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  onClick={() => setOpenNoteSlug(isOpen ? "" : note.slug)}
                  type="button"
                >
                  {isOpen ? "Hide note" : "Read note"}
                </button>
                <button
                  className="ml-2 mt-3 border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-white"
                  onClick={() => navigate(`/stocks/${stock.ticker}/${note.slug}`)}
                  type="button"
                >
                  Open page
                </button>
                {isOpen && (
                  <div
                    className="prose-core mt-5 border border-neutral-200 bg-white p-5"
                    dangerouslySetInnerHTML={{ __html: noteHtml }}
                  />
                )}
              </article>
              );
            })}
          </div>
        </section>
      )}

      {stock.relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-neutral-900 border-b border-neutral-200 pb-4">Related Posts</h2>
          <div className="mt-6 grid gap-3">
            {stock.relatedPosts.map((post) => (
              <button
                key={post.slug}
                className="flex items-center justify-between border border-neutral-200 bg-white px-5 py-4 text-left transition-colors hover:bg-neutral-50/80"
                onClick={() => navigate(`/posts/${post.slug}`)}
                type="button"
              >
                <div>
                  <span className="block font-serif text-base font-normal text-neutral-900">{post.title}</span>
                  <span className="mt-1 block text-[13px] text-neutral-500">{post.description}</span>
                </div>
                <span className="text-[12px] font-medium text-neutral-400 whitespace-nowrap ml-4">{post.date}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
