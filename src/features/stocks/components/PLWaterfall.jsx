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

const MARGIN = { top: 12, right: 18, bottom: 4, left: 16 };

export default function PLWaterfall({ performance, formatUsd, formatSignedUsd, formatPercent }) {
  const positions = (performance?.positions || [])
    .filter((p) => p.shares > 0 && Number.isFinite(p.unrealizedGain))
    .sort((a, b) => b.unrealizedGain - a.unrealizedGain);

  if (!positions.length) return null;

  const data = positions.map((p) => ({
    ticker: p.ticker,
    unrealizedGain: p.unrealizedGain,
    returnPct: p.unrealizedReturnPct
  }));

  const domain = data.reduce(
    ([min, max], d) => [Math.min(min, d.unrealizedGain), Math.max(max, d.unrealizedGain)],
    [0, 0]
  );

  const labelWidth = Math.max(52, Math.max(...data.map((d) => d.ticker.length)) * 11 + 12);

  return (
    <section className="mt-6 border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">P/L Waterfall</h2>
        <p className="mt-1 text-sm text-slate-500">Unrealized gain/loss per open position.</p>
      </div>
      <div className="px-4 py-3" style={{ height: Math.max(200, data.length * 28 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={MARGIN}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 6" horizontal={false} />
            <XAxis
              axisLine={{ stroke: "#000000" }}
              domain={[domain[0] * 1.15, domain[1] * 1.15]}
              tickFormatter={formatUsd}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={{ stroke: "#000000" }}
              dataKey="ticker"
              tick={{ fontSize: 12 }}
              tickLine={false}
              type="category"
              width={labelWidth}
            />
            <Tooltip content={<WaterfallTooltip formatSignedUsd={formatSignedUsd} formatPercent={formatPercent} />} cursor={{ fill: "#f2f2f2" }} />
            <Bar dataKey="unrealizedGain">
              {data.map((entry) => (
                <Cell
                  fill={entry.unrealizedGain >= 0 ? "#0f172a" : "#94a3b8"}
                  key={entry.ticker}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function WaterfallTooltip({ active, payload, formatSignedUsd, formatPercent }) {
  if (!active || !payload?.length) return null;
  const { ticker, unrealizedGain, returnPct } = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 px-3 py-2 text-sm shadow">
      <div className="font-semibold text-slate-900">{ticker}</div>
      <div className="text-slate-600">{formatSignedUsd(unrealizedGain)}</div>
      {Number.isFinite(returnPct) && (
        <div className="text-slate-500">{formatPercent(returnPct)} return</div>
      )}
    </div>
  );
}
