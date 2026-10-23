import { useId } from "react";
import { Graph, GRAPHS } from "./graph";
import { PYRAMID_PL, SERIES } from "@/data/wykresy";

/**
 * Rysunki Podręcznika (blok z polem `fig`, tools/nauka/build_podrecznik.py – dyrektywa `::wykres`).
 * Wykresy przesunięć krzywych (sd, adas, islm, …) rysuje `Graph`; tu – krzywe o stałym kształcie (koszty, Phillips,
 * Laffer, Lorenz, KMP, monopol), piramida wieku, przejście demograficzne, macierze (BCG, Ansoff, GE, SWOT) i siatka Blake'a–Mouton.
 */
import type { FigSpec } from "@/lib/nauka-types";
export type { FigSpec };

const W = 340, H = 240, L = 40, R = 46, T = 14, B = 34;
type Pt = [number, number];

/** Układ współrzędnych 0…xmax × 0…ymax z osiami i podpisami. */
function frame(xmax: number, ymax: number) {
  const sx = (x: number) => L + (x / xmax) * (W - L - R);
  const sy = (y: number) => T + ((ymax - y) / ymax) * (H - T - B);
  const path = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join("");
  /** Krzywa y = f(x) na [a, b], ucięta do 0…ymax. */
  const fn = (f: (x: number) => number, a: number, b: number, n = 48): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n, y = f(x);
      if (y >= 0 && y <= ymax) out.push([x, y]);
    }
    return out;
  };
  return { sx, sy, path, fn };
}

function Axes({ x, y, arrow }: { x: string; y: string; arrow: string }) {
  return (
    <>
      <line className="graph-axis" x1={L} y1={H - B} x2={W - R + 30} y2={H - B} markerEnd={`url(#${arrow})`} />
      <line className="graph-axis" x1={L} y1={H - B} x2={L} y2={T - 6} markerEnd={`url(#${arrow})`} />
      <text className="graph-axis-label" x={W - 8} y={H - 8} textAnchor="end">{x}</text>
      <text className="graph-axis-label" x={10} y={T + 4} transform={`rotate(-90 10 ${T + 4})`} textAnchor="end">{y}</text>
    </>
  );
}

const Curve = ({ d, c, dash, label, at }: { d: string; c: number; dash?: boolean; label?: string; at?: Pt }) => (
  <g className={`bf-curve bf-c${c}`}>
    <path d={d} className={dash ? "dash" : ""} />
    {label && at && <text x={at[0]} y={at[1]}>{label}</text>}
  </g>
);

function last(pts: Pt[], f: ReturnType<typeof frame>): Pt {
  const [x, y] = pts[pts.length - 1];
  return [f.sx(x) + 4, f.sy(y) + 4];
}

