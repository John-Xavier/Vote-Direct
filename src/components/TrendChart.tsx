// Simple dependency-free SVG line chart for 12-week trend history.

export interface TrendSeries {
  label: string;
  color: string;
  points: number[]; // 0..1 per week
}

export function TrendChart({
  series,
  height = 160,
}: {
  series: TrendSeries[];
  height?: number;
}) {
  const width = 480;
  const padL = 34;
  const padB = 22;
  const padT = 10;
  const padR = 10;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const weeks = Math.max(...series.map((s) => s.points.length), 1);
  const x = (i: number) => padL + (weeks <= 1 ? 0 : (i / (weeks - 1)) * w);
  const y = (v: number) => padT + (1 - v) * h;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="12-week trend chart of vote share"
    >
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke="#1F1D1A" strokeOpacity={0.08} />
          <text x={4} y={y(v) + 4} fontSize={10} fill="#5E5A54">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <text x={padL} y={height - 6} fontSize={10} fill="#5E5A54">
        12 wks ago
      </text>
      <text x={width - padR} y={height - 6} fontSize={10} fill="#5E5A54" textAnchor="end">
        now
      </text>
      {series.map((s) => {
        const d = s.points
          .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
          .join(' ');
        return (
          <g key={s.label}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
            {s.points.length > 0 && (
              <circle cx={x(s.points.length - 1)} cy={y(s.points[s.points.length - 1])} r={3} fill={s.color} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
