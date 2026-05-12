import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ArticleNav from "../../components/ArticleNav.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { extractMarkdownHeadings } from "../../lib/markdownHeadings.js";
import MarkdownBody from "../posts/components/MarkdownBody.jsx";
import { useStock } from "./hooks.js";

const TIMELINE_TYPES = ["All", "weekly-check", "earnings-review", "valuation-update", "risk-note", "news-note", "thesis-update"];

export default function StockDetail({ ticker, navigate }) {
  const { stock, loading, error } = useStock(ticker);
  const [openNoteSlug, setOpenNoteSlug] = useState("");
  const [timelineFilter, setTimelineFilter] = useState("All");

  const filteredTimeline = useMemo(() => {
    if (!stock) return [];
    if (timelineFilter === "All") return stock.timeline;
    return stock.timeline.filter((n) => n.type === timelineFilter);
  }, [stock, timelineFilter]);

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
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/stocks")} type="button">
          <ArrowLeft className="h-4 w-4" /> All stocks
        </button>
        <StateMessage message={error || "Stock not found"} />
      </section>
    );
  }

  const headings = extractMarkdownHeadings(stock.thesisBody, `${stock.ticker}-thesis`);

  return (
    <>
      <ArticleNav headings={headings} />
      <article className="relative z-10 mx-auto max-w-4xl px-5 py-12 min-[720px]:ml-56 min-[720px]:mr-5 xl:mx-auto">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/stocks")} type="button">
          <ArrowLeft className="h-4 w-4" /> All stocks
        </button>

      <header className="border-b border-slate-200 pb-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{stock.ticker}</span>
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider bg-slate-900 text-white">{stock.status}</span>
          <span className="text-[13px] font-medium text-slate-500">{stock.conviction}</span>
        </div>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">{stock.company}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {stock.sector && <span>{stock.sector}</span>}
          {stock.theme && <span className="text-slate-400">|</span>}
          {stock.theme && <span>{stock.theme}</span>}
          <span className="text-slate-400">|</span>
          <span>Updated {stock.updated}</span>
        </div>
        {stock.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stock.labels.map((l) => (
              <span key={l} className="inline-block border border-slate-200 px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">{l}</span>
            ))}
          </div>
        )}
      </header>

      <MarkdownBody className="prose-core mt-12" markdown={stock.thesisBody || ""} slug={`${stock.ticker}-thesis`} />

      <ActivitySection activity={stock.activity} />

      <section className="mt-16">
        <h2 className="font-serif text-2xl font-normal tracking-tight text-slate-900 border-b border-slate-200 pb-4">Timeline</h2>
        {stock.timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No timeline notes yet.</p>
        ) : (
          <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {TIMELINE_TYPES.map((t) => (
              <button
                key={t}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${timelineFilter === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setTimelineFilter(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
          {filteredTimeline.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No notes match this type.</p>
          )}
          <div className="mt-6 border-l border-slate-200">
            {filteredTimeline.map((note) => {
              const isOpen = openNoteSlug === note.slug;
              return (
              <article className="relative pb-8 pl-8" key={note.slug}>
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 bg-slate-300 ring-4 ring-white" />
                <div className="flex items-center gap-2 mb-1">
                  <time className="text-[13px] font-medium text-slate-500">{note.date}</time>
                  <span className="inline-block px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-slate-200">{note.type}</span>
                  {note.action && (
                    <span className="text-[12px] font-medium text-slate-600">{note.action}</span>
                  )}
                </div>
                <button
                  className="block text-left font-serif text-lg font-normal text-slate-900 transition-colors hover:text-slate-600"
                  onClick={() => navigate(`/stocks/${stock.ticker}/${note.slug}`)}
                  type="button"
                >
                  {note.title}
                </button>
                <p className="mt-1 text-sm leading-6 text-slate-600">{note.summary}</p>
                <button
                  className="mt-3 border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setOpenNoteSlug(isOpen ? "" : note.slug)}
                  type="button"
                >
                  {isOpen ? "Hide note" : "Read note"}
                </button>
                <button
                  className="ml-2 mt-3 border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
                  onClick={() => navigate(`/stocks/${stock.ticker}/${note.slug}`)}
                  type="button"
                >
                  Open page
                </button>
                {isOpen && (
                  <MarkdownBody className="prose-core mt-5 border border-slate-200 bg-white p-5" markdown={note.body || ""} slug={`${stock.ticker}-${note.slug}`} />
                )}
              </article>
              );
            })}
          </div>
          </>
        )}
      </section>

      {stock.relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-slate-900 border-b border-slate-200 pb-4">Related Posts</h2>
          <div className="mt-6 grid gap-3">
            {stock.relatedPosts.map((post) => (
              <button
                key={post.slug}
                className="flex items-center justify-between border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:bg-slate-50/80"
                onClick={() => navigate(`/posts/${post.slug}`)}
                type="button"
              >
                <div>
                  <span className="block font-serif text-base font-normal text-slate-900">{post.title}</span>
                  <span className="mt-1 block text-[13px] text-slate-500">{post.description}</span>
                </div>
                <span className="text-[12px] font-medium text-slate-400 whitespace-nowrap ml-4">{post.date}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      </article>
    </>
  );
}

function ActivitySection({ activity }) {
  const activities = activity?.activities || [];
  const summary = activity?.summary || {};
  const recentActivities = activities.slice(0, 12);

  return (
    <section className="mt-16">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-serif text-2xl font-normal tracking-tight text-slate-900">Activity</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Portfolio actions recorded from the uploaded activity ledger.
        </p>
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No activity recorded for this ticker.</p>
      ) : (
        <>
          <dl className="mt-5 grid border border-slate-200 bg-white text-sm sm:grid-cols-2 lg:grid-cols-4">
            <ActivityMetric label="Shares" value={formatShares(summary.shares)} />
            <ActivityMetric label="Total bought" value={formatUsd(summary.totalBuyAmount)} />
            <ActivityMetric label="Average buy" value={formatUsd(summary.averageBuyPrice)} />
            <ActivityMetric label="Dividends" value={formatUsd(summary.dividends)} />
          </dl>

          <div className="mt-4 grid gap-3 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
            <span>Trades: <strong className="font-semibold text-slate-900">{summary.tradeCount || 0}</strong></span>
            <span>Tax withheld: <strong className="font-semibold text-slate-900">{formatUsd(summary.withholdingTax)}</strong></span>
            <span>Net cash flow: <strong className="font-semibold text-slate-900">{formatUsd(summary.netCashFlow)}</strong></span>
          </div>

          {summary.warnings?.length > 0 && (
            <div className="mt-4 border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Data Quality</p>
              <ul className="mt-2 grid gap-1 text-sm text-slate-600">
                {summary.warnings.slice(0, 4).map((warning) => (
                  <li key={`${warning.id}-${warning.warning}`}>{warning.date || "Unknown date"}: {warning.warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Price</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Shares</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Note</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((row) => (
                  <tr className="border-b border-slate-100" key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{row.date || row.rawDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                        {row.activity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-800">{formatUsd(row.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(row.executedPrice)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatShares(row.shares)}</td>
                    <td className="min-w-52 px-4 py-3 text-sm text-slate-500">
                      {[row.note, ...(row.warnings || [])].filter(Boolean).join(" | ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function ActivityMetric({ label, value }) {
  return (
    <div className="border-b border-slate-200 p-4 sm:border-r lg:border-b-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function formatUsd(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatShares(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6
  }).format(value);
}