function Plot({ k, o, arrow }: { k: string; o: Record<string, string | number>; arrow: string }) {
  switch (k) {
    case "koszty": {
      // TC = 6 + 5q − q² + 0,1q³ → MC przecina AVC i ATC w ich minimach
      const f = frame(10, 12);
      const mc = f.fn((q) => 5 - 2 * q + 0.3 * q * q, 0.4, 9.6), avc = f.fn((q) => 5 - q + 0.1 * q * q, 0.4, 9.6);
      const atc = f.fn((q) => 5 - q + 0.1 * q * q + 6 / q, 0.6, 9.6), afc = f.fn((q) => 6 / q, 0.55, 9.6);
      return (
        <>
          <Axes x="Ilość (Q)" y="Koszt" arrow={arrow} />
          <Curve d={f.path(afc)} c={4} dash label="AFC" at={last(afc, f)} />
          <Curve d={f.path(avc)} c={3} label="AVC" at={last(avc, f)} />
          <Curve d={f.path(atc)} c={1} label="ATC" at={last(atc, f)} />
          <Curve d={f.path(mc)} c={2} label="MC" at={last(mc, f)} />
          <circle className="bf-dot" cx={f.sx(5)} cy={f.sy(2.5)} r={3.5} />
          <circle className="bf-dot" cx={f.sx(6.2)} cy={f.sy(5 - 6.2 + 0.1 * 6.2 * 6.2 + 6 / 6.2)} r={3.5} />
        </>
      );
    }
    case "phillips": {
      const f = frame(10, 10);
      const pc = f.fn((u) => 0.6 + 8 / (u + 0.2), 0.8, 9.6);
      return (
        <>
          <Axes x="Stopa bezrobocia (u)" y="Inflacja (π)" arrow={arrow} />
          <Curve d={f.path(pc)} c={1} label="SRPC" at={last(pc, f)} />
          {o.dlugi ? <Curve d={f.path([[5, 0.4], [5, 9.6]])} c={3} label="LRPC (u*)" at={[f.sx(5) - 20, f.sy(9.6) - 2]} /> : null}
        </>
      );
    }
    case "laffer": {
      const f = frame(10, 10);
      const lc = f.fn((x) => 0.36 * x * (10 - x), 0, 10);
      const yA = 0.36 * 2.5 * 7.5;
      return (
        <>
          <Axes x="Stopa podatkowa (t)" y="Wpływy (T)" arrow={arrow} />
          <Curve d={f.path(lc)} c={1} />
          <line className="bf-guide" x1={f.sx(5)} y1={f.sy(0)} x2={f.sx(5)} y2={f.sy(9)} />
          <text className="bf-txt" x={f.sx(5)} y={H - B + 13} textAnchor="middle">t*</text>
          <text className="bf-txt" x={f.sx(0)} y={H - B + 13} textAnchor="middle">0%</text>
          <text className="bf-txt" x={f.sx(10)} y={H - B + 13} textAnchor="middle">100%</text>
          <line className="bf-guide" x1={f.sx(2.5)} y1={f.sy(yA)} x2={f.sx(7.5)} y2={f.sy(yA)} />
          <circle className="bf-dot" cx={f.sx(2.5)} cy={f.sy(yA)} r={3.5} /><text className="bf-txt" x={f.sx(2.5) - 12} y={f.sy(yA) - 6}>A</text>
          <circle className="bf-dot" cx={f.sx(7.5)} cy={f.sy(yA)} r={3.5} /><text className="bf-txt" x={f.sx(7.5) + 6} y={f.sy(yA) - 6}>B</text>
        </>
      );
    }
    case "lorenz": {
      const f = frame(10, 10);
      const lz = f.fn((x) => 10 * Math.pow(x / 10, 2.3), 0, 10);
      const area = `${f.path([[0, 0], [10, 10]])}${lz.slice().reverse().map(([x, y]) => `L${f.sx(x).toFixed(1)},${f.sy(y).toFixed(1)}`).join("")}Z`;
      return (
        <>
          <Axes x="Skumulowany % ludności" y="Skumulowany % dochodu" arrow={arrow} />
          <path className="bf-area" d={area} />
          <Curve d={f.path([[0, 0], [10, 10]])} c={3} dash label="równość" at={[f.sx(10) - 52, f.sy(10) - 4]} />
          <Curve d={f.path(lz)} c={1} label="Lorenz" at={[f.sx(7.6) + 6, f.sy(5.3) + 12]} />
          <text className="bf-txt big" x={f.sx(5.6)} y={f.sy(4.2)}>A</text>
          <text className="bf-txt big" x={f.sx(7.6)} y={f.sy(1.4)}>B</text>
        </>
      );
    }
    case "kmp": {
      const f = frame(10, 10);
      const pp = f.fn((x) => 9 * Math.sqrt(Math.max(0, 1 - (x / 9) ** 2)), 0, 9, 64);
      pp.push([9, 0]);
      const pts: [number, number, string, string][] = o.punkty
        ? [[5.4, 7.2, "A", "efektywny"], [3, 3, "B", "nieefektywny"], [7.8, 7.6, "C", "nieosiągalny"]] : [];
      return (
        <>
          <Axes x="Dobro X" y="Dobro Y" arrow={arrow} />
          <Curve d={f.path(pp)} c={1} label="KMP" at={[f.sx(6.6) + 6, f.sy(6.4) - 4]} />
          {pts.map(([x, y, n, d]) => (
            <g key={n}>
              <circle className={`bf-dot${n === "C" ? " out" : ""}`} cx={f.sx(x)} cy={f.sy(y)} r={4} />
              <text className="bf-txt" x={f.sx(x) + 7} y={f.sy(y) + 4}>{n} – {d}</text>
            </g>
          ))}
        </>
      );
    }
    case "monopol": {
      const f = frame(10, 10);
      const dl = f.fn((q) => 10 - q, 0, 9.5), mr = f.fn((q) => 10 - 2 * q, 0, 5);
      const dwl = `M${f.sx(4)},${f.sy(6)}L${f.sx(8)},${f.sy(2)}L${f.sx(4)},${f.sy(2)}Z`;
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <path className="bf-area loss" d={dwl} />
          <Curve d={f.path(dl)} c={1} label="D" at={last(dl, f)} />
          <Curve d={f.path(mr)} c={4} label="MR" at={last(mr, f)} />
          <Curve d={f.path([[0, 2], [9.5, 2]])} c={2} label="MC" at={[f.sx(9.5) + 4, f.sy(2) + 4]} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(6)} x2={f.sx(4)} y2={f.sy(6)} />
          <line className="bf-guide" x1={f.sx(4)} y1={f.sy(0)} x2={f.sx(4)} y2={f.sy(6)} />
          <line className="bf-guide" x1={f.sx(8)} y1={f.sy(0)} x2={f.sx(8)} y2={f.sy(2)} />
          <circle className="bf-dot" cx={f.sx(4)} cy={f.sy(6)} r={3.5} />
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(6) + 4} textAnchor="end">Pₘ</text>
          <text className="bf-txt" x={f.sx(4)} y={H - B + 13} textAnchor="middle">Qₘ</text>
          <text className="bf-txt" x={f.sx(8)} y={H - B + 13} textAnchor="middle">Q_k</text>
        </>
      );
    }
    case "przejscie": {
      // cztery fazy (Notestein): I – dużo urodzeń i zgonów, II – spadają zgony, III – spadają urodzenia, IV – mało obu
      const f = frame(8, 50);
      const ease = (a: number, b: number, x0: number, x1: number) => (x: number) =>
        x <= x0 ? a : x >= x1 ? b : a + (b - a) * (1 - Math.cos(((x - x0) / (x1 - x0)) * Math.PI)) / 2;
      const birth = ease(40, 11, 4, 6), death = ease(37, 10, 2, 4);
      const bl = f.fn(birth, 0, 8, 80), dl = f.fn(death, 0, 8, 80);
      const gap = `${f.path(bl)}${dl.slice().reverse().map(([x, y]) => `L${f.sx(x).toFixed(1)},${f.sy(y).toFixed(1)}`).join("")}Z`;
      return (
        <>
          <Axes x="Czas (fazy)" y="Na 1000 mieszkańców" arrow={arrow} />
          <path className="bf-area" d={gap} />
          {[2, 4, 6].map((x) => <line key={x} className="bf-guide" x1={f.sx(x)} y1={f.sy(0)} x2={f.sx(x)} y2={f.sy(48)} />)}
          {["I", "II", "III", "IV"].map((n, i) => <text key={n} className="bf-txt" x={f.sx(i * 2 + 1)} y={f.sy(46)} textAnchor="middle">{n}</text>)}
          <Curve d={f.path(bl)} c={1} label="urodzenia" at={[f.sx(0.15), f.sy(40) - 9]} />
          <Curve d={f.path(dl)} c={2} label="zgony" at={[f.sx(0.15), f.sy(37) + 14]} />
          <text className="bf-txt" x={f.sx(3.1)} y={f.sy(26)}>przyrost naturalny</text>
        </>
      );
    }
    case "piramida": {
      const typ = String(o.typ ?? "progresywna");
      const M: Record<string, number[]> = {
        progresywna: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0.4],
        ustabilizowana: [6, 6, 6, 6, 6, 5.6, 5, 4, 2.6, 1],
        regresywna: [4, 4.4, 5, 6, 6.6, 6.6, 6, 5, 3.4, 1.6],
      };
      const men = M[typ] ?? M.progresywna;
      const women = men.map((v, i) => v * (i >= 6 ? 1 + (i - 5) * 0.12 : 1));
      const cx = W / 2, bw = 13, top = T + 6, scale = 13;
      return (
        <>
          {men.map((m, i) => {
            const y = top + (9 - i) * (bw + 4);
            return (
              <g key={i}>
                <rect className="bf-bar m" x={cx - 18 - m * scale} y={y} width={m * scale} height={bw} rx={2} />
                <rect className="bf-bar f" x={cx + 18} y={y} width={women[i] * scale} height={bw} rx={2} />
                <text className="bf-txt small" x={cx} y={y + bw - 3} textAnchor="middle">{i === 9 ? "90+" : `${i * 10}–${i * 10 + 9}`}</text>
              </g>
            );
          })}
          <text className="graph-axis-label" x={cx - 24} y={H - 8} textAnchor="end">♂ mężczyźni</text>
          <text className="graph-axis-label" x={cx + 24} y={H - 8}>kobiety ♀</text>
        </>
      );
    }
    case "macierz": {
      const P: Record<string, { x: [string, string]; y: [string, string]; cols: string[]; rows: string[]; cells: string[][]; tone?: number[][] }> = {
        bcg: { x: ["Względny udział w rynku", ""], y: ["Tempo wzrostu rynku", ""], cols: ["wysoki", "niski"], rows: ["wysokie", "niskie"],
          cells: [["⭐ Gwiazdy", "❓ Znaki zapytania"], ["🐄 Dojne krowy", "🐕 Psy"]], tone: [[1, 4], [3, 2]] },
        ansoff: { x: ["Produkty", ""], y: ["Rynki", ""], cols: ["obecne", "nowe"], rows: ["nowe", "obecne"],
          cells: [["Rozwój rynku", "Dywersyfikacja"], ["Penetracja rynku", "Rozwój produktu"]], tone: [[4, 2], [3, 1]] },
        swot: { x: ["Wpływ", ""], y: ["Źródło", ""], cols: ["pozytywny", "negatywny"], rows: ["wewnętrzne", "zewnętrzne"],
          cells: [["S – mocne strony", "W – słabe strony"], ["O – szanse", "T – zagrożenia"]], tone: [[3, 2], [1, 4]] },
        wiezien: { x: ["Gracz B", ""], y: ["Gracz A", ""], cols: ["współpracuje", "zdradza"], rows: ["współpracuje", "zdradza"],
          cells: [["−1 / −1", "−10 / 0"], ["0 / −10", "−5 / −5 (Nash)"]], tone: [[3, 4], [4, 2]] },
        ge: { x: ["Pozycja konkurencyjna", ""], y: ["Atrakcyjność sektora", ""], cols: ["silna", "średnia", "słaba"], rows: ["wysoka", "średnia", "niska"],
          cells: [["Inwestuj", "Inwestuj", "Selektywnie"], ["Inwestuj", "Selektywnie", "Zbieraj"], ["Selektywnie", "Zbieraj", "Zbieraj"]],
          tone: [[3, 3, 4], [3, 4, 2], [4, 2, 2]] },
      };
      const p = P[String(o.preset ?? "bcg")] ?? P.bcg;
      const n = p.cols.length, gx = 74, gy = 22, gw = W - gx - 12, gh = H - gy - 40, cw = gw / n, ch = gh / n;
      return (
        <>
          {p.cells.map((row, r) => row.map((c, ci) => (
            <g key={`${r}-${ci}`}>
              <rect className={`bf-cell t${p.tone?.[r][ci] ?? 1}`} x={gx + ci * cw} y={gy + r * ch} width={cw} height={ch} />
              <text className="bf-txt cell" x={gx + ci * cw + cw / 2} y={gy + r * ch + ch / 2 + 4} textAnchor="middle">{c}</text>
            </g>
          )))}
          {p.cols.map((c, i) => <text key={c + i} className="bf-txt small" x={gx + i * cw + cw / 2} y={gy + gh + 13} textAnchor="middle">{c}</text>)}
          {p.rows.map((c, i) => <text key={c + i} className="bf-txt small" x={gx - 5} y={gy + i * ch + ch / 2 + 4} textAnchor="end">{c}</text>)}
          <text className="graph-axis-label" x={gx + gw / 2} y={H - 6} textAnchor="middle">{p.x[0]} →</text>
          <text className="graph-axis-label" x={12} y={gy + gh / 2} transform={`rotate(-90 12 ${gy + gh / 2})`} textAnchor="middle">{p.y[0]} →</text>
        </>
      );
    }
    case "nadwyzka": {
      // popyt P = 9 − 0,8Q, podaż P = 1 + 0,8Q → równowaga Q = 5, P = 5
      const f = frame(10, 10);
      const d = f.fn((q) => 9 - 0.8 * q, 0, 10), sp = f.fn((q) => 1 + 0.8 * q, 0, 10);
      const poly = (pts: Pt[]) => `${f.path(pts)}Z`;
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <path className="bf-area cs" d={poly([[0, 9], [5, 5], [0, 5]])} />
          <path className="bf-area ps" d={poly([[0, 1], [5, 5], [0, 5]])} />
          <Curve d={f.path(d)} c={1} label="D" at={last(d, f)} />
          <Curve d={f.path(sp)} c={2} label="S" at={last(sp, f)} />
          <line className="bf-guide" x1={f.sx(5)} y1={f.sy(0)} x2={f.sx(5)} y2={f.sy(5)} />
          <circle className="bf-dot" cx={f.sx(5)} cy={f.sy(5)} r={3.5} />
          <text className="bf-txt small" x={f.sx(0.3)} y={f.sy(6.1)}>nadwyżka konsumenta</text>
          <text className="bf-txt small" x={f.sx(0.3)} y={f.sy(3.4)}>nadwyżka producenta</text>
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(5) + 4} textAnchor="end">P*</text>
          <text className="bf-txt" x={f.sx(5)} y={H - B + 13} textAnchor="middle">Q*</text>
        </>
      );
    }
    case "podatek": {
      // podatek t = 2 na jednostkę: S przesuwa się w górę; nowa ilość 3,75, kupujący płacą 6, sprzedający dostają 4
      const f = frame(10, 10);
      const d = f.fn((q) => 9 - 0.8 * q, 0, 10), s1 = f.fn((q) => 1 + 0.8 * q, 0, 10), s2 = f.fn((q) => 3 + 0.8 * q, 0, 8.5);
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <path className="bf-area ps" d={`${f.path([[0, 4], [3.75, 4], [3.75, 6], [0, 6]])}Z`} />
          <path className="bf-area loss" d={`${f.path([[3.75, 6], [5, 5], [3.75, 4]])}Z`} />
          <Curve d={f.path(d)} c={1} label="D" at={last(d, f)} />
          <Curve d={f.path(s1)} c={2} label="S" at={last(s1, f)} />
          <Curve d={f.path(s2)} c={4} dash label="S + t" at={last(s2, f)} />
          <line className="bf-guide" x1={f.sx(3.75)} y1={f.sy(0)} x2={f.sx(3.75)} y2={f.sy(6)} />
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(6) + 4} textAnchor="end">P_k</text>
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(4) + 4} textAnchor="end">P_s</text>
          <text className="bf-txt small" x={f.sx(0.4)} y={f.sy(5) + 4}>wpływy z podatku</text>
          <text className="bf-txt small" x={f.sx(5.2)} y={f.sy(5) + 4}>strata</text>
        </>
      );
    }
    case "cena": {
      // cena maksymalna poniżej równowagi → niedobór; minimalna powyżej → nadwyżka
      const f = frame(10, 10);
      const max = String(o.typ ?? "max") !== "min";
      const p = max ? 3.5 : 6.5, qs = (p - 1) / 0.8, qd = (9 - p) / 0.8;
      const d = f.fn((q) => 9 - 0.8 * q, 0, 10), sp = f.fn((q) => 1 + 0.8 * q, 0, 10);
      const [a, b] = max ? [qs, qd] : [qd, qs];
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <Curve d={f.path(d)} c={1} label="D" at={last(d, f)} />
          <Curve d={f.path(sp)} c={2} label="S" at={last(sp, f)} />
          <Curve d={f.path([[0, p], [9.6, p]])} c={3} dash label={max ? "cena maks." : "cena min."} at={[f.sx(0.2), f.sy(p) + (max ? 14 : -6)]} />
          <line className="bf-guide" x1={f.sx(a)} y1={f.sy(0)} x2={f.sx(a)} y2={f.sy(p)} />
          <line className="bf-guide" x1={f.sx(b)} y1={f.sy(0)} x2={f.sx(b)} y2={f.sy(p)} />
          <line className="bf-span" x1={f.sx(a)} y1={f.sy(p) + (max ? 10 : -10)} x2={f.sx(b)} y2={f.sy(p) + (max ? 10 : -10)} />
          <text className="bf-txt small" x={f.sx((a + b) / 2)} y={f.sy(p) + (max ? 24 : -16)} textAnchor="middle">{max ? "niedobór" : "nadwyżka"}</text>
          <circle className="bf-dot out" cx={f.sx(5)} cy={f.sy(5)} r={3} />
        </>
      );
    }
    case "elastycznosc": {
      const f = frame(10, 10);
      const flat = f.fn((q) => 5 - 0.25 * (q - 5), 0, 10), steep = f.fn((q) => 5 - 2.5 * (q - 5), 3, 7);
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <Curve d={f.path(flat)} c={1} label="elastyczny" at={[f.sx(7.4), f.sy(4.2) + 14]} />
          <Curve d={f.path(steep)} c={2} label="nieelastyczny" at={[f.sx(6.2) + 4, f.sy(2) + 4]} />
          <circle className="bf-dot" cx={f.sx(5)} cy={f.sy(5)} r={3.5} />
          <text className="bf-txt small" x={f.sx(0.3)} y={f.sy(9.4)}>ta sama zmiana ceny:</text>
          <text className="bf-txt small" x={f.sx(0.3)} y={f.sy(8.7)}>duża zmiana ilości (płaska) – mała (stroma)</text>
        </>
      );
    }
    case "obojetnosc": {
      // linia budżetu X + Y = 8, krzywe obojętności XY = 9, 16, 25; optimum E(4, 4)
      const f = frame(10, 10);
      const ic = (k: number) => f.fn((x) => k / x, k / 10, 10, 60);
      return (
        <>
          <Axes x="Dobro X" y="Dobro Y" arrow={arrow} />
          <Curve d={f.path([[0, 8], [8, 0]])} c={2} label="linia budżetu" at={[f.sx(0.3), f.sy(8.4)]} />
          <Curve d={f.path(ic(9))} c={4} dash label="U₁" at={last(ic(9), f)} />
          <Curve d={f.path(ic(16))} c={1} label="U₂" at={last(ic(16), f)} />
          <Curve d={f.path(ic(25))} c={4} dash label="U₃" at={last(ic(25), f)} />
          <circle className="bf-dot" cx={f.sx(4)} cy={f.sy(4)} r={4} />
          <text className="bf-txt" x={f.sx(4) + 7} y={f.sy(4) - 6}>E</text>
        </>
      );
    }
    case "oligopol": {
      // załamana krzywa popytu: powyżej ceny P* popyt elastyczny, poniżej – nieelastyczny; luka w MR
      const f = frame(10, 10);
      const d1 = f.fn((q) => 6 + 0.4 * (4 - q), 0, 4), d2 = f.fn((q) => 6 - 1.5 * (q - 4), 4, 8);
      const mr1 = f.fn((q) => 7.6 - 0.8 * q, 0, 4), mr2 = f.fn((q) => 12 - 3 * q, 4, 4.6);
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <Curve d={f.path([...d1, ...d2])} c={1} label="D" at={last(d2, f)} />
          <Curve d={f.path(mr1)} c={4} label="MR" at={[f.sx(1.2), f.sy(6.6) + 14]} />
          <Curve d={f.path(mr2)} c={4} />
          <line className="bf-span" x1={f.sx(4)} y1={f.sy(4.4)} x2={f.sx(4)} y2={f.sy(0)} />
          <Curve d={f.path(f.fn((q) => 1 + 0.5 * q, 0, 9))} c={2} label="MC" at={[f.sx(9) + 4, f.sy(5.5) + 4]} />
          <circle className="bf-dot" cx={f.sx(4)} cy={f.sy(6)} r={3.5} />
          <text className="bf-txt" x={f.sx(4) + 6} y={f.sy(6) - 6}>P*</text>
          <text className="bf-txt small" x={f.sx(4.3)} y={f.sy(2.2)}>luka MR</text>
        </>
      );
    }
    case "krzywaj": {
      // saldo handlowe po deprecjacji waluty: najpierw spada, potem rośnie powyżej poziomu wyjściowego
      const f = frame(10, 10);
      const j = f.fn((t) => 5 + 1.6 * (-2.5 * t * Math.exp(1 - t) + 3 * (1 - Math.exp(-t / 4))), 0, 10, 80);
      return (
        <>
          <Axes x="Czas" y="Saldo handlowe" arrow={arrow} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(5)} x2={f.sx(10)} y2={f.sy(5)} />
          <text className="bf-txt small" x={f.sx(10)} y={f.sy(5) - 5} textAnchor="end">saldo przed deprecjacją</text>
          <Curve d={f.path(j)} c={1} label="J" at={last(j, f)} />
          <line className="bf-guide" x1={f.sx(0.05)} y1={f.sy(0.5)} x2={f.sx(0.05)} y2={f.sy(9)} />
          <text className="bf-txt small" x={f.sx(0.3)} y={f.sy(8.6)}>deprecjacja</text>
        </>
      );
    }
    case "beveridge": {
      const f = frame(10, 10);
      const bc = f.fn((u) => 9 / (u + 0.4) + 0.3, 0.6, 9.6), bc2 = f.fn((u) => 13 / (u + 0.4) + 0.9, 0.9, 9.6);
      return (
        <>
          <Axes x="Stopa bezrobocia (u)" y="Stopa wolnych miejsc (v)" arrow={arrow} />
          <Curve d={f.path(bc)} c={1} label="BC₁" at={last(bc, f)} />
          {o.przesun ? <Curve d={f.path(bc2)} c={4} dash label="BC₂" at={last(bc2, f)} /> : null}
          <text className="bf-txt small" x={f.sx(1.6)} y={f.sy(9.2)}>ożywienie: dużo wakatów, mało bezrobotnych</text>
          <text className="bf-txt small" x={f.sx(4.6)} y={f.sy(2.6)}>recesja: odwrotnie</text>
        </>
      );
    }
    case "cykl": {
      const f = frame(10, 10);
      const trend = f.fn((x) => 3 + 0.5 * x, 0, 10), real = f.fn((x) => 3 + 0.5 * x + 1.4 * Math.sin((2 * Math.PI * x) / 5), 0, 10, 100);
      const at = (x: number) => 3 + 0.5 * x + 1.4 * Math.sin((2 * Math.PI * x) / 5);
      return (
        <>
          <Axes x="Czas" y="PKB" arrow={arrow} />
          <Curve d={f.path(trend)} c={3} dash label="trend" at={last(trend, f)} />
          <Curve d={f.path(real)} c={1} />
          {[[1.25, "szczyt"], [3.75, "dno"], [6.25, "szczyt"], [8.75, "dno"]].map(([x, n]) => (
            <g key={String(x)}>
              <circle className="bf-dot" cx={f.sx(x as number)} cy={f.sy(at(x as number))} r={3} />
              <text className="bf-txt small" x={f.sx(x as number)} y={f.sy(at(x as number)) + (n === "dno" ? 14 : -7)} textAnchor="middle">{n}</text>
            </g>
          ))}
          <text className="bf-txt small" x={f.sx(2.5)} y={f.sy(0.8)} textAnchor="middle">recesja</text>
          <text className="bf-txt small" x={f.sx(5)} y={f.sy(0.8)} textAnchor="middle">ożywienie</text>
        </>
      );
    }
    case "dochodowosc": {
      const f = frame(10, 8);
      const typ = String(o.typ ?? "obie");
      const norm = f.fn((x) => 2 + 3 * (1 - Math.exp(-x / 3)), 0.2, 10), inv = f.fn((x) => 5.6 - 2.4 * (1 - Math.exp(-x / 3)), 0.2, 10);
      return (
        <>
          <Axes x="Termin zapadalności (lata)" y="Rentowność (%)" arrow={arrow} />
          {typ !== "odwrocona" && <Curve d={f.path(norm)} c={1} label="normalna" at={[f.sx(7), f.sy(4.6) - 6]} />}
          {typ !== "normalna" && <Curve d={f.path(inv)} c={2} dash={typ === "obie"} label="odwrócona" at={[f.sx(7), f.sy(3.3) + 14]} />}
          {[0, 5, 10].map((x) => <text key={x} className="bf-txt small" x={f.sx(x)} y={H - B + 13} textAnchor="middle">{x * 3}</text>)}
        </>
      );
    }
    case "solow": {
      // s·f(k) = 2,2√k, inwestycje odtworzeniowe (n + δ)k = 0,9k → k* ≈ 6
      const f = frame(10, 10);
      const y = f.fn((k) => 3.2 * Math.sqrt(k), 0, 9.6, 60), sf = f.fn((k) => 2.2 * Math.sqrt(k), 0, 10, 60), dep = f.fn((k) => 0.9 * k, 0, 10);
      const ks = (2.2 / 0.9) ** 2;
      return (
        <>
          <Axes x="Kapitał na pracownika (k)" y="Na pracownika" arrow={arrow} />
          <Curve d={f.path(y)} c={3} dash label="f(k)" at={last(y, f)} />
          <Curve d={f.path(sf)} c={1} label="s·f(k)" at={last(sf, f)} />
          <Curve d={f.path(dep)} c={2} label="(n+δ)k" at={[f.sx(3.2) + 8, f.sy(2.9) + 14]} />
          <line className="bf-guide" x1={f.sx(ks)} y1={f.sy(0)} x2={f.sx(ks)} y2={f.sy(0.9 * ks)} />
          <circle className="bf-dot" cx={f.sx(ks)} cy={f.sy(0.9 * ks)} r={3.5} />
          <text className="bf-txt" x={f.sx(ks)} y={H - B + 13} textAnchor="middle">k*</text>
        </>
      );
    }
    case "keynes": {
      // krzyż keynesowski: AE = 2 + 0,6Y, równowaga Y = 5; wzrost wydatków autonomicznych o 1,2 → Y = 8 (mnożnik 2,5)
      const f = frame(10, 10);
      const ae = f.fn((y) => 2 + 0.6 * y, 0, 10), ae2 = f.fn((y) => 3.2 + 0.6 * y, 0, 10);
      const up = !!o.wzrost;
      return (
        <>
          <Axes x="Dochód (Y)" y="Wydatki (AE)" arrow={arrow} />
          <Curve d={f.path([[0, 0], [9.6, 9.6]])} c={3} dash label="Y = AE" at={[f.sx(2.4) + 6, f.sy(2.4) + 12]} />
          <Curve d={f.path(ae)} c={1} label="AE₁" at={last(ae, f)} />
          {up && <Curve d={f.path(ae2)} c={2} label="AE₂" at={last(ae2, f)} />}
          <line className="bf-guide" x1={f.sx(5)} y1={f.sy(0)} x2={f.sx(5)} y2={f.sy(5)} />
          <circle className="bf-dot" cx={f.sx(5)} cy={f.sy(5)} r={3.5} />
          <text className="bf-txt" x={f.sx(5)} y={H - B + 13} textAnchor="middle">Y₁</text>
          {up && <>
            <line className="bf-guide" x1={f.sx(8)} y1={f.sy(0)} x2={f.sx(8)} y2={f.sy(8)} />
            <circle className="bf-dot" cx={f.sx(8)} cy={f.sy(8)} r={3.5} />
            <text className="bf-txt" x={f.sx(8)} y={H - B + 13} textAnchor="middle">Y₂</text>
            <text className="bf-txt small" x={f.sx(5.4)} y={f.sy(1.2)}>mnożnik</text>
          </>}
        </>
      );
    }
    case "engel": {
      const f = frame(10, 10);
      const nec = f.fn((x) => 3 * Math.sqrt(x), 0, 10, 50), lux = f.fn((x) => 0.09 * x * x, 0, 10), inf = f.fn((x) => 3.2 - 0.12 * (x - 4) ** 2 + 0.8, 0.5, 9.5);
      return (
        <>
          <Axes x="Dochód" y="Wydatki na dobro" arrow={arrow} />
          <Curve d={f.path(nec)} c={1} label="podstawowe" at={[f.sx(5.6) - 60, f.sy(7.1) - 6]} />
          <Curve d={f.path(lux)} c={2} label="luksusowe" at={[f.sx(8.6) - 62, f.sy(6.6) + 4]} />
          <Curve d={f.path(inf)} c={4} dash label="niższego rzędu" at={[f.sx(4) - 30, f.sy(4) - 8]} />
        </>
      );
    }
    case "konkurencja": {
      // firma w konkurencji doskonałej: P = MR = 5,6, produkuje tam, gdzie MC = P; zysk = (P − ATC)·Q
      const f = frame(10, 12);
      const mc = f.fn((q) => 5 - 2 * q + 0.3 * q * q, 0.4, 9.6), atc = f.fn((q) => 5 - q + 0.1 * q * q + 6 / q, 0.6, 9.6);
      const q = (2 + Math.sqrt(4 + 0.72)) / 0.6, a = 5 - q + 0.1 * q * q + 6 / q;
      return (
        <>
          <Axes x="Ilość (q)" y="Cena, koszt" arrow={arrow} />
          <path className="bf-area ps" d={`${f.path([[0, a], [q, a], [q, 5.6], [0, 5.6]])}Z`} />
          <Curve d={f.path([[0, 5.6], [9.6, 5.6]])} c={3} label="P = MR" at={[f.sx(9.6) - 40, f.sy(5.6) - 6]} />
          <Curve d={f.path(atc)} c={1} label="ATC" at={last(atc, f)} />
          <Curve d={f.path(mc)} c={2} label="MC" at={last(mc, f)} />
          <line className="bf-guide" x1={f.sx(q)} y1={f.sy(0)} x2={f.sx(q)} y2={f.sy(5.6)} />
          <text className="bf-txt" x={f.sx(q)} y={H - B + 13} textAnchor="middle">q*</text>
          <text className="bf-txt small" x={f.sx(0.4)} y={f.sy(4.5)}>zysk</text>
        </>
      );
    }
    case "lrac": {
      const f = frame(10, 10);
      const lr = f.fn((x) => 3 + 0.12 * (x - 5) ** 2, 0.3, 9.7);
      const sr = (c: number) => f.fn((x) => 3 + 0.12 * (c - 5) ** 2 + 0.6 * (x - c) ** 2 + 0.24 * (c - 5) * (x - c), c - 1.6, c + 1.6);
      return (
        <>
          <Axes x="Wielkość produkcji" y="Koszt przeciętny" arrow={arrow} />
          {[2, 5, 8].map((c) => <Curve key={c} d={f.path(sr(c))} c={4} dash />)}
          <Curve d={f.path(lr)} c={1} label="LRAC" at={last(lr, f)} />
          <text className="bf-txt small" x={f.sx(0.4)} y={f.sy(1.6)}>korzyści skali</text>
          <text className="bf-txt small" x={f.sx(6.4)} y={f.sy(1.6)}>niekorzyści skali</text>
          <line className="bf-guide" x1={f.sx(5)} y1={f.sy(0)} x2={f.sx(5)} y2={f.sy(3)} />
          <text className="bf-txt small" x={f.sx(5)} y={H - B + 13} textAnchor="middle">MES</text>
        </>
      );
    }
    case "procent": {
      // 1000 zł na 10% przez 30 lat: procent prosty (liniowo) i składany (wykładniczo)
      const f = frame(30, 20);
      const simple = f.fn((t) => 1 + 0.1 * t, 0, 30), comp = f.fn((t) => 1.1 ** t, 0, 30, 60);
      return (
        <>
          <Axes x="Lata" y="Kapitał (tys. zł)" arrow={arrow} />
          <Curve d={f.path(simple)} c={2} label="prosty" at={last(simple, f)} />
          <Curve d={f.path(comp)} c={1} label="składany" at={[f.sx(23) - 30, f.sy(15) - 4]} />
          {[0, 10, 20, 30].map((x) => <text key={x} className="bf-txt small" x={f.sx(x)} y={H - B + 13} textAnchor="middle">{x}</text>)}
          <text className="bf-txt small" x={f.sx(1)} y={f.sy(18.5)}>1000 zł na 10% rocznie</text>
        </>
      );
    }
    case "portfel": {
      // ryzyko portfela maleje z liczbą spółek do poziomu ryzyka systematycznego
      const f = frame(30, 10);
      const r = f.fn((n) => 3 + 6 / Math.sqrt(n), 1, 30, 60);
      return (
        <>
          <Axes x="Liczba spółek w portfelu" y="Ryzyko (odchylenie)" arrow={arrow} />
          <path className="bf-area" d={`${f.path(r)}L${f.sx(30)},${f.sy(3)}L${f.sx(1)},${f.sy(3)}Z`} />
          <Curve d={f.path(r)} c={1} label="ryzyko całkowite" at={[f.sx(4) + 4, f.sy(6.4) - 6]} />
          <Curve d={f.path([[0, 3], [30, 3]])} c={2} dash />
          <text className="bf-txt small" x={f.sx(12)} y={f.sy(4.3)}>ryzyko specyficzne (dywersyfikowalne)</text>
          <text className="bf-txt small" x={f.sx(12)} y={f.sy(1.6)}>ryzyko systematyczne (rynkowe)</text>
        </>
      );
    }
    case "sml": {
      // linia rynku papierów wartościowych (CAPM): E(r) = rf + β·(rm − rf), rf = 4%, rm = 10%
      const f = frame(2, 16);
      return (
        <>
          <Axes x="Beta (β)" y="Oczekiwana stopa zwrotu (%)" arrow={arrow} />
          <Curve d={f.path([[0, 4], [2, 16]])} c={1} label="SML" at={[f.sx(1.85) - 6, f.sy(15.1) - 6]} />
          <line className="bf-guide" x1={f.sx(1)} y1={f.sy(0)} x2={f.sx(1)} y2={f.sy(10)} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(10)} x2={f.sx(1)} y2={f.sy(10)} />
          <circle className="bf-dot" cx={f.sx(1)} cy={f.sy(10)} r={3.5} /><text className="bf-txt" x={f.sx(1) + 6} y={f.sy(10) + 12}>rynek (β = 1)</text>
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(4) + 4} textAnchor="end">r_f</text>
          <text className="bf-txt" x={f.sx(0) - 4} y={f.sy(10) + 4} textAnchor="end">r_m</text>
          <circle className="bf-dot out" cx={f.sx(1.5)} cy={f.sy(15)} r={3.5} /><text className="bf-txt small" x={f.sx(1.5) - 6} y={f.sy(15) - 4} textAnchor="end">niedowartościowana</text>
        </>
      );
    }
    case "opcja": {
      // wypłata z długiej opcji kupna (call) przy cenie wykonania 100 i premii 10; straddle – call + put
      const f = frame(200, 100);
      const straddle = String(o.typ ?? "") === "straddle";
      const y0 = 40;
      const pay = (st: number) => (straddle ? Math.abs(st - 100) - 20 : Math.max(0, st - 100) - 10);
      const pts = f.fn((st) => y0 + pay(st) * 0.5, 0, 200, 80);
      return (
        <>
          <Axes x="Cena instrumentu w dniu wygaśnięcia" y="Zysk / strata" arrow={arrow} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(y0)} x2={f.sx(200)} y2={f.sy(y0)} />
          <text className="bf-txt small" x={f.sx(0) - 4} y={f.sy(y0) + 4} textAnchor="end">0</text>
          <Curve d={f.path(pts)} c={1} label={straddle ? "straddle" : "long call"} at={[f.sx(150) - 20, f.sy(y0 + pay(150) * 0.5) - 10]} />
          <line className="bf-guide" x1={f.sx(100)} y1={f.sy(0)} x2={f.sx(100)} y2={f.sy(90)} />
          <text className="bf-txt small" x={f.sx(100)} y={H - B + 13} textAnchor="middle">K = 100</text>
          <text className="bf-txt small" x={f.sx(6)} y={f.sy(y0 + pay(0) * 0.5) + 14}>strata = premia {straddle ? "(20)" : "(10)"}</text>
        </>
      );
    }
    case "stawki": {
      // przeciętna stawka podatku przy rosnącym dochodzie: progresywny rośnie, liniowy stały, regresywny maleje
      const f = frame(10, 40);
      const prog = f.fn((y) => 30 * (1 - 1 / (1 + y / 4)) + 5, 0, 10), lin = f.fn(() => 19, 0, 10), reg = f.fn((y) => 8 + 22 / (1 + y), 0, 10);
      return (
        <>
          <Axes x="Dochód" y="Przeciętna stawka (%)" arrow={arrow} />
          <Curve d={f.path(prog)} c={1} label="progresywny" at={[f.sx(7.4), f.sy(26.4) - 6]} />
          <Curve d={f.path(lin)} c={3} label="liniowy" at={[f.sx(8.6), f.sy(19) - 6]} />
          <Curve d={f.path(reg)} c={2} label="regresywny" at={[f.sx(7.6), f.sy(10.5) + 14]} />
        </>
      );
    }
    case "clo": {
      // mały kraj importujący: cena światowa 3, cło 1,5 → cena krajowa 4,5; import maleje, strata dobrobytu – dwa trójkąty
      const f = frame(10, 10);
      const d = f.fn((q) => 9 - 0.8 * q, 0, 10), sp = f.fn((q) => 1 + 0.8 * q, 0, 10);
      const pw = 3, pt = 4.5, qs1 = (pw - 1) / 0.8, qd1 = (9 - pw) / 0.8, qs2 = (pt - 1) / 0.8, qd2 = (9 - pt) / 0.8;
      return (
        <>
          <Axes x="Ilość (Q)" y="Cena (P)" arrow={arrow} />
          <path className="bf-area ps" d={`${f.path([[qs2, pw], [qd2, pw], [qd2, pt], [qs2, pt]])}Z`} />
          <path className="bf-area loss" d={`${f.path([[qs1, pw], [qs2, pw], [qs2, pt]])}Z`} />
          <path className="bf-area loss" d={`${f.path([[qd2, pw], [qd1, pw], [qd2, pt]])}Z`} />
          <Curve d={f.path(d)} c={1} label="D" at={last(d, f)} />
          <Curve d={f.path(sp)} c={2} label="S" at={last(sp, f)} />
          <Curve d={f.path([[0, pw], [9.8, pw]])} c={3} dash label="P_świat" at={[f.sx(8.2), f.sy(pw) + 13]} />
          <Curve d={f.path([[0, pt], [9.8, pt]])} c={4} dash label="P_świat + cło" at={[f.sx(6.8), f.sy(pt) - 5]} />
          <text className="bf-txt small" x={f.sx((qs2 + qd2) / 2)} y={f.sy(3.6)} textAnchor="middle">wpływy z cła</text>
          <line className="bf-span" x1={f.sx(qs2)} y1={f.sy(1)} x2={f.sx(qd2)} y2={f.sy(1)} />
          <text className="bf-txt small" x={f.sx((qs2 + qd2) / 2)} y={f.sy(1) + 13} textAnchor="middle">import po cle</text>
        </>
      );
    }
    case "bep": {
      // próg rentowności: przychód TR = 50q, koszt TC = 40 000 + 30q → BEP = 2000 szt.
      const f = frame(4000, 200);
      return (
        <>
          <Axes x="Sprzedaż (szt.)" y="Przychód, koszt (tys. zł)" arrow={arrow} />
          <path className="bf-area loss" d={`${f.path([[0, 0], [2000, 100], [0, 40]])}Z`} />
          <path className="bf-area ps" d={`${f.path([[2000, 100], [3800, 190], [3800, 154]])}Z`} />
          <Curve d={f.path([[0, 40], [3800, 40]])} c={3} dash label="koszty stałe" at={[f.sx(2600), f.sy(40) + 13]} />
          <Curve d={f.path([[0, 40], [3800, 154]])} c={2} label="TC" at={[f.sx(3800) + 4, f.sy(154) + 4]} />
          <Curve d={f.path([[0, 0], [3800, 190]])} c={1} label="TR" at={[f.sx(3800) + 4, f.sy(190) + 4]} />
          <line className="bf-guide" x1={f.sx(2000)} y1={f.sy(0)} x2={f.sx(2000)} y2={f.sy(100)} />
          <circle className="bf-dot" cx={f.sx(2000)} cy={f.sy(100)} r={3.5} />
          <text className="bf-txt" x={f.sx(2000)} y={H - B + 13} textAnchor="middle">BEP = 2000</text>
          <text className="bf-txt small" x={f.sx(300)} y={f.sy(28)}>strata</text>
          <text className="bf-txt small" x={f.sx(2900)} y={f.sy(160)}>zysk</text>
        </>
      );
    }
    case "npv": {
      // NPV projektu (nakład 100, 3 × 40) w funkcji stopy dyskontowej; IRR – tam, gdzie NPV = 0 (ok. 9,7%)
      const f = frame(20, 40);
      const npv = (r: number) => -100 + 40 / (1 + r / 100) + 40 / (1 + r / 100) ** 2 + 40 / (1 + r / 100) ** 3;
      const y0 = 15;
      const pts = f.fn((r) => y0 + npv(r), 0, 20, 60);
      return (
        <>
          <Axes x="Stopa dyskontowa (%)" y="NPV" arrow={arrow} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(y0)} x2={f.sx(20)} y2={f.sy(y0)} />
          <text className="bf-txt small" x={f.sx(0) - 4} y={f.sy(y0) + 4} textAnchor="end">0</text>
          <Curve d={f.path(pts)} c={1} label="NPV" at={[f.sx(15), f.sy(y0 + npv(15)) - 8]} />
          <circle className="bf-dot" cx={f.sx(9.7)} cy={f.sy(y0)} r={3.5} />
          <text className="bf-txt" x={f.sx(9.7)} y={f.sy(y0) - 8} textAnchor="middle">IRR ≈ 9,7%</text>
          <text className="bf-txt small" x={f.sx(1)} y={f.sy(y0) + 30}>NPV &gt; 0 – opłacalny</text>
          {[0, 5, 10, 15, 20].map((x) => <text key={x} className="bf-txt small" x={f.sx(x)} y={H - B + 13} textAnchor="middle">{x}</text>)}
        </>
      );
    }
    case "wacc": {
      // teoria kompromisu: dług tańszy (tarcza podatkowa), ale z zadłużeniem rośnie ryzyko – WACC ma minimum przy ok. 40% długu
      const f = frame(8, 20);
      const w = (d: number) => 10 - 0.8 * d + 0.1 * d * d;
      const kd = (d: number) => 4.5 + 0.12 * d * d;
      const ke = (d: number) => (w(d) - (d / 10) * kd(d) * 0.81) / (1 - d / 10);
      const kep = f.fn(ke, 0, 8), kdp = f.fn((d) => kd(d) * 0.81, 0, 8), wp = f.fn(w, 0, 8);
      return (
        <>
          <Axes x="Udział długu D/V (×10%)" y="Koszt kapitału (%)" arrow={arrow} />
          <Curve d={f.path(kep)} c={2} label="kE" at={last(kep, f)} />
          <Curve d={f.path(kdp)} c={3} label="kD·(1−T)" at={[f.sx(8) - 50, f.sy(kd(8) * 0.81) + 16]} />
          <Curve d={f.path(wp)} c={1} label="WACC" at={[f.sx(8) + 4, f.sy(w(8)) + 4]} />
          <line className="bf-guide" x1={f.sx(4)} y1={f.sy(0)} x2={f.sx(4)} y2={f.sy(w(4))} />
          <circle className="bf-dot" cx={f.sx(4)} cy={f.sy(w(4))} r={3.5} />
          <text className="bf-txt small" x={f.sx(4)} y={H - B + 13} textAnchor="middle">optymalna struktura</text>
        </>
      );
    }
    case "zycie": {
      // cykl życia produktu: sprzedaż w fazach wprowadzenia, wzrostu, dojrzałości i spadku
      const f = frame(10, 10);
      const sale = f.fn((t) => 9 * Math.exp(-((t - 5.6) ** 2) / 6.5) + 0.2, 0, 10, 80);
      return (
        <>
          <Axes x="Czas" y="Sprzedaż" arrow={arrow} />
          {[2.2, 4.4, 7.4].map((x) => <line key={x} className="bf-guide" x1={f.sx(x)} y1={f.sy(0)} x2={f.sx(x)} y2={f.sy(9.8)} />)}
          {[[1.1, "wprowadzenie"], [3.3, "wzrost"], [5.9, "dojrzałość"], [8.7, "spadek"]].map(([x, n]) => (
            <text key={String(n)} className="bf-txt small" x={f.sx(x as number)} y={f.sy(9.6)} textAnchor="middle">{n}</text>
          ))}
          <Curve d={f.path(sale)} c={1} />
        </>
      );
    }
    case "produkt": {
      // produkt całkowity TP, przeciętny AP i krańcowy MP; MP przecina AP w jego maksimum
      const f = frame(10, 10);
      const tp = (l: number) => (0.9 * l * l - 0.06 * l * l * l) * 0.55;
      const tpl = f.fn(tp, 0, 10), mp = f.fn((l) => (1.8 * l - 0.18 * l * l) * 0.55 * 2.2, 0, 10), ap = f.fn((l) => (0.9 * l - 0.06 * l * l) * 0.55 * 2.2, 0.1, 10);
      return (
        <>
          <Axes x="Praca (L)" y="Produkt" arrow={arrow} />
          <Curve d={f.path(tpl)} c={1} label="TP" at={last(tpl, f)} />
          <Curve d={f.path(ap)} c={3} label="AP" at={last(ap, f)} />
          <Curve d={f.path(mp)} c={2} label="MP" at={[f.sx(8.6), f.sy(0.9)]} />
          <line className="bf-guide" x1={f.sx(7.5)} y1={f.sy(0)} x2={f.sx(7.5)} y2={f.sy(9.8)} />
          <text className="bf-txt small" x={f.sx(7.6)} y={f.sy(9.4)}>max AP</text>
        </>
      );
    }
    case "maslow": {
      const lv = ["fizjologiczne", "bezpieczeństwa", "przynależności", "uznania", "samorealizacji"];
      const n = lv.length, base = W - 40, top = 60, bot = H - 14, rowH = (bot - T) / n;
      return (
        <>
          {lv.map((name, i) => {
            const y = bot - (i + 1) * rowH, w0 = base - ((base - top) * i) / n, w1 = base - ((base - top) * (i + 1)) / n;
            return (
              <g key={name}>
                <path className={`bf-cell t${(i % 4) + 1}`} d={`M${W / 2 - w0 / 2},${y + rowH}L${W / 2 + w0 / 2},${y + rowH}L${W / 2 + w1 / 2},${y}L${W / 2 - w1 / 2},${y}Z`} />
                <text className="bf-txt cell" x={W / 2} y={y + rowH / 2 + 4} textAnchor="middle">{name}</text>
              </g>
            );
          })}
        </>
      );
    }
    case "okun": {
      // prawo Okuna: wzrost PKB o 1 pp. powyżej potencjału obniża bezrobocie o ok. 0,5 pp.
      const f = frame(10, 10);
      return (
        <>
          <Axes x="Wzrost PKB (%)" y="Zmiana stopy bezrobocia (pp.)" arrow={arrow} />
          <line className="bf-guide" x1={f.sx(0)} y1={f.sy(5)} x2={f.sx(10)} y2={f.sy(5)} />
          <text className="bf-txt small" x={f.sx(0) - 4} y={f.sy(5) + 4} textAnchor="end">0</text>
          <Curve d={f.path([[0, 8], [10, 1]])} c={1} label="Okun" at={[f.sx(9) + 2, f.sy(1.7) - 6]} />
          {[[1, 7.5], [2.4, 6.1], [3.2, 6], [4.6, 4.6], [5.5, 4.4], [6.8, 3.2], [8.1, 2.9]].map(([x, y]) => <circle key={x} className="bf-dot out" cx={f.sx(x)} cy={f.sy(y)} r={2.5} />)}
          <line className="bf-guide" x1={f.sx(30 / 7)} y1={f.sy(0)} x2={f.sx(30 / 7)} y2={f.sy(5)} />
          <text className="bf-txt small" x={f.sx(30 / 7)} y={H - B + 13} textAnchor="middle">potencjał</text>
        </>
      );
    }
    case "uczenie": {
      // krzywa doświadczenia: podwojenie skumulowanej produkcji obniża koszt jednostkowy o ok. 20%
      const f = frame(10, 10);
      const c = f.fn((x) => 9 * Math.pow(x / 0.4, -0.322), 0.4, 10, 60);
      return (
        <>
          <Axes x="Skumulowana produkcja" y="Koszt jednostkowy" arrow={arrow} />
          <Curve d={f.path(c)} c={1} label="80%" at={last(c, f)} />
          <text className="bf-txt small" x={f.sx(3)} y={f.sy(7.5)}>2× więcej produkcji → koszt o 20% niższy</text>
        </>
      );
    }
    case "cyklzycia": {
      // hipoteza cyklu życia: dochód rośnie i spada na emeryturze, konsumpcja jest wygładzona – oszczędzanie, potem dekumulacja
      const f = frame(10, 10);
      const inc = (a: number) => (a < 7 ? 2 + 6 * Math.sin((Math.PI * a) / 7.6) : 1.2);
      const ip = f.fn(inc, 0.3, 9.8, 80);
      return (
        <>
          <Axes x="Wiek" y="Zł rocznie" arrow={arrow} />
          <Curve d={f.path(ip)} c={2} label="dochód" at={[f.sx(3.3), f.sy(8.2) - 6]} />
          <Curve d={f.path([[0.3, 5], [9.8, 5]])} c={1} label="konsumpcja" at={[f.sx(7.4), f.sy(5) - 6]} />
          <line className="bf-guide" x1={f.sx(7)} y1={f.sy(0)} x2={f.sx(7)} y2={f.sy(9.6)} />
          <text className="bf-txt small" x={f.sx(7)} y={H - B + 13} textAnchor="middle">emerytura</text>
          <text className="bf-txt small" x={f.sx(3.6)} y={f.sy(5.8)} textAnchor="middle">oszczędzanie</text>
          <text className="bf-txt small" x={f.sx(8.4)} y={f.sy(3)} textAnchor="middle">dekumulacja</text>
        </>
      );
    }
    case "blake": {
      const f = frame(9.6, 9.6);
      const pts: [number, number, string][] = [[1, 9, "1.9 klubowy"], [9, 9, "9.9 zespołowy"], [5, 5, "5.5 środka"], [1, 1, "1.1 zubożały"], [9, 1, "9.1 zadaniowy"]];
      return (
        <>
          <Axes x="Troska o zadania (wyniki)" y="Troska o ludzi" arrow={arrow} />
          {Array.from({ length: 9 }, (_, i) => i + 1).map((v) => (
            <g key={v}>
              <line className="bf-grid" x1={f.sx(v)} y1={f.sy(0.5)} x2={f.sx(v)} y2={f.sy(9.3)} />
              <line className="bf-grid" x1={f.sx(0.5)} y1={f.sy(v)} x2={f.sx(9.3)} y2={f.sy(v)} />
              <text className="bf-txt small" x={f.sx(v)} y={H - B + 12} textAnchor="middle">{v}</text>
              <text className="bf-txt small" x={L - 6} y={f.sy(v) + 3} textAnchor="end">{v}</text>
            </g>
          ))}
          {pts.map(([x, y, n]) => (
            <g key={n}>
              <circle className="bf-dot" cx={f.sx(x)} cy={f.sy(y)} r={4.5} />
              <text className="bf-txt" x={f.sx(x) + (x > 5 ? -8 : 8)} y={f.sy(y) + (y > 5 ? 14 : -8)} textAnchor={x > 5 ? "end" : "start"}>{n}</text>
            </g>
          ))}
        </>
      );
    }
  }
  return null;
}

