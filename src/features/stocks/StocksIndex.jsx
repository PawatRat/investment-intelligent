import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, GitGraph, Table } from "lucide-react";
import IconButton from "../../components/IconButton.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { useStocks } from "./hooks.js";

const StockGraphView = lazy(() => import("./components/StockGraphView.jsx"));

const STATUS_OPTIONS = ["All", "owned", "watchlist", "previously-owned", "sold", "archived"];
const CONVICTION_OPTIONS = ["All", "strong", "holding", "watching", "re-evaluating"];

export default function StocksIndex({ navigate }) {
  const { stocks, loading, error } = useStocks();
  const [view, setView] = useState("table");
  const [statusFilter, setStatusFilter] = useState("All");
  const [convictionFilter, setConvictionFilter] = useState("All");
  const [labelFilter, setLabelFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const sortConfigs = {
    ticker: (stock) => stock.ticker,
    company: (stock) => stock.company,
    sector: (stock) => stock.sector,
    status: (stock) => stock.status,
    conviction: (stock) => stock.conviction,
    theme: (stock) => stock.theme,
    updated: (stock) => stock.updated,
    timelineCount: (stock) => stock.timelineCount,
    latestNote: (stock) => stock.latestNote?.date
  };

  const labels = useMemo(() => {
    const set = new Set(stocks.flatMap((stock) => stock.labels));
    return Array.from(set).sort();
  }, [stocks]);

  const stats = useMemo(() => {
    const ownedCount = stocks.filter((stock) => stock.status === "owned").length;
    const watchlistCount = stocks.filter((stock) => stock.status === "watchlist").length;
    const strongCount = stocks.filter((stock) => stock.conviction === "strong").length;
    const noteCount = stocks.reduce((total, stock) => total + (stock.timelineCount || 0), 0);

    return {
      ownedCount,
      watchlistCount,
      strongCount,
      noteCount
    };
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks
      .filter((stock) => {
        const matchStatus = statusFilter === "All" || stock.status === statusFilter;
        const matchConviction = convictionFilter === "All" || stock.conviction === convictionFilter;
        const matchLabel = labelFilter === "All" || stock.labels.includes(labelFilter);
        const searchable = [
          stock.ticker,
          stock.company,
          stock.theme,
          stock.sector,
          stock.status,
          stock.conviction,
          ...stock.labels
        ].join(" ").toLowerCase();

        return matchStatus && matchConviction && matchLabel && (!q || searchable.includes(q));
      })
      .sort((a, b) => {
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
  }, [stocks, statusFilter, convictionFilter, labelFilter, query, sortKey, sortDirection]);

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

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading stock library..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <BackButton navigate={navigate} />

      <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Stock Library</p>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
            Stocks
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-slate-700">
            Thesis pages, conviction tags, timeline notes, and research links for each stock. Portfolio analytics now live on the dedicated portfolio page.
          </p>
        </div>
        <aside className="border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Dashboard</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use portfolio for performance, benchmark, allocation, and activity quality checks.
          </p>
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
            onClick={() => navigate("/portfolio")}
            type="button"
          >
            <BriefcaseBusiness className="h-4 w-4" />
            Open Portfolio
          </button>
        </aside>
      </header>

      <div className="mt-6 grid divide-y divide-slate-200 border border-slate-200 bg-white md:grid-cols-4 md:divide-x md:divide-y-0">
        <Metric label="Thesis pages" value={stocks.length} />
        <Metric label="Owned" value={stats.ownedCount} />
        <Metric label="Strong conviction" value={stats.strongCount} />
        <Metric label="Timeline notes" value={stats.noteCount} />
      </div>

      <div className="mt-8 space-y-3">
        <FilterRow label="Status">
          {STATUS_OPTIONS.map((status) => (
            <FilterButton active={statusFilter === status} key={status} onClick={() => setStatusFilter(status)}>
              {status}
            </FilterButton>
          ))}
        </FilterRow>
        <FilterRow label="Conviction">
          {CONVICTION_OPTIONS.map((conviction) => (
            <FilterButton active={convictionFilter === conviction} key={conviction} onClick={() => setConvictionFilter(conviction)}>
              {conviction}
            </FilterButton>
          ))}
        </FilterRow>
        {labels.length > 0 && (
          <FilterRow label="Labels">
            <FilterButton active={labelFilter === "All"} onClick={() => setLabelFilter("All")}>All</FilterButton>
            {labels.map((label) => (
              <FilterButton active={labelFilter === label} key={label} onClick={() => setLabelFilter(label)}>
                {label}
              </FilterButton>
            ))}
          </FilterRow>
        )}
      </div>

      <div className="mt-4">
        <input
          className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-slate-400"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by ticker, company, theme, label, sector, status, or conviction"
          value={query}
        />
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{filteredStocks.length}</span> of <span className="font-medium text-slate-900">{stocks.length}</span> thesis pages
          </p>
          {stats.watchlistCount > 0 && (
            <p className="text-sm text-slate-500">{stats.watchlistCount} watchlist</p>
          )}
        </div>
        <div className="flex items-center">
          <IconButton active={view === "table"} label="Table view" onClick={() => setView("table")}>
            <Table className="h-4 w-4" />
          </IconButton>
          <IconButton active={view === "graph"} label="Graph view" onClick={() => setView("graph")}>
            <GitGraph className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {filteredStocks.length === 0 && (
        <div className="mt-6">
          <StateMessage message="No stocks match this filter." />
        </div>
      )}

      {filteredStocks.length > 0 && view === "table" && (
        <div className="mt-6 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <SortHeader sortKey="ticker">Ticker</SortHeader>
                <SortHeader sortKey="company">Company</SortHeader>
                <SortHeader sortKey="sector">Sector</SortHeader>
                <SortHeader sortKey="status">Status</SortHeader>
                <SortHeader sortKey="conviction">Conviction</SortHeader>
                <SortHeader sortKey="theme">Theme</SortHeader>
                <SortHeader sortKey="">Labels</SortHeader>
                <SortHeader className="text-right" sortKey="timelineCount">Notes</SortHeader>
                <SortHeader sortKey="latestNote">Latest Note</SortHeader>
                <SortHeader sortKey="updated">Updated</SortHeader>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => (
                <tr key={stock.ticker} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <button className="text-sm font-semibold text-slate-900 transition-colors hover:text-slate-600" onClick={() => navigate(`/stocks/${stock.ticker}`)} type="button">
                      {stock.ticker}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{stock.company}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{stock.sector || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-slate-900 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white">
                      {stock.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{stock.conviction || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{stock.theme || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {stock.labels.slice(0, 4).map((label) => (
                        <span key={label} className="inline-block bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-500">{label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-600">{stock.timelineCount || 0}</td>
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
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{stock.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredStocks.length > 0 && view === "graph" && (
        <Suspense
          fallback={
            <div className="mt-6 flex h-[480px] items-center justify-center border border-slate-200 bg-white">
              <p className="text-sm text-slate-600">Loading graph...</p>
            </div>
          }
        >
          <StockGraphView navigate={navigate} stocks={filteredStocks} />
        </Suspense>
      )}
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

function FilterRow({ children, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[5.5rem] text-[13px] font-medium text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={onClick} type="button">
      {children}
    </button>
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
