import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useActivities } from "./hooks.js";

const ACTIVITY_TYPES = ["All", "Buy", "Sell", "Dividend", "Dividend Withholding Tax", "fee"];

export default function ActivitiesIndex({ navigate }) {
  const { activityData, loading, error } = useActivities();
  const [typeFilter, setTypeFilter] = useState("All");
  const [tickerFilter, setTickerFilter] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const activities = activityData?.activities || [];
  const tickers = useMemo(() => [...new Set(activities.map((a) => a.ticker).filter(Boolean))].sort(), [activities]);

  const sortConfigs = {
    date: (a) => a.date,
    ticker: (a) => a.ticker,
    activity: (a) => a.activity,
    amount: (a) => a.amount,
    shares: (a) => a.shares,
    executedPrice: (a) => a.executedPrice
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

  const filteredActivities = useMemo(() => {
    const q = tickerFilter.trim().toUpperCase();
    let result = activities.filter((a) => {
      const matchType = typeFilter === "All" || a.activity === typeFilter;
      const matchTicker = !q || (a.ticker && a.ticker.toUpperCase().includes(q));
      return matchType && matchTicker;
    });

    if (sortKey && sortConfigs[sortKey]) {
      const getValue = sortConfigs[sortKey];
      result = result.sort((a, b) => {
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
    }

    return result;
  }, [activities, typeFilter, tickerFilter, sortKey, sortDirection]);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading activities..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/stocks")} type="button">
        <ArrowLeft className="h-4 w-4" /> Back to stocks
      </button>

      <header className="border-b border-slate-200 pb-10">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
          Portfolio Activity
        </h1>
        <p className="mt-4 font-serif text-lg leading-8 text-slate-700">
          Full transaction ledger across all holdings — every buy, sell, dividend, and fee.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-slate-500">Type</span>
          {ACTIVITY_TYPES.map((t) => (
            <button key={t} className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${typeFilter === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setTypeFilter(t)} type="button">
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-500">Ticker</span>
          <input
            className="border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-slate-400"
            onChange={(e) => setTickerFilter(e.target.value)}
            placeholder="Filter..."
            value={tickerFilter}
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        {filteredActivities.length} of {activities.length} activities
      </div>

      {filteredActivities.length === 0 && (
        <StateMessage message="No activities match this filter." />
      )}

      {filteredActivities.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-slate-200 border-t-2 border-t-black bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <SortHeader sortKey="date" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Date</SortHeader>
                <SortHeader sortKey="ticker" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Ticker</SortHeader>
                <SortHeader sortKey="activity" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Activity</SortHeader>
                <SortHeader className="text-right" sortKey="amount" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Amount</SortHeader>
                <SortHeader className="text-right" sortKey="executedPrice" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Price</SortHeader>
                <SortHeader className="text-right" sortKey="shares" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Shares</SortHeader>
                <SortHeader sortKey="" sortState={{ sortKey, sortDirection }} onToggle={toggleSort}>Note</SortHeader>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{a.date}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button className="text-sm font-semibold text-slate-900 transition-colors hover:text-slate-600" onClick={() => navigate(`/stocks/${a.ticker}`)} type="button">
                      {a.ticker}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <ActivityBadge activity={a.activity} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono tabular-nums">
                    <span className={a.signedCashFlow > 0 ? "text-slate-900" : a.signedCashFlow < 0 ? "text-slate-500" : "text-slate-400"}>
                      {formatSignedCash(a.amount)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono tabular-nums text-slate-600">{a.executedPrice ? formatUsd(a.executedPrice) : "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono tabular-nums text-slate-600">{formatShares(a.shares)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{a.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SortHeader({ children, className = "", sortKey, sortState, onToggle }) {
  if (!sortKey) {
    return (
      <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
        {children}
      </th>
    );
  }
  const active = sortState.sortKey === sortKey;
  return (
    <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
      <button className="inline-flex items-center gap-1 transition-colors hover:text-slate-900" onClick={() => onToggle(sortKey)} type="button">
        {children}
        {active && <span className="text-[9px] leading-none">{sortState.sortDirection === "asc" ? "\u25B2" : "\u25BC"}</span>}
      </button>
    </th>
  );
}

function ActivityBadge({ activity }) {
  const colors = {
    Buy: "bg-slate-900 text-white",
    Sell: "bg-slate-700 text-white",
    Dividend: "bg-slate-100 text-slate-700",
    "Dividend Withholding Tax": "bg-slate-100 text-slate-500",
    fee: "bg-slate-50 text-slate-400"
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${colors[activity] || "bg-slate-100 text-slate-600"}`}>
      {activity}
    </span>
  );
}

function formatSignedCash(value) {
  if (value === null || value === undefined) return "-";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "exceptZero",
    maximumFractionDigits: 2
  }).format(value);
  return formatted;
}

function formatUsd(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4
  }).format(value);
}

function formatShares(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6
  }).format(value);
}