const ALT: Record<string, string> = {
  koszty: "Krzywe kosztów: krańcowy MC przecina przeciętny zmienny AVC i przeciętny całkowity ATC w ich minimach; przeciętny stały AFC stale maleje",
  phillips: "Krzywa Phillipsa: wyższa inflacja przy niższym bezrobociu w krótkim okresie",
  laffer: "Krzywa Laffera: wpływy rosną do stawki t*, potem maleją; ten sam dochód przy niskiej (A) i wysokiej (B) stawce",
  lorenz: "Krzywa Lorenza pod linią równości; współczynnik Giniego = A / (A + B)",
  kmp: "Krzywa możliwości produkcyjnych: punkty na krzywej są efektywne, pod nią nieefektywne, nad nią nieosiągalne",
  monopol: "Monopol: ilość Qₘ tam, gdzie MR = MC, cena Pₘ z krzywej popytu; trójkąt to strata dobrobytu względem konkurencji (Q_k)",
  przejscie: "Przejście demograficzne: najpierw spadają zgony, potem urodzenia; różnica to przyrost naturalny",
  piramida: "Piramida wieku: liczebność mężczyzn i kobiet w grupach wieku",
  macierz: "Macierz analizy strategicznej",
  blake: "Siatka kierownicza Blake'a i Mouton: troska o ludzi względem troski o zadania",
  nadwyzka: "Nadwyżka konsumenta (nad ceną, pod popytem) i producenta (pod ceną, nad podażą) w równowadze rynkowej",
  podatek: "Podatek akcyzowy przesuwa podaż w górę: kupujący płacą więcej, sprzedający dostają mniej; prostokąt to wpływy, trójkąt – strata dobrobytu",
  cena: "Cena urzędowa: maksymalna poniżej równowagi powoduje niedobór, minimalna powyżej – nadwyżkę",
  elastycznosc: "Popyt elastyczny (płaski) i nieelastyczny (stromy) przechodzące przez ten sam punkt",
  obojetnosc: "Linia budżetu i krzywe obojętności; optimum konsumenta E w punkcie styczności",
  oligopol: "Załamana krzywa popytu w oligopolu i luka w utargu krańcowym MR",
  krzywaj: "Efekt krzywej J: po deprecjacji saldo handlowe najpierw się pogarsza, potem poprawia",
  beveridge: "Krzywa Beveridge'a: im więcej wolnych miejsc pracy, tym niższe bezrobocie",
  cykl: "Cykl koniunkturalny: wahania PKB wokół trendu – szczyty, dna, recesja i ożywienie",
  dochodowosc: "Krzywa dochodowości: rentowność obligacji według terminu zapadalności (normalna i odwrócona)",
  solow: "Model Solowa: stan ustalony k*, gdzie oszczędności s·f(k) równają się inwestycjom odtworzeniowym (n+δ)k",
  keynes: "Krzyż keynesowski: równowaga, gdzie wydatki AE równają się dochodowi Y; wzrost wydatków autonomicznych zwiększa Y o mnożnik",
  engel: "Krzywe Engla: wydatki na dobra podstawowe, luksusowe i niższego rzędu przy rosnącym dochodzie",
  konkurencja: "Firma w konkurencji doskonałej: produkcja tam, gdzie cena = koszt krańcowy; prostokąt to zysk",
  procent: "Procent prosty rośnie liniowo, składany – wykładniczo",
  portfel: "Dywersyfikacja: ryzyko portfela maleje z liczbą spółek do poziomu ryzyka systematycznego",
  sml: "Linia rynku papierów wartościowych (CAPM): oczekiwana stopa zwrotu rośnie liniowo z betą",
  opcja: "Wykres wypłaty z opcji w dniu wygaśnięcia",
  stawki: "Przeciętna stawka podatku: progresywna rośnie z dochodem, liniowa stała, regresywna maleje",
  clo: "Cło w małym kraju importującym: wyższa cena krajowa, mniejszy import, wpływy z cła i strata dobrobytu",
  bep: "Próg rentowności: przychód całkowity zrównuje się z kosztem całkowitym",
  npv: "NPV projektu maleje ze stopą dyskontową; IRR to stopa, przy której NPV = 0",
  wacc: "Teoria kompromisu: średni ważony koszt kapitału ma minimum przy optymalnym udziale długu",
  zycie: "Cykl życia produktu: wprowadzenie, wzrost, dojrzałość i spadek sprzedaży",
  produkt: "Produkt całkowity, przeciętny i krańcowy; krańcowy przecina przeciętny w jego maksimum",
  maslow: "Piramida potrzeb Maslowa – od fizjologicznych do samorealizacji",
  okun: "Prawo Okuna: szybszy wzrost PKB obniża stopę bezrobocia",
  uczenie: "Krzywa doświadczenia: koszt jednostkowy maleje wraz ze skumulowaną produkcją",
  cyklzycia: "Hipoteza cyklu życia: wygładzona konsumpcja, oszczędzanie w wieku produkcyjnym i dekumulacja na emeryturze",
  lrac: "Długookresowy koszt przeciętny jako obwiednia krótkookresowych; korzyści i niekorzyści skali, minimalna efektywna skala",
};

