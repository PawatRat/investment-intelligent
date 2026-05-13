import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";

const MARGIN = { top: 16, right: 18, bottom: 4, left: 16 };

export default function PortfolioBridge({ performance, formatUsd, formatSignedUsd, formatPercent }) {
  const summary = performance?.summary;
  if (!summary || !summary.costBasis) return null;

  const c = summary;
  const taxesFees = (c.taxes || 0) + (c.fees || 0);

  const steps = [
    { label: "Unrealized", value: c.unrealizedGain || 0 },
    { label: "Realized", value: c.realizedGain || 0 },
    { label: "Dividends", value: c.dividends || 0 }
  ];

  if (taxesFees !== 0) {
    steps.push({ label: "Taxes & Fees", value: taxesFees });
  }

  let runningTotal = 0;
  const data = steps.map((step, index) => {
    const base = runningTotal;
    runningTotal += step.value;

    return {
      label: step.label,
      value: step.value,
      base,
      end: runningTotal,
      isTotal: false,
      key: `${step.label}-${index}`
    };
  });

  data.push({
    label: "Total Return",
    value: c.totalGain || 0,
    base: 0,
    end: c.totalGain || 0,
    isTotal: true,
    key: "total-return"
  });

  const tops = data.map((entry) => entry.base);
  const bottoms = data.map((entry) => entry.end);
  const allPositions = [...tops, ...bottoms];
  const domainMin = Math.min(0, ...allPositions);
  const domainMax = Math.max(0, ...allPositions);
  const padding = Math.max(Math.abs(domainMax - domainMin) * 0.15, 1);
  const yDomainMin = domainMin < 0 ? domainMin - padding : 0;
  const yDomainMax = domainMax + padding;

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <DashboardSectionHeader
        cadenceLabel="After quote snapshot"
        description={<>Contribution view of current total return. <span className="font-medium text-slate-700">{formatPercent(c.totalReturnPct)}</span></>}
        title="Return Decomposition"
        updatedLabel={formatDateTime(performance?.asOf)}
      />
      <div className="px-4 py-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={MARGIN}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 6" vertical={false} />
            <XAxis
              axisLine={{ stroke: "#000000" }}
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={{ stroke: "#000000" }}
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={formatUsd}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<BridgeTooltip formatUsd={formatUsd} formatSignedUsd={formatSignedUsd} />} cursor={{ fill: "#f2f2f2" }} />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a">
              {data.map((entry) => (
                <Cell
                  fill={entry.isTotal ? "#0f172a" : entry.value >= 0 ? "#475569" : "#94a3b8"}
                  key={entry.key}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BridgeTooltip({ active, payload, formatUsd, formatSignedUsd }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.isTotal) {
    return (
      <div className="bg-white border border-slate-200 px-3 py-2 text-sm shadow">
        <div className="font-semibold text-slate-900">Total Return</div>
        <div className="text-slate-600">{formatSignedUsd(d.value)}</div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 px-3 py-2 text-sm shadow">
      <div className="font-semibold text-slate-900">{d.label}</div>
      <div className="text-slate-600">{formatSignedUsd(d.value)}</div>
      <div className="mt-0.5 text-xs text-slate-400">Running: {formatUsd(d.base + d.value)}</div>
    </div>
  );
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
