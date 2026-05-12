import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const MARGIN = { top: 18, right: 24, bottom: 8, left: 12 };

const CONVICTION_ORDER = ["strong", "holding", "watching", "re-evaluating"];
const CONVICTION_LABEL = {
  strong: "Strong",
  holding: "Holding",
  watching: "Watching",
  "re-evaluating": "Re-eval"
};
const CONVICTION_COLOR = {
  strong: "#0f172a",
  holding: "#475569",
  watching: "#64748b",
  "re-evaluating": "#94a3b8"
};

export default function ConvictionAllocation({ stocks, performance, formatPercent }) {
  const positions = performance?.positions || [];
  const tickerMap = Object.fromEntries(positions.map((position) => [position.ticker, position]));

  const rows = stocks
    .filter((stock) => {
      const position = tickerMap[stock.ticker];
      return position && position.shares > 0 && position.allocationPct > 0 && CONVICTION_ORDER.includes(stock.conviction);
    })
    .map((stock) => {
      const position = tickerMap[stock.ticker];
      return {
        ticker: stock.ticker,
        conviction: stock.conviction,
        allocationPct: position.allocationPct,
        returnPct: position.totalReturnPct
      };
    })
    .sort((a, b) => {
      const convictionDelta = CONVICTION_ORDER.indexOf(a.conviction) - CONVICTION_ORDER.indexOf(b.conviction);
      return convictionDelta || b.allocationPct - a.allocationPct;
    });

  if (!rows.length) return null;

  const grouped = rows.reduce((acc, row) => {
    acc[row.conviction] ||= [];
    acc[row.conviction].push(row);
    return acc;
  }, {});

  const data = rows.map((row) => {
    const group = grouped[row.conviction] || [];
    const groupIndex = group.findIndex((entry) => entry.ticker === row.ticker);
    const midpoint = (group.length - 1) / 2;
    const jitter = group.length > 1 ? (groupIndex - midpoint) * 0.12 : 0;

    return {
      ...row,
      x: CONVICTION_ORDER.indexOf(row.conviction) + jitter,
      y: row.allocationPct
    };
  });

  const maxAlloc = Math.max(...data.map((entry) => entry.allocationPct), 1);
  const distinctConvictions = [...new Set(data.map((entry) => entry.conviction))].sort(
    (a, b) => CONVICTION_ORDER.indexOf(a) - CONVICTION_ORDER.indexOf(b)
  );

  return (
    <section className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Conviction vs Allocation</h2>
        <p className="mt-1 text-sm text-slate-500">Sizing check: allocation percent by conviction level.</p>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-200 px-4 py-2">
        {distinctConvictions.map((conviction) => (
          <div key={conviction} className="flex items-center gap-1.5 text-[11px]">
            <span className="block h-2.5 w-2.5 shrink-0 border border-slate-300" style={{ backgroundColor: CONVICTION_COLOR[conviction] }} />
            <span className="font-semibold uppercase text-slate-700">{CONVICTION_LABEL[conviction] || conviction}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-4" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={MARGIN}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 6" />
            <XAxis
              axisLine={{ stroke: "#000000" }}
              dataKey="x"
              domain={[-0.4, CONVICTION_ORDER.length - 0.6]}
              interval={0}
              ticks={CONVICTION_ORDER.map((_, index) => index)}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => CONVICTION_LABEL[CONVICTION_ORDER[value]] || ""}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={{ stroke: "#000000" }}
              dataKey="y"
              domain={[0, Math.ceil(maxAlloc * 1.2)]}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              type="number"
              width={54}
            />
            <ReferenceLine y={10} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Tooltip content={<AllocTooltip formatPercent={formatPercent} />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
            <Scatter data={data} shape={<AllocationMarker />}>
              {data.map((entry) => (
                <Cell
                  fill={CONVICTION_COLOR[entry.conviction] || "#94a3b8"}
                  key={entry.ticker}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AllocationMarker({ cx, cy, fill }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  return (
    <rect
      fill={fill}
      height={9}
      stroke="#0f172a"
      strokeWidth={1}
      width={9}
      x={cx - 4.5}
      y={cy - 4.5}
    />
  );
}

function AllocTooltip({ active, payload, formatPercent }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 px-3 py-2 text-sm shadow">
      <div className="font-semibold text-slate-900">{data.ticker}</div>
      <div className="text-slate-600">Conviction: {data.conviction}</div>
      <div className="text-slate-600">Allocation: {formatPercent(data.allocationPct)}</div>
      {Number.isFinite(data.returnPct) && (
        <div className="text-slate-500">Return: {formatPercent(data.returnPct)}</div>
      )}
    </div>
  );
}