/** Ładne wartości osi Y od 0 (albo od minimum, gdy dane są ujemne). */
function ticks(lo: number, hi: number): number[] {
  const raw = (hi - lo) / 4 || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw) ?? raw;
  const a = Math.floor(lo / step) * step, out: number[] = [];
  for (let v = a; v <= hi + step * 0.001; v += step) out.push(Math.round(v * 1000) / 1000);
  if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
  return out;
}
const fmtN = (v: number) => v.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

/** Wykres z danych (data/wykresy): linie albo słupki, do dwóch serii (Polska / UE-27), ze źródłem w podpisie. */
function SeriesChart({ id, arrow }: { id: string; arrow: string }) {
  const s = SERIES[id];
  if (!s) return null;
  const all = s.lines.flatMap((l) => l.points);
  const years = [...new Set(all.map(([y]) => y))].sort((a, b) => a - b);
  const vmin = Math.min(0, ...all.map(([, v]) => v)), vmax = Math.max(...all.map(([, v]) => v));
  const ty = ticks(vmin, vmax);
  const y0 = ty[0], y1 = ty[ty.length - 1];
  const L2 = 44;
  const sx = (y: number) => L2 + ((y - years[0]) / Math.max(1, years[years.length - 1] - years[0])) * (W - L2 - 20);
  const sy = (v: number) => T + ((y1 - v) / (y1 - y0)) * (H - T - B);
  const step = Math.ceil(years.length / 6);
  const bw = Math.max(2, ((W - L2 - 20) / years.length) / (s.lines.length + 0.6));
  return (
    <>
      {ty.map((v) => (
        <g key={v}>
          <line className="bf-grid" x1={L2} y1={sy(v)} x2={W - 12} y2={sy(v)} />
          <text className="bf-txt small" x={L2 - 5} y={sy(v) + 3} textAnchor="end">{fmtN(v)}</text>
        </g>
      ))}
      <line className="graph-axis" x1={L2} y1={sy(Math.max(y0, 0))} x2={W - 8} y2={sy(Math.max(y0, 0))} markerEnd={`url(#${arrow})`} />
      {years.filter((_, i) => i % step === 0 || i === years.length - 1).map((y) => (
        <text key={y} className="bf-txt small" x={sx(y)} y={H - B + 13} textAnchor="middle">{y}</text>
      ))}
      {s.lines.map((l, li) => s.kind === "slupki" ? (
        <g key={l.name} className={`bf-curve bf-c${li + 1}`}>
          {l.points.map(([y, v]) => (
            <rect key={y} className={`bf-bar c${li + 1}`} x={sx(y) - (bw * s.lines.length) / 2 + li * bw} width={bw * 0.9}
              y={Math.min(sy(v), sy(0))} height={Math.abs(sy(v) - sy(0))}><title>{`${l.name} ${y}: ${fmtN(v)}`}</title></rect>
          ))}
        </g>
      ) : (
        <g key={l.name} className={`bf-curve bf-c${li + 1}`}>
          <path d={l.points.map(([y, v], i) => `${i ? "L" : "M"}${sx(y).toFixed(1)},${sy(v).toFixed(1)}`).join("")} />
          {l.points.map(([y, v]) => <circle key={y} className="bf-pt" cx={sx(y)} cy={sy(v)} r={1.8}><title>{`${l.name} ${y}: ${fmtN(v)}`}</title></circle>)}
        </g>
      ))}
      {s.lines.map((l, li) => (
        <g key={l.name}>
          <rect className={`bf-bar c${li + 1}`} x={L2 + 6 + li * 140} y={T - 2} width={10} height={10} rx={2} />
          <text className="bf-txt small" x={L2 + 20 + li * 140} y={T + 7}>{l.name}{(() => { const p = l.points[l.points.length - 1]; return ` (${p[0]}: ${fmtN(p[1])})`; })()}</text>
        </g>
      ))}
    </>
  );
}

