/**
 * Moje statystyki wg działów, zagadnień i pojęć (strona /stats → „Działy i pojęcia”) – agregacja bez bazy danych,
 * osobno dla pytań OWE i słownikowych. Dokładność pytania jak w statystykach testów: jednokrotny 0/1,
 * wielokrotny – trafne pola / 4, pominięte 0.
 */
import type { ItemMeta, OweRec, SlRec, Stage } from "./owe-stats";

export type Range = "7d" | "30d" | "all";
export type Sort = "weak" | "strong" | "count";

export interface MyAnswer { q: string; acc: number; at: number }

export interface MyFilter {
  type: "all" | "single" | "multi";
  range: Range;
  sort: Sort;
  topic: string | null;
  kind: string | null;
  /** Tylko OWE: etapy i zakres edycji. */
  stages: Stage[];
  edFrom: number;
  edTo: number;
  /** Tylko słownik: pochodzenie pytań i dział słownika. */
  origin: "a" | "m" | null;
  sec: number | null;
}

export const DEFAULT_MY_FILTER: MyFilter = {
  type: "all", range: "all", sort: "weak", topic: null, kind: null, stages: ["s", "o", "c"], edFrom: 21, edTo: 39, origin: null, sec: null,
};

export interface MyRow {
  id: string;
  answers: number;
  /** Suma dokładności (w wielokrotnym ułamki). */
  correct: number;
  percent: number;
  /** Skuteczność w ostatnich 30 dniach (null – brak odpowiedzi). */
  recent: number | null;
  /** Zmiana: ostatnie 10 odpowiedzi względem wcześniejszych (null – za mało danych). */
  trend: number | null;
  last: number;
}

export interface MyStats {
  total: MyRow;
  topics: MyRow[];
  units: MyRow[];
  items: MyRow[];
  /** Ostatnie odpowiedzi (do 8) na pytania o dane pojęcie. */
  itemAnswers: Record<string, MyAnswer[]>;
}

/** Wspólne pola rekordów pytań OWE i słownikowych (pola jednej bazy są w drugiej puste). */
type Rec = Pick<OweRec, "id" | "t" | "items"> & { topic: string | null; unit: string | null; ed?: number; st?: Stage; o?: SlRec["o"]; sec?: number | null };
const DAY = 86400000;
const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 1000) / 10 : 0);

function row(id: string, list: MyAnswer[], now: number): MyRow {
  const c = list.reduce((s, a) => s + a.acc, 0);
  const rec = list.filter((a) => a.at > now - 30 * DAY);
  const last10 = list.slice(-10), before = list.slice(0, -10);
  return {
    id,
    answers: list.length,
    correct: Math.round(c * 100) / 100,
    percent: pct(c, list.length),
    recent: rec.length ? pct(rec.reduce((s, a) => s + a.acc, 0), rec.length) : null,
    trend: list.length >= 12 && before.length >= 2
      ? Math.round((pct(last10.reduce((s, a) => s + a.acc, 0), last10.length) - pct(before.reduce((s, a) => s + a.acc, 0), before.length)) * 10) / 10
      : null,
    last: list.length ? list[list.length - 1].at : 0,
  };
}

function sortRows(rows: MyRow[], sort: Sort) {
  return rows.sort((a, b) =>
    sort === "count" ? b.answers - a.answers || a.percent - b.percent
      : sort === "strong" ? b.percent - a.percent || b.answers - a.answers
        : a.percent - b.percent || b.answers - a.answers);
}

