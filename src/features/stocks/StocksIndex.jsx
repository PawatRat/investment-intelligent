import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useStocks } from "./hooks.js";

const STATUS_OPTIONS = ["All", "owned", "watchlist", "previously-owned", "sold", "archived"];
const CONVICTION_OPTIONS = ["All", "strong", "holding", "watching", "re-evaluating"];

export default function StocksIndex({ navigate }) {
  const { stocks, loading, error } = useStocks();
  const [statusFilter, setStatusFilter] = useState("All");
  const [convictionFilter, setConvictionFilter] = useState("All");
  const [labelFilter, setLabelFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filteredStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter((s) => {
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchConviction = convictionFilter === "All" || s.conviction === convictionFilter;
      const matchLabel = labelFilter === "All" || s.labels.includes(labelFilter);
      const searchable = `${s.ticker} ${s.company} ${s.theme}`.toLowerCase();
      return matchStatus && matchConviction && matchLabel && (!q || searchable.includes(q));
    });
  }, [stocks, statusFilter, convictionFilter, labelFilter, query]);

  const labels = useMemo(() => {
    const set = new Set(stocks.flatMap((s) => s.labels));
    return Array.from(set).sort();
  }, [stocks]);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading stocks..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900" onClick={() => navigate("/")} type="button">
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900" onClick={() => navigate("/")} type="button">
        <ArrowLeft className="h-4 w-4" /> Back to index
      </button>

      <header className="border-b border-neutral-200 pb-10">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">
          Stocks
        </h1>
        <p className="mt-4 font-serif text-lg leading-8 text-neutral-700">
          Portfolio cockpit. Thesis, timeline, and related research for every position.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-[5.5rem] text-[13px] font-medium text-neutral-500">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${statusFilter === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`} onClick={() => setStatusFilter(s)} type="button">
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-[5.5rem] text-[13px] font-medium text-neutral-500">Conviction</span>
          {CONVICTION_OPTIONS.map((c) => (
            <button key={c} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${convictionFilter === c ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`} onClick={() => setConvictionFilter(c)} type="button">
              {c}
            </button>
          ))}
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-[5.5rem] text-[13px] font-medium text-neutral-500">Labels</span>
            <button key="All-labels" className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${labelFilter === "All" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`} onClick={() => setLabelFilter("All")} type="button">All</button>
            {labels.map((l) => (
              <button key={l} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${labelFilter === l ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`} onClick={() => setLabelFilter(l)} type="button">
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <input
          className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ticker, company, or theme"
          value={query}
        />
      </div>

      {filteredStocks.length === 0 && (
        <StateMessage message="No stocks match this filter." />
      )}

      {filteredStocks.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Ticker</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Company</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Conviction</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Theme</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Labels</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Updated</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Latest Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => (
                <tr key={stock.ticker} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <button className="text-sm font-semibold text-neutral-900 transition-colors hover:text-neutral-600" onClick={() => navigate(`/stocks/${stock.ticker}`)} type="button">
                      {stock.ticker}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{stock.company}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider bg-neutral-900 text-white">
                      {stock.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">{stock.conviction}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{stock.theme}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {stock.labels.slice(0, 3).map((l) => (
                        <span key={l} className="inline-block px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-neutral-500 bg-neutral-50">{l}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">{stock.updated}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {stock.latestNote ? (
                      <span>{stock.latestNote.date} — {stock.latestNote.type}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
