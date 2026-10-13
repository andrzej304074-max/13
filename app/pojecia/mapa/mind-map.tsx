"use client";

import { useLayoutEffect, useRef, useState } from "react";

export interface MapNode { id: string; t: string; topic: string; w: number; reason: string }
export interface MapRing { node: MapNode; children: MapNode[] }

/** Podział podpisu na linie (najwyżej `max` linii, z wielokropkiem). */
function wrap(text: string, per: number, max: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= per) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const keep = lines.slice(0, max);
    keep[max - 1] = keep[max - 1].slice(0, per - 1).replace(/\s+\S*$/, "") + "…";
    return keep;
  }
  return lines.map((l) => (l.length > per + 4 ? l.slice(0, per + 3) + "…" : l));
}

interface Placed { node: MapNode; x: number; y: number; lines: string[]; w: number; h: number; level: 0 | 1 | 2; parent?: string }

/**
 * Mapa myśli w SVG: pojęcie w środku, powiązane wokół (grubość linii = siła powiązania, kolor = temat),
 * opcjonalnie drugi poziom. Węzły przesuwają się płynnie przy zmianie środka (klucz = id hasła).
 */
export function MindMap({ center, ring: ring0, colors, onPick }: {
  center: MapNode; ring: MapRing[]; colors: Record<string, string>; onPick: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  // szerokość ustalona przed pierwszym rysowaniem – węzły nie „przejeżdżają” z układu szerokiego do wąskiego
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    setNarrow(el.clientWidth < 620);
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 620));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const deep = ring0.some((r) => r.children.length > 0);
  // na wąskim ekranie przy 2 poziomach: najwyżej 8 powiązań po 2 dalsze, wyższa mapa
  const ring = narrow && deep ? ring0.slice(0, 8).map((r) => ({ ...r, children: r.children.slice(0, 2) })) : ring0;
  const W = narrow ? 600 : 1000;
  const H = narrow ? (deep ? 1180 : 820) : deep ? 760 : 620;
  const font = narrow ? 21 : 15;
  const charW = font * 0.56, lineH = font * 1.25;
  const maxW = Math.max(...ring.map((r) => r.node.w), 1);

  const size = (text: string, level: 0 | 1 | 2) => {
    const per = level === 0 ? (narrow ? 16 : 22) : level === 1 ? (narrow ? 13 : 17) : narrow ? 11 : 14;
    const lines = wrap(text, per, level === 2 ? 2 : 3);
    const f = level === 0 ? 1.15 : level === 2 ? 0.86 : 1;
    const w = Math.max(...lines.map((l) => l.length)) * charW * f + 28;
    const h = lines.length * lineH * f + 20;
    return { lines, w, h };
  };
  const clamp = (v: number, half: number, lim: number) => Math.max(half + 6, Math.min(lim - half - 6, v));

  const cx = W / 2, cy = H / 2;
  const placed: Placed[] = [{ node: center, x: cx, y: cy, level: 0, ...size(center.t, 0) }];
  const n = ring.length;
  const rx1 = W * (deep ? 0.27 : narrow ? 0.31 : 0.36), ry1 = H * (deep ? 0.25 : narrow ? 0.36 : 0.36);
  const rx2 = W * (narrow ? 0.4 : 0.43), ry2 = H * 0.43;
  ring.forEach((r, i) => {
    const a = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const s1 = size(r.node.t, 1);
    placed.push({ node: r.node, level: 1, x: clamp(cx + rx1 * Math.cos(a), s1.w / 2, W), y: clamp(cy + ry1 * Math.sin(a), s1.h / 2, H), ...s1 });
    const k = r.children.length;
    r.children.forEach((c, j) => {
      const spread = Math.min(0.5, (Math.PI * 2) / Math.max(n, 1) / 1.6);
      const b = a + (k === 1 ? 0 : (j / (k - 1) - 0.5) * spread);
      const s2 = size(c.t, 2);
      placed.push({ node: c, level: 2, parent: r.node.id, x: clamp(cx + rx2 * Math.cos(b), s2.w / 2, W), y: clamp(cy + ry2 * Math.sin(b), s2.h / 2, H), ...s2 });
    });
  });
  // rozsuwanie nachodzących na siebie węzłów (środek mapy stoi w miejscu), potem ponowne dociśnięcie do krawędzi
  for (let it = 0; it < 120; it++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
      const A = placed[i], Bn = placed[j];
      const ox = (A.w + Bn.w) / 2 + 8 - Math.abs(A.x - Bn.x), oy = (A.h + Bn.h) / 2 + 8 - Math.abs(A.y - Bn.y);
      if (ox <= 0 || oy <= 0) continue;
      moved = true;
      // przesunięcie wzdłuż osi o mniejszym nałożeniu
      const alongY = oy / (A.h + Bn.h) < ox / (A.w + Bn.w);
      const d = (alongY ? oy : ox) / 2 + 0.5;
      const sx = Math.sign(Bn.x - A.x) || 1, sy = Math.sign(Bn.y - A.y) || 1;
      for (const [P, sg, share] of [[A, -1, A.level === 0 ? 0 : 1], [Bn, 1, A.level === 0 ? 2 : 1]] as const) {
        if (P.level === 0 || share === 0) continue;
        if (alongY) P.y = clamp(P.y + sg * sy * d * share, P.h / 2, H);
        else P.x = clamp(P.x + sg * sx * d * share, P.w / 2, W);
      }
    }
    if (!moved) break;
  }
  const pos = new Map(placed.map((p) => [p.node.id, p]));

  const key = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); }
  };

  return (
    <div className="mind-map" ref={box} data-testid="mind-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Mapa pojęć powiązanych z: ${center.t}`} style={{ fontSize: font }}>
        <g className="mm-edges">
          {placed.filter((p) => p.level > 0).map((p) => {
            const from = p.level === 1 ? pos.get(center.id)! : pos.get(p.parent!)!;
            const col = colors[p.node.topic] ?? "var(--accent)";
            const sw = p.level === 1 ? 1.5 + (5 * p.node.w) / maxW : 1.2;
            return (
              <line key={`${center.id}>${p.parent ?? ""}>${p.node.id}`} x1={from.x} y1={from.y} x2={p.x} y2={p.y}
                stroke={col} strokeWidth={sw} strokeOpacity={p.level === 1 ? 0.55 : 0.35} strokeLinecap="round" className="mm-edge">
                <title>{p.node.reason}</title>
              </line>
            );
          })}
        </g>
        {placed.map((p) => {
          const col = colors[p.node.topic] ?? "var(--accent)";
          const f = p.level === 0 ? 1.15 : p.level === 2 ? 0.86 : 1;
          return (
            <g key={p.node.id} className={`mm-node l${p.level}`} style={{ transform: `translate(${p.x}px, ${p.y}px)`, ["--c" as string]: col }}
              role="button" tabIndex={0} aria-label={p.level === 0 ? `${p.node.t} (środek mapy)` : `${p.node.t} – ustaw w środku mapy`}
              onClick={() => p.level !== 0 && onPick(p.node.id)} onKeyDown={(e) => p.level !== 0 && key(e, p.node.id)} data-testid={`mm-node-${p.level}`} data-id={p.node.id}>
              <rect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} rx={p.level === 0 ? 18 : 12} />
              <text textAnchor="middle" style={{ fontSize: font * f }}>
                {p.lines.map((l, i) => (
                  <tspan key={i} x={0} y={(i - (p.lines.length - 1) / 2) * lineH * f + font * f * 0.35}>{l}</tspan>
                ))}
              </text>
              {p.level > 0 && <title>{`${p.node.t}\n${p.node.reason}`}</title>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
