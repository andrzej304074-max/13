"use client";

import { useState } from "react";

export interface StackBar { label: string; a: number; b: number; tip: string }

/**
 * Pionowe słupki skumulowane (dwie serie: `a` na dole, `b` na górze) w skali 0–100% – po najechaniu podpowiedź.
 * Serie mają kolory z tokenów --s-a / --s-b, legenda i etykiety tekstowe są obok.
 */
export function StackBars({ bars, ariaLabel, onPick, picked }: {
  bars: StackBar[];
  ariaLabel: string;
  onPick?: (i: number) => void;
  picked?: (i: number) => boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 420, H = 210, L = 34, R = 6, T = 10, B = 26;
  const bw = (W - L - R) / Math.max(1, bars.length);
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const h = hover !== null ? bars[hover] : null;
  return (
    <div className="stack-bars">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end">{v}%</text>
          </g>
        ))}
        {bars.map((b, i) => {
          const tot = b.a + b.b || 1;
          const pa = (b.a / tot) * 100;
          const x = L + i * bw + bw * 0.15, w = bw * 0.7;
          const dim = picked && !picked(i);
          return (
            <g key={i} opacity={dim ? 0.35 : 1} onMouseEnter={() => setHover(i)} onClick={() => onPick?.(i)} style={{ cursor: onPick ? "pointer" : undefined }}>
              {/* dolny segment (seria a) i górny (seria b) z 2 px przerwą */}
              <rect className="s-a" x={x} y={y(pa)} width={w} height={Math.max(0, y(0) - y(pa))} rx={2} />
              <rect className="s-b" x={x} y={y(100)} width={w} height={Math.max(0, y(pa) - y(100) - 2)} rx={2} />
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              {(bars.length <= 12 || i % 2 === 0) && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle">{b.label}</text>}
            </g>
          );
        })}
      </svg>
      {h && <div className="chart-tip" role="status">{h.tip}</div>}
    </div>
  );
}

/** Koło (pierścień) dwóch części z liczbami w środku. */
export function Donut({ a, b, center, ariaLabel }: { a: number; b: number; center: string; ariaLabel: string }) {
  const r = 52, c = 2 * Math.PI * r, tot = a + b || 1;
  const la = (a / tot) * c;
  return (
    <svg className="donut" viewBox="0 0 140 140" role="img" aria-label={ariaLabel}>
      <circle cx="70" cy="70" r={r} className="donut-b" />
      {a > 0 && <circle cx="70" cy="70" r={r} className="donut-a" strokeDasharray={`${Math.max(0, la - 2)} ${c}`} transform="rotate(-90 70 70)" />}
      <text x="70" y="76" textAnchor="middle" className="donut-c">{center}</text>
    </svg>
  );
}
