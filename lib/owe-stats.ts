/**
 * Statystyki pytań OWE (zakładka „Pojęcia” → Statystyki): o jakie działy, zagadnienia i pojęcia pytano.
 * Dane: data/nauka/owe-stats.json (tools/nauka/build_course.py) – każde pytanie z lekcją (dział, zagadnienie)
 * i pojęciami, o które pyta (treść + poprawne odpowiedzi, po ręcznym przeglądzie pytań XXI–XXXIX OWE).
 */

export type QType = "single" | "multi";
export type Stage = "s" | "o" | "c";

export interface OweRec {
  id: string;
  t: QType;
  /** Numer edycji (21–39). */
  ed: number;
  /** Etap: szkolny, okręgowy, centralny. */
  st: Stage;
  topic: string | null;
  unit: string | null;
  items: string[];
}

export interface ItemMeta {
  title: string;
  kind: string;
  topic: string;
}

export interface OweFilter {
  type: QType | "all";
  stages: Stage[];
  edFrom: number;
  edTo: number;
  /** Dział (temat kursu) – zawęża zagadnienia i pojęcia. */
  topic: string | null;
  /** Rodzaj hasła (pojecie, wzor, osoba…) – liczą się pytania o hasła tego rodzaju. */
  kind: string | null;
  order: "desc" | "asc";
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: "s", label: "szkolny" },
  { id: "o", label: "okręgowy" },
  { id: "c", label: "centralny" },
];

export const ROMAN: Record<number, string> = Object.fromEntries(
  Array.from({ length: 40 }, (_, i) => i).map((n) => [n, toRoman(n)]),
);

function toRoman(n: number): string {
  const R: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of R) while (n >= v) { s += r; n -= v; }
  return s;
}

/** Pytania spełniające filtry typu, etapu, edycji i rodzaju hasła (bez filtra działu). */
export function filterRecs(recs: OweRec[], f: OweFilter, meta: Record<string, ItemMeta>): OweRec[] {
  return recs.filter((r) =>
    (f.type === "all" || r.t === f.type)
    && f.stages.includes(r.st)
    && r.ed >= f.edFrom && r.ed <= f.edTo
    && (!f.kind || r.items.some((i) => meta[i]?.kind === f.kind)));
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

function sortRows<T extends { n: number; name: string }>(rows: T[], order: "desc" | "asc"): T[] {
  const dir = order === "desc" ? -1 : 1;
  return rows.sort((a, b) => (a.n - b.n) * dir || a.name.localeCompare(b.name, "pl"));
}

/** Działy: odsetek pytań (każde pytanie należy do jednego działu – suma 100%). */
export function topicShares(recs: OweRec[], names: Record<string, string>, order: "desc" | "asc") {
  const c = new Map<string, number>();
  for (const r of recs) c.set(r.topic ?? "", (c.get(r.topic ?? "") ?? 0) + 1);
  const rows = [...c].map(([id, n]) => ({ id, name: names[id] ?? "Nieprzypisane", n, pct: pct(n, recs.length) }));
  return sortRows(rows, order);
}

/** Zagadnienia (działy kursu): liczba pytań. */
export function unitCounts(recs: OweRec[], f: OweFilter, units: Record<string, { title: string; topic: string }>) {
  const c = new Map<string, number>();
  for (const r of recs) {
    if (!r.unit || (f.topic && r.topic !== f.topic)) continue;
    c.set(r.unit, (c.get(r.unit) ?? 0) + 1);
  }
  const rows = [...c].map(([id, n]) => ({ id, name: units[id]?.title ?? id, topic: units[id]?.topic ?? "", n }));
  return sortRows(rows, f.order);
}

/** Pojęcia: liczba pytań (razem, jednokrotny, wielokrotny); każde pytanie liczy się raz dla każdego swojego pojęcia. */
export function itemCounts(recs: OweRec[], f: OweFilter, meta: Record<string, ItemMeta>) {
  const c = new Map<string, { n: number; single: number; multi: number }>();
  for (const r of recs) {
    for (const i of r.items) {
      const m = meta[i];
      if (!m || (f.topic && m.topic !== f.topic) || (f.kind && m.kind !== f.kind)) continue;
      const e = c.get(i) ?? { n: 0, single: 0, multi: 0 };
      e.n++;
      e[r.t]++;
      c.set(i, e);
    }
  }
  const rows = [...c].map(([id, e]) => ({ id, name: meta[id].title, kind: meta[id].kind, topic: meta[id].topic, ...e }));
  return sortRows(rows, f.order);
}

export const DEFAULT_FILTER: OweFilter = { type: "all", stages: ["s", "o", "c"], edFrom: 21, edTo: 39, topic: null, kind: null, order: "desc" };

/** Filtry ↔ parametry adresu (?typ=single&etap=so&od=30&do=39&dzial=mikro&rodzaj=osoba&kolejnosc=asc). */
export function filterFromParams(p: URLSearchParams, edMin = 21, edMax = 39): OweFilter {
  const type = p.get("typ");
  const st = (p.get("etap") ?? "").split("").filter((s): s is Stage => s === "s" || s === "o" || s === "c");
  const num = (k: string, d: number) => {
    const v = Number(p.get(k));
    return Number.isInteger(v) && v >= edMin && v <= edMax ? v : d;
  };
  const edFrom = num("od", edMin), edTo = num("do", edMax);
  return {
    type: type === "single" || type === "multi" ? type : "all",
    stages: st.length ? [...new Set(st)] : ["s", "o", "c"],
    edFrom: Math.min(edFrom, edTo),
    edTo: Math.max(edFrom, edTo),
    topic: p.get("dzial") || null,
    kind: p.get("rodzaj") || null,
    order: p.get("kolejnosc") === "asc" ? "asc" : "desc",
  };
}

export function filterToParams(f: OweFilter, edMin = 21, edMax = 39): string {
  const p = new URLSearchParams();
  if (f.type !== "all") p.set("typ", f.type);
  if (f.stages.length < 3) p.set("etap", f.stages.join(""));
  if (f.edFrom !== edMin) p.set("od", String(f.edFrom));
  if (f.edTo !== edMax) p.set("do", String(f.edTo));
  if (f.topic) p.set("dzial", f.topic);
  if (f.kind) p.set("rodzaj", f.kind);
  if (f.order === "asc") p.set("kolejnosc", "asc");
  return p.toString();
}
