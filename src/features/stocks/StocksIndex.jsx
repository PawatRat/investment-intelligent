import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useActivities, usePortfolioPerformance, useStocks } from "./hooks.js";

const PLWaterfall = lazy(() => import("./components/PLWaterfall.jsx"));
const PortfolioBridge = lazy(() => import("./components/PortfolioBridge.jsx"));
const ConvictionAllocation = lazy(() => import("./components/ConvictionAllocation.jsx"));

const STATUS_OPTIONS = ["All", "owned", "watchlist", "previously-owned", "sold", "archived"];
const CONVICTION_OPTIONS = ["All", "strong", "holding", "watching", "re-evaluating"];

export default function StocksIndex({ navigate }) {
  const { stocks, loading, error } = useStocks();
  const { activityData, loading: activityLoading, error: activityError } = useActivities();
  const { performance, loading: performanceLoading, error: performanceError } = usePortfolioPerformance();
  const [statusFilter, setStatusFilter] = useState("All");
  const [convictionFilter, setConvictionFilter] = useState("All");
  const [labelFilter, setLabelFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const activitySummaries = activityData?.summaries || {};
  const dataQuality = activityData?.dataQuality || { untrackedTickers: [], warnings: [] };
  const untrackedTickers = performance?.dataQuality?.untrackedTickers || dataQuality.untrackedTickers || [];
  const qualityWarnings = performance?.dataQuality?.warnings || dataQuality.warnings || [];
  const unpricedTickers = performance?.dataQuality?.unpricedTickers || [];
  const performanceByTicker = useMemo(() => {
    return Object.fromEntries((performance?.positions || []).map((position) => [position.ticker, position]));
  }, [performance]);

  const sortConfigs = {
    ticker: (s) => s.ticker,
    company: (s) => s.company,
    status: (s) => s.status,
    conviction: (s) => s.conviction,
    theme: (s) => s.theme,
    price: (s) => performanceByTicker[s.ticker]?.price,
    marketValue: (s) => performanceByTicker[s.ticker]?.marketValue,
    costBasis: (s) => performanceByTicker[s.ticker]?.costBasis,
    unrealizedGain: (s) => performanceByTicker[s.ticker]?.unrealizedGain,
    totalReturnPct: (s) => performanceByTicker[s.ticker]?.totalReturnPct,
    allocationPct: (s) => performanceByTicker[s.ticker]?.allocationPct,
    shares: (s) => activitySummaries[s.ticker]?.shares,
    totalBuyAmount: (s) => activitySummaries[s.ticker]?.totalBuyAmount,
    averageBuyPrice: (s) => activitySummaries[s.ticker]?.averageBuyPrice,
    dividends: (s) => activitySummaries[s.ticker]?.dividends,
    activityCount: (s) => activitySummaries[s.ticker]?.activityCount,
    latestActivity: (s) => activitySummaries[s.ticker]?.latestActivity?.date,
    updated: (s) => s.updated,
    latestNote: (s) => s.latestNote?.date
  };

  function toggleSort(key) {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey("");
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

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
    }).sort((a, b) => {
      if (!sortKey) return 0;
      const getValue = sortConfigs[sortKey];
      if (!getValue) return 0;
      const va = getValue(a);
      const vb = getValue(b);
      const na = va ?? null;
      const nb = vb ?? null;
      if (na === null && nb === null) return 0;
      if (na === null) return 1;
      if (nb === null) return -1;
      if (na < nb) return sortDirection === "asc" ? -1 : 1;
      if (na > nb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [stocks, statusFilter, convictionFilter, labelFilter, query, sortKey, sortDirection, performanceByTicker, activitySummaries]);

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

  function SortHeader({ children, sortKey: colKey, className = "" }) {
    if (!colKey) {
      return (
        <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
          {children}
        </th>
      );
    }
    const active = sortKey === colKey;
    return (
      <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
        <button className="inline-flex items-center gap-1 transition-colors hover:text-slate-900" onClick={() => toggleSort(colKey)} type="button">
          {children}
          {active && <span className="text-[9px] leading-none">{sortDirection === "asc" ? "\u25B2" : "\u25BC"}</span>}
        </button>
      </th>
    );
  }

  if (loading || activityLoading || performanceLoading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading stocks..." />
      </section>
    );
  }

  if (error || activityError || performanceError) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error || activityError || performanceError} />
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

      <PerformanceOverview performance={performance} />
      <Suspense fallback={null}>
        <PortfolioBridge formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} performance={performance} />
      </Suspense>
      <Suspense fallback={null}>
        <ConvictionAllocation formatPercent={formatPercent} performance={performance} stocks={stocks} />
      </Suspense>
      <Suspense fallback={null}>
        <PLWaterfall formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} performance={performance} />
      </Suspense>
      <ActivityOverview stats={portfolioStats} />

      {filteredStocks.length === 0 && (
        <StateMessage message="No stocks match this filter." />
      )}

      {filteredStocks.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <SortHeader sortKey="ticker">Ticker</SortHeader>
                <SortHeader sortKey="company">Company</SortHeader>
                <SortHeader sortKey="status">Status</SortHeader>
                <SortHeader sortKey="conviction">Conviction</SortHeader>
                <SortHeader sortKey="theme">Theme</SortHeader>
                <SortHeader sortKey="" className="!cursor-default">Labels</SortHeader>
                <SortHeader className="text-right" sortKey="price">Price</SortHeader>
                <SortHeader className="text-right" sortKey="marketValue">Market Value</SortHeader>
                <SortHeader className="text-right" sortKey="costBasis">Cost Basis</SortHeader>
                <SortHeader className="text-right" sortKey="unrealizedGain">Unrealized P/L</SortHeader>
                <SortHeader className="text-right" sortKey="totalReturnPct">Total Return</SortHeader>
                <SortHeader className="text-right" sortKey="allocationPct">Allocation</SortHeader>
                <SortHeader className="text-right" sortKey="shares">Shares</SortHeader>
                <SortHeader className="text-right" sortKey="totalBuyAmount">Invested</SortHeader>
                <SortHeader className="text-right" sortKey="averageBuyPrice">Avg Cost</SortHeader>
                <SortHeader className="text-right" sortKey="dividends">Dividends</SortHeader>
                <SortHeader className="text-right" sortKey="activityCount">Activity</SortHeader>
                <SortHeader sortKey="latestActivity">Latest Activity</SortHeader>
                <SortHeader sortKey="updated">Updated</SortHeader>
                <SortHeader sortKey="latestNote">Latest Note</SortHeader>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const summary = activitySummaries[stock.ticker] || {};
                const position = performanceByTicker[stock.ticker] || {};
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
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatUsd(position.price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-800 font-mono tabular-nums">{formatUsd(position.marketValue)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatUsd(position.costBasis)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-900 font-mono tabular-nums">{formatSignedUsd(position.unrealizedGain)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-900 font-mono tabular-nums">{formatPercent(position.totalReturnPct)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatPercent(position.allocationPct)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-700 font-mono tabular-nums">{formatShares(summary.shares)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatUsd(summary.totalBuyAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatUsd(summary.averageBuyPrice)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{formatUsd(summary.dividends)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600 font-mono tabular-nums">{summary.activityCount || 0}</td>
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
      <DataQualityPanel unpricedTickers={unpricedTickers} untrackedTickers={untrackedTickers} warnings={qualityWarnings} />
    </section>
  );
}

const ALLOCATION_COLORS = [
  "#0f172a",
  "#475569",
  "#334155",
  "#64748b",
  "#1e293b",
  "#94a3b8"
];

function PerformanceOverview({ performance }) {
  const summary = performance?.summary || {};
  const positions = (performance?.positions || []).filter((p) => p.allocationPct > 0);

  return (
    <section className="mt-6 border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Portfolio Performance</h2>
        <p className="mt-1 text-sm text-slate-500">Latest quote snapshot from {performance?.source || "market data"} as of {formatDateTime(performance?.asOf)}.</p>
      </div>
      <div className="grid divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-6">
        <Metric label="Market value" value={formatUsd(summary.marketValue)} />
        <Metric label="Cost basis" value={formatUsd(summary.costBasis)} />
        <Metric label="Unrealized P/L" value={formatSignedUsd(summary.unrealizedGain)} />
        <Metric label="Unrealized return" value={formatPercent(summary.unrealizedReturnPct)} />
        <Metric label="Total return" value={formatPercent(summary.totalReturnPct)} />
        <Metric label="Dividends" value={formatUsd(summary.dividends)} />
      </div>
      {positions.length > 0 && <AllocationBar positions={positions} />}
      <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        Realized P/L: <span className="font-medium text-slate-900">{formatSignedUsd(summary.realizedGain)}</span>
        <span className="mx-2 text-slate-300">|</span>
        Taxes and fees: <span className="font-medium text-slate-900">{formatUsd((summary.taxes || 0) + (summary.fees || 0))}</span>
      </div>
    </section>
  );
}

function AllocationBar({ positions }) {
  const VISIBLE_MAX = 5;
  const sorted = [...positions].sort((a, b) => b.allocationPct - a.allocationPct);
  const visible = sorted.slice(0, VISIBLE_MAX);
  const otherAllocation = sorted.slice(VISIBLE_MAX).reduce((sum, p) => sum + p.allocationPct, 0);

  const segments = otherAllocation > 0
    ? [...visible, { ticker: `${sorted.length - VISIBLE_MAX} more`, allocationPct: otherAllocation }]
    : visible;

  return (
    <div className="border-t border-slate-200 px-4 py-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Allocation</h3>
      <div className="flex h-5 border border-slate-200">
        {segments.map((seg, i) => (
          <div
            key={seg.ticker}
            className="h-full border-r border-white last:border-r-0"
            style={{ width: `${seg.allocationPct}%`, backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((seg, i) => (
          <div key={seg.ticker} className="flex items-center gap-1.5 text-xs">
            <span className="block h-2.5 w-2.5 shrink-0 border border-slate-300" style={{ backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }} />
            <span className="font-semibold text-slate-900">{seg.ticker}</span>
            <span className="text-slate-500">{formatPercent(seg.allocationPct)}</span>
          </div>
        ))}
      </div>
    </div>
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
      <div className="mt-2 font-mono tabular-nums text-2xl font-normal text-slate-900">{value}</div>
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

function DataQualityPanel({ unpricedTickers, untrackedTickers, warnings }) {
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
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Missing prices</h3>
          {unpricedTickers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {unpricedTickers.map((ticker) => (
                <span key={ticker} className="bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{ticker}</span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Every open position has a latest price.</p>
          )}
          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Missing stock pages</h3>
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

function formatSignedUsd(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "exceptZero",
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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
