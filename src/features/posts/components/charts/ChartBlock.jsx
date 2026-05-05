import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const chartMargin = { top: 16, right: 18, bottom: 8, left: 0 };
const axisLine = { stroke: "#000000" };

export default function ChartBlock({ config }) {
  const chartType = config.type || "bar";
  const data = Array.isArray(config.data) ? config.data : [];
  const xKey = config.xKey || "label";
  const yKey = config.yKey || "value";

  if (!data.length) {
    return <div className="chart-shell">Chart block has no data.</div>;
  }

  return (
    <figure className="chart-shell">
      {(config.title || config.description) && (
        <figcaption className="chart-caption">
          {config.title && <strong>{config.title}</strong>}
          {config.description && <span>{config.description}</span>}
        </figcaption>
      )}
      <div className="chart-stage">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chartType, data, xKey, yKey)}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function renderChart(chartType, data, xKey, yKey) {
  if (chartType === "line") {
    return (
      <LineChart data={data} margin={chartMargin}>
        <ChartGrid />
        <ChartAxes xKey={xKey} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#000000", strokeWidth: 1 }} />
        <Line
          activeDot={{ r: 5, fill: "#000000", stroke: "#000000" }}
          dataKey={yKey}
          dot={{ r: 3, fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }}
          stroke="#000000"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    );
  }

  if (chartType === "pie") {
    return (
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Tooltip content={<ChartTooltip />} />
        <Pie
          cx="50%"
          cy="50%"
          data={data}
          dataKey={yKey}
          innerRadius="48%"
          nameKey={xKey}
          outerRadius="82%"
          stroke="#000000"
          strokeWidth={1}
        >
          {data.map((item, index) => (
            <Cell fill={index % 2 === 0 ? "#000000" : "#ffffff"} key={item[xKey] || index} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  return (
    <BarChart data={data} margin={chartMargin}>
      <ChartGrid />
      <ChartAxes xKey={xKey} />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f2f2f2" }} />
      <Bar dataKey={yKey} fill="#000000" stroke="#000000" />
    </BarChart>
  );
}

function ChartGrid() {
  return <CartesianGrid stroke="#d8d8d8" strokeDasharray="2 6" vertical={false} />;
}

function ChartAxes({ xKey }) {
  return (
    <>
      <XAxis axisLine={axisLine} dataKey={xKey} tickLine={false} />
      <YAxis axisLine={axisLine} tickLine={false} width={44} />
    </>
  );
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      <strong>{payload[0].value}</strong>
    </div>
  );
}
