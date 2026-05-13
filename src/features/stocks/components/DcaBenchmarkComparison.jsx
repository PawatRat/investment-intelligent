import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";

const MARGIN = { top: 16, right: 20, bottom: 4, left: 12 };

export default function DcaBenchmarkComparison({ dcaBenchmark, error, loading, formatPercent, formatSignedUsd, formatUsd }) {
  const series = dcaBenchmark?.series || [];
  const summary = dcaBenchmark?.summary;
  const providerWarning = dcaBenchmark?.dataQuality?.warnings?.[0]?.warning || "";

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel={getBenchmarkCadence(dcaBenchmark?.source)}
        description={`Equal monthly investment into ${dcaBenchmark?.benchmark || "SPY"} using the same total invested capital.`}
        title="DCA vs S&P 500"
        updatedLabel={formatDateTime(dcaBenchmark?.asOf)}
      />

      {loading && (
        <p className="px-4 py-5 text-sm text-slate-600">Loading DCA benchmark...</p>
      )}

      {!loading && error && (
        <p className="px-4 py-5 text-sm text-slate-600">{error}</p>
      )}

      {!loading && !error && series.length === 0 && (
        <p className="px-4 py-5 text-sm text-slate-600">
          {providerWarning ? `DCA benchmark unavailable: ${providerWarning}.` : "No DCA benchmark history available yet."}
        </p>
      )}

      {!loading && !error && series.length > 0 && (
        <>
          <div className="grid divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
            <Metric label="Portfolio" value={formatPercent(summary?.portfolioReturnPct)} />
            <Metric label={`${dcaBenchmark?.benchmark || "SPY"} DCA`} value={formatPercent(summary?.dcaReturnPct)} />
            <Metric label="DCA gap" value={formatPercent(summary?.alphaPct)} />
            <Metric label="Monthly amount" value={formatUsd(dcaBenchmark?.contributionAmount)} />
          </div>
          <div className="border-t border-slate-200 px-4 py-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={MARGIN}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 6" vertical={false} />
                <XAxis
                  axisLine={{ stroke: "#000000" }}
                  dataKey="date"
                  minTickGap={28}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatShortDate}
                  tickLine={false}
                />
                <YAxis
                  axisLine={{ stroke: "#000000" }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  width={54}
                />
                <Tooltip content={<DcaTooltip formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="portfolioReturnPct" dot={false} name="Portfolio" stroke="#0f172a" strokeWidth={2} type="monotone" />
                <Line dataKey="dcaReturnPct" dot={false} name={`${dcaBenchmark?.benchmark || "SPY"} DCA`} stroke="#64748b" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            Contributions: <span className="font-medium text-slate-900">{dcaBenchmark?.contributionCount || 0}</span>
            <span className="mx-2 text-slate-300">|</span>
            DCA value: <span className="font-medium text-slate-900">{formatUsd(summary?.dcaValue)}</span>
            <span className="mx-2 text-slate-300">|</span>
            Value gap: <span className="font-medium text-slate-900">{formatSignedUsd(summary?.valueGap)}</span>
          </div>
        </>
      )}
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

function DcaTooltip({ active, payload, label, formatPercent, formatSignedUsd }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="border border-slate-200 bg-white px-3 py-2 text-sm shadow">
      <div className="font-semibold text-slate-900">{formatLongDate(label)}</div>
      <div className="text-slate-600">Portfolio: {formatPercent(row.portfolioReturnPct)}</div>
      <div className="text-slate-600">DCA: {formatPercent(row.dcaReturnPct)}</div>
      <div className="text-slate-500">Gap: {formatPercent(row.alphaPct)}</div>
      <div className="text-slate-500">Value gap: {formatSignedUsd(row.portfolioValue - row.dcaValue)}</div>
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatLongDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getBenchmarkCadence(source = "") {
  if (source.includes("pocketportfolio-monthly")) {
    return "Monthly DCA; monthly fallback";
  }
  if (source.includes("historical cache")) {
    return "Monthly DCA; cached prices";
  }
  return "Monthly DCA";
}
