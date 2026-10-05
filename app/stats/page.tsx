"use client";

import { useEffect, useState } from "react";
import { api, fmtPct, fmtPoints } from "@/lib/client";
import type { Stats } from "@/lib/tests";

const TYPE_LABEL = { single: "jednokrotny", multi: "wielokrotny" } as const;

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Ładowanie…</p>;

  const { overall, byType, history } = stats;
  return (
    <div className="stack">
      <h1>Statystyki</h1>
      <p className="muted">Wyniki sumowane ze wszystkich zakończonych testów wszystkich użytkowników.</p>
      <div className="card">
        <div className="big">{fmtPct(overall.percent)}</div>
        <p className="muted" style={{ margin: 0 }}>
          {fmtPoints(overall.score)} / {fmtPoints(overall.maxScore)} pkt · testów: {overall.tests}
        </p>
      </div>
      <div className="stat-grid">
        {(["single", "multi"] as const).map((t) => (
          <div className="stat" key={t}>
            <div className="value">{fmtPct(byType[t].percent)}</div>
            <div className="label">
              {TYPE_LABEL[t]} · {fmtPoints(byType[t].score)}/{fmtPoints(byType[t].maxScore)} pkt · {byType[t].tests} testów
            </div>
          </div>
        ))}
      </div>

      <h2>Postęp (% kolejnych testów)</h2>
      {history.length === 0 ? (
        <p className="muted">Brak zakończonych testów.</p>
      ) : (
        <>
          <div className="card"><Chart points={history.map((h) => h.percent)} /></div>
          <div className="card">
            <table>
              <thead><tr><th>#</th><th>Data</th><th>Typ</th><th>Punkty</th><th>%</th></tr></thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={h.id}>
                    <td>{history.length - i}</td>
                    <td>{new Date(h.finishedAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td>{TYPE_LABEL[h.type]}</td>
                    <td>{fmtPoints(h.score)} / {fmtPoints(h.maxScore)}</td>
                    <td>{fmtPct(h.percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Chart({ points }: { points: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 420, H = 200, L = 36, R = 12, T = 12, B = 24;
  // Wynik może być ujemny (−1 pkt za błędy w jednokrotnym), więc oś zaczyna się poniżej zera, jeśli trzeba.
  const min = Math.min(0, Math.floor(Math.min(...points) / 25) * 25);
  const max = 100;
  const x = (i: number) => (points.length === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + ((max - v) * (H - T - B)) / (max - min);
  const ticks = [];
  for (let v = min; v <= max; v += 25) ticks.push(v);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p)}`).join(" ");
  const step = points.length > 1 ? (W - L - R) / (points.length - 1) : W;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wynik procentowy kolejnych testów" onMouseLeave={() => setHover(null)}>
      {ticks.map((v) => (
        <g key={v}>
          <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={L - 6} y={y(v) + 4} textAnchor="end">{v}%</text>
        </g>
      ))}
      <path className="line" d={path} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle className="dot" cx={x(i)} cy={y(p)} r={hover === i ? 5 : 4} />
          <rect x={x(i) - step / 2} y={T} width={step} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} />
        </g>
      ))}
      {hover !== null && (
        <text x={Math.min(Math.max(x(hover), L + 30), W - R - 30)} y={H - 6} textAnchor="middle" style={{ fill: "var(--text)", fontWeight: 600 }}>
          Test {hover + 1}: {fmtPct(points[hover])}
        </text>
      )}
    </svg>
  );
}
