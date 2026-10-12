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

/** Pytanie słownikowe w statystykach (data/nauka/slownik-stats.json): dział słownika, pochodzenie (a – automatyczne, m – ręczne). */
export interface SlRec {
  id: string;
  t: QType;
  sec: number | null;
  o: "a" | "m";
  topic: string;
  unit: string;
  items: string[];
}

/* ---------- pokrycie olimpiad: powtórki pojęć z poprzednich lat ---------- */

/** Okno powtórek: pojęcie jest powtórką, gdy pytano o nie we wcześniejszej edycji (wszystkie od XXI albo ostatnie N). */
export type RepeatWindow = "all" | 3 | 5;

export interface CoverageRow {
  ed: number;
  /** Różne pojęcia edycji (po filtrach), w tym powtórki i nowe. */
  items: number;
  repeat: number;
  fresh: number;
  pct: number;
  /** Pytania edycji z rozpoznanymi pojęciami i te, w których wszystkie pojęcia to powtórki. */
  questions: number;
  qRepeat: number;
}

export interface Coverage {
  rows: CoverageRow[];
  /** Suma po wybranych edycjach (pojęcia liczone w każdej edycji osobno). */
  total: { items: number; repeat: number; fresh: number; pct: number; questions: number; qRepeat: number };
  /** Pojęcia wybranych edycji z liczbą wcześniejszych edycji, w których o nie pytano (najczęstsze powtórki najpierw). */
  repeated: { id: string; earlier: number; editions: number[] }[];
  /** Pojęcia, o które w wybranych edycjach zapytano pierwszy raz (od XXI OWE). */
  fresh: { id: string; ed: number }[];
}

/** Pojęcia pytania zawężone do działu i rodzaju z filtra. */
function recItems(r: OweRec, f: OweFilter, meta: Record<string, ItemMeta>): string[] {
  return r.items.filter((i) => meta[i] && (!f.topic || meta[i].topic === f.topic) && (!f.kind || meta[i].kind === f.kind));
}

export function coverage(recs: OweRec[], f: OweFilter, meta: Record<string, ItemMeta>, window: RepeatWindow = "all", edMin = 21): Coverage {
  // historia liczona z tych samych typów i etapów pytań, ale ze wszystkich edycji
  const base = recs.filter((r) => (f.type === "all" || r.t === f.type) && f.stages.includes(r.st));
  const byEd = new Map<number, { items: Set<string>; qs: string[][] }>();
  for (const r of base) {
    const its = recItems(r, f, meta);
    if (!its.length) continue;
    const e = byEd.get(r.ed) ?? { items: new Set<string>(), qs: [] };
    its.forEach((i) => e.items.add(i));
    e.qs.push(its);
    byEd.set(r.ed, e);
  }
  const seenIn = (i: string, from: number, to: number) => {
    const eds: number[] = [];
    for (let e = Math.max(from, edMin); e <= to; e++) if (byEd.get(e)?.items.has(i)) eds.push(e);
    return eds;
  };
  const rows: CoverageRow[] = [];
  const repeated = new Map<string, Set<number>>();
  const fresh: { id: string; ed: number }[] = [];
  for (let ed = f.edFrom; ed <= f.edTo; ed++) {
    const e = byEd.get(ed);
    if (!e) continue;
    const from = window === "all" ? edMin : ed - window;
    const isRep = (i: string) => seenIn(i, from, ed - 1).length > 0;
    let repeat = 0;
    for (const i of e.items) {
      if (isRep(i)) {
        repeat++;
        const s = repeated.get(i) ?? new Set<number>();
        seenIn(i, edMin, ed - 1).forEach((x) => s.add(x));
        repeated.set(i, s);
      } else if (!seenIn(i, edMin, ed - 1).length) fresh.push({ id: i, ed });
    }
    const qRepeat = e.qs.filter((its) => its.every(isRep)).length;
    rows.push({ ed, items: e.items.size, repeat, fresh: e.items.size - repeat, pct: pct(repeat, e.items.size), questions: e.qs.length, qRepeat });
  }
  const s = (k: "items" | "repeat" | "fresh" | "questions" | "qRepeat") => rows.reduce((a, r) => a + r[k], 0);
  return {
    rows,
    total: { items: s("items"), repeat: s("repeat"), fresh: s("fresh"), pct: pct(s("repeat"), s("items")), questions: s("questions"), qRepeat: s("qRepeat") },
    repeated: [...repeated].map(([id, eds]) => ({ id, earlier: eds.size, editions: [...eds].sort((a, b) => a - b) }))
      .sort((a, b) => b.earlier - a.earlier || (meta[a.id]?.title ?? "").localeCompare(meta[b.id]?.title ?? "", "pl")),
    fresh: fresh.sort((a, b) => a.ed - b.ed || (meta[a.id]?.title ?? "").localeCompare(meta[b.id]?.title ?? "", "pl")),
  };
}

/* ---------- opanowanie (fiszki, moje statystyki) ---------- */

export type Level = "good" | "mid" | "weak" | "none";
export const LEVELS: { id: Level; label: string }[] = [
  { id: "good", label: "dobrze (≥ 80%)" },
  { id: "mid", label: "średnio (50–79%)" },
  { id: "weak", label: "słabo (< 50%)" },
  { id: "none", label: "jeszcze nie sprawdzone" },
];

/** Kolor opanowania: zielony ≥ 80%, żółty 50–79%, czerwony < 50%; poniżej 2 odpowiedzi – brak oceny. */
export function level(correct: number, total: number): Level {
  if (total < 2) return "none";
  const p = correct / total;
  return p >= 0.8 ? "good" : p >= 0.5 ? "mid" : "weak";
}
