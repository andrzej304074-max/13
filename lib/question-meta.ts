import { AI_STATS, COURSE, OWE_STATS, SLOWNIK_STATS } from "@/data/nauka";
import { kindOk, themeOk, type ItemMeta, type ThemeFilter } from "./owe-stats";

/**
 * Opis każdego pytania do filtrów testów (wszystkie banki): źródło, edycja i etap (Archiwum OWE), dział (temat kursu),
 * pojęcia, pytanie obliczeniowe, hasło przewodnie. Dane: data/nauka/{owe,slownik,ai}-stats.json (build_course.py).
 */

import { SOURCES, isSource, type QSource } from "./question-source";
export { SOURCES, isSource, type QSource };

/** Dział Słownika z pytaniami o hasło przewodnie bieżącej edycji (XL – „Gospodarka wobec wyzwań demograficznych”). */
export const THEME_SECTION = 15;

/** Etap zawodów w Archiwum: szkolny, okręgowy, centralny. */
export type OweStage = "s" | "o" | "c";
export const isOweStage = (v: unknown): v is OweStage => v === "s" || v === "o" || v === "c";

export interface QMeta {
  src: QSource;
  ed?: number;
  st?: OweStage;
  topic: string | null;
  items: string[];
  calc?: 1;
  th?: 1;
}

/** Filtry pytań wspólne dla zakładek testów (pola puste/nieobecne – bez ograniczenia). */
export interface MetaFilter {
  sources?: QSource[] | null;
  /** Zakres edycji i etapy – dotyczą tylko pytań z Archiwum OWE. */
  edFrom?: number | null;
  edTo?: number | null;
  stages?: OweStage[] | null;
  topic?: string | null;
  kind?: string | null;
  theme?: ThemeFilter | null;
}

let cache: { meta: Map<string, QMeta>; items: Record<string, ItemMeta> } | null = null;

function load() {
  if (cache) return cache;
  const meta = new Map<string, QMeta>();
  for (const r of OWE_STATS) meta.set(r.id, { src: "owe", ed: r.ed, st: r.st, topic: r.topic, items: r.items, calc: r.calc, th: r.th });
  // Słownik: dział hasła przewodniego (15 – XL edycja) i pytania o hasła tematu demografii dotyczą hasła przewodniego
  for (const r of SLOWNIK_STATS) {
    meta.set(r.id, { src: "slownik", topic: r.topic, items: r.items, calc: r.calc, th: r.sec === THEME_SECTION || r.topic === "demografia" ? 1 : undefined });
  }
  for (const r of AI_STATS) meta.set(r.id, { src: "ai", topic: r.topic, items: r.items, calc: r.calc, th: r.th });
  const items: Record<string, ItemMeta> = {};
  for (const [id, it] of Object.entries(COURSE.items)) items[id] = { title: it.t, kind: it.kind, topic: it.topic };
  cache = { meta, items };
  return cache;
}

export const questionMeta = (id: string): QMeta | undefined => load().meta.get(id);

/** Czy pytanie spełnia filtry (pytanie bez opisu – tylko gdy filtry nie zawężają działu, rodzaju ani hasła). */
export function metaOk(id: string, f: MetaFilter): boolean {
  const { meta, items } = load();
  const m = meta.get(id);
  if (!m) return !f.topic && !f.kind && (!f.theme || f.theme === "all");
  if (f.sources?.length && !f.sources.includes(m.src)) return false;
  if (m.src === "owe") {
    if (f.edFrom && (m.ed ?? 0) < f.edFrom) return false;
    if (f.edTo && (m.ed ?? 0) > f.edTo) return false;
    if (f.stages?.length && !f.stages.includes(m.st as OweStage)) return false;
  }
  if (f.topic && m.topic !== f.topic && !m.items.some((i) => items[i]?.topic === f.topic)) return false;
  return kindOk(m, f.kind, items) && themeOk(m, f.theme ?? "all");
}

/** Tematy kursu (działy) do filtra. */
export const TOPICS = () => COURSE.topics.map(({ id, title }) => ({ id, name: title }));
/** Rodzaje haseł do filtra. */
export const KINDS = () => COURSE.kinds.filter((k) => k.id !== "zrozumienie");

const ED_MIN = 21, ED_MAX = 39;

/**
 * Filtr z danych klienta (formularz testu, zapisane preferencje): tylko znane wartości, poza tym pola puste.
 * Błędny typ pola → wyjątek z komunikatem dla użytkownika.
 */
export function parseMetaFilter(o: Record<string, unknown>): MetaFilter {
  const f: MetaFilter = {};
  if (o.sources != null) {
    if (!Array.isArray(o.sources) || !o.sources.every(isSource)) throw new Error("Nieznane źródło pytań.");
    f.sources = SOURCES.map((s) => s.id).filter((s) => (o.sources as string[]).includes(s));
  }
  if (o.stages != null) {
    if (!Array.isArray(o.stages) || !o.stages.every(isOweStage)) throw new Error("Nieznany etap zawodów.");
    f.stages = (["s", "o", "c"] as const).filter((s) => (o.stages as string[]).includes(s));
  }
  for (const k of ["edFrom", "edTo"] as const) {
    if (o[k] == null) continue;
    if (!Number.isInteger(o[k]) || (o[k] as number) < ED_MIN || (o[k] as number) > ED_MAX) throw new Error("Nieprawidłowy zakres edycji.");
    f[k] = o[k] as number;
  }
  if (f.edFrom && f.edTo && f.edFrom > f.edTo) throw new Error("Nieprawidłowy zakres edycji.");
  if (o.topic != null) {
    if (typeof o.topic !== "string" || !COURSE.topics.some((t) => t.id === o.topic)) throw new Error("Nieznany dział.");
    f.topic = o.topic;
  }
  if (o.kind != null) {
    if (typeof o.kind !== "string" || !KINDS().some((k) => k.id === o.kind)) throw new Error("Nieznany rodzaj haseł.");
    f.kind = o.kind;
  }
  if (o.theme != null) {
    if (o.theme !== "all" && o.theme !== "yes" && o.theme !== "no") throw new Error("Nieznany filtr hasła przewodniego.");
    f.theme = o.theme;
  }
  return f;
}
