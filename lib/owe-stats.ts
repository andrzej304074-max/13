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
  /** 1 – pytanie dotyczy hasła przewodniego swojej edycji. */
  th?: 1;
  /** 1 – pytanie obliczeniowe (trzeba policzyć ze wzoru): w filtrze rodzaju liczy się jako „wzór”, nie „pojęcie”. */
  calc?: 1;
}

export type ThemeFilter = "all" | "yes" | "no";

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
  /** Hasło przewodnie: wszystkie pytania, tylko z hasła swojej edycji albo bez niego. */
  theme: ThemeFilter;
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
    && kindOk(r, f.kind, meta)
    && themeOk(r, f.theme));
}

/**
 * Filtr rodzaju hasła: pytanie pyta o hasło tego rodzaju. Pytania obliczeniowe (`calc`) należą do „wzorów”
 * (także gdy reguła nie wskazała konkretnego hasła-wzoru) i nie liczą się jako pytania o „pojęcia”.
 */
export function kindOk(r: Pick<OweRec, "items" | "calc">, kind: string | null | undefined, meta: Record<string, ItemMeta>): boolean {
  if (!kind) return true;
  if (kind === "wzor" && r.calc === 1) return true;
  if (kind === "pojecie" && r.calc === 1) return false;
  return r.items.some((i) => meta[i]?.kind === kind);
}

/** Filtr hasła przewodniego (brak pola – jak „wszystkie”). */
export const themeOk = (r: Pick<OweRec, "th">, t: ThemeFilter | undefined) => !t || t === "all" || (t === "yes") === (r.th === 1);

