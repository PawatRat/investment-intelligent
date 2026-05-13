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

const MARGIN = { top: 16, right: 20, bottom: 4, left: 12 };

export default function BenchmarkComparison({ benchmark, error, loading, formatPercent, formatSignedUsd, formatUsd }) {
  const series = benchmark?.series || [];
  const summary = benchmark?.summary;
  const providerWarning = benchmark?.dataQuality?.warnings?.[0]?.warning || "";

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Portfolio vs S&amp;P 500</h2>
        <p className="mt-1 text-sm text-slate-500">
          Same cash-flow comparison against {benchmark?.benchmark || "SPY"}.
        </p>
      </div>

      {loading && (
        <p className="px-4 py-5 text-sm text-slate-600">Loading benchmark history...</p>
      )}

      {!loading && error && (
        <p className="px-4 py-5 text-sm text-slate-600">{error}</p>
      )}

      {!loading && !error && series.length === 0 && (
        <p className="px-4 py-5 text-sm text-slate-600">
          {providerWarning ? `Benchmark history unavailable: ${providerWarning}.` : "No benchmark history available yet."}
        </p>
      )}

      {!loading && !error && series.length > 0 && (
        <>
          <div className="grid divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
            <Metric label="Portfolio" value={formatPercent(summary?.portfolioReturnPct)} />
            <Metric label={benchmark?.benchmark || "SPY"} value={formatPercent(summary?.benchmarkReturnPct)} />
            <Metric label="Alpha" value={formatPercent(summary?.alphaPct)} />
            <Metric label="Net invested" value={formatUsd(summary?.netInvested)} />
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
                <Tooltip content={<BenchmarkTooltip formatPercent={formatPercent} formatSignedUsd={formatSignedUsd} />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="portfolioReturnPct" dot={false} name="Portfolio" stroke="#0f172a" strokeWidth={2} type="monotone" />
                <Line dataKey="benchmarkReturnPct" dot={false} name={benchmark?.benchmark || "SPY"} stroke="#94a3b8" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            Portfolio value: <span className="font-medium text-slate-900">{formatUsd(summary?.portfolioValue)}</span>
            <span className="mx-2 text-slate-300">|</span>
            Benchmark value: <span className="font-medium text-slate-900">{formatUsd(summary?.benchmarkValue)}</span>
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

function BenchmarkTooltip({ active, payload, label, formatPercent, formatSignedUsd }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 px-3 py-2 text-sm shadow">
      <div className="font-semibold text-slate-900">{formatLongDate(label)}</div>
      <div className="text-slate-600">Portfolio: {formatPercent(row.portfolioReturnPct)}</div>
      <div className="text-slate-600">Benchmark: {formatPercent(row.benchmarkReturnPct)}</div>
      <div className="text-slate-500">Alpha: {formatPercent(row.alphaPct)}</div>
      <div className="text-slate-500">Gap: {formatSignedUsd(row.portfolioValue - row.benchmarkValue)}</div>
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