/** Piramida wieku Polski z danych Eurostatu (grupy 5-letnie, mln osób). */
function PyramidPL() {
  const d = PYRAMID_PL;
  const n = d.groups.length, cx = W / 2, rowH = (H - T - 30) / n, max = Math.max(...d.men, ...d.women), scale = (cx - 46) / max;
  return (
    <>
      {d.groups.map((g, i) => {
        const y = T + (n - 1 - i) * rowH;
        return (
          <g key={g}>
            <rect className="bf-bar m" x={cx - 16 - d.men[i] * scale} y={y} width={d.men[i] * scale} height={rowH - 2} rx={1.5}><title>{`mężczyźni ${g}: ${fmtN(d.men[i])} mln`}</title></rect>
            <rect className="bf-bar f" x={cx + 16} y={y} width={d.women[i] * scale} height={rowH - 2} rx={1.5}><title>{`kobiety ${g}: ${fmtN(d.women[i])} mln`}</title></rect>
            {i % 2 === 0 && <text className="bf-txt tiny" x={cx} y={y + rowH - 3} textAnchor="middle">{g}</text>}
          </g>
        );
      })}
      <text className="graph-axis-label" x={cx - 24} y={H - 8} textAnchor="end">♂ mężczyźni</text>
      <text className="graph-axis-label" x={cx + 24} y={H - 8}>kobiety ♀ (mln)</text>
    </>
  );
}