/** Udział pytań z hasła przewodniego w każdej edycji (po pozostałych filtrach, bez filtra hasła). */
export function themeShares(recs: OweRec[]) {
  const c = new Map<number, { n: number; th: number }>();
  for (const r of recs) {
    const e = c.get(r.ed) ?? { n: 0, th: 0 };
    e.n++;
    if (r.th === 1) e.th++;
    c.set(r.ed, e);
  }
  const rows = [...c].sort((a, b) => a[0] - b[0]).map(([ed, e]) => ({ ed, n: e.n, th: e.th, pct: pct(e.th, e.n) }));
  const n = rows.reduce((s, r) => s + r.n, 0), th = rows.reduce((s, r) => s + r.th, 0);
  return { rows, total: { n, th, pct: pct(th, n) } };
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

export const DEFAULT_FILTER: OweFilter = { type: "all", stages: ["s", "o", "c"], edFrom: 21, edTo: 39, topic: null, kind: null, theme: "all", order: "desc" };

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
    theme: p.get("haslo") === "tak" ? "yes" : p.get("haslo") === "nie" ? "no" : "all",
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
  if (f.theme !== "all") p.set("haslo", f.theme === "yes" ? "tak" : "nie");
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
  /** 1 – pytanie obliczeniowe (jak w OweRec). */
  calc?: 1;
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

/** Skąd liczyć powtórki: etapy historii, okno edycji i czy wcześniejsze etapy tej samej edycji też się liczą. */
export interface RepeatOpts {
  window: RepeatWindow;
  from: Stage[];
  sameEdition: boolean;
}
export const DEFAULT_REPEAT: RepeatOpts = { window: "all", from: ["s", "o", "c"], sameEdition: false };
const STAGE_NO: Record<Stage, number> = { s: 0, o: 1, c: 2 };

/**
 * Pokrycie: pytania z etapów `f.stages` (badane) i historia z etapów `o.from` (źródło powtórek).
 * Pojęcie jest powtórką, gdy pytano o nie w etapie źródłowym wcześniejszej edycji (w oknie) albo – przy `sameEdition` –
 * we wcześniejszym etapie tej samej edycji (szkolny → okręgowy → centralny).
 */
export function coverage(recs: OweRec[], f: OweFilter, meta: Record<string, ItemMeta>, o: Partial<RepeatOpts> = {}, edMin = 21): Coverage {
  const { window, from, sameEdition } = { ...DEFAULT_REPEAT, ...o };
  const typed = recs.filter((r) => f.type === "all" || r.t === f.type);
  // historia: pojęcie → wystąpienia (edycja, etap) w etapach źródłowych
  const hist = new Map<string, { ed: number; st: number }[]>();
  for (const r of typed) {
    if (!from.includes(r.st)) continue;
    for (const i of recItems(r, f, meta)) {
      const l = hist.get(i);
      if (l) l.push({ ed: r.ed, st: STAGE_NO[r.st] }); else hist.set(i, [{ ed: r.ed, st: STAGE_NO[r.st] }]);
    }
  }
  const isRep = (i: string, ed: number, st: number) => {
    const lo = window === "all" ? edMin : ed - window;
    return (hist.get(i) ?? []).some((h) => (h.ed < ed && h.ed >= lo) || (sameEdition && h.ed === ed && h.st < st));
  };
  const earlierEds = (i: string, ed: number) => [...new Set((hist.get(i) ?? []).filter((h) => h.ed < ed).map((h) => h.ed))];
  // badane pytania: pojęcie edycji liczone raz, w najwcześniejszym etapie, w którym o nie pytano
  const byEd = new Map<number, { first: Map<string, number>; qs: { its: string[]; st: number }[] }>();
  for (const r of typed) {
    if (!f.stages.includes(r.st) || r.ed < f.edFrom || r.ed > f.edTo || !themeOk(r, f.theme)) continue;
    const its = recItems(r, f, meta);
    if (!its.length) continue;
    const e = byEd.get(r.ed) ?? { first: new Map<string, number>(), qs: [] };
    const st = STAGE_NO[r.st];
    for (const i of its) e.first.set(i, Math.min(e.first.get(i) ?? 9, st));
    e.qs.push({ its, st });
    byEd.set(r.ed, e);
  }
  const rows: CoverageRow[] = [];
  const repeated = new Map<string, Set<number>>();
  const fresh: { id: string; ed: number }[] = [];
  for (const ed of [...byEd.keys()].sort((a, b) => a - b)) {
    const e = byEd.get(ed)!;
    let repeat = 0;
    for (const [i, st] of e.first) {
      if (isRep(i, ed, st)) {
        repeat++;
        const s = repeated.get(i) ?? new Set<number>();
        earlierEds(i, ed).forEach((x) => s.add(x));
        repeated.set(i, s);
      } else fresh.push({ id: i, ed });
    }
    const qRepeat = e.qs.filter((q) => q.its.every((i) => isRep(i, ed, q.st))).length;
    rows.push({ ed, items: e.first.size, repeat, fresh: e.first.size - repeat, pct: pct(repeat, e.first.size), questions: e.qs.length, qRepeat });
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

/** Wszystkie pary etapów: wiersz – etap badanych pytań, kolumna – etap(y) źródłowe powtórek („all” – wszystkie trzy). */
export type MatrixCol = Stage | "all";
export interface MatrixCell { items: number; repeat: number; pct: number; questions: number; qRepeat: number; qPct: number }
export function stageMatrix(recs: OweRec[], f: OweFilter, meta: Record<string, ItemMeta>, o: Partial<RepeatOpts> = {}) {
  const cols: MatrixCol[] = ["s", "o", "c", "all"];
  return (["s", "o", "c"] as Stage[]).map((st) => ({
    st,
    cells: cols.map((col) => {
      const t = coverage(recs, { ...f, stages: [st] }, meta, { ...o, from: col === "all" ? ["s", "o", "c"] : [col] }).total;
      return { col, items: t.items, repeat: t.repeat, pct: t.pct, questions: t.questions, qRepeat: t.qRepeat, qPct: pct(t.qRepeat, t.questions) } as MatrixCell & { col: MatrixCol };
    }),
  }));
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

/* ---------- eseje i zadania (bez pytań testowych) ---------- */

export interface OpenRec { id: string; kind: "esej" | "zadanie"; ed: number; st: Stage; topic: string; th: boolean; title: string }

/** Eseje i zadania po filtrach etapu, edycji, działu i hasła: wiersze na edycję i na dział, z liczbą „z hasła”. */
export function openStats(open: OpenRec[], f: OweFilter) {
  const list = open.filter((o) => f.stages.includes(o.st) && o.ed >= f.edFrom && o.ed <= f.edTo
    && (!f.topic || o.topic === f.topic) && themeOk({ th: o.th ? 1 : undefined }, f.theme));
  const tally = <K extends string | number>(key: (o: OpenRec) => K) => {
    const m = new Map<K, { essays: number; tasks: number; th: number }>();
    for (const o of list) {
      const e = m.get(key(o)) ?? { essays: 0, tasks: 0, th: 0 };
      if (o.kind === "esej") e.essays++; else e.tasks++;
      if (o.th) e.th++;
      m.set(key(o), e);
    }
    return m;
  };
  const eds = [...tally((o) => o.ed)].sort((a, b) => a[0] - b[0])
    .map(([ed, e]) => ({ ed, ...e, n: e.essays + e.tasks, pct: pct(e.th, e.essays + e.tasks) }));
  const topics = [...tally((o) => o.topic)].map(([topic, e]) => ({ topic, ...e, n: e.essays + e.tasks, pct: pct(e.th, e.essays + e.tasks) }))
    .sort((a, b) => (b.n - a.n) * (f.order === "asc" ? -1 : 1) || a.topic.localeCompare(b.topic));
  const th = list.filter((o) => o.th).length;
  return { list, eds, topics, total: { n: list.length, essays: list.filter((o) => o.kind === "esej").length, tasks: list.filter((o) => o.kind === "zadanie").length, th, pct: pct(th, list.length) } };
}
