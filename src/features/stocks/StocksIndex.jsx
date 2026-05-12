import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useActivities, useStocks } from "./hooks.js";

const STATUS_OPTIONS = ["All", "owned", "watchlist", "previously-owned", "sold", "archived"];
const CONVICTION_OPTIONS = ["All", "strong", "holding", "watching", "re-evaluating"];

export default function StocksIndex({ navigate }) {
  const { stocks, loading, error } = useStocks();
  const { activityData, loading: activityLoading, error: activityError } = useActivities();
  const [statusFilter, setStatusFilter] = useState("All");
  const [convictionFilter, setConvictionFilter] = useState("All");
  const [labelFilter, setLabelFilter] = useState("All");
  const [query, setQuery] = useState("");
  const activitySummaries = activityData?.summaries || {};
  const dataQuality = activityData?.dataQuality || { untrackedTickers: [], warnings: [] };
  const untrackedTickers = dataQuality.untrackedTickers || [];
  const qualityWarnings = dataQuality.warnings || [];

  const filteredStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter((s) => {
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchConviction = convictionFilter === "All" || s.conviction === convictionFilter;
      const matchLabel = labelFilter === "All" || s.labels.includes(labelFilter);
      const searchable = [
        s.ticker,
        s.company,
        s.theme,
        s.sector,
        s.status,
        s.conviction,
        ...s.labels
      ].join(" ").toLowerCase();
      return matchStatus && matchConviction && matchLabel && (!q || searchable.includes(q));
    });
  }, [stocks, statusFilter, convictionFilter, labelFilter, query]);

  const labels = useMemo(() => {
    const set = new Set(stocks.flatMap((s) => s.labels));
    return Array.from(set).sort();
  }, [stocks]);

  const portfolioStats = useMemo(() => {
    const trackedTickers = new Set(stocks.map((stock) => stock.ticker));
    const trackedActivityCount = stocks.reduce((total, stock) => {
      return total + (activitySummaries[stock.ticker]?.activityCount || 0);
    }, 0);
    const latestActivity = Object.values(activitySummaries)
      .map((summary) => summary.latestActivity)
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return {
      trackedActivityCount,
      trackedTickers: trackedTickers.size,
      untrackedCount: untrackedTickers.length,
      warningCount: qualityWarnings.length,
      latestActivity
    };
  }, [activitySummaries, qualityWarnings.length, stocks, untrackedTickers.length]);

  if (loading || activityLoading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading stocks..." />
      </section>
    );
  }

  if (error || activityError) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error || activityError} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
        <ArrowLeft className="h-4 w-4" /> Back to index
      </button>

      <header className="border-b border-slate-200 pb-10">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
          Stocks
        </h1>
        <p className="mt-4 font-serif text-lg leading-8 text-slate-700">
          Portfolio cockpit. Thesis, timeline, and related research for every position.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-[5.5rem] text-[13px] font-medium text-slate-500">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setStatusFilter(s)} type="button">
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-[5.5rem] text-[13px] font-medium text-slate-500">Conviction</span>
          {CONVICTION_OPTIONS.map((c) => (
            <button key={c} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${convictionFilter === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setConvictionFilter(c)} type="button">
              {c}
            </button>
          ))}
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-[5.5rem] text-[13px] font-medium text-slate-500">Labels</span>
            <button key="All-labels" className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${labelFilter === "All" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setLabelFilter("All")} type="button">All</button>
            {labels.map((l) => (
              <button key={l} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${labelFilter === l ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setLabelFilter(l)} type="button">
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <input
          className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-slate-400"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ticker, company, theme, label, sector, status, or conviction"
          value={query}
        />
      </div>

      <ActivityOverview stats={portfolioStats} />

      {filteredStocks.length === 0 && (
        <StateMessage message="No stocks match this filter." />
      )}

      {filteredStocks.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ticker</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Company</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Conviction</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Theme</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Labels</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Shares</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Invested</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Avg Cost</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Dividends</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Latest Activity</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Updated</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Latest Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const summary = activitySummaries[stock.ticker] || {};
                return (
                  <tr key={stock.ticker} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <button className="text-sm font-semibold text-slate-900 transition-colors hover:text-slate-600" onClick={() => navigate(`/stocks/${stock.ticker}`)} type="button">
                        {stock.ticker}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{stock.company}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-slate-900 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white">
                        {stock.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{stock.conviction}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{stock.theme}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stock.labels.slice(0, 3).map((l) => (
                          <span key={l} className="inline-block bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-500">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-700">{formatShares(summary.shares)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.totalBuyAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.averageBuyPrice)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.dividends)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{summary.activityCount || 0}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatLatestActivity(summary.latestActivity)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{stock.updated}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {stock.latestNote ? (
                        <button
                          className="text-left transition-colors hover:text-slate-900"
                          onClick={() => navigate(`/stocks/${stock.ticker}/${stock.latestNote.slug}`)}
                          type="button"
                        >
                          {stock.latestNote.date} | {stock.latestNote.type}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UntrackedTickers tickers={untrackedTickers} summaries={activitySummaries} />
      <DataQualityPanel untrackedTickers={untrackedTickers} warnings={qualityWarnings} />
    </section>
  );
}

function ActivityOverview({ stats }) {
  return (
    <section className="mt-6 border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Portfolio Activity Check</h2>
        <p className="mt-1 text-sm text-slate-500">Ledger coverage used for tracking, average cost, dividends, and data quality.</p>
      </div>
      <div className="grid divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
        <Metric label="Tracked stock pages" value={stats.trackedTickers} />
        <Metric label="Tracked activity rows" value={stats.trackedActivityCount} />
        <Metric label="Untracked tickers" value={stats.untrackedCount} />
        <Metric label="Data warnings" value={stats.warningCount} />
      </div>
      <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        Latest activity: <span className="font-medium text-slate-900">{formatLatestActivity(stats.latestActivity)}</span>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 font-serif text-3xl font-normal text-slate-900">{value}</div>
    </div>
  );
}

function UntrackedTickers({ tickers, summaries }) {
  if (tickers.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Activity Without Stock Page</h2>
        <p className="mt-1 text-sm text-slate-500">These tickers exist in the activity ledger but do not have a thesis page yet.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b-2 border-slate-200">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ticker</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Shares</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Invested</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Avg Cost</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Dividends</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Latest Activity</th>
            </tr>
          </thead>
          <tbody>
            {tickers.map((ticker) => {
              const summary = summaries[ticker] || {};
              return (
                <tr key={ticker} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{ticker}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-700">{formatShares(summary.shares)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.totalBuyAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.averageBuyPrice)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{formatUsd(summary.dividends)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">{summary.activityCount || 0}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatLatestActivity(summary.latestActivity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DataQualityPanel({ untrackedTickers, warnings }) {
  return (
    <section className="mt-8 border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Data Quality</h2>
        <p className="mt-1 text-sm text-slate-500">Rows to review before relying on cost basis and tracking totals.</p>
      </div>
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border-b border-slate-200 md:border-b-0 md:border-r md:border-slate-200">
          {warnings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ticker</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((warning, index) => (
                    <tr key={`${warning.ticker}-${warning.date}-${warning.activity}-${index}`} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{warning.ticker}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{warning.date}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{warning.activity}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{warning.warning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">No activity warnings found.</p>
          )}
        </div>
        <aside className="px-4 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Missing stock pages</h3>
          {untrackedTickers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {untrackedTickers.map((ticker) => (
                <span key={ticker} className="bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{ticker}</span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Every activity ticker has a stock page.</p>
          )}
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Create a thesis page for each missing ticker or remove stale rows from the activity CSV.
          </p>
        </aside>
      </div>
    </section>
  );
}

function formatUsd(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatShares(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4
  }).format(value);
}

function formatLatestActivity(activity) {
  if (!activity) {
    return "-";
  }

  return `${activity.date} | ${activity.activity}`;
}
