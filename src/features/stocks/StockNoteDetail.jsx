import { ArrowLeft } from "lucide-react";
import { marked } from "marked";
import StateMessage from "../../components/StateMessage.jsx";
import { useStockNote } from "./hooks.js";

export default function StockNoteDetail({ ticker, noteSlug, navigate }) {
  const { note, loading, error } = useStockNote(ticker, noteSlug);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading stock note..." />
      </section>
    );
  }

  if (error || !note) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <BackButton navigate={navigate} ticker={ticker} />
        <StateMessage message={error || "Stock note not found"} />
      </section>
    );
  }

  const noteHtml = marked.parse(note.body || "");

  return (
    <article className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <BackButton navigate={navigate} ticker={note.ticker || ticker} />

      <header className="border-b border-neutral-200 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {note.ticker || ticker}
          </span>
          {note.type && (
            <span className="border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {note.type}
            </span>
          )}
          {note.action && (
            <span className="bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              {note.action}
            </span>
          )}
        </div>
        <h1 className="mt-5 font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">
          {note.title}
        </h1>
        <p className="mt-4 text-[13px] font-medium text-neutral-500">{note.date}</p>
        {note.summary && (
          <p className="mt-5 text-lg leading-8 text-neutral-700">{note.summary}</p>
        )}
      </header>

      <div
        className="prose-core mt-12"
        dangerouslySetInnerHTML={{ __html: noteHtml }}
      />
    </article>
  );
}

function BackButton({ navigate, ticker }) {
  return (
    <button
      className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      onClick={() => navigate(`/stocks/${ticker}`)}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" /> Back to {ticker}
    </button>
  );
}