/** @param answers – odpowiedzi użytkownika w kolejności czasu. */
export function aggregate(answers: MyAnswer[], recs: readonly Rec[], meta: Record<string, ItemMeta>, f: MyFilter, now = Date.now()): MyStats {
  const byId = new Map(recs.map((r) => [r.id, r]));
  const since = f.range === "7d" ? now - 7 * DAY : f.range === "30d" ? now - 30 * DAY : -Infinity;
  const okItem = (i: string) => meta[i] && (!f.topic || meta[i].topic === f.topic) && (!f.kind || meta[i].kind === f.kind);
  const all: MyAnswer[] = [];
  const by = { topics: new Map<string, MyAnswer[]>(), units: new Map<string, MyAnswer[]>(), items: new Map<string, MyAnswer[]>() };
  const push = (m: Map<string, MyAnswer[]>, k: string, a: MyAnswer) => { const l = m.get(k); if (l) l.push(a); else m.set(k, [a]); };
  for (const a of answers) {
    const r = byId.get(a.q);
    if (!r || a.at < since) continue;
    if (f.type !== "all" && r.t !== f.type) continue;
    if (r.ed !== undefined && (!f.stages.includes(r.st as Stage) || r.ed < f.edFrom || r.ed > f.edTo)) continue;
    if (r.o !== undefined && ((f.origin && r.o !== f.origin) || (f.sec && r.sec !== f.sec))) continue;
    if (f.kind && !r.items.some((i) => meta[i]?.kind === f.kind)) continue;
    // dział i zagadnienie – według przydziału pytania; filtr działu zawęża zagadnienia i pojęcia (jak w statystykach OWE)
    if (r.topic) push(by.topics, r.topic, a);
    if (f.topic && r.topic !== f.topic && !r.items.some(okItem)) continue;
    all.push(a);
    if (r.unit && (!f.topic || r.topic === f.topic)) push(by.units, r.unit, a);
    for (const i of r.items) if (okItem(i)) push(by.items, i, a);
  }
  const rows = (m: Map<string, MyAnswer[]>) => sortRows([...m].map(([k, l]) => row(k, l, now)), f.sort);
  return {
    total: row("all", all, now),
    topics: rows(by.topics),
    units: rows(by.units),
    items: rows(by.items),
    itemAnswers: Object.fromEntries([...by.items].map(([k, l]) => [k, l.slice(-8).reverse()])),
  };
}

/** Filtry ↔ parametry adresu (wspólne nazwy z filtrami statystyk OWE: typ, etap, od, do, dzial, rodzaj). */
export function myFilterFromParams(p: URLSearchParams): MyFilter {
  const st = (p.get("etap") ?? "").split("").filter((s): s is Stage => s === "s" || s === "o" || s === "c");
  const num = (k: string, d: number, lo: number, hi: number) => {
    const v = Number(p.get(k));
    return Number.isInteger(v) && v >= lo && v <= hi && p.get(k) !== null ? v : d;
  };
  const typ = p.get("typ"), okres = p.get("okres"), sort = p.get("sort"), poch = p.get("poch");
  const edFrom = num("od", 21, 21, 39), edTo = num("do", 39, 21, 39);
  return {
    type: typ === "single" || typ === "multi" ? typ : "all",
    range: okres === "7d" || okres === "30d" ? okres : "all",
    sort: sort === "strong" || sort === "count" ? sort : "weak",
    topic: p.get("dzial") || null,
    kind: p.get("rodzaj") || null,
    stages: st.length ? [...new Set(st)] : ["s", "o", "c"],
    edFrom: Math.min(edFrom, edTo),
    edTo: Math.max(edFrom, edTo),
    origin: poch === "a" || poch === "m" ? poch : null,
    sec: num("sekcja", 0, 1, 99) || null,
  };
}

export function myFilterToParams(f: MyFilter): string {
  const p = new URLSearchParams();
  if (f.type !== "all") p.set("typ", f.type);
  if (f.range !== "all") p.set("okres", f.range);
  if (f.sort !== "weak") p.set("sort", f.sort);
  if (f.topic) p.set("dzial", f.topic);
  if (f.kind) p.set("rodzaj", f.kind);
  if (f.stages.length < 3) p.set("etap", f.stages.join(""));
  if (f.edFrom !== 21) p.set("od", String(f.edFrom));
  if (f.edTo !== 39) p.set("do", String(f.edTo));
  if (f.origin) p.set("poch", f.origin);
  if (f.sec) p.set("sekcja", String(f.sec));
  return p.toString();
}
