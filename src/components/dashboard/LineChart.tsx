"use client";

type LineChartPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: LineChartPoint[];
  height?: number;
  valueFormat?: "number" | "peso";
};

export function LineChart({
  data,
  height = 208,
  valueFormat = "number",
}: LineChartProps) {
  const formatValue = (value: number) => {
    if (valueFormat !== "peso") return String(value);
    return value >= 1000
      ? `₱${Math.round(value / 100) / 10}k`
      : `₱${value}`;
  };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--ink-muted)]"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 640;
  const padX = 24;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padX + chartW / 2
        : padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padY + chartH - t * chartH,
    value: Math.round(max * t),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[480px]"
        role="img"
        aria-label="Sales line chart"
      >
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={padX}
              x2={width - padX}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--ink)"
              strokeOpacity={0.06}
            />
            <text
              x={padX - 6}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-[var(--ink-muted)] text-[10px]"
            >
              {formatValue(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--brand-green)" fillOpacity={0.12} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand-green)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="white"
              stroke="var(--brand-green)"
              strokeWidth={2}
            />
            <title>
              {p.label}: {formatValue(p.value)}
            </title>
          </g>
        ))}

        {points.map((p) => (
          <text
            key={`${p.label}-x`}
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            className="fill-[var(--ink-muted)] text-[9px]"
          >
            {p.label.replace(", 2026", "").replace(" 2026", "")}
          </text>
        ))}
      </svg>
    </div>
  );
}