/** Rysunek w artykule: wykres przesunięć (Graph) albo jeden z rysunków stałych; podpis pod spodem. */
export function BookFigure({ fig }: { fig: FigSpec }) {
  const arrow = `bf${useId().replace(/:/g, "")}`;
  const o = fig.o ?? {};
  // wykresy z danych: tytuł, jednostka i źródło w podpisie (z datą pobrania)
  const data = fig.k === "seria" ? SERIES[String(o.id)] : fig.k === "piramida" && o.dane === "pl" ? PYRAMID_PL : null;
  if (data) {
    return (
      <figure className="book-fig">
        <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Wykres: ${data.title} (${data.unit})`}>
          <defs>
            <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="graph-arrowhead" />
            </marker>
          </defs>
          {fig.k === "seria" ? <SeriesChart id={String(o.id)} arrow={arrow} /> : <PyramidPL />}
        </svg>
        <figcaption>
          {fig.cap ? `${fig.cap} ` : ""}<strong>{data.title}</strong> ({data.unit}). Źródło: <a href={data.urls[0]} target="_blank" rel="noopener noreferrer">{data.source}</a>, pobrano {data.fetched}.
        </figcaption>
      </figure>
    );
  }
  if (GRAPHS[fig.k]) {
    const shift = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v)]));
    const names = Object.fromEntries(Object.keys(GRAPHS[fig.k].curves).map((c) => [c, CURVE_NAMES[c] ?? c]));
    return (
      <figure className="book-fig">
        <Graph spec={{ k: fig.k, shift, names }} />
        {fig.cap && <figcaption>{fig.cap}</figcaption>}
      </figure>
    );
  }
  const alt = fig.k === "piramida" ? `${ALT.piramida} – typ ${o.typ ?? "progresywna"}` : fig.k === "macierz" ? `${ALT.macierz} ${String(o.preset ?? "bcg").toUpperCase()}` : ALT[fig.k];
  return (
    <figure className="book-fig">
      <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Rysunek: ${alt ?? fig.k}`}>
        <defs>
          <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="graph-arrowhead" />
          </marker>
        </defs>
        <Plot k={fig.k} o={o} arrow={arrow} />
      </svg>
      {fig.cap && <figcaption>{fig.cap}</figcaption>}
    </figure>
  );
}

const CURVE_NAMES: Record<string, string> = {
  D: "popyt", S: "podaż", AD: "zagregowany popyt", SRAS: "krótkookresowa zagregowana podaż", LRAS: "długookresowa zagregowana podaż",
  IS: "równowaga rynku dóbr", LM: "równowaga rynku pieniądza", DL: "popyt na pracę", SL: "podaż pracy", MD: "popyt na pieniądz", MS: "podaż pieniądza",
};
