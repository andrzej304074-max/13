import { useId } from "react";
import { Graph, GRAPHS } from "./graph";

/**
 * Rysunki Podręcznika (blok z polem `fig`, tools/nauka/build_podrecznik.py – dyrektywa `::wykres`).
 * Wykresy przesunięć krzywych (sd, adas, islm, …) rysuje `Graph`; tu – krzywe o stałym kształcie (koszty, Phillips,
 * Laffer, Lorenz, KMP, monopol), piramida wieku, przejście demograficzne, macierze (BCG, Ansoff, GE, SWOT) i siatka Blake'a–Mouton.
 */
export interface FigSpec { k: string; o?: Record<string, string | number>; cap?: string }

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
};

/** Rysunek w artykule: wykres przesunięć (Graph) albo jeden z rysunków stałych; podpis pod spodem. */
export function BookFigure({ fig }: { fig: FigSpec }) {
  const arrow = `bf${useId().replace(/:/g, "")}`;
  const o = fig.o ?? {};
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
