/*
 * Performance — three at-a-glance charts for the merchant. Hand-rendered SVG
 * (no charting library dep). Mockup data scripted to read with the rest of
 * the cocoa demo: rain triggers convert highest, peak surfaces cluster around
 * the lunch demand-gap window, demand vs baseline shows the dip the
 * Opportunity Agent acted on.
 */

const TRIGGER_DATA = [
  { label: "Rain", value: 0.74, accent: "rain" },
  { label: "Demand gap", value: 0.62, accent: "spark" },
  { label: "Event proximity", value: 0.51, accent: "cocoa" },
  { label: "Time-of-day", value: 0.38, accent: "warn" },
];

const SURFACE_WINDOW = [
  { label: "08", value: 0.18 },
  { label: "10", value: 0.34 },
  { label: "12", value: 0.62 },
  { label: "14", value: 0.81 },
  { label: "16", value: 0.55 },
  { label: "18", value: 0.42 },
  { label: "20", value: 0.27 },
];

const DEMAND_DATA = {
  baseline: [0.45, 0.58, 0.72, 0.82, 0.78, 0.68, 0.5, 0.42, 0.38],
  actual: [0.48, 0.55, 0.6, 0.42, 0.38, 0.45, 0.4, 0.36, 0.34],
  hours: ["10", "11", "12", "13", "14", "15", "16", "17", "18"],
};

export function PerformanceSection() {
  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Performance</span>
          <h1>How your bounds are converting</h1>
          <p className="lead">
            Acceptance broken down by the trigger that woke the Opportunity Agent, surfacing
            density across your day, and live demand against your typical Saturday baseline.
          </p>
        </div>
      </header>

      <section className="perf-grid">
        <article className="perf-card">
          <div className="perf-card-head">
            <h2>Acceptance rate by trigger</h2>
            <span className="perf-card-meta">last 7 days · {TRIGGER_DATA.length} trigger types</span>
          </div>
          <BarChart data={TRIGGER_DATA} />
          <p className="perf-card-foot">
            Rain triggers convert ~2× as well as time-of-day alone. The Opportunity Agent is
            weighting them higher in your bounds.
          </p>
        </article>

        <article className="perf-card">
          <div className="perf-card-head">
            <h2>Peak surfacing windows</h2>
            <span className="perf-card-meta">last 7 days · share of surfaces fired</span>
          </div>
          <LineChart data={SURFACE_WINDOW} />
          <p className="perf-card-foot">
            Lunch (12–14) carries 55% of all surfaces. Consider tightening your blackout
            window if peak overlaps with operational capacity.
          </p>
        </article>

        <article className="perf-card perf-card-wide">
          <div className="perf-card-head">
            <h2>Demand vs baseline (today)</h2>
            <span className="perf-card-meta">live density · 15-min sample</span>
          </div>
          <AreaChart data={DEMAND_DATA} />
          <div className="perf-legend">
            <span className="legend-swatch is-cocoa" /> Typical Saturday baseline
            <span className="legend-swatch is-spark" /> Live density
          </div>
        </article>
      </section>
    </div>
  );
}

function BarChart({ data }: { data: typeof TRIGGER_DATA }) {
  const width = 480;
  const height = 200;
  const barWidth = 64;
  const gap = (width - barWidth * data.length) / (data.length + 1);
  const maxHeight = height - 40;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="chart-svg"
      role="img"
      aria-label="Acceptance rate by trigger type"
    >
      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={0}
          x2={width}
          y1={height - 20 - tick * maxHeight}
          y2={height - 20 - tick * maxHeight}
          stroke="var(--hairline)"
          strokeDasharray="2 4"
        />
      ))}
      {data.map((d, i) => {
        const x = gap + i * (barWidth + gap);
        const h = d.value * maxHeight;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={height - 20 - h}
              width={barWidth}
              height={h}
              rx={6}
              className={`bar bar-${d.accent}`}
            />
            <text
              x={x + barWidth / 2}
              y={height - 20 - h - 6}
              textAnchor="middle"
              className="bar-value"
            >
              {Math.round(d.value * 100)}%
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              className="bar-label"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data }: { data: typeof SURFACE_WINDOW }) {
  const width = 480;
  const height = 180;
  const padX = 24;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = innerW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - d.value) * innerH,
    label: d.label,
    value: d.value,
  }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="chart-svg"
      role="img"
      aria-label="Peak surfacing windows by hour"
    >
      <defs>
        <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--cocoa)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--cocoa)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((tick) => (
        <line
          key={tick}
          x1={padX}
          x2={width - padX}
          y1={padY + (1 - tick) * innerH}
          y2={padY + (1 - tick) * innerH}
          stroke="var(--hairline)"
          strokeDasharray="2 4"
        />
      ))}
      <path d={fillD} fill="url(#line-fill)" />
      <path d={pathD} fill="none" stroke="var(--cocoa)" strokeWidth={2.4} strokeLinecap="round" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--cocoa)" />
          <text x={p.x} y={height - 6} textAnchor="middle" className="bar-label">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AreaChart({ data }: { data: typeof DEMAND_DATA }) {
  const width = 980;
  const height = 200;
  const padX = 28;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = innerW / (data.hours.length - 1);

  const toPath = (series: number[]) =>
    series
      .map((v, i) => {
        const x = padX + i * stepX;
        const y = padY + (1 - v) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const baselineD = toPath(data.baseline);
  const actualD = toPath(data.actual);
  const baselineFill =
    baselineD +
    ` L ${padX + (data.baseline.length - 1) * stepX} ${height - padY} L ${padX} ${height - padY} Z`;
  const actualFill =
    actualD +
    ` L ${padX + (data.actual.length - 1) * stepX} ${height - padY} L ${padX} ${height - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="chart-svg"
      preserveAspectRatio="none"
      role="img"
      aria-label="Demand versus typical baseline"
    >
      <defs>
        <linearGradient id="baseline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--cocoa)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--cocoa)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="actual-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--spark)" stopOpacity="0.36" />
          <stop offset="100%" stopColor="var(--spark)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((tick) => (
        <line
          key={tick}
          x1={padX}
          x2={width - padX}
          y1={padY + (1 - tick) * innerH}
          y2={padY + (1 - tick) * innerH}
          stroke="var(--hairline)"
          strokeDasharray="2 4"
        />
      ))}
      <path d={baselineFill} fill="url(#baseline-fill)" />
      <path d={actualFill} fill="url(#actual-fill)" />
      <path d={baselineD} fill="none" stroke="var(--cocoa)" strokeWidth={2} />
      <path
        d={actualD}
        fill="none"
        stroke="var(--spark)"
        strokeWidth={2.4}
        strokeDasharray="6 3"
      />
      {data.hours.map((label, i) => (
        <text
          key={label}
          x={padX + i * stepX}
          y={height - 6}
          textAnchor="middle"
          className="bar-label"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
