import { useId } from "react";
import type { GraphSpec } from "@/lib/nauka-types";

type Shape = "down" | "up" | "vertical";

/** Rodzaje wykresów – ta sama konfiguracja jest w tools/nauka/build_zrozum.py (GRAPHS). */
export const GRAPHS: Record<string, { curves: Record<string, Shape>; x: string; y: string }> = {
  sd: { curves: { D: "down", S: "up" }, x: "Ilość (Q)", y: "Cena (P)" },
  adas: { curves: { AD: "down", SRAS: "up", LRAS: "vertical" }, x: "Produkcja (Y)", y: "Poziom cen (P)" },
  islm: { curves: { IS: "down", LM: "up" }, x: "Dochód (Y)", y: "Stopa procentowa (r)" },
  praca: { curves: { DL: "down", SL: "up" }, x: "Zatrudnienie (L)", y: "Płaca realna (W/P)" },
  pieniadz: { curves: { MD: "down", MS: "vertical" }, x: "Ilość pieniądza (M)", y: "Stopa procentowa (i)" },
  waluta: { curves: { D: "down", S: "up" }, x: "Ilość euro", y: "Kurs PLN/EUR" },
  fundusze: { curves: { D: "down", S: "up" }, x: "Fundusze pożyczkowe", y: "Stopa procentowa (r)" },
};

// Układ w jednostkach 0–10; krzywe jako odcinki, przesunięcie o 1 = 1,6 jednostki w poziomie.
const STEP = 1.6;
const W = 340, H = 240, L = 40, R = 40, T = 14, B = 34;
const sx = (x: number) => L + (x / 10) * (W - L - R);
const sy = (y: number) => T + ((10 - y) / 10) * (H - T - B);

interface Line { name: string; shape: Shape; x1: number; y1: number; x2: number; y2: number }

function line(name: string, shape: Shape, shift: number): Line {
  const d = shift * STEP;
  if (shape === "vertical") return { name, shape, x1: 5 + d, y1: 0.8, x2: 5 + d, y2: 9.4 };
  if (shape === "down") return { name, shape, x1: 1 + d, y1: 9, x2: 9 + d, y2: 1 };
  return { name, shape, x1: 1 + d, y1: 1, x2: 9 + d, y2: 9 };
}

/** Punkt przecięcia dwóch prostych (nieskończonych) albo null. */
function cross(a: Line, b: Line): { x: number; y: number } | null {
  const d = (a.x1 - a.x2) * (b.y1 - b.y2) - (a.y1 - a.y2) * (b.x1 - b.x2);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((a.x1 - b.x1) * (b.y1 - b.y2) - (a.y1 - b.y1) * (b.x1 - b.x2)) / d;
  return { x: a.x1 + t * (a.x2 - a.x1), y: a.y1 + t * (a.y2 - a.y1) };
}

function lines(spec: GraphSpec, shifted: boolean): Line[] {
  const conf = GRAPHS[spec.k];
  return Object.entries(conf.curves).map(([name, shape]) => line(name, shape, shifted ? spec.shift[name] ?? 0 : 0));
}

/** Równowaga: przecięcie pierwszej krzywej opadającej z pierwszą rosnącą (albo pionową). */
function equilibrium(ls: Line[]) {
  const down = ls.find((l) => l.shape === "down");
  const other = ls.find((l) => l.shape === "up") ?? ls.find((l) => l.shape === "vertical");
  return down && other ? cross(down, other) : null;
}

/**
 * Wykres przesunięć krzywych.
 * mode "before" – stan wyjściowy; "after" – stan wyjściowy przerywaną linią i stan po przesunięciu.
 */
export function Graph({ spec, mode = "after" }: { spec: GraphSpec; mode?: "before" | "after" }) {
  const arrow = `arr${useId().replace(/:/g, "")}`;
  const conf = GRAPHS[spec.k];
  if (!conf) return null;
  const before = lines(spec, false);
  const moved = Object.keys(spec.shift).length > 0 && mode === "after";
  const after = moved ? lines(spec, true) : before;
  const e0 = equilibrium(before), e1 = equilibrium(after);
  const name = (n: string) => spec.names[n] ?? n;
  const changed = new Set(Object.keys(spec.shift));
  // krótka etykieta (D, S, AD…) tuż za końcem krzywej; pełne nazwy w legendzie pod wykresem
  const label = (l: Line) => ({ x: sx(l.x2) + 4, y: sy(l.y2) + 4 });
  const desc = `${spec.y ?? conf.y} względem ${spec.x ?? conf.x}` + (moved ? `; przesunięcie: ${Object.entries(spec.shift).map(([k, v]) => `${name(k)} ${v > 0 ? "w prawo" : "w lewo"}`).join(", ")}` : "");
  const legend = Object.keys(spec.names).map((k) => `${k} – ${name(k)}`).join(" · ");
  return (
    <figure className="graph-fig">
    <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Wykres: ${desc}`}>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="graph-arrowhead" />
        </marker>
      </defs>
      <line className="graph-axis" x1={sx(0)} y1={sy(0)} x2={sx(10)} y2={sy(0)} markerEnd={`url(#${arrow})`} />
      <line className="graph-axis" x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(10)} markerEnd={`url(#${arrow})`} />
      <text className="graph-axis-label" x={sx(10)} y={H - 8} textAnchor="end">{spec.x ?? conf.x}</text>
      <text className="graph-axis-label" x={8} y={T + 4} transform={`rotate(-90 8 ${T + 4})`} textAnchor="end">{spec.y ?? conf.y}</text>
      {[e0, moved ? e1 : null].map((e, i) =>
        e ? (
          <g key={i} className={i === 0 && moved ? "graph-eq old" : "graph-eq"}>
            <line x1={sx(0)} y1={sy(e.y)} x2={sx(e.x)} y2={sy(e.y)} />
            <line x1={sx(e.x)} y1={sy(0)} x2={sx(e.x)} y2={sy(e.y)} />
            <circle cx={sx(e.x)} cy={sy(e.y)} r={4} />
            <text x={sx(e.x) + 6} y={sy(e.y) - 6}>{moved ? `E${i}` : "E"}</text>
          </g>
        ) : null,
      )}
      {before.map((l) => (
        <g key={`b${l.name}`} className={moved && changed.has(l.name) ? "graph-curve old" : `graph-curve c-${l.shape}`}>
          <line x1={sx(l.x1)} y1={sy(l.y1)} x2={sx(l.x2)} y2={sy(l.y2)} />
          <text {...label(l)}>{l.name}{moved && changed.has(l.name) ? "₀" : ""}</text>
        </g>
      ))}
      {moved &&
        after.filter((l) => changed.has(l.name)).map((l) => (
          <g key={`a${l.name}`} className={`graph-curve new c-${l.shape}`}>
            <line x1={sx(l.x1)} y1={sy(l.y1)} x2={sx(l.x2)} y2={sy(l.y2)} />
            <text {...label(l)}>{l.name}₁</text>
          </g>
        ))}
      {moved &&
        before.filter((l) => changed.has(l.name)).map((l) => {
          const mx = (l.x1 + l.x2) / 2, my = (l.y1 + l.y2) / 2, d = (spec.shift[l.name] ?? 0) * STEP;
          return <line key={`m${l.name}`} className="graph-move" x1={sx(mx + Math.sign(d) * 0.2)} y1={sy(my)} x2={sx(mx + d - Math.sign(d) * 0.25)} y2={sy(my)} markerEnd={`url(#${arrow})`} />;
        })}
    </svg>
    {legend && <figcaption className="graph-legend">{legend}</figcaption>}
    </figure>
  );
}
