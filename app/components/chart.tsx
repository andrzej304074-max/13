"use client";

import { useState } from "react";

/** Wykres liniowy wartości procentowych (0–100%) z podpowiedzią po najechaniu na punkt. */
export function Chart({
  points,
  label,
  ariaLabel,
  partialLast = false,
}: {
  points: number[];
  label: (i: number) => string;
  ariaLabel: string;
  partialLast?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 420, H = 200, L = 36, R = 12, T = 12, B = 24;
  // Procent poprawnych odpowiedzi zawsze mieści się w 0–100%.
  const min = 0;
  const max = 100;
  const x = (i: number) => (points.length === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + ((max - v) * (H - T - B)) / (max - min);
  const ticks = [];
  for (let v = min; v <= max; v += 25) ticks.push(v);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p)}`).join(" ");
  const step = points.length > 1 ? (W - L - R) / (points.length - 1) : W;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
      {ticks.map((v) => (
        <g key={v}>
          <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={L - 6} y={y(v) + 4} textAnchor="end">{v}%</text>
        </g>
      ))}
      <path className="line" d={path} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            className={partialLast && i === points.length - 1 ? "dot partial" : "dot"}
            cx={x(i)}
            cy={y(p)}
            r={hover === i ? 5 : 4}
          />
          <rect x={x(i) - step / 2} y={T} width={step} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} />
        </g>
      ))}
      {hover !== null && (
        <text x={Math.min(Math.max(x(hover), L + 30), W - R - 30)} y={H - 6} textAnchor="middle" style={{ fill: "var(--text)", fontWeight: 600 }}>
          {label(hover)}
        </text>
      )}
    </svg>
  );
}
