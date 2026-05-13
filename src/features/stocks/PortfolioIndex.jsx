import { lazy, Suspense, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useActivities, usePortfolioBenchmark, usePortfolioDcaBenchmark, usePortfolioPerformance, useStocks } from "./hooks.js";
import DashboardSectionHeader from "./components/DashboardSectionHeader.jsx";

const PLWaterfall = lazy(() => import("./components/PLWaterfall.jsx"));
const PortfolioBridge = lazy(() => import("./components/PortfolioBridge.jsx"));
const ConvictionAllocation = lazy(() => import("./components/ConvictionAllocation.jsx"));
const BenchmarkComparison = lazy(() => import("./components/BenchmarkComparison.jsx"));
const DcaBenchmarkComparison = lazy(() => import("./components/DcaBenchmarkComparison.jsx"));

const ALLOCATION_COLORS = [
  "#0f172a",
  "#475569",
  "#334155",
  "#64748b",
  "#1e293b",
  "#94a3b8"
];

export default function PortfolioIndex({ navigate }) {
  const { stocks, loading: stocksLoading, error: stocksError } = useStocks();
  const { activityData, loading: activityLoading, error: activityError } = useActivities();
  const { performance, loading: performanceLoading, error: performanceError } = usePortfolioPerformance();
  const { benchmark, loading: benchmarkLoading, error: benchmarkError } = usePortfolioBenchmark();
  const { dcaBenchmark, loading: dcaLoading, error: dcaError } = usePortfolioDcaBenchmark();

  const activitySummaries = activityData?.summaries || {};
  const dataQuality = activityData?.dataQuality || { untrackedTickers: [], warnings: [] };
  const untrackedTickers = performance?.dataQuality?.untrackedTickers || dataQuality.untrackedTickers || [];
  const qualityWarnings = performance?.dataQuality?.warnings || dataQuality.warnings || [];
  const unpricedTickers = performance?.dataQuality?.unpricedTickers || [];

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

  if (stocksLoading || activityLoading || performanceLoading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading portfolio..." />
      </section>
    );
  }

  if (stocksError || activityError || performanceError) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={stocksError || activityError || performanceError} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <BackButton navigate={navigate} />

      <header className="border-b border-slate-200 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio</p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
          Portfolio Command Center
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-slate-700">
          Performance, benchmark, allocation, conviction sizing, and data-quality checks from the local activity ledger.
        </p>
      </header>

      <PerformanceOverview performance={performance} />
      <Suspense fallback={null}>
        <BenchmarkComparison benchmark={benchmark} error={benchmarkError} formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} loading={benchmarkLoading} />
      </Suspense>
      <Suspense fallback={null}>
        <DcaBenchmarkComparison dcaBenchmark={dcaBenchmark} error={dcaError} formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} loading={dcaLoading} />
      </Suspense>
      <Suspense fallback={null}>
        <PortfolioBridge formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} performance={performance} />
      </Suspense>
      <Suspense fallback={null}>
        <ConvictionAllocation formatPercent={formatPercent} performance={performance} stocks={stocks} />
      </Suspense>
      <Suspense fallback={null}>
        <PLWaterfall formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} formatUsd={formatUsd} performance={performance} />
      </Suspense>

      <PositionsTable performance={performance} stocks={stocks} />
      <ActivityOverview stats={portfolioStats} />
      <UntrackedTickers tickers={untrackedTickers} summaries={activitySummaries} />
      <DataQualityPanel latestActivity={portfolioStats.latestActivity} unpricedTickers={unpricedTickers} untrackedTickers={untrackedTickers} warnings={qualityWarnings} />
    </section>
  );
}

function BackButton({ navigate }) {
  return (
    <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
      <ArrowLeft className="h-4 w-4" /> Back to index
    </button>
  );
}

function PerformanceOverview({ performance }) {
  const summary = performance?.summary || {};
  const positions = (performance?.positions || []).filter((p) => p.allocationPct > 0);

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="Quotes every 12h"
        description={`Latest quote snapshot from ${performance?.source || "market data"}.`}
        title="Portfolio Performance"
        updatedLabel={formatDateTime(performance?.asOf)}
      />
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

function PositionsTable({ performance, stocks }) {
  const stockByTicker = useMemo(() => {
    return Object.fromEntries(stocks.map((stock) => [stock.ticker, stock]));
  }, [stocks]);
  const positions = [...(performance?.positions || [])]
    .filter((position) => position.shares > 0 || position.marketValue > 0 || position.costBasis > 0)
    .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));

  if (!positions.length) return null;

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="After quote snapshot"
        description="Every current holding from the activity ledger, including tickers without thesis pages."
        title="Open Positions"
        updatedLabel={formatDateTime(performance?.asOf)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b-2 border-slate-200">
            <tr>
              <TableHead>Ticker</TableHead>
              <TableHead>Conviction</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Market Value</TableHead>
              <TableHead className="text-right">Cost Basis</TableHead>
              <TableHead className="text-right">Unrealized P/L</TableHead>
              <TableHead className="text-right">Total Return</TableHead>
              <TableHead className="text-right">Allocation</TableHead>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const stock = stockByTicker[position.ticker];
              return (
                <tr key={position.ticker} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{position.ticker}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{stock?.conviction || "untracked"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-700">{formatShares(position.shares)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-600">{formatUsd(position.price)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-slate-800">{formatUsd(position.marketValue)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-600">{formatUsd(position.costBasis)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-slate-900">{formatSignedUsd(position.unrealizedGain)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-slate-900">{formatPercent(position.totalReturnPct)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-600">{formatPercent(position.allocationPct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActivityOverview({ stats }) {
  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="On CSV change"
        description="Ledger coverage used for tracking, average cost, dividends, and data quality."
        title="Portfolio Activity Check"
        updatedLabel={formatLatestActivityDate(stats.latestActivity)}
      />
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
      <div className="mt-2 font-mono text-2xl font-normal tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function UntrackedTickers({ tickers, summaries }) {
  if (tickers.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="On CSV change"
        description="These tickers exist in the activity ledger but do not have a thesis page yet."
        title="Activity Without Stock Page"
        updatedLabel={formatLatestActivityDate(Object.values(summaries).map((summary) => summary.latestActivity).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date))[0])}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b-2 border-slate-200">
            <tr>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Dividends</TableHead>
              <TableHead className="text-right">Activity</TableHead>
              <TableHead>Latest Activity</TableHead>
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

function DataQualityPanel({ latestActivity, unpricedTickers, untrackedTickers, warnings }) {
  return (
    <section className="mt-8 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="On CSV change"
        description="Rows to review before relying on cost basis and tracking totals."
        title="Data Quality"
        updatedLabel={formatLatestActivityDate(latestActivity)}
      />
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border-b border-slate-200 md:border-b-0 md:border-r md:border-slate-200">
          {warnings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Issue</TableHead>
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

function formatLatestActivityDate(activity) {
  if (!activity?.date) {
    return "-";
  }

  return formatDateOnly(activity.date);
}

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
